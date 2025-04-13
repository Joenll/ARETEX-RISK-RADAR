import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import mongoose, { Types } from "mongoose"; // Import 'Types'

export async function POST(req: Request) {
  // --- Optional: Start a Mongoose Session for Transaction ---
  // const session = await mongoose.startSession();
  // session.startTransaction();

  try {
    await connectDB();
    const {
      email,
      password,
      badgeNumber,
      rank,
      firstName,
      lastName,
      birthdate,
      department,
      // role is intentionally ignored from input, forced to 'user'
    } = await req.json();

    // --- Input Validation (Basic) ---
    if (!email || !password || !firstName || !lastName || !badgeNumber || !rank || !birthdate || !department) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // --- Check if user already exists ---
    const existingUser = await User.findOne({ email }/*, { session }*/); // Pass session if using transactions
    if (existingUser) {
      return NextResponse.json({ message: "User already exists with this email" }, { status: 409 }); // 409 Conflict is more specific
    }

    // --- Hash password ---
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Prepare documents in memory ---
    const newUser = new User({
      email,
      password: hashedPassword,
      role: 'user', // Force role to 'user'
      status: 'pending', // Default status from schema, but can be explicit
      // profile will be assigned below
    });

    const newUserProfile = new UserProfile({
      user: newUser._id, // Link to the user instance's ID
      badgeNumber,
      rank,
      firstName,
      lastName,
      birthdate,
      department,
    });

   
    // --- Assign the profile ID back to the user instance ---
newUser.profile = newUserProfile._id as mongoose.Types.ObjectId; // Add type assertion


    // --- Save documents (within transaction if using sessions) ---
    // Use Promise.all for concurrent saving, or save sequentially if preferred
    // If using transactions, pass the { session } option to save operations

    // 1. Save UserProfile
    await newUserProfile.save(/*{ session }*/);

    // 2. Save User (now that profile ID is assigned)
    await newUser.save(/*{ session }*/);


    // --- Optional: Commit Transaction ---
    // await session.commitTransaction();

    return NextResponse.json(
      { message: "User registered successfully! Awaiting admin approval." },
      { status: 201 }
    );

  } catch (error: any) {
    // --- Optional: Abort Transaction on error ---
    // if (session && session.inTransaction()) {
    //   await session.abortTransaction();
    // }

    console.error("Error registering user:", error);

    // Handle specific Mongoose validation errors more gracefully
    if (error instanceof mongoose.Error.ValidationError) {
      // Extract meaningful messages from validation errors
      const messages = Object.values(error.errors).map(e => e.message);
      return NextResponse.json({ message: "Validation failed", errors: messages }, { status: 400 });
    }
    // Handle duplicate key errors (e.g., if email check somehow failed)
    if (error.code === 11000) {
       return NextResponse.json({ message: "Duplicate key error.", field: error.keyValue }, { status: 409 });
    }

    return NextResponse.json({ message: "Server error during registration." }, { status: 500 });
  } finally {
    // --- Optional: End Session ---
    // if (session) {
    //   session.endSession();
    // }
  }
}
