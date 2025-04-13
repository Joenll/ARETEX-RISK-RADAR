"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Debounce function (Keep as is)
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


interface CrimeReport {
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
  const [crimeReports, setCrimeReports] = useState<CrimeReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(12);
  const [totalReports, setTotalReports] = useState(0);
  // Filters
  const [filterCaseStatus, setFilterCaseStatus] = useState("");
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  // Crime Type Search
  const [searchCrimeType, setSearchCrimeType] = useState("");
  const [debouncedCrimeTypeSearchTerm, setDebouncedCrimeTypeSearchTerm] = useState("");
  // Location Search (NEW)
  const [searchLocation, setSearchLocation] = useState("");
  const [debouncedLocationSearchTerm, setDebouncedLocationSearchTerm] = useState("");


  const fetchCrimeReports = useCallback(async () => {
    console.log(`Fetching with Crime Type: "${debouncedCrimeTypeSearchTerm}", Location: "${debouncedLocationSearchTerm}"`);

    setIsLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * reportsPerPage;
      let url = `/api/crime-reports?limit=${reportsPerPage}&skip=${skip}`;

      // Append Filters
      if (filterCaseStatus) url += `&case_status=${filterCaseStatus}`;
      if (filterStartDate) url += `&start_date=${filterStartDate.toISOString()}`;
      if (filterEndDate) url += `&end_date=${filterEndDate.toISOString()}`;

      // Append Search Terms
      if (debouncedCrimeTypeSearchTerm) {
        url += `&search_crime_type=${encodeURIComponent(debouncedCrimeTypeSearchTerm)}`;
      }
      // NEW: Append Location Search Term
      if (debouncedLocationSearchTerm) {
        url += `&search_location=${encodeURIComponent(debouncedLocationSearchTerm)}`;
      }

      console.log("Fetching URL:", url);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
    } finally {
      setIsLoading(false);
    }
  }, [
      currentPage,
      reportsPerPage,
      filterCaseStatus,
      filterStartDate,
      filterEndDate,
      debouncedCrimeTypeSearchTerm,
      debouncedLocationSearchTerm // NEW: Add location search term dependency
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

  // NEW: Debounced handler for location search
  const debouncedUpdateLocationSearch = useRef(
    debounce((value: string) => {
      setDebouncedLocationSearchTerm(value);
      setCurrentPage(1);
    }, 500) // Use same debounce delay
  ).current;

  // --- Input Change Handlers ---
  const handleCrimeTypeSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchCrimeType(value);
    debouncedUpdateCrimeTypeSearch(value);
  };

  // NEW: Handler for location search input
  const handleLocationSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchLocation(value);
    debouncedUpdateLocationSearch(value);
  };


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
    setSearchLocation(""); // NEW: Clear location search input
    setDebouncedLocationSearchTerm(""); // NEW: Clear debounced location term
    setCurrentPage(1);
  };



  // --- Handlers (Keep handleDelete, handlePageChange, filter changes, search changes, clear filters) ---
  const handleDelete = async (id: string, crimeIdentifier: string) => { // Added identifier parameter
    // Show confirmation dialog
    if (window.confirm(`Are you sure you want to delete crime report "${crimeIdentifier}"? This action cannot be undone.`)) {
      try {
        const response = await fetch(`/api/crime-reports/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        alert("Crime report deleted successfully!"); // Consider using better feedback than alert
        // Refetch data OR remove from local state
        setCrimeReports(prev => prev.filter(report => report._id !== id));
        // Adjust total reports count if necessary or refetch
        setTotalReports(prev => prev - 1);

      } catch (err: any) {
         console.error("Delete Error:", err);
         alert(`Error deleting report: ${err.message}`); // Consider using better feedback
         // Update error state if needed
         // setError(err.message);
      }
    }
  };




    // --- UI Rendering ---
    const totalPages = Math.ceil(totalReports / reportsPerPage);

    if (error) {
      // Display error state more prominently if needed
      return (
          <div className="p-4 text-center text-red-500 bg-red-100 border border-red-400 rounded-md">
              <p><strong>Error loading reports:</strong></p>
              <p>{error}</p>
              <button
                  onClick={fetchCrimeReports} // Add a retry button
                  className="mt-2 px-3 py-1 border rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                  Retry
              </button>
          </div>
      );
    }
  
    return (
      // Add overflow-hidden to prevent its content from visually spilling out
      // Keep w-full
      <div className="max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Crime Reports</h2>
  
        {/* Filters & Search */}
        {/* Added min-w-0 to allow flex items to shrink below content size if needed */}
        <div className="mb-6 p-4 rounded-lg shadow bg-white dark:bg-gray-800 flex flex-wrap gap-3 items-center">
           <input
            type="text"
            placeholder="Search Crime Types..."
            value={searchCrimeType}
            onChange={handleCrimeTypeSearchChange}
            className="border p-2 rounded bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 flex-grow sm:flex-grow-0 sm:w-40 min-w-0" // Added min-w-0
          />
          <input
            type="text"
            placeholder="Search Location..."
            value={searchLocation}
            onChange={handleLocationSearchChange}
            className="border p-2 rounded bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 flex-grow sm:flex-grow-0 sm:w-40 min-w-0" // Added min-w-0
          />
  
           <select
            value={filterCaseStatus}
            onChange={handleCaseStatusChange}
            className="border p-2 rounded bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 min-w-0" // Added min-w-0
          >
            <option value="">All Statuses</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Resolved">Resolved</option>
            <option value="Pending">Pending</option>
          </select>
  
          {/* Date Pickers - Ensure wrapper allows shrinking */}
          <div className="react-datepicker-wrapper min-w-0"> {/* Added min-w-0 */}
              <DatePicker
              selected={filterStartDate}
              onChange={handleStartDateChange}
              placeholderText="Start Date"
              className="border p-2 rounded bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
              isClearable
              />
          </div>
          <div className="react-datepicker-wrapper min-w-0"> {/* Added min-w-0 */}
              <DatePicker
              selected={filterEndDate}
              onChange={handleEndDateChange}
              placeholderText="End Date"
              className="border p-2 rounded bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
              isClearable
              />
          </div>
  
          <button
            onClick={handleClearFilters}
            className="border p-2 rounded bg-gray-600 text-white hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500"
          >
            Clear Filters
          </button>
        </div>
  
        {/* Conditional Rendering for Loading/No Results/Results */}
        {isLoading ? (
           <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
           </div>
        ) : crimeReports.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              No crime reports found matching your criteria.
          </div>
        ) : (
          // Grid display - This should handle responsiveness well
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {crimeReports.map((report) => (
               <div
                key={report._id}
                className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex flex-col"
              >
                {/* Card content */}
                <h3 className="font-semibold text-lg mb-2 border-b dark:border-gray-600 pb-1 break-words"> {/* Added break-words */}
                  ID: {report.crime_id}
                </h3>
                <div className="text-sm space-y-1 flex-grow mb-3">
                    <p><strong>Date:</strong> {new Date(report.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {report.time}</p>
                    <p><strong>Day:</strong> {report.day_of_week}</p>
                    <p><strong>Status:</strong> {report.case_status}</p>
                    <p className="break-words">
                      <strong>Location:</strong>{" "}
                      {[
                        report.location.house_building_number,
                        report.location.street_name,
                        report.location.purok_block_lot,
                        report.location.barangay,
                        report.location.municipality_city,
                        report.location.province,
                        report.location.region,
                      ].filter(Boolean).join(", ")}
                    </p>
                    <p className="break-words"><strong>Type:</strong> {report.crime_type.crime_type}</p> {/* Added break-words */}
                </div>
                {/* Action Buttons */}
                <div className="mt-auto pt-3 border-t dark:border-gray-600 flex justify-end gap-3">
                  <Link
                    href={`/ui/admin/edit-crime/${report._id}`}
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(report._id, report.crime_id || report._id)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
  
        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-6 overflow-x-auto w-full space-x-1 ">
             <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1 border rounded bg-white dark:bg-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 border rounded mb-2  ${
                  page === currentPage
                    ? "font-bold bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
              >
                {page}
              </button>
            ))}
            <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 border rounded bg-white dark:bg-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
          </div>
        )}
      </div>
    );
  }