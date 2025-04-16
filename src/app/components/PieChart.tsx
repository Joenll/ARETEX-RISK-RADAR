// src/app/components/PieChart.tsx
"use client";

import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Pie } from 'react-chartjs-2';
// Import icons for the counts
import { FaUserCheck, FaUserClock, FaUserTimes } from 'react-icons/fa';

// Register Chart.js elements
ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface PieChartProps {
  approvedCount: number | null;
  pendingCount: number | null;
  rejectedCount: number | null;
  isLoading: boolean;
  error: string | null;
}

const PieChart: React.FC<PieChartProps> = ({
  approvedCount,
  pendingCount,
  rejectedCount,
  isLoading,
  error
}) => {

  // --- Chart Data Configuration (remains the same) ---
  const chartData = {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [
      {
        label: '# of Users',
        data: [
            approvedCount ?? 0,
            pendingCount ?? 0,
            rejectedCount ?? 0
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)', // Greenish (Approved)
          'rgba(255, 206, 86, 0.6)', // Yellowish (Pending)
          'rgba(255, 99, 132, 0.6)',  // Reddish (Rejected)
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // --- Chart Options (remains the same) ---
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'User Status Distribution',
        font: {
            size: 16
        }
      },
      tooltip: {
        callbacks: {
            label: function(context: any) {
                let label = context.label || '';
                if (label) { label += ': '; }
                if (context.raw !== null) { label += context.raw; }
                return label;
            }
        }
      }
    },
  };

  // --- Helper to display count with loading/error ---
  const renderCount = (count: number | null, label: string, Icon: React.ElementType, color: string) => {
      if (isLoading) {
          return <div className="h-5 w-8 bg-gray-200 rounded animate-pulse"></div>;
      }
      if (error) {
          return <span className="text-red-500 text-xs">Error</span>;
      }
      return (
          <span className={`font-semibold ${color}`}>{count ?? '-'}</span>
      );
  }

  return (
    // Adjusted padding and structure
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col h-full min-h-[300px]"> {/* Increased min-height slightly */}
        {/* Chart Area */}
        <div className="relative w-full h-55 flex-shrink-0 mb-4"> {/* Adjusted height */}
            {isLoading && <div className="absolute inset-0 flex items-center justify-center text-gray-500">Loading Chart...</div>}
            {error && <div className="absolute inset-0 flex items-center justify-center text-red-500">Error loading chart data.</div>}
            {!isLoading && !error && (
                <Pie data={chartData} options={chartOptions} />
            )}
        </div>

        {/* Counts Area */}
        <div className="mt-auto border-t border-gray-200 pt-3 space-y-2 text-sm">
            <div className="flex justify-between items-center">
                <span className="flex items-center text-gray-600">
                    <FaUserCheck className="mr-2 text-green-500" /> Approved:
                </span>
                {renderCount(approvedCount, 'Approved', FaUserCheck, 'text-green-600')}
            </div>
            <div className="flex justify-between items-center">
                <span className="flex items-center text-gray-600">
                    <FaUserClock className="mr-2 text-yellow-500" /> Pending:
                </span>
                {renderCount(pendingCount, 'Pending', FaUserClock, 'text-yellow-600')}
            </div>
            <div className="flex justify-between items-center">
                <span className="flex items-center text-gray-600">
                    <FaUserTimes className="mr-2 text-red-500" /> Rejected:
                </span>
                {renderCount(rejectedCount, 'Rejected', FaUserTimes, 'text-red-600')}
            </div>
        </div>
    </div>
  );
};

export default PieChart;
