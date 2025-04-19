// src/app/components/ReportGridView.tsx
import React from 'react';
import Link from 'next/link'; // Import Link
import { FaEdit, FaTrash } from 'react-icons/fa';
// Adjust import path if CrimeReport is defined elsewhere
import { CrimeReport } from '../ui/admin/view-crime/page';

interface CrimeReportGridProps {
  reports: CrimeReport[];
  formatDate: (dateString: string | Date) => string;
  formatLocationString: (location: CrimeReport['location']) => string;
  // Removed onEdit prop
  onDelete: (report: CrimeReport) => void;
}

const CrimeReportGrid: React.FC<CrimeReportGridProps> = ({
  reports,
  formatDate,
  formatLocationString,
  // Removed onEdit from props
  onDelete,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reports.map((report) => (
        <div
          key={`grid-${report._id}`}
          className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col"
        >
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-lg font-bold text-gray-800 break-words">
              Crime ID: {report.crime_id}
            </h2>
          </div>
          <div className="text-sm text-gray-600 space-y-1 flex-grow mb-3">
            <p><strong>Date:</strong> {formatDate(report.date)}</p>
            <p><strong>Time:</strong> {report.time}</p>
            <p><strong>Day:</strong> {report.day_of_week}</p>
            <p><strong>Status:</strong> {report.case_status}</p>
            <p className="break-words"><strong>Location:</strong> {formatLocationString(report.location)}</p>
            <p className="break-words"><strong>Type:</strong> {report.crime_type.crime_type}</p>
          </div>
          <div className="mt-auto pt-3 border-t border-gray-200 flex justify-end space-x-3">
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
          </div>
        </div>
      ))}
    </div>
  );
};

export default CrimeReportGrid;
