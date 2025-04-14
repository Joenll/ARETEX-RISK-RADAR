// src/app/ui/admin/view-crime/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FaFilter,
  FaThLarge,
  FaList,
  FaEdit,
  FaTrash,
  FaChevronUp,
  FaChevronDown,
  FaTimes,
  FaPlus,
} from "react-icons/fa";
import Button from "@/app/components/Button";
import CrimeReportGrid from "@/app/components/ReportGridView";
import CrimeReportListView from "@/app/components/ReportListView";

// Debounce function... (keep as is)
function debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  }

// formatDate function... (keep as is)
const formatDate = (dateString: string | Date): string => {
    try {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-CA");
    } catch (e) {
      return "Invalid Date";
    }
  };

// CrimeReport interface... (keep as is)
export interface CrimeReport {
    _id: string;
    crime_id: string;
    date: string;
    time: string;
    day_of_week: string;
    case_status: string;
    event_proximity: string;
    crime_occurred_indoors_or_outdoors: string;
    location: {
      _id: string;
      house_building_number: string;
      street_name: string;
      purok_block_lot: string;
      barangay: string;
      municipality_city: string;
      province: string;
      zip_code: string;
      region: string;
      latitude: number;
      longitude: number;
    };
    crime_type: {
      _id: string;
      crime_type: string;
      crime_type_category: string;
    };
  }

export default function CrimeReportList() {
  // --- State declarations ---
  const [crimeReports, setCrimeReports] = useState<CrimeReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(12);
  const [totalReports, setTotalReports] = useState(0);
  const [filterCaseStatus, setFilterCaseStatus] = useState("");
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [searchCrimeType, setSearchCrimeType] = useState("");
  const [debouncedCrimeTypeSearchTerm, setDebouncedCrimeTypeSearchTerm] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [debouncedLocationSearchTerm, setDebouncedLocationSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<CrimeReport | null>(null);

  // --- Fetch Logic ---
  const fetchCrimeReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * reportsPerPage;
      let url = `/api/crime-reports?limit=${reportsPerPage}&skip=${skip}`;

      if (filterCaseStatus) url += `&case_status=${filterCaseStatus}`;
      if (filterStartDate) url += `&start_date=${filterStartDate.toISOString().split('T')[0]}`;
      if (filterEndDate) url += `&end_date=${filterEndDate.toISOString().split('T')[0]}`;

      if (debouncedCrimeTypeSearchTerm) {
        url += `&search_crime_type=${encodeURIComponent(debouncedCrimeTypeSearchTerm)}`;
      }
      if (debouncedLocationSearchTerm) {
        url += `&search_location=${encodeURIComponent(debouncedLocationSearchTerm)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCrimeReports(data.data);
      setTotalReports(data.total);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      setCrimeReports([]);
      setTotalReports(0);
    } finally {
      setIsLoading(false);
    }
  }, [
      currentPage, reportsPerPage, filterCaseStatus, filterStartDate, filterEndDate,
      debouncedCrimeTypeSearchTerm, debouncedLocationSearchTerm
  ]);

  useEffect(() => {
    fetchCrimeReports();
  }, [fetchCrimeReports]);

  // --- Debounced Handlers ---
  const debouncedUpdateCrimeTypeSearch = useRef(
    debounce((value: string) => {
      setDebouncedCrimeTypeSearchTerm(value);
      setCurrentPage(1);
    }, 500)
  ).current;

  const debouncedUpdateLocationSearch = useRef(
    debounce((value: string) => {
      setDebouncedLocationSearchTerm(value);
      setCurrentPage(1);
    }, 500)
  ).current;

  // --- Input Change Handlers... (keep as is) ---
  const handleCrimeTypeSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchCrimeType(value);
    debouncedUpdateCrimeTypeSearch(value);
  };

  const handleLocationSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchLocation(value);
    debouncedUpdateLocationSearch(value);
  };

  // --- Filter/Page Handlers ---
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
    }
  };
  const handleCaseStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterCaseStatus(e.target.value);
    setCurrentPage(1);
  };
  const handleStartDateChange = (date: Date | null) => {
    setFilterStartDate(date);
    setCurrentPage(1);
  };
  const handleEndDateChange = (date: Date | null) => {
    setFilterEndDate(date);
    setCurrentPage(1);
  };
  const handleClearFilters = () => {
    setFilterCaseStatus("");
    setFilterStartDate(null);
    setFilterEndDate(null);
    setSearchCrimeType("");
    setDebouncedCrimeTypeSearchTerm("");
    setSearchLocation("");
    setDebouncedLocationSearchTerm("");
    setCurrentPage(1);
  };

  // --- View/Expansion Handlers ---
  const toggleRowExpansion = (index: number) => {
    setExpandedRow(prev => (prev === index ? null : index));
  };

  // --- Delete Handlers (Keep as is) ---
  const handleDeleteClick = (report: CrimeReport) => {
    setCurrentReport(report);
    setIsDeleteModalOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (!currentReport) return;
    setIsLoading(true);
    setIsDeleteModalOpen(false);
    try {
      const response = await fetch(`/api/crime-reports/${currentReport._id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      alert("Crime report deleted successfully!");
      setCurrentReport(null);
      setCrimeReports(prev => prev.filter(r => r._id !== currentReport._id));
      setTotalReports(prev => prev -1);
    } catch (err: any) {
       console.error("Delete Error:", err);
       setError(`Error deleting report: ${err.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  // --- UI Rendering ---
  const totalPages = Math.ceil(totalReports / reportsPerPage);

  // formatLocationString function... (keep as is)
  const formatLocationString = (location: CrimeReport['location']): string => {
    return [
        location.house_building_number, location.street_name, location.purok_block_lot,
        location.barangay, location.municipality_city, location.province,
    ].filter(Boolean).join(", ");
  }

  // Error display... (keep as is)
  if (error && !isDeleteModalOpen) {
    return (
        <div className="bg-gray-50 p-8 font-sans min-h-screen">
            <div className="p-4 text-center text-red-500 bg-red-100 border border-red-400 rounded-md">
                <p><strong>Error:</strong> {error}</p>
                <button
                    onClick={() => { setError(null); fetchCrimeReports(); }}
                    className="mt-2 px-3 py-1 border rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-gray-50 p-8 font-sans min-h-screen">
      {/* Header... (keep as is) */}
      <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Crime Reports</h1>
          <p className="text-sm text-gray-500">Track crime incident records</p>
        </div>
        <Link href="/ui/admin/add-crime">
            <Button variant="primary" className="flex items-center">
                <FaPlus className="mr-2" /> Insert Crime Data
            </Button>
        </Link>
      </header>

      {/* Toolbar - Removed justify-between from parent */}
      <div className="flex flex-wrap items-center mb-4 gap-3">
        {/* Filters and Search Section */}
        <div className="flex items-center space-x-2 flex-wrap gap-3">
          {/* Search Inputs */}
          <input
            type="text"
            placeholder="Search Crime Types"
            value={searchCrimeType}
            onChange={handleCrimeTypeSearchChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-800"
          />
          <input
            type="text"
            placeholder="Search Location"
            value={searchLocation}
            onChange={handleLocationSearchChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-800"
          />
          {/* Case Status Filter */}
          <select
            value={filterCaseStatus}
            onChange={handleCaseStatusChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          >
             <option value="">All Statuses</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Resolved">Resolved</option>
            <option value="Pending">Pending</option>
          </select>
          {/* Date Pickers */}
          <div className="react-datepicker-wrapper">
             <DatePicker
                selected={filterStartDate}
                onChange={handleStartDateChange}
                placeholderText="Start Date"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-gray-900 placeholder:text-gray-800"
                isClearable
              />
          </div>
          <div className="react-datepicker-wrapper">
             <DatePicker
                selected={filterEndDate}
                onChange={handleEndDateChange}
                placeholderText="End Date"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-gray-900 placeholder:text-gray-800"
                isClearable
              />
          </div>
          {/* Clear Button */}
          <Button variant="secondary" onClick={handleClearFilters}>Clear Filters</Button>

          {/* View Mode Dropdown - MOVED HERE */}
          <div className="relative">
            <button
              onClick={() => setIsViewDropdownOpen((prev) => !prev)}
              className={`px-4 py-2 rounded-lg flex items-center ${
                isViewDropdownOpen
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-blue-600 hover:text-white"
              }`}
            >
              View
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isViewDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  className={`w-full px-4 py-2 text-left flex items-center ${viewMode === 'grid' ? 'font-semibold text-orange-600 bg-gray-100' : 'text-gray-800 hover:text-orange-500 hover:bg-gray-100'}`}
                  onClick={() => { setViewMode("grid"); setIsViewDropdownOpen(false); }}
                  disabled={viewMode === 'grid'}
                >
                  <FaThLarge className="mr-2 text-gray-600" /> Grid View
                </button>
                <button
                   className={`w-full px-4 py-2 text-left flex items-center ${viewMode === 'list' ? 'font-semibold text-orange-600 bg-gray-100' : 'text-gray-800 hover:text-orange-500 hover:bg-gray-100'}`}
                  onClick={() => { setViewMode("list"); setIsViewDropdownOpen(false); }}
                  disabled={viewMode === 'list'}
                >
                  <FaList className="mr-2 text-gray-600" /> List View
                </button>
              </div>
            )}
          </div>
          {/* End View Mode Dropdown */}

        </div>
        {/* Removed the separate div for View Mode Dropdown */}
      </div>

      {/* Loading Indicator... (keep as is) */}
      {isLoading && (
         <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
         </div>
      )}

      {/* No Results Message... (keep as is) */}
      {!isLoading && crimeReports.length === 0 && (
         <div className="text-center text-gray-500 mt-8 p-6 bg-white rounded-lg shadow">
             No crime reports found matching your criteria.
         </div>
      )}

      {/* Content Area */}
      {!isLoading && crimeReports.length > 0 && (
        <>
          {viewMode === "grid" ? (
            <CrimeReportGrid
              reports={crimeReports}
              formatDate={formatDate}
              formatLocationString={formatLocationString}
              onDelete={handleDeleteClick}
            />
          ) : (
            <CrimeReportListView
              reports={crimeReports}
              expandedRow={expandedRow}
              formatDate={formatDate}
              formatLocationString={formatLocationString}
              onDelete={handleDeleteClick}
              onToggleExpand={toggleRowExpansion}
            />
          )}
        </>
      )}

      {/* Pagination... (keep as is) */}
      {!isLoading && totalPages > 1 && (
         <div className="flex flex-wrap justify-center items-center mt-8 space-x-1 space-y-1">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="back"
            className={`${currentPage === 1 ? "cursor-not-allowed" : ""}`}
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              variant={currentPage === i + 1 ? 'primary' : 'outline'}
              className={`${currentPage === i + 1 ? "font-bold" : "bg-white"}`}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="secondary"
             className={`${currentPage === totalPages ? "cursor-not-allowed" : ""}`}
          >
            Next
          </Button>
        </div>
       )}

      {/* Delete Confirmation Modal... (keep as is) */}
      {isDeleteModalOpen && currentReport && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 p-3 rounded-full mb-4">
                <FaTrash className="text-red-500 text-2xl" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Crime Report?
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                You are about to delete report ID: <strong>{currentReport.crime_id}</strong>.
                <br />
                This action cannot be undone. Are you sure?
              </p>
              <div className="flex justify-center space-x-3 w-full">
                <Button variant="back" onClick={() => { setIsDeleteModalOpen(false); setCurrentReport(null); }} className="flex-1">
                  Cancel
                </Button>
                <Button variant="delete" onClick={handleDeleteConfirm} isLoading={isLoading} className="flex-1">
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
       )}

    </div>
  );
}
