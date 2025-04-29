"use client";

import React, { useState, useEffect } from "react";

// --- Define reusable input styles ---
const inputBaseClass = "w-full px-4 py-2 border border-gray-300 rounded-xl text-black";
const placeholderClass = "placeholder-gray-500";
const errorBorderClass = "border-red-600";
const errorTextStyles = "text-red-600 text-xs mt-1";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";
import Button from "@/app/components/Button"; // Adjust path if needed
import StartupHeader from "@/app/components/StartupHeader"; // Adjust path if needed
import { UserSex } from "@/models/UserProfile"; // Adjust path if needed

// --- Define possible sex values for the dropdown ---
const sexOptions: UserSex[] = ["Male", "Female"];

// --- Validation Helper Functions ---
const isValidName = (name: string): boolean => /^[A-Za-z\s]+$/.test(name.trim());
const isValidEmployeeNumber = (num: string): boolean =>
  /^[A-Za-z0-9-]+$/.test(num.trim());
const isValidPositionOrTeam = (text: string): boolean =>
  /^[A-Za-z0-9\s,-]+$/.test(text.trim());

// --- Type for Validation Errors State ---
type ValidationErrors = {
  firstName?: string;
  lastName?: string;
  employeeNumber?: string;
  workPosition?: string;
  birthdate?: string;
  team?: string;
  sex?: string;
};

// --- Initial Form State ---
const initialFormData = {
  firstName: "",
  lastName: "",
  employeeNumber: "",
  workPosition: "",
  birthdate: "",
  team: "",
  sex: "",
};

export default function CompleteProfilePage() {
  const [formData, setFormData] = useState(initialFormData);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, status, update } = useSession();

  // --- Pre-fill name from session and handle redirects ---
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/signin?message=unauthenticated");
      return;
    }

    if (session?.user?.profile === "complete") {
      Swal.fire({
        icon: "info",
        title: "Profile Complete",
        text: "Your profile details are already set up.",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        router.push("/");
      });
      return;
    }

    if (session?.user?.name && !formData.firstName && !formData.lastName) {
      const nameParts = session.user.name.split(" ");
      setFormData((prev) => ({
        ...prev,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
      }));
    }
  }, [session, status, router, formData.firstName, formData.lastName]);

  // --- Handle Input Change ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // --- Validation Function ---
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    const { firstName, lastName, employeeNumber, workPosition, birthdate, team, sex } =
      formData;

    if (!firstName) errors.firstName = "First name is required.";
    if (!lastName) errors.lastName = "Last name is required.";
    if (!sex) errors.sex = "Sex is required.";
    if (!employeeNumber) errors.employeeNumber = "Employee number is required.";
    if (!workPosition) errors.workPosition = "Work position is required.";
    if (!team) errors.team = "Team is required.";
    if (!birthdate) errors.birthdate = "Birthdate is required.";

    if (firstName && !isValidName(firstName)) {
      errors.firstName = "First name can only contain letters and spaces.";
    }
    if (lastName && !isValidName(lastName)) {
      errors.lastName = "Last name can only contain letters and spaces.";
    }
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
    if (birthdate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const birthDate = new Date(birthdate);
      if (isNaN(birthDate.getTime())) {
        errors.birthdate = "Invalid date format.";
      } else if (birthDate > today) {
        errors.birthdate = "Birthdate cannot be in the future.";
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

  // --- Form Submission Handler ---
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationErrors({});

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const dataToSubmit = {
      employeeNumber: formData.employeeNumber.trim(),
      workPosition: formData.workPosition.trim(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      birthdate: formData.birthdate,
      team: formData.team.trim(),
      sex: formData.sex,
    };

    try {
      const response = await fetch("/api/profile/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
      });
      const resData = await response.json();

      if (response.ok) {
        await update();
        Swal.fire({
          icon: "success",
          title: "Profile Updated!",
          text: "Wait for Admin Approval...",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          router.push("/");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: resData.message || "Could not update profile. Please try again.",
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <StartupHeader>
        <div className="flex justify-center items-center h-screen">
          <div>Loading session...</div>
        </div>
      </StartupHeader>
    );
  }

  return (
    <StartupHeader>
      <div className="flex flex-grow items-center justify-start w-full px-4 sm:px-8 py-12 md:py-16">
        <div className="z-10 max-w-lg w-full">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Complete Your Profile
          </h2>
          <p className="text-gray-600 mb-6">
            Welcome, {session?.user?.name || session?.user?.email}! Please
            provide these additional details.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col sm:flex-row sm:space-x-4 mb-2">
              <div className="w-full sm:w-1/2 mb-2 sm:mb-0 text-black">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name *"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                  required
                  disabled={isLoading}
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
                  placeholder="Last name *"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                  required
                  disabled={isLoading}
                />
                {validationErrors.lastName && (
                  <p className="text-red-600 text-xs mt-1">
                    {validationErrors.lastName}
                  </p>
                )}
              </div>
            </div>

   {/* Employee Number / Work Position */}
   <div className="flex flex-col sm:flex-row sm:space-x-4 mb-2">
               <div className="w-full sm:w-1/2 mb-2 sm:mb-0">
                 <input
                  type="text"
                  name="employeeNumber"
                  placeholder="Employee Number *"
                  value={formData.employeeNumber}
                  onChange={handleChange}
                  className={`${inputBaseClass} ${placeholderClass} ${validationErrors.employeeNumber ? errorBorderClass : ''}`}
                  required
                  disabled={isLoading}
                 />
                 {validationErrors.employeeNumber && <p className={errorTextStyles}>{validationErrors.employeeNumber}</p>}
               </div>
               <div className="w-full sm:w-1/2">
                 <input
                  type="text"
                  name="workPosition"
                  placeholder="Work Position *"
                  value={formData.workPosition}
                  onChange={handleChange}
                  className={`${inputBaseClass} ${placeholderClass} ${validationErrors.workPosition ? errorBorderClass : ''}`}
                  required
                  disabled={isLoading}
                 />
                 {validationErrors.workPosition && <p className={errorTextStyles}>{validationErrors.workPosition}</p>}
               </div>
            </div>

             {/* Team / Birthdate */}
             <div className="flex flex-col sm:flex-row sm:space-x-4 mb-2">
               <div className="w-full sm:w-1/2 mb-2 sm:mb-0">
                 <input
                  type="text"
                  name="team"
                  placeholder="Team *"
                  value={formData.team}
                  onChange={handleChange}
                  className={`${inputBaseClass} ${placeholderClass} ${validationErrors.team ? errorBorderClass : ''}`}
                  required
                  disabled={isLoading}
                 />
                 {validationErrors.team && <p className={errorTextStyles}>{validationErrors.team}</p>}
               </div>
               <div className="w-full sm:w-1/2">
                 <input
                  type="date"
                  name="birthdate"
                  placeholder="Birthday *"
                  value={formData.birthdate}
                  onChange={handleChange}
                  className={`${inputBaseClass} text-gray-700 ${validationErrors.birthdate ? errorBorderClass : ''}`}
                  required
                  disabled={isLoading}
                 />
                 {validationErrors.birthdate && <p className={errorTextStyles}>{validationErrors.birthdate}</p>}
               </div>
            </div>

            {/* Sex Dropdown */}
            <div className="mb-4"> {/* Added margin back */}
                <label htmlFor="sex" className="sr-only">Sex</label>
                <select
                    id="sex"
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    className={`${inputBaseClass} ${validationErrors.sex ? errorBorderClass : ''}`}
                    required
                    disabled={isLoading}
                >
                    <option value="" disabled className="">Select Sex *</option>
                    {sexOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
                {validationErrors.sex && <p className={errorTextStyles}>{validationErrors.sex}</p>}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full px-4 py-2 font-semibold rounded-xl shadow-md hover:bg-blue-700 mb-4"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Save Profile Details
            </Button>
          </form>
        </div>
      </div>
    </StartupHeader>
  );
}