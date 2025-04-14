// src/app/ui/admin/user-management/add/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/app/components/Button'; // Import your Button component

export default function AddUserPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    badgeNumber: '',
    rank: '',
    birthdate: '',
    department: '',
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
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
        setError('Please fill in all required fields (Email, Password, First Name, Last Name).');
        setIsLoading(false);
        return;
    }
    // Add more specific validation as needed

    // Prepare data for API (exclude confirmPassword)
    const { confirmPassword, ...apiData } = formData;

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user.');
      }

      setSuccess('User created successfully! Redirecting...');
      // Clear form (optional)
      // setFormData({ email: '', password: '', confirmPassword: '', ... });
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
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-center">Add New User</h1>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 space-y-4">

        {/* Error/Success Messages */}
        {error && <p className="text-center text-sm text-red-600 bg-red-100 p-2 rounded border border-red-300">{error}</p>}
        {success && <p className="text-center text-sm text-green-600 bg-green-100 p-2 rounded border border-green-300">{success}</p>}

        {/* Account Fields */}
        <h2 className="text-xl font-semibold border-b pb-2">Account Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-1">Email <span className="text-red-500">*</span></label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="input-field" />
          </div>
           <div>
            <label htmlFor="role" className="block text-gray-700 text-sm font-bold mb-1">Role</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange} className="input-field bg-white">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-1">Password <span className="text-red-500">*</span></label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required className="input-field" />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-1">Confirm Password <span className="text-red-500">*</span></label>
            <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="input-field" />
          </div>
           <div>
            <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-1">Initial Status</label>
            <select id="status" name="status" value={formData.status} onChange={handleChange} className="input-field bg-white">
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              {/* Add 'rejected' if needed, though less common for direct creation */}
            </select>
          </div>
        </div>

        {/* Profile Fields */}
        <h2 className="text-xl font-semibold border-b pb-2 mt-6">Profile Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-gray-700 text-sm font-bold mb-1">First Name <span className="text-red-500">*</span></label>
            <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required className="input-field" />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-gray-700 text-sm font-bold mb-1">Last Name <span className="text-red-500">*</span></label>
            <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required className="input-field" />
          </div>
          <div>
            <label htmlFor="birthdate" className="block text-gray-700 text-sm font-bold mb-1">Birthdate</label>
            <input type="date" id="birthdate" name="birthdate" value={formData.birthdate} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label htmlFor="badgeNumber" className="block text-gray-700 text-sm font-bold mb-1">Badge Number</label>
            <input type="text" id="badgeNumber" name="badgeNumber" value={formData.badgeNumber} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label htmlFor="rank" className="block text-gray-700 text-sm font-bold mb-1">Rank/Position</label>
            <input type="text" id="rank" name="rank" value={formData.rank} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label htmlFor="department" className="block text-gray-700 text-sm font-bold mb-1">Department</label>
            <input type="text" id="department" name="department" value={formData.department} onChange={handleChange} className="input-field" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-4 border-t flex gap-3 justify-end">
          <Button
            type="button" // Important: type="button" to prevent form submission
            variant="back"
            onClick={() => router.back()} // Go back to previous page
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="submit"
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

// Add a simple CSS class for inputs if not already globally defined
// You might put this in your globals.css or define it here if needed
// .input-field {
//   @apply shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500;
// }
