import mongoose, { Schema, Document } from 'mongoose';

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
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    verticle: {
      type: String,
      required: [true, 'Verticle is required'],
      enum: {
        values: ['CMIS', 'TRI', 'LOF', 'TRG'],
        message: 'Verticle must be one of: CMIS, TRI, LOF, TRG',
      },
      index: true,
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
  
  // Check 2-day restriction for regular users
  const now = new Date();
  const createdAt = new Date(this.createdAt);
  const daysDifference = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysDifference <= 2;
};

// Virtual for calculating days since creation
WorkLogSchema.virtual('daysSinceCreation').get(function () {
  const now = new Date();
  const createdAt = new Date(this.createdAt as Date);
  return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for edit time remaining (for users)
WorkLogSchema.virtual('editTimeRemaining').get(function () {
  const daysSince = this.daysSinceCreation as number;
  return Math.max(0, 2 - daysSince);
});

// Ensure virtual fields are serialized
WorkLogSchema.set('toJSON', { virtuals: true });

export default mongoose.models.WorkLog || mongoose.model<IWorkLog>('WorkLog', WorkLogSchema);