// src/app/registration/page.tsx
"use client";

import React, { useState } from "react"; // Import React
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import Button from "../components/Button"; // Adjust path if needed
import StartupHeader from "../components/StarupHeader"; // Adjust path if needed
import { UserSex } from "@/models/UserProfile"; // Adjust path if needed
import Swal from 'sweetalert2'; // Import SweetAlert2

// --- Define possible sex values for the dropdown ---
const sexOptions: UserSex[] = ['Male', 'Female', 'Other', 'Prefer not to say'];

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
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const passwordRequirementsMessage = "Password must be 8+ characters with uppercase, lowercase, number, and special character (@$!%*?&).";

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
};

// --- Helper function to capitalize the first letter ---
const capitalizeFirstLetter = (string: string): string => {
    if (!string) return '';
    // No need to trim here as we handle it in validation/submission
    return string.charAt(0).toUpperCase() + string.slice(1);
};

// --- Styles for Validation ---
const errorTextStyles = "text-red-600 text-xs mt-1"; // Style for error messages
const errorBorderClass = "border-red-500"; // Class for error border

// --- Initial Form State ---
const initialFormData = {
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    employeeNumber: '',
    workPosition: '',
    birthdate: '',
    team: '',
    sex: '',
};

export default function RegisterPage() {
  const [formData, setFormData] = useState(initialFormData); // State for controlled inputs
  const [error, setError] = useState(""); // For API/Network errors
  const [success, setSuccess] = useState(""); // For API success
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({}); // State for validation errors
  const router = useRouter();

  // --- Handle Input Change for Controlled Components ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    let processedValue = value;

    // Auto-capitalize first letter for firstName and lastName
    if (name === 'firstName' || name === 'lastName') {
        processedValue = capitalizeFirstLetter(value);
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));

    // Clear validation error for the field being changed
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // --- Validation Function (Updated to use formData state) ---
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Helper to trim string values from state
    const getTrimmedString = (key: keyof typeof initialFormData): string => {
        return formData[key]?.trim() ?? '';
    }

    const email = getTrimmedString("email");
    const password = formData.password; // Don't trim password
    const confirmPassword = formData.confirmPassword; // Don't trim password
    const firstName = getTrimmedString("firstName");
    const lastName = getTrimmedString("lastName");
    const sex = getTrimmedString("sex");
    const employeeNumber = getTrimmedString("employeeNumber");
    const workPosition = getTrimmedString("workPosition");
    const team = getTrimmedString("team");
    const birthdate = getTrimmedString("birthdate");

    // Required fields check
    if (!email) errors.email = 'Email is required.';
    if (!password) errors.password = 'Password is required.';
    if (!confirmPassword) errors.confirmPassword = 'Password confirmation is required.';
    if (!firstName) errors.firstName = 'First name is required.';
    if (!lastName) errors.lastName = 'Last name is required.';
    if (!sex) errors.sex = 'Sex is required.';
    if (!employeeNumber) errors.employeeNumber = 'Employee number is required.';
    if (!workPosition) errors.workPosition = 'Work position is required.';
    if (!team) errors.team = 'Team is required.';
    if (!birthdate) errors.birthdate = 'Birthdate is required.';

    // Terms agreement
    if (!agreeToTerms) {
        errors.terms = 'You must agree to the Terms & Conditions.';
    }

    // Email format
    if (email && !isValidEmail(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    // Password complexity
    if (password && !passwordRegex.test(password)) {
      errors.password = passwordRequirementsMessage;
    }

    // Password match
    if (password && confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    // Name validation
    if (firstName && !isValidName(firstName)) {
      errors.firstName = 'First name can only contain letters and spaces.';
    }
    if (lastName && !isValidName(lastName)) {
      errors.lastName = 'Last name can only contain letters and spaces.';
    }

    // Specific field validations (only if they have a value after trimming)
    if (employeeNumber && !isValidEmployeeNumber(employeeNumber)) {
        errors.employeeNumber = 'Employee number can only contain letters, numbers, and hyphens.';
    }
    if (workPosition && !isValidPositionOrTeam(workPosition)) {
        errors.workPosition = 'Work position contains invalid characters.';
    }
    if (team && !isValidPositionOrTeam(team)) {
        errors.team = 'Team name contains invalid characters.';
    }

    // Birthdate validation
    if (birthdate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        try {
            const birthDate = new Date(birthdate);
             // Check if the date is valid before comparing
            if (isNaN(birthDate.getTime())) {
                 errors.birthdate = 'Invalid date format.';
            } else if (birthDate > today) {
                errors.birthdate = 'Birthdate cannot be in the future.';
            }
        } catch (e) {
             errors.birthdate = 'Invalid date format.';
        }
    }

    setValidationErrors(errors);
    isValid = Object.keys(errors).length === 0;

    if (!isValid) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Errors',
            text: 'Please correct the errors indicated in the form.',
        });
    }

    return isValid;
  };


  // --- Credentials Registration Handler (Updated to use formData state) ---
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); // Clear API errors
    setSuccess("");
    setValidationErrors({}); // Clear validation errors

    // --- Check terms first (quick exit) ---
    if (!agreeToTerms) {
        // Set validation error for terms
        setValidationErrors({ terms: "You must agree to the Terms & Conditions to register." });
        Swal.fire({
            icon: 'warning',
            title: 'Terms Not Agreed',
            text: 'Please agree to the Terms & Conditions to continue.',
        });
        return;
    }

    // --- Run Full Validation ---
    if (!validateForm()) { // Validate using the state
      setIsLoading(false); // Ensure loading is off if validation fails
      return; // Stop submission
    }
    // --- End Validation ---

    setIsLoading(true);

    // --- Prepare data object with processed values from state ---
    const data = {
      email: formData.email.trim(),
      password: formData.password, // Send untrimmed password
      role: "user",
      employeeNumber: formData.employeeNumber.trim(),
      workPosition: formData.workPosition.trim(),
      // Names are already capitalized in state due to handleChange
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      birthdate: formData.birthdate,
      team: formData.team.trim(),
      sex: formData.sex,
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
    setError("Google registration is not yet implemented."); // Keep using setError for this
    setTimeout(() => setIsGoogleLoading(false), 1500);
  };

  // --- Define common input styles (Using original styles) ---
  const inputBaseClass = "w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800";
  const placeholderClass = "placeholder:text-gray-500"; // Adjusted placeholder color

  return (
    <StartupHeader>
      {/* Main content area - Keep original layout */}
      <div className="flex flex-grow items-center justify-start w-full px-4 sm:px-8 py-12 md:py-16">

        {/* Registration Form Elements - Keep original layout */}
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
          <form onSubmit={handleSubmit} noValidate> {/* Added noValidate */}
            {/* First Name / Last Name */}
            <div className="flex flex-col sm:flex-row sm:space-x-4 mb-2"> {/* Reduced mb */}
              <div className="w-full sm:w-1/2 mb-2 sm:mb-0">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name *"
                  value={formData.firstName} // Bind value
                  onChange={handleChange} // Attach handler
                  className={`${inputBaseClass} ${placeholderClass} ${validationErrors.firstName ? errorBorderClass : ''}`}
                  required
                  disabled={isLoading || isGoogleLoading}
                />
                {validationErrors.firstName && <p className={errorTextStyles}>{validationErrors.firstName}</p>}
              </div>
              <div className="w-full sm:w-1/2">
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name *"
                  value={formData.lastName} // Bind value
                  onChange={handleChange} // Attach handler
                  className={`${inputBaseClass} ${placeholderClass} ${validationErrors.lastName ? errorBorderClass : ''}`}
                  required
                  disabled={isLoading || isGoogleLoading}
                />
                {validationErrors.lastName && <p className={errorTextStyles}>{validationErrors.lastName}</p>}
              </div>
            </div>

            {/* Employee Number / Work Position */}
            <div className="flex flex-col sm:flex-row sm:space-x-4 mb-2"> {/* Reduced mb */}
               <div className="w-full sm:w-1/2 mb-2 sm:mb-0">
                 <input
                  type="text"
                  name="employeeNumber"
                  placeholder="Employee Number *"
                  value={formData.employeeNumber} // Bind value
                  onChange={handleChange} // Attach handler
                  className={`${inputBaseClass} ${placeholderClass} ${validationErrors.employeeNumber ? errorBorderClass : ''}`}
                  required
                  disabled={isLoading || isGoogleLoading}
                 />
                 {validationErrors.employeeNumber && <p className={errorTextStyles}>{validationErrors.employeeNumber}</p>}
               </div>
               <div className="w-full sm:w-1/2">
                 <input
                  type="text"
                  name="workPosition"
                  placeholder="Work Position *"
                  value={formData.workPosition} // Bind value
                  onChange={handleChange} // Attach handler
                  className={`${inputBaseClass} ${placeholderClass} ${validationErrors.workPosition ? errorBorderClass : ''}`}
                  required
                  disabled={isLoading || isGoogleLoading}
                 />
                 {validationErrors.workPosition && <p className={errorTextStyles}>{validationErrors.workPosition}</p>}
               </div>
            </div>

             {/* Team / Birthdate */}
             <div className="flex flex-col sm:flex-row sm:space-x-4 mb-2"> {/* Reduced mb */}
               <div className="w-full sm:w-1/2 mb-2 sm:mb-0">
                 <input
                  type="text"
                  name="team"
                  placeholder="Team *"
                  value={formData.team} // Bind value
                  onChange={handleChange} // Attach handler
                  className={`${inputBaseClass} ${placeholderClass} ${validationErrors.team ? errorBorderClass : ''}`}
                  required
                  disabled={isLoading || isGoogleLoading}
                 />
                 {validationErrors.team && <p className={errorTextStyles}>{validationErrors.team}</p>}
               </div>
               <div className="w-full sm:w-1/2">
                 <input
                  type="date"
                  name="birthdate"
                  placeholder="Birthday *"
                  value={formData.birthdate} // Bind value
                  onChange={handleChange} // Attach handler
                  // Adjusted text color for date input visibility
                  className={`${inputBaseClass} text-gray-700 ${validationErrors.birthdate ? errorBorderClass : ''}`}
                  required
                  disabled={isLoading || isGoogleLoading}
                 />
                 {validationErrors.birthdate && <p className={errorTextStyles}>{validationErrors.birthdate}</p>}
               </div>
            </div>

            {/* Sex Dropdown */}
            <div className="mb-2"> {/* Reduced mb */}
                <label htmlFor="sex" className="sr-only">Sex</label>
                <select
                    id="sex"
                    name="sex"
                    value={formData.sex} // Bind value
                    onChange={handleChange} // Attach handler
                    className={`${inputBaseClass} ${validationErrors.sex ? errorBorderClass : ''}`}
                    required
                    disabled={isLoading || isGoogleLoading}
                    // defaultValue="" // Remove defaultValue when using value prop
                >
                    <option value="" disabled>Select Sex *</option>
                    {sexOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
                {validationErrors.sex && <p className={errorTextStyles}>{validationErrors.sex}</p>}
            </div>

            {/* Email */}
            <div className="mb-2"> {/* Reduced mb */}
              <input
                type="email"
                name="email"
                placeholder="Email *"
                value={formData.email} // Bind value
                onChange={handleChange} // Attach handler
                className={`${inputBaseClass} ${placeholderClass} ${validationErrors.email ? errorBorderClass : ''}`}
                required
                disabled={isLoading || isGoogleLoading}
              />
              {validationErrors.email && <p className={errorTextStyles}>{validationErrors.email}</p>}
            </div>

            {/* Password */}
            <div className="mb-2"> {/* Reduced mb */}
              <input
                type="password"
                name="password"
                placeholder="Password *"
                value={formData.password} // Bind value
                onChange={handleChange} // Attach handler
                className={`${inputBaseClass} ${placeholderClass} ${validationErrors.password ? errorBorderClass : ''}`}
                required
                disabled={isLoading || isGoogleLoading}
              />
              {validationErrors.password && <p className={errorTextStyles}>{validationErrors.password}</p>}
            </div>

             {/* Confirm Password */}
             <div className="mb-4"> {/* Keep slightly larger margin before terms */}
               <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password *"
                value={formData.confirmPassword} // Bind value
                onChange={handleChange} // Attach handler
                className={`${inputBaseClass} ${placeholderClass} ${validationErrors.confirmPassword ? errorBorderClass : ''}`}
                required
                disabled={isLoading || isGoogleLoading}
               />
               {validationErrors.confirmPassword && <p className={errorTextStyles}>{validationErrors.confirmPassword}</p>}
             </div>

            {/* Terms and Conditions Checkbox */}
            <div className="flex items-start mb-4"> {/* Use items-start */}
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={agreeToTerms}
                onChange={(e) => {
                    setAgreeToTerms(e.target.checked);
                    // Clear terms error when checkbox is interacted with
                    if (validationErrors.terms) {
                        setValidationErrors(prev => ({ ...prev, terms: undefined }));
                    }
                }}
                className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2 mt-0.5 ${validationErrors.terms ? errorBorderClass : ''}`} // Add border on error
                disabled={isLoading || isGoogleLoading}
              />
              <div>
                <label htmlFor="terms" className="text-gray-600 text-sm">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms & Conditions *
                  </Link>
                </label>
                {validationErrors.terms && <p className={errorTextStyles}>{validationErrors.terms}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full px-4 py-2 font-semibold rounded-xl shadow-md hover:bg-blue-700 mb-4"
              isLoading={isLoading}
              // Only disable based on loading state, validation handles the rest
              disabled={isLoading || isGoogleLoading}
            >
              Create account
            </Button>
          </form>

          {/* API/Network Error/Success Message Display */}
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
