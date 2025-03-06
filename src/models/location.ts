import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema({
  house_building_number: { type: String },
  street_name: { type: String },
  purok_block_lot: { type: String },
  barangay: { type: String, },
  municipality_city: { type: String, },
  province: { type: String, },
  zip_code: { type: String },
  region: { type: String, },
  latitude: { type: Number, },
  longitude: { type: Number, },
});

export default mongoose.models.Location || mongoose.model("Location", LocationSchema, "locations");
