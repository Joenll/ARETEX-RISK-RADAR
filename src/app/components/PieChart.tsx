// src/app/components/PieChart.tsx
"use client";

import React, { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title, ChartData, ChartOptions } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { FaUserCheck, FaUserClock, FaUserTimes } from 'react-icons/fa';

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

  // --- Chart Data Configuration (Darker Colors) ---
  const chartData = useMemo((): ChartData<'pie'> => ({
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
          'rgba(30, 136, 229, 0.6)', // Darker Blue
          'rgba(251, 140, 0, 0.6)',  // Darker Orange
          'rgba(239, 83, 80, 0.6)',   // Darker Red
        ],
        borderColor: [
          'rgba(30, 136, 229, 1)',   // Darker Blue Border
          'rgba(251, 140, 0, 1)',    // Darker Orange Border
          'rgba(239, 83, 80, 1)',    // Darker Red Border
        ],
        borderWidth: 1,
      },
    ],
  }), [approvedCount, pendingCount, rejectedCount]);

  // --- Chart Options (remain the same) ---
  const chartOptions: ChartOptions<'pie'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
            color: '#374151'
        }
      },
      title: {
        display: true,
        text: 'User Status Distribution',
        color: '#1f2937',
        font: {
            size: 16,
            weight: 600
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        titleColor: '#f9fafb',
        bodyColor: '#f9fafb',
        callbacks: {
            label: function(context: any) {
                let label = context.label || '';
                if (label) { label += ': '; }
                if (context.raw !== null && context.raw !== undefined) {
                    label += context.raw;
                }
                return label;
            }
        }
      }
    },
  }), []);

  // --- Helper to display count (remains the same) ---
  const renderCount = (count: number | null, label: string, Icon: React.ElementType, color: string) => {
      if (isLoading) {
          return <div className="h-5 w-8 bg-gray-200 rounded animate-pulse"></div>;
      }
      if (error) {
          return <span className="text-red-500 text-xs font-semibold">Err</span>;
      }
      return (
          <span className={`font-semibold ${color}`}>{count ?? '-'}</span>
      );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col h-full min-h-[300px]">
        {/* Chart Area */}
        <div className="relative w-full h-52 md:h-56 flex-shrink-0 mb-4">
            {isLoading && <div className="absolute inset-0 flex items-center justify-center text-gray-500">Loading Chart...</div>}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 p-4 text-center">
                    <p className='font-semibold'>Error Loading Chart</p>
                    <p className='text-xs'>{error}</p>
                </div>
            )}
            {!isLoading && !error && (approvedCount !== null || pendingCount !== null || rejectedCount !== null) && (
                <Pie data={chartData} options={chartOptions} />
            )}
             {!isLoading && !error && approvedCount === 0 && pendingCount === 0 && rejectedCount === 0 && (
                 <div className="absolute inset-0 flex items-center justify-center text-gray-500">No user data available.</div>
             )}
        </div>

        {/* Counts Area - Updated icon/text colors to match darker theme */}
        <div className="mt-auto border-t border-gray-200 pt-3 space-y-2 text-sm">
            <div className="flex justify-between items-center">
                <span className="flex items-center text-gray-600">
                    {/* Use a slightly darker blue icon */}
                    <FaUserCheck className="mr-2 text-blue-400" /> Approved:
                </span>
                {/* Use a slightly darker blue text */}
                {renderCount(approvedCount, 'Approved', FaUserCheck, 'text-blue-700')}
            </div>
            <div className="flex justify-between items-center">
                <span className="flex items-center text-gray-600">
                     {/* Use a slightly darker orange icon */}
                    <FaUserClock className="mr-2 text-orange-300" /> Pending:
                </span>
                 {/* Use a slightly darker orange text */}
                {renderCount(pendingCount, 'Pending', FaUserClock, 'text-orange-700')}
            </div>
            <div className="flex justify-between items-center">
                <span className="flex items-center text-gray-600">
                    {/* Use a slightly darker red icon */}
                    <FaUserTimes className="mr-2 text-red-400" /> Rejected:
                </span>
                {/* Use a slightly darker red text */}
                {renderCount(rejectedCount, 'Rejected', FaUserTimes, 'text-red-700')}
            </div>
        </div>
    </div>
  );
};

export default PieChart;
