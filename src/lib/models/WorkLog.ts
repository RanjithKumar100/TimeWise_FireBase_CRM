import mongoose, { Schema, Document, Model } from 'mongoose';
import Leave from './Leave';

export interface IWorkLog extends Document {
  logId: string;
  userId: string;
  date: Date;
  verticle: 'CMIS' | 'TRI' | 'LOF' | 'TRG';
  country: string;
  task: string;
  hoursSpent: number;
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
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    verticle: {
      type: String,
      required: [true, 'Verticle is required'],
      enum: {
        values: ['CMIS', 'TRI', 'LOF', 'TRG'],
        message: 'Verticle must be one of: CMIS, TRI, LOF, TRG',
      },
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxlength: [100, 'Country name cannot exceed 100 characters'],
    },
    task: {
      type: String,
      required: [true, 'Task description is required'],
      trim: true,
      maxlength: [500, 'Task description cannot exceed 500 characters'],
    },
    hoursSpent: {
      type: Number,
      required: [true, 'Hours spent is required'],
      min: [0.5, 'Minimum hours is 0.5'],
      max: [24, 'Maximum hours per entry is 24'],
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

// Helper function to validate 6-day window for data entry
WorkLogSchema.statics.validateSixDayWindow = function (recordDate: Date, userRole: string): { isValid: boolean; message?: string } {
  // Admin can create entries for any date
  if (userRole === 'Admin') {
    return { isValid: true };
  }
  
  const now = new Date();
  const sixDaysAgo = new Date();
  sixDaysAgo.setDate(now.getDate() - 6);
  
  // Users can only create entries within the rolling 6-day window
  if (recordDate < sixDaysAgo) {
    return {
      isValid: false,
      message: 'You can only enter/edit data within the last 6 days.'
    };
  }
  
  if (recordDate > now) {
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
  
  // Check rolling 6-day window based on record date
  const now = new Date();
  const recordDate = new Date(this.date);
  const daysDifference = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Rolling 6-day window: can edit if record date is within last 6 days (including today)
  return daysDifference >= 0 && daysDifference <= 6;
};

// Virtual for calculating days since record date
WorkLogSchema.virtual('daysSinceRecordDate').get(function () {
  const now = new Date();
  const recordDate = new Date(this.date as Date);
  return Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for edit time remaining (for users) - rolling 6-day window from record date
WorkLogSchema.virtual('editTimeRemaining').get(function () {
  const daysSince = this.daysSinceRecordDate as number;
  // Only return remaining days if within the valid window (0-6 days)
  if (daysSince >= 0 && daysSince <= 6) {
    return Math.max(0, 6 - daysSince);
  }
  return 0; // No time remaining if outside the window
});

// Ensure virtual fields are serialized
WorkLogSchema.set('toJSON', { virtuals: true });

export default (mongoose.models.WorkLog as IWorkLogModel) || mongoose.model<IWorkLog, IWorkLogModel>('WorkLog', WorkLogSchema);