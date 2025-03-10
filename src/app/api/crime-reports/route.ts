import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CrimeReport from "@/models/CrimeReports";
import Location from "@/models/location";
import CrimeType from "@/models/CrimeType";

// Handle POST request
export async function POST(req: Request) {
  await connectDB();

  try {
    const body = await req.json();

    // Input Validation (Check for missing required fields)
    const requiredFields = [
      "crime_id", "date", "time", "day_of_week", 
      "barangay", "municipality_city", "province", "region",
      "latitude", "longitude", "crime_type", "crime_type_category",
      "case_status", "crime_occurred_indoors_or_outdoors"
    ];

    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    //  Check if Crime Type already exists, otherwise create it
    let crimeType = await CrimeType.findOne({ crime_type: body.crime_type });

    if (!crimeType) {
      crimeType = await CrimeType.create({
        crime_type: body.crime_type,
        crime_type_category: body.crime_type_category
      });
    }

    //  Create and store location
    const location = await Location.create({
      house_building_number: body.house_building_number,
      street_name: body.street_name,
      purok_block_lot: body.purok_block_lot,
      barangay: body.barangay,
      municipality_city: body.municipality_city,
      province: body.province,
      zip_code: body.zip_code,
      region: body.region,
      latitude: body.latitude,
      longitude: body.longitude
    });

    //  Create and store crime report
    const crime = await CrimeReport.create({
      crime_id: body.crime_id,
      date: body.date,
      time: body.time,
      day_of_week: body.day_of_week,
      location: location._id, // Store only the ObjectId reference
      crime_type: crimeType._id, //  Store only the ObjectId reference
      case_status: body.case_status,
      event_proximity: body.event_proximity,
      crime_occurred_indoors_or_outdoors: body.crime_occurred_indoors_or_outdoors
    });

    return NextResponse.json(
      { message: "Crime Report Saved!", data: crime },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error Saving Crime Report:", error);
    return NextResponse.json(
      { error: "Database Error" },
      { status: 500 }
    );
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


  try {
    const { searchParams } = new URL(req.url);
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
    if (startDate && endDate) {
      filters.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
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
      .exec();

    return NextResponse.json({ data: crimeReports }, { status: 200 });

  } catch (error) {
    console.error(" Error Fetching Crime Reports:", error);
    return NextResponse.json(
      { error: "Database Error" },
      { status: 500 }
    );
  }
}


