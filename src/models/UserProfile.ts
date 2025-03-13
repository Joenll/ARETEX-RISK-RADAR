import mongoose from "mongoose";
import { unique } from "next/dist/build/utils";

const UserProfileSchema = new mongoose.Schema({

     badgeNumber: { type: String, required: true, unique: true },
     rank: { type: String, required: true },
     first_name: { type: String, required: true },
     last_name: { type: String, required: true },
     birthDate: {type: Date, required: true},
     department: { type: String, required: true },


},  {timestamps: true}
);

export default mongoose.models.UserProfile || mongoose.model("User",UserProfileSchema, "user_profiles");