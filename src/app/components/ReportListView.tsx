// src/app/components/ReportListView.tsx
import React from 'react';
import Link from 'next/link'; // Import Link
import { FaEdit, FaTrash, FaChevronUp, FaChevronDown } from 'react-icons/fa';
// Adjust import path if CrimeReport is defined elsewhere
import { CrimeReport } from '../ui/admin/view-crime/page';

interface CrimeReportListViewProps {
  reports: CrimeReport[];
  expandedRow: number | null;
  formatDate: (dateString: string | Date) => string;
  formatLocationString: (location: CrimeReport['location']) => string;
  // Removed onEdit prop
  onDelete: (report: CrimeReport) => void;
  onToggleExpand: (index: number) => void;
}

const CrimeReportListView: React.FC<CrimeReportListViewProps> = ({
  reports,
  expandedRow,
  formatDate,
  formatLocationString,
  // Removed onEdit from props
  onDelete,
  onToggleExpand,
}) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
      {/* Table Header */}
      <div className="bg-gray-100 border-b border-gray-200 hidden md:block">
        <div className="flex items-center py-2 px-4 font-medium text-gray-600 text-sm">
          <div className="w-20 flex-shrink-0">Crime ID</div>
          <div className="w-48 flex-shrink-0">Type</div>
          <div className="w-32 flex-shrink-0">Date</div>
          <div className="w-24 flex-shrink-0">Time</div>
          <div className="flex-grow min-w-[150px]">Location</div>
          <div className="w-28 flex-shrink-0 text-center">Actions</div>
        </div>
      </div>
      {/* Table Body */}
      <div className="w-full">
        {reports.map((report, index) => (
          <div
            key={`list-${report._id}`}
            className="border-b border-gray-200 last:border-b-0"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center py-3 px-4 hover:bg-gray-50 cursor-pointer gap-2 md:gap-0">
              {/* Data cells */}
              <div className="w-full md:w-20 flex-shrink-0 font-semibold text-gray-700">
                 <span className="md:hidden font-normal text-gray-500">ID: </span>
                 {report.crime_id}
              </div>
              <div className="w-full md:w-48 flex-shrink-0 font-semibold text-gray-700">
                 <span className="md:hidden font-normal text-gray-500">Type: </span>
                 {report.crime_type.crime_type}
              </div>
              <div className="w-full md:w-32 flex-shrink-0 text-gray-600 text-sm">
                 <span className="md:hidden font-normal text-gray-500">Date: </span>
                 {formatDate(report.date)}
              </div>
              <div className="w-full md:w-24 flex-shrink-0 text-gray-600 text-sm">
                 <span className="md:hidden font-normal text-gray-500">Time: </span>
                 {report.time}
              </div>
              <div className="w-full md:flex-grow min-w-[150px] text-gray-600 text-sm break-words">
                 <span className="md:hidden font-normal text-gray-500">Location: </span>
                 {formatLocationString(report.location)}
              </div>
              {/* Actions */}
              <div className="w-full md:w-28 flex-shrink-0 flex items-center justify-start md:justify-end space-x-3 mt-2 md:mt-0">
                {/* Replaced button with Link */}
                <Link
                  href={`/ui/admin/edit-crime/${report._id}`}
                  title="Edit"
                  className="text-blue-500 hover:text-blue-600"
                >
                  <FaEdit />
                </Link>
                <button
                  type="button"
                  title="Delete"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => onDelete(report)}
                >
                  <FaTrash />
                </button>
                <button
                  onClick={() => onToggleExpand(index)}
                  className="text-gray-500 hover:text-gray-700"
                  title={expandedRow === index ? "Collapse" : "Expand"}
                >
                  {expandedRow === index ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
            </div>

            {/* Expanded details */}
            {expandedRow === index && (
              <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 text-sm">
                {/* Added text-gray-900 to the data parts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                  <div><span className="font-medium text-gray-700">Day:</span> <span className="text-gray-900">{report.day_of_week}</span></div>
                  <div><span className="font-medium text-gray-700">Status:</span> <span className="text-gray-900">{report.case_status}</span></div>
                  <div><span className="font-medium text-gray-700">Event Proximity:</span> <span className="text-gray-900">{report.event_proximity}</span></div>
                  <div><span className="font-medium text-gray-700">Occurred:</span> <span className="text-gray-900">{report.crime_occurred_indoors_or_outdoors}</span></div>
                  <div><span className="font-medium text-gray-700">Category:</span> <span className="text-gray-900">{report.crime_type.crime_type_category}</span></div>
                  <div><span className="font-medium text-gray-700">Coordinates:</span> <span className="text-gray-900">{report.location.latitude?.toFixed(6)}, {report.location.longitude?.toFixed(6)}</span></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CrimeReportListView;
