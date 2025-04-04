import mongoose from "mongoose";

const CrimeReportSchema = new mongoose.Schema(
  {
    crime_id: { type: String, required: true, unique: true },
    date: { type: Date, required: true }, // Combines Day, Month, Year
    time: { type: String, required: true },
    day_of_week: { type: String, required: true },

    location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true }, //  References Location
    crime_type: { type: mongoose.Schema.Types.ObjectId, ref: "CrimeType", required: true }, //  References CrimeType

    case_status: { type: String, enum: ["Ongoing", "Resolved", "Pending"]},
    event_proximity: { type: String },

    crime_occurred_indoors_or_outdoors: { type: String, enum: ["Indoors", "Outdoors"]},
  },
  { timestamps: true }
);

// Check if the model already exists using the model name
const CrimeReport = mongoose.models.crime || mongoose.model("crime", CrimeReportSchema, "crime_records");

export default CrimeReport;
