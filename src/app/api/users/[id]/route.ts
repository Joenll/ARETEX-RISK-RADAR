import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import { requireRole } from "@/middleware/authMiddleware";

//  GET user by ID (Admin only)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  await connectDB();

  const roleCheck = await requireRole(new NextRequest(req), ["admin"]);
  if (roleCheck) return roleCheck;

  try {
    const { id } = params;

    // Find user without password
    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the associated user profile
    const profile = await UserProfile.findOne({ user: id }).lean();

    return NextResponse.json({ user: { ...user, profile } }, { status: 200 });

  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}