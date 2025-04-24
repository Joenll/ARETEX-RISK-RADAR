import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
// Import UserSex type along with UserProfile
import UserProfile, { UserSex } from "@/models/UserProfile";
import mongoose, { Types } from "mongoose"; // Import 'Types'

// Define the expected request body structure
interface RegisterRequestBody {
  email?: string;
  password?: string;
  employeeNumber?: string;
  workPosition?: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string; // Assuming birthdate comes as string initially
  team?: string;
  sex?: UserSex; // Add sex field
}

// --- Password Complexity Regex ---
// Example: At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const passwordRequirementsMessage = "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).";

export async function POST(req: Request) {
  // --- Optional: Start a Mongoose Session for Transaction ---
  // const session = await mongoose.startSession();
  // session.startTransaction();

  try {
    await connectDB();
    const {
      email,
      password,
      employeeNumber,
      workPosition,
      firstName,
      lastName,
      birthdate,
      team,
      sex, // Destructure sex
      // role is intentionally ignored from input, forced to 'user'
    }: RegisterRequestBody = await req.json();

    // --- Input Validation (Basic Required Fields) ---
    if (!email || !password || !firstName || !lastName || !employeeNumber || !workPosition || !birthdate || !team || !sex) {
      const missingFields = [
        !email && 'email',
        !password && 'password',
        !firstName && 'firstName',
        !lastName && 'lastName',
        !employeeNumber && 'employeeNumber',
        !workPosition && 'workPosition',
        !birthdate && 'birthdate',
        !team && 'team',
        !sex && 'sex'
      ].filter(Boolean).join(', ');
      return NextResponse.json({ message: `Missing required fields: ${missingFields}` }, { status: 400 });
    }

    // --- Validate sex value against enum ---
    const validSexValues: UserSex[] = ['Male', 'Female'];
    if (!validSexValues.includes(sex)) {
        return NextResponse.json({ message: `Invalid value provided for sex. Must be one of: ${validSexValues.join(', ')}` }, { status: 400 });
    }

    // --- NEW: Password Complexity Validation ---
    if (!passwordRegex.test(password)) {
        return NextResponse.json({ message: passwordRequirementsMessage }, { status: 400 });
    }
    // --- END: Password Complexity Validation ---

    // --- Check if user already exists ---
    const existingUser = await User.findOne({ email }/*, { session }*/);
    if (existingUser) {
      return NextResponse.json({ message: "User already exists with this email" }, { status: 409 });
    }

    // --- Hash password ---
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Prepare documents in memory ---
    const newUser = new User({
      email,
      password: hashedPassword,
      role: 'user',
      status: 'pending',
    });

    const newUserProfile = new UserProfile({
      user: newUser._id,
      employeeNumber,
      workPosition,
      firstName,
      lastName,
      birthdate,
      team,
      sex,
    });

    // --- Assign the profile ID back to the user instance ---
    newUser.profile = newUserProfile._id as mongoose.Types.ObjectId;

    // --- Save documents ---
    // 1. Save UserProfile
    await newUserProfile.save(/*{ session }*/);
    // 2. Save User
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

    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map(e => e.message);
      return NextResponse.json({ message: "Validation failed", errors: messages }, { status: 400 });
    }
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
