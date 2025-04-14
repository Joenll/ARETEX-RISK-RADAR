import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto'; // For generating the token
import bcrypt from 'bcryptjs'; // For hashing the token before storing
// You'll need an email sending utility. Let's assume you have one like this:
import { sendPasswordResetEmail } from '@/lib/email'; // Adjust path as needed

const RESET_TOKEN_EXPIRY_MINUTES = 60; // Set token expiry time (e.g., 60 minutes)

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
    }

    // 1. Find user by email (select the necessary fields for update)
    // We don't need to select the token fields here, Mongoose handles the update
    const user = await User.findOne({ email: email.toLowerCase() });

    // IMPORTANT: Always return a generic success message even if user not found
    // This prevents email enumeration attacks. Log internally if needed.
    if (!user) {
      console.log(`Forgot password request: User not found for email ${email}. Sending generic response.`);
      return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' }, { status: 200 });
    }

    // 2. Generate a secure, random token (user-facing)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 3. Hash the token before storing it in the database
    // NEVER store the plain resetToken directly in the DB
    const hashedToken = await bcrypt.hash(resetToken, 10); // Use same salt rounds as password

    // 4. Set expiry date for the token
    const resetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000); // Convert minutes to milliseconds

    // 5. Update the user document with the hashed token and expiry date
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // 6. Construct the password reset URL (using the *plain* token)
    // Ensure NEXT_PUBLIC_APP_URL is set in your .env file (e.g., http://localhost:3000 or your production domain)
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // 7. Send the email containing the reset URL
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
      console.log(`Password reset email sent successfully to ${user.email}`);
    } catch (emailError) {
      console.error(`Failed to send password reset email to ${user.email}:`, emailError);
      // Even if email fails, don't expose the error to the client.
      // Clear the token fields to allow the user to try again later without waiting for expiry.
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      // Return the generic success message
      return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' }, { status: 200 });
    }

    // 8. Return the generic success response
    return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' }, { status: 200 });

  } catch (error) {
    console.error('Forgot Password API Error:', error);
    // Return a generic server error message
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
