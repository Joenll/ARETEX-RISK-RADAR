import mongoose from "mongoose";

const CrimeTypeSchema = new mongoose.Schema({
  crime_type: { type: String, required: true, unique: true },
  crime_type_category: { type: String, required: true },
});

export default mongoose.models.CrimeType || mongoose.model("CrimeType", CrimeTypeSchema, "crime_types");
