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
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);

// --- Mongoose Pre-Save Hook for Auto-Approval ---
UserSchema.pre<IUser>("save", function (next) {
  console.log(`[Pre-Save Hook] Running for user: ${this.email}, isNew: ${this.isNew}`);

  // Check only if the document is new (being created)
  if (this.isNew) {
    // --- Likely Correction Needed Here ---
    const autoApproveDomain = "aretex@gmail.com"; // Check for the domain suffix
    // --- End Correction ---

    console.log(`[Pre-Save Hook] Checking NEW user email: "${this.email}" against domain suffix: "${autoApproveDomain}"`);

    // Check if email ends with the specified domain (case-insensitive)
    const emailToCheck = this.email?.toLowerCase() || ""; // Ensure email exists and is lowercase
    const endsWithDomain = emailToCheck.endsWith(autoApproveDomain);
    console.log(`[Pre-Save Hook] Does email end with domain suffix? ${endsWithDomain}`);

    if (endsWithDomain) {
      console.log(`[Pre-Save Hook] MATCH FOUND! Setting status to 'approved' for ${this.email}`);
      this.status = "approved"; // Set status to approved
    } else {
      // Status defaults to 'pending' as defined in the schema, so no need to explicitly set it here
      console.log(`[Pre-Save Hook] Email does not match auto-approve domain suffix. Status remains default: ${this.status}`);
    }
  } else {
    console.log(`[Pre-Save Hook] Skipping status check for existing user.`);
  }

  next(); // Continue with the save operation
});
// --- END: Pre-Save Hook ---


// Prevent recompilation of the model if it already exists
const User: Model<IUser> = models.User || mongoose.model<IUser>("User", UserSchema, "users");

export default User;