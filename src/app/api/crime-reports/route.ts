import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CrimeReport from "@/models/CrimeReports";
import Location from "@/models/location";
import CrimeType from "@/models/CrimeType";
import { requireRole } from "@/middleware/authMiddleware";
import { fetchCoordinates } from "@/app/utils/geocoder"; // Import fetchCoordinates
import { isPSGCCode } from "@/app/utils/ispsgc";
import { getPSGCName } from "@/app/utils/psgcName";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;






// Utility function for building filters
const buildCrimeReportFilters = async (searchParams: URLSearchParams) => {
  let filters: any = {};

  // Filter by Crime Type
  const crimeType = searchParams.get("crime_type");
  if (crimeType) {
    const crimeTypeDoc = await CrimeType.findOne({ crime_type: crimeType });
    if (crimeTypeDoc) {
      filters.crime_type = crimeTypeDoc._id; // Use ObjectId reference
    }
  }

  // Filter by Case Status
  const caseStatus = searchParams.get("case_status");
  if (caseStatus) {
    filters.case_status = caseStatus;
  }

  // Filter by Date Range
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  if (startDate || endDate) {
    filters.date = {};
    if (startDate) filters.date.$gte = new Date(startDate);
    if (endDate) filters.date.$lte = new Date(endDate);
  }

  // Filter by Time Range
  const startTime = searchParams.get("start_time");
  const endTime = searchParams.get("end_time");
  if (startTime || endTime) {
    filters.time = {};
    if (startTime) filters.time.$gte = startTime;
    if (endTime) filters.time.$lte = endTime;
  }

  // Filter by Event Proximity
  const eventProximity = searchParams.get("event_proximity");
  if (eventProximity) {
    filters.event_proximity = eventProximity;
  }

  // Filter by Crime Occurred Indoors/Outdoors
  const occurredIndoorsOutdoors = searchParams.get(
    "crime_occurred_indoors_or_outdoors"
  );
  if (occurredIndoorsOutdoors) {
    filters.crime_occurred_indoors_or_outdoors = occurredIndoorsOutdoors;
  }

  // Filter by Location (Barangay, City, Province)
  const barangay = searchParams.get("barangay");
  const municipalityCity = searchParams.get("municipality_city");
  const province = searchParams.get("province");

  if (barangay || municipalityCity || province) {
    let locationQuery: any = {};
    if (barangay) locationQuery.barangay = barangay;
    if (municipalityCity) locationQuery.municipality_city = municipalityCity;
    if (province) locationQuery.province = province;

    const locations = await Location.find(locationQuery);
    const locationIds = locations.map((loc) => loc._id);
    filters.location = { $in: locationIds };
  }

  return filters;
};

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
    // Input Validation (Check for missing required fields except latitude & longitude)
    const requiredFields = [
      "crime_id",
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

   // 🔹 1. Fetch Latitude & Longitude from Google Maps API (Only for valid addresses)
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

    // 🔹 2. Check if Crime Type already exists, otherwise create it
    let crimeType = await CrimeType.findOne({ crime_type: body.crime_type });

    if (!crimeType) {
      crimeType = await CrimeType.create({
        crime_type: body.crime_type,
        crime_type_category: body.crime_type_category,
      });
    }

     // Prepare location data
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

    // 🔹 3. Create and store location with auto-detected latitude & longitude
    const location = await Location.create({
      house_building_number: body.house_building_number,
      street_name: body.street_name,
      purok_block_lot: body.purok_block_lot,
      barangay: body.barangay_name,
      municipality_city: body.municipality_city_name,
      province: body.province_name,
      zip_code: body.zip_code,
      region: body.region_name,
      latitude: latitude, // Auto-fetched
      longitude: longitude, // Auto-fetched
    });

    if (isPSGCCode(fullAddress)) {
      location.psgc_code = fullAddress;
      location.barangay_name = await getPSGCName(body.barangay);
      location.municipality_city_name = await getPSGCName(body.municipality_city);
      location.province_name = await getPSGCName(body.province);
      location.region_name = await getPSGCName(body.region);
    }

    // 🔹 4. Create and store crime report
    const crime = await CrimeReport.create({
      crime_id: body.crime_id,
      date: body.date,
      time: body.time,
      day_of_week: body.day_of_week,
      location: location._id, // Store only the ObjectId reference
      crime_type: crimeType._id, // Store only the ObjectId reference
      case_status: body.case_status,
      event_proximity: body.event_proximity,
      crime_occurred_indoors_or_outdoors: body.crime_occurred_indoors_or_outdoors,
    });

    return NextResponse.json(
      { message: "Crime Report Saved!", data: crime },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error Saving Crime Report:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    } else {
      console.error("An unknown error occurred:", error);
    }
    return NextResponse.json({ error: "Database Error" }, { status: 500 });
  }
}

// Handle Get Request

// export async function GET() {
//   await connectDB();

//   try {
//     //  Fetch crime reports with related location and crime type
//     const crimeReports = await CrimeReport.find()
//       .populate("location") //  Get full location details
//       .populate("crime_type") //  Get full crime type details
//       .exec();

//     return NextResponse.json({ data: crimeReports }, { status: 200 });

//   } catch (error) {
//     console.error(" Error Fetching Crime Reports:", error);
//     return NextResponse.json(
//       { error: "Database Error" },
//       { status: 500 }
//     );
//   }
// }

// Ensure database connection

// GET: Fetch Crime Reports with Filters
export async function GET(req: Request) {
  await connectDB();

  const roleCheck = await requireRole(new NextRequest(req), ["admin"]);
  if (roleCheck) return roleCheck;

  try {
    const { searchParams } = new URL(req.url);
    let filters: any = {};

    //  Filter by Crime Type
    const crimeType = searchParams.get("crime_type");
    if (crimeType) {
      const crimeTypeDoc = await CrimeType.findOne({ crime_type: crimeType });
      if (crimeTypeDoc) {
        filters.crime_type = crimeTypeDoc._id; // Use ObjectId reference
      }
    }

    //  Filter by Case Status
    const caseStatus = searchParams.get("case_status");
    if (caseStatus) {
      filters.case_status = caseStatus;
    }

    //  Filter by Date Range
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }

    //  Filter by Time Range
    const startTime = searchParams.get("start_time");
    const endTime = searchParams.get("end_time");
    if (startTime || endTime) {
      filters.time = {};
      if (startTime) filters.time.$gte = startTime;
      if (endTime) filters.time.$lte = endTime;
    }

    //  Filter by Event Proximity
    const eventProximity = searchParams.get("event_proximity");
    if (eventProximity) {
      filters.event_proximity = eventProximity;
    }

    //  Filter by Crime Occurred Indoors/Outdoors
    const occurredIndoorsOutdoors = searchParams.get(
      "crime_occurred_indoors_or_outdoors"
    );
    if (occurredIndoorsOutdoors) {
      filters.crime_occurred_indoors_or_outdoors = occurredIndoorsOutdoors;
    }

    //  Filter by Location (Barangay, City, Province)
    const barangay = searchParams.get("barangay");
    const municipalityCity = searchParams.get("municipality_city");
    const province = searchParams.get("province");

    if (barangay || municipalityCity || province) {
      let locationQuery: any = {};
      if (barangay) locationQuery.barangay = barangay;
      if (municipalityCity) locationQuery.municipality_city = municipalityCity;
      if (province) locationQuery.province = province;

      const locations = await Location.find(locationQuery);
      const locationIds = locations.map((loc) => loc._id);
      filters.location = { $in: locationIds };
    }

    //  Fetch filtered results
    const crimeReports = await CrimeReport.find(filters)
      .populate("location")
      .populate("crime_type")
      .exec()
      .catch((err) => console.error("Error populating data:", err));


    return NextResponse.json({ data: crimeReports }, { status: 200 });
  } catch (error) {
    console.error("Error Fetching Crime Reports:", error);    
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json({ error: "Database Error" }, { status: 500 });
  }
}



// // Utility function for building filters
// const buildCrimeReportFilters = async (searchParams: URLSearchParams) => {
//   let filters: any = {};

//   // Filter by Crime Type
//   const crimeType = searchParams.get("crime_type");
//   if (crimeType) {
//     const crimeTypeDoc = await CrimeType.findOne({ crime_type: crimeType });
//     if (crimeTypeDoc) {
//       filters.crime_type = crimeTypeDoc._id; // Use ObjectId reference
//     }
//   }

//   // Filter by Case Status
//   const caseStatus = searchParams.get("case_status");
//   if (caseStatus) {
//     filters.case_status = caseStatus;
//   }

//   // Filter by Date Range
//   const startDate = searchParams.get("start_date");
//   const endDate = searchParams.get("end_date");
//   if (startDate || endDate) {
//     filters.date = {};
//     if (startDate) filters.date.$gte = new Date(startDate);
//     if (endDate) filters.date.$lte = new Date(endDate);
//   }

//   // Filter by Time Range
//   const startTime = searchParams.get("start_time");
//   const endTime = searchParams.get("end_time");
//   if (startTime || endTime) {
//     filters.time = {};
//     if (startTime) filters.time.$gte = startTime;
//     if (endTime) filters.time.$lte = endTime;
//   }

//   // Filter by Event Proximity
//   const eventProximity = searchParams.get("event_proximity");
//   if (eventProximity) {
//     filters.event_proximity = eventProximity;
//   }

//   // Filter by Crime Occurred Indoors/Outdoors
//   const occurredIndoorsOutdoors = searchParams.get(
//     "crime_occurred_indoors_or_outdoors"
//   );
//   if (occurredIndoorsOutdoors) {
//     filters.crime_occurred_indoors_or_outdoors = occurredIndoorsOutdoors;
//   }

//   // Filter by Location (Barangay, City, Province)
//   const barangay = searchParams.get("barangay");
//   const municipalityCity = searchParams.get("municipality_city");
//   const province = searchParams.get("province");

//   if (barangay || municipalityCity || province) {
//     let locationQuery: any = {};
//     if (barangay) locationQuery.barangay = barangay;
//     if (municipalityCity) locationQuery.municipality_city = municipalityCity;
//     if (province) locationQuery.province = province;

//     const locations = await Location.find(locationQuery);
//     const locationIds = locations.map((loc) => loc._id);
//     filters.location = { $in: locationIds };
//   }

//   return filters;
// };

// // GET: Fetch Crime Reports with Filters
// export async function GET(req: Request) {
//   await connectDB();

//   const roleCheck = await requireRole(new NextRequest(req), ["admin"]);
//   if (roleCheck) return roleCheck;

//   try {
//     const { searchParams } = new URL(req.url);
//     const filters = await buildCrimeReportFilters(searchParams);

//     // Fetch filtered results
//     const crimeReports = await CrimeReport.find(filters)
//       .populate("location")
//       .populate("crime_type")
//       .exec();

//     return NextResponse.json({ data: crimeReports }, { status: 200 });
//   } catch (error) {
//     console.error("Error Fetching Crime Reports:", error);
//     if (error instanceof Error) {
//       console.error("Error stack:", error.stack);
//     }
//     return NextResponse.json({ error: "Database Error" }, { status: 500 });
//   }
// }
