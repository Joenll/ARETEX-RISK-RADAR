// src/lib/email.ts
import nodemailer from 'nodemailer';
import { UserStatus } from '@/models/User'; // Import UserStatus type

// Configure the Nodemailer transport
// IMPORTANT: Use environment variables for sensitive data like passwords/API keys
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST, // e.g., 'smtp.gmail.com'
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587', 10), // e.g., 587 or 465
  secure: process.env.EMAIL_SERVER_SECURE === 'true', // true for 465, false for other ports (like 587 with STARTTLS)
  auth: {
    user: process.env.EMAIL_SERVER_USER, // Your email username
    pass: process.env.EMAIL_SERVER_PASSWORD, // Your email password or App Password/API Key
  },
  // Optional: Add TLS options if needed, e.g., for self-signed certs
  // tls: {
  //   rejectUnauthorized: false // Use with caution, only for development/testing
  // }
});

// Define the sender email address (should be configured in your .env)
const fromEmail = process.env.EMAIL_FROM || '"Your App Name" <noreply@example.com>';

/**
 * Sends a password reset email using Nodemailer.
 *
 * @param to The recipient's email address.
 * @param resetUrl The unique password reset URL for the user.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  console.log(`--- Attempting to send Password Reset Email to ${to} ---`);
  console.log(`To: ${to}`);
  console.log(`Reset URL: ${resetUrl}`);

  const mailOptions = {
    from: fromEmail,
    to: to, // Recipient email address
    subject: 'Reset Your Password',
    text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you did not request this, please ignore this email.`,
    html: `
      <p>You requested a password reset.</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}" target="_blank" rel="noopener noreferrer">${resetUrl}</a></p>
      <p>This link will expire in <strong>1 hour</strong>.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password Reset Email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    // Re-throw the error so the calling API route knows sending failed
    throw new Error('Failed to send password reset email.');
  }
}

/**
 * Sends an email notification about account status changes.
 *
 * @param to The recipient's email address.
 * @param name The recipient's name (optional).
 * @param status The new status of the account ('pending', 'approved', 'rejected').
 */
export async function sendStatusUpdateEmail(to: string, name: string | undefined | null, status: UserStatus): Promise<void> {
  console.log(`--- Attempting to send Status Update Email (${status}) to ${to} ---`);

  let subject = '';
  let htmlBody = '';
  const userName = name || 'User'; // Use 'User' if name is not available

  if (status === 'pending') {
    subject = 'Your Account Registration is Pending Review';
    htmlBody = `<p>Hello ${userName},</p><p>Thank you for registering. Your account is currently pending review by an administrator. We will notify you once your account status is updated.</p>`;
  } else if (status === 'approved') {
    subject = 'Your Account Has Been Approved!';
    htmlBody = `<p>Hello ${userName},</p><p>Congratulations! Your account registration has been approved. You can now log in and access all features.</p><p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" target="_blank">Log in here</a></p>`; // Use NEXTAUTH_URL for login link
  } else if (status === 'rejected') {
    subject = 'Account Registration Update';
    htmlBody = `<p>Hello ${userName},</p><p>We regret to inform you that your account registration could not be approved at this time. Please contact support if you believe this is an error.</p>`;
  } else {
    console.warn(`sendStatusUpdateEmail called with unknown status: ${status}`);
    return; // Don't send email for unknown status
  }

  const mailOptions = { from: fromEmail, to, subject, html: htmlBody };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Status Update Email (${status}) sent to ${to}: %s`, info.messageId);
  } catch (error) {
    console.error(`Error sending status update email (${status}) to ${to}:`, error);
    throw new Error(`Failed to send ${status} status update email.`);
  }
}