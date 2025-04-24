// src/app/ui/admin/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
// *** ADD FaMale, FaFemale, FaQuestionCircle, FaGenderless, FaSpinner, FaCheckCircle, FaHourglassHalf icons ***
import { FaUsers, FaFileAlt, FaUserPlus, FaUserTimes, FaUserClock, FaUserCheck, FaPlusSquare, FaFilter, FaChevronDown, FaChartLine, FaChartBar, FaMapMarkedAlt, FaMale, FaFemale, FaQuestionCircle, FaGenderless, FaSpinner, FaCheckCircle, FaHourglassHalf } from 'react-icons/fa';
// Removed useTheme import

// --- Import Components ---
import PieChart from '@/app/components/PieChart'; // Assuming PieChart also had theme removed
import CrimeMap from '@/app/components/CrimeMap';
import LineChartReports from '@/app/components/LineChartReports';
// Ensure the path to BarChart is correct and it's the generic version without theme
import BarChart from '@/app/components/BarChart';

// --- Define Types ---
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
interface ReportDataPointYearly { year: number; count: number; }
interface ReportDataPointMonthly { month: string; count: number; }
interface ReportDataPointWeekly { week: string; count: number; }
interface ReportDataPointDaily { date: string; count: number; }
type ReportTrendData = ReportDataPointYearly[] | ReportDataPointMonthly[] | ReportDataPointWeekly[];
type TrendType = 'yearly' | 'monthly' | 'weekly';
interface TopLocationApiData {
    locationName: string;
    count: number;
}
interface BarChartDisplayData {
    label: string;
    count: number;
}
type LocationGroupByType = 'municipality_city' | 'barangay' | 'province';

// *** Type for Gender Count API response ***
interface GenderCount {
    gender: string | null; // Can be null/Unknown from API
    count: number;
}
// *** NEW: Type for Status Count API response ***
interface StatusCount {
    status: string; // "Ongoing", "Pending", "Resolved", "Unknown"
    count: number;
}
// Define MapType here as it's used in state
type MapType = 'heat' | 'hotspot' | 'status';


// --- Helper components (UserList, formatDate) ---
// CountCard is now replaced inline for Total Users/Reports, but kept here if needed elsewhere
const CountCard = ({ title, count, isLoading, error, icon: Icon, colorClass }: {
    title: string;
    count: number | null;
    isLoading: boolean;
    error: string | null;
    icon?: React.ElementType;
    colorClass?: string;
}) => (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 text-center h-full flex flex-col justify-center">
        {/* Icon and Title Area */}
        <div className="mb-4">
            {Icon && (
                <Icon className={`mx-auto text-4xl mb-2 ${colorClass || 'text-gray-500'}`} />
            )}
            <h2 className="text-lg font-semibold text-gray-700">
                {title}
            </h2>
        </div>
        {/* Count Area */}
        <div>
            {isLoading && <div className="h-12 w-24 bg-gray-200 rounded animate-pulse mx-auto"></div>}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {!isLoading && !error && count !== null && (
                <p className={`text-5xl font-bold ${colorClass || 'text-gray-800'}`}>{count}</p>
            )}
            {!isLoading && !error && count === null && (
                <p className="text-5xl font-bold text-gray-400">-</p>
            )}
        </div>
    </div>
);

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
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 h-full flex flex-col">
        <h2 className={`text-lg font-semibold text-gray-700 mb-3 flex items-center ${iconColor}`}>
           <Icon className="mr-2" /> {title}
        </h2>
        <div className="flex-grow overflow-y-auto">
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
                                {formatDate(user.createdAt)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
        {!isLoading && !error && (
            <div className="pt-3 mt-auto border-t border-gray-100">
                <Link href={link} className="text-sm text-blue-600 hover:underline">
                    View all...
                </Link>
            </div>
        )}
    </div>
);

const formatDate = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  } catch (e) {
    return 'Invalid Date';
  }
};


export default function AdminDashBoardPage() {
  // --- State variables ---
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
  const [reportTrendData, setReportTrendData] = useState<ReportTrendData>([]);
  const [isLoadingTrend, setIsLoadingTrend] = useState(true);
  const [errorTrend, setErrorTrend] = useState<string | null>(null);
  const [selectedTrendType, setSelectedTrendType] = useState<TrendType>('yearly');
  const [topLocationChartData, setTopLocationChartData] = useState<BarChartDisplayData[]>([]);
  const [isLoadingTopLocation, setIsLoadingTopLocation] = useState(true);
  const [errorTopLocation, setErrorTopLocation] = useState<string | null>(null);
  const [topLocationLimit, setTopLocationLimit] = useState(10);
  const [locationGroupBy, setLocationGroupBy] = useState<LocationGroupByType>('municipality_city');
  const [activeMap, setActiveMap] = useState<MapType>('heat');
  const [isMapFilterOpen, setIsMapFilterOpen] = useState(false);
  const mapFilterDropdownRef = useRef<HTMLDivElement>(null);

  // *** State for Gender Counts ***
  const [genderCounts, setGenderCounts] = useState<GenderCount[]>([]);
  const [isLoadingGenderCounts, setIsLoadingGenderCounts] = useState(true);
  const [errorGenderCounts, setErrorGenderCounts] = useState<string | null>(null);

  // *** NEW: State for Status Counts ***
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [isLoadingStatusCounts, setIsLoadingStatusCounts] = useState(true);
  const [errorStatusCounts, setErrorStatusCounts] = useState<string | null>(null);

  // --- Map Endpoints & Legends (remain the same) ---
  const mapEndpoints: Record<MapType, string> = {
    heat: '/api/heatmap',
    hotspot: '/api/hotspot-map',
    status: '/api/status-map',
   };
  const statusMapLegend = [
    { color: 'bg-red-500', label: 'Open / Ongoing' },
    { color: 'bg-blue-500', label: 'Pending / Under Investigation' },
    { color: 'bg-green-500', label: 'Closed / Resolved' },
  ];
  const heatmapLegend = [
    { color: 'bg-blue-500', label: 'Low Risk' },
    { color: 'bg-green-500', label: 'Moderate Risk' },
    { color: 'bg-yellow-400', label: 'Medium Risk' },
    { color: 'bg-red-500', label: 'High Risk' },
    { color: 'bg-red-800', label: 'Very High Risk' },
  ];
  const hotspotMapLegend = [
    { color: 'bg-red-600', label: 'Indicates areas with a higher probability of future crime incidents.' },
  ];

  // --- useEffect hooks for data fetching ---
  useEffect(() => {
    const fetchTrendData = async () => {
      setIsLoadingTrend(true);
      setErrorTrend(null);
      setReportTrendData([]);
      const endpoint = `/api/crime-reports/stats/aggregate?groupBy=${selectedTrendType}`;
      try {
        console.log(`Fetching trend data from: ${endpoint}`);
        const res = await fetch(endpoint);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(`Failed to fetch report trend data (${res.status}): ${errorData.error || res.statusText}`);
        }
        const data = await res.json();
        if (Array.isArray(data)) {
            setReportTrendData(data);
        } else {
            console.error("Received non-array data for trend:", data);
            setReportTrendData([]);
            throw new Error("Invalid data format received for trend chart.");
        }
      } catch (err: any) {
        console.error("Error fetching trend data:", err);
        setErrorTrend(err.message || 'Failed to load trend data.');
      }
      finally { setIsLoadingTrend(false); }
    };
    fetchTrendData();
  }, [selectedTrendType]);

  useEffect(() => {
    const fetchTopLocationData = async () => {
        setIsLoadingTopLocation(true);
        setErrorTopLocation(null);
        setTopLocationChartData([]);

        const params = new URLSearchParams({
            limit: String(topLocationLimit),
            groupBy: locationGroupBy,
        });
        const endpoint = `/api/crime-reports/stats/top-locations?${params.toString()}`;

        try {
            console.log(`Fetching top locations from: ${endpoint}`);
            const res = await fetch(endpoint);
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`Failed to fetch top locations (${res.status}): ${errorData.error || res.statusText}`);
            }
            const apiData: TopLocationApiData[] = await res.json();

            if (Array.isArray(apiData)) {
                const formattedData: BarChartDisplayData[] = apiData.map(item => ({
                    label: item.locationName,
                    count: item.count,
                }));
                setTopLocationChartData(formattedData);
            } else {
                console.error("Received non-array data for top locations:", apiData);
                setTopLocationChartData([]);
                throw new Error("Invalid data format received for top locations chart.");
            }
        } catch (err: any) {
            console.error("Error fetching top locations:", err);
            setErrorTopLocation(err.message || 'Failed to load top locations.');
        } finally {
            setIsLoadingTopLocation(false);
        }
    };
    fetchTopLocationData();
  }, [topLocationLimit, locationGroupBy]);

  // *** UPDATED: useEffect for fetching counts, gender, AND status data ***
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Reset states
      setIsLoadingCounts(true);
      setErrorCounts(null);
      setIsLoadingPending(true);
      setErrorPending(null);
      setIsLoadingRejected(true);
      setErrorRejected(null);
      setIsLoadingGenderCounts(true);
      setErrorGenderCounts(null);
      setIsLoadingStatusCounts(true); // Reset status loading
      setErrorStatusCounts(null);     // Reset status error

      try {
        const [
            countsResponse,
            pendingUsersListResponse,
            rejectedUsersListResponse,
            genderCountsResponse,
            statusCountsResponse, // Fetch status counts
        ] = await Promise.all([
          // Fetch All Counts
          Promise.all([
            fetch('/api/users/count').then(res => res.ok ? res.json() : Promise.reject('Failed to fetch total user count')),
            fetch('/api/users/count?status=approved').then(res => res.ok ? res.json() : Promise.reject('Failed to fetch approved user count')),
            fetch('/api/users/count?status=pending').then(res => res.ok ? res.json() : Promise.reject('Failed to fetch pending user count')),
            fetch('/api/users/count?status=rejected').then(res => res.ok ? res.json() : Promise.reject('Failed to fetch rejected user count')),
            fetch('/api/crime-reports/count').then(res => res.ok ? res.json() : Promise.reject('Failed to fetch report count'))
          ]).catch(err => { throw new Error(`Count fetching failed: ${err}`); }),
          // Fetch User Lists
          fetch('/api/users?status=pending&limit=5&sort=createdAt:desc').then(res => res.ok ? res.json() : Promise.reject('Failed to fetch pending users list')),
          fetch('/api/users?status=rejected&limit=5&sort=createdAt:desc').then(res => res.ok ? res.json() : Promise.reject('Failed to fetch rejected users list')),
          // Fetch Gender Counts
          fetch('/api/users/stats/gender-count').then(res => res.ok ? res.json() : Promise.reject('Failed to fetch gender counts')),
          // *** Fetch Status Counts ***
          fetch('/api/crime-reports/stats/status-counts').then(res => res.ok ? res.json() : Promise.reject('Failed to fetch status counts')),
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

        // Process Gender Counts Response
        if (Array.isArray(genderCountsResponse)) {
            setGenderCounts(genderCountsResponse);
        } else {
            console.error("Invalid gender count data received:", genderCountsResponse);
            setErrorGenderCounts("Invalid data format for gender counts.");
        }
        setIsLoadingGenderCounts(false);

        // *** Process Status Counts Response ***
        if (Array.isArray(statusCountsResponse)) {
            setStatusCounts(statusCountsResponse);
        } else {
            console.error("Invalid status count data received:", statusCountsResponse);
            setErrorStatusCounts("Invalid data format for status counts.");
        }
        setIsLoadingStatusCounts(false);


      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        // Update error handling to include status counts
        if (err.message?.includes('count')) setErrorCounts(err.message);
        if (err.message?.includes('pending users list')) setErrorPending('Failed to load list.');
        if (err.message?.includes('rejected users list')) setErrorRejected('Failed to load list.');
        if (err.message?.includes('gender counts')) setErrorGenderCounts('Failed to load gender data.');
        if (err.message?.includes('status counts')) setErrorStatusCounts('Failed to load status data.'); // Add status error

        // Set all loading states to false on error
        setIsLoadingCounts(false);
        setIsLoadingPending(false);
        setIsLoadingRejected(false);
        setIsLoadingGenderCounts(false);
        setIsLoadingStatusCounts(false); // Set status loading false
      }
    };
    fetchDashboardData();
  }, []); // Empty dependency array, runs once

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mapFilterDropdownRef.current && !mapFilterDropdownRef.current.contains(event.target as Node)) {
        setIsMapFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mapFilterDropdownRef]);

  // --- Handlers and Helpers ---
  const handleMapSelect = (mapType: MapType) => {
    setActiveMap(mapType);
    setIsMapFilterOpen(false);
   };
  const formatMapName = (mapType: MapType) => {
    const name = mapType.charAt(0).toUpperCase() + mapType.slice(1).replace('-', ' ');
    return `${name} Map`;
   };
  const getCurrentLegend = () => {
    switch (activeMap) {
      case 'status':
        return { title: "Case Status", items: statusMapLegend };
      case 'heat':
        return { title: "Risk Level", items: heatmapLegend };
      case 'hotspot':
        return { title: "Prediction", items: hotspotMapLegend };
      default:
        return { title: undefined, items: undefined };
    }
   };
  const currentLegend = getCurrentLegend();
  const handleTrendTypeChange = useCallback((type: TrendType) => { setSelectedTrendType(type); }, []);
  const handleLocationGroupByChange = useCallback((type: LocationGroupByType) => { setLocationGroupBy(type); }, []);

  // --- Determine Chart Titles ---
  const lineChartTitle =
      selectedTrendType === 'yearly' ? "Crime Reports (By Year)"
    : selectedTrendType === 'monthly' ? "Crime Reports (By Month)"
    : selectedTrendType === 'weekly' ? "Crime Reports (By Week)"
    : "Reports";
  const barChartTitle = `Top ${topLocationLimit} ${
    locationGroupBy === 'barangay' ? 'Barangays'
    : locationGroupBy === 'province' ? 'Provinces'
    : 'Municipalities/Cities'
  }`;

  // *** Helper to find specific gender count ***
  const getGenderCount = (gender: string): number | string => {
      if (isLoadingGenderCounts) return "..."; // Loading indicator
      if (errorGenderCounts) return "Err"; // Error indicator
      // Find case-insensitively, handle null/undefined gender from API
      const found = genderCounts.find(item => item.gender?.toLowerCase() === gender.toLowerCase());
      return found ? found.count : 0;
  }

  // *** NEW: Helper to find specific status count ***
  const getStatusCount = (status: string): number | string => {
      if (isLoadingStatusCounts) return "..."; // Loading indicator
      if (errorStatusCounts) return "Err"; // Error indicator
      // Find case-insensitively
      const found = statusCounts.find(item => item.status?.toLowerCase() === status.toLowerCase());
      return found ? found.count : 0;
  }


  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>

      {/* Section: Top Counts & Pie Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Total Users Card (with gender breakdown) */}
        <div className="bg-white p-12 rounded-lg shadow border border-gray-200 text-center h-full flex flex-col justify-between">
            {/* Main Count Section */}
            <div>
                <div className="mb-3">
                    <FaUsers className={`mx-auto text-4xl mb-2 text-blue-600`} />
                    <h2 className="text-lg font-semibold text-gray-700">
                        Total Users
                    </h2>
                </div>
                <div>
                    {isLoadingCounts && <div className="h-12 w-24 bg-gray-200 rounded animate-pulse mx-auto"></div>}
                    {(errorCounts || errorGenderCounts) && !isLoadingCounts && !isLoadingGenderCounts && (
                        <p className="text-red-500 text-sm">{errorCounts || errorGenderCounts}</p>
                    )}
                    {!isLoadingCounts && !errorCounts && totalUserCount !== null && (
                        <p className={`text-5xl font-bold text-blue-600`}>{totalUserCount}</p>
                    )}
                    {!isLoadingCounts && !errorCounts && totalUserCount === null && (
                        <p className="text-5xl font-bold text-gray-400">-</p>
                    )}
                </div>
            </div>
            {/* Gender Sub-Counts */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap justify-around items-center text-sm text-gray-600 gap-y-2">
                <div className="text-center px-1 min-w-[60px]">
                    <FaMale className="mx-auto text-xl text-blue-500 mb-1" />
                    <span className="font-medium block text-lg">{getGenderCount('Male')}</span>
                    <span className="block text-xs">Male</span>
                </div>
                <div className="text-center px-1 min-w-[60px]">
                    <FaFemale className="mx-auto text-xl text-pink-500 mb-1" />
                    <span className="font-medium block text-lg">{getGenderCount('Female')}</span>
                    <span className="block text-xs">Female</span>
                </div>

            </div>
        </div>

        {/* --- UPDATED: Total Reports Card --- */}
        <div className="bg-white p-12 rounded-lg shadow border border-gray-200 text-center h-full flex flex-col justify-between">
             {/* Main Count Section */}
             <div>
                <div className="mb-3">
                    <FaFileAlt className={`mx-auto text-4xl mb-2 text-orange-600`} />
                    <h2 className="text-lg font-semibold text-gray-700">
                        Total Reports
                    </h2>
                </div>
                <div>
                    {isLoadingCounts && <div className="h-12 w-24 bg-gray-200 rounded animate-pulse mx-auto"></div>}
                    {/* Display general count error OR specific status count error */}
                    {(errorCounts || errorStatusCounts) && !isLoadingCounts && !isLoadingStatusCounts && (
                        <p className="text-red-500 text-sm">{errorCounts || errorStatusCounts}</p>
                    )}
                    {!isLoadingCounts && !errorCounts && reportCount !== null && (
                        <p className={`text-5xl font-bold text-orange-600`}>{reportCount}</p>
                    )}
                    {!isLoadingCounts && !errorCounts && reportCount === null && (
                        <p className="text-5xl font-bold text-gray-400">-</p>
                    )}
                </div>
            </div>
            {/* Sub-Counts Section (Status) */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap justify-around items-center text-sm text-gray-600 gap-y-2">
                <div className="text-center px-1 min-w-[60px]">
                    <FaSpinner className="mx-auto text-xl text-blue-500 mb-1 animate-spin" /> {/* Icon for Ongoing */}
                    <span className="font-medium block text-lg">{getStatusCount('Ongoing')}</span>
                    <span className="block text-xs">Ongoing</span>
                </div>
                <div className="text-center px-1 min-w-[60px]">
                    <FaHourglassHalf className="mx-auto text-xl text-yellow-500 mb-1" /> {/* Icon for Pending */}
                    <span className="font-medium block text-lg">{getStatusCount('Pending')}</span>
                    <span className="block text-xs">Pending</span>
                </div>
                <div className="text-center px-1 min-w-[60px]">
                    <FaCheckCircle className="mx-auto text-xl text-green-500 mb-1" /> {/* Icon for Resolved */}
                    <span className="font-medium block text-lg">{getStatusCount('Resolved')}</span>
                    <span className="block text-xs">Resolved</span>
                </div>
                 {/* Optionally show 'Unknown' if relevant and count > 0 */}
                 { !isLoadingStatusCounts && !errorStatusCounts && typeof getStatusCount('Unknown') === 'number' && Number(getStatusCount('Unknown')) > 0 && (
                     <div className="text-center px-1 min-w-[60px]">
                        <FaQuestionCircle className="mx-auto text-xl text-gray-400 mb-1" />
                        <span className="font-medium block text-lg">{getStatusCount('Unknown')}</span>
                        <span className="block text-xs">Unknown</span>
                    </div>
                )}
            </div>
        </div>
        {/* --- End UPDATED Total Reports Card --- */}

        {/* Pie Chart */}
        <div className="md:col-span-2 lg:col-span-1">
            <PieChart
                approvedCount={approvedUserCount}
                pendingCount={pendingUserCount}
                rejectedCount={rejectedUserCount}
                isLoading={isLoadingCounts}
                error={errorCounts ? 'Error loading chart data' : null}
            />
        </div>
      </div>

     {/* --- Section: Line Chart & Bar Chart Side-by-Side --- */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart Container */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 border-b border-gray-200 pb-3 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-700 mb-2 sm:mb-0 flex items-center">
                    <FaChartLine className="mr-2 text-indigo-600" />
                    {lineChartTitle}
                </h2>
                <div className="flex justify-center space-x-2">
                    {(['yearly', 'monthly', 'weekly'] as TrendType[]).map((type) => (
                        <button
                        key={type}
                        onClick={() => handleTrendTypeChange(type)}
                        className={`px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                            selectedTrendType === type
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
            {/* Chart Area */}
            <div className="relative h-96 flex-grow">
                <LineChartReports data={reportTrendData} isLoading={isLoadingTrend} error={errorTrend} dataType={selectedTrendType} />
            </div>
        </div>
        {/* Bar Chart Container */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col">
             {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 border-b border-gray-200 pb-3 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-700 mb-2 sm:mb-0 flex items-center">
                    <FaMapMarkedAlt className="mr-2 text-teal-600" />
                    {barChartTitle}
                </h2>
                 {/* Group By Buttons */}
                <div className="flex justify-center space-x-2">
                    {(['province','municipality_city', 'barangay'] as LocationGroupByType[]).map((type) => (
                        <button
                        key={type}
                        onClick={() => handleLocationGroupByChange(type)}
                        className={`px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                            locationGroupBy === type
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        >
                        {type === 'municipality_city' ? 'City/Municipality'
                         : type === 'province' ? 'Province'
                         : 'Barangay'}
                        </button>
                    ))}
                </div>
            </div>
            {/* Chart Area */}
            <div className="relative h-96 flex-grow">
                {isLoadingTopLocation && <div className="absolute inset-0 flex items-center justify-center text-gray-500">Loading Chart...</div>}
                {errorTopLocation && <div className="absolute inset-0 flex items-center justify-center text-red-500 p-4 text-center">Error: {errorTopLocation}</div>}
                {!isLoadingTopLocation && !errorTopLocation && (
                    <BarChart
                        data={topLocationChartData}
                        yAxisLabel="Number of Reports"
                        xAxisLabel={
                            locationGroupBy === 'barangay' ? 'Barangay'
                            : locationGroupBy === 'province' ? 'Province'
                            : 'Municipality/City'
                        }
                        datasetLabel="Reports"
                    />
                )}
            </div>
        </div>
    </div> {/* End of Charts Grid */}


      {/* Section: User Lists & Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <UserList title="Recent Pending Users" users={pendingUsers} isLoading={isLoadingPending} error={errorPending} emptyMessage="No pending users found." link="/ui/admin/user-management?status=pending" icon={FaUserClock} iconColor="text-yellow-600" />
         <UserList title="Recent Rejected Users" users={rejectedUsers} isLoading={isLoadingRejected} error={errorRejected} emptyMessage="No rejected users found." link="/ui/admin/user-management?status=rejected" icon={FaUserTimes} iconColor="text-red-600" />
         <div className="bg-white p-4 rounded-lg shadow border border-gray-200 h-full">
             <h2 className="text-lg font-semibold text-gray-700 mb-3">Quick Links</h2>
             <div className="space-y-3">
                 <Link href="/ui/admin/user-management" className="flex items-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"><FaUsers className="mr-3 text-blue-500" /><span>Manage Users</span></Link>
                 <Link href="/ui/admin/view-crime" className="flex items-center p-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm"><FaFileAlt className="mr-3 text-orange-500" /><span>View Crime Reports</span></Link>
                 <Link href="/ui/admin/user-management/add-user" className="flex items-center p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"><FaUserPlus className="mr-3 text-green-500" /><span>Add New User</span></Link>
                 <Link href="/ui/admin/add-crime" className="flex items-center p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm"><FaPlusSquare className="mr-3 text-purple-500" /><span>Add New Crime Report</span></Link>
             </div>
         </div>
      </div>

      {/* Section: Crime Map Visualizations */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        {/* Map Filter Dropdown */}
        <div className="relative mb-4 flex justify-start" ref={mapFilterDropdownRef}>
            <button onClick={() => setIsMapFilterOpen(!isMapFilterOpen)} className={`flex items-center px-4 py-2 font-semibold rounded-lg shadow-md text-sm transition-colors duration-150 ${ isMapFilterOpen ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800 hover:bg-blue-500 hover:text-white" }`}><FaFilter className="mr-2" />{formatMapName(activeMap)}<FaChevronDown className={`ml-2 transition-transform duration-200 ${isMapFilterOpen ? 'rotate-180' : ''}`} /></button>
            {isMapFilterOpen && ( <div className="absolute left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-48 z-20"><ul className="py-1">{(['heat', 'hotspot', 'status'] as MapType[]).map((mapType) => ( <li key={mapType}><button onClick={() => handleMapSelect(mapType)} className={`w-full text-left px-4 py-2 text-sm transition-colors ${ activeMap === mapType ? "bg-gray-100 text-orange-500 font-medium" : "text-gray-700 hover:bg-gray-100 hover:text-orange-500" }`}>{formatMapName(mapType)}</button></li> ))}</ul></div> )}
        </div>
         {/* Inner Map Container */}
         <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Crime Map: {formatMapName(activeMap)}</h2>
            <div className="w-full h-[500px] md:h-[600px] bg-white rounded-lg overflow-hidden shadow-inner">
              <CrimeMap key={activeMap} endpointPath={mapEndpoints[activeMap]} className="w-full h-full" legendTitle={currentLegend.title} legendItems={currentLegend.items} />
            </div>
        </div>
      </div>

    </div>
  );
}
