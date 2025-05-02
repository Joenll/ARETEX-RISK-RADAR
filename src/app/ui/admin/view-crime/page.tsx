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
  FaShareSquare,
  FaFileImport,
  FaSearch, // Added search icon
} from "react-icons/fa";
import Button from "@/app/components/Button";
import CrimeReportGrid from "@/app/components/ReportGridView";
import CrimeReportListView from "@/app/components/ReportListView";

// Debounce function...
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

// formatDate function...
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

// CrimeReport interface...
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

// --- NEW: Define Search Field Options ---
const searchFieldOptions = [
    { value: 'crime_id', label: 'Crime ID' },
    { value: 'crime_type', label: 'Crime Type' },
    { value: 'location', label: 'Location' },
    // Add more fields if needed and supported by the API
] as const; // Use 'as const' for better type inference

type SearchFieldType = typeof searchFieldOptions[number]['value'];

// --- Pagination Helper Function ---
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

  if (currentPage - halfVisible <= firstPage) {
      endPage = firstPage + maxVisiblePages - 2;
  }
  if (currentPage + halfVisible >= lastPage) {
      startPage = lastPage - maxVisiblePages + 2;
  }

  if (startPage > firstPage + 1) {
      items.push('...');
  }

  for (let i = startPage; i <= endPage; i++) {
      items.push(i);
  }

  if (endPage < lastPage - 1) {
      items.push('...');
  }

  items.push(lastPage);

  return items;
};
// --- END Pagination Helper ---


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

  // --- UPDATED: Unified Search State ---
  const [searchField, setSearchField] = useState<SearchFieldType>('crime_id'); // Default search field
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  // --- END UPDATED Search State ---

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<CrimeReport | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

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

      // --- UPDATED: Use unified search term and field ---
      if (debouncedSearchTerm) {
        // Construct the correct query parameter based on the selected field
        const searchParamKey = `search_${searchField}`;
        url += `&${searchParamKey}=${encodeURIComponent(debouncedSearchTerm)}`;
      }
      // --- END UPDATED Search Logic ---

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
      // --- UPDATED: Dependencies for unified search ---
      searchField, debouncedSearchTerm
      // --- END UPDATED Dependencies ---
  ]);

  useEffect(() => {
    fetchCrimeReports();
  }, [fetchCrimeReports]);

  // --- UPDATED: Unified Debounced Handler ---
  const debouncedUpdateSearch = useRef(
    debounce((value: string) => {
      setDebouncedSearchTerm(value);
      setCurrentPage(1); // Reset page when search term changes
    }, 500) // 500ms delay
  ).current;
  // --- END UPDATED Debounced Handler ---

  // --- Input Change Handlers ---

  // --- NEW: Handler for Search Field Dropdown ---
  const handleSearchFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newField = e.target.value as SearchFieldType;
    setSearchField(newField);
    // Optionally clear search term when changing field, or keep it if desired
    // setSearchTerm("");
    // setDebouncedSearchTerm("");
    setCurrentPage(1); // Reset page when search field changes
  };

  // --- NEW: Handler for Unified Search Input ---
  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedUpdateSearch(value); // Call the unified debounced function
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
    // --- UPDATED: Reset unified search state ---
    setSearchField('crime_id'); // Reset to default field
    setSearchTerm("");
    setDebouncedSearchTerm("");
    // --- END UPDATED Reset ---
    setCurrentPage(1);
  };

  // --- View/Expansion Handlers ---
  const toggleRowExpansion = (index: number) => {
    setExpandedRow(prev => (prev === index ? null : index));
  };

  // --- Delete Handlers ---
  const handleDeleteClick = (report: CrimeReport) => {
    setCurrentReport(report);
    setIsDeleteModalOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (!currentReport) return;
    setIsLoading(true); // Consider setting loading state specific to delete action
    setIsDeleteModalOpen(false);
    try {
      const response = await fetch(`/api/crime-reports/${currentReport._id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      // Use a more user-friendly notification (e.g., SweetAlert or a toast)
      // alert("Crime report deleted successfully!");
      console.log("Crime report deleted successfully!"); // Keep console log for debugging
      setCurrentReport(null);
      // Re-fetch data or remove the item locally for faster UI update
      fetchCrimeReports();
    } catch (err: any) {
       console.error("Delete Error:", err);
       // Use a more user-friendly error display
       setError(`Error deleting report: ${err.message}`);
    } finally {
        setIsLoading(false); // Reset loading state
    }
  };

  // --- Close Export Dropdown ---
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

  // --- Export Handlers ---
  const handleExport = (format: 'excel' | 'pdf') => {
    setIsExporting(true);
    setError(null);
    console.log(`Exporting crime reports to ${format.toUpperCase()}...`);

    const baseUrl = '/api/crime-reports/export';
    const params = new URLSearchParams();

    params.append('format', format);

    // Add filter parameters
    if (filterCaseStatus) params.append('case_status', filterCaseStatus);
    if (filterStartDate) params.append('start_date', filterStartDate.toISOString().split('T')[0]);
    if (filterEndDate) params.append('end_date', filterEndDate.toISOString().split('T')[0]);

    // --- UPDATED: Add unified search term and field to Export ---
    if (debouncedSearchTerm) {
        const searchParamKey = `search_${searchField}`;
        params.append(searchParamKey, debouncedSearchTerm);
    }
    // --- END UPDATED Export Logic ---

    const exportUrl = `${baseUrl}?${params.toString()}`;
    console.log("Export URL:", exportUrl);

    // Trigger download
    window.location.href = exportUrl; // This works for GET requests resulting in file download

    setIsExportDropdownOpen(false);

    // Reset exporting state after a delay to allow download to start
    setTimeout(() => {
        setIsExporting(false);
    }, 3000); // Adjust delay if needed
  };

  const handleExportExcel = () => handleExport('excel');
  const handleExportPDF = () => handleExport('pdf');
  // --- END Export Handlers ---


  // --- UI Rendering ---
  const totalPages = Math.ceil(totalReports / reportsPerPage);
  const paginationItems = getPaginationItems(currentPage, totalPages);
  const currentSearchLabel = searchFieldOptions.find(opt => opt.value === searchField)?.label || 'Field';

  // formatLocationString function...
  const formatLocationString = (location: CrimeReport['location']): string => {
    // Simplified version for brevity
    return [
        location.house_building_number, location.street_name, location.purok_block_lot,
        location.barangay, location.municipality_city, location.province,
    ].filter(Boolean).join(", ");
  }

  // Error display...
  if (error && !isDeleteModalOpen) { // Avoid showing general error when delete modal is open
    return (
        <div className="bg-gray-50 p-8 font-sans min-h-screen">
            <div className="p-4 text-center text-red-500 bg-red-100 border border-red-400 rounded-md">
                <p><strong>Error:</strong> {error}</p>
                <button
                    onClick={() => { setError(null); fetchCrimeReports(); }} // Allow retry
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
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Crime Reports</h1>
          <p className="text-sm text-gray-500">Track crime incident records</p>
        </div>
        <div className="flex items-center gap-3">
            <Link href="/ui/admin/add-crime">
                <Button variant="primary" className="flex items-center">
                    <FaPlus className="mr-2" /> Insert Crime Data
                </Button>
            </Link>
            <Link href="/ui/admin/import-crime">
                <Button variant="secondary" className="flex items-center">
                    <FaFileImport className="mr-2" /> Import Reports
                </Button>
            </Link>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center mb-4 gap-3">
        {/* Filters and Search Section */}
        <div className="flex items-center space-x-2 flex-wrap gap-3 flex-grow"> {/* Added flex-grow */}

          {/* --- NEW: Unified Search Input with Dropdown --- */}
          <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
            {/* Search Field Dropdown */}
            <select
              value={searchField}
              onChange={handleSearchFieldChange}
              className="pl-3 pr-1 py-2 border-r border-gray-300 rounded-l-lg focus:outline-none bg-gray-50 text-gray-700 text-sm"
              disabled={isLoading}
              aria-label="Search field"
            >
              {searchFieldOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {/* Search Term Input */}
            <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400 h-4 w-4" />
                </span>
                <input
                type="text"
                placeholder={`Search by ${currentSearchLabel}...`}
                value={searchTerm}
                onChange={handleSearchTermChange}
                className="w-full pl-10 pr-4 py-2 border-none rounded-r-lg focus:outline-none text-gray-900 placeholder:text-gray-500" // Removed border, adjusted padding
                disabled={isLoading}
                aria-label="Search term"
                />
            </div>
          </div>
          {/* --- END Unified Search Input --- */}

          {/* Case Status Filter */}
          <select
            value={filterCaseStatus}
            onChange={handleCaseStatusChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            disabled={isLoading}
            aria-label="Filter by case status"
          >
             <option value="">All Statuses</option>
            <option value="Resolved">Resolved</option>
            <option value="Pending">Pending</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Closed">Closed</option>
            <option value="Open">Open</option>
          </select>

          {/* Date Pickers */}
          <div className="react-datepicker-wrapper">
             <DatePicker
                selected={filterStartDate}
                onChange={handleStartDateChange}
                placeholderText="Start Date"
                className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-[130px] text-gray-900 placeholder:text-gray-800"
                isClearable
                disabled={isLoading}
                aria-label="Filter start date"
              />
          </div>
          <div className="react-datepicker-wrapper">
             <DatePicker
                selected={filterEndDate}
                onChange={handleEndDateChange}
                placeholderText="End Date"
                className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-[130px] text-gray-900 placeholder:text-gray-800"
                isClearable
                disabled={isLoading}
                aria-label="Filter end date"
              />
          </div>

          {/* Clear Button */}
          <Button variant="secondary" onClick={handleClearFilters} disabled={isLoading}>Clear Filters</Button>

        </div> {/* End Filters and Search Section */}

        {/* Action Buttons Section */}
        <div className="flex items-center gap-3">
            {/* Export Button & Dropdown */}
            <div className="relative" ref={exportDropdownRef}>
                <button
                    onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                    className={`flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg shadow-sm hover:bg-blue-200 transition-colors ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isExporting || isLoading}
                    aria-haspopup="true"
                    aria-expanded={isExportDropdownOpen}
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
                    <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-48 z-20"> {/* Increased z-index */}
                        <ul className="py-1">
                            <li>
                                <button
                                    className="w-full flex items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-orange-500 transition-colors"
                                    onClick={handleExportExcel}
                                >
                                    <img src="/excel.png" alt="" className="w-4 h-4 mr-2" /> {/* Alt text empty for decorative icon */}
                                    Export to Excel
                                </button>
                            </li>
                            <li>
                                <button
                                    className="w-full flex items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-orange-500 transition-colors"
                                    onClick={handleExportPDF}
                                >
                                    <img src="/pdf.png" alt="" className="w-4 h-4 mr-2" /> {/* Alt text empty for decorative icon */}
                                    Export to PDF
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>

            {/* View Mode Dropdown */}
            <div className="relative">
                <button
                onClick={() => setIsViewDropdownOpen((prev) => !prev)}
                className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                    isViewDropdownOpen
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                disabled={isLoading}
                aria-haspopup="true"
                aria-expanded={isViewDropdownOpen}
                >
                View
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-2 transition-transform ${isViewDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                </button>
                {isViewDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20"> {/* Increased z-index */}
                    <ul className="py-1">
                        <li>
                            <button
                            className={`w-full px-4 py-2 text-left text-sm flex items-center ${viewMode === 'grid' ? 'font-semibold text-orange-600 bg-gray-100' : 'text-gray-700 hover:text-orange-500 hover:bg-gray-100'}`}
                            onClick={() => { setViewMode("grid"); setIsViewDropdownOpen(false); }}
                            disabled={viewMode === 'grid'}
                            >
                            <FaThLarge className="mr-2 text-gray-500" /> Grid View
                            </button>
                        </li>
                        <li>
                            <button
                            className={`w-full px-4 py-2 text-left text-sm flex items-center ${viewMode === 'list' ? 'font-semibold text-orange-600 bg-gray-100' : 'text-gray-700 hover:text-orange-500 hover:bg-gray-100'}`}
                            onClick={() => { setViewMode("list"); setIsViewDropdownOpen(false); }}
                            disabled={viewMode === 'list'}
                            >
                            <FaList className="mr-2 text-gray-500" /> List View
                            </button>
                        </li>
                    </ul>
                </div>
                )}
            </div>
        </div> {/* End Action Buttons Section */}

      </div> {/* End Toolbar */}

      {/* Loading Indicator... */}
      {isLoading && (
         <div className="flex justify-center items-center py-10" aria-live="polite">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            <span className="sr-only">Loading crime reports...</span>
         </div>
      )}

      {/* No Results Message... */}
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

      {/* Pagination... */}
      {!isLoading && totalPages > 1 && (
         <nav aria-label="Crime report pagination" className="flex flex-wrap justify-center items-center mt-8 space-x-1 space-y-1">
          {/* Previous Button */}
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="back"
            className={`${currentPage === 1 ? "cursor-not-allowed opacity-50" : ""}`}
            aria-disabled={currentPage === 1}
          >
            Previous
          </Button>

          {/* Dynamic Page Buttons */}
          {paginationItems.map((item, index) =>
            item === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-500" aria-hidden="true">...</span>
            ) : (
              <Button
                key={item}
                onClick={() => handlePageChange(item)}
                variant={currentPage === item ? 'primary' : 'outline'}
                className={`${currentPage === item ? "font-bold" : "bg-white"}`}
                aria-current={currentPage === item ? 'page' : undefined}
              >
                <span className="sr-only">Page </span>{item}
              </Button>
            )
          )}

          {/* Next Button */}
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="secondary"
             className={`${currentPage === totalPages ? "cursor-not-allowed opacity-50" : ""}`}
             aria-disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </nav>
       )}

      {/* Delete Confirmation Modal... */}
      {isDeleteModalOpen && currentReport && (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="deleteModalTitle">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 p-3 rounded-full mb-4">
                <FaTrash className="text-red-500 text-2xl" aria-hidden="true" />
              </div>
              <h2 id="deleteModalTitle" className="text-lg font-semibold text-gray-900 mb-2">
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
                {/* Consider adding aria-describedby to the delete button pointing to the description paragraph */}
                <Button variant="delete" onClick={handleDeleteConfirm} isLoading={isLoading} className="flex-1">
                  {isLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        </div>
       )}

    </div>
  );
}
