// src/app/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { FcGoogle } from "react-icons/fc"; // Import Google icon
import Button from "./components/Button";
import StartupHeader from "./components/StarupHeader"; // Ensure correct path/name
// import Image from 'next/image';

export default function SignInPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Loading state for Google Sign-In
  const [showSignInForm, setShowSignInForm] = useState(false);
  const router = useRouter();

  // --- Credentials Sign-In Handler (Remains the same) ---
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true); // Start credentials loading

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    if (!email || !password) {
        setError("Please enter both email and password.");
        setIsLoading(false);
        return;
    }

    try {
        const response = await signIn("credentials", {
          email: email,
          password: password,
          redirect: false
        });

        if (response?.error) {
          if (response.error === "CredentialsSignin") {
             setError("Invalid email or password.");
          } else if (response.error === "Account not approved") {
             setError("Your account is pending admin approval.");
          } else {
             setError("An unexpected error occurred during sign in.");
             console.error("Sign in error:", response.error);
          }
        } else if (response?.ok && !response?.error) {
          router.replace("/ui/dashboard");
          return;
        } else {
           setError("Sign in failed. Please try again.");
        }
    } catch (err) {
        console.error("Exception during sign in:", err);
        setError("An exception occurred during sign in.");
    } finally {
        setIsLoading(false); // Stop credentials loading
    }
  }

  // --- Google Sign-In Handler (Remains the same) ---
  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true); // Start Google loading
    try {
      // Use next-auth signIn function for Google provider
      const response = await signIn("google", { redirect: false, callbackUrl: "/ui/dashboard" });
       if (response?.error) {
            // Handle potential errors from Google sign-in (e.g., popup closed, config error)
            setError("Google Sign-In failed. Please try again or use email/password.");
            console.error("Google Sign in error:", response.error);
            setIsGoogleLoading(false);
        }
    } catch (err) {
      console.error("Exception during Google sign in:", err);
      setError("An exception occurred during Google Sign-In.");
      setIsGoogleLoading(false); // Stop Google loading on exception
    }
  };


  return (
    <StartupHeader>
      {/* Main content container: Justify center for hero, justify start for form */}
      <div className={`relative flex flex-grow items-center ${showSignInForm ? 'justify-start' : 'justify-center'} w-full overflow-hidden px-4 sm:px-8 py-8 md:py-16`}>

        {!showSignInForm ? (
          // --- Hero Section (Centered) ---
          <div className="relative flex flex-col md:flex-row items-center justify-between w-full max-w-7xl z-10">
            <div className="max-w-lg text-center md:text-left mb-10 md:mb-0 md:mr-10">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 leading-tight">
                Stay ahead of potential threats with{" "}
                <span className="inline-block align-middle relative -translate-y-1">
                  <img
                    src="/aretex.png"
                    alt="Aretex Logo"
                    className="h-7 lg:h-9 inline-block align-middle mb-3"
                  />
                </span>{" "}
                <span className="text-red-500">Risk</span>{" "}
                <span className="text-gray-800">Radar</span>
              </h1>
              <p className="mt-4 text-gray-600">
                Making Aretex family safe by Predicting and Mapping High-Risk Areas
                Using Spatiotemporal Data Trends
              </p>
              <Button
                variant="primary"
                className="mt-6 px-6 py-3 font-semibold rounded-lg shadow-md"
                onClick={() => setShowSignInForm(true)}
                disabled={isLoading || isGoogleLoading}
              >
                Get Started
              </Button>
            </div>
          </div>

        ) : (

          // --- Sign-In Form Elements (Left-aligned, no card) ---
          // Removed bg-white, p-8, rounded-lg, shadow-xl
          <div className="z-10 max-w-md w-full">
            {/* These elements will now appear directly on the StartupHeader background */}
            {/* Consider adjusting text colors if they don't contrast well */}
            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Hi there!</h2>
            <p className="text-gray-600 text-sm mb-6 text-center">
              Enter your credentials to access your account
            </p>

            {/* Google Sign In Button */}
            <Button
              variant="outline"
              // Adjusted style slightly for better visibility without card background
              className="w-full flex items-center justify-center px-4 py-2.5 bg-white text-gray-800 font-medium rounded-xl shadow-sm hover:bg-gray-50 mb-6 border border-gray-300"
              onClick={handleGoogleSignIn}
              isLoading={isGoogleLoading}
              disabled={isLoading || isGoogleLoading}
            >
              <FcGoogle className={`text-xl mr-2 ${isGoogleLoading ? 'opacity-0' : ''}`} />
              Sign in with Google
            </Button>

            {/* Divider */}
            <div className="flex items-center w-full mb-6">
              {/* Consider making HR darker if needed */}
              <hr className="flex-grow border-gray-300" />
              <span className="px-4 text-gray-500 text-sm">or</span>
              <hr className="flex-grow border-gray-300" />
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="w-full">
              {/* Email Input */}
              <input
                type="email"
                name="email"
                placeholder="Email"
                // Added bg-white for input visibility
                className="w-full px-4 py-2.5 mb-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                required
                disabled={isLoading || isGoogleLoading}
              />

              {/* Password Input */}
              <input
                type="password"
                name="password"
                placeholder="Password"
                 // Added bg-white for input visibility
                className="w-full px-4 py-2.5 mb-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                required
                disabled={isLoading || isGoogleLoading}
              />

              {/* Forgot Password Link */}
              <div className="flex justify-end mb-6">
                <Link
                  href="/forgot-password"
                  className={`text-blue-600 text-sm hover:underline ${isLoading || isGoogleLoading ? 'pointer-events-none opacity-50' : ''}`}
                  aria-disabled={isLoading || isGoogleLoading}
                  tabIndex={isLoading || isGoogleLoading ? -1 : undefined}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full px-4 py-2.5 font-semibold rounded-xl shadow-md mb-4"
                isLoading={isLoading}
                disabled={isLoading || isGoogleLoading}
              >
                Log in
              </Button>
            </form>

            {/* Error Message Display */}
            {error && <p className="mt-4 text-center text-sm text-red-600 bg-red-100 p-2 rounded">{error}</p>} {/* Added background for visibility */}

            {/* Sign Up Link */}
            <p className="mt-4 text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/registration"
                 className={`text-blue-600 hover:underline ${isLoading || isGoogleLoading ? 'pointer-events-none opacity-50' : ''}`}
                 aria-disabled={isLoading || isGoogleLoading}
                 tabIndex={isLoading || isGoogleLoading ? -1 : undefined}
              >
                Sign up
              </Link>
            </p>
             {/* Option to go back to Hero */}
             <Button
                variant="back"
                onClick={() => {
                    if (!isLoading && !isGoogleLoading) {
                        setShowSignInForm(false);
                        setError("");
                    }
                }}
                className="mt-4 w-full"
                disabled={isLoading || isGoogleLoading}
            >
                Back
            </Button>
          </div>
        )}
      </div>
    </StartupHeader>
  );
}
