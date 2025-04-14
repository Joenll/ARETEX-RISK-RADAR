// src/app/registration/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import Button from "../components/Button"; // Adjust path if needed
import StartupHeader from "../components/StarupHeader"; // Adjust path if needed

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Optional: if implementing Google registration
  const router = useRouter();

  // --- Credentials Registration Handler (Remains the same) ---
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    // --- Validation (Basic Example) ---
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setIsLoading(false);
        return;
    }
    // Add more validation as needed (e.g., password complexity)

    const data = {
      email: formData.get("email"),
      password: password,
      role: "user",
      badgeNumber: formData.get("badgeNumber"),
      rank: formData.get("rank"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      birthdate: formData.get("birthdate"),
      department: formData.get("department"),
    };

    console.log("Submitting registration data:", data);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSuccess("Registration successful! Redirecting to sign in...");
        setTimeout(() => router.push("/"), 2000);
      } else {
        const resData = await response.json();
        setError(resData.error || "Registration failed. Please try again.");
        console.error("Registration error:", resData);
      }
    } catch (err) {
        console.error("Exception during registration:", err);
        setError("An unexpected error occurred during registration.");
    } finally {
        setIsLoading(false);
    }
  }

  // --- Google Sign-In/Registration Handler (Placeholder - Remains the same) ---
  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError("Google registration is not yet implemented.");
    setTimeout(() => setIsGoogleLoading(false), 1500);
  };

  return (
    <StartupHeader>
      {/* Main content area: Align content to the start (left) */}
      <div className="flex flex-grow items-center justify-start w-full px-4 sm:px-8 py-12 md:py-16">

        {/* Registration Form Elements (No Card Wrapper) */}
        {/* Removed bg-white, p-8, rounded-lg, shadow-md */}
        <div className="z-10 max-w-lg w-full">
          {/* Adjust text colors if needed for contrast */}
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Create an account
          </h2>
          <p className="text-gray-600 mb-6">
            Already have an account?{" "}
            <Link href="/" className="text-blue-600 hover:underline">
              Log in
            </Link>
          </p>

          {/* Registration Form */}
          <form onSubmit={handleSubmit}>
            {/* First Name / Last Name */}
            <div className="flex flex-col sm:flex-row sm:space-x-4 mb-4">
              <input
                type="text"
                name="firstName"
                placeholder="First name"
                className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 sm:mb-0 bg-white text-gray-800 placeholder:text-gray-800" // Added bg-white, text-gray-800, placeholder:text-gray-800, rounded-xl
                required
                disabled={isLoading || isGoogleLoading}
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 placeholder:text-gray-800" // Added bg-white, text-gray-800, placeholder:text-gray-800, rounded-xl
                required
                disabled={isLoading || isGoogleLoading}
              />
            </div>

            {/* Badge Number / Rank (Position) */}
            <div className="flex flex-col sm:flex-row sm:space-x-4 mb-4">
               <input
                type="text"
                name="badgeNumber"
                placeholder="Badge Number"
                className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 sm:mb-0 bg-white text-gray-800 placeholder:text-gray-800" // Added bg-white, text-gray-800, placeholder:text-gray-800, rounded-xl
                required
                disabled={isLoading || isGoogleLoading}
              />
              <input
                type="text"
                name="rank"
                placeholder="Rank / Position"
                className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 placeholder:text-gray-800" // Added bg-white, text-gray-800, placeholder:text-gray-800, rounded-xl
                required
                disabled={isLoading || isGoogleLoading}
              />
            </div>

             {/* Department / Birthdate */}
             <div className="flex flex-col sm:flex-row sm:space-x-4 mb-4">
               <input
                type="text"
                name="department"
                placeholder="Department"
                className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 sm:mb-0 bg-white text-gray-800 placeholder:text-gray-800" // Added bg-white, text-gray-800, placeholder:text-gray-800, rounded-xl
                required
                disabled={isLoading || isGoogleLoading}
              />
              <input
                type="date"
                name="birthdate"
                placeholder="Birthday"
                className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500 bg-white placeholder:text-gray-800" // Kept text-gray-500 for date, added bg-white, placeholder:text-gray-800, rounded-xl
                required
                disabled={isLoading || isGoogleLoading}
              />
            </div>

            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 placeholder:text-gray-800" // Added bg-white, text-gray-800, placeholder:text-gray-800, rounded-xl
              required
              disabled={isLoading || isGoogleLoading}
            />

            {/* Password */}
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 placeholder:text-gray-800" // Added bg-white, text-gray-800, placeholder:text-gray-800, rounded-xl
              required
              disabled={isLoading || isGoogleLoading}
            />
             {/* Confirm Password */}
             <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 placeholder:text-gray-800" // Added bg-white, text-gray-800, placeholder:text-gray-800, rounded-xl
              required
              disabled={isLoading || isGoogleLoading}
            />

            {/* Terms Checkbox (Optional) */}
            {/* ... */}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full px-4 py-2 font-semibold rounded-xl shadow-md hover:bg-blue-700 mb-4" // Changed to rounded-xl
              isLoading={isLoading}
              disabled={isLoading || isGoogleLoading}
            >
              Create account
            </Button>
          </form>

          {/* Error/Success Message Display */}
          {/* Added background for visibility */}
          {error && <p className="my-3 text-center text-sm text-red-600 bg-red-100 p-2 rounded-xl">{error}</p>}
          {success && <p className="my-3 text-center text-sm text-green-600 bg-green-100 p-2 rounded-xl">{success}</p>}


          {/* OR Divider */}
          <div className="flex items-center my-6">
            <hr className="flex-grow border-gray-300" />
            <span className="px-2 text-gray-500 text-sm">OR</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          {/* Google Sign In/Up Button */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center px-4 py-2 bg-white text-gray-800 font-semibold rounded-xl shadow-md hover:bg-gray-50 border border-gray-300" // Added bg-white, border, rounded-xl
            onClick={handleGoogleSignUp}
            isLoading={isGoogleLoading}
            disabled={isLoading || isGoogleLoading}
          >
            <FcGoogle className={`text-xl mr-2 ${isGoogleLoading ? 'opacity-0' : ''}`} />
            Sign up with Google
          </Button>
        </div>
      </div>
    </StartupHeader>
  );
}
