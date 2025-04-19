'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/app/components/Button';
import { UserSex } from '@/models/UserProfile';

// --- Define possible sex values for the dropdown ---
const sexOptions: UserSex[] = ['Male', 'Female', 'Other', 'Prefer not to say'];

const inputFieldStyles = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 text-sm";
const labelStyles = "block text-gray-700 text-sm font-bold mb-1";

export default function AddUserPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    employeeNumber: '',
    workPosition: '',
    birthdate: '',
    team: '',
    sex: '', // Add sex field to initial state
    role: 'user', // Default role
    status: 'approved', // Default status (admin adding likely approves directly)
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    // --- Validation ---
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }
    // --- Add sex to required check ---
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.sex) {
        setError('Please fill in all required fields (Email, Password, First Name, Last Name, Sex).');
        setIsLoading(false);
        return;
    }
    // Add more specific validation as needed

    // Prepare data for API (exclude confirmPassword)
    const { confirmPassword, ...apiData } = formData;

    try {
      // Use the /api/register endpoint as before
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Use message from API response if available
        throw new Error(result.message || result.error || 'Failed to create user.');
      }

      setSuccess('User created successfully! Redirecting...');
      setTimeout(() => {
        router.push('/ui/admin/user-management'); // Redirect back to the list
      }, 2000);

    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Use container style from User Management
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

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New User</h1>

      <form onSubmit={handleSubmit} className="space-y-6"> {/* Increased space-y */}

        {/* Error/Success Messages - Adjusted styling */}
        {error && <p className="text-center text-sm text-red-700 bg-red-50 p-3 rounded-md">{error}</p>}
        {success && <p className="text-center text-sm text-green-700 bg-green-50 p-3 rounded-md">{success}</p>}

        {/* Account Fields */}
        <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-lg font-semibold px-2 text-gray-700">Account Details</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label htmlFor="email" className={labelStyles}>Email <span className="text-red-500">*</span></label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className={inputFieldStyles} />
              </div>
              <div>
                <label htmlFor="role" className={labelStyles}>Role</label>
                <select id="role" name="role" value={formData.role} onChange={handleChange} className={`${inputFieldStyles} bg-white`}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label htmlFor="password" className={labelStyles}>Password <span className="text-red-500">*</span></label>
                <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required className={inputFieldStyles} />
              </div>
              <div>
                <label htmlFor="confirmPassword" className={labelStyles}>Confirm Password <span className="text-red-500">*</span></label>
                <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className={inputFieldStyles} />
              </div>
              <div>
                <label htmlFor="status" className={labelStyles}>Initial Status</label>
                <select id="status" name="status" value={formData.status} onChange={handleChange} className={`${inputFieldStyles} bg-white`}>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  {/* Add 'rejected' if needed */}
                </select>
              </div>
            </div>
        </fieldset>

        {/* Profile Fields */}
        <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-lg font-semibold px-2 text-gray-700">Profile Details</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label htmlFor="firstName" className={labelStyles}>First Name <span className="text-red-500">*</span></label>
                <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required className={inputFieldStyles} />
              </div>
              <div>
                <label htmlFor="lastName" className={labelStyles}>Last Name <span className="text-red-500">*</span></label>
                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required className={inputFieldStyles} />
              </div>
              {/* --- Sex Dropdown --- */}
              <div>
                <label htmlFor="sex" className={labelStyles}>Sex <span className="text-red-500">*</span></label>
                <select
                    id="sex"
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    required
                    className={`${inputFieldStyles} bg-white`}
                >
                    <option value="" disabled>Select Sex</option>
                    {sexOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
              </div>
              <div>
                <label htmlFor="birthdate" className={labelStyles}>Birthdate</label>
                <input type="date" id="birthdate" name="birthdate" value={formData.birthdate} onChange={handleChange} className={inputFieldStyles} />
              </div>
              <div>
                <label htmlFor="employeeNumber" className={labelStyles}>Employee Number</label>
                <input type="text" id="employeeNumber" name="employeeNumber" value={formData.employeeNumber} onChange={handleChange} className={inputFieldStyles} />
              </div>
              <div>
                <label htmlFor="workPosition" className={labelStyles}>Work Position/Position</label>
                <input type="text" id="workPosition" name="workPosition" value={formData.workPosition} onChange={handleChange} className={inputFieldStyles} />
              </div>
              <div>
                <label htmlFor="team" className={labelStyles}>Team</label>
                <input type="text" id="team" name="team" value={formData.team} onChange={handleChange} className={inputFieldStyles} />
              </div>
            </div>
        </fieldset>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex gap-3 justify-end"> {/* Added border */}
          <Button
            type="button"
            variant="back" // Use the 'back' variant from your Button component
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="submit" // Use the 'submit' variant
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Creating User...' : 'Create User'}
          </Button>
        </div>
      </form>
    </div>
  );
}
