// c:/projects/Next-js/crimeatlas/src/app/forgot-password/page.tsx
'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter
import Button from '@/app/components/Button'; // Assuming Button component exists
import Swal from 'sweetalert2';
import StartupHeader from '@/app/components/StartupHeader'; // Import StartupHeader

// Updated input style to match the provided UI
const inputFieldStyles = "w-full px-4 py-2 mb-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (!email.trim()) { // Check trimmed email
      Swal.fire('Missing Email', 'Please enter your email address.', 'warning');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send reset instructions.');
      }

      Swal.fire({
        icon: 'success',
        title: 'Check Your Email',
        text: 'If an account with that email exists, password reset instructions have been sent.',
        timer: 3000,
        showConfirmButton: false,
      });
      setEmail(''); // Clear email field on success

    } catch (error: any) {
      console.error('Forgot Password Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Request Failed',
        text: error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Wrap with StartupHeader for consistent layout
    <StartupHeader>
      {/* Main Section - Ensure left alignment */}
      <main className="relative flex flex-col md:flex-row items-start justify-start w-full max-w-7xl px-8 py-16"> {/* Use px-8 from snippet */}
        {/* Forgot Password Message Box */}
        <div className="z-10 bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center border border-gray-200">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Forgot Password?
          </h2>
          <p className="text-gray-600 mb-4 flex items-center justify-center">
            No worries we’ll send you reset instructions{" "}
            <img src="/key.jpg" alt="Key Icon" className="h-5 ml-2" /> {/* Ensure key.jpg is in public folder */}
          </p>
          <p className="text-gray-600 mb-6">
            Enter the email address of your account and we’ll send confirmation
            to reset your password.
          </p>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className={inputFieldStyles}
              disabled={isLoading}
            />
            {/* Use Button component for consistency */}
            <Button type="submit" variant="primary" className="w-full rounded-full mb-4" isLoading={isLoading} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </Button> {/* Changed text from Back to Send Reset Instructions */}
            <Link href="/" className="w-full px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-full shadow-sm hover:bg-gray-300 block text-center">
              Back to Login
            </Link>
          </form>
        </div>
      </main>
    </StartupHeader>
  );
}
