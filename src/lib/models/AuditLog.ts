import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  logId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'STATUS_CHANGE';
  entityType: 'User' | 'WorkLog' | 'System';
  entityId: string;
  performedBy: string; // userId of who performed the action
  performedByName: string;
  performedByRole: 'Admin' | 'User';
  details: {
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    additionalInfo?: string;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface IAuditLogModel extends Model<IAuditLog> {
  createLog(logData: {
    action: string;
    entityType: string;
    entityId: string;
    performedBy: string;
    performedByName: string;
    performedByRole: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    additionalInfo?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<IAuditLog | null>;
}

const AuditLogSchema: Schema = new Schema(
  {
    logId: {
      type: String,
      required: true,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    action: {
      type: String,
      required: true,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'STATUS_CHANGE'],
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ['User', 'WorkLog', 'System'],
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    performedBy: {
      type: String,
      required: true,
      index: true,
    },
    performedByName: {
      type: String,
      required: true,
    },
    performedByRole: {
      type: String,
      required: true,
      enum: ['Admin', 'User'],
    },
    details: {
      oldValues: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      newValues: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      additionalInfo: {
        type: String,
        default: null,
      },
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for better query performance
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ performedBy: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

// Method to create audit log entry
AuditLogSchema.statics.createLog = async function(logData: {
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  performedByName: string;
  performedByRole: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  additionalInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const auditLog = new this({
      ...logData,
      details: {
        oldValues: logData.oldValues || null,
        newValues: logData.newValues || null,
        additionalInfo: logData.additionalInfo || null,
      },
    });
    
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking main operations
    return null;
  }
};

export default (mongoose.models.AuditLog as IAuditLogModel) || mongoose.model<IAuditLog, IAuditLogModel>('AuditLog', AuditLogSchema);