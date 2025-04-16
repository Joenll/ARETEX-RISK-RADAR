// src/app/api/crime-reports/count/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CrimeReport from "@/models/CrimeReports";
import { requireRole } from "@/middleware/authMiddleware"; // Use your existing middleware

export async function GET(req: NextRequest): Promise<NextResponse> { // Use NextRequest
  try {
    // 1. Authentication and Authorization Check (Admin Only)
    // Use the same requireRole middleware as your main crime reports GET
    const roleCheck = await requireRole(req, ["admin"]);
    if (roleCheck) return roleCheck;

    // 2. Connect to Database
    await connectDB();

    // 3. Get the total count of crime reports
    const reportCount = await CrimeReport.countDocuments(); // Use countDocuments()

    // 4. Return the count
    return NextResponse.json({ count: reportCount }, { status: 200 });

  } catch (error) {
    console.error("API Error fetching crime report count:", error);
    return NextResponse.json({ message: "An error occurred while fetching crime report count." }, { status: 500 });
  }
}
