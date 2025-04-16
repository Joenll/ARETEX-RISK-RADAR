// src/app/ui/profile/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import { useSession, signOut } from 'next-auth/react'; // Added signOut
import { IUser } from '@/models/User';
import { IUserProfile, UserSex } from '@/models/UserProfile';
// Assuming Button component exists and accepts standard props like onClick, disabled, isLoading, children, variant (optional)
// If your Button component API is different, you might need to adjust the Button usage below.
// import Button from '@/app/components/Button'; // Keep your Button import if you use it

// --- Define possible sex values for the dropdown ---
const sexOptions: UserSex[] = ['Male', 'Female', 'Other', 'Prefer not to say'];

// Define a type for the fetched data structure
interface UserWithProfile extends Omit<IUser, 'profile' | 'password'> {
  _id: string;
  profile: IUserProfile & { _id?: string };
}

// Define a type for the editable fields in the form
type EditableProfileFields = Pick<IUserProfile, 'firstName' | 'lastName' | 'employeeNumber' | 'workPosition' | 'team' | 'sex'> & { birthdate: string };

export default function ProfilePage() {
  const { data: session, status: sessionStatus } = useSession();
  const [userData, setUserData] = useState<UserWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // For initial load and saving profile
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false); // State to track profile edit mode
  const [formData, setFormData] = useState<Partial<EditableProfileFields>>({}); // State for profile form data during edit

  // --- State for Password Change ---
  // Using isChangingPassword to control modal visibility now
  const [isChangingPassword, setIsChangingPassword] = useState(false); // State for modal visibility
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false); // Loading state for password change

  // Ref for potential future file input (not used in this version)
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            // Initialize form data when profile is loaded
            setFormData({
              firstName: fetchedUser.profile.firstName || '',
              lastName: fetchedUser.profile.lastName || '',
              employeeNumber: fetchedUser.profile.employeeNumber || '',
              workPosition: fetchedUser.profile.workPosition || '',
              birthdate: fetchedUser.profile.birthdate ? new Date(fetchedUser.profile.birthdate).toISOString().split('T')[0] : '',
              team: fetchedUser.profile.team || '',
              sex: fetchedUser.profile.sex || '',
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        employeeNumber: userData.profile.employeeNumber || '',
        workPosition: userData.profile.workPosition || '',
        birthdate: userData.profile.birthdate ? new Date(userData.profile.birthdate).toISOString().split('T')[0] : '',
        team: userData.profile.team || '',
        sex: userData.profile.sex || '',
      });
      setError(null); // Clear previous errors when starting edit
      setIsChangingPassword(false); // Ensure password change modal is closed
    } else if (isEditing) {
        // Exiting edit mode (Cancel): Reset form data if needed or just toggle state
        // Optionally reset formData back to original userData if changes shouldn't persist visually after cancel
    }
    setIsEditing(!isEditing);
  };

  // Handle saving profile changes
  const handleSave = async () => {
    if (!userData?._id) {
        setError("User ID is missing, cannot save.");
        return;
    }
    if (isEditing && (!formData.sex || !sexOptions.includes(formData.sex as UserSex))) {
        setError("Please select a valid option for Sex.");
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
             // Update formData state as well to reflect saved data if user immediately clicks edit again
             setFormData(prev => ({
                 ...prev,
                 ...result.data // Assuming result.data contains the updated profile fields
             }));
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

  // Function to open/close the password change modal
  const handleTogglePasswordChange = () => {
    setIsChangingPassword(!isChangingPassword);
    // Reset form and messages when opening/closing modal
    setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError(null);
    setPasswordSuccess(null);
    // Ensure we are not in general edit mode when changing password
    if (!isChangingPassword) {
      setIsEditing(false); // Close profile edit mode if opening password change
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission

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

    setIsSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const response = await fetch(`/api/users/own-profile/password-change`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to update password. Status: ${response.status}`);
      }

      setPasswordSuccess("Password updated successfully!");
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      setTimeout(() => {
        handleTogglePasswordChange(); // Close the modal
      }, 2000);

    } catch (err: any) {
      console.error("Failed to save password:", err);
      setPasswordError(err.message || "Failed to save password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  // --- Render Logic ---

  // Helper to get initials
  const getInitials = (firstName?: string, lastName?: string): string => {
    const first = firstName?.[0]?.toUpperCase() || '';
    const last = lastName?.[0]?.toUpperCase() || '';
    return `${first}${last}` || '?';
  };

  // --- Main Render ---
  if (sessionStatus === 'loading' || (isLoading && !userData && !error)) {
    // Use a simple loading state consistent with the new design's feel
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading profile...</div>;
  }

  // Display error if fetching failed and no user data is available
  if (error && !userData && sessionStatus !== 'loading') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 text-center text-red-600">Error: {error}</div>;
  }

  // Handle case where user is not authenticated
  if (sessionStatus === 'unauthenticated') {
     return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 text-center text-red-600">Error: You must be logged in to view this page.</div>;
  }

  // Handle case where data fetching finished but something went wrong (should ideally be caught by error state)
  if (!userData || !userData.profile) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 text-center">Could not load profile data. Please try again later.</div>;
  }

  // Destructure data for easier access in JSX
  const { email, role, status: accountStatus } = userData;
  const { firstName, lastName, employeeNumber, workPosition, team, birthdate, sex } = userData.profile;
  const initials = getInitials(firstName, lastName);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      {/* Profile Header */}
      <div className="mb-6 max-w-4xl mx-auto"> {/* Added max-w-4xl mx-auto to align with card */}
        <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
        <p className="text-sm text-gray-500">
          View and manage your personal profile details.
        </p>
      </div>

      {/* Display general error messages (e.g., profile save errors) */}
      {error && !isChangingPassword && ( // Show general errors only when not in password modal
          <div className="mb-4 p-3 max-w-4xl mx-auto text-center text-red-700 bg-red-100 border border-red-400 rounded">
              {error}
          </div>
      )}

      {/* Profile Card - Main content area */}
      {/* Note: The design didn't explicitly hide this when changing password, but kept your logic */}
      <div className={`bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto ${isChangingPassword ? 'hidden' : 'block'}`}>
        <div className="flex flex-col items-center mb-8 relative">
          {/* Initial Avatar */}
          <div className="relative h-24 w-24 mb-4 flex items-center justify-center bg-orange-500 rounded-full border-2 border-orange-500 text-white text-3xl font-semibold">
            {initials}
            {/* Placeholder for future picture update button if needed
            <button
              // onClick={togglePictureUpdate} // Add handler if implemented
              className="absolute -bottom-2 -right-2 bg-orange-500 rounded-full p-2 shadow-md hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300"
              aria-label="Update profile picture"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor" >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-10 10a2 2 0 01-1.414.586H4a1 1 0 01-1-1v-1a2 2 0 01.586-1.414l10-10z" />
              </svg>
            </button>
            */}
          </div>

          {/* Profile Name & Role/team */}
          <h2 className="text-xl font-bold text-gray-800">
            {firstName || ''} {lastName || ''}
          </h2>
          <p className="text-sm text-gray-600 capitalize">
            {workPosition || 'N/A'} {workPosition && team ? ' - ' : ''} {team || ''}
          </p>

          {/* Edit Profile Button */}
          {!isEditing && ( // Show Edit button only when not editing
            <button
              onClick={handleEditToggle}
              disabled={isLoading} // Disable if profile is saving (though unlikely state)
              className="absolute top-0 right-0 flex items-center gap-1 px-3 py-1 text-xs border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-blue-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-10 10a2 2 0 01-1.414.586H4a1 1 0 01-1-1v-1a2 2 0 01.586-1.414l10-10z" />
              </svg>
              Edit
            </button>
          )}

          {/* Edit Status Indicator */}
          {isEditing && (
            <p className="mt-2 text-sm text-orange-500 font-medium">
              You can now update your profile details below.
            </p>
          )}
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* First Name */}
          <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="firstName" className="block text-xs text-gray-500 mb-1">First Name</label>
            <div className="text-gray-700">
              {isEditing ? (
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                  disabled={isLoading}
                />
              ) : (
                firstName || 'N/A'
              )}
            </div>
          </div>

          {/* Last Name */}
          <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="lastName" className="block text-xs text-gray-500 mb-1">Last Name</label>
            <div className="text-gray-700">
              {isEditing ? (
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                  disabled={isLoading}
                />
              ) : (
                lastName || 'N/A'
              )}
            </div>
          </div>

          {/* Birthdate */}
          <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="birthdate" className="block text-xs text-gray-500 mb-1">Birthday</label>
            <div className="text-gray-700">
              {isEditing ? (
                <input
                  id="birthdate"
                  type="date" // Use date type for better UX
                  name="birthdate"
                  value={formData.birthdate || ''} // Expects 'YYYY-MM-DD'
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                  disabled={isLoading}
                />
              ) : (
                birthdate ? new Date(birthdate).toLocaleDateString() : 'N/A'
              )}
            </div>
          </div>

          {/* Sex / Gender */}
          <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="sex" className="block text-xs text-gray-500 mb-1">Sex</label>
            <div className="text-gray-700">
              {isEditing ? (
                <select
                  id="sex"
                  name="sex"
                  value={formData.sex || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                  disabled={isLoading}
                >
                  <option value="" disabled>Select Sex</option>
                  {sexOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                sex || 'N/A'
              )}
            </div>
          </div>

          {/* team */}
          <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="team" className="block text-xs text-gray-500 mb-1">team</label>
            <div className="text-gray-700">
              {isEditing ? (
                <input
                  id="team"
                  type="text"
                  name="team"
                  value={formData.team || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                  disabled={isLoading}
                />
              ) : (
                team || 'N/A'
              )}
            </div>
          </div>

          {/* workPosition / Position */}
          <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="workPosition" className="block text-xs text-gray-500 mb-1">workPosition / Position</label>
            <div className="text-gray-700">
              {isEditing ? (
                <input
                  id="workPosition"
                  type="text"
                  name="workPosition"
                  value={formData.workPosition || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                  disabled={isLoading}
                />
              ) : (
                workPosition || 'N/A'
              )}
            </div>
          </div>

           {/* Badge Number */}
           <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="employeeNumber" className="block text-xs text-gray-500 mb-1">Employee Number</label>
            <div className="text-gray-700">
              {isEditing ? (
                <input
                  id="employeeNumber"
                  type="text"
                  name="employeeNumber"
                  value={formData.employeeNumber || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                  disabled={isLoading}
                />
              ) : (
                employeeNumber || 'N/A'
              )}
            </div>
          </div>

          {/* Account Status (Read Only) */}
           <div className="bg-gray-50 p-4 rounded">
            <label className="block text-xs text-gray-500 mb-1">Account Status</label>
            <div className={`text-gray-700 capitalize font-medium ${
                accountStatus === 'approved' ? 'text-green-600' :
                accountStatus === 'pending' ? 'text-yellow-600' :
                'text-red-600'
            }`}>
              {accountStatus}
            </div>
          </div>

           {/* Role (Read Only) */}
           <div className="bg-gray-50 p-4 rounded">
            <label className="block text-xs text-gray-500 mb-1">Role</label>
            <div className="text-gray-700 capitalize">
              {role}
            </div>
          </div>

        </div> {/* End of Grid */}

        {/* Email Section */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-700 mb-1">
            My email Address
          </p>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-700">{email}</p>
          </div>
        </div>

        {/* Password Section */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-700 mb-1">
            Password Setting
          </p>
          <button
            onClick={handleTogglePasswordChange}
            disabled={isLoading || isEditing} // Disable if profile is saving or being edited
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-50"
          >
            Change Password
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 border-t pt-6 mt-6"> {/* Added border-t, pt, mt */}
          {isEditing ? (
            <>
              {/* Cancel Button */}
              <button
                onClick={handleEditToggle} // Re-use toggle to cancel
                disabled={isLoading}
                className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
              >
                Cancel
              </button>
              {/* Save Changes Button */}
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
             /* Log Out Button - Show only when not editing */
             <button
                onClick={() => signOut({ callbackUrl: '/' })} // Sign out and redirect to home
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
             >
                Log Out
             </button>
          )}
        </div>
      </div> {/* End of Profile Card */}

      {/* Password Change Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"> {/* Added p-4 for padding on small screens */}
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200"> {/* Adjusted padding */}
              <h3 className="text-xl font-bold text-gray-800">
                Change Password
              </h3>
              {/* Close button using an X icon */}
              <button
                type="button"
                onClick={handleTogglePasswordChange}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                aria-label="Close modal"
                disabled={isSavingPassword} // Disable close button while saving
              >
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
              </button>
            </div>

            {/* Modal Body - Form */}
            <form onSubmit={handlePasswordSubmit} className="p-6">
              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label
                    htmlFor="currentPasswordModal" // Use unique ID for modal inputs
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPasswordModal"
                    name="currentPassword"
                    value={passwordFormData.currentPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter your current password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                    disabled={isSavingPassword}
                  />
                </div>

                {/* New Password */}
                <div>
                  <label
                    htmlFor="newPasswordModal"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPasswordModal"
                    name="newPassword"
                    value={passwordFormData.newPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                    disabled={isSavingPassword}
                  />
                </div>

                {/* Confirm New Password */}
                <div>
                  <label
                    htmlFor="confirmPasswordModal"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPasswordModal"
                    name="confirmPassword"
                    value={passwordFormData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                    disabled={isSavingPassword}
                  />
                </div>

                {/* Error Message */}
                {passwordError && (
                  <div className="text-red-500 text-sm text-center">{passwordError}</div>
                )}

                {/* Success Message */}
                {passwordSuccess && (
                  <div className="text-green-500 text-sm text-center">
                    {passwordSuccess}
                  </div>
                )}

                {/* Modal Action Buttons */}
                <div className="flex justify-end gap-4 pt-4"> {/* Removed mt-6, added pt-4 */}
                  <button
                    type="button"
                    onClick={handleTogglePasswordChange}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={isSavingPassword} // Disable cancel while saving
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-50"
                    disabled={isSavingPassword || !!passwordSuccess} // Disable if saving or success message is shown
                  >
                    {isSavingPassword ? 'Saving...' : 'Save Password'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
