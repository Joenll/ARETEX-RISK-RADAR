import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";

export async function POST(req: Request) {
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
      role, //  This can be omitted during registration
    } = await req.json();

    //  Force role to "user" for self-registration
    const userRole = "user"; 

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User first (without profile)
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: userRole, //  Enforcing "user" role
    });

    // Create UserProfile and link it to the created User
    const userProfile = await UserProfile.create({
      user: newUser._id,
      badgeNumber,
      rank,
      firstName,
      lastName,
      birthdate,
      department,
    });

    // Update the User to link the profile
    newUser.profile = userProfile._id;
    await newUser.save();

    return NextResponse.json(
      { message: "User registered successfully!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
