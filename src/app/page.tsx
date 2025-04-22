// src/app/page.tsx
"use client";

import { useState, useEffect } from "react"; // Added useEffect
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation"; // Added useSearchParams
import Link from 'next/link';
import { FcGoogle } from "react-icons/fc";
import Button from "./components/Button";
import StartupHeader from "./components/StarupHeader"; // Corrected typo: StartupHeader

export default function SignInPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showSignInForm, setShowSignInForm] = useState(false);
  const router = useRouter(); // Keep router if needed for other things
  const searchParams = useSearchParams(); // Hook to read URL query params

  // Handle errors passed back via URL params by NextAuth (when redirect: true)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      console.log("SignInPage: Detected error query param:", errorParam);
      if (errorParam === "CredentialsSignin") {
        setError("Invalid email or password.");
      } else if (errorParam === "Account not approved") { // Match error thrown in authorize
         setError("Your account is pending admin approval or has been rejected.");
      } else if (errorParam === "Callback") {
         setError("There was an issue during the login process. Please try again.");
      } else {
        setError("An unexpected login error occurred.");
        console.error("Login page error param:", errorParam);
      }
      // Clear the error query param from URL without reloading page (optional)
      // router.replace(pathname, undefined); // Requires getting pathname
    }
  }, [searchParams]); // Re-run when query params change


  // --- Credentials Sign-In Handler ---
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    if (!email || !password) {
        setError("Please enter both email and password.");
        setIsLoading(false);
        return;
    }

    try {
        // We want NextAuth to redirect to '/' initially after login.
        // Middleware will then handle the role-based redirect.
        const finalCallbackUrl = "/";
        console.log(`SignInPage: Attempting credentials signIn, redirecting to: ${finalCallbackUrl}`);

        // Use signIn with redirect: true (default) and callbackUrl: '/'
        const response = await signIn("credentials", {
          email: email,
          password: password,
          callbackUrl: finalCallbackUrl, // Tell NextAuth to go to '/' after success
          // redirect: true, // This is the default, no need to specify
        });

        // If signIn returns here with redirect: true, an error likely occurred *before* redirection.
        // NextAuth usually handles the error display by adding query params to the URL,
        // which the useEffect hook above should catch. This block is a fallback.
        if (response?.error) {
           console.error("Sign-in failed before redirect could happen:", response.error);
           // Set error based on response if not already set by URL param
           if (!error) { // Avoid overwriting specific error from URL param
               if (response.error === "CredentialsSignin") { setError("Invalid email or password."); }
               else if (response.error === "Account not approved") { setError("Your account is pending admin approval or has been rejected."); }
               else { setError("Login failed. Please try again."); }
           }
           setIsLoading(false); // Stop loading on pre-redirect error
        }
        // On successful sign-in with redirect: true, the browser navigates away.

    } catch (err) {
        console.error("Exception during credentials sign in:", err);
        setError("An exception occurred during sign in.");
        setIsLoading(false); // Stop loading on exception
    }
    // Don't set isLoading to false here if expecting successful redirect
  }

  // --- Google Sign-In Handler ---
  const handleGoogleSignIn = async () => {
    setError("Google registration is not yet implemented.");
    setIsGoogleLoading(true);
    try {
      // We want NextAuth to redirect to '/' initially after login.
      // Middleware will then handle the role-based redirect.
      const finalCallbackUrl = "/";
      console.log(`SignInPage: Attempting Google signIn, redirecting to: ${finalCallbackUrl}`);

      // Use signIn with redirect: true (default) and callbackUrl: '/'
      const response = await signIn("google", {
          callbackUrl: finalCallbackUrl,
          // redirect: true, // Default
      });

       // Handle potential errors before redirection (less common with OAuth)
       if (response?.error) {
            console.error("Google Sign in failed before redirect:", response.error);
            if (!error) {
                setError("Google Sign-In failed. Please try again.");
            }
            setIsGoogleLoading(false);
        }
    } catch (err) {
      console.error("Exception during Google sign in:", err);
      setError("An exception occurred during Google Sign-In.");
      setIsGoogleLoading(false);
    }
     // Don't set isLoading to false here if expecting successful redirect
  };


  return (
    // Using corrected component name: StartupHeader
    <StartupHeader>
      {/* Main content container */}
      <div className={`relative flex flex-grow items-center ${showSignInForm ? 'justify-start' : 'justify-center'} w-full overflow-hidden px-4 sm:px-8 py-8 md:py-16`}>

        {!showSignInForm ? (
          // --- Hero Section ---
          <div className="relative flex flex-col md:flex-row items-center justify-between w-full max-w-7xl z-10">
            <div className="max-w-lg text-center md:text-left mb-10 md:mb-0 md:mr-10">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 leading-tight">
                Stay ahead of potential threats with{" "}
                <span className="inline-block align-middle relative -translate-y-1">
                  <img src="/aretex.png" alt="Aretex Logo" className="h-7 lg:h-9 inline-block align-middle mb-3" />
                </span>{" "}
                <span className="text-red-500">Risk</span>{" "}
                <span className="text-gray-800">Radar</span>
              </h1>
              <p className="mt-4 text-gray-600">
                Making Aretex family safe by Predicting and Mapping High-Risk Areas Using Spatiotemporal Data Trends
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

          // --- Sign-In Form Elements ---
          <div className="z-10 max-w-md w-full">
            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Hi there!</h2>
            <p className="text-gray-600 text-sm mb-6 text-center">
              Enter your credentials to access your account
            </p>

            {/* Google Sign In Button */}
            <Button
              variant="outline"
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
                className="w-full px-4 py-2.5 mb-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                required
                disabled={isLoading || isGoogleLoading}
              />
              {/* Password Input */}
              <input
                type="password"
                name="password"
                placeholder="Password"
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
            {error && <p className="mt-4 text-center text-sm text-red-600 bg-red-100 p-2 rounded">{error}</p>}

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
                        setError(""); // Clear error when going back
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
