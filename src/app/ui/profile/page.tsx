'use client'; // This needs to be a client component

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { IUser } from '@/models/User';
import { IUserProfile } from '@/models/UserProfile';
import Button from '@/app/components/Button'; // Import the Button component

// Define a type for the fetched data structure
interface UserWithProfile extends Omit<IUser, 'profile' | 'password'> { // Exclude password
  _id: string; // Ensure _id is present for API calls
  profile: IUserProfile & { _id?: string }; // Profile might have its own _id
}

// Define a type for the editable fields in the form
type EditableProfileFields = Pick<IUserProfile, 'firstName' | 'lastName' | 'badgeNumber' | 'rank' | 'department'> & { birthdate: string };

export default function ProfilePage() {
  const { data: session, status: sessionStatus } = useSession();
  const [userData, setUserData] = useState<UserWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // For initial load and saving profile
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false); // State to track profile edit mode
  const [formData, setFormData] = useState<Partial<EditableProfileFields>>({}); // State for profile form data during edit

  // --- State for Password Change ---
  const [isChangingPassword, setIsChangingPassword] = useState(false); // State for modal/form visibility
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false); // Loading state for password change

  // --- Fetch User Profile ---
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      const fetchUserProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch('/api/users/own-profile');
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to fetch profile (${response.status})`);
          }
          const result = await response.json();
          if (result.data && result.data.profile) {
            const fetchedUser = result.data as UserWithProfile;
            setUserData(fetchedUser);
            // Initialize form data when profile is loaded or when entering edit mode later
            setFormData({
              firstName: fetchedUser.profile.firstName || '',
              lastName: fetchedUser.profile.lastName || '',
              badgeNumber: fetchedUser.profile.badgeNumber || '',
              rank: fetchedUser.profile.rank || '',
              birthdate: fetchedUser.profile.birthdate ? new Date(fetchedUser.profile.birthdate).toISOString().split('T')[0] : '',
              department: fetchedUser.profile.department || '',
            });
          } else {
            throw new Error("Fetched data is missing user or profile information.");
          }
        } catch (err: any) {
          console.error("Error fetching user profile:", err);
          setError(err.message || 'An unexpected error occurred.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchUserProfile();
    } else if (sessionStatus === 'unauthenticated') {
      setIsLoading(false);
      setError("You must be logged in to view this page.");
    }
  }, [sessionStatus]);

  // --- Profile Edit Event Handlers ---

  // Handle input changes in profile edit mode
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Toggle profile edit mode
  const handleEditToggle = () => {
    if (!isEditing && userData?.profile) {
      // Entering edit mode: Reset form data to current profile data
      setFormData({
        firstName: userData.profile.firstName || '',
        lastName: userData.profile.lastName || '',
        badgeNumber: userData.profile.badgeNumber || '',
        rank: userData.profile.rank || '',
        birthdate: userData.profile.birthdate ? new Date(userData.profile.birthdate).toISOString().split('T')[0] : '', // Format for date input
        department: userData.profile.department || '',
      });
      setError(null); // Clear previous errors when starting edit
      setIsChangingPassword(false); // Ensure password change is closed
    }
    setIsEditing(!isEditing);
  };

  // Handle saving profile changes
  const handleSave = async () => {
    if (!userData?._id) {
        setError("User ID is missing, cannot save.");
        return;
    }
    setIsLoading(true); // Indicate saving process
    setError(null);

    const updateData: Partial<EditableProfileFields> = { ...formData };

    try {
        const response = await fetch(`/api/users/${userData._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to update profile. Status: ${response.status}`);
        }

        const result = await response.json();

        if (result.data && userData) {
             setUserData(prevUserData => prevUserData ? {
                ...prevUserData,
                profile: {
                    ...prevUserData.profile,
                    ...result.data
                }
             } : null);
        }

        setIsEditing(false); // Exit edit mode

    } catch (err: any) {
        console.error("Failed to save profile:", err);
        setError(err.message || "Failed to save profile.");
    } finally {
        setIsLoading(false);
    }
  };

  // --- Password Change Handlers ---

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({ ...prev, [name]: value }));
  };

  // Function to open/close the password change section/modal
  const handleTogglePasswordChange = () => {
    setIsChangingPassword(!isChangingPassword);
    // Reset form and messages when opening/closing
    setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError(null);
    setPasswordSuccess(null);
    // Ensure we are not in general edit mode when changing password
    if (!isChangingPassword) {
      setIsEditing(false); // Close profile edit mode if opening password change
    }
  };

  const handlePasswordSave = async () => {
    if (!userData?._id) {
      setPasswordError("User information is missing.");
      return;
    }
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (!passwordFormData.currentPassword || !passwordFormData.newPassword) {
        setPasswordError("All password fields are required.");
        return;
    }
    // Add more validation (e.g., password complexity) if needed

    setIsSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      // *** IMPORTANT: Make sure this API endpoint exists and is implemented ***
      const response = await fetch(`/api/users/own-profile/password-change`, { // Example endpoint
        method: 'PATCH', // Or PUT
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword,
        }),
      });

      const result = await response.json(); // Try to parse JSON regardless of status

      if (!response.ok) {
        throw new Error(result.error || `Failed to update password. Status: ${response.status}`);
      }

      setPasswordSuccess("Password updated successfully!");
      // Optionally clear fields or close form after success
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      // Close the form/modal after a short delay
      setTimeout(() => {
        handleTogglePasswordChange(); // Close the password change section
      }, 2000);

    } catch (err: any) {
      console.error("Failed to save password:", err);
      setPasswordError(err.message || "Failed to save password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  // --- Render Logic ---

  // Helper function to render profile fields (view or edit)
  const renderField = (
    label: string,
    name: keyof EditableProfileFields,
    displayValue: string | undefined | null,
    type: string = 'text',
    readOnly: boolean = false
  ) => (
    <div className="mb-4">
      <label htmlFor={name} className="block text-gray-700 text-sm font-bold mb-1">{label}:</label>
      {isEditing && !readOnly ? (
        <input
          id={name}
          type={type}
          name={name}
          value={formData[name] || ''}
          onChange={handleInputChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
          disabled={isLoading} // Disable input while saving profile
        />
      ) : (
        <p className="text-gray-800 break-words">{displayValue || 'N/A'}</p>
      )}
    </div>
  );

  // --- Main Render ---
  if (sessionStatus === 'loading' || (isLoading && !userData && !error)) {
    return <div className="container mx-auto p-4 text-center">Loading profile...</div>;
  }

  if (error && !userData) {
    return <div className="container mx-auto p-4 text-center text-red-600">Error: {error}</div>;
  }

  if (!userData || !userData.profile) {
    return <div className="container mx-auto p-4 text-center">Could not load profile data. Please try again later.</div>;
  }

  const { email, role, status: accountStatus } = userData;
  const { firstName, lastName, badgeNumber, rank, department, birthdate } = userData.profile;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-center">Your Profile</h1>

      {/* Display general error messages (e.g., profile save errors) */}
      {error && <div className="mb-4 p-3 text-center text-red-700 bg-red-100 border border-red-400 rounded">{error}</div>}

      {/* --- Main Profile Card (Hidden when changing password) --- */}
      <div className={`bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 ${isChangingPassword ? 'hidden' : 'block'}`}>

        {/* Account Information */}
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Account Information</h2>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">Email:</label>
            <p className="text-gray-800">{email}</p>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">Role:</label>
            <p className="text-gray-800 capitalize">{role}</p>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">Account Status:</label>
            <p className={`text-gray-800 capitalize font-medium ${
                accountStatus === 'approved' ? 'text-green-600' :
                accountStatus === 'pending' ? 'text-yellow-600' :
                'text-red-600'
            }`}>{accountStatus}</p>
          </div>
        </div>

        {/* Personal Information */}
        <h2 className="text-xl font-semibold mb-4 mt-6 border-b pb-2">Personal Information</h2>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {renderField("First Name", "firstName", firstName)}
          {renderField("Last Name", "lastName", lastName)}
          {renderField("Birthdate", "birthdate", birthdate ? new Date(birthdate).toLocaleDateString() : 'N/A', 'date')}
        </div>

        {/* Professional Information */}
        <h2 className="text-xl font-semibold mb-4 mt-6 border-b pb-2">Professional Information</h2>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {renderField("Badge Number", "badgeNumber", badgeNumber)}
          {renderField("Rank", "rank", rank)}
          {renderField("Department", "department", department)}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-4 border-t flex flex-wrap gap-3 justify-end"> {/* Added flex-wrap */}
            {isEditing ? (
                <>
                    <Button variant="back" onClick={handleEditToggle} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button variant="submit" onClick={handleSave} isLoading={isLoading} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </>
            ) : (
                <>
                    {/* Show Change Password button only when NOT editing profile */}
                    <Button variant="secondary" onClick={handleTogglePasswordChange} disabled={isLoading}>
                        Change Password
                    </Button>
                    <Button variant="edit" onClick={handleEditToggle} disabled={isLoading}>
                        Edit Profile
                    </Button>
                </>
            )}
        </div>
      </div>

      {/* --- Password Change Section/Form (Shown when isChangingPassword is true) --- */}
      {isChangingPassword && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Change Password</h2>

          {/* Password Error/Success Messages */}
          {passwordError && <p className="mb-4 text-center text-sm text-red-600">{passwordError}</p>}
          {passwordSuccess && <p className="mb-4 text-center text-sm text-green-600">{passwordSuccess}</p>}

          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-gray-700 text-sm font-bold mb-1">Current Password:</label>
              <input
                id="currentPassword"
                type="password"
                name="currentPassword"
                value={passwordFormData.currentPassword}
                onChange={handlePasswordInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                disabled={isSavingPassword}
                required
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-gray-700 text-sm font-bold mb-1">New Password:</label>
              <input
                id="newPassword"
                type="password"
                name="newPassword"
                value={passwordFormData.newPassword}
                onChange={handlePasswordInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                disabled={isSavingPassword}
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-1">Confirm New Password:</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={passwordFormData.confirmPassword}
                onChange={handlePasswordInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                disabled={isSavingPassword}
                required
              />
              {/* Optional: Add password strength indicator here */}
            </div>
          </div>

          {/* Password Action Buttons */}
          <div className="mt-8 pt-4 border-t flex gap-3 justify-end">
            <Button variant="back" onClick={handleTogglePasswordChange} disabled={isSavingPassword}>
              Cancel
            </Button>
            <Button variant="submit" onClick={handlePasswordSave} isLoading={isSavingPassword} disabled={isSavingPassword}>
              {isSavingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
