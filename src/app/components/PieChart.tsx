// src/app/components/PieChart.tsx
"use client";

import React, { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title, ChartData, ChartOptions, TooltipItem } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { FaUserCheck, FaUserClock, FaUserTimes } from 'react-icons/fa';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Import the plugin

// Register core elements AND the datalabels plugin
ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels);

interface PieChartProps {
  approvedCount: number | null;
  pendingCount: number | null;
  rejectedCount: number | null;
  isLoading: boolean;
  error: string | null;
}

// Centralized Colors (consider adjusting opacity/shades if needed)
const pieChartColors = {
  approved: {
    bg: 'rgba(30, 136, 229, 0.75)', // Slightly more opaque
    border: 'rgb(30, 136, 229)',
    hoverBg: 'rgba(25, 118, 210, 0.9)', // Darker/more opaque on hover
    icon: 'text-blue-500',
    text: 'text-blue-700',
  },
  pending: {
    bg: 'rgba(251, 140, 0, 0.75)',
    border: 'rgb(251, 140, 0)',
    hoverBg: 'rgba(245, 124, 0, 0.9)',
    icon: 'text-orange-500',
    text: 'text-orange-700',
  },
  rejected: {
    bg: 'rgba(239, 83, 80, 0.75)',
    border: 'rgb(239, 83, 80)',
    hoverBg: 'rgba(229, 57, 53, 0.9)',
    icon: 'text-red-500',
    text: 'text-red-700',
  },
  // General UI colors
  tooltipBg: 'rgba(17, 24, 39, 0.85)',
  tooltipText: '#f9fafb',
  titleText: '#1f2937',
  legendText: '#374151',
  dataLabelText: '#ffffff', // Color for labels on slices
};

const PieChart: React.FC<PieChartProps> = ({
  approvedCount,
  pendingCount,
  rejectedCount,
  isLoading,
  error
}) => {

  // Calculate total (still needed for hasData check, but not for labels/tooltips)
  const totalCount = useMemo(() => {
    return (approvedCount ?? 0) + (pendingCount ?? 0) + (rejectedCount ?? 0);
  }, [approvedCount, pendingCount, rejectedCount]);

  // Chart Data Configuration
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
          pieChartColors.approved.bg,
          pieChartColors.pending.bg,
          pieChartColors.rejected.bg,
        ],
        borderColor: [
          pieChartColors.approved.border,
          pieChartColors.pending.border,
          pieChartColors.rejected.border,
        ],
        hoverBackgroundColor: [
          pieChartColors.approved.hoverBg,
          pieChartColors.pending.hoverBg,
          pieChartColors.rejected.hoverBg,
        ],
        hoverBorderWidth: 1,
        hoverOffset: 8,
        borderWidth: 1.5,
      },
    ],
  }), [approvedCount, pendingCount, rejectedCount]);

  // Chart Options
  const chartOptions: ChartOptions<'pie'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
            color: pieChartColors.legendText,
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
        }
      },
      title: {
        display: true,
        text: 'User Status Distribution',
        color: pieChartColors.titleText,
        font: {
            size: 16,
            weight: 'bold' // Changed to bold for consistency
        },
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        backgroundColor: pieChartColors.tooltipBg,
        titleColor: pieChartColors.tooltipText,
        bodyColor: pieChartColors.tooltipText,
        padding: 10,
        cornerRadius: 6,
        callbacks: {
            // --- UPDATED: Tooltip Label Callback ---
            label: function(context: TooltipItem<'pie'>) {
                const label = context.label || '';
                const value = typeof context.raw === 'number' ? context.raw : 0;
                // Removed percentage calculation
                return `${label}: ${value}`; // Show only label and count
            }
            // --- End Updated Callback ---
        }
      },
      datalabels: {
        display: (context) => {
            const value = context.dataset.data[context.dataIndex] as number;
            return value > 0;
        },
        // --- UPDATED: Datalabels Formatter ---
        formatter: (value, context) => {
            // Removed percentage calculation
            return `${value}`; // Display only the raw value (count)
        },
        // --- End Updated Formatter ---
        color: pieChartColors.dataLabelText,
        font: {
            weight: 'bold',
            size: 12,
        },
      }
    },
    animation: {
        animateScale: true,
        animateRotate: true,
        duration: 500,
    },
    layout: {
        padding: {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10
        }
    }
  // Removed totalCount dependency as it's no longer needed for options
  }), []);

  // Helper to display count (remains the same)
  const renderCount = (count: number | null, colorClass: string) => {
      if (isLoading) {
          return <div className="h-5 w-8 bg-gray-200 rounded animate-pulse"></div>;
      }
      if (error) {
          return <span className="text-red-500 text-xs font-semibold">Err</span>;
      }
      return (
          <span className={`font-semibold ${colorClass}`}>{count ?? '-'}</span>
      );
  }

  // Check if there's any data to display (uses totalCount)
  const hasData = totalCount > 0;

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col h-full min-h-[350px]">
        {/* Chart Area */}
        <div className="relative w-full h-60 md:h-64 flex-shrink-0 mb-2">
            {isLoading && <div className="absolute inset-0 flex items-center justify-center text-gray-500">Loading Chart...</div>}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 p-4 text-center">
                    <p className='font-semibold'>Error Loading Chart</p>
                    <p className='text-xs'>{error}</p>
                </div>
            )}
            {!isLoading && !error && hasData && (
                <Pie data={chartData} options={chartOptions} />
            )}
             {!isLoading && !error && !hasData && (
                 <div className="absolute inset-0 flex items-center justify-center text-gray-500">No user data available.</div>
             )}
        </div>

        {/* Counts Area */}
        <div className="mt-auto border-t border-gray-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between items-center">
                <span className="flex items-center text-gray-600">
                    <FaUserCheck className={`mr-2 ${pieChartColors.approved.icon}`} /> Approved:
                </span>
                {renderCount(approvedCount, pieChartColors.approved.text)}
            </div>
            <div className="flex justify-between items-center">
                <span className="flex items-center text-gray-600">
                    <FaUserClock className={`mr-2 ${pieChartColors.pending.icon}`} /> Pending:
                </span>
                {renderCount(pendingCount, pieChartColors.pending.text)}
            </div>
            <div className="flex justify-between items-center">
                <span className="flex items-center text-gray-600">
                    <FaUserTimes className={`mr-2 ${pieChartColors.rejected.icon}`} /> Rejected:
                </span>
                {renderCount(rejectedCount, pieChartColors.rejected.text)}
            </div>
        </div>
    </div>
  );
};

export default PieChart;
