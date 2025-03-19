import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import { requireRole } from "@/middleware/authMiddleware";
import { getToken } from "next-auth/jwt";



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


//  Update user by ID (Admin only)

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const token = await getToken({ req, secret: process.env.SESSION_SECRET });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    // Allow admins to update any profile
    if (token.role === "admin") {
      const updatedProfile = await UserProfile.findOneAndUpdate({ user: id }, body, { new: true });
      if (!updatedProfile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }
      return NextResponse.json({ message: "Profile updated successfully!", data: updatedProfile });
    }

    // Allow users to only update their own profile
    if (token.sub !== id) {
      return NextResponse.json({ error: "Forbidden: You can only edit your own profile" }, { status: 403 });
    }

    const updatedProfile = await UserProfile.findOneAndUpdate({ user: token.sub }, body, { new: true });
    if (!updatedProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Profile updated successfully!", data: updatedProfile });

  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


// DELETE user by ID (Admin only)

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await connectDB();

  const roleCheck = await requireRole(new NextRequest(req), ["admin"]);
  if (roleCheck) return roleCheck;

  try {
    const { id } = params;

    // Delete user profile first (to maintain referential integrity)
    await UserProfile.findOneAndDelete({ user: id });

    // Delete user account
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully!" }, { status: 200 });

  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
