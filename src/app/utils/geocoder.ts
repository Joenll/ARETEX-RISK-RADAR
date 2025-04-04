import axios, { AxiosError } from "axios";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export const fetchCoordinates = async (
  address: string
): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error("Missing Google Maps API key.");
      return null;
    }
    if (typeof address !== 'string' || address.trim() === '') {
      console.error("Invalid address provided to fetchCoordinates.");
      return null;
    }
    console.log("Fetching coordinates for address:", address);
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API_KEY}`,
      { timeout: 5000 } // Add a timeout of 5 seconds
    );

    if (response.data.status === "OK") {
      const location = response.data.results[0].geometry.location;
      console.log("Coordinates found:", location);
      return {
        latitude: location.lat, // Return as number
        longitude: location.lng, // Return as number
      };
    } else {
      console.error(
        `Geocoding failed with status: ${response.data.status}`
      );
      if (response.data.error_message) {
        console.error("Error message from API:", response.data.error_message);
      }
      console.log("API Response:", response.data);
      return null;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle Axios-specific errors
      if (error.code === "ECONNABORTED") {
        console.error("Axios error: Request timed out.");
      } else if (error.response) {
        console.error(
          `Axios error fetching coordinates with status: ${error.response.status}`
        );
        console.error("Axios error response data:", error.response.data);
      } else {
        console.error("Axios error fetching coordinates:", error.message);
      }
    } else {
      // Handle other types of errors
      console.error("Unexpected error fetching coordinates:", error);
    }
    return null;
  }
};
