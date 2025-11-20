import mongoose, { Schema, Document, Model } from 'mongoose';
import Leave from './Leave';
import fs from 'fs';
import path from 'path';

// Helper function to read system config
const readSystemConfig = () => {
  try {
    const configFilePath = path.join(process.cwd(), 'config/system-config.json');
    if (fs.existsSync(configFilePath)) {
      const data = fs.readFileSync(configFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading system config in WorkLog model:', error);
  }
  
  // Return default config if file doesn't exist or error occurs
  return {
    editTimeLimit: 3, // Default 3 days for backward compatibility
    allowPastDateEntry: true,
    allowFutureDate: false
  };
};

export interface IWorkLog extends Document {
  logId: string;
  userId: string;
  userName: string;          // Store user name for historical records
  userEmail: string;         // Store user email for historical records
  userRole: string;          // Store user role for historical records
  date: Date;
  verticle: string;          // Dynamic verticle from system config
  country: string;
  task: string;
  taskDescription: string;
  hours: number;             // Hours part (0-24)
  minutes: number;           // Minutes part (0-59)
  status: 'approved' | 'rejected'; // Entry status - approved by default, rejected when "deleted"
  createdAt: Date;
  updatedAt: Date;
  canEdit(currentUserId: string, currentUserRole: string): boolean;
}

export interface IWorkLogModel extends Model<IWorkLog> {
  validateSixDayWindow(recordDate: Date, userRole: string): { isValid: boolean; message?: string };
  validateLeaveDay(recordDate: Date, userRole: string): Promise<{ isValid: boolean; message?: string }>;
}

const WorkLogSchema: Schema = new Schema(
  {
    logId: {
      type: String,
      required: true,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      ref: 'User',
    },
    userName: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: [100, 'User name cannot exceed 100 characters'],
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      trim: true,
      lowercase: true,
      maxlength: [100, 'User email cannot exceed 100 characters'],
    },
    userRole: {
      type: String,
      required: [true, 'User role is required'],
      enum: {
        values: ['Admin', 'User'],
        message: 'User role must be either Admin or User',
      },
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    verticle: {
      type: String,
      required: [true, 'Verticle is required'],
      trim: true,
      maxlength: [50, 'Verticle name cannot exceed 50 characters'],
      // Removed enum to allow dynamic verticles from system config
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxlength: [100, 'Country name cannot exceed 100 characters'],
    },
    task: {
      type: String,
      required: [true, 'Task name is required'],
      trim: true,
      maxlength: [200, 'Task name cannot exceed 200 characters'],
    },
    taskDescription: {
      type: String,
      required: false, // Optional in DB for backward compatibility 
      default: '',
      trim: true,
      maxlength: [1000, 'Task description cannot exceed 1000 characters']
      // Remove validation here - we'll handle it in the API layer
    },
    hours: {
      type: Number,
      required: [true, 'Hours are required'],
      min: [0, 'Hours cannot be negative'],
      max: [24, 'Hours cannot exceed 24'],
      default: 0,
    },
    minutes: {
      type: Number,
      required: [true, 'Minutes are required'],
      min: [0, 'Minutes cannot be negative'],
      max: [59, 'Minutes cannot exceed 59'],
      default: 0,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['approved', 'rejected'],
        message: 'Status must be either approved or rejected',
      },
      default: 'approved',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
WorkLogSchema.index({ userId: 1, date: -1 });
WorkLogSchema.index({ createdAt: -1 });
WorkLogSchema.index({ verticle: 1, date: -1 });
WorkLogSchema.index({ userId: 1, createdAt: -1 });

// Virtual property to calculate decimal hours for calculations (backward compatibility)
WorkLogSchema.virtual('hoursSpent').get(function () {
  const hours = (this as any).hours || 0;
  const minutes = (this as any).minutes || 0;
  return Math.round((hours + (minutes / 60)) * 100) / 100;
});

// Helper function to validate time window for data entry (configurable)
WorkLogSchema.statics.validateSixDayWindow = function (recordDate: Date, userRole: string): { isValid: boolean; message?: string } {
  // Admin can create entries for any date
  if (userRole === 'Admin') {
    return { isValid: true };
  }
  
  // Get system config for edit time limit
  const systemConfig = readSystemConfig();
  const editTimeLimit = systemConfig.editTimeLimit || 3; // Default to 3 days
  
  const now = new Date();
  const limitDaysAgo = new Date();
  limitDaysAgo.setDate(now.getDate() - editTimeLimit);
  
  // Users can only create entries within the configurable rolling window
  if (recordDate < limitDaysAgo) {
    return {
      isValid: false,
      message: `You can only enter/edit data within the last ${editTimeLimit} days.`
    };
  }
  
  // Check future date restrictions from system config
  if (recordDate > now && !systemConfig.allowFutureDate) {
    return {
      isValid: false,
      message: 'You cannot create entries for future dates.'
    };
  }
  
  return { isValid: true };
};

// Helper function to validate that the date is not a leave day
WorkLogSchema.statics.validateLeaveDay = async function (recordDate: Date, userRole: string): Promise<{ isValid: boolean; message?: string }> {
  // Admin can create entries even on leave days (override capability)
  if (userRole === 'Admin') {
    return { isValid: true };
  }
  
  // Check if the date is a declared leave day
  const isLeave = await Leave.isLeaveDay(recordDate);
  if (isLeave) {
    return {
      isValid: false,
      message: 'Cannot create timesheet entries on company leave days. Contact admin if this entry is required.'
    };
  }
  
  return { isValid: true };
};

// Method to check if a work log can be edited
WorkLogSchema.methods.canEdit = function (currentUserId: string, currentUserRole: string): boolean {
  // Admin can always edit any entry
  if (currentUserRole === 'Admin') {
    return true;
  }
  
  // Users can only edit their own entries
  if (this.userId !== currentUserId) {
    return false;
  }
  
  // Check rolling window based on record date (uses system config)
  const systemConfig = readSystemConfig();
  const editTimeLimit = systemConfig.editTimeLimit || 3; // Default to 3 days
  const now = new Date();
  const recordDate = new Date(this.date);
  const daysDifference = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));

  // Rolling edit window: can edit if record date is within the configured time limit (including today)
  return daysDifference >= 0 && daysDifference <= editTimeLimit;
};

// Virtual for calculating days since record date
WorkLogSchema.virtual('daysSinceRecordDate').get(function () {
  const now = new Date();
  const recordDate = new Date(this.date as Date);
  return Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
});


// Ensure virtual fields are serialized
WorkLogSchema.set('toJSON', { virtuals: true });

export default (mongoose.models.WorkLog as IWorkLogModel) || mongoose.model<IWorkLog, IWorkLogModel>('WorkLog', WorkLogSchema);