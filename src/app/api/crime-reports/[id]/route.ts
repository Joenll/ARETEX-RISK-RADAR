import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import CrimeReport from "@/models/CrimeReports";
import Location from "@/models/location";
import CrimeType from "@/models/CrimeType";
import { requireRole } from "@/middleware/authMiddleware";
import { error } from "console";



export async function GET(req: Request, { params }: { params: { id: string } }) {
  await connectDB();

  const roleCheck = await requireRole(new NextRequest(req), ["admin", "user"]);
  if (roleCheck) return roleCheck;

  try {
    const { id } = params;

    // Find the crime report and populate references
    const crimeReport = await CrimeReport.findById(id)
      .populate("location")
      .populate("crime_type")
      .lean();

    if (!crimeReport) {
      return NextResponse.json({ error: "Crime Report not found" }, { status: 404 });
    }

    return NextResponse.json({ data: crimeReport }, { status: 200 });

  } catch (error) {
    console.error("Error fetching Crime Report:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}




 await connectDB();
 export async function PUT(req: Request, {params}: {
     params:{
         id: string
     }
 }){
  // Check for admin role
  const roleCheck = await requireRole(req, ["admin"]); // Pass the original req object
  if (roleCheck) return roleCheck;
  
     try{
         const crimeReportId = params.id;
         const body = await req.json();

         // Check if the Crime Report exists
     const existingCrimeReport = await CrimeReport.findById(crimeReportId);
     if (!existingCrimeReport) {
       return NextResponse.json({ error: "Crime Report not found" }, { status: 404 });
     }
 
     // Update Location if included
     if (body.location) {
       await Location.findByIdAndUpdate(existingCrimeReport.location, body.location, { new: true });
     }
 
     // Update Crime Type instead of creating a new one
     if (body.crime_type) {
       const updatedCrimeType = await CrimeType.findByIdAndUpdate(
         existingCrimeReport.crime_type,  //  Use the existing reference
         {
           crime_type: body.crime_type,
           crime_type_category: body.crime_type_category
         },
         { new: true }
       );
 
       body.crime_type = updatedCrimeType._id;  // Keep the reference
     }
 
     // Update Crime Report
     const updatedCrimeReport = await CrimeReport.findByIdAndUpdate(
        crimeReportId,
       { $set: body }, // Ensures only specified fields are updated
       { new: true }
     ).populate("location").populate("crime_type");
 
     return NextResponse.json(
       { message: "Crime Report Updated!", data: updatedCrimeReport },
       { status: 200 }
     );
 
     }catch(error){
         console.error("Error updating");

         return NextResponse.json({error: "Database error"}, {status: 500});
     }
 }



 // DELETE a Crime Report (DELETE)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {

 
    const roleCheck = await requireRole(new NextRequest(req), ["admin"]);
    if (roleCheck) return roleCheck;

  try {
    const crimeReportId = params.id; // Extracting params correctly

    // Find and delete Crime Report
    const crimeReport = await CrimeReport.findByIdAndDelete(crimeReportId);
    if (!crimeReport) {
      return NextResponse.json({ error: "Crime Report not found" }, { status: 404 });
    }

    // Check if any other reports reference the same crime type
    const isCrimeTypeUsed = await CrimeReport.exists({ crime_type: crimeReport.crime_type });
    if (!isCrimeTypeUsed) {
      await CrimeType.findByIdAndDelete(crimeReport.crime_type);
    }

    // Check if any other reports reference the same location
    const isLocationUsed = await CrimeReport.exists({ location: crimeReport.location });
    if (!isLocationUsed) {
      await Location.findByIdAndDelete(crimeReport.location);
    }

    return NextResponse.json(
      { message: "Crime Report Deleted!" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error Deleting Crime Report:", error);
    return NextResponse.json(
      { error: "Database Error" },
      { status: 500 }
    );
  }
}

