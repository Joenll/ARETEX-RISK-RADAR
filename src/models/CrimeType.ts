import mongoose from "mongoose";

const CrimeTypeSchema = new mongoose.Schema({
  crime_type: { type: String, required: true, unique: true },
  crime_type_category: { type: String, required: true },
});

// Check if the model already exists using the model name
const CrimeType = mongoose.models.CrimeType || mongoose.model("CrimeType", CrimeTypeSchema, "crime_types");

export default CrimeType;
