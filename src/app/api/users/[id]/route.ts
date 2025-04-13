// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User, { IUser, UserStatus } from "@/models/User"; // Import IUser and UserStatus
import UserProfile, { IUserProfile } from "@/models/UserProfile";
// Remove requireRole if using getToken for all checks
// import { requireRole } from "@/middleware/authMiddleware";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose"; // Import mongoose

// Define allowed roles and statuses for validation
const ALLOWED_ROLES: IUser['role'][] = ['user', 'admin']; // Adjust as needed
const ALLOWED_STATUSES: UserStatus[] = ['pending', 'approved', 'rejected'];


// --- GET user by ID ---
// (Keep your existing GET handler, but ensure it uses getToken for auth check if requireRole is removed)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    await connectDB();

    // Use getToken for consistency
    const token = await getToken({ req, secret: process.env.SESSION_SECRET });

    // Decide who can GET: Admin only? Or user for their own ID?
    // Option 1: Admin only
    if (!token || token.role !== 'admin') {
       return NextResponse.json({ message: 'Unauthorized: Admin role required' }, { status: 403 });
    }
    // Option 2: Admin OR User for self (uncomment if needed)
    // if (!token) {
    //    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }
    // if (token.role !== 'admin' && token.sub !== params.id) {
    //    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    // }


    try {
        const { id } = params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Invalid user ID format" }, { status: 400 });
        }

        // Fetch user and populate profile (as in the previous good version)
        const user = await User.findById(id)
            .select("-password")
            .populate<{ profile: typeof UserProfile }>({
                path: "profile",
                model: UserProfile,
            })
            .lean();

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Return user object which now includes the populated profile
        return NextResponse.json({ user }, { status: 200 });

    } catch (error: any) {
        console.error("[API GET /users/:id] Error fetching user:", error);
        return NextResponse.json({ message: "Server error while fetching user", error: error.message }, { status: 500 });
    }
}


// --- PUT User Profile by ID (User self-update OR Admin update) ---
// (This is your existing PUT handler, keep it as is for user self-service)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const token = await getToken({ req, secret: process.env.SESSION_SECRET });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

     // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid user ID format" }, { status: 400 });
    }

    // Prepare allowed fields for profile update
   
    // Define the keys we explicitly allow for profile updates
    type AllowedProfileUpdateKeys = keyof Pick<IUserProfile, 'firstName' | 'lastName' | 'badgeNumber' | 'rank' | 'department' | 'birthdate'>;

    // Prepare allowed fields for profile update, typed correctly
    const allowedProfileUpdates: Partial<Pick<IUserProfile, AllowedProfileUpdateKeys>> = {};

    // Use the specific keys type for the array
    const profileFields: AllowedProfileUpdateKeys[] = ['firstName', 'lastName', 'badgeNumber', 'rank', 'department', 'birthdate'];

    // Iterate using the correctly typed keys
    profileFields.forEach(field => {
        // Check if the incoming body actually has this specific field
        if (body.hasOwnProperty(field)) {
            // Now TypeScript knows 'field' is a valid key for allowedProfileUpdates
            allowedProfileUpdates[field] = body[field];
        }
    });

    // Allow admins to update any profile
    if (token.role === "admin") {
      console.log(`[API PUT /users/:id] Admin ${token.email} updating profile for user ${id}`);
      const updatedProfile = await UserProfile.findOneAndUpdate(
          { user: id },
          { $set: allowedProfileUpdates },
          { new: true, upsert: false, runValidators: true } // Don't create if not found
      ).lean();

      if (!updatedProfile) {
         // Check if user exists to differentiate
         const userExists = await User.findById(id).countDocuments() > 0;
         return NextResponse.json({ message: userExists ? "Profile not found for this user" : "User not found" }, { status: 404 });
      }
      return NextResponse.json({ message: "Profile updated successfully by admin!", data: updatedProfile });
    }

    // Allow users to only update their own profile
    if (token.sub !== id) {
      console.warn(`[API PUT /users/:id] Forbidden attempt by user ${token.email} to update profile for user ${id}`);
      return NextResponse.json({ error: "Forbidden: You can only edit your own profile" }, { status: 403 });
    }

    console.log(`[API PUT /users/:id] User ${token.email} updating own profile`);
    const updatedProfile = await UserProfile.findOneAndUpdate(
        { user: token.sub }, // Find by logged-in user's ID
        { $set: allowedProfileUpdates },
        { new: true, upsert: false, runValidators: true }
    ).lean();

    if (!updatedProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Profile updated successfully!", data: updatedProfile });

  } catch (error: any) {
    console.error("[API PUT /users/:id] Error updating profile:", error);
     if (error instanceof mongoose.Error.ValidationError) {
        return NextResponse.json({ message: "Validation failed", errors: error.errors }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
         return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error while updating profile" }, { status: 500 });
  }
}


// --- PATCH User Details (Role, Status) by ID (Admin only) ---
// <<< ADD THIS HANDLER >>>
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    await connectDB();

    // 1. Authorization Check (Admin Only)
    const token = await getToken({ req, secret: process.env.SESSION_SECRET });
    if (!token || token.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    try {
        const { id } = params;
        const body = await req.json();

        // 2. Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Invalid user ID format" }, { status: 400 });
        }

        // 3. Prepare update object for User model fields and validate
        const updateFields: Partial<Pick<IUser, 'role' | 'status'>> = {}; // Only allow role and status updates here

        if (body.hasOwnProperty('role')) {
            if (!ALLOWED_ROLES.includes(body.role)) {
                return NextResponse.json({ message: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(', ')}` }, { status: 400 });
            }
            // Prevent admin from accidentally removing the last admin? (Optional check)
            updateFields.role = body.role;
        }

        if (body.hasOwnProperty('status')) {
             if (!ALLOWED_STATUSES.includes(body.status)) {
                return NextResponse.json({ message: `Invalid status. Allowed statuses: ${ALLOWED_STATUSES.join(', ')}` }, { status: 400 });
            }
            updateFields.status = body.status;
        }

        if (Object.keys(updateFields).length === 0) {
             return NextResponse.json({ message: "No valid fields (role, status) provided for update." }, { status: 400 });
        }

        // 4. Perform Update on User model
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true } // Return updated doc, run schema validators
        ).select('-password').lean(); // Exclude password from result

        if (!updatedUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        console.log(`[API PATCH /users/:id] Admin ${token.email} updated details for user ${id}:`, updateFields);

        // 5. Return Success Response
        return NextResponse.json({ message: "User details updated successfully!", user: updatedUser }, { status: 200 });

    } catch (error: any) {
        console.error("[API PATCH /users/:id] Error updating user details:", error);
         if (error instanceof mongoose.Error.ValidationError) {
            return NextResponse.json({ message: "Validation failed", errors: error.errors }, { status: 400 });
        }
        if (error instanceof SyntaxError) {
             return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
        }
        return NextResponse.json({ message: "Server error while updating user details", error: error.message }, { status: 500 });
    }
}
// <<< END OF ADDED HANDLER >>>


// --- DELETE user by ID (Admin only) ---
// (Keep your existing DELETE handler)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();

  // Use getToken for consistency
  const token = await getToken({ req, secret: process.env.SESSION_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized: Admin role required' }, { status: 403 });
  }

  // Optional: Consider Mongoose Transactions
  // const session = await mongoose.startSession();
  // session.startTransaction();

  try {
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        // if (session) await session.abortTransaction().finally(() => session.endSession());
        return NextResponse.json({ message: "Invalid user ID format" }, { status: 400 });
    }

    // Delete user profile first
    await UserProfile.findOneAndDelete({ user: id } /*, { session }*/);

    // Delete user account
    const deletedUser = await User.findByIdAndDelete(id /*, { session }*/);

    if (!deletedUser) {
        // if (session) await session.abortTransaction().finally(() => session.endSession());
        return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // await session.commitTransaction();
    console.log(`[API DELETE /users/:id] Admin ${token.email} deleted user ${id}`);
    return NextResponse.json({ message: "User deleted successfully!" }, { status: 200 });

  } catch (error: any) {
    console.error("[API DELETE /users/:id] Error deleting user:", error);
    // if (session) await session.abortTransaction();
    return NextResponse.json({ message: "Server error while deleting user", error: error.message }, { status: 500 });
  } finally {
    // if (session) session.endSession();
  }
}
