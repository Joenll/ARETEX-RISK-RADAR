// src/app/ui/admin/user-management/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IUser } from '@/models/User';
// Import UserSex type along with IUserProfile
import { IUserProfile, UserSex } from '@/models/UserProfile';
// Assuming Button component exists and works as expected
// import Button from '@/app/components/Button'; // Keep if using your custom Button
// Use FaPlus for the Add button to match the design's intent
import { FaEdit, FaTrash, FaShareSquare, FaSearch, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';

// Define a combined type for the user data we expect from the API
interface UserWithProfile extends Omit<IUser, 'profile' | 'password'> {
    _id: string;
    // Add 'sex' to the Pick from IUserProfile
    profile: Pick<IUserProfile, 'firstName' | 'lastName' | 'employeeNumber' | 'workPosition' | 'team' | 'sex'> | null;
    status: 'pending' | 'approved' | 'rejected';
    role: 'admin' | 'user'; // Match the expected role types
    email: string; // Ensure email is included
}


// --- Pagination Configuration ---
const ITEMS_PER_PAGE = 10;

// --- Define possible sex values for filtering ---
const sexOptions: UserSex[] = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function UserManagementPage() {
    // --- Existing State ---
    const [users, setUsers] = useState<UserWithProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    // --- Add state for Sex filter ---
    const [filterSex, setFilterSex] = useState<string>(''); // '' means 'All'
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);

    // --- UI State (Export Dropdown) ---
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const exportDropdownRef = useRef<HTMLDivElement>(null);

    // --- Existing Data Fetching ---
    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // IMPORTANT: Ensure your '/api/users' endpoint populates the profile
            // and includes the 'sex' field.
            const response = await fetch('/api/users');
            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.statusText}`);
            }
            const data: UserWithProfile[] = await response.json();
            setUsers(data);
        } catch (err: any) {
            console.error("Error fetching users:", err);
            setError(err.message || 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // --- Existing Effect for Closing Export Dropdown ---
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
        if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
            setIsExportDropdownOpen(false);
        }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [exportDropdownRef]);


    // --- Existing Filtering and Searching ---
    const filteredAndSearchedUsers = useMemo(() => {
        return users.filter(user => {
            // --- Filter by Status ---
            const statusMatch = filterStatus === '' || user.status === filterStatus;

            // --- Filter by Sex ---
            const sexMatch = filterSex === '' || user.profile?.sex === filterSex;

            // --- Filter by Search Term ---
            const searchLower = searchTerm.toLowerCase();
            const name = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : '';
            const nameMatch = name.toLowerCase().includes(searchLower);
            const emailMatch = user.email.toLowerCase().includes(searchLower);
            let badgeMatch = false;
            if (user.profile?.employeeNumber && typeof user.profile.employeeNumber === 'string') {
                badgeMatch = user.profile.employeeNumber.toLowerCase().includes(searchLower);
            }
            let workPositionMatch = false;
            if (user.profile?.workPosition && typeof user.profile.workPosition === 'string') {
                workPositionMatch = user.profile.workPosition.toLowerCase().includes(searchLower);
            }
            let teamMatch = false;
            if (user.profile?.team && typeof user.profile.team === 'string') {
                teamMatch = user.profile.team.toLowerCase().includes(searchLower);
            }
            const searchMatch = searchTerm === '' || nameMatch || emailMatch || badgeMatch || workPositionMatch || teamMatch;

            // --- Combine all filters ---
            return statusMatch && sexMatch && searchMatch;
        });
        // --- Add filterSex to dependency array ---
    }, [users, filterStatus, filterSex, searchTerm]);

    // --- Existing Effect to reset page ---
    useEffect(() => {
        setCurrentPage(1);
        // --- Add filterSex to dependency array ---
    }, [filterStatus, filterSex, searchTerm]);


    // --- Existing Pagination Logic ---
    const totalPages = Math.ceil(filteredAndSearchedUsers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedUsers = useMemo(() => {
        return filteredAndSearchedUsers.slice(startIndex, endIndex);
    }, [filteredAndSearchedUsers, startIndex, endIndex]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // --- Existing Selection Handling ---
    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const allFilteredIds = new Set(filteredAndSearchedUsers.map(user => user._id));
            setSelectedUserIds(allFilteredIds);
        } else {
            setSelectedUserIds(new Set());
        }
    };

    const handleSelectUser = (event: React.ChangeEvent<HTMLInputElement>, userId: string) => {
        const newSelectedUserIds = new Set(selectedUserIds);
        if (event.target.checked) {
            newSelectedUserIds.add(userId);
        } else {
            newSelectedUserIds.delete(userId);
        }
        setSelectedUserIds(newSelectedUserIds);
    };

    const isAllFilteredSelected = filteredAndSearchedUsers.length > 0 && selectedUserIds.size === filteredAndSearchedUsers.length;
    const isIndeterminate = selectedUserIds.size > 0 && selectedUserIds.size < filteredAndSearchedUsers.length;

    // --- Existing Action Handlers ---
    const setActionLoadingState = (userId: string, isLoading: boolean) => {
        setActionLoading(prev => ({ ...prev, [userId]: isLoading }));
    };
    const handleApprove = async (userId: string) => {
        setActionLoadingState(userId, true);
        setError(null);
        try {
            const response = await fetch(`/api/users/${userId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'approved' }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to approve user: ${response.statusText} - ${errorData.message || errorData.error}`);
            }
            await fetchUsers();
            setSelectedUserIds(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        } catch (err: any) {
            console.error("Error approving user:", err);
            setError(err.message || 'An unknown error occurred while approving user');
        } finally {
            setActionLoadingState(userId, false);
        }
     };
    const handleReject = async (userId: string) => {
        setActionLoadingState(userId, true);
        setError(null);
        try {
            const response = await fetch(`/api/users/${userId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected' }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to reject user: ${response.statusText} - ${errorData.message || errorData.error}`);
            }
            await fetchUsers();
             setSelectedUserIds(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        } catch (err: any) {
            console.error("Error rejecting user:", err);
            setError(err.message || 'An unknown error occurred while rejecting user');
        } finally {
            setActionLoadingState(userId, false);
        }
     };
    const handleDelete = async (userId: string, userName: string) => {
        if (!window.confirm(`Are you sure you want to permanently delete the user "${userName}"? This action cannot be undone.`)) {
            return;
        }
        setActionLoadingState(userId, true);
        setError(null);
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to delete user: ${response.statusText} - ${errorData.message || errorData.error}`);
            }
            await fetchUsers();
            setSelectedUserIds(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
            console.log(`User ${userId} deleted successfully.`);
        } catch (err: any) {
            console.error("Error deleting user:", err);
            setError(err.message || 'An unknown error occurred while deleting user');
        } finally {
            setActionLoadingState(userId, false);
        }
     };
    const handleEdit = (userId: string) => {
        router.push(`/ui/admin/user-management/${userId}/edit`);
     };
    const handleAddUser = () => {
        router.push('/ui/admin/user-management/add-user');
     };
    const handleBulkAction = async (action: 'approve' | 'reject') => {
        const userIds = Array.from(selectedUserIds);
        if (userIds.length === 0) return;
        const status = action === 'approve' ? 'approved' : 'rejected';
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/users/bulk-status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds, status }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to ${action} selected users: ${response.statusText} - ${errorData.message || 'Unknown error'}`);
            }
            await fetchUsers();
            setSelectedUserIds(new Set());
        } catch (err: any) {
            console.error(`Error during bulk ${action}:`, err);
            setError(err.message || `An unknown error occurred during bulk ${action}`);
        } finally {
            setIsLoading(false);
        }
     };

    // --- Existing Helper ---
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-green-700 bg-green-100';
            case 'pending': return 'text-yellow-700 bg-yellow-100';
            case 'rejected': return 'text-red-700 bg-red-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    // --- Existing Placeholder Export Handlers ---
    const handleExportExcel = () => {
        console.log("Exporting to Excel...");
        setIsExportDropdownOpen(false);
     };
    const handleExportPDF = () => {
        console.log("Exporting to PDF...");
        setIsExportDropdownOpen(false);
     };

 //---- INTEGRATED UI PART ------
 return (
    // Use container from design: bg-white, rounded, shadow, padding
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      {/* Title and Subtitle - Matches design */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Management</h1>
        <p className="text-sm text-gray-600">Manages users information</p>
      </div>

      {/* Header Section - Use design's flex layout */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        {/* Left Section: Use design's button style for Add User */}
        <div className="flex items-center space-x-4">
          <button
            type="button"
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 disabled:opacity-50"
            onClick={handleAddUser}
            disabled={isLoading}
          >
            <FaPlus className="h-5 w-5 mr-2" />
            Add New User
          </button>
        </div>

        {/* Center Section: Use design's search bar style */}
        <div className="relative flex-grow w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search name, email, employee no., etc..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
           <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <FaSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
        </div>

        {/* Right Section: Use design's Export button/dropdown, replace Filter button with simple select */}
        <div className="flex items-center space-x-4">
          {/* Export Button & Dropdown - Use design's structure */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg shadow-md hover:bg-blue-200"
            >
              <FaShareSquare className="mr-2" />
              Export
            </button>
            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-48 z-10">
                <ul className="py-2">
                  <li
                    className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-700 hover:text-orange-500 transition-colors"
                    onClick={handleExportExcel}
                  >
                    <img src="/excel.png" alt="Excel" className="w-5 h-5 mr-2" />
                    Export to Excel
                  </li>
                  <li
                    className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-700 hover:text-orange-500 transition-colors"
                    onClick={handleExportPDF}
                  >
                    <img src="/pdf.png" alt="PDF" className="w-5 h-5 mr-2" />
                    Export to PDF
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* --- Add Sex Filter Dropdown --- */}
          <div className="flex items-center">
            <label htmlFor="sex-filter" className="sr-only">Sex:</label>
            <select
              id="sex-filter"
              value={filterSex}
              onChange={(e) => setFilterSex(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
            >
              <option value="">All Sexes</option>
              {sexOptions.map(sex => (
                <option key={sex} value={sex}>{sex}</option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown - Keep existing select, style like design's inputs */}
          <div className="flex items-center">
            <label htmlFor="status-filter" className="sr-only">Status:</label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Buttons - Keep from existing logic */}
      <div className={`mb-4 ${selectedUserIds.size > 0 ? 'block' : 'hidden'}`}>
          <span className="mr-4 text-sm font-medium text-gray-700">{selectedUserIds.size} user(s) selected</span>
          <button
              onClick={() => handleBulkAction('approve')}
              className="px-3 py-1 mr-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              disabled={isLoading}
          >
              Approve Selected
          </button>
          <button
              onClick={() => handleBulkAction('reject')}
              className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
              disabled={isLoading}
          >
              Reject Selected
          </button>
      </div>

      {/* Loading/Error/Empty States - Keep from existing logic, use design's spinner */}
      {isLoading && !users.length && <div className="flex justify-center items-center h-32"><div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div></div>}
      {error && <div className="my-4 rounded-md bg-red-50 p-4 text-sm text-red-700">Error: {error}</div>}
      {!isLoading && !error && users.length === 0 && <div className="text-center py-10 text-gray-500">No users found.</div>}
      {!isLoading && !error && users.length > 0 && filteredAndSearchedUsers.length === 0 && <div className="text-center py-10 text-gray-500">No users match your filter/search.</div>}

      {/* Table Section - Use design's layout/styling, but existing columns/data */}
      {users.length > 0 && filteredAndSearchedUsers.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full bg-white divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-100">
              <tr className="text-left text-sm font-semibold text-gray-800">
                <th className="px-1 py-2 w-8">
                  <input
                    type="checkbox"
                    title="Select all visible users"
                    className="ml-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    ref={input => { if (input) input.indeterminate = isIndeterminate; }}
                    checked={isAllFilteredSelected}
                    onChange={handleSelectAll}
                    disabled={isLoading}
                  />
                </th>
                {/* Adjusted widths slightly */}
                <th className="px-2 py-2 w-1/5">Name</th>
                <th className="px-2 py-2 w-1/5">Email</th>
                <th className="px-2 py-2 w-16">Sex</th>
                <th className="px-2 py-2 w-20">Employee No.</th>
                <th className="px-2 py-2 w-20">Work Position</th>
                <th className="px-2 py-2 w-28">Team</th>
                <th className="px-2 py-2 w-16">Role</th>
                <th className="px-2 py-2 w-24 text-center">Status</th>
                <th className="px-1 py-2 w-16 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.map((user) => {
                const userName = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email;
                const isActionLoading = actionLoading[user._id] || false;
                const isSelected = selectedUserIds.has(user._id);
                const isDisabled = isActionLoading || isLoading;

                // Determine if actions are applicable
                const canApprove = user.status !== 'approved';
                const canReject = user.status !== 'rejected';

                return (
                  <tr key={user._id} className={`border-t border-gray-200 hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''}`}>
                    <td className="px-1 py-2 relative">
                      {isSelected && <div className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600"></div>}
                      <input
                        type="checkbox"
                        className="ml-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={isSelected}
                        onChange={(e) => handleSelectUser(e, user._id)}
                        value={user._id}
                        disabled={isLoading}
                      />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900 truncate">{user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'N/A'}</td>
                    <td className="px-2 py-2 text-sm text-gray-500 truncate">{user.email}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{user.profile?.sex || 'N/A'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{user.profile?.employeeNumber || 'N/A'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{user.profile?.workPosition || 'N/A'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 truncate">{user.profile?.team || 'N/A'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm capitalize text-gray-500">{user.role}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold leading-5 ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-1 py-2 whitespace-nowrap text-center text-sm font-medium">
                      {isActionLoading ? (
                        <span className="text-xs text-gray-500">Processing...</span>
                      ) : (
                        // --- Updated Action Buttons for Consistent Layout ---
                        <div className="flex justify-center items-center space-x-3">
                           {/* Edit Button (Always visible) */}
                           <button
                              onClick={() => handleEdit(user._id)}
                              title="Edit"
                              className="text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                              disabled={isDisabled}
                            >
                              <FaEdit />
                          </button>

                          {/* Approve Button (Disabled if not applicable) */}
                          <button
                              onClick={() => handleApprove(user._id)}
                              title={canApprove ? "Approve" : "Already Approved"}
                              className={`${
                                canApprove
                                  ? 'text-green-500 hover:text-green-600'
                                  : 'text-gray-400 cursor-not-allowed'
                              } disabled:text-gray-400 disabled:cursor-not-allowed`}
                              disabled={isDisabled || !canApprove} // Disable if loading OR not applicable
                            >
                                  <FaCheck />
                          </button>

                          {/* Reject Button (Disabled if not applicable) */}
                          <button
                              onClick={() => handleReject(user._id)}
                              title={canReject ? "Reject" : "Already Rejected"}
                              className={`${
                                canReject
                                  ? 'text-yellow-500 hover:text-yellow-600'
                                  : 'text-gray-400 cursor-not-allowed'
                              } disabled:text-gray-400 disabled:cursor-not-allowed`}
                              disabled={isDisabled || !canReject} // Disable if loading OR not applicable
                            >
                                  <FaTimes />
                          </button>

                          {/* Delete Button (Always visible) */}
                          <button
                              onClick={() => handleDelete(user._id, userName)}
                              title="Delete"
                              className="text-red-500 hover:text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                              disabled={isDisabled}
                            >
                              <FaTrash />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Section - Use design's structure/styling */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 border-t border-gray-200 pt-4">
             <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className={`px-4 py-2 rounded-lg shadow-md text-sm ${
                currentPage === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-800 hover:bg-blue-600 hover:text-white"
                }`}
            >
                Previous
            </button>
            <div className="flex space-x-2">
                <span className="text-sm text-gray-700 hidden sm:inline">
                    Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                    ({filteredAndSearchedUsers.length} users)
                </span>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                    <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 rounded-lg shadow-md text-sm ${
                        currentPage === pageNum
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-800 hover:bg-blue-600 hover:text-white"
                        }`}
                        disabled={isLoading}
                    >
                        {pageNum}
                    </button>
                    );
                })}
            </div>
            <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className={`px-4 py-2 rounded-lg shadow-md text-sm ${
                currentPage === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-800 hover:bg-blue-600 hover:text-white"
                }`}
            >
                Next
            </button>
        </div>
      )}
    </div>
  );
}
