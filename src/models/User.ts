import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  role: "admin" | "user"; // Ensuring only valid roles
  profile: mongoose.Schema.Types.ObjectId; // Reference to UserProfile
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "user"], required: true },
  profile: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile" }, // Linking to UserProfile
});

// Prevent overwriting the model if it already exists
const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema, "users");
export default User;
