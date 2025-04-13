import mongoose, { Schema, Document, Model } from "mongoose";
import { fetchCoordinates } from "@/app/utils/geocoder"; // Utility function for geocoding addresses

/**
 * Interface representing a Location document in MongoDB.
 * Includes Mongoose Document properties and custom methods.
 */
export interface ILocation extends Document {
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
  /**
   * Generates a full address string from the location's components.
   * @returns {string} The formatted full address.
   */
  getFullAddress(): string;
}

// Define the Mongoose schema for the Location collection
const LocationSchema = new Schema<ILocation>({
  house_building_number: { type: String },
  street_name: { type: String },
  purok_block_lot: { type: String },
  barangay: { type: String, required: true },
  municipality_city: { type: String, required: true },
  province: { type: String, required: true },
  zip_code: { type: String },
  region: { type: String, required: true },
  latitude: { type: Number }, // Stores the derived latitude
  longitude: { type: Number }, // Stores the derived longitude
}, {
  timestamps: true // Automatically add createdAt and updatedAt fields
});

/**
 * Mongoose method to construct a full address string.
 * Filters out empty or null address parts before joining.
 */
LocationSchema.methods.getFullAddress = function(): string {
  const parts = [
    this.house_building_number,
    this.street_name,
    this.purok_block_lot,
    this.barangay,
    this.municipality_city,
    this.province,
    this.region,
    this.zip_code
  ];
  // Use Boolean constructor for a concise truthiness check to filter out empty parts
  return parts.filter(Boolean).join(', ');
};


/**
 * Mongoose pre-save middleware hook.
 * This function automatically runs *before* a Location document is saved.
 * Its primary purpose is to fetch and update latitude/longitude coordinates
 * if the address has changed or if it's a new location without coordinates.
 */
LocationSchema.pre<ILocation>('save', async function (next) {
  // Determine if any part of the address has been modified
  const addressModified =
    this.isModified('house_building_number') ||
    this.isModified('street_name') ||
    this.isModified('purok_block_lot') ||
    this.isModified('barangay') ||
    this.isModified('municipality_city') ||
    this.isModified('province') ||
    this.isModified('region') ||
    this.isModified('zip_code');

  // Check if geocoding is needed:
  // 1. If any address field was modified.
  // 2. OR if it's a new document (`isNew`) and coordinates are not already set.
  const needsGeocoding = addressModified || (this.isNew && (!this.latitude || !this.longitude));

  if (needsGeocoding) {
    // Construct the full address string for the geocoder
    const addressString = this.getFullAddress();

    // If the generated address string is empty, clear coordinates and skip geocoding.
    if (!addressString) {
      this.latitude = undefined;
      this.longitude = undefined;
      console.warn("Location pre-save: Address parts are empty, skipping geocoding.");
      return next(); // Proceed to save without coordinates
    }

    console.log(`Location pre-save: Address changed or missing coordinates. Attempting to geocode: "${addressString}"`);

    try {
      // Call the external geocoding utility function
      const coordinates = await fetchCoordinates(addressString);

      // Check if valid coordinates were returned
      if (coordinates && typeof coordinates.latitude === 'number' && typeof coordinates.longitude === 'number') {
        // Update the document's latitude and longitude fields
        this.latitude = coordinates.latitude;
        this.longitude = coordinates.longitude;
        // Optional: Log success if needed for debugging
        // console.log(`Location pre-save: Geocoding successful: Lat ${this.latitude}, Lon ${this.longitude}`);
      } else {
        // Geocoding service did not return valid coordinates
        console.warn(`Location pre-save: Geocoding failed or returned no valid results for: "${addressString}"`);
        // Ensure coordinates are cleared if geocoding fails
        this.latitude = undefined;
        this.longitude = undefined;
      }
    } catch (error: any) {
      // Handle errors during the geocoding process
      console.error(`Location pre-save: Error during geocoding for "${addressString}". Error: ${error.message || error}`);
      // Clear coordinates on error to avoid saving stale/incorrect data
      this.latitude = undefined;
      this.longitude = undefined;
      // Note: The save operation continues even if geocoding fails by default.
      // If geocoding MUST succeed for a save to occur, you would call `next(error)` here instead.
    }
  }

  // Proceed with the save operation (either with updated coords or without changes)
  next();
});


// --- Model Export ---
// Check if the model already exists in Mongoose's cache to prevent recompilation errors in development/HMR environments.
// Use type assertion `as Model<ILocation>` for better type safety.
const Location = (mongoose.models.Location as Model<ILocation>) || mongoose.model<ILocation>("Location", LocationSchema, "locations");

export default Location;
