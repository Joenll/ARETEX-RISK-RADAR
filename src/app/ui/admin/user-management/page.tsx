'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IUser } from '@/models/User';
import { IUserProfile, UserSex } from '@/models/UserProfile';
import { FaEdit, FaTrash, FaShareSquare, FaSearch, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';
import Button from '@/app/components/Button'; // Import the custom Button component
import Swal from 'sweetalert2'; // Import SweetAlert2

// Define a combined type for the user data we expect from the API
interface UserWithProfile extends Omit<IUser, 'profile' | 'password'> {
    _id: string;
    profile: Pick<IUserProfile, 'firstName' | 'lastName' | 'employeeNumber' | 'workPosition' | 'team' | 'sex' | 'profilePictureUrl'> | null; // Added profilePictureUrl
    status: 'pending' | 'approved' | 'rejected';
    role: 'admin' | 'user'; // Match the expected role types
    email: string; // Ensure email is included
}


// --- Pagination Configuration ---
const ITEMS_PER_PAGE = 10;

// --- Define possible sex values for filtering ---
const sexOptions: UserSex[] = ['Male', 'Female'];

// --- Pagination Helper Function (Copied from view-crime) ---
const getPaginationItems = (currentPage: number, totalPages: number, maxVisiblePages: number = 5): (number | '...')[] => {
    if (totalPages <= maxVisiblePages) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const items: (number | '...')[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    const firstPage = 1;
    const lastPage = totalPages;
    items.push(firstPage);
    let startPage = Math.max(firstPage + 1, currentPage - halfVisible + (maxVisiblePages % 2 === 0 ? 1 : 0));
    let endPage = Math.min(lastPage - 1, currentPage + halfVisible);
    if (currentPage - halfVisible <= firstPage + 1) {
        endPage = Math.min(lastPage - 1, firstPage + maxVisiblePages - 2);
        startPage = firstPage + 1;
    } else if (currentPage + halfVisible >= lastPage - 1) {
        startPage = Math.max(firstPage + 1, lastPage - maxVisiblePages + 2);
        endPage = lastPage - 1;
    }
    if (startPage > firstPage + 1) items.push('...');
    for (let i = startPage; i <= endPage; i++) items.push(i);
    if (endPage < lastPage - 1) items.push('...');
    if (lastPage > endPage) items.push(lastPage);
    return items;
};
// --- END Pagination Helper Function ---


export default function UserManagementPage() {
    // --- State ---
    const [users, setUsers] = useState<UserWithProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Keep error state for general fetch errors, but use Swal for action feedback
    const [error, setError] = useState<string | null>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterSex, setFilterSex] = useState<string>('');
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const exportDropdownRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    // --- Data Fetching (remains the same) ---
    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null); // Clear general error on fetch
        try {
            const response = await fetch('/api/users');
            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.statusText}`);
            }
            const data: UserWithProfile[] = await response.json();
            setUsers(data);
        } catch (err: any) {
            console.error("Error fetching users:", err);
            setError(err.message || 'An unknown error occurred while fetching users.'); // Set general error
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // --- Close Export Dropdown (remains the same) ---
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

    // --- Filtering and Searching (remains the same) ---
    const filteredAndSearchedUsers = useMemo(() => {
        return users.filter(user => {
            const statusMatch = filterStatus === '' || user.status === filterStatus;
            const sexMatch = filterSex === '' || user.profile?.sex === filterSex;
            const searchLower = searchTerm.toLowerCase();
            const name = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : '';
            const nameMatch = name.toLowerCase().includes(searchLower);
            const emailMatch = user.email.toLowerCase().includes(searchLower);
            const badgeMatch = !!user.profile?.employeeNumber && String(user.profile.employeeNumber).toLowerCase().includes(searchLower);
            const workPositionMatch = !!user.profile?.workPosition && user.profile.workPosition.toLowerCase().includes(searchLower);
            const teamMatch = !!user.profile?.team && user.profile.team.toLowerCase().includes(searchLower);
            const searchMatch = searchTerm === '' || nameMatch || emailMatch || badgeMatch || workPositionMatch || teamMatch;
            return statusMatch && sexMatch && searchMatch;
        });
    }, [users, filterStatus, filterSex, searchTerm]);

    // --- Reset page on filter/search change (remains the same) ---
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, filterSex, searchTerm]);

    // --- Pagination Logic (remains the same) ---
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

    // --- Selection Handling (remains the same) ---
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

    const isAllFilteredSelected = useMemo(() => {
        if (filteredAndSearchedUsers.length === 0) return false;
        return filteredAndSearchedUsers.every(user => selectedUserIds.has(user._id));
    }, [filteredAndSearchedUsers, selectedUserIds]);

    const isIndeterminate = useMemo(() => {
        if (filteredAndSearchedUsers.length === 0) return false;
        const selectedCountInFilter = filteredAndSearchedUsers.filter(user => selectedUserIds.has(user._id)).length;
        return selectedCountInFilter > 0 && selectedCountInFilter < filteredAndSearchedUsers.length;
    }, [filteredAndSearchedUsers, selectedUserIds]);


    // --- Action Handlers (Approve, Reject, Delete, Edit, Add, Bulk) ---
    const setActionLoadingState = (userId: string, isLoading: boolean) => {
        setActionLoading(prev => ({ ...prev, [userId]: isLoading }));
    };

    // --- UPDATED handleApprove ---
    const handleApprove = async (userId: string) => {
        setActionLoadingState(userId, true);
        // setError(null); // Clear general error, Swal will handle action error
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
            // Show success alert
            Swal.fire({
                icon: 'success',
                title: 'Approved!',
                text: 'User status updated to approved.',
                timer: 1500,
                showConfirmButton: false,
            });
            await fetchUsers(); // Refetch users
            setSelectedUserIds(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        } catch (err: any) {
            console.error("Error approving user:", err);
            // Show error alert
            Swal.fire({
                icon: 'error',
                title: 'Approval Failed',
                text: err.message || 'An unknown error occurred while approving user.',
            });
        } finally {
            setActionLoadingState(userId, false);
        }
     };

    // --- UPDATED handleReject ---
    const handleReject = async (userId: string) => {
        setActionLoadingState(userId, true);
        // setError(null);
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
            // Show success alert
            Swal.fire({
                icon: 'success',
                title: 'Rejected!',
                text: 'User status updated to rejected.',
                timer: 1500,
                showConfirmButton: false,
            });
            await fetchUsers();
             setSelectedUserIds(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        } catch (err: any) {
            console.error("Error rejecting user:", err);
            // Show error alert
            Swal.fire({
                icon: 'error',
                title: 'Rejection Failed',
                text: err.message || 'An unknown error occurred while rejecting user.',
            });
        } finally {
            setActionLoadingState(userId, false);
        }
     };

    // --- UPDATED handleDelete ---
    const handleDelete = async (userId: string, userName: string) => {
        // Use SweetAlert for confirmation
        Swal.fire({
            title: 'Are you sure?',
            html: `You are about to permanently delete the user "<b>${userName}</b>".<br/>This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33', // Red for delete
            cancelButtonColor: '#3085d6', // Blue for cancel
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Proceed with deletion if confirmed
                setActionLoadingState(userId, true);
                // setError(null);
                try {
                    const response = await fetch(`/api/users/${userId}`, {
                        method: 'DELETE',
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Failed to delete user: ${response.statusText} - ${errorData.message || errorData.error}`);
                    }
                    // Show success alert
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: `User "${userName}" has been deleted.`,
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    await fetchUsers();
                    setSelectedUserIds(prev => {
                        const next = new Set(prev);
                        next.delete(userId);
                        return next;
                    });
                    console.log(`User ${userId} deleted successfully.`);
                } catch (err: any) {
                    console.error("Error deleting user:", err);
                    // Show error alert
                    Swal.fire({
                        icon: 'error',
                        title: 'Deletion Failed',
                        text: err.message || 'An unknown error occurred while deleting user.',
                    });
                } finally {
                    setActionLoadingState(userId, false);
                }
            }
        });
     };

    const handleEdit = (userId: string) => {
        router.push(`/ui/admin/user-management/${userId}/edit`);
     };
    const handleAddUser = () => {
        router.push('/ui/admin/user-management/add-user');
     };

    // --- UPDATED handleBulkAction ---
    const handleBulkAction = async (action: 'approve' | 'reject') => {
        const userIds = Array.from(selectedUserIds);
        if (userIds.length === 0) return;
        const status = action === 'approve' ? 'approved' : 'rejected';
        const actionVerb = action === 'approve' ? 'approving' : 'rejecting';
        const actionPast = action === 'approve' ? 'approved' : 'rejected';

        // Confirmation for bulk action
        Swal.fire({
            title: `Confirm Bulk ${actionPast.charAt(0).toUpperCase() + actionPast.slice(1)}`,
            text: `Are you sure you want to ${action} ${userIds.length} selected user(s)?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#aaa',
            confirmButtonText: `Yes, ${action} selected!`,
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                setIsLoading(true); // Use general loading for bulk
                // setError(null);
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
                    // Show success alert
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: `${userIds.length} user(s) have been ${actionPast}.`,
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    await fetchUsers();
                    setSelectedUserIds(new Set());
                } catch (err: any) {
                    console.error(`Error during bulk ${action}:`, err);
                    // Show error alert
                    Swal.fire({
                        icon: 'error',
                        title: `Bulk ${actionPast.charAt(0).toUpperCase() + actionPast.slice(1)} Failed`,
                        text: err.message || `An unknown error occurred during bulk ${action}.`,
                    });
                } finally {
                    setIsLoading(false);
                }
            }
        });
     };

    // --- Helper (remains the same) ---
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-green-700 bg-green-100';
            case 'pending': return 'text-yellow-700 bg-yellow-100';
            case 'rejected': return 'text-red-700 bg-red-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    // --- Export Handlers (remains the same) ---
    const handleExport = (format: 'excel' | 'pdf') => {
        setIsExporting(true);
        setError(null);
        console.log(`Exporting to ${format.toUpperCase()}...`);
        const baseUrl = '/api/users/export';
        const params = new URLSearchParams();
        params.append('format', format);
        if (filterStatus) params.append('status', filterStatus);
        if (filterSex) params.append('sex', filterSex);
        if (searchTerm) params.append('search', searchTerm);
        const exportUrl = `${baseUrl}?${params.toString()}`;
        console.log("Export URL:", exportUrl);
        window.location.href = exportUrl;
        setIsExportDropdownOpen(false);
        setTimeout(() => setIsExporting(false), 3000);
    };
    const handleExportExcel = () => handleExport('excel');
    const handleExportPDF = () => handleExport('pdf');

    // --- Calculate pagination items for rendering (remains the same) ---
    const paginationItems = getPaginationItems(currentPage, totalPages);

    //----  UI PART ------
    // --- Helper to get initials ---
    const getInitials = (firstName?: string, lastName?: string, email?: string): string => {
        const first = firstName?.[0]?.toUpperCase() || '';
        const last = lastName?.[0]?.toUpperCase() || '';
        if (first && last) return `${first}${last}`;
        return email?.[0]?.toUpperCase() || '?';
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            {/* Title and Subtitle */}
            <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Management</h1>
                <p className="text-sm text-gray-600">Manages users information</p>
            </div>

            {/* Header Section (remains the same) */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
                {/* Left Section: Add User Button */}
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

                {/* Center Section: Search Bar */}
                <div className="relative flex-grow w-full md:w-1/3">
                    <input
                        type="text"
                        placeholder="Search name, email, employee no., etc..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={isLoading}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <FaSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                </div>

                {/* Right Section: Filters & Export */}
                <div className="flex items-center space-x-4">
                    {/* Export Button & Dropdown */}
                    <div className="relative" ref={exportDropdownRef}>
                        <button
                            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                            className={`flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg shadow-md hover:bg-blue-200 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isExporting || isLoading}
                        >
                            {isExporting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <FaShareSquare className="mr-2" />
                                    Export
                                </>
                            )}
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

                    {/* Sex Filter Dropdown */}
                    <div className="flex items-center">
                        <label htmlFor="sex-filter" className="sr-only">Sex:</label>
                        <select
                            id="sex-filter"
                            value={filterSex}
                            onChange={(e) => setFilterSex(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                            disabled={isLoading}
                        >
                            <option value="">All Sexes</option>
                            {sexOptions.map(sex => (
                                <option key={sex} value={sex}>{sex}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter Dropdown */}
                    <div className="flex items-center">
                        <label htmlFor="status-filter" className="sr-only">Status:</label>
                        <select
                            id="status-filter"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                            disabled={isLoading}
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Bulk Action Buttons (remains the same) */}
            <div className={`mb-4 ${selectedUserIds.size > 0 ? 'block' : 'hidden'}`}>
                <span className="mr-4 text-sm font-medium text-gray-700">{selectedUserIds.size} user(s) selected</span>
                <Button
                    variant="primary"
                    onClick={() => handleBulkAction('approve')}
                    className="mr-2 text-sm"
                    disabled={isLoading}
                >
                    Approve Selected
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => handleBulkAction('reject')}
                    className="text-sm"
                    disabled={isLoading}
                >
                    Reject Selected
                </Button>
            </div>

            {/* Loading/Error/Empty States */}
            {isLoading && !users.length && <div className="flex justify-center items-center h-32"><div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div></div>}
            {/* Display general fetch error if present */}
            {error && <div className="my-4 rounded-md bg-red-50 p-4 text-sm text-red-700">Error fetching users: {error}</div>}
            {!isLoading && !error && users.length === 0 && <div className="text-center py-10 text-gray-500">No users found.</div>}
            {!isLoading && !error && users.length > 0 && filteredAndSearchedUsers.length === 0 && <div className="text-center py-10 text-gray-500">No users match your filter/search.</div>}

            {/* Table Section (remains the same) */}
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
                                <th className="px-2 py-2 w-10"></th>
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
                                const userName = user.profile ? `${user.profile.firstName} ${user.profile.lastName}`.trim() : user.email; // Added trim
                                const userInitials = getInitials(user.profile?.firstName, user.profile?.lastName, user.email);
                                const isActionLoading = actionLoading[user._id] || false;
                                const isSelected = selectedUserIds.has(user._id);
                                const isDisabled = isActionLoading || isLoading;
                                const canApprove = user.status !== 'approved';
                                const canReject = user.status !== 'rejected';

                                return (
                                    <tr key={user._id} className={`border-t border-gray-200 hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''}`}>{/* Ensure no whitespace before first td */}
                                        <td className="px-1 py-2 relative">{/* Ensure no whitespace before content */}
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
                                        {/* Avatar Cell */}<td className="px-2 py-2">{/* Ensure no whitespace */}
                                            <div className="w-8 h-8 rounded-full border border-gray-300 overflow-hidden flex items-center justify-center bg-blue-500 text-white text-xs font-semibold">
                                                {user.profile?.profilePictureUrl ? (
                                                    <img
                                                        src={user.profile.profilePictureUrl}
                                                        alt={userName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span>{userInitials}</span>
                                                )}
                                            </div>
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
                                            ) : (/* Ensure no whitespace */
                                                <div className="flex justify-center items-center space-x-3">
                                                    <button
                                                        onClick={() => handleEdit(user._id)}
                                                        title="Edit"
                                                        className="text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                        disabled={isDisabled}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(user._id)}
                                                        title={canApprove ? "Approve" : "Already Approved"}
                                                        className={`${canApprove ? 'text-green-500 hover:text-green-600' : 'text-gray-400 cursor-not-allowed'} disabled:text-gray-400 disabled:cursor-not-allowed`}
                                                        disabled={isDisabled || !canApprove}
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(user._id)}
                                                        title={canReject ? "Reject" : "Already Rejected"}
                                                        className={`${canReject ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 cursor-not-allowed'} disabled:text-gray-400 disabled:cursor-not-allowed`}
                                                        disabled={isDisabled || !canReject}
                                                    >
                                                        <FaTimes />
                                                    </button>
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

            {/* Pagination Section (remains the same) */}
            {totalPages > 1 && (
                <div className="flex flex-wrap justify-between items-center mt-4 border-t border-gray-200 pt-4">
                    <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || isLoading}
                        variant="back"
                        className={`text-sm ${currentPage === 1 ? "cursor-not-allowed" : ""}`}
                    >
                        Previous
                    </Button>
                    <div className="flex space-x-1 items-center">
                        {paginationItems.map((item, index) =>
                            item === '...' ? (
                            <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-500">...</span>
                            ) : (
                            <Button
                                key={item}
                                onClick={() => handlePageChange(item)}
                                variant={currentPage === item ? 'primary' : 'outline'}
                                className={`text-sm ${currentPage === item ? "font-bold" : "bg-white"}`}
                                disabled={isLoading}
                            >
                                {item}
                            </Button>
                            )
                        )}
                    </div>
                    <span className="text-sm text-gray-700 hidden md:inline">
                        Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                        &nbsp;({filteredAndSearchedUsers.length} users)
                    </span>
                    <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || isLoading}
                        variant="secondary"
                        className={`text-sm ${currentPage === totalPages ? "cursor-not-allowed" : ""}`}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
