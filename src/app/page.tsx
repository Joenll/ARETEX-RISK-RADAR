// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from 'next/link';
import { FcGoogle } from "react-icons/fc";
import Button from "./components/Button";
import StartupHeader from "./components/StarupHeader";
import Swal from 'sweetalert2'; // Import SweetAlert2

export default function SignInPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showSignInForm, setShowSignInForm] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Helper function for the pending approval alert ---
  const showPendingApprovalAlert = () => {
    Swal.fire({
      icon: 'info',
      title: 'Pending Approval',
      text: 'Your account is waiting for admin approval. Please check back later.',
      confirmButtonColor: '#3085d6',
    });
    // Also set the text error state for consistency
    setError("Your account is pending admin approval.");
  };
  // --- End Helper ---

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      console.log("SignInPage: Detected error query param:", errorParam);
      if (errorParam === "CredentialsSignin") {
        setError("Invalid email or password.");
        // Optionally show Swal for credentials error here too, if desired
        // Swal.fire({ icon: 'error', title: 'Oops...', text: 'Invalid email or password!' });
      } else if (errorParam === "Account not approved") {
        // --- Show SweetAlert for pending approval from URL param ---
        showPendingApprovalAlert();
        // --- End SweetAlert ---
      } else if (errorParam === "Callback") {
        setError("There was an issue during the login process. Please try again.");
      } else if (errorParam === "OAuthAccountNotLinked") {
        setError("This email is already associated with an account created using a different method. Try logging in with your original method.");
        Swal.fire({
          icon: 'warning',
          title: 'Account Exists',
          text: 'This email is already associated with an account created using a different method (e.g., email/password). Please log in using that method.',
        });
      } else {
        setError("An unexpected login error occurred.");
        console.error("Login page error param:", errorParam);
      }
    }
  }, [searchParams]); // Removed showPendingApprovalAlert from dependencies

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
      const finalCallbackUrl = "/";
      console.log(`SignInPage: Attempting credentials signIn, callbackUrl: ${finalCallbackUrl}`);

      // Use redirect: false to handle the response directly here
      const response = await signIn("credentials", {
        email: email,
        password: password,
        redirect: false, // Handle response here instead of auto-redirect
        // callbackUrl: finalCallbackUrl, // Less relevant with redirect: false
      });

      console.log("SignInPage: signIn response:", response);

      if (response?.error) {
        console.error("Sign-in failed:", response.error);
        // Check for specific errors and show alerts
        if (response.error === "CredentialsSignin") {
            setError("Invalid email or password.");
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: 'Invalid email or password!',
            });
        } else if (response.error === "Account not approved") {
            // --- Show SweetAlert for pending approval from direct response ---
            showPendingApprovalAlert();
            // --- End SweetAlert ---
        } else {
            // Handle other errors
            setError("Login failed. Please try again.");
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: 'An unexpected error occurred during login.',
            });
        }
        setIsLoading(false); // Stop loading on error
      } else if (response?.ok && !response.error && response.url) {
        // Successful sign-in when redirect: false, manually redirect
        console.log("SignInPage: Credentials sign in successful, redirecting...");
        // Use the URL provided in the response, or fall back to finalCallbackUrl
        // The response URL might already incorporate middleware redirects
        router.push(response.url || finalCallbackUrl);
        // router.refresh(); // Might be needed in some scenarios
      } else {
         // Handle unexpected response structure
         console.error("Unexpected signIn response:", response);
         setError("An unexpected issue occurred during login.");
         Swal.fire({ icon: 'error', title: 'Error', text: 'An unexpected issue occurred.' });
         setIsLoading(false);
      }

    } catch (err) {
      console.error("Exception during credentials sign in:", err);
      setError("An exception occurred during sign in.");
      Swal.fire({ icon: 'error', title: 'Error', text: 'An exception occurred during sign in.' });
      setIsLoading(false);
    }
    // Removed setIsLoading(false) from here, moved into specific error/success paths
  }

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      const finalCallbackUrl = "/";
      console.log(`SignInPage: Attempting Google signIn, callbackUrl: ${finalCallbackUrl}`);

      // For OAuth, usually let NextAuth handle redirects (redirect: true is default)
      // Errors might still be caught if they happen before the redirect flow starts
      // or if the callback URL includes an error parameter.
      const response = await signIn("google", {
        callbackUrl: finalCallbackUrl,
        // redirect: false, // Usually not needed for OAuth, but keep error handling below
      });

      // This part might only be reached if redirect: false is used,
      // or if an immediate error occurs before the external redirect.
      if (response?.error) {
        console.error("Google Sign in failed:", response.error);
        if (response.error === "Account not approved") {
            // --- Show SweetAlert for pending approval from direct response ---
            showPendingApprovalAlert();
            // --- End SweetAlert ---
        } else if (response.error === "OAuthAccountNotLinked") {
            setError("This email is already associated with an account created using a different method. Try logging in with your original method.");
            Swal.fire({
              icon: 'warning',
              title: 'Account Exists',
              text: 'This email is already associated with an account created using a different method (e.g., email/password). Please log in using that method.',
            });
        } else {
            setError("Google Sign-In failed. Please try again.");
             Swal.fire({
                icon: 'error',
                title: 'Google Sign-In Failed',
                text: 'Could not sign in with Google. Please try again.',
            });
        }
        setIsGoogleLoading(false);
      }
      // If redirect: true (default), successful Google sign-in will navigate away.

    } catch (err) {
      console.error("Exception during Google sign in:", err);
      setError("An exception occurred during Google Sign-In.");
      Swal.fire({ icon: 'error', title: 'Error', text: 'An exception occurred during Google Sign-In.' });
      setIsGoogleLoading(false);
    }
    // No need for setIsGoogleLoading(false) here if the page redirects on success
  };

  return (
    <StartupHeader>
      <div className={`relative flex flex-grow items-center ${showSignInForm ? 'justify-start' : 'justify-center'} w-full overflow-hidden px-4 sm:px-8 py-8 md:py-16`}>
        {/* Landing Page Content (when showSignInForm is false) */}
        {!showSignInForm ? (
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
          // Sign In Form (when showSignInForm is true)
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

            {/* OR Separator */}
            <div className="flex items-center w-full mb-6">
              <hr className="flex-grow border-gray-300" />
              <span className="px-4 text-gray-500 text-sm">or</span>
              <hr className="flex-grow border-gray-300" />
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="w-full">
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="w-full px-4 py-2.5 mb-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                required
                disabled={isLoading || isGoogleLoading}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="w-full px-4 py-2.5 mb-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                required
                disabled={isLoading || isGoogleLoading}
              />
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

            {/* General Error Display Area */}
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
            {/* Back Button */}
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
