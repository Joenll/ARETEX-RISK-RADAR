import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import UserProfile, { IUserProfile, UserSex } from "@/models/UserProfile"; // Import IUserProfile if needed
import Notification from "@/models/Notification"; // Import the Notification model
import mongoose, { Types } from "mongoose";
// Import only the necessary email function
import { sendStatusUpdateEmail } from "@/lib/email";
interface RegisterRequestBody {
  email?: string;
  password?: string;
  employeeNumber?: string;
  workPosition?: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  team?: string;
  sex?: UserSex;
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const passwordRequirementsMessage = "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).";

export async function POST(req: Request) {
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
      sex,
    }: RegisterRequestBody = await req.json();

    // --- Input Validation ---
    if (!email || !password || !firstName || !lastName || !employeeNumber || !workPosition || !birthdate || !team || !sex) {
      const missingFields = [
        !email && "email",
        !password && "password",
        !firstName && "firstName",
        !lastName && "lastName",
        !employeeNumber && "employeeNumber",
        !workPosition && "workPosition",
        !birthdate && "birthdate",
        !team && "team",
        !sex && "sex",
      ]
        .filter(Boolean)
        .join(", ");
      return NextResponse.json({ message: `Missing required fields: ${missingFields}` }, { status: 400 });
    }

    const validSexValues: UserSex[] = ["Male", "Female"];
    if (!validSexValues.includes(sex)) {
      return NextResponse.json({ message: `Invalid value provided for sex. Must be one of: ${validSexValues.join(", ")}` }, { status: 400 });
    }

    if (!passwordRegex.test(password)) {
      return NextResponse.json({ message: passwordRequirementsMessage }, { status: 400 });
    }

    // --- Check if user already exists ---
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists with this email" }, { status: 409 });
    }

    // --- Hash password ---
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Prepare documents ---
    const newUser = new User({
      email,
      password: hashedPassword,
      role: "user",
      status: "pending", // Default to pending
      profileComplete: true, // Set profileComplete to true since all fields are provided
    });

    const newUserProfile = new UserProfile({
      user: newUser._id,
      employeeNumber,
      workPosition,
      firstName,
      lastName,
      birthdate: new Date(birthdate), // Convert birthdate to Date object
      team,
      sex,
    });

    // --- Link profile to user ---
    newUser.profile = newUserProfile._id as mongoose.Types.ObjectId;

    // --- Save documents ---
    await newUserProfile.save();
    await newUser.save();

    // --- Create Admin Notification in DB ---
    try {
        const adminNotification = new Notification({
            recipientRole: 'admin', // Target all admins
            type: 'new_user_pending',
            message: `New user registered: ${newUser.email} (${newUserProfile.firstName} ${newUserProfile.lastName}) is awaiting approval.`,
            link: '/ui/admin/user-management', // Link to user management page (adjust if needed)
            isRead: false,
        });
        await adminNotification.save();
    } catch (notificationError) {
        console.error(`Failed to create admin notification for new user ${newUser.email}:`, notificationError);
        // Log error, but don't fail the registration
    }

    // --- Send Email Notification to Admins ---
    try {
        const admins = await User.find({ role: 'admin' }).select('email').lean(); // Find admin emails
        if (admins.length > 0) {
            const subject = "New User Registration Pending Approval";
            const textBody = `A new user has registered and requires approval.\n\nEmail: ${newUser.email}\nName: ${newUserProfile.firstName} ${newUserProfile.lastName}\nEmployee #: ${newUserProfile.employeeNumber}\n\nPlease review their account in the admin panel: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/ui/admin/user-management`; // Adjust link/body as needed
            // Consider an HTML version as well for better formatting if your sendStatusUpdateEmail supports it

            for (const admin of admins) {
                try {
                    // Assuming sendStatusUpdateEmail takes (recipientEmail, subject, textBody)
                    // Adjust parameters based on your actual function definition in @/lib/email
                    await sendStatusUpdateEmail(admin.email, null, 'pending');
                } catch (emailError) {
                    console.error(`Failed to send new user notification email to admin ${admin.email}:`, emailError);
                    // Log error for individual admin, but continue trying others
                }
            }
        }
    } catch (adminQueryError) {
        console.error(`Failed to query admins for email notification regarding new user ${newUser.email}:`, adminQueryError);
        // Log error, but don't fail the registration
    }

    // --- Send Pending Approval Email to User ---
    try {
        const subject = "Your Aretex Risk Radar Account is Pending Approval";
        const textBody = `Hello ${newUserProfile.firstName},\n\nThank you for registering for Aretex Risk Radar.\n\nYour account (${newUser.email}) has been created successfully but requires administrator approval before you can log in.\n\nYou will receive another notification once your account is approved.\n\nBest regards,\nThe Aretex Team`;
        // Adjust parameters based on your actual function definition in @/lib/email
        await sendStatusUpdateEmail(newUser.email, newUserProfile.firstName, 'pending');
    } catch (userEmailError) {
        console.error(`Failed to send pending approval email to new user ${newUser.email}:`, userEmailError);
        // Log error, but don't fail the overall registration process
    }

    // --- Send Email Notification to Admins ---
    // (Keep the existing admin notification logic here)
    // ... (rest of the admin email sending code) ...

    return NextResponse.json(
      { message: "User registered successfully! Awaiting admin approval." },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error registering user:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json({ message: "Validation failed", errors: messages }, { status: 400 });
    }
    if (error.code === 11000) {
      return NextResponse.json({ message: "Duplicate key error.", field: error.keyValue }, { status: 409 });
    }

    return NextResponse.json({ message: "Server error during registration." }, { status: 500 });
  }
}