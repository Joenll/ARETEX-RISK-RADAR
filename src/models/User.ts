import mongoose, { Schema, Document, models, Model, Types } from "mongoose";

// Define possible statuses for user accounts
export type UserStatus = "pending" | "approved" | "rejected";

// Interface representing a User document in MongoDB.
export interface IUser extends Document {
  email: string;
  password?: string;
  googleId?: string; // For Google Sign-In
  role: "admin" | "user";
  profile?: Types.ObjectId; // Linked UserProfile
  profileComplete: boolean; // Whether the profile is complete
  status: UserStatus; // Account status
  createdAt: Date;
  updatedAt: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  name?: string; // Optional name field for convenience
}

// Schema corresponding to the User document interface.
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
    },
    password: {
      type: String,
      select: false, // Password won't be returned by default in queries
    },
    googleId: {
      type: String,
      unique: true, // Ensure uniqueness for Google Sign-In
      sparse: true, // Allows null values for non-Google users
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      required: true,
      default: "user",
    },
    profile: {
      type: Schema.Types.ObjectId,
      ref: "UserProfile",
    },
    profileComplete: {
      type: Boolean,
      default: false, // Default to false for new users
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending", // Default status is pending
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
    name: {
      type: String, // Optional name field for convenience
      trim: true,
    },
    // --- Explicitly define createdAt with a default ---
    // Although timestamps: true should handle this, we add a default
    // as a workaround for the adapter's initial creation issue.
    createdAt: {
      type: Date,
      default: Date.now, // Set default value to the current time
      // immutable: true, // Optional: prevent future updates to createdAt
    },
    // --- updatedAt will still be handled by timestamps: true ---
  },
  {
    timestamps: true, // Keep this - it handles updatedAt and potentially createdAt on updates
  }
);

// --- Mongoose Pre-Save Hook (Commented Out for Testing) ---
// UserSchema.pre<IUser>("save", function (next) {
//   // ... hook logic ...
//   next();
// });
// --- END: Pre-Save Hook ---


// Prevent recompilation of the model if it already exists
const User: Model<IUser> = models.User || mongoose.model<IUser>("User", UserSchema, "users");

export default User;
