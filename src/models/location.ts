import mongoose, { Schema } from "mongoose";

export interface ILocation {
  house_building_number?: string;
  street_name?: string;
  purok_block_lot?: string;
  barangay: string;
  municipality_city: string;
  province: string;
  zip_code?: string;
  region: string;
  latitude?: number;
  longitude?: number;
}

const LocationSchema = new Schema<ILocation>({
  house_building_number: { type: String },
  street_name: { type: String },
  purok_block_lot: { type: String },
  barangay: { type: String, required: true },
  municipality_city: { type: String, required: true },
  province: { type: String, required: true },
  zip_code: { type: String },
  region: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
});

// Check if the model already exists using the model name
const Location = mongoose.models.Location || mongoose.model<ILocation>("Location", LocationSchema, "locations");

export default Location;
