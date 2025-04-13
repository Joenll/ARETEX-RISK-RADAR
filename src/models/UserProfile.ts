import mongoose, { Schema, Document, models, Model } from 'mongoose';

// Interface representing a UserProfile document in MongoDB.
export interface IUserProfile extends Document {
  user: mongoose.Schema.Types.ObjectId; // Reference to User model
  badgeNumber: string;
  rank: string;
  firstName: string;
  lastName: string;
  birthdate: Date;
  department: string;
  createdAt: Date; // Timestamps added by schema option
  updatedAt: Date; // Timestamps added by schema option
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
    badgeNumber: { type: String, required: true, trim: true }, // Added trim
    rank: { type: String, required: true, trim: true }, // Added trim
    firstName: { type: String, required: true, trim: true }, // Added trim
    lastName: { type: String, required: true, trim: true }, // Added trim
    birthdate: { type: Date, required: true },
    department: { type: String, required: true, trim: true }, // Added trim
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
