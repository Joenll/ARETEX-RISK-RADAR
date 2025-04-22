'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { IUser } from '@/models/User';
import { IUserProfile, UserSex } from '@/models/UserProfile';
import Button from '@/app/components/Button'; // Assuming Button component exists
import Swal from 'sweetalert2'; // Import SweetAlert2

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
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null); // Keep for initial load error
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<EditableProfileFields>>({});

  // --- State for Password Change ---
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // --- Fetch User Profile (remains the same) ---
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

  // --- Profile Edit Event Handlers (remains the same) ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    if (!isEditing && userData?.profile) {
      setFormData({
        firstName: userData.profile.firstName || '',
        lastName: userData.profile.lastName || '',
        employeeNumber: userData.profile.employeeNumber || '',
        workPosition: userData.profile.workPosition || '',
        birthdate: userData.profile.birthdate ? new Date(userData.profile.birthdate).toISOString().split('T')[0] : '',
        team: userData.profile.team || '',
        sex: userData.profile.sex || '',
      });
      setIsChangingPassword(false);
    }
    setIsEditing(!isEditing);
  };

  // --- handleSave with SweetAlert (remains the same) ---
  const handleSave = async () => {
    if (!userData?._id) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'User ID is missing, cannot save.' });
        return;
    }
    if (isEditing && (!formData.sex || !sexOptions.includes(formData.sex as UserSex))) {
        Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please select a valid option for Sex.' });
        return;
    }
    setIsLoading(true);
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
                profile: { ...prevUserData.profile, ...result.data }
             } : null);
             setFormData(prev => ({ ...prev, ...result.data }));
        }
        setIsEditing(false);
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

  // --- Password Change Handlers (remains the same) ---
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTogglePasswordChange = () => {
    setIsChangingPassword(!isChangingPassword);
    setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    if (!isChangingPassword) {
      setIsEditing(false);
    }
  };

  // --- handlePasswordSubmit with SweetAlert (remains the same) ---
  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userData?._id) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'User information is missing.' }); return;
    }
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'New passwords do not match.' }); return;
    }
    if (!passwordFormData.currentPassword || !passwordFormData.newPassword) {
        Swal.fire({ icon: 'error', title: 'Validation Error', text: 'All password fields are required.' }); return;
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
        throw new Error(result.error || `Failed to update password. Status: ${response.status}`);
      }
      Swal.fire({
        icon: 'success', title: 'Password Updated!', text: 'Your password has been changed successfully.',
        timer: 2000, showConfirmButton: false,
      }).then(() => {
        handleTogglePasswordChange();
      });
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      console.error("Failed to save password:", err);
      Swal.fire({ icon: 'error', title: 'Password Update Failed', text: err.message || "Failed to save password." });
    } finally {
      setIsSavingPassword(false);
    }
  };

  // --- NEW: Logout Handler with SweetAlert ---
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
        // If confirmed, proceed with sign out
        signOut({ callbackUrl: '/' });
      }
      // If cancelled, do nothing
    });
  };
  // --- END NEW Logout Handler ---

  // --- Render Logic (remains the same) ---
  const getInitials = (firstName?: string, lastName?: string): string => {
    const first = firstName?.[0]?.toUpperCase() || '';
    const last = lastName?.[0]?.toUpperCase() || '';
    return `${first}${last}` || '?';
  };

  // --- Main Render (remains the same, except for logout button onClick) ---
  if (sessionStatus === 'loading' || (isLoading && !userData && !initialLoadError)) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading profile...</div>;
  }
  if (initialLoadError && !userData && sessionStatus !== 'loading') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 text-center text-red-600">Error: {initialLoadError}</div>;
  }
  if (sessionStatus === 'unauthenticated') {
     return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 text-center text-red-600">Error: You must be logged in to view this page.</div>;
  }
  if (!userData || !userData.profile) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 text-center">Could not load profile data. Please try again later.</div>;
  }

  const { email, role, status: accountStatus } = userData;
  const { firstName, lastName, employeeNumber, workPosition, team, birthdate, sex } = userData.profile;
  const initials = getInitials(firstName, lastName);

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
          <div className="relative h-24 w-24 mb-4 flex items-center justify-center bg-orange-500 rounded-full border-2 border-orange-500 text-white text-3xl font-semibold">
            {initials}
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            {firstName || ''} {lastName || ''}
          </h2>
          <p className="text-sm text-gray-600 capitalize">
            {workPosition || 'N/A'} {workPosition && team ? ' - ' : ''} {team || ''}
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
          {/* Fields remain the same */}
          <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="firstName" className="block text-xs text-gray-500 mb-1">First Name</label>
            <div className="text-gray-700">
              {isEditing ? ( <input id="firstName" type="text" name="firstName" value={formData.firstName || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white" disabled={isLoading}/> ) : ( firstName || 'N/A' )}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="lastName" className="block text-xs text-gray-500 mb-1">Last Name</label>
            <div className="text-gray-700">
              {isEditing ? ( <input id="lastName" type="text" name="lastName" value={formData.lastName || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white" disabled={isLoading}/> ) : ( lastName || 'N/A' )}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="birthdate" className="block text-xs text-gray-500 mb-1">Birthday</label>
            <div className="text-gray-700">
              {isEditing ? ( <input id="birthdate" type="date" name="birthdate" value={formData.birthdate || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white" disabled={isLoading}/> ) : ( birthdate ? new Date(birthdate).toLocaleDateString() : 'N/A' )}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="sex" className="block text-xs text-gray-500 mb-1">Sex</label>
            <div className="text-gray-700">
              {isEditing ? ( <select id="sex" name="sex" value={formData.sex || ''} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white" disabled={isLoading}> <option value="" disabled>Select Sex</option> {sexOptions.map(option => ( <option key={option} value={option}>{option}</option> ))} </select> ) : ( sex || 'N/A' )}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="team" className="block text-xs text-gray-500 mb-1">Team</label>
            <div className="text-gray-700">
              {isEditing ? ( <input id="team" type="text" name="team" value={formData.team || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white" disabled={isLoading}/> ) : ( team || 'N/A' )}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="workPosition" className="block text-xs text-gray-500 mb-1">Work Position / Position</label>
            <div className="text-gray-700">
              {isEditing ? ( <input id="workPosition" type="text" name="workPosition" value={formData.workPosition || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white" disabled={isLoading}/> ) : ( workPosition || 'N/A' )}
            </div>
          </div>
           <div className="bg-gray-50 p-4 rounded">
            <label htmlFor="employeeNumber" className="block text-xs text-gray-500 mb-1">Employee Number</label>
            <div className="text-gray-700">
              {isEditing ? ( <input id="employeeNumber" type="text" name="employeeNumber" value={formData.employeeNumber || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white" disabled={isLoading}/> ) : ( employeeNumber || 'N/A' )}
            </div>
          </div>
           <div className="bg-gray-50 p-4 rounded">
            <label className="block text-xs text-gray-500 mb-1">Account Status</label>
            <div className={`text-gray-700 capitalize font-medium ${ accountStatus === 'approved' ? 'text-green-600' : accountStatus === 'pending' ? 'text-yellow-600' : 'text-red-600' }`}> {accountStatus} </div>
          </div>
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
                onClick={handleLogout} // <-- Use the new handler here
             >
                Log Out
             </Button>
          )}
        </div>
      </div> {/* End of Profile Card */}

      {/* Password Change Modal (remains the same) */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Change Password</h3>
              <button type="button" onClick={handleTogglePasswordChange} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center" aria-label="Close modal" disabled={isSavingPassword}>
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPasswordModal" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input type="password" id="currentPasswordModal" name="currentPassword" value={passwordFormData.currentPassword} onChange={handlePasswordInputChange} placeholder="Enter your current password" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" required disabled={isSavingPassword}/>
                </div>
                <div>
                  <label htmlFor="newPasswordModal" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input type="password" id="newPasswordModal" name="newPassword" value={passwordFormData.newPassword} onChange={handlePasswordInputChange} placeholder="Enter new password" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" required disabled={isSavingPassword}/>
                </div>
                <div>
                  <label htmlFor="confirmPasswordModal" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input type="password" id="confirmPasswordModal" name="confirmPassword" value={passwordFormData.confirmPassword} onChange={handlePasswordInputChange} placeholder="Confirm new password" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" required disabled={isSavingPassword}/>
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
