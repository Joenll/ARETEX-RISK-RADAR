// src/models/User.ts
import mongoose, { Schema, Document, models, Model, Types } from 'mongoose'; // Import 'Types'

// Define possible statuses for user accounts
export type UserStatus = 'pending' | 'approved' | 'rejected';

// Interface representing a User document in MongoDB.
export interface IUser extends Document {
  email: string;
  password?: string;
  role: 'admin' | 'user';
  profile: Types.ObjectId; // <-- Use mongoose.Types.ObjectId directly here
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
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
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      required: true,
      default: 'user',
    },
    profile: {
      type: Schema.Types.ObjectId, // <-- Keep Schema.Types.ObjectId for Mongoose schema definition
      ref: 'UserProfile',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent recompilation of the model if it already exists
const User: Model<IUser> = models.User || mongoose.model<IUser>('User', UserSchema, 'users');

export default User;
