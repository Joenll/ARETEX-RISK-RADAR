import mongoose from "mongoose";
import { unique } from "next/dist/build/utils";

const UserSchema = new mongoose.Schema({

    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Admin", "User"], required: true },
    profile: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile", required: true }, //  References user_profiles

},  {timestamps: true}
);

export default mongoose.models.User || mongoose.model("User",UserSchema, "users");