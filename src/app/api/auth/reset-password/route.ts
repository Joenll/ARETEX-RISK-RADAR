// c:/projects/Next-js/crimeatlas/src/app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb'; // Ensure this path is correct
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// Password Complexity Regex (should match the one on the frontend)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export async function POST(request: Request) {
  await connectDB(); // Using the updated import

  try {
    const { token, newPassword } = await request.json();

    // --- Input Validation ---
    if (!token) {
      return NextResponse.json({ message: 'Reset token is required.' }, { status: 400 });
    }
    if (!newPassword) {
      return NextResponse.json({ message: 'New password is required.' }, { status: 400 });
    }
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json({ message: 'Password does not meet complexity requirements.' }, { status: 400 });
    }

    // --- Find User by Token and Check Expiry ---
    // Find user where the token matches AND the expiry date is still in the future ($gt: Date.now())
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password +resetPasswordToken +resetPasswordExpires'); // Explicitly select the token and expiry fields

    if (!user) {
      // Token is invalid, expired, or doesn't exist
      return NextResponse.json({ message: 'Password reset token is invalid or has expired.' }, { status: 400 });
    }

    // --- Hash New Password ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // --- Update User Document ---
    user.password = hashedPassword;
    user.resetPasswordToken = undefined; // Clear the token
    user.resetPasswordExpires = undefined; // Clear the expiry date
    // Optionally, mark profile as complete if they reset password after initial setup
    // user.profileComplete = true;

    await user.save();

    console.log(`Password successfully reset for user: ${user.email}`);

    // --- Send Confirmation Email (Optional) ---
    // try {
    //   await sendPasswordChangeConfirmationEmail(user.email); // You would need to create this function in email.ts
    // } catch (emailError) {
    //   console.error("Failed to send password change confirmation email:", emailError);
    //   // Log but don't fail the request
    // }

    return NextResponse.json({ message: 'Password has been reset successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Reset Password API Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
