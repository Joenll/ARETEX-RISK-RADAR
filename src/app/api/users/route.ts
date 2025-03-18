import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import { requireRole } from "@/middleware/authMiddleware";


// GET all users (Admin only)
export async function GET(req: Request) {
  try {
    // Connect to the database
    await connectDB();

    // Check for admin role
    const roleCheck = await requireRole(new NextRequest(req), ["admin"]);
    if (roleCheck) return roleCheck;

    // Fetch users and populate their profiles
    const users = await User.find()
      .populate({
        path: "profile", // Populate the profile field
        model: UserProfile, // Use the UserProfile model
      })
      .select("-password"); // Exclude the password field for security

    // Return the fetched users
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}