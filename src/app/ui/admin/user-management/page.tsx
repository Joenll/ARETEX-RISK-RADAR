// src/app/ui/admin/user-management/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { IUser } from '@/models/User';
import { IUserProfile } from '@/models/UserProfile';

// Define a combined type for the user data we expect from the API
interface UserWithProfile extends Omit<IUser, 'profile' | 'password'> {
    _id: string;
    profile: Pick<IUserProfile, 'firstName' | 'lastName' | 'badgeNumber' | 'rank' | 'department'> | null;
}

// --- Pagination Configuration ---
const ITEMS_PER_PAGE = 10;

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserWithProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>(''); // Keep status filter state
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const router = useRouter();

    // --- Pagination State ---
    const [currentPage, setCurrentPage] = useState(1);

    // --- Data Fetching ---
    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/users'); // Assumes this endpoint populates the profile
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

    // --- Filtering and Searching (Client-side) ---
    const filteredAndSearchedUsers = useMemo(() => {
        setCurrentPage(1); // Reset page on filter/search change
        return users.filter(user => {
            // Filter by status
            const statusMatch = filterStatus === '' || user.status === filterStatus; // Include status check

            // Filter by search term (name, email, badge, rank, department)
            const searchLower = searchTerm.toLowerCase();
            const name = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : '';
            const nameMatch = name.toLowerCase().includes(searchLower);
            const emailMatch = user.email.toLowerCase().includes(searchLower);

            // Safely check profile fields
            let badgeMatch = false;
            if (user.profile?.badgeNumber && typeof user.profile.badgeNumber === 'string') {
                badgeMatch = user.profile.badgeNumber.toLowerCase().includes(searchLower);
            }
            let rankMatch = false;
            if (user.profile?.rank && typeof user.profile.rank === 'string') {
                rankMatch = user.profile.rank.toLowerCase().includes(searchLower);
            }
            let departmentMatch = false;
            if (user.profile?.department && typeof user.profile.department === 'string') {
                departmentMatch = user.profile.department.toLowerCase().includes(searchLower);
            }

            const searchMatch = searchTerm === '' || nameMatch || emailMatch || badgeMatch || rankMatch || departmentMatch;

            // Must match both status and search term
            return statusMatch && searchMatch;
        });
        // Add filterStatus back to dependency array
    }, [users, filterStatus, searchTerm]);

    // --- Pagination Logic ---
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

    // --- Selection Handling ---
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

    // --- Helper to manage loading state ---
    const setActionLoadingState = (userId: string, isLoading: boolean) => {
        setActionLoading(prev => ({ ...prev, [userId]: isLoading }));
    };

    // --- Action Handlers (Single User) ---
    // handleApprove, handleReject, handleDelete, handleEdit remain the same
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
        router.push(`/admin/user-management/${userId}/edit`);
    };

    // --- Bulk Action Handler ---
    // handleBulkAction remains the same
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

    // --- Helper ---
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-green-600 bg-green-100';
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            case 'rejected': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    }

 //----UI PART------
return (
<div className="container mx-auto p-4 md:p-6">
<h1 className="mb-4 text-2xl font-semibold text-white">User Management</h1>

    {/* Filter and Search Controls */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-grow sm:max-w-xs">
            <label htmlFor="search-users" className="sr-only">Search users</label>
            <input
                type="text"
                id="search-users"
                placeholder="Search name, email, badge, rank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
            </div>
        </div>
        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2">
                <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Status:</label>
                <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-md border-gray-300 py-1.5 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
            </select>
        </div>
        </div>

             {/* Bulk Action Buttons */}
              <div className={`mb-4 ${selectedUserIds.size > 0 ? 'block' : 'hidden'}`}>
                <span className="mr-4 text-sm font-medium text-gray-700">{selectedUserIds.size} user(s) selected</span>
                <button
                    onClick={() => handleBulkAction('approve')}
                    className="mr-2 rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    disabled={isLoading}
                >
                    Approve Selected
                </button>
                <button
                    onClick={() => handleBulkAction('reject')}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    disabled={isLoading}
               >
                    Reject Selected
                </button>
            </div>

    {/* Loading/Error/Empty States */}
    {isLoading && !users.length && <p className="text-center text-gray-500">Loading users...</p>}
    {error && <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">Error: {error}</p>}
    {!isLoading && !error && users.length === 0 && <p className="text-center text-gray-500">No users found.</p>}
    {/* Updated empty state message */}
    {!isLoading && !error && users.length > 0 && filteredAndSearchedUsers.length === 0 && <p className="text-center text-gray-500">No users match your filter/search.</p>}


    {/* User Table */}
    {/* Render table only if there are users matching filter/search */}
    {users.length > 0 && filteredAndSearchedUsers.length > 0 && (
<div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
    {/* This div handles the horizontal scrolling */}
    <div className="overflow-x-auto">
        {/* Table tries to be at least the full width of its container */}
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                {/* Checkbox Column (fixed width) */}
                <th scope="col" className="relative w-12 px-6 py-3">
                <input
                    type="checkbox"
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
                    ref={input => {
                        if (input) {
                            input.indeterminate = isIndeterminate;
                        }
                    }}
                    checked={isAllFilteredSelected}
                    onChange={handleSelectAll}
                    disabled={filteredAndSearchedUsers.length === 0 || isLoading}
                />
            </th>
                {/* Adjusted Headers with Padding/Width hints */}
                <th scope="col" className="min-w-[12rem] py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:pl-6">Name</th>
                <th scope="col" className="min-w-[14rem] px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                <th scope="col" className="min-w-[8rem] px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Badge No.</th>
                <th scope="col" className="min-w-[8rem] px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Rank</th>
                <th scope="col" className="min-w-[10rem] px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Department</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
                <th scope="col" className="px-3 py-3.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                {/* Actions Column (often needs decent width) */}
                <th scope="col" className="relative min-w-[12rem] py-3.5 pl-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500 sm:pr-6">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">


        {/* Map over PAGINATED users */}
{paginatedUsers.map((user) => {
    const userName = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email;
    const isActionLoading = actionLoading[user._id] || false;
    const isSelected = selectedUserIds.has(user._id);
    const isDisabled = isActionLoading || isSelected || isLoading;

    return (
        <tr key={user._id} className={`hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''}`}>
            {/* Checkbox Cell */}
            <td className="relative w-12 px-6 py-4">
                {isSelected && (
                    <div className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600"></div>
                )}
                <input
                    type="checkbox"
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
                    checked={isSelected}
                    onChange={(e) => handleSelectUser(e, user._id)}
                    value={user._id}
                    disabled={isLoading}
                />
            </td>
            {/* Data Cells with Padding */}
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                {user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'N/A'}
            </td>
            {/* Email: Allow potential wrapping or truncate */}
            <td className="px-3 py-4 text-sm text-gray-500 break-words">
                {user.email}
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.profile?.badgeNumber || 'N/A'}</td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.profile?.rank || 'N/A'}</td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.profile?.department || 'N/A'}</td>
            <td className="whitespace-nowrap px-3 py-4 text-sm capitalize text-gray-500">{user.role}</td>
            <td className="whitespace-nowrap px-3 py-4 text-center">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold leading-5 ${getStatusColor(user.status)}`}>
                    {user.status}
                </span>
            </td>
         {/* Actions Cell (keep nowrap on cell, flex on inner div) */}
         <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      {isActionLoading ? (
                            <span className="text-sm text-gray-500">Processing...</span>
                            ) : (
                            <div className="flex justify-end space-x-2">
                                {/* Buttons... */}
                                <button onClick={() => handleEdit(user._id)} className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed" disabled={isDisabled}>Edit</button>
                                <button onClick={() => handleApprove(user._id)} className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed" disabled={user.status === 'approved' || isDisabled}>Approve</button>
                                <button onClick={() => handleReject(user._id)} className="text-orange-600 hover:text-orange-900 disabled:text-gray-400 disabled:cursor-not-allowed" disabled={user.status === 'rejected' || isDisabled}>Reject</button>
                                <button onClick={() => handleDelete(user._id, userName)} className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed" disabled={isDisabled}>Delete</button>
                            </div>
                            )}
                        </td>
                    </tr>
                );
            })}
        </tbody>
    </table>
</div>

            {/* Pagination Controls */}
        {totalPages > 1 && (
            <nav
                className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
                aria-label="Pagination"
            >
                <div className="hidden sm:block">
                    {/* Use filteredAndSearchedUsers length for pagination text */}
                    <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredAndSearchedUsers.length)}</span> of{' '}
                        <span className="font-medium">{filteredAndSearchedUsers.length}</span> results
                    </p>
                </div>
                <div className="flex flex-1 justify-between sm:justify-end">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || isLoading}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || isLoading}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </nav>
            )}
    </div>
    )}
</div>
);
}
