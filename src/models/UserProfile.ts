import mongoose, { Schema, Document } from "mongoose";

export interface IUserProfile extends Document {
  user: mongoose.Schema.Types.ObjectId; // Reference to User model
  badgeNumber: string;
  rank: string;
  firstName: string;
  lastName: string;
  birthdate: Date;
  department: string;
}

const UserProfileSchema = new Schema<IUserProfile>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  badgeNumber: { type: String, required: true },
  rank: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  birthdate: { type: Date, required: true },
  department: { type: String, required: true },
});

// Prevent overwriting the model if it already exists
const UserProfile =
  mongoose.models.UserProfile ||
  mongoose.model<IUserProfile>("UserProfile", UserProfileSchema, "user_profiles");

export default UserProfile;
