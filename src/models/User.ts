// src/models/User.ts
import mongoose, { Schema, Document, models, Model, Types } from 'mongoose';

// Define possible statuses for user accounts
export type UserStatus = 'pending' | 'approved' | 'rejected';

// Interface representing a User document in MongoDB.
export interface IUser extends Document {
  email: string;
  password?: string;
  role: 'admin' | 'user';
  profile: Types.ObjectId; // Changed back to Types.ObjectId if that's correct for your setup
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

// Schema corresponding to the User document interface.
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    password: {
      type: String,
      // Password is not required for OAuth users initially
      // required: [true, 'Password is required'],
      select: false, // Password won't be returned by default in queries
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      required: true,
      default: 'user',
    },
    profile: {
      type: Schema.Types.ObjectId,
      ref: 'UserProfile',
      // Profile is linked later for OAuth users, so not strictly required here initially
      // required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending', // Default status is pending
      required: true,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// --- Mongoose Pre-Save Hook for Auto-Approval (WITH ENHANCED LOGGING) ---
UserSchema.pre<IUser>('save', function (next) {
  console.log(`[Pre-Save Hook] Running for user: ${this.email}, isNew: ${this.isNew}`); // Log entry and isNew status

  // Check only if the document is new (being created)
  if (this.isNew) {
    const autoApproveDomain = 'aretex@gmail.com'; // Correct domain
    console.log(`[Pre-Save Hook] Checking NEW user email: "${this.email}" against domain: "${autoApproveDomain}"`);

    // Check if email ends with the specified domain (case-insensitive)
    const emailToCheck = this.email?.toLowerCase() || ''; // Ensure email exists and is lowercase
    const endsWithDomain = emailToCheck.endsWith(autoApproveDomain);
    console.log(`[Pre-Save Hook] Does email end with domain? ${endsWithDomain}`); // Log the result of the check

    if (endsWithDomain) {
      console.log(`[Pre-Save Hook] MATCH FOUND! Setting status to 'approved' for ${this.email}`);
      this.status = 'approved'; // Set status to approved
      console.log(`[Pre-Save Hook] Status is now: ${this.status}`); // Confirm status change
    } else {
      console.log(`[Pre-Save Hook] Email does not match auto-approve domain. Status remains: ${this.status}`);
    }
  } else {
      console.log(`[Pre-Save Hook] Skipping status check for existing user.`);
  }

  console.log(`[Pre-Save Hook] Calling next() for ${this.email}`);
  next(); // Continue with the save operation
});
// --- END: Pre-Save Hook ---


// Prevent recompilation of the model if it already exists
const User: Model<IUser> = models.User || mongoose.model<IUser>('User', UserSchema, 'users');

export default User;
