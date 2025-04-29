import mongoose, { Schema, Document, models, Model } from "mongoose";

// Define possible values for sex
export type UserSex = "Male" | "Female";

// Interface representing a UserProfile document in MongoDB.
export interface IUserProfile extends Document {
  user: mongoose.Schema.Types.ObjectId; // Reference to User model
  employeeNumber: string; // Unique employee number
  workPosition: string; // Job position (e.g., "IT-Developer")
  firstName: string;
  lastName: string;
  birthdate: Date;
  sex: UserSex;
  team: string; // Team or department (e.g., "Development Team")
  createdAt: Date; // Timestamps added by schema option
  updatedAt: Date; // Timestamps added by schema option
}

// Schema corresponding to the UserProfile document interface.
const UserProfileSchema = new Schema<IUserProfile>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference the 'User' model
      required: true,
      unique: true, // A user should only have one profile
    },
    employeeNumber: {
      type: String,
      required: true,
      unique: true, // Ensure employee numbers are unique
      trim: true,
    },
    workPosition: {
      type: String,
      required: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    birthdate: {
      type: Date,
      required: true,
    },
    sex: {
      type: String,
      enum: ["Male", "Female"], // Expanded allowed values
      required: [true, "User sex is required"],
    },
    team: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    // Add timestamps for createdAt and updatedAt automatically
    timestamps: true,
  }
);

// Prevent recompilation of the model if it already exists
const UserProfile: Model<IUserProfile> =
  models.UserProfile ||
  mongoose.model<IUserProfile>("UserProfile", UserProfileSchema, "user_profiles");

export default UserProfile;