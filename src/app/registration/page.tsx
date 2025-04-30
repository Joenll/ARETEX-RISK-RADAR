"use client";

import React, { useState } from "react"; // Import React
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import Button from "../components/Button"; // Adjust path if needed
import StartupHeader from "../components/StartupHeader"; // Adjust path if needed
import { UserSex } from "@/models/UserProfile"; // Adjust path if needed
import Swal from "sweetalert2"; // Import SweetAlert2

// --- Define possible sex values for the dropdown ---
const sexOptions: UserSex[] = ["Male", "Female"];

// --- Validation Helper Functions ---
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
const isValidName = (name: string): boolean => {
  // Allows letters and spaces, trims input first
  return /^[A-Za-z\s]+$/.test(name.trim());
};
const isValidEmployeeNumber = (num: string): boolean => {
  // Allows letters, numbers, and hyphens (optional), trims input first
  return /^[A-Za-z0-9-]+$/.test(num.trim());
};
const isValidPositionOrTeam = (text: string): boolean => {
  // Allows letters, numbers, spaces, hyphens, commas, trims input first
  return /^[A-Za-z0-9\s,-]+$/.test(text.trim());
};
// --- Password Complexity Regex (from backend) ---
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const passwordRequirementsMessage =
  "Password must be 8+ characters with uppercase, lowercase, number, and special character (@$!%*?&).";

// --- Type for Validation Errors State ---
type ValidationErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  employeeNumber?: string;
  workPosition?: string;
  birthdate?: string;
  team?: string;
  sex?: string;
  terms?: string; // Added for terms agreement
  address?: string; // Added for address field
};

// --- Helper function to capitalize the first letter ---
const capitalizeFirstLetter = (string: string): string => {
  if (!string) return "";
  // No need to trim here as we handle it in validation/submission
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// --- Initial Form State ---
const initialFormData = {
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  employeeNumber: "",
  workPosition: "",
  birthdate: "",
  team: "",
  sex: "",
  address: "", // Added address field
};

export default function RegisterPage() {
  const [formData, setFormData] = useState(initialFormData); // State for controlled inputs
  const [error, setError] = useState(""); // For API/Network errors
  const [success, setSuccess] = useState(""); // For API success
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  ); // State for validation errors
  const router = useRouter();

  // --- Handle Input Change for Controlled Components ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    let processedValue = value;

    // Auto-capitalize first letter for firstName and lastName
    if (name === "firstName" || name === "lastName") {
      processedValue = capitalizeFirstLetter(value);
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    // Clear validation error for the field being changed
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // --- Validation Function (Updated to use formData state) ---
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Helper to trim string values from state
    const getTrimmedString = (key: keyof typeof initialFormData): string => {
      return formData[key]?.trim() ?? "";
    };

    const email = getTrimmedString("email");
    const password = formData.password; // Don't trim password
    const firstName = getTrimmedString("firstName");
    const lastName = getTrimmedString("lastName");
    const sex = getTrimmedString("sex");
    const employeeNumber = getTrimmedString("employeeNumber");
    const workPosition = getTrimmedString("workPosition");
    const team = getTrimmedString("team");
    const birthdate = getTrimmedString("birthdate");

    // Required fields check
    if (!email) errors.email = "Email is required.";
    if (!password) errors.password = "Password is required.";
    if (!firstName) errors.firstName = "First name is required.";
    if (!lastName) errors.lastName = "Last name is required.";
    if (!sex) errors.sex = "Sex is required.";
    if (!employeeNumber) errors.employeeNumber = "Employee number is required.";
    if (!workPosition) errors.workPosition = "Work position is required.";
    if (!team) errors.team = "Team is required.";
    if (!birthdate) errors.birthdate = "Birthdate is required.";

    // Terms agreement
    if (!agreeToTerms) {
      errors.terms = "You must agree to the Terms & Conditions.";
    }

    // Email format
    if (email && !isValidEmail(email)) {
      errors.email = "Please enter a valid email address.";
    }

    // Password complexity
    if (password && !passwordRegex.test(password)) {
      errors.password = passwordRequirementsMessage;
    }

    // Set password confirmation to match password
    if (password) {
      setFormData((prev) => ({ ...prev, confirmPassword: password }));
    }

    // Name validation
    if (firstName && !isValidName(firstName)) {
      errors.firstName = "First name can only contain letters and spaces.";
    }
    if (lastName && !isValidName(lastName)) {
      errors.lastName = "Last name can only contain letters and spaces.";
    }

    // Specific field validations (only if they have a value after trimming)
    if (employeeNumber && !isValidEmployeeNumber(employeeNumber)) {
      errors.employeeNumber =
        "Employee number can only contain letters, numbers, and hyphens.";
    }
    if (workPosition && !isValidPositionOrTeam(workPosition)) {
      errors.workPosition = "Work position contains invalid characters.";
    }
    if (team && !isValidPositionOrTeam(team)) {
      errors.team = "Team name contains invalid characters.";
    }

    // Birthdate validation
    if (birthdate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      try {
        const birthDate = new Date(birthdate);
        // Check if the date is valid before comparing
        if (isNaN(birthDate.getTime())) {
          errors.birthdate = "Invalid date format.";
        } else if (birthDate > today) {
          errors.birthdate = "Birthdate cannot be in the future.";
        }
      } catch (e) {
        errors.birthdate = "Invalid date format.";
      }
    }

    setValidationErrors(errors);
    isValid = Object.keys(errors).length === 0;

    if (!isValid) {
      Swal.fire({
        icon: "error",
        title: "Validation Errors",
        text: "Please correct the errors indicated in the form.",
      });
    }

    return isValid;
  };

  // --- Credentials Registration Handler (Updated to use formData state) ---
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); // Clear API errors
    setSuccess("");

    // --- Check terms first (quick exit) ---
    if (!agreeToTerms) {
      // Set validation error for terms
      setValidationErrors({
        terms: "You must agree to the Terms & Conditions to register.",
      });
      Swal.fire({
        icon: "warning",
        title: "Terms Not Agreed",
        text: "Please agree to the Terms & Conditions to continue.",
      });
      return;
    }

    // --- Run Full Validation ---
    if (!validateForm()) {
      // Validate using the state
      return; // Stop submission
    }
    // --- End Validation ---

    setIsLoading(true);

    // --- Prepare data object with processed values from state ---
    const data = {
      email: formData.email.trim(),
      password: formData.password, // Send untrimmed password
      role: "user",
      employeeNumber: formData.employeeNumber.trim() || formData.email.trim(), // Use email as fallback
      workPosition: formData.workPosition.trim(),
      // Names are already capitalized in state due to handleChange
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      birthdate: formData.birthdate,
      team: formData.team.trim(),
      sex: formData.sex,
      address: formData.address?.trim() || "", // Include address field
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
        // Optionally reset form state
        // setFormData(initialFormData);
        // setAgreeToTerms(false);
        setTimeout(() => router.push("/"), 2000);
      } else {
        // Use API error message
        setError(
          resData.message ||
            resData.error ||
            "Registration failed. Please try again."
        );
        console.error("Registration error:", resData);
      }
    } catch (err: any) {
      console.error("Exception during registration:", err);
      if (err instanceof TypeError && err.message.includes("failed to fetch")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("An unexpected error occurred during registration.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Google Sign-In/Registration Handler
  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError("");
    try {
      // Redirect to Google auth flow
      const result = await fetch("/api/auth/google-signin", {
        method: "GET",
      });
      if (result.ok) {
        window.location.href = result.url;
      } else {
        setError("Could not initiate Google sign-in. Please try again.");
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("An error occurred during Google sign-in.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <StartupHeader>
      {/* Keep justify-start for left alignment */}
      <div className="flex flex-grow items-center justify-start w-full px-4 sm:px-8 py-8 md:py-16">
        {/* Remove ml-4 md:ml-12 and add ml-0 to ensure no margins are applied */}
        <div className="z-10 max-w-md w-full bg-white rounded-lg p-8 shadow-sm ml-0">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Create an account
          </h2>
          <p className="text-gray-600 mb-5 text-base text-center">
            Already have an account?{" "}
            <Link href="/" className="text-blue-600 hover:underline">
              Log in
            </Link>
          </p>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* First Name / Last Name */}
            <div className="flex flex-col sm:flex-row sm:space-x-4 mb-3 text-black">
              <div className="w-full sm:w-1/2 mb-3 sm:mb-0">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 placeholder-opacity-100 ${
                    validationErrors.firstName ? "border-red-500" : ""
                  }`}
                  required
                  disabled={isLoading || isGoogleLoading}
                />
                {validationErrors.firstName && (
                  <p className="text-red-600 text-xs mt-1">
                    {validationErrors.firstName}
                  </p>
                )}
              </div>
              <div className="w-full sm:w-1/2 text-black">
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 placeholder-opacity-100 ${
                    validationErrors.lastName ? "border-red-500" : ""
                  }`}
                  required
                  disabled={isLoading || isGoogleLoading}
                />
                {validationErrors.lastName && (
                  <p className="text-red-600 text-xs mt-1">
                    {validationErrors.lastName}
                  </p>
                )}
              </div>
            </div>
            {/* Gender / Date */}
            <div className="flex flex-col sm:flex-row sm:space-x-4 mb-3 text-black">
              <div className="w-full sm:w-1/2 mb-3 sm:mb-0">
                <select
                  id="sex"
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-400 ${
                    validationErrors.sex ? "border-red-500" : ""
                  }`}
                  required
                  disabled={isLoading || isGoogleLoading}
                >
                  <option value="" disabled>
                    Gender
                  </option>
                  {sexOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {validationErrors.sex && (
                  <p className="text-red-600 text-xs mt-1">
                    {validationErrors.sex}
                  </p>
                )}
              </div>
              <div className="w-full sm:w-1/2 text-black">
                {/* Remove birth date label and change input type */}
                <input
                  type="text"
                  name="birthdate"
                  placeholder="mm/dd/yyyy"
                  value={formData.birthdate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 placeholder-opacity-100 ${
                    validationErrors.birthdate ? "border-red-500" : ""
                  }`}
                  pattern="\d{2}/\d{2}/\d{4}"
                  required
                  disabled={isLoading || isGoogleLoading}
                />
                {validationErrors.birthdate && (
                  <p className="text-red-600 text-xs mt-1">
                    {validationErrors.birthdate}
                  </p>
                )}
              </div>
            </div>

            {/* Department / Position (renamed from Team / Work Position) */}
            <div className="flex flex-col sm:flex-row sm:space-x-4 mb-3 text-black">
              <div className="w-full sm:w-1/2 mb-3 sm:mb-0">
                <input
                  type="text"
                  name="team"
                  placeholder="Department"
                  value={formData.team}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 placeholder-opacity-100 ${
                    validationErrors.team ? "border-red-500" : ""
                  }`}
                  required
                  disabled={isLoading || isGoogleLoading}
                />

                {validationErrors.team && (
                  <p className="text-red-600 text-xs mt-1">
                    {validationErrors.team}
                  </p>
                )}
              </div>
              <div className="w-full sm:w-1/2 text-black">
                <input
                  type="text"
                  name="workPosition"
                  placeholder="Position"
                  value={formData.workPosition}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 placeholder-opacity-100 ${
                    validationErrors.workPosition ? "border-red-500" : ""
                  }`}
                  required
                  disabled={isLoading || isGoogleLoading}
                />
                {validationErrors.workPosition && (
                  <p className="text-red-600 text-xs mt-1">
                    {validationErrors.workPosition}
                  </p>
                )}
              </div>
            </div>

            {/* Address (new field from the image) */}
            <div className="mb-3 text-black">
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address || ""}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 placeholder-opacity-100"
                disabled={isLoading || isGoogleLoading}
              />
            </div>

            {/* Email */}
            <div className="mb-3 text-black">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 placeholder-opacity-100 ${
                  validationErrors.email ? "border-red-500" : ""
                }`}
                required
                disabled={isLoading || isGoogleLoading}
              />
              {validationErrors.email && (
                <p className="text-red-600 text-xs mt-1">
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-4 text-black">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 placeholder-opacity-100 ${
                  validationErrors.password ? "border-red-500" : ""
                }`}
                required
                disabled={isLoading || isGoogleLoading}
              />
              {validationErrors.password && (
                <p className="text-red-600 text-xs mt-1">
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Hidden Confirm Password (auto-matched for simplicity) */}
            <input
              type="hidden"
              name="confirmPassword"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading || isGoogleLoading}
            />

            {/* Hidden Employee Number (using email if needed) */}
            <input
              type="hidden"
              name="employeeNumber"
              value={formData.employeeNumber || formData.email}
              disabled={isLoading || isGoogleLoading}
            />

            {/* Terms and Conditions Checkbox */}
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={agreeToTerms}
                onChange={(e) => {
                  setAgreeToTerms(e.target.checked);
                  if (validationErrors.terms) {
                    setValidationErrors((prev) => ({
                      ...prev,
                      terms: undefined,
                    }));
                  }
                }}
                className={`mr-2 h-4 w-4 ${
                  validationErrors.terms ? "border-red-500" : ""
                }`}
                disabled={isLoading || isGoogleLoading}
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms & Conditions
                </Link>
              </label>
            </div>
            {validationErrors.terms && (
              <p className="text-red-600 text-xs mt-1 mb-3">
                {validationErrors.terms}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full px-4 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 mb-4 ${
                isLoading ? "opacity-70" : ""
              }`}
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="mr-2 animate-spin">⟳</span> Creating
                  account...
                </span>
              ) : (
                "Create account"
              )}
            </button>

            {/* Error/Success Messages */}
            {error && (
              <p className="mt-4 text-center text-sm text-red-600 bg-red-100 p-2 rounded">
                {error}
              </p>
            )}
            {success && (
              <p className="mt-4 text-center text-sm text-green-600 bg-green-100 p-2 rounded">
                {success}
              </p>
            )}
          </form>

          {/* OR divider */}
          <div className="flex items-center my-4">
            <hr className="flex-grow border-gray-300" />
            <span className="px-4 text-gray-500 text-sm">OR</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          {/* Google Sign Up Button */}
          <button
            onClick={handleGoogleSignUp}
            disabled={isLoading || isGoogleLoading}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-gray-100 text-gray-800 font-medium rounded-md hover:bg-gray-200 border border-gray-200"
          >
            {isGoogleLoading ? (
              <span className="mr-2 animate-spin">⟳</span>
            ) : (
              <FcGoogle className="text-xl mr-2" />
            )}
            Log in with Google
          </button>
        </div>
      </div>
    </StartupHeader>
  );
}