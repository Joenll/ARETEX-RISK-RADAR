import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth"; // Ensure the path is correct
import connectDB from "@/lib/mongodb"; // Ensure the path is correct
import User from "@/models/User"; // Ensure the path is correct
import UserProfile, { UserSex } from "@/models/UserProfile"; // Ensure the path is correct
// Import updateSession if you created it in auth.ts
// import { updateSession } from "@/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // 1. Check Authentication
  if (!session?.user?.id || !session?.user?.email) {
    console.warn("[API CompleteProfile] Unauthenticated access attempt.");
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  // Use ID from session for reliability
  const userId = session.user.id;
  const userEmail = session.user.email; // Keep email for logging/context if needed
  console.log(`[API CompleteProfile] Received request for user ID: ${userId} (Email: ${userEmail})`);

  // --- Start Mongoose Session for Transaction ---
  const mongooseSession = await mongoose.startSession();
  mongooseSession.startTransaction();
  console.log(`[API CompleteProfile] Transaction started for user ID: ${userId}`);

  try {
    await connectDB(); // Ensure database connection

    const {
      employeeNumber,
      workPosition,
      firstName,
      lastName,
      birthdate,
      team,
      sex,
    } = await req.json();

    // 2. Validate Input Data
    console.log(`[API CompleteProfile] Validating input for user ID: ${userId}`);
    const missingFields = [
      !firstName && "firstName",
      !lastName && "lastName",
      !employeeNumber && "employeeNumber",
      !workPosition && "workPosition",
      !birthdate && "birthdate",
      !team && "team",
      !sex && "sex",
    ].filter(Boolean);

    if (missingFields.length > 0) {
      console.warn(`[API CompleteProfile] Validation failed for user ID ${userId}: Missing fields - ${missingFields.join(", ")}`);
      await mongooseSession.abortTransaction();
      return NextResponse.json({ message: `Missing required fields: ${missingFields.join(", ")}` }, { status: 400 });
    }

    // Validate sex value
    const validSexValues: UserSex[] = ["Male", "Female"];
    if (!sex || !validSexValues.includes(sex)) {
      console.warn(`[API CompleteProfile] Validation failed for user ID ${userId}: Invalid sex value - ${sex}`);
      await mongooseSession.abortTransaction();
      return NextResponse.json({ message: `Invalid value provided for sex. Must be one of: ${validSexValues.join(", ")}` }, { status: 400 });
    }

    // Validate birthdate format
    if (isNaN(Date.parse(birthdate))) {
      console.warn(`[API CompleteProfile] Validation failed for user ID ${userId}: Invalid birthdate format - ${birthdate}`);
      await mongooseSession.abortTransaction();
      return NextResponse.json({ message: "Invalid birthdate format." }, { status: 400 });
    }

    // 3. Find the User by ID
    console.log(`[API CompleteProfile] Finding user document for ID: ${userId}`);
    // Select status to read it later, but don't modify it here unless intended
    const user = await User.findById(userId).select('+status +profile +profileComplete').session(mongooseSession);
    if (!user) {
      console.error(`[API CompleteProfile] User not found in DB for ID: ${userId}`);
      await mongooseSession.abortTransaction();
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // 4. Check if profile is already linked or complete
    if (user.profile || user.profileComplete) {
      console.warn(`[API CompleteProfile] User ID ${userId} already has profile linked (${user.profile}) or marked complete (${user.profileComplete}). Aborting.`);
      await mongooseSession.abortTransaction();
      return NextResponse.json({ message: "Profile already exists or is complete for this user." }, { status: 409 });
    }

    // 5. Create the UserProfile document
    console.log(`[API CompleteProfile] Creating UserProfile document for user ID: ${userId}`);
    const newUserProfile = new UserProfile({
      user: user._id, // Link to the user
      employeeNumber: employeeNumber.trim(),
      workPosition: workPosition.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthdate: new Date(birthdate), // Convert string date to Date object
      team: team.trim(),
      sex, // Already validated
    });

    await newUserProfile.save({ session: mongooseSession });
    console.log(`[API CompleteProfile] UserProfile created for user ID ${userId} with Profile ID: ${newUserProfile._id}`);

    // 6. Update the User document
    console.log(`[API CompleteProfile] Updating User document for ID: ${userId}`);
    user.profile = newUserProfile._id as mongoose.Types.ObjectId; // Link the profile ID
    user.profileComplete = true; // Mark profile as complete
    user.name = `${firstName.trim()} ${lastName.trim()}`; // Update user's name

    // --- REMOVED Status Update Logic ---
    // The user's status ('pending' or 'approved') should have been set correctly
    // during user creation by the pre-save hook in the User model.
    // We avoid overriding that status here.
    // if (userEmail.endsWith("@aretex@gmail.com")) { ... } else if (...) { ... } // REMOVED

    await user.save({ session: mongooseSession });
    // Log the status that was saved (which should be the one set previously)
    console.log(`[API CompleteProfile] User document updated for ID ${userId}: profile linked, profileComplete=true. Status remains: ${user.status}`);

    // --- Commit Transaction ---
    await mongooseSession.commitTransaction();
    console.log(`[API CompleteProfile] Transaction committed successfully for user ID: ${userId}`);

    // --- Trigger Session Update (Optional but recommended for JWT strategy) ---
    // This helps signal NextAuth to refresh the JWT on the next request,
    // ensuring the middleware gets the updated `profileComplete` flag sooner.
    // if (typeof updateSession === 'function') {
    //   await updateSession(req); // Call if you have the helper function
    // }

    // Determine the response message based on the user's *current* status
    const finalMessage = user.status === 'pending'
      ? "Profile completed successfully! Waiting for admin approval."
      : "Profile completed successfully!";

    return NextResponse.json(
      {
        message: finalMessage,
        userStatus: user.status // Optionally return the status to the client
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`[API CompleteProfile] Error during profile completion for user ID ${userId}:`, error);

    // --- Abort Transaction on error ---
    if (mongooseSession.inTransaction()) {
      console.log(`[API CompleteProfile] Aborting transaction due to error for user ID: ${userId}`);
      await mongooseSession.abortTransaction();
    }

    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json({ message: "Validation failed", errors: messages }, { status: 400 });
    }

    if (error.code === 11000) {
      console.error(`[API CompleteProfile] Duplicate key error for user ID ${userId}:`, error.keyValue);
      // Check which field caused the duplicate error (likely employeeNumber from UserProfile)
      const field = Object.keys(error.keyValue)[0];
      return NextResponse.json({ message: `Duplicate data error. The ${field} might already be in use.`, field: error.keyValue }, { status: 409 });
    }

    return NextResponse.json({ message: "Server error during profile completion." }, { status: 500 });
  } finally {
    // --- End Session ---
    console.log(`[API CompleteProfile] Ending session for user ID: ${userId}`);
    mongooseSession.endSession();
  }
}
