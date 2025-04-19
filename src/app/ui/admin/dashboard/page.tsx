"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaUsers, FaFileAlt, FaUserPlus, FaUserTimes, FaUserClock, FaUserCheck, FaPlusSquare } from 'react-icons/fa';

// --- Import the new PieChart component ---
import PieChart from '@/app/components/PieChart'; // Adjust path if needed

// Define types
interface UserProfileInfo {
  firstName: string;
  lastName: string;
}
interface UserListItem {
  _id: string;
  email: string;
  profile: UserProfileInfo | null;
  createdAt: string;
}

// --- Helper component for count cards ---
const CountCard = ({ title, count, isLoading, error, icon: Icon, colorClass }: {
    title: string;
    count: number | null;
    isLoading: boolean;
    error: string | null;
    icon?: React.ElementType;
    colorClass?: string;
}) => (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 text-center">
        <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center justify-center">
            {Icon && <Icon className={`mr-2 ${colorClass || 'text-gray-500'}`} />}
            {title}
        </h2>
        {isLoading && <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {!isLoading && !error && count !== null && (
            <p className={`text-3xl font-bold ${colorClass || 'text-gray-800'}`}>{count}</p>
        )}
        {!isLoading && !error && count === null && (
            <p className="text-3xl font-bold text-gray-400">-</p>
        )}
    </div>
);

// --- Helper component for user list items ---
const UserList = ({ title, users, isLoading, error, emptyMessage, link, icon: Icon, iconColor }: {
    title: string;
    users: UserListItem[];
    isLoading: boolean;
    error: string | null;
    emptyMessage: string;
    link: string;
    icon: React.ElementType;
    iconColor: string;
}) => (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 h-full flex flex-col"> {/* Added h-full and flex */}
        <h2 className={`text-lg font-semibold text-gray-700 mb-3 flex items-center ${iconColor}`}>
           <Icon className="mr-2" /> {title}
        </h2>
        <div className="flex-grow"> {/* Added flex-grow to push link down */}
            {isLoading && (
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                </div>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {!isLoading && !error && users.length === 0 && (
                <p className="text-gray-500 text-sm">{emptyMessage}</p>
            )}
            {!isLoading && !error && users.length > 0 && (
                <ul className="space-y-2">
                    {users.map(user => (
                        <li key={user._id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-1 last:border-b-0">
                            <span className="text-gray-800 truncate pr-2">
                                {user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email}
                            </span>
                            <span className="text-gray-500 text-xs flex-shrink-0">
                                {formatDate(user.createdAt)} {/* Ensure formatDate is defined */}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
        {/* Link to full management page */}
        {!isLoading && !error && (
            <div className="pt-3 mt-auto"> {/* Added mt-auto to push link to bottom */}
                <Link href={link} className="text-sm text-blue-600 hover:underline">
                    View all...
                </Link>
            </div>
        )}
    </div>
);

// --- Helper to format date ---
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  } catch (e) {
    return 'Invalid Date';
  }
};


export default function AdminDashBoardPage() {
  // --- State variables (remain the same) ---
  const [totalUserCount, setTotalUserCount] = useState<number | null>(null);
  const [reportCount, setReportCount] = useState<number | null>(null);
  const [approvedUserCount, setApprovedUserCount] = useState<number | null>(null);
  const [pendingUserCount, setPendingUserCount] = useState<number | null>(null);
  const [rejectedUserCount, setRejectedUserCount] = useState<number | null>(null);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  const [errorCounts, setErrorCounts] = useState<string | null>(null);
  const [pendingUsers, setPendingUsers] = useState<UserListItem[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [errorPending, setErrorPending] = useState<string | null>(null);
  const [rejectedUsers, setRejectedUsers] = useState<UserListItem[]>([]);
  const [isLoadingRejected, setIsLoadingRejected] = useState(true);
  const [errorRejected, setErrorRejected] = useState<string | null>(null);

  // --- useEffect for fetching data (Remains the same) ---
  useEffect(() => {
    const fetchData = async () => {
      // Reset states
      setIsLoadingCounts(true);
      setErrorCounts(null);
      setIsLoadingPending(true);
      setErrorPending(null);
      setIsLoadingRejected(true);
      setErrorRejected(null);

      try {
        // Fetch counts, pending users, and rejected users concurrently
        const [
            countsResponse,
            pendingUsersListResponse,
            rejectedUsersListResponse
        ] = await Promise.all([
          // Fetch All Counts
          Promise.all([
            fetch('/api/users/count').then(res => res.ok ? res.json() : Promise.reject('Failed to fetch total user count')),
            fetch('/api/users/count?status=approved').then(res => res.ok ? res.json() : Promise.reject('Failed to fetch approved user count')),
            fetch('/api/users/count?status=pending').then(res => res.ok ? res.json() : Promise.reject('Failed to fetch pending user count')),
            fetch('/api/users/count?status=rejected').then(res => res.ok ? res.json() : Promise.reject('Failed to fetch rejected user count')),
            fetch('/api/crime-reports/count').then(res => res.ok ? res.json() : Promise.reject('Failed to fetch report count'))
          ]).catch(err => { throw new Error(`Count fetching failed: ${err}`); }),

          // Fetch Recent Pending Users List
          fetch('/api/users?status=pending&limit=5&sort=createdAt:desc').then(res => res.ok ? res.json() : Promise.reject('Failed to fetch pending users list')),

          // Fetch Recent Rejected Users List
          fetch('/api/users?status=rejected&limit=5&sort=createdAt:desc').then(res => res.ok ? res.json() : Promise.reject('Failed to fetch rejected users list'))
        ]);

        // Process Counts Response
        const [
            totalUserData, approvedUserData, pendingUserData, rejectedUserData, reportData
        ] = countsResponse;
        setTotalUserCount(totalUserData.count);
        setApprovedUserCount(approvedUserData.count);
        setPendingUserCount(pendingUserData.count);
        setRejectedUserCount(rejectedUserData.count);
        setReportCount(reportData.count);
        setIsLoadingCounts(false);

        // Process List Responses
        const pendingListData = Array.isArray(pendingUsersListResponse) ? pendingUsersListResponse : pendingUsersListResponse.data;
        setPendingUsers(pendingListData || []);
        setIsLoadingPending(false);
        const rejectedListData = Array.isArray(rejectedUsersListResponse) ? rejectedUsersListResponse : rejectedUsersListResponse.data;
        setRejectedUsers(rejectedListData || []);
        setIsLoadingRejected(false);

      } catch (err: any) {
        console.error("Error fetching admin dashboard data:", err);
        setErrorCounts(err.message || "Could not load dashboard counts.");
        if (err.message?.includes('pending users list')) setErrorPending('Failed to load pending users list.');
        if (err.message?.includes('rejected users list')) setErrorRejected('Failed to load rejected users list.');
        setIsLoadingCounts(false);
        setIsLoadingPending(false);
        setIsLoadingRejected(false);
      }
    };
    fetchData();
  }, []);



  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>

      {/* Section: Top Counts (Total Users & Reports) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total User Count Card */}
        <CountCard
            title="Total Users"
            count={totalUserCount}
            isLoading={isLoadingCounts}
            error={errorCounts ? 'Error loading counts' : null}
            icon={FaUsers}
            colorClass="text-blue-600"
        />
        {/* Report Count Card */}
        <CountCard
            title="Total Reports"
            count={reportCount}
            isLoading={isLoadingCounts}
            error={errorCounts ? 'Error loading counts' : null}
            icon={FaFileAlt}
            colorClass="text-orange-600"
        />
      </div>

      {/* --- Section: User Lists, Chart & Quick Links --- */}
      {/* Changed grid layout to 4 columns on large screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Column 1: Recent Pending Users */}
        <UserList
            title="Recent Pending Users"
            users={pendingUsers}
            isLoading={isLoadingPending}
            error={errorPending}
            emptyMessage="No pending users found."
            link="/ui/admin/user-management?status=pending"
            icon={FaUserClock}
            iconColor="text-yellow-600"
        />

        {/* Column 2: Recent Rejected Users */}
        <UserList
            title="Recent Rejected Users"
            users={rejectedUsers}
            isLoading={isLoadingRejected}
            error={errorRejected}
            emptyMessage="No rejected users found."
            link="/ui/admin/user-management?status=rejected"
            icon={FaUserTimes}
            iconColor="text-red-600"
        />

        {/* Column 3: User Status Pie Chart */}
        <PieChart
            approvedCount={approvedUserCount}
            pendingCount={pendingUserCount}
            rejectedCount={rejectedUserCount}
            isLoading={isLoadingCounts}
            error={errorCounts ? 'Error loading chart data' : null}
        />

        {/* Column 4: Quick Links (Moved here) */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 h-full"> {/* Added h-full */}
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Quick Links</h2>
            <div className="space-y-3">
               {/* Quick Links */}
               <Link href="/ui/admin/user-management" className="flex items-center p-5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  <FaUsers className="mr-3 text-blue-500" />
                  <span>Manage Users</span>
               </Link>
               <Link href="/ui/admin/view-crime" className="flex items-center p-5 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
                  <FaFileAlt className="mr-3 text-orange-500" />
                  <span>View Crime Reports</span>
               </Link>
               <Link href="/ui/admin/user-management/add-user" className="flex items-center p-5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                  <FaUserPlus className="mr-3 text-green-500" />
                  <span>Add New User</span>
               </Link>
               { <Link href="/ui/admin/add-crime" className="flex items-center p-5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                  <FaPlusSquare className="mr-3 text-purple-500" />
                  <span>Add New Crime Report</span>
               </Link> }
            </div>
         </div>

      </div>


    </div>
  );
}
