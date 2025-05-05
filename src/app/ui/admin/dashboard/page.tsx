// src/app/ui/admin/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
// Import necessary icons
import {
    FaUsers, FaFileAlt, FaUserPlus, FaUserTimes, FaUserClock, FaUserCheck, FaPlusSquare,
    FaFilter, FaChevronDown, FaChartLine, FaChartBar, FaMapMarkedAlt, FaMale, FaFemale,
    FaQuestionCircle, FaGenderless, FaSpinner, FaCheckCircle, FaHourglassHalf,
    FaBrain, // Icon for Predictions
    FaCloudSun, FaMap, // Added FaMap for Crime Map button
    FaEye, FaChartPie, FaMapPin // Icons for view switch
} from 'react-icons/fa';

// --- Import Components ---
import PieChart from '@/app/components/PieChart';
import CrimeMap from '@/app/components/CrimeMap';
import LineChartReports from '@/app/components/LineChartReports';
import BarChart from '@/app/components/BarChart';
import PredictionCharts from '@/app/components/PredictionCharts';
import WeatherMap from '@/app/components/WeatherForecast'; // <-- Import WeatherMap

// --- Define Types ---
interface UserProfileInfo { firstName: string; lastName: string; }
interface UserListItem { _id: string; email: string; profile: UserProfileInfo | null; createdAt: string; }
interface ReportDataPointYearly { year: number; count: number; }
interface ReportDataPointMonthly { month: string; count: number; }
interface ReportDataPointWeekly { week: string; count: number; }
type ReportTrendData = ReportDataPointYearly[] | ReportDataPointMonthly[] | ReportDataPointWeekly[];
type TrendType = 'yearly' | 'monthly' | 'weekly';
interface TopLocationApiData { locationName: string; count: number; }
interface BarChartDisplayData { label: string; count: number; }
type LocationGroupByType = 'municipality_city' | 'barangay' | 'province';
interface GenderCount { gender: string | null; count: number; }
interface StatusCount { status: string; count: number; }
type MapType = 'heat' | 'hotspot' | 'status';
type DashboardViewMode = 'all' | 'charts' | 'visualizations';
// --- NEW: Interface for Legend Items (copied from admin dashboard) ---
interface LegendItem { color: string; label: string; }


// --- Helper components (UserList, formatDate) ---

// UserList component (remains the same)
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
                        <li key={user._id} className="flex justify-between items-center border-b border-gray-100 pb-1 last:border-b-0">
                            <span className="text-gray-800 truncate pr-2 text-base">
                                {user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email}
                            </span>
                            <span className="text-gray-500 text-sm flex-shrink-0">
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

// formatDate function (remains the same)
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
  const [selectedTrendType, setSelectedTrendType] = useState<TrendType>('yearly'); // Default trend type
  const [topLocationChartData, setTopLocationChartData] = useState<BarChartDisplayData[]>([]);
  const [isLoadingTopLocation, setIsLoadingTopLocation] = useState(true);
  const [errorTopLocation, setErrorTopLocation] = useState<string | null>(null);
  const [topLocationLimit, setTopLocationLimit] = useState(10);
  const [locationGroupBy, setLocationGroupBy] = useState<LocationGroupByType>('province'); // Default group by
  const [activeMap, setActiveMap] = useState<MapType>('heat');
  const [isMapFilterOpen, setIsMapFilterOpen] = useState(false);
  const mapFilterDropdownRef = useRef<HTMLDivElement>(null);
  const [genderCounts, setGenderCounts] = useState<GenderCount[]>([]);
  const [isLoadingGenderCounts, setIsLoadingGenderCounts] = useState(true);
  const [errorGenderCounts, setErrorGenderCounts] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [isLoadingStatusCounts, setIsLoadingStatusCounts] = useState(true);
  const [errorStatusCounts, setErrorStatusCounts] = useState<string | null>(null);
  const [selectedLocationYear, setSelectedLocationYear] = useState<string>('all');
  const [availableLocationYears, setAvailableLocationYears] = useState<number[]>([]);
  const [isLoadingLocationYears, setIsLoadingLocationYears] = useState(true);
  const [activeGeospatialView, setActiveGeospatialView] = useState<'crime' | 'weather'>('crime'); // State for map/weather view
  const [dashboardViewMode, setDashboardViewMode] = useState<DashboardViewMode>('all');


  // --- Map Endpoints & Legends ---
  const mapEndpoints: Record<MapType, string> = { heat: '/api/heatmap', hotspot: '/api/hotspot-map', status: '/api/status-map' };
  const statusMapLegend: LegendItem[] = [ { color: 'bg-red-500', label: 'Open / Ongoing' }, { color: 'bg-blue-500', label: 'Pending / Under Investigation' }, { color: 'bg-green-500', label: 'Closed / Resolved' } ];
  const heatmapLegend: LegendItem[] = [ { color: 'bg-blue-500', label: 'Low Risk' }, { color: 'bg-green-500', label: 'Moderate Risk' }, { color: 'bg-yellow-400', label: 'Medium Risk' }, { color: 'bg-red-500', label: 'High Risk' }, { color: 'bg-red-800', label: 'Very High Risk' } ];
  const hotspotMapLegend: LegendItem[] = [ { color: 'bg-red-600', label: 'Indicates areas with a higher probability of future crime incidents.' } ];

  // --- useEffect hooks for data fetching (remain the same) ---
  // Fetch Trend Data (Line Chart)
  useEffect(() => {
    const fetchTrendData = async () => {
      setIsLoadingTrend(true);
      setErrorTrend(null);
      setReportTrendData([]);
      const endpoint = `/api/crime-reports/stats/aggregate?groupBy=${selectedTrendType}`;
      try {
        const res = await fetch(endpoint);
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(`Failed to fetch trend data (${res.status}): ${errorData.error || res.statusText}`);
        }
        const data = await res.json();
        if (Array.isArray(data)) { setReportTrendData(data); }
        else {
            console.error("Received non-array data for trend:", data);
            setReportTrendData([]);
            throw new Error("Invalid trend data format.");
        }
      } catch (err: any) {
        console.error("Error fetching trend data:", err);
        setErrorTrend(err.message || 'Failed to load trend data.');
      }
      finally { setIsLoadingTrend(false); }
    };
    fetchTrendData();
  }, [selectedTrendType]);

  // Fetch Available Years for Top Locations Filter
  useEffect(() => {
    const fetchYears = async () => {
        setIsLoadingLocationYears(true);
        try {
            const res = await fetch('/api/crime-reports/stats/aggregate?groupBy=yearly');
            if (!res.ok) {
                throw new Error(`Failed to fetch available years (${res.status})`);
            }
            const yearlyData: ReportDataPointYearly[] = await res.json();
            if (Array.isArray(yearlyData)) {
                const years = yearlyData.map(item => item.year).sort((a, b) => b - a);
                setAvailableLocationYears(years);
            } else {
                throw new Error("Invalid data format for years.");
            }
        } catch (err) {
            console.error("Error fetching available years:", err);
            setAvailableLocationYears([]);
        } finally {
            setIsLoadingLocationYears(false);
        }
    };
    fetchYears();
  }, []);

  // Fetch Top Location Data (Bar Chart) - includes year filter
  useEffect(() => {
    if (isLoadingLocationYears) return;

    const fetchTopLocationData = async () => {
        setIsLoadingTopLocation(true);
        setErrorTopLocation(null);
        setTopLocationChartData([]);

        const params = new URLSearchParams({
            limit: String(topLocationLimit),
            groupBy: locationGroupBy,
        });
        if (selectedLocationYear !== 'all') {
            params.append('year', selectedLocationYear);
        }
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
  }, [topLocationLimit, locationGroupBy, selectedLocationYear, isLoadingLocationYears]);

  // Fetch General Dashboard Data (Counts, Lists, Gender, Status)
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoadingCounts(true); setErrorCounts(null);
      setIsLoadingPending(true); setErrorPending(null);
      setIsLoadingRejected(true); setErrorRejected(null);
      setIsLoadingGenderCounts(true); setErrorGenderCounts(null);
      setIsLoadingStatusCounts(true); setErrorStatusCounts(null);

      try {
        const [ countsResponse, pendingUsersListResponse, rejectedUsersListResponse, genderCountsResponse, statusCountsResponse ] = await Promise.all([
          Promise.all([
            fetch('/api/users/count').then(res => res.ok ? res.json() : Promise.reject('user count')),
            fetch('/api/users/count?status=approved').then(res => res.ok ? res.json() : Promise.reject('approved count')),
            fetch('/api/users/count?status=pending').then(res => res.ok ? res.json() : Promise.reject('pending count')),
            fetch('/api/users/count?status=rejected').then(res => res.ok ? res.json() : Promise.reject('rejected count')),
            fetch('/api/crime-reports/count').then(res => res.ok ? res.json() : Promise.reject('report count'))
          ]).catch(err => { throw new Error(`Count fetching failed: ${err}`); }),
          fetch('/api/users?status=pending&limit=5&sort=createdAt:desc').then(res => res.ok ? res.json() : Promise.reject('pending users list')),
          fetch('/api/users?status=rejected&limit=5&sort=createdAt:desc').then(res => res.ok ? res.json() : Promise.reject('rejected users list')),
          fetch('/api/users/stats/gender-count').then(res => res.ok ? res.json() : Promise.reject('gender counts')),
          fetch('/api/crime-reports/stats/status-counts').then(res => res.ok ? res.json() : Promise.reject('status counts')),
        ]);

        const [ totalUserData, approvedUserData, pendingUserData, rejectedUserData, reportData ] = countsResponse;
        setTotalUserCount(totalUserData.count);
        setApprovedUserCount(approvedUserData.count);
        setPendingUserCount(pendingUserData.count);
        setRejectedUserCount(rejectedUserData.count);
        setReportCount(reportData.count);
        setIsLoadingCounts(false);

        const pendingListData = Array.isArray(pendingUsersListResponse) ? pendingUsersListResponse : pendingUsersListResponse.data;
        setPendingUsers(pendingListData || []); setIsLoadingPending(false);
        const rejectedListData = Array.isArray(rejectedUsersListResponse) ? rejectedUsersListResponse : rejectedUsersListResponse.data;
        setRejectedUsers(rejectedListData || []); setIsLoadingRejected(false);

        if (Array.isArray(genderCountsResponse)) { setGenderCounts(genderCountsResponse); }
        else { setErrorGenderCounts("Invalid gender data."); }
        setIsLoadingGenderCounts(false);

        if (Array.isArray(statusCountsResponse)) { setStatusCounts(statusCountsResponse); }
        else { setErrorStatusCounts("Invalid status data."); }
        setIsLoadingStatusCounts(false);

      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setErrorCounts('Failed to load counts.');
        setErrorPending('Failed to load list.');
        setErrorRejected('Failed to load list.');
        setErrorGenderCounts('Failed to load gender data.');
        setErrorStatusCounts('Failed to load status data.');
        setIsLoadingCounts(false); setIsLoadingPending(false); setIsLoadingRejected(false);
        setIsLoadingGenderCounts(false); setIsLoadingStatusCounts(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Click outside handler for map filter dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mapFilterDropdownRef.current && !mapFilterDropdownRef.current.contains(event.target as Node)) {
        setIsMapFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [mapFilterDropdownRef]);

  // --- Handlers and Helpers ---
  const handleMapSelect = (mapType: MapType) => { setActiveMap(mapType); setIsMapFilterOpen(false); };
  const formatMapName = (mapType: MapType) => { const name = mapType.charAt(0).toUpperCase() + mapType.slice(1).replace('-', ' '); return `${name} Map`; };
  const getCurrentLegend = () => { switch (activeMap) { case 'status': return { title: "Case Status", items: statusMapLegend }; case 'heat': return { title: "Risk Level", items: heatmapLegend }; case 'hotspot': return { title: "Prediction", items: hotspotMapLegend }; default: return { title: undefined, items: undefined }; } };
  const currentLegend = getCurrentLegend(); // Removed useMemo as it's simple enough
  const handleTrendTypeChange = useCallback((type: TrendType) => { setSelectedTrendType(type); }, []);
  const handleLocationGroupByChange = useCallback((type: LocationGroupByType) => { setLocationGroupBy(type); }, []);
  const handleLocationYearChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLocationYear(event.target.value);
  }, []);
  const handleGeospatialViewChange = (view: 'crime' | 'weather') => {
    setActiveGeospatialView(view);
  };
  const handleDashboardViewChange = (mode: DashboardViewMode) => {
    setDashboardViewMode(mode);
  };

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
  } (${selectedLocationYear === 'all' ? 'All Time' : selectedLocationYear})`;

  // --- Data Getters ---
  const getGenderCount = (gender: string): number | string => {
      if (isLoadingGenderCounts) return "...";
      if (errorGenderCounts) return "Err";
      const targetGender = gender.toLowerCase();
      const found = genderCounts.find(item =>
          (item.gender === null || item.gender === '') && targetGender === ''
          ? true
          : item.gender?.toLowerCase() === targetGender
      );
      return found ? found.count : 0;
  }
  const getStatusCount = (status: string): number | string => {
      if (isLoadingStatusCounts) return "...";
      if (errorStatusCounts) return "Err";
      const found = statusCounts.find(item => item.status?.toLowerCase() === status.toLowerCase());
      return found ? found.count : 0;
  }


  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>

        {/* --- Dashboard View Mode Switch --- */}
        <div className="flex items-center space-x-2 bg-gray-200 p-1 rounded-lg">
          {(['all', 'charts', 'visualizations'] as DashboardViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleDashboardViewChange(mode)}
              className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                dashboardViewMode === mode
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              disabled={dashboardViewMode === mode}
            >
              {mode === 'all' && <FaEye className="mr-1.5" />}
              {mode === 'charts' && <FaChartPie className="mr-1.5" />}
              {mode === 'visualizations' && <FaMapPin className="mr-1.5" />}
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
        {/* --- END Dashboard View Mode Switch --- */}
      </div>


      {/* --- Conditional Rendering for Charts Sections --- */}
      {(dashboardViewMode === 'all' || dashboardViewMode === 'charts') && (
        <>
          {/* --- 'All' Mode Layout --- */}
          {dashboardViewMode === 'all' && (
            <>
              {/* Section: Top Counts & Pie Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Total Users Card */}
                  <div className="bg-white p-6 md:p-8 lg:p-12 rounded-lg shadow border border-gray-200 text-center h-full flex flex-col justify-between">
                      <div>
                          <div className="mb-3"> <FaUsers className={`mx-auto text-4xl mb-2 text-blue-600`} /> <h2 className="text-lg font-semibold text-gray-700"> Total Users </h2> </div>
                          <div> {isLoadingCounts && <div className="h-12 w-24 bg-gray-200 rounded animate-pulse mx-auto"></div>} {(errorCounts || errorGenderCounts) && !isLoadingCounts && !isLoadingGenderCounts && ( <p className="text-red-500 text-sm">{errorCounts || errorGenderCounts}</p> )} {!isLoadingCounts && !errorCounts && totalUserCount !== null && ( <p className={`text-5xl font-bold text-blue-600`}>{totalUserCount}</p> )} {!isLoadingCounts && !errorCounts && totalUserCount === null && ( <p className="text-5xl font-bold text-gray-400">-</p> )} </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap justify-around items-center text-sm text-gray-600 gap-y-2">
                          <div className="text-center px-1 min-w-[60px]"> <FaMale className="mx-auto text-xl text-blue-500 mb-1" /> <span className="font-medium block text-lg">{getGenderCount('Male')}</span> <span className="block text-xs">Male</span> </div>
                          <div className="text-center px-1 min-w-[60px]"> <FaFemale className="mx-auto text-xl text-pink-500 mb-1" /> <span className="font-medium block text-lg">{getGenderCount('Female')}</span> <span className="block text-xs">Female</span> </div>
                          { !isLoadingGenderCounts && !errorGenderCounts && typeof getGenderCount('Other') === 'number' && Number(getGenderCount('Other')) > 0 && (
                              <div className="text-center px-1 min-w-[60px]"> <FaGenderless className="mx-auto text-xl text-gray-400 mb-1" /> <span className="font-medium block text-lg">{getGenderCount('Other')}</span> <span className="block text-xs">Other</span> </div>
                          )}
                          { !isLoadingGenderCounts && !errorGenderCounts && typeof getGenderCount('') === 'number' && Number(getGenderCount('')) > 0 && (
                              <div className="text-center px-1 min-w-[60px]"> <FaQuestionCircle className="mx-auto text-xl text-gray-400 mb-1" /> <span className="font-medium block text-lg">{getGenderCount('')}</span> <span className="block text-xs">Unknown</span> </div>
                          )}
                      </div>
                  </div>

                  {/* Total Reports Card */}
                  <div className="bg-white p-6 md:p-8 lg:p-12 rounded-lg shadow border border-gray-200 text-center h-full flex flex-col justify-between">
                      <div>
                          <div className="mb-3"> <FaFileAlt className={`mx-auto text-4xl mb-2 text-orange-600`} /> <h2 className="text-lg font-semibold text-gray-700"> Total Reports </h2> </div>
                          <div> {isLoadingCounts && <div className="h-12 w-24 bg-gray-200 rounded animate-pulse mx-auto"></div>} {(errorCounts || errorStatusCounts) && !isLoadingCounts && !isLoadingStatusCounts && ( <p className="text-red-500 text-sm">{errorCounts || errorStatusCounts}</p> )} {!isLoadingCounts && !errorCounts && reportCount !== null && ( <p className={`text-5xl font-bold text-orange-600`}>{reportCount}</p> )} {!isLoadingCounts && !errorCounts && reportCount === null && ( <p className="text-5xl font-bold text-gray-400">-</p> )} </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap justify-around items-center text-sm text-gray-600 gap-y-2">
                          <div className="text-center px-1 min-w-[60px]"> <FaSpinner className="mx-auto text-xl text-blue-500 mb-1 animate-spin" /> <span className="font-medium block text-lg">{getStatusCount('Ongoing')}</span> <span className="block text-xs">Ongoing</span> </div>
                          <div className="text-center px-1 min-w-[60px]"> <FaHourglassHalf className="mx-auto text-xl text-yellow-500 mb-1" /> <span className="font-medium block text-lg">{getStatusCount('Pending')}</span> <span className="block text-xs">Pending</span> </div>
                          <div className="text-center px-1 min-w-[60px]"> <FaCheckCircle className="mx-auto text-xl text-green-500 mb-1" /> <span className="font-medium block text-lg">{getStatusCount('Resolved')}</span> <span className="block text-xs">Resolved</span> </div>
                          { !isLoadingStatusCounts && !errorStatusCounts && typeof getStatusCount('Unknown') === 'number' && Number(getStatusCount('Unknown')) > 0 && (
                              <div className="text-center px-1 min-w-[60px]"> <FaQuestionCircle className="mx-auto text-xl text-gray-400 mb-1" /> <span className="font-medium block text-lg">{getStatusCount('Unknown')}</span> <span className="block text-xs">Unknown</span> </div>
                          )}
                      </div>
                  </div>

                  {/* Pie Chart */}
                  <div className="md:col-span-2 lg:col-span-1">
                      <PieChart approvedCount={approvedUserCount} pendingCount={pendingUserCount} rejectedCount={rejectedUserCount} isLoading={isLoadingCounts} error={errorCounts ? 'Error loading chart data' : null} />
                  </div>
              </div>

              {/* Section: User Lists & Quick Links */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <UserList title="Recent Pending Users"  users={pendingUsers} isLoading={isLoadingPending} error={errorPending} emptyMessage="No pending users found." link="/ui/admin/user-management?status=pending" icon={FaUserClock} iconColor="text-yellow-600" />
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

              {/* --- MOVED: Geospatial Analysis / Weather Forecast Section --- */}
              {(dashboardViewMode === 'all' || dashboardViewMode === 'visualizations') && (
                <>
                  {/* Section: Crime Map Visualizations */}
                  <h1 className="text-2xl font-bold text-gray-800 mb-2 py-5">Geospatial Analysis / Weather Forecast</h1>
                  <div className="bg-white p-4 rounded-lg shadow border border-gray-200 ">
                    {/* --- Controls Row --- */}
                    <div className="mb-4 flex flex-wrap items-center justify-end gap-4">
                     {/* Crime Map Filter (Conditional) */}
                              {activeGeospatialView === 'crime' && (
                                <div className="relative mr-auto" ref={mapFilterDropdownRef}>
                                  <button
                                    onClick={() => setIsMapFilterOpen(!isMapFilterOpen)}
                                    className={`flex items-center px-4 py-2 font-semibold rounded-lg shadow-md text-sm transition-colors duration-150 ${
                                      isMapFilterOpen
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-100 text-gray-800 hover:bg-indigo-500 hover:text-white"
                                    }`}
                                  >
                                    <FaFilter className="mr-2" />
                                    {formatMapName(activeMap)}
                                    <FaChevronDown
                                      className={`ml-2 transition-transform duration-200 ${
                                        isMapFilterOpen ? "rotate-180" : ""
                                      }`}
                                    />
                                  </button>
                                  {isMapFilterOpen && (
                                    <div className="absolute left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-48 z-20">
                                      <ul className="py-1">
                                        {(["heat", "hotspot", "status"] as MapType[]).map(
                                          (mapType) => (
                                            <li key={mapType}>
                                              <button
                                                onClick={() => handleMapSelect(mapType)}
                                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                                  activeMap === mapType
                                                    ? "bg-gray-100 text-orange-500 font-medium"
                                                    : "text-gray-700 hover:bg-gray-100 hover:text-orange-500"
                                                }`}
                                              >
                                                {formatMapName(mapType)}
                                              </button>
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                      {/* View Switch Buttons - Kept at the end (justify-end will place them correctly) */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleGeospatialViewChange('crime')}
                          className={`flex items-center px-4 py-2 font-semibold rounded-lg shadow-md text-sm transition-colors duration-150 ${
                            activeGeospatialView === 'crime'
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-800 hover:bg-blue-500 hover:text-white"
                          }`}
                        >
                          <FaMap className="mr-2" /> Crime Map
                        </button>
                        <button
                          onClick={() => handleGeospatialViewChange('weather')}
                          className={`flex items-center px-4 py-2 font-semibold rounded-lg shadow-md text-sm transition-colors duration-150 ${
                            activeGeospatialView === 'weather'
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-800 hover:bg-blue-500 hover:text-white"
                          }`}
                        >
                          <FaCloudSun className="mr-2" /> Weather
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        {/* --- Dynamic Title --- */}
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                          {activeGeospatialView === 'crime' ? `Crime Map: ${formatMapName(activeMap)}` : 'Weather Forecast'}
                        </h2>
                        {/* Adjusted height: base height increased, md height set to 780px */}
                        <div className="w-full h-[600px] md:h-[780px] bg-white rounded-lg overflow-hidden shadow-inner">
                          {/* --- Conditional Rendering of Map/Weather --- */}
                          {activeGeospatialView === 'crime' && (
                            <CrimeMap
                              key={activeMap} // Keep key for re-rendering CrimeMap on type change
                              endpointPath={mapEndpoints[activeMap]}
                              className="w-full h-full"
                              legendTitle={currentLegend.title}
                              legendItems={currentLegend.items}
                            />
                          )}
                          {activeGeospatialView === 'weather' && (
                            <WeatherMap
                              key="weather-map" // Add a key for consistency
                              endpointPath="/api/generate-weather"
                              title="Weather Forecast" // Consistent title
                              className="relative w-full h-full flex-grow" // Ensure it fills the container
                            />
                          )}
                        </div>
                    </div>
                  </div>
                </>
              )}
              {/* --- END MOVED SECTION --- */}

              {/* Section: Line Chart & Bar Chart Side-by-Side */}
              <h1 className="text-2xl font-bold text-gray-800 mb-2 py-5">Report Charts</h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line Chart Container */}
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 border-b border-gray-200 pb-3 flex-shrink-0">
                        <h2 className="text-lg font-semibold text-gray-700 mb-2 sm:mb-0 flex items-center"> <FaChartLine className="mr-2 text-indigo-600" /> {lineChartTitle} </h2>
                        <div className="flex justify-center space-x-1 sm:space-x-2">
                            {(['yearly', 'monthly', 'weekly'] as TrendType[]).map((type) => (
                                <button key={type} onClick={() => handleTrendTypeChange(type)} disabled={isLoadingTrend} className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 ${ selectedTrendType === type ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200' }`} > {type.charAt(0).toUpperCase() + type.slice(1)} </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative h-96 flex-grow">
                        <LineChartReports data={reportTrendData} isLoading={isLoadingTrend} error={errorTrend} dataType={selectedTrendType} />
                    </div>
                </div>

                {/* Bar Chart Container */}
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-gray-200 pb-3 flex-shrink-0 gap-2">
                        <h2 className="text-lg font-semibold text-gray-700 flex items-center mr-2">
                            <FaChartBar className="mr-2 text-teal-600" />
                            {barChartTitle}
                        </h2>
                        <div className="flex flex-wrap justify-end items-center gap-2">
                            <div className="flex justify-center space-x-1 sm:space-x-2">
                                {(['province','municipality_city', 'barangay'] as LocationGroupByType[]).map((type) => (
                                    <button key={type} onClick={() => handleLocationGroupByChange(type)} disabled={isLoadingTopLocation} className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 ${ locationGroupBy === type ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200' }`} >
                                        {type === 'municipality_city' ? 'City/Mun' : type === 'province' ? 'Province' : 'Brgy'}
                                    </button>
                                ))}
                            </div>
                            <div className="flex-shrink-0 text-black">
                                <label htmlFor="locationYearSelect" className="sr-only">Select Year</label>
                                <select
                                    id="locationYearSelect"
                                    value={selectedLocationYear}
                                    onChange={handleLocationYearChange}
                                    disabled={isLoadingTopLocation || isLoadingLocationYears || availableLocationYears.length === 0}
                                    className="block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm disabled:opacity-50"
                                >
                                    <option value="all">All Time</option>
                                    {availableLocationYears.map(year => (
                                        <option key={year} value={year.toString()}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="relative h-96 flex-grow">
                        {isLoadingTopLocation && <div className="absolute inset-0 flex items-center justify-center text-gray-500">Loading Chart...</div>}
                        {errorTopLocation && !isLoadingTopLocation && <div className="absolute inset-0 flex items-center justify-center text-red-500 p-4 text-center">Error: {errorTopLocation}</div>}
                        {!isLoadingTopLocation && !errorTopLocation && (
                            <BarChart
                                data={topLocationChartData}
                                yAxisLabel="Number of Reports"
                                xAxisLabel={ locationGroupBy === 'barangay' ? 'Barangay' : locationGroupBy === 'province' ? 'Province' : 'Municipality/City' }
                                datasetLabel={`Reports (${selectedLocationYear === 'all' ? 'All Time' : selectedLocationYear})`}
                            />
                        )}
                        {isLoadingLocationYears && !isLoadingTopLocation && <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">Loading available years...</div>}
                    </div>
                </div>
              </div>

              {/* Section: Predictions */}
              <h1 className="text-2xl font-bold text-gray-800 mb-2 py-5">Crime Predictions</h1>
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col">

                  <div className="relative h-[750px] flex-grow">
                    <PredictionCharts
                      endpointPath="/api/forecast/crime-trend"
                      title="Crime Trend Forecast Chart"
                      className="w-full h-full"
                    />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col">

                  <div className="relative h-[700px] flex-grow">
                    <PredictionCharts
                      endpointPath="/api/forecast/top-locations"
                      title="Top Predicted Locations Chart"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          {/* --- END 'All' Mode Layout --- */}


          {/* --- 'Charts' Mode Layout --- */}
          {dashboardViewMode === 'charts' && (
            <>
              {/* Row 1: Pie Chart & Bar Chart */}
              <h1 className="text-xl font-bold text-gray-800 mb-2">Users, Crime Report & Location Charts</h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart Container */}
                  <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col">
                      {/* You might want a title here too */}
                      <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                          <FaChartPie className="mr-2 text-blue-600" />Status
                      </h2>
                      <div className="relative h-96 flex-grow"> {/* Ensure height */}
                          <PieChart approvedCount={approvedUserCount} pendingCount={pendingUserCount} rejectedCount={rejectedUserCount} isLoading={isLoadingCounts} error={errorCounts ? 'Error loading chart data' : null} />
                      </div>
                  </div>

                  {/* Bar Chart Container */}
                  <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-gray-200 pb-3 flex-shrink-0 gap-2">
                          <h2 className="text-lg font-semibold text-gray-700 flex items-center mr-2">
                              <FaChartBar className="mr-2 text-teal-600" />
                              {barChartTitle}
                          </h2>
                          <div className="flex flex-wrap justify-end items-center gap-2">
                              <div className="flex justify-center space-x-1 sm:space-x-2">
                                  {(['province','municipality_city', 'barangay'] as LocationGroupByType[]).map((type) => (
                                      <button key={type} onClick={() => handleLocationGroupByChange(type)} disabled={isLoadingTopLocation} className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 ${ locationGroupBy === type ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200' }`} >
                                          {type === 'municipality_city' ? 'City/Mun' : type === 'province' ? 'Province' : 'Brgy'}
                                      </button>
                                  ))}
                              </div>
                              <div className="flex-shrink-0 text-black">
                                  <label htmlFor="locationYearSelectCharts" className="sr-only">Select Year</label>
                                  <select
                                      id="locationYearSelectCharts" // Use different ID if needed
                                      value={selectedLocationYear}
                                      onChange={handleLocationYearChange}
                                      disabled={isLoadingTopLocation || isLoadingLocationYears || availableLocationYears.length === 0}
                                      className="block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm disabled:opacity-50"
                                  >
                                      <option value="all">All Time</option>
                                      {availableLocationYears.map(year => (
                                          <option key={year} value={year.toString()}>
                                              {year}
                                          </option>
                                      ))}
                                  </select>
                              </div>
                          </div>
                      </div>
                      <div className="relative h-96 flex-grow">
                          {isLoadingTopLocation && <div className="absolute inset-0 flex items-center justify-center text-gray-500">Loading Chart...</div>}
                          {errorTopLocation && !isLoadingTopLocation && <div className="absolute inset-0 flex items-center justify-center text-red-500 p-4 text-center">Error: {errorTopLocation}</div>}
                          {!isLoadingTopLocation && !errorTopLocation && (
                              <BarChart
                                  data={topLocationChartData}
                                  yAxisLabel="Number of Reports"
                                  xAxisLabel={ locationGroupBy === 'barangay' ? 'Barangay' : locationGroupBy === 'province' ? 'Province' : 'Municipality/City' }
                                  datasetLabel={`Reports (${selectedLocationYear === 'all' ? 'All Time' : selectedLocationYear})`}
                              />
                          )}
                          {isLoadingLocationYears && !isLoadingTopLocation && <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">Loading available years...</div>}
                      </div>
                  </div>
              </div>

              {/* Row 2: Line Chart & Prediction 1 */}
              <h1 className="text-2xl font-bold text-gray-800 mb-2 py-5">Report Trends & Predictions</h1>
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  {/* Line Chart Container */}
                  <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col">
                      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 border-b border-gray-200 pb-3 flex-shrink-0">
                          <h2 className="text-lg font-semibold text-gray-700 mb-2 sm:mb-0 flex items-center"> <FaChartLine className="mr-2 text-indigo-600" /> {lineChartTitle} </h2>
                          <div className="flex justify-center space-x-1 sm:space-x-2">
                              {(['yearly', 'monthly', 'weekly'] as TrendType[]).map((type) => (
                                  <button key={type} onClick={() => handleTrendTypeChange(type)} disabled={isLoadingTrend} className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 ${ selectedTrendType === type ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200' }`} > {type.charAt(0).toUpperCase() + type.slice(1)} </button>
                              ))}
                          </div>
                      </div>
                      <div className="relative h-96 flex-grow">
                          <LineChartReports data={reportTrendData} isLoading={isLoadingTrend} error={errorTrend} dataType={selectedTrendType} />
                      </div>
                  </div>

                  {/* Prediction 1 Container (Trend Forecast) */}
                  <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col">
                    {/* Adjusted height to match Line Chart */}
                    <div className="relative h-190 flex-grow">
                      <PredictionCharts
                        endpointPath="/api/forecast/crime-trend"
                        title="Crime Trend Forecast Chart"
                        className="w-full h-full"
                      />
                    </div>
                  </div>
              </div>

              {/* Row 3: Prediction 2 (Full Width) */}
              <div className="grid grid-cols-1 gap-6 mt-6"> {/* Added mt-6 for spacing */}
                  {/* Prediction 2 Container (Top Locations) */}
                  <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col">
                    {/* Height can be adjusted as needed */}
                    <div className="relative h-[700px] flex-grow">
                      <PredictionCharts
                        endpointPath="/api/forecast/top-locations"
                        title="Top Predicted Locations Chart"
                        className="w-full h-full"
                      />
                    </div>
                  </div>
              </div>
            </>
          )}
          {/* --- END 'Charts' Mode Layout --- */}
        </>
      )}
      {/* --- END Conditional Rendering for Charts Sections --- */}


      {/* --- Conditional Rendering for Visualizations Section (This is only rendered when mode is 'visualizations') --- */}
      {dashboardViewMode === 'visualizations' && (
        <>
          {/* Section: Crime Map Visualizations */}
          <h1 className="text-2xl font-bold text-gray-800 mb-2 py-5">Geospatial Analysis / Weather Forecast</h1>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200 ">
            {/* --- Controls Row --- */}
            <div className="mb-4 flex flex-wrap items-center justify-end gap-4">
              {/* Crime Map Filter (Conditional) - Moved to the start */}
              {activeGeospatialView === 'crime' && (
                <div className="relative mr-auto" ref={mapFilterDropdownRef}>
                  <button onClick={() => setIsMapFilterOpen(!isMapFilterOpen)} className={`flex items-center px-4 py-2 font-semibold rounded-lg shadow-md text-sm transition-colors duration-150 ${ isMapFilterOpen ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800 hover:bg-indigo-500 hover:text-white" }`}>
                    <FaFilter className="mr-2" />{formatMapName(activeMap)}<FaChevronDown className={`ml-2 transition-transform duration-200 ${isMapFilterOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isMapFilterOpen && ( <div className="absolute left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-48 z-20"><ul className="py-1">{(['heat', 'hotspot', 'status'] as MapType[]).map((mapType) => ( <li key={mapType}><button onClick={() => handleMapSelect(mapType)} className={`w-full text-left px-4 py-2 text-sm transition-colors ${ activeMap === mapType ? "bg-gray-100 text-orange-500 font-medium" : "text-gray-700 hover:bg-gray-100 hover:text-orange-500" }`}>{formatMapName(mapType)}</button></li> ))}</ul></div> )}
                </div>
              )}

              {/* View Switch Buttons - Kept at the end (justify-end will place them correctly) */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleGeospatialViewChange('crime')}
                  className={`flex items-center px-4 py-2 font-semibold rounded-lg shadow-md text-sm transition-colors duration-150 ${
                    activeGeospatialView === 'crime'
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800 hover:bg-blue-500 hover:text-white"
                  }`}
                >
                  <FaMap className="mr-2" /> Crime Map
                </button>
                <button
                  onClick={() => handleGeospatialViewChange('weather')}
                  className={`flex items-center px-4 py-2 font-semibold rounded-lg shadow-md text-sm transition-colors duration-150 ${
                    activeGeospatialView === 'weather'
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800 hover:bg-blue-500 hover:text-white"
                  }`}
                >
                  <FaCloudSun className="mr-2" /> Weather
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
                {/* --- Dynamic Title --- */}
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {activeGeospatialView === 'crime' ? `Crime Map: ${formatMapName(activeMap)}` : 'Weather Forecast'}
                </h2>
                {/* Adjusted height: base height increased, md height set to 780px */}
                <div className="w-full h-[600px] md:h-[780px] bg-white rounded-lg overflow-hidden shadow-inner">
                  {/* --- Conditional Rendering of Map/Weather --- */}
                  {activeGeospatialView === 'crime' && (
                    <CrimeMap
                      key={activeMap} // Keep key for re-rendering CrimeMap on type change
                      endpointPath={mapEndpoints[activeMap]}
                      className="w-full h-full"
                      legendTitle={currentLegend.title}
                      legendItems={currentLegend.items}
                    />
                  )}
                  {activeGeospatialView === 'weather' && (
                    <WeatherMap
                      key="weather-map" // Add a key for consistency
                      endpointPath="/api/generate-weather"
                      title="Weather Forecast" // Consistent title
                      className="relative w-full h-full flex-grow" // Ensure it fills the container
                    />
                  )}
                </div>
            </div>
          </div>
        </>
      )}
      {/* --- END Conditional Rendering for Visualizations Section --- */}

    </div>
  );
}
