import mongoose, { Schema, Document } from 'mongoose';

export interface IPasswordResetToken extends Document {
  tokenId: string;
  userId: string;
  userEmail: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetTokenSchema: Schema = new Schema(
  {
    tokenId: {
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
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    token: {
      type: String,
      required: [true, 'Reset token is required'],
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true,
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
PasswordResetTokenSchema.index({ token: 1, used: 1 });
PasswordResetTokenSchema.index({ userId: 1, createdAt: -1 });
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired tokens

// Static method to create a new reset token
PasswordResetTokenSchema.statics.createResetToken = async function(userId: string, userEmail: string): Promise<IPasswordResetToken> {
  // Generate a secure random token
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  // Set expiry time (1 hour from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);
  
  // Invalidate any existing tokens for this user
  await this.updateMany(
    { userId, used: false },
    { used: true, usedAt: new Date() }
  );
  
  // Create new token
  const resetToken = new this({
    userId,
    userEmail,
    token,
    expiresAt,
    used: false,
  });
  
  return await resetToken.save();
};

// Static method to find and validate a reset token
PasswordResetTokenSchema.statics.findValidToken = async function(token: string): Promise<IPasswordResetToken | null> {
  const resetToken = await this.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() },
  });
  
  return resetToken;
};

// Method to mark token as used
PasswordResetTokenSchema.methods.markAsUsed = async function(): Promise<void> {
  this.used = true;
  this.usedAt = new Date();
  await this.save();
};

// Virtual to check if token is expired
PasswordResetTokenSchema.virtual('isExpired').get(function () {
  return new Date() > this.expiresAt;
});

// Virtual to check if token is valid
PasswordResetTokenSchema.virtual('isValid').get(function () {
  return !this.used && !this.isExpired;
});

// Ensure virtual fields are serialized
PasswordResetTokenSchema.set('toJSON', { virtuals: true });

export default mongoose.models.PasswordResetToken || mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);