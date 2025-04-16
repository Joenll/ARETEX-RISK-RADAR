import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile"; // Ensure this path is correct
import { getToken } from "next-auth/jwt"; // Use standard getToken for auth check
import mongoose from "mongoose"; // Import mongoose if needed for specific error types

// GET all users (Admin only)
export async function GET(req: NextRequest): Promise<NextResponse> { // Use NextRequest and explicit return type
  try {
    // 1. Authentication and Authorization Check using getToken
    const token = await getToken({ req, secret: process.env.SESSION_SECRET });

    // Check if token exists and user is admin
    if (!token) {
      // No session token found
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }
    if (token.role !== "admin") {
      // User is authenticated but not an admin
      return NextResponse.json({ message: "Forbidden: Admin role required." }, { status: 403 });
    }

    // 2. Connect to Database
    await connectDB();

    // 3. Fetch users, populate profiles, exclude password, sort, and use lean
    const users = await User.find()
      .populate<{ profile: typeof UserProfile }>({ // Add type hint for populated field
        path: "profile",
        model: UserProfile,
        // --- Select specific fields from profile, including 'sex' ---
        select: 'firstName lastName employeeNumber workPosition team sex birthdate', // Added 'sex' and 'birthdate'
      })
      .select("-password") // Exclude password from the User object
      .sort({ createdAt: -1 }) // Optional: Sort by creation date descending
      .lean(); // Use lean for performance

    // 4. Return the fetched users directly as an array
    return NextResponse.json(users, { status: 200 }); // Return array directly

  } catch (error) {
    console.error("API Error fetching users:", error); // Log specific API error source
    // Add more specific error handling if needed
    // if (error instanceof mongoose.Error.ValidationError) { ... }
    return NextResponse.json({ message: "An error occurred while fetching users." }, { status: 500 }); // Slightly more descriptive generic error
  }
}
