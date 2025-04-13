'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IUser, UserStatus } from '@/models/User'; // Import UserStatus
import { IUserProfile } from '@/models/UserProfile'; // For displaying name

// Combined type for fetched user data (including profile for display)
interface UserEditData extends Omit<IUser, 'password' | 'profile'> {
    _id: string;
    profile: Pick<IUserProfile, 'firstName' | 'lastName'> | null; // Only need names from profile
}

// Define allowed roles and statuses from your API
const ALLOWED_ROLES: IUser['role'][] = ['user', 'admin']; // Match API
const ALLOWED_STATUSES: UserStatus[] = ['pending', 'approved', 'rejected']; // Match API

export default function AdminEditUserPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string; // Get user ID from URL

    // State for form data - initialize with potentially partial data
    const [formData, setFormData] = useState<Partial<Pick<IUser, 'role' | 'status'>>>({});
    // State to display non-editable info
    const [displayData, setDisplayData] = useState<Partial<UserEditData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // --- Fetch User Data ---
    useEffect(() => {
        if (!userId || typeof userId !== 'string') {
            setError('Invalid User ID.');
            setIsLoading(false);
            return;
        }

        const fetchUserData = async () => {
            setIsLoading(true);
            setError(null);
            setSuccessMessage(null); // Clear previous success messages
            try {
                // Use the GET endpoint for a single user
                const response = await fetch(`/api/users/${userId}`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Failed to fetch user data: ${response.statusText}`);
                }
                const data = await response.json();

                // API returns { user: { ... } } structure
                if (data && data.user) {
                     // Ensure role/status are valid, default if not (shouldn't happen if DB is consistent)
                     const validatedRole = ALLOWED_ROLES.includes(data.user.role) ? data.user.role : 'user';
                     const validatedStatus = ALLOWED_STATUSES.includes(data.user.status) ? data.user.status : 'pending';

                     // Set data for display
                     setDisplayData(data.user);
                     // Set initial form data for editable fields
                     setFormData({
                        role: validatedRole,
                        status: validatedStatus,
                     });
                } else {
                    throw new Error('User data not found in API response.');
                }
            } catch (err: any) {
                console.error("Error fetching user:", err);
                setError(err.message || 'An unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [userId]); // Re-run if userId changes

    // --- Handle Input Changes ---
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear success message when user starts editing again
        setSuccessMessage(null);
    };

    // --- Handle Form Submission ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        // Prepare data to send - only include role and status
        const updateData: Partial<Pick<IUser, 'role' | 'status'>> = {};
        if (formData.role && formData.role !== displayData.role) {
            updateData.role = formData.role;
        }
        if (formData.status && formData.status !== displayData.status) {
            updateData.status = formData.status;
        }

        if (Object.keys(updateData).length === 0) {
            setError("No changes detected.");
            setIsSubmitting(false);
            return;
        }

        try {
            // Use the PATCH endpoint for updating User details (role, status)
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PATCH', // Use PATCH for partial updates
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData), // Send only role and/or status
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to update user.');
            }

            setSuccessMessage('User updated successfully!');
            // Update display data to reflect the saved changes
            setDisplayData(prev => ({...prev, ...updateData}));
            // Optionally navigate back after a delay or keep user on page
            // setTimeout(() => router.push('/admin/user-management'), 1500);

        } catch (err: any) {
            console.error("Error updating user:", err);
            setError(err.message || 'An unknown error occurred during update.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Logic ---
    if (isLoading) {
        return <div className="container mx-auto p-6 text-center text-black">Loading user data...</div>; // Changed text color
    }

    if (error && !displayData._id) { // Show critical error if loading failed
        return (
            // Keep error text red for visibility
            <div className="container mx-auto p-6 bg-red-100 border border-red-400 text-red-700 rounded">
                <h2 className="text-xl font-semibold mb-2">Error Loading User</h2>
                <p>{error}</p>
                <button
                    onClick={() => router.back()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const userName = displayData.profile ? `${displayData.profile.firstName} ${displayData.profile.lastName}` : displayData.email;

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-2xl">
            <button
                onClick={() => router.back()}
                className="mb-4 text-sm text-blue-600 hover:text-blue-800"
            >
                &larr; Back to User Management
            </button>
            {/* Changed text-gray-800 to text-black */}
            <h1 className="mb-4 text-2xl font-semibold text-white">
                Edit User: {userName || `(ID: ${userId})`}
            </h1>

            {/* Display non-critical errors or success messages (keep semantic colors) */}
            {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">Error: {error}</p>}
            {successMessage && <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{successMessage}</p>}

            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md border border-gray-200">
                {/* Display non-editable info */}
                <div className="mb-4 border-b pb-4">
                     {/* Changed text-gray-900 to text-black */}
                     <h3 className="text-lg font-medium text-black mb-2">User Information</h3>
                     {/* Changed text-gray-600 to text-black */}
                     <p className="text-sm text-black"><strong>Email:</strong> {displayData.email || 'N/A'}</p>
                     {/* Changed text-gray-600 to text-black */}
                     <p className="text-sm text-black"><strong>Name:</strong> {displayData.profile ? `${displayData.profile.firstName} ${displayData.profile.lastName}` : 'N/A'}</p>
                     {/* Add other display fields if needed, e.g., profile details */}
                </div>

                {/* Editable Fields */}
                <div>
                    {/* Already text-black */}
                    <label htmlFor="role" className="block text-sm font-medium text-black">
                        Role *
                    </label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role || ''}
                        onChange={handleChange}
                        required
                        // Input text color is usually inherited or browser default, often black
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-black"
                        disabled={isSubmitting}
                    >
                        <option value="" disabled>Select a role</option>
                        {ALLOWED_ROLES.map(role => (
                            <option key={role} value={role} className="capitalize">
                                {role}
                            </option>
                        ))}
                    </select>
                </div>

                 <div>
                    {/* Changed text-gray-700 to text-black */}
                    <label htmlFor="status" className="block text-sm font-medium text-black">
                        Account Status *
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status || ''}
                        onChange={handleChange}
                        required
                        // Input text color is usually inherited or browser default, often black
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-black"
                        disabled={isSubmitting}
                    >
                         <option value="" disabled>Select a status</option>
                        {ALLOWED_STATUSES.map(status => (
                            <option key={status} value={status} className="capitalize">
                                {status}
                            </option>
                        ))}
                    </select>
                 </div>


                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()} // Go back without saving
                        // Keep button text colors as they are for contrast
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        // Keep button text colors as they are for contrast
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        disabled={isSubmitting || isLoading || !!successMessage} // Disable if submitting, loading, or already successful
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
