// src/app/ui/profile/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { IUser } from '@/models/User';
import { IUserProfile, UserSex } from '@/models/UserProfile';
import Button from '@/app/components/Button'; // Assuming Button component exists
import Swal from 'sweetalert2'; // Import SweetAlert2

// --- Define possible sex values for the dropdown ---
const sexOptions: UserSex[] = ['Male', 'Female'];

// Define a type for the fetched data structure
interface UserWithProfile extends Omit<IUser, 'profile' | 'password'> {
  _id: string;
  profile: IUserProfile & { _id?: string };
}

// Define a type for the editable fields in the form
type EditableProfileFields = Pick<IUserProfile, 'firstName' | 'lastName' | 'employeeNumber' | 'workPosition' | 'team' | 'sex'> & { birthdate: string };

// --- Validation Helper Functions ---
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
// --- Helper function to capitalize the first letter ---
const capitalizeFirstLetter = (string: string): string => {
    if (!string) return '';
    // No need to trim here as we handle it in validation/submission
    return string.charAt(0).toUpperCase() + string.slice(1);
};
// --- Password Complexity Regex (Example - adjust as needed) ---
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const passwordRequirementsMessage = "Password must be 8+ characters with uppercase, lowercase, number, and special character (@$!%*?&).";


// --- Type for Validation Errors State ---
type ValidationErrors = {
    [key in keyof EditableProfileFields]?: string;
};

// --- Styles for Validation ---
const errorTextStyles = "text-red-600 text-xs mt-1"; // Style for error messages
const errorBorderClass = "border-red-500"; // Class for error border
const inputFieldStyles = "w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"; // Base input style

export default function ProfilePage() {
  const { data: session, status: sessionStatus } = useSession();
  const [userData, setUserData] = useState<UserWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // For initial load and saving profile
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null); // Keep for initial load error
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<EditableProfileFields>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({}); // State for profile validation errors

  // --- State for Password Change ---
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordValidationErrors, setPasswordValidationErrors] = useState<{ [key: string]: string }>({}); // Separate state for password validation

  // --- Fetch User Profile ---
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      const fetchUserProfile = async () => {
        setIsLoading(true);
        setInitialLoadError(null);
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
            // Initialize form data when user data is fetched
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
          setInitialLoadError(err.message || 'An unexpected error occurred.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchUserProfile();
    } else if (sessionStatus === 'unauthenticated') {
      setIsLoading(false);
      setInitialLoadError("You must be logged in to view this page.");
    }
  }, [sessionStatus]);

  // --- Profile Edit Event Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleEditToggle = () => {
    if (!isEditing && userData?.profile) {
      // Reset form data to current user data when entering edit mode
      setFormData({
        firstName: userData.profile.firstName || '',
        lastName: userData.profile.lastName || '',
        employeeNumber: userData.profile.employeeNumber || '',
        workPosition: userData.profile.workPosition || '',
        birthdate: userData.profile.birthdate ? new Date(userData.profile.birthdate).toISOString().split('T')[0] : '',
        team: userData.profile.team || '',
        sex: userData.profile.sex || '',
      });
      setIsChangingPassword(false); // Ensure password change is off
      setValidationErrors({}); // Clear any previous validation errors
    } else {
        // If cancelling edit, reset form data back to original userData
        if (userData?.profile) {
             setFormData({
                firstName: userData.profile.firstName || '',
                lastName: userData.profile.lastName || '',
                employeeNumber: userData.profile.employeeNumber || '',
                workPosition: userData.profile.workPosition || '',
                birthdate: userData.profile.birthdate ? new Date(userData.profile.birthdate).toISOString().split('T')[0] : '',
                team: userData.profile.team || '',
                sex: userData.profile.sex || '',
            });
        }
        setValidationErrors({}); // Clear errors on cancel
    }
    setIsEditing(!isEditing);
  };

  // --- Validation Function for Profile ---
  const validateProfileForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Helper to trim string values from state
    const getTrimmedString = (key: keyof EditableProfileFields): string => {
        const value = formData[key];
        return typeof value === 'string' ? value.trim() : '';
    }

    const firstName = getTrimmedString("firstName");
    const lastName = getTrimmedString("lastName");
    const sex = getTrimmedString("sex");
    const employeeNumber = getTrimmedString("employeeNumber");
    const workPosition = getTrimmedString("workPosition");
    const team = getTrimmedString("team");
    const birthdate = getTrimmedString("birthdate");

    // Required fields check (adjust as needed)
    if (!firstName) errors.firstName = 'First name is required.';
    if (!lastName) errors.lastName = 'Last name is required.';
    if (!sex) errors.sex = 'Sex is required.';
    // Add checks for others if they become mandatory

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
            if (isNaN(birthDate.getTime())) {
                 errors.birthdate = 'Invalid date format.';
            } else if (birthDate > today) {
                errors.birthdate = 'Birthdate cannot be in the future.';
            }
        } catch (e) {
             errors.birthdate = 'Invalid date format.';
        }
    }

    // Check if sex is a valid option
    if (sex && !sexOptions.includes(sex as UserSex)) {
        errors.sex = 'Invalid selection for Sex.';
    }

    setValidationErrors(errors);
    isValid = Object.keys(errors).length === 0;

    if (!isValid) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Errors',
            text: 'Please correct the errors indicated in the profile form.',
        });
    }

    return isValid;
  };

  // --- handleSave with Validation ---
  const handleSave = async () => {
    setValidationErrors({}); // Clear previous errors
    if (!validateProfileForm()) { // Run validation
        setIsLoading(false); // Ensure loading is off
        return; // Stop if validation fails
    }

    if (!userData?._id) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'User ID is missing, cannot save.' });
        return;
    }

    setIsLoading(true);

    // Prepare data, trimming string values
    const updateData: Partial<EditableProfileFields> = {};
    (Object.keys(formData) as Array<keyof EditableProfileFields>).forEach(key => {
        const value = formData[key];
        // Use capitalized value directly from state for names
        updateData[key] = typeof value === 'string' ? value.trim() : value;
    });


    try {
        const response = await fetch(`/api/users/${userData._id}`, {
            method: 'PUT', // Use PUT as we are potentially replacing the profile subdocument
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to update profile. Status: ${response.status}`);
        }
        const result = await response.json();

        // Update local state with confirmed data from backend
        if (result.data && userData) {
             // Ensure birthdate is formatted correctly if returned
             const profileUpdate = {
                ...result.data,
                birthdate: result.data.birthdate ? new Date(result.data.birthdate).toISOString().split('T')[0] : ''
             };
             setUserData(prevUserData => prevUserData ? {
                ...prevUserData,
                profile: { ...prevUserData.profile, ...profileUpdate }
             } : null);
             setFormData(prev => ({ ...prev, ...profileUpdate })); // Update form state as well
        }

        setIsEditing(false); // Exit edit mode
        Swal.fire({
            icon: 'success', title: 'Profile Updated!', text: 'Your profile details have been saved (logout then signin again to apply changes in the header).',
            timer: 4000, showConfirmButton: false,
        });
    } catch (err: any) {
        console.error("Failed to save profile:", err);
        Swal.fire({ icon: 'error', title: 'Save Failed', text: err.message || "Failed to save profile." });
    } finally {
        setIsLoading(false);
    }
  };

  // --- Password Change Handlers ---
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({ ...prev, [name]: value }));
     // Clear validation error for the field being changed
    if (passwordValidationErrors[name]) {
      setPasswordValidationErrors(prev => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleTogglePasswordChange = () => {
    setIsChangingPassword(!isChangingPassword);
    setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordValidationErrors({}); // Clear password errors
    if (!isChangingPassword) {
      setIsEditing(false); // Ensure profile editing is off
    }
  };

  // --- Password Validation Function ---
  const validatePasswordForm = (): boolean => {
      const errors: { [key: string]: string } = {};
      let isValid = true;
      const { currentPassword, newPassword, confirmPassword } = passwordFormData;

      if (!currentPassword) errors.currentPassword = 'Current password is required.';
      if (!newPassword) errors.newPassword = 'New password is required.';
      if (!confirmPassword) errors.confirmPassword = 'Password confirmation is required.';

      // Use password complexity regex
      if (newPassword && !passwordRegex.test(newPassword)) {
          errors.newPassword = passwordRequirementsMessage;
      }

      if (newPassword && confirmPassword && newPassword !== confirmPassword) {
          errors.confirmPassword = 'New passwords do not match.';
      }

      setPasswordValidationErrors(errors);
      isValid = Object.keys(errors).length === 0;

      if (!isValid) {
          // No need for Swal here, errors are shown inline
          // Swal.fire({
          //     icon: 'error',
          //     title: 'Password Validation Errors',
          //     text: 'Please correct the errors in the password form.',
          // });
      }
      return isValid;
  };

  // --- handlePasswordSubmit with Validation ---
  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordValidationErrors({}); // Clear previous errors

    if (!validatePasswordForm()) { // Run password validation
        setIsSavingPassword(false); // Ensure loading is off
        return; // Stop if validation fails
    }

    if (!userData?._id) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'User information is missing.' }); return;
    }

    setIsSavingPassword(true);
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
        // Display specific backend error if available
        throw new Error(result.error || `Failed to update password. Status: ${response.status}`);
      }
      Swal.fire({
        icon: 'success', title: 'Password Updated!', text: 'Your password has been changed successfully.',
        timer: 2000, showConfirmButton: false,
      }).then(() => {
        handleTogglePasswordChange(); // Close modal on success
      });
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Reset form
    } catch (err: any) {
      console.error("Failed to save password:", err);
      // Show specific error from backend or generic message
      Swal.fire({ icon: 'error', title: 'Password Update Failed', text: err.message || "Failed to save password." });
    } finally {
      setIsSavingPassword(false);
    }
  };

  // --- Logout Handler ---
  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6', // Blue
      cancelButtonColor: '#d33',    // Red
      confirmButtonText: 'Yes, log out!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        signOut({ callbackUrl: '/' });
      }
    });
  };

  // --- Render Logic ---
  const getInitials = (firstName?: string, lastName?: string): string => {
    const first = firstName?.[0]?.toUpperCase() || '';
    const last = lastName?.[0]?.toUpperCase() || '';
    return `${first}${last}` || '?';
  };

  // --- Main Render ---
  if (sessionStatus === 'loading' || (isLoading && !userData && !initialLoadError)) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading profile...</div>;
  }
  if (initialLoadError && !userData && sessionStatus === 'unauthenticated') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 text-center text-red-600">Error: {initialLoadError}</div>;
  }
  if (sessionStatus === 'unauthenticated') {
     return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 text-center text-red-600">Error: You must be logged in to view this page.</div>;
  }
  if (!userData || !userData.profile) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 text-center">Could not load profile data. Please try again later.</div>;
  }

  const { email, role, status: accountStatus } = userData;
  // Use formData for display in edit mode, userData otherwise
  const displayFirstName = isEditing ? formData.firstName : userData.profile.firstName;
  const displayLastName = isEditing ? formData.lastName : userData.profile.lastName;
  const displayWorkPosition = isEditing ? formData.workPosition : userData.profile.workPosition;
  const displayTeam = isEditing ? formData.team : userData.profile.team;
  const displayBirthdate = isEditing ? formData.birthdate : (userData.profile.birthdate ? new Date(userData.profile.birthdate).toLocaleDateString() : 'N/A');
  const displaySex = isEditing ? formData.sex : userData.profile.sex;
  const displayEmployeeNumber = isEditing ? formData.employeeNumber : userData.profile.employeeNumber;

  const initials = getInitials(displayFirstName, displayLastName);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      {/* Profile Header */}
      <div className="mb-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
        <p className="text-sm text-gray-500">
          View and manage your personal profile details.
        </p>
      </div>

      {/* Profile Card */}
      <div className={`bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto ${isChangingPassword ? 'hidden' : 'block'}`}>
        <div className="flex flex-col items-center mb-8 relative">
          <div className="relative h-24 w-24 mb-4 flex items-center justify-center bg-blue-500 rounded-full border-2 border-orange-500 text-white text-3xl font-semibold">
            {initials}
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            {displayFirstName || ''} {displayLastName || ''}
          </h2>
          <p className="text-sm text-gray-600 capitalize">
            {displayWorkPosition || 'N/A'} {displayWorkPosition && displayTeam ? ' - ' : ''} {displayTeam || ''}
          </p>
          {!isEditing && (
            <button
              onClick={handleEditToggle}
              disabled={isLoading}
              className="absolute top-0 right-0 flex items-center gap-1 px-3 py-1 text-xs border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-blue-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-10 10a2 2 0 01-1.414.586H4a1 1 0 01-1-1v-1a2 2 0 01.586-1.414l10-10z" />
              </svg>
              Edit
            </button>
          )}
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
                <>
                  <input id="firstName" type="text" name="firstName" value={formData.firstName || ''} onChange={handleInputChange} className={`${inputFieldStyles} ${validationErrors.firstName ? errorBorderClass : ''}`} disabled={isLoading}/>
                  {validationErrors.firstName && <p className={errorTextStyles}>{validationErrors.firstName}</p>}
                </>
               ) : ( displayFirstName || 'N/A' )}
            </div>
          </div>
          {/* Last Name */}
          <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="lastName" className="block text-xs text-gray-500 mb-1">Last Name</label>
            <div className="text-gray-700">
              {isEditing ? (
                <>
                  <input id="lastName" type="text" name="lastName" value={formData.lastName || ''} onChange={handleInputChange} className={`${inputFieldStyles} ${validationErrors.lastName ? errorBorderClass : ''}`} disabled={isLoading}/>
                  {validationErrors.lastName && <p className={errorTextStyles}>{validationErrors.lastName}</p>}
                </>
              ) : ( displayLastName || 'N/A' )}
            </div>
          </div>
          {/* Birthday */}
          <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="birthdate" className="block text-xs text-gray-500 mb-1">Birthday</label>
            <div className="text-gray-700">
              {isEditing ? (
                <>
                  <input id="birthdate" type="date" name="birthdate" value={formData.birthdate || ''} onChange={handleInputChange} className={`${inputFieldStyles} ${validationErrors.birthdate ? errorBorderClass : ''}`} disabled={isLoading}/>
                  {validationErrors.birthdate && <p className={errorTextStyles}>{validationErrors.birthdate}</p>}
                </>
              ) : ( displayBirthdate )}
            </div>
          </div>
          {/* Sex */}
          <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="sex" className="block text-xs text-gray-500 mb-1">Sex</label>
            <div className="text-gray-700">
              {isEditing ? (
                <>
                  <select id="sex" name="sex" value={formData.sex || ''} onChange={handleInputChange} required className={`${inputFieldStyles} ${validationErrors.sex ? errorBorderClass : ''}`} disabled={isLoading}>
                    <option value="" disabled>Select Sex</option>
                    {sexOptions.map(option => ( <option key={option} value={option}>{option}</option> ))}
                  </select>
                  {validationErrors.sex && <p className={errorTextStyles}>{validationErrors.sex}</p>}
                </>
              ) : ( displaySex || 'N/A' )}
            </div>
          </div>
          {/* Team */}
          <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="team" className="block text-xs text-gray-500 mb-1">Team</label>
            <div className="text-gray-700">
              {isEditing ? (
                <>
                  <input id="team" type="text" name="team" value={formData.team || ''} onChange={handleInputChange} className={`${inputFieldStyles} ${validationErrors.team ? errorBorderClass : ''}`} disabled={isLoading}/>
                  {validationErrors.team && <p className={errorTextStyles}>{validationErrors.team}</p>}
                </>
              ) : ( displayTeam || 'N/A' )}
            </div>
          </div>
          {/* Work Position */}
          <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="workPosition" className="block text-xs text-gray-500 mb-1">Work Position / Position</label>
            <div className="text-gray-700">
              {isEditing ? (
                <>
                  <input id="workPosition" type="text" name="workPosition" value={formData.workPosition || ''} onChange={handleInputChange} className={`${inputFieldStyles} ${validationErrors.workPosition ? errorBorderClass : ''}`} disabled={isLoading}/>
                  {validationErrors.workPosition && <p className={errorTextStyles}>{validationErrors.workPosition}</p>}
                </>
              ) : ( displayWorkPosition || 'N/A' )}
            </div>
          </div>
          {/* Employee Number */}
           <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="employeeNumber" className="block text-xs text-gray-500 mb-1">Employee Number</label>
            <div className="text-gray-700">
              {isEditing ? (
                <>
                  <input id="employeeNumber" type="text" name="employeeNumber" value={formData.employeeNumber || ''} onChange={handleInputChange} className={`${inputFieldStyles} ${validationErrors.employeeNumber ? errorBorderClass : ''}`} disabled={isLoading}/>
                  {validationErrors.employeeNumber && <p className={errorTextStyles}>{validationErrors.employeeNumber}</p>}
                </>
              ) : ( displayEmployeeNumber || 'N/A' )}
            </div>
          </div>
          {/* Account Status (Non-editable) */}
           <div className="bg-gray-50 p-4 rounded">
            <label className="block text-xs text-gray-500 mb-1">Account Status</label>
            <div className={`text-gray-700 capitalize font-medium ${ accountStatus === 'approved' ? 'text-green-600' : accountStatus === 'pending' ? 'text-yellow-600' : 'text-red-600' }`}> {accountStatus} </div>
          </div>
          {/* Role (Non-editable) */}
           <div className="bg-gray-50 p-4 rounded">
            <label className="block text-xs text-gray-500 mb-1">Role</label>
            <div className="text-gray-700 capitalize"> {role} </div>
          </div>
        </div>

        {/* Email Section */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-700 mb-1">My email Address</p>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-700">{email}</p>
          </div>
        </div>

        {/* Password Section */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-700 mb-1">Password Setting</p>
          <button
            onClick={handleTogglePasswordChange}
            disabled={isLoading || isEditing}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-50"
          >
            Change Password
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 border-t pt-6 mt-6">
          {isEditing ? (
            <>
              <Button variant="back" onClick={handleEditToggle} disabled={isLoading}> Cancel </Button>
              <Button variant="submit" onClick={handleSave} isLoading={isLoading} disabled={isLoading}> Save Changes </Button>
            </>
          ) : (
             <Button
                variant="danger"
                onClick={handleLogout}
             >
                Log Out
             </Button>
          )}
        </div>
      </div> {/* End of Profile Card */}

      {/* Password Change Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Change Password</h3>
              <button type="button" onClick={handleTogglePasswordChange} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center" aria-label="Close modal" disabled={isSavingPassword}>
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-6" noValidate> {/* Added noValidate */}
              <div className="space-y-4 text-black" >
                {/* Current Password */}
                <div>
                  <label htmlFor="currentPasswordModal" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input type="password" id="currentPasswordModal" name="currentPassword" value={passwordFormData.currentPassword} onChange={handlePasswordInputChange} placeholder="Enter your current password" className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${passwordValidationErrors.currentPassword ? 'border-red-500' : 'border-gray-300'}`} required disabled={isSavingPassword}/>
                  {passwordValidationErrors.currentPassword && <p className={errorTextStyles}>{passwordValidationErrors.currentPassword}</p>}
                </div>
                {/* New Password */}
                <div>
                  <label htmlFor="newPasswordModal" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input type="password" id="newPasswordModal" name="newPassword" value={passwordFormData.newPassword} onChange={handlePasswordInputChange} placeholder="Enter new password" className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${passwordValidationErrors.newPassword ? 'border-red-500' : 'border-gray-300'}`} required disabled={isSavingPassword}/>
                  {passwordValidationErrors.newPassword && <p className={errorTextStyles}>{passwordValidationErrors.newPassword}</p>}
                </div>
                {/* Confirm New Password */}
                <div>
                  <label htmlFor="confirmPasswordModal" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input type="password" id="confirmPasswordModal" name="confirmPassword" value={passwordFormData.confirmPassword} onChange={handlePasswordInputChange} placeholder="Confirm new password" className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${passwordValidationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`} required disabled={isSavingPassword}/>
                  {passwordValidationErrors.confirmPassword && <p className={errorTextStyles}>{passwordValidationErrors.confirmPassword}</p>}
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="back" onClick={handleTogglePasswordChange} disabled={isSavingPassword}> Cancel </Button>
                  <Button type="submit" variant="submit" isLoading={isSavingPassword} disabled={isSavingPassword}> Save Password </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}