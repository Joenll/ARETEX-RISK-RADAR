'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/app/components/Button';
import { UserSex } from '@/models/UserProfile';
import Swal from 'sweetalert2';

// --- Define possible sex values for the dropdown ---
const sexOptions: UserSex[] = ['Male', 'Female'];

const inputFieldStyles = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 text-sm";
const labelStyles = "block text-gray-700 text-sm font-bold mb-1";
const errorTextStyles = "text-red-600 text-xs mt-1"; // Style for error messages

// --- Validation Helper Functions ---
const isValidEmail = (email: string): boolean => {
  // Simple email regex (adjust if needed for stricter rules)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidName = (name: string): boolean => {
  // Allows letters and spaces
  return /^[A-Za-z\s]+$/.test(name);
};

const isValidEmployeeNumber = (num: string): boolean => {
  // Allows letters, numbers, and hyphens (optional)
  return /^[A-Za-z0-9-]+$/.test(num);
};

const isValidPositionOrTeam = (text: string): boolean => {
    // Allows letters, numbers, spaces, hyphens, commas
    return /^[A-Za-z0-9\s,-]+$/.test(text);
};

// --- Password Complexity Regex (from backend) ---
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const passwordRequirementsMessage =
  "Password must be 8+ characters with uppercase, lowercase, number, and special character (@$!%*?&).";

// --- Type for Validation Errors State ---
type ValidationErrors = {
    [key in keyof typeof initialFormData]?: string;
};

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
    role: 'user',
    status: 'approved',
};

// --- Helper function to capitalize the first letter ---
const capitalizeFirstLetter = (string: string): string => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
};

export default function AddUserPage() {
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({}); // State for validation errors
  const router = useRouter();

  // --- UPDATED handleChange ---
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

  
  // --- END UPDATED handleChange ---

  // --- Validation Function (remains the same) ---
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Required fields check
    if (!formData.email) errors.email = 'Email is required.';
    if (!formData.password) errors.password = 'Password is required.';
    if (!formData.confirmPassword) errors.confirmPassword = 'Password confirmation is required.';
    if (!formData.firstName) errors.firstName = 'First name is required.';
    if (!formData.lastName) errors.lastName = 'Last name is required.';
    if (!formData.sex) errors.sex = 'Sex is required.';

    // Email format
    if (formData.email && !isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address.';
    }

    // Password length
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

       // Password complexity
       if (formData.password && !passwordRegex.test(formData.password)) {
        errors.password = passwordRequirementsMessage;
      }


    // Password match
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    // Name validation
    if (formData.firstName && !isValidName(formData.firstName)) {
      errors.firstName = 'First name can only contain letters and spaces.';
    }
    if (formData.lastName && !isValidName(formData.lastName)) {
      errors.lastName = 'Last name can only contain letters and spaces.';
    }

    // Optional fields validation
    if (formData.employeeNumber && !isValidEmployeeNumber(formData.employeeNumber)) {
        errors.employeeNumber = 'Employee number can only contain letters, numbers, and hyphens.';
    }
    if (formData.workPosition && !isValidPositionOrTeam(formData.workPosition)) {
        errors.workPosition = 'Work position contains invalid characters.';
    }
    if (formData.team && !isValidPositionOrTeam(formData.team)) {
        errors.team = 'Team name contains invalid characters.';
    }

    // Birthdate validation
    if (formData.birthdate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const birthDate = new Date(formData.birthdate);
        if (birthDate > today) {
            errors.birthdate = 'Birthdate cannot be in the future.';
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

  // --- handleSubmit (remains the same) ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationErrors({});

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { confirmPassword, ...apiData } = formData;

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to create user.');
      }

      Swal.fire({
        icon: 'success',
        title: 'User Created!',
        text: 'New user has been added successfully.',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        router.push('/ui/admin/user-management');
      });

    } catch (err: any) {
      console.error('Error creating user:', err);
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Return JSX (remains the same) ---
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 max-w-3xl mx-auto">
      {/* Back Button */}
       <button
            onClick={() => router.back()}
            className="mb-4 text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to User Management
        </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New User</h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Account Fields */}
        <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-lg font-semibold px-2 text-gray-700">Account Details</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 pt-2">
              {/* Email */}
              <div>
                <label htmlFor="email" className={labelStyles}>Email <span className="text-red-500">*</span></label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className={`${inputFieldStyles} ${validationErrors.email ? 'border-red-500' : ''}`} />
                {validationErrors.email && <p className={errorTextStyles}>{validationErrors.email}</p>}
              </div>
              {/* Role */}
              <div>
                <label htmlFor="role" className={labelStyles}>Role</label>
                <select id="role" name="role" value={formData.role} onChange={handleChange} className={`${inputFieldStyles} bg-white`}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {/* Password */}
              <div>
                <label htmlFor="password" className={labelStyles}>Password <span className="text-red-500">*</span></label>
                <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required className={`${inputFieldStyles} ${validationErrors.password ? 'border-red-500' : ''}`} />
                {validationErrors.password && <p className={errorTextStyles}>{validationErrors.password}</p>}
              </div>
              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className={labelStyles}>Confirm Password <span className="text-red-500">*</span></label>
                <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className={`${inputFieldStyles} ${validationErrors.confirmPassword ? 'border-red-500' : ''}`} />
                {validationErrors.confirmPassword && <p className={errorTextStyles}>{validationErrors.confirmPassword}</p>}
              </div>
              {/* Status */}
              <div>
                <label htmlFor="status" className={labelStyles}>Initial Status</label>
                <select id="status" name="status" value={formData.status} onChange={handleChange} className={`${inputFieldStyles} bg-white`}>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
        </fieldset>

        {/* Profile Fields */}
        <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-lg font-semibold px-2 text-gray-700">Profile Details</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 pt-2">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className={labelStyles}>First Name <span className="text-red-500">*</span></label>
                <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required className={`${inputFieldStyles} ${validationErrors.firstName ? 'border-red-500' : ''}`} />
                 {validationErrors.firstName && <p className={errorTextStyles}>{validationErrors.firstName}</p>}
              </div>
              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className={labelStyles}>Last Name <span className="text-red-500">*</span></label>
                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required className={`${inputFieldStyles} ${validationErrors.lastName ? 'border-red-500' : ''}`} />
                 {validationErrors.lastName && <p className={errorTextStyles}>{validationErrors.lastName}</p>}
              </div>
              {/* Sex */}
              <div>
                <label htmlFor="sex" className={labelStyles}>Sex <span className="text-red-500">*</span></label>
                <select id="sex" name="sex" value={formData.sex} onChange={handleChange} required className={`${inputFieldStyles} bg-white ${validationErrors.sex ? 'border-red-500' : ''}`}>
                    <option value="" disabled>Select Sex</option>
                    {sexOptions.map(option => ( <option key={option} value={option}>{option}</option> ))}
                </select>
                 {validationErrors.sex && <p className={errorTextStyles}>{validationErrors.sex}</p>}
              </div>
              {/* Birthdate */}
              <div>
                <label htmlFor="birthdate" className={labelStyles}>Birthdate</label>
                <input type="date" id="birthdate" name="birthdate" value={formData.birthdate} onChange={handleChange} className={`${inputFieldStyles} ${validationErrors.birthdate ? 'border-red-500' : ''}`} />
                 {validationErrors.birthdate && <p className={errorTextStyles}>{validationErrors.birthdate}</p>}
              </div>
              {/* Employee Number */}
              <div>
                <label htmlFor="employeeNumber" className={labelStyles}>Employee Number</label>
                <input type="text" id="employeeNumber" name="employeeNumber" value={formData.employeeNumber} onChange={handleChange} className={`${inputFieldStyles} ${validationErrors.employeeNumber ? 'border-red-500' : ''}`} />
                 {validationErrors.employeeNumber && <p className={errorTextStyles}>{validationErrors.employeeNumber}</p>}
              </div>
              {/* Work Position */}
              <div>
                <label htmlFor="workPosition" className={labelStyles}>Work Position/Position</label>
                <input type="text" id="workPosition" name="workPosition" value={formData.workPosition} onChange={handleChange} className={`${inputFieldStyles} ${validationErrors.workPosition ? 'border-red-500' : ''}`} />
                 {validationErrors.workPosition && <p className={errorTextStyles}>{validationErrors.workPosition}</p>}
              </div>
              {/* Team */}
              <div>
                <label htmlFor="team" className={labelStyles}>Team</label>
                <input type="text" id="team" name="team" value={formData.team} onChange={handleChange} className={`${inputFieldStyles} ${validationErrors.team ? 'border-red-500' : ''}`} />
                 {validationErrors.team && <p className={errorTextStyles}>{validationErrors.team}</p>}
              </div>
            </div>
        </fieldset>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex gap-3 justify-end">
          <Button type="button" variant="back" onClick={() => router.back()} disabled={isLoading}> Cancel </Button>
          <Button type="submit" variant="submit" isLoading={isLoading} disabled={isLoading}> {isLoading ? 'Creating User...' : 'Create User'} </Button>
        </div>
      </form>
    </div>
  );
}
