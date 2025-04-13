"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from 'next/link'; // Import Link for navigation

export default function SignInPage() {
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    // Basic validation (optional but recommended)
    if (!email || !password) {
        setError("Please enter both email and password.");
        return;
    }

    try {
        const response = await signIn("credentials", {
          email: email,
          password: password,
          redirect: false // Handle redirect manually based on response
        });

        if (response?.error) {
          // More specific error handling based on potential errors from authorize
          if (response.error === "CredentialsSignin") {
             setError("Invalid email or password.");
          } else if (response.error === "Account not approved") { // Anticipating approval logic
             setError("Your account is pending admin approval.");
          }
           else {
             setError("An unexpected error occurred during sign in.");
             console.error("Sign in error:", response.error); // Log unexpected errors
          }
        } else if (response?.ok && !response?.error) {
          // Use replace instead of push if you don't want the sign-in page in browser history
          router.replace("/ui/dashboard");
        } else {
          // Handle cases where response is null or not ok but no specific error
           setError("Sign in failed. Please try again.");
        }
    } catch (err) {
        console.error("Exception during sign in:", err);
        setError("An exception occurred during sign in.");
    }
  }

  return (
    // Centering container with padding
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
        {/* Card container */}
        <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-md sm:p-8">
            <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800">Sign In</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Email Input */}
                <div>
                    <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        required
                        className="w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>
                {/* Password Input */}
                <div>
                    <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        required
                        className="w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>
                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    Sign In
                </button>
            </form>

            {/* Error Message */}
            {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

            {/* Registration Link */}
            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    Don&apos;t have an account?{' '}
                    <Link
                        href="/registration" // Points to your registration page route
                        className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                    >
                        Register here
                    </Link>
                </p>
            </div>

            {/* Forgot Password Link */}
            <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                    <Link
                        href="/forgot-password" // Points to the future forgot password route
                        className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                    >
                        Forgot password?
                    </Link>
                </p>
            </div>
        </div>
    </div>
  );
}
