// src/app/registration/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import Button from "../components/Button"; // Adjust path if needed
import StartupHeader from "../components/StarupHeader"; // Adjust path if needed
import { UserSex } from "@/models/UserProfile"; // Adjust path if needed

// Define possible sex values for the dropdown
const sexOptions: UserSex[] = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false); // <-- State for the checkbox
  const router = useRouter();

  // Credentials Registration Handler
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    // --- Check if terms are agreed upon ---
    if (!agreeToTerms) {
        setError("You must agree to the Terms & Conditions to register.");
        return; // Stop submission if terms are not agreed
    }
    // --- End terms check ---

    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    // Validation
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");
    const sex = formData.get("sex");

    if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setIsLoading(false);
        return;
    }

    // --- Updated required fields check (using new names) ---
    if (!formData.get("email") || !password || !formData.get("firstName") || !formData.get("lastName") || !sex || !formData.get("employeeNumber") || !formData.get("workPosition") || !formData.get("team") || !formData.get("birthdate")) {
        setError('Please fill in all required fields.');
        setIsLoading(false);
        return;
    }
    // Add more specific validation as needed

    // --- Updated data object with new field names ---
    const data = {
      email: formData.get("email"),
      password: password,
      role: "user", // Default role
      employeeNumber: formData.get("employeeNumber"), // Renamed from badgeNumber
      workPosition: formData.get("workPosition"),     // Renamed from rank
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      birthdate: formData.get("birthdate"),
      team: formData.get("team"),                     // Renamed from department
      sex: sex,
      // You might optionally send agreeToTerms if your backend needs it
      // agreeToTerms: agreeToTerms
    };

    console.log("Submitting registration data:", data);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (response.ok) {
        setSuccess("Registration successful! Redirecting to sign in...");
        setTimeout(() => router.push("/"), 2000);
      } else {
        setError(resData.message || resData.error || "Registration failed. Please try again.");
        console.error("Registration error:", resData);
      }
    } catch (err: any) {
        console.error("Exception during registration:", err);
        if (err instanceof TypeError && err.message.includes('failed to fetch')) {
             setError("Network error. Please check your connection and try again.");
        } else {
             setError("An unexpected error occurred during registration.");
        }
    } finally {
        setIsLoading(false);
    }
  }

  // Google Sign-In/Registration Handler (Placeholder)
  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError("Google registration is not yet implemented.");
    setTimeout(() => setIsGoogleLoading(false), 1500);
  };

  return (
    <StartupHeader>
      {/* Main content area */}
      <div className="flex flex-grow items-center justify-start w-full px-4 sm:px-8 py-12 md:py-16">

        {/* Registration Form Elements */}
        <div className="z-10 max-w-lg w-full">
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
                className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 sm:mb-0 bg-white text-gray-800 placeholder:text-gray-800"
                required
                disabled={isLoading || isGoogleLoading}
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 placeholder:text-gray-800"
                required
                disabled={isLoading || isGoogleLoading}
              />
            </div>

            {/* --- Employee Number / Work Position --- */}
            <div className="flex flex-col sm:flex-row sm:space-x-4 mb-4">
               <input
                type="text"
                name="employeeNumber" // Renamed from badgeNumber
                placeholder="Employee Number" // Updated placeholder
                className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 sm:mb-0 bg-white text-gray-800 placeholder:text-gray-800"
                required
                disabled={isLoading || isGoogleLoading}
              />
              <input
                type="text"
                name="workPosition" // Renamed from rank
                placeholder="Work Position (e.g., IT Developer)" // Updated placeholder
                className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 placeholder:text-gray-800"
                required
                disabled={isLoading || isGoogleLoading}
              />
            </div>

             {/* --- Team / Birthdate --- */}
             <div className="flex flex-col sm:flex-row sm:space-x-4 mb-4">
               <input
                type="text"
                name="team" // Renamed from department
                placeholder="Team (e.g., Development Team)" // Updated placeholder
                className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 sm:mb-0 bg-white text-gray-800 placeholder:text-gray-800"
                required
                disabled={isLoading || isGoogleLoading}
              />
              <input
                type="date"
                name="birthdate"
                placeholder="Birthday" // Placeholder might not show for type="date"
                className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500 bg-white placeholder:text-gray-800" // Adjusted text color for date input
                required
                disabled={isLoading || isGoogleLoading}
              />
            </div>

            {/* Sex Dropdown */}
            <div className="mb-4">
                <label htmlFor="sex" className="sr-only">Sex</label>
                <select
                    id="sex"
                    name="sex"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 placeholder:text-gray-800" // Ensure text color is visible
                    required
                    disabled={isLoading || isGoogleLoading}
                    defaultValue=""
                >
                    <option value="" disabled>Select Sex</option>
                    {sexOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            </div>

            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 placeholder:text-gray-800"
              required
              disabled={isLoading || isGoogleLoading}
            />

            {/* Password */}
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 placeholder:text-gray-800"
              required
              disabled={isLoading || isGoogleLoading}
            />
             {/* Confirm Password */}
             <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 placeholder:text-gray-800"
              required
              disabled={isLoading || isGoogleLoading}
            />

            {/* --- Terms and Conditions Checkbox --- */}
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="terms"
                name="terms" // Good practice to add name
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" // Adjusted styling
                // Removed 'required' attribute here, validation handled in handleSubmit
                disabled={isLoading || isGoogleLoading}
              />
              <label htmlFor="terms" className="text-gray-600 text-sm">
                I agree to the{" "}
                <Link
                  href="/terms" // Adjust this URL to your actual terms page
                  className="text-blue-600 hover:underline"
                  target="_blank" // Optional: Open in new tab
                  rel="noopener noreferrer" // Security for target="_blank"
                >
                  Terms & Conditions
                </Link>
              </label>
            </div>
            {/* --- End Terms and Conditions Checkbox --- */}


            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full px-4 py-2 font-semibold rounded-xl shadow-md hover:bg-blue-700 mb-4"
              isLoading={isLoading}
              // Disable button if terms not agreed OR if loading
              disabled={!agreeToTerms || isLoading || isGoogleLoading}
            >
              Create account
            </Button>
          </form>

          {/* Error/Success Message Display */}
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
            className="w-full flex items-center justify-center px-4 py-2 bg-white text-gray-800 font-semibold rounded-xl shadow-md hover:bg-gray-50 border border-gray-300"
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
