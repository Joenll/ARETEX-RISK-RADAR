// src/app/ui/admin/user-management/[id]/edit/page.tsx
'use client';

import React, { useState, useEffect, FormEvent, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IUser, UserStatus } from '@/models/User';
// --- Import UserProfile for display ---
import { IUserProfile } from '@/models/UserProfile'; // Keep for displaying profile info
import Button from '@/app/components/Button';

// Combined type for fetched user data (including profile for display)
// Keep profile info for display purposes
interface UserEditData extends Omit<IUser, 'password' | 'profile'> {
    _id: string;
    profile: Pick<IUserProfile, 'firstName' | 'lastName' | 'sex'> | null; // Keep sex for display
}

// Define allowed roles and statuses from your API
const ALLOWED_ROLES: IUser['role'][] = ['user', 'admin'];
const ALLOWED_STATUSES: UserStatus[] = ['pending', 'approved', 'rejected'];

// --- Define consistent input/select styling ---
const inputFieldStyles = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 text-sm";
const labelStyles = "block text-gray-700 text-sm font-bold mb-1";
const selectStyles = `${inputFieldStyles} bg-white`;

export default function AdminEditUserPage({ params }: { params: { id: string } }) {
    const resolvedParams = use(params);
    const { id: userId } = resolvedParams;
    const router = useRouter();

    // --- Updated: State for form data (only role and status) ---
    const [formData, setFormData] = useState<Partial<Pick<IUser, 'role' | 'status'>>>({});
    // State to display non-editable info
    const [displayData, setDisplayData] = useState<Partial<UserEditData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // --- Fetch User Data ---
    useEffect(() => {
        if (!userId || typeof userId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(userId)) {
            setError('Invalid User ID.');
            setIsLoading(false);
            return;
        }

        const fetchUserData = async () => {
            setIsLoading(true);
            setError(null);
            setSuccessMessage(null);
            try {
                // Ensure API fetches profile data for display
                const response = await fetch(`/api/users/${userId}`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Failed to fetch user data: ${response.statusText}`);
                }
                const data = await response.json();

                if (data && data.user) {
                     // Ensure role/status are valid, default if not
                     const validatedRole = ALLOWED_ROLES.includes(data.user.role) ? data.user.role : 'user';
                     const validatedStatus = ALLOWED_STATUSES.includes(data.user.status) ? data.user.status : 'pending';

                     // Set data for display
                     setDisplayData(data.user);
                     // --- Updated: Set initial form data (only role and status) ---
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // --- Handle Input Changes (Only for Select elements now) ---
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSuccessMessage(null);
    };

    // --- Handle Form Submission ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        // --- Updated: Prepare data to send (only role and status) ---
        const updateData: Partial<Pick<IUser, 'role' | 'status'>> = {};

        if (formData.role && formData.role !== displayData.role) {
            updateData.role = formData.role;
        }
        if (formData.status && formData.status !== displayData.status) {
            updateData.status = formData.status;
        }
        // --- Removed sex check ---

        if (Object.keys(updateData).length === 0) {
            setError("No changes detected.");
            setIsSubmitting(false);
            return;
        }

        try {
            // API endpoint remains the same, but payload is smaller
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to update user.');
            }

            setSuccessMessage('User updated successfully!');
            // --- Updated: Refresh display and form data (without sex) ---
            if (result.user) {
                 setDisplayData(result.user); // Update display data fully
                 setFormData({ // Reset form data based on new state
                    role: result.user.role,
                    status: result.user.status,
                 });
            } else {
                 // Fallback update (less ideal)
                 setDisplayData(prev => ({
                    ...prev,
                    ...updateData, // Apply only role/status changes locally
                 }));
            }

        } catch (err: any) {
            console.error("Error updating user:", err);
            setError(err.message || 'An unknown error occurred during update.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Logic ---
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-32">
                <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
            </div>
        );
    }

    if (error && !displayData._id) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 border border-red-300 max-w-3xl mx-auto mt-10">
                <h2 className="text-xl font-semibold mb-4 text-red-700">Error Loading User</h2>
                <p className="text-red-600">{error}</p>
                <div className="mt-6 flex justify-end">
                    <Button variant="back" onClick={() => router.back()}>
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const userName = displayData.profile ? `${displayData.profile.firstName} ${displayData.profile.lastName}` : displayData.email;

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

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
                Edit User: {userName || `(ID: ${userId})`}
            </h1>

            {/* Messages */}
            {error && <p className="mb-4 text-center text-sm text-red-700 bg-red-50 p-3 rounded-md">{error}</p>}
            {successMessage && <p className="mb-4 text-center text-sm text-green-700 bg-green-50 p-3 rounded-md">{successMessage}</p>}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Display non-editable info */}
                <fieldset className="border border-gray-200 rounded-lg p-4">
                    <legend className="text-lg font-semibold px-2 text-gray-700">User Information</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 pt-2 text-sm text-gray-800">
                        <p><strong>Email:</strong> {displayData.email || 'N/A'}</p>
                        <p><strong>Name:</strong> {displayData.profile ? `${displayData.profile.firstName} ${displayData.profile.lastName}` : 'N/A'}</p>
                        <p><strong>Sex:</strong> {displayData.profile?.sex || 'N/A'}</p> {/* Still displayed */}
                        {/* Display other profile fields if needed */}
                    </div>
                </fieldset>

                {/* Editable Fields */}
                <fieldset className="border border-gray-200 rounded-lg p-4">
                    <legend className="text-lg font-semibold px-2 text-gray-700">Update Details</legend>
                    {/* --- Updated: Grid only contains role and status --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                            <label htmlFor="role" className={labelStyles}>
                                Role <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role || ''}
                                onChange={handleChange}
                                required
                                className={selectStyles}
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
                            <label htmlFor="status" className={labelStyles}>
                                Account Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status || ''}
                                onChange={handleChange}
                                required
                                className={selectStyles}
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

                        {/* --- Removed Sex Dropdown --- */}

                    </div>
                </fieldset>

                {/* Action Buttons */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex gap-3 justify-end">
                    <Button
                        type="button"
                        variant="back"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="submit"
                        className="min-w-[140px]"
                        isLoading={isSubmitting}
                        disabled={isSubmitting || isLoading || !!successMessage}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
