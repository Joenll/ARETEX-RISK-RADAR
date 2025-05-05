// c:/projects/Next-js/crimeatlas/src/app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email'; // Adjust path as needed

export async function POST(request: Request) {
  await connectDB();

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // IMPORTANT: Always return a success-like response even if the user doesn't exist
    // This prevents email enumeration attacks.
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      // Still return OK to the client
      return NextResponse.json({ message: 'If an account with that email exists, reset instructions have been sent.' }, { status: 200 });
    }

    // --- Generate Reset Token ---
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Consider hashing the token before saving for extra security:
    // const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // --- Set Token Expiry (e.g., 1 hour) ---
    const tokenExpiry = Date.now() + 3600000; // 1 hour in milliseconds

    // --- Update User Document ---
    user.resetPasswordToken = resetToken; // Store the plain token for the email link
    // user.resetPasswordToken = hashedToken; // Or store the hashed token
    user.resetPasswordExpires = new Date(tokenExpiry);

    await user.save();

    // --- Send Password Reset Email ---
    // Construct the reset URL (adjust domain as needed from .env)
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    console.log(`Password Reset URL for ${email}: ${resetUrl}`); // Log for debugging

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Log the error, but don't fail the request to the user
      // Optionally, you could try to revert the token save here, but it's complex
    }

    // Return success message
    return NextResponse.json({ message: 'If an account with that email exists, reset instructions have been sent.' }, { status: 200 });

  } catch (error) {
    console.error('Forgot Password API Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
