import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CrimeReport from "@/models/CrimeReports";
import Location from "@/models/location";
import CrimeType from "@/models/CrimeType";
import { requireRole } from "@/middleware/authMiddleware";
import { fetchCoordinates } from "@/app/utils/geocoder"; // Import fetchCoordinates
import { isPSGCCode } from "@/app/utils/ispsgc";
import { getPSGCName } from "@/app/utils/psgcName";
import mongoose from "mongoose"; // Import mongoose

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;


// GET: Fetch Crime Reports with all filters and searches
export async function GET(req: Request) {
  await connectDB();

  const roleCheck = await requireRole(new NextRequest(req), ["admin"]);
  if (roleCheck) return roleCheck;

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = parseInt(searchParams.get("skip") || "0");
    // Filters
    const caseStatus = searchParams.get("case_status");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    // Search terms
    const searchCrimeType = searchParams.get("search_crime_type");
    const searchLocation = searchParams.get("search_location"); // Get location search term

    const query: any = {}; // Main query object for CrimeReport

    // --- Start: Crime Type Search Logic ---
    if (searchCrimeType) {
      console.log("Searching for crime types matching:", searchCrimeType);
      const matchingCrimeTypes = await CrimeType.find({
        crime_type: { $regex: new RegExp(searchCrimeType, "i") }
      }).select('_id');

      const crimeTypeIds = matchingCrimeTypes.map(ct => ct._id);
      console.log("Found matching crime type IDs:", crimeTypeIds);

      if (crimeTypeIds.length === 0) {
        console.log("No matching crime types found.");
        return NextResponse.json({ data: [], total: 0 }, { status: 200 });
      }
      query.crime_type = { $in: crimeTypeIds };
    }
    // --- End: Crime Type Search Logic ---

    // --- Start: Location Search Logic --- (NEW)
    if (searchLocation) {
      console.log("Searching for locations matching:", searchLocation);
      const searchRegex = new RegExp(searchLocation, "i"); // Case-insensitive regex

      // Define fields to search within the Location model
      const locationSearchFields = [
        { barangay: searchRegex },
        { municipality_city: searchRegex },
        { province: searchRegex },
        { region: searchRegex },
        { street_name: searchRegex },
        { purok_block_lot: searchRegex },
        // Add other relevant string fields from your Location model if needed
      ];

      const matchingLocations = await Location.find({
        $or: locationSearchFields // Search across multiple fields
      }).select('_id'); // Only get the IDs

      const locationIds = matchingLocations.map(loc => loc._id);
      console.log("Found matching location IDs:", locationIds);

      // If search term provided but no matching locations found, return empty
      if (locationIds.length === 0) {
        console.log("No matching locations found for search term.");
        return NextResponse.json({ data: [], total: 0 }, { status: 200 });
      }
      // Add the $in condition to the main query
      query.location = { $in: locationIds };
    }
    // --- End: Location Search Logic ---

    // --- Add Standard Filters ---
    if (caseStatus) {
      query.case_status = caseStatus;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const parsedStartDate = new Date(startDate);
        if (!isNaN(parsedStartDate.getTime())) {
            query.date.$gte = parsedStartDate;
        } else {
            console.warn("Invalid start_date received:", startDate);
        }
      }
      if (endDate) {
         const parsedEndDate = new Date(endDate);
         if (!isNaN(parsedEndDate.getTime())) {
            parsedEndDate.setHours(23, 59, 59, 999); // End of the day
            query.date.$lte = parsedEndDate;
         } else {
            console.warn("Invalid end_date received:", endDate);
         }
      }
    }
    // --- End: Standard Filters ---

    console.log("Executing CrimeReport query:", JSON.stringify(query, null, 2)); // Log final query

    // Get total count matching the combined query
    const total = await CrimeReport.countDocuments(query);

    // Get the paginated crime reports matching the combined query
    const crimeReports = await CrimeReport.find(query)
      .populate("location")
      .populate("crime_type")
      .sort({ date: -1, time: -1 }) // Optional sort
      .limit(limit)
      .skip(skip)
      .exec();

    console.log(`Found ${crimeReports.length} reports for this page, total matching: ${total}`);

    return NextResponse.json({ data: crimeReports, total }, { status: 200 });
  } catch (error) {
    console.error("Error Fetching Crime Reports:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json({ error: "Database Error" }, { status: 500 });
  }
}



// Handle POST request
export async function POST(req: Request) {
  await connectDB();

  // Check for admin role
  const roleCheck = await requireRole(req, ["admin"]);
  if (roleCheck) return roleCheck;

  // Check for API key
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("Missing Google Maps API key.");
    return NextResponse.json(
      { error: "Server configuration error: Missing Google Maps API key." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    console.log("Request Body:", body);

    // --- Start: Duplicate crime_id Check --- (NEW)
    const existingReport = await CrimeReport.findOne({ crime_id: body.crime_id });
    if (existingReport) {
      console.warn(`Attempted to add duplicate crime_id: ${body.crime_id}`);
      return NextResponse.json(
        { error: `Crime report with ID '${body.crime_id}' already exists.` },
        { status: 409 } // 409 Conflict status code
      );
    }
    // --- End: Duplicate crime_id Check ---

    // Input Validation (Check for missing required fields)
    const requiredFields = [
      "crime_id", // Already checked for duplication above
      "date",
      "time",
      "day_of_week",
      "barangay",
      "municipality_city",
      "province",
      "region",
      "crime_type",
      "crime_type_category",
      "case_status",
      "crime_occurred_indoors_or_outdoors",
    ];

    const missingFields = requiredFields.filter((field) => !body[field]);
    console.log("Missing Fields:", missingFields);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Basic address validation
    if (
      !body.barangay &&
      !body.municipality_city &&
      !body.province &&
      !body.region
    ) {
      return NextResponse.json(
        {
          error:
            "At least one of the following location fields must be provided: barangay, municipality_city, province, region.",
        },
        { status: 400 }
      );
    }

   // 1. Fetch Latitude & Longitude (Keep existing logic)
   const addressParts = [
    body.house_building_number,
    body.street_name,
    body.purok_block_lot,
    body.barangay_name,
    body.municipality_city_name,
    body.province_name,
    body.region_name,
  ];
  const fullAddress = addressParts.filter(Boolean).join(", ");

  console.log("Full Address:", fullAddress);

  let latitude: number | undefined = body.latitude ? parseFloat(body.latitude) : undefined;
  let longitude: number | undefined = body.longitude ? parseFloat(body.longitude) : undefined;

  if ((latitude === undefined || longitude === undefined) && !isPSGCCode(fullAddress)) {
    console.log("Attempting to fetch coordinates for:", fullAddress);
    const coordinates = await fetchCoordinates(fullAddress);
    if (coordinates) {
      latitude = coordinates.latitude;
      longitude = coordinates.longitude;
      if (isNaN(latitude) || isNaN(longitude)) {
        console.error("Invalid coordinates received from geocoding API:", coordinates);
        latitude = undefined;
        longitude = undefined;
      }
    } else {
      console.error(
        "fetchCoordinates returned null for address:",
        fullAddress
      );
    }
  }

    // 2. Find or Create Crime Type (Keep existing logic)
    let crimeType = await CrimeType.findOne({ crime_type: body.crime_type });
    if (!crimeType) {
        crimeType = await CrimeType.create({
        crime_type: body.crime_type,
        crime_type_category: body.crime_type_category,
    });
    }
    const crimeTypeId = crimeType._id;

    // Prepare location data (Keep existing logic)
    const locationData: any = {
      house_building_number: body.house_building_number,
      street_name: body.street_name,
      purok_block_lot: body.purok_block_lot,
      barangay: body.barangay,
      municipality_city: body.municipality_city,
      province: body.province,
      zip_code: body.zip_code,
      region: body.region,
    };

    if (isPSGCCode(body.region) || isPSGCCode(body.province) || isPSGCCode(body.municipality_city) || isPSGCCode(body.barangay)) {
      locationData.psgc_code = `${body.region}, ${body.province}, ${body.municipality_city}, ${body.barangay}`;
      locationData.barangay_name = body.barangay_name;
      locationData.municipality_city_name = body.municipality_city_name;
      locationData.province_name = body.province_name;
      locationData.region_name = body.region_name;
    }

    if (latitude !== undefined) {
      locationData.latitude = latitude;
    }
    if (longitude !== undefined) {
      locationData.longitude = longitude;
    }

    // 3. Create Location (Keep existing logic)
    const location = await Location.create({
      house_building_number: body.house_building_number,
      street_name: body.street_name,
      purok_block_lot: body.purok_block_lot,
      barangay: body.barangay_name,
      municipality_city: body.municipality_city_name,
      province: body.province_name,
      zip_code: body.zip_code,
      region: body.region_name,
      latitude: latitude,
      longitude: longitude,
    });

    console.log("Location Created:", location);

    // 4. Create Crime Report (Keep existing logic)
    const crime = await CrimeReport.create({
      crime_id: body.crime_id,
      date: body.date,
      time: body.time,
      day_of_week: body.day_of_week,
      location: location._id,
      crime_type: crimeTypeId,
      case_status: body.case_status,
      event_proximity: body.event_proximity,
      crime_occurred_indoors_or_outdoors: body.crime_occurred_indoors_or_outdoors,
    });

    return NextResponse.json(
      { message: "Crime Report Saved!", data: crime },
      { status: 201 } // 201 Created status code
    );
  } catch (error) {
    // Check specifically for Mongoose duplicate key errors (though our check above is better)
    if (error instanceof Error && (error as any).code === 11000) {
       console.error("Duplicate key error:", error);
       // Extract the duplicate key field if possible
       const field = Object.keys((error as any).keyValue)[0];
       return NextResponse.json({ error: `Duplicate value for ${field}: ${(error as any).keyValue[field]}` }, { status: 409 });
    }

    console.error("Error Saving Crime Report:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    } else {
      console.error("An unknown error occurred:", error);
    }
    return NextResponse.json({ error: "Database Error" }, { status: 500 });
  }
}