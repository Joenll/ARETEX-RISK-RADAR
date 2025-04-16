// src/models/UserProfile.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';

// Define possible values for sex
export type UserSex = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

// Interface representing an Employee Profile document in MongoDB.
export interface IUserProfile extends Document {
  user: mongoose.Schema.Types.ObjectId; // Reference to User model
  employeeNumber: string; // Renamed from badgeNumber
  workPosition: string;   // Renamed from rank (e.g., "IT-Developer")
  firstName: string;
  lastName: string;
  birthdate: Date;
  sex: UserSex;
  team: string;           // Renamed from department (e.g., "Development Team")
  createdAt: Date;        // Timestamps added by schema option
  updatedAt: Date;        // Timestamps added by schema option
}

// Schema corresponding to the UserProfile document interface.
const UserProfileSchema = new Schema<IUserProfile>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference the 'User' model
      required: true,
      unique: true, // A user should only have one profile
    },
    // Renamed from badgeNumber
    employeeNumber: { type: String, required: true, trim: true },
    // Renamed from rank
    workPosition: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    birthdate: { type: Date, required: true },
    sex: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'], // Define allowed values
      required: [true, 'Sex/Gender is required'],
    },
    // Renamed from department
    team: { type: String, required: true, trim: true },
  },
  {
    // Add timestamps for createdAt and updatedAt automatically
    timestamps: true,
  }
);

// Prevent recompilation of the model if it already exists
const UserProfile: Model<IUserProfile> =
  models.UserProfile ||
  mongoose.model<IUserProfile>('UserProfile', UserProfileSchema, 'user_profiles');

export default UserProfile;
