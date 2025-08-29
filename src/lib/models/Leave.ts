import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeave extends Document {
  date: Date;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeaveModel extends Model<ILeave> {
  isLeaveDay(date: Date): Promise<boolean>;
  getLeaveDatesInRange(startDate: Date, endDate: Date): Promise<Date[]>;
}

const LeaveSchema: Schema = new Schema(
  {
    date: {
      type: Date,
      required: [true, 'Leave date is required'],
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    createdBy: {
      type: String,
      required: [true, 'Creator ID is required'],
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
LeaveSchema.index({ date: 1 });
LeaveSchema.index({ createdAt: -1 });

// Static method to check if a date is a leave day
LeaveSchema.statics.isLeaveDay = async function (date: Date): Promise<boolean> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const leaveRecord = await this.findOne({
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  return !!leaveRecord;
};

// Static method to get all leave dates in a date range
LeaveSchema.statics.getLeaveDatesInRange = async function (startDate: Date, endDate: Date): Promise<Date[]> {
  const leaveRecords = await this.find({
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: 1 });

  return leaveRecords.map((record: ILeave) => record.date);
};

export default (mongoose.models.Leave as ILeaveModel) || mongoose.model<ILeave, ILeaveModel>('Leave', LeaveSchema);