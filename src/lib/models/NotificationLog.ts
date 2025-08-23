import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationLog extends Document {
  notificationId: string;
  userId: string;
  userEmail: string;
  userName: string;
  notificationType: 'missing_timesheet' | 'deadline_reminder' | 'urgent_reminder';
  missingDates: Date[];
  daysRemaining: number;
  sentAt: Date;
  emailSent: boolean;
  emailError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationLogSchema: Schema = new Schema(
  {
    notificationId: {
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
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      lowercase: true,
      trim: true,
    },
    userName: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    notificationType: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: ['missing_timesheet', 'deadline_reminder', 'urgent_reminder'],
        message: 'Notification type must be one of: missing_timesheet, deadline_reminder, urgent_reminder',
      },
    },
    missingDates: {
      type: [Date],
      required: [true, 'Missing dates are required'],
      validate: {
        validator: function(dates: Date[]) {
          return dates && dates.length > 0;
        },
        message: 'At least one missing date must be specified',
      },
    },
    daysRemaining: {
      type: Number,
      required: [true, 'Days remaining is required'],
      min: [0, 'Days remaining cannot be negative'],
      max: [6, 'Days remaining cannot exceed 6'],
    },
    sentAt: {
      type: Date,
      required: [true, 'Sent at date is required'],
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailError: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
NotificationLogSchema.index({ userId: 1, sentAt: -1 });
NotificationLogSchema.index({ userEmail: 1, notificationType: 1 });
NotificationLogSchema.index({ sentAt: -1 });
NotificationLogSchema.index({ createdAt: -1 });

// Compound index to prevent duplicate notifications for the same user and dates
NotificationLogSchema.index({ 
  userId: 1, 
  notificationType: 1, 
  'missingDates': 1,
  sentAt: 1 
}, { 
  unique: false // Allow multiple notifications but we'll check manually to avoid spam
});

// Static method to check if notification was already sent today for the same missing dates
NotificationLogSchema.statics.wasNotificationSentToday = async function(
  userId: string, 
  notificationType: string, 
  missingDates: Date[]
): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Convert dates to strings for comparison
  const missingDatesStrings = missingDates.map(date => date.toISOString().split('T')[0]);

  const existingNotification = await this.findOne({
    userId,
    notificationType,
    sentAt: { $gte: startOfDay, $lte: endOfDay },
  });

  if (!existingNotification) {
    return false;
  }

  // Check if the missing dates are the same
  const existingDatesStrings = existingNotification.missingDates.map((date: Date) => 
    date.toISOString().split('T')[0]
  );

  // If arrays have different lengths, they're different
  if (missingDatesStrings.length !== existingDatesStrings.length) {
    return false;
  }

  // Check if all dates match
  const allDatesMatch = missingDatesStrings.every(date => 
    existingDatesStrings.includes(date)
  );

  return allDatesMatch;
};

// Method to create a notification log entry
NotificationLogSchema.statics.createNotification = async function(data: {
  userId: string;
  userEmail: string;
  userName: string;
  notificationType: string;
  missingDates: Date[];
  daysRemaining: number;
  emailSent: boolean;
  emailError?: string;
}): Promise<INotificationLog> {
  const notification = new this({
    ...data,
    sentAt: new Date(),
  });

  return await notification.save();
};

export default mongoose.models.NotificationLog || mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);