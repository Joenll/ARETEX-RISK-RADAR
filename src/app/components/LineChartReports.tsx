"use client";

import React, { useMemo, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
  TooltipItem // Import TooltipItem type
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Define data point structures
interface ReportDataPointDaily {
  date: string; // Expecting "YYYY-MM-DD"
  count: number;
}
interface ReportDataPointWeekly {
  week: string; // Expecting "YYYY-WW" (ISO Week)
  count: number;
}
interface ReportDataPointMonthly {
  month: string; // Expecting "YYYY-MM"
  count: number;
}
interface ReportDataPointYearly {
  year: number;
  count: number;
}

// Union type for data prop
type ReportDataPoint =
  | ReportDataPointDaily
  | ReportDataPointWeekly
  | ReportDataPointMonthly
  | ReportDataPointYearly;
// Type for dataType prop
type TrendType = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface LineChartReportsProps {
  data: ReportDataPoint[];
  isLoading: boolean;
  error: string | null;
  dataType: TrendType;
  timePeriodDays?: number; // Used only for 'daily' type
}

// --- Helper Functions for Label Formatting ---
const generateDateRange = (days: number): string[] => {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    dates.push(`${year}-${month}-${day}`); // Keep in "YYYY-MM-DD" format
  }
  return dates.reverse(); // Return in chronological order
};

// Formats "YYYY-MM-DD" to "Mmm D" (e.g., "Jan 5")
const formatDisplayDateDaily = (dateStr: string): string => {
  try {
    // Add time component to avoid potential timezone issues with just date string
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    console.error("Error formatting daily date:", dateStr, e);
    return dateStr; // Fallback
  }
};

// Formats "YYYY-MM" to "Mmm YYYY" (e.g., "Jan 2024")
const formatDisplayDateMonthly = (monthStr: string): string => {
  try {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1); // Day 1 of the month
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  } catch (e) {
    console.error("Error formatting monthly date:", monthStr, e);
    return monthStr; // Fallback
  }
};

// Formats "YYYY-WW" to "Mmm Wk X, YYYY" (e.g., "Jan Wk 1, 2024")
const formatDisplayDateWeekly = (weekStr: string): string => {
  try {
    const [yearStr, weekStrNum] = weekStr.split('-');
    const year = parseInt(yearStr);
    const week = parseInt(weekStrNum);

    if (isNaN(year) || isNaN(week)) throw new Error("Invalid year or week number");

    // Calculate the start date of the week
    const jan4 = new Date(year, 0, 4);
    const jan4DayOfWeek = jan4.getDay() || 7; // Adjust Sunday to 7
    const mondayOfWeek1 = new Date(year, 0, 4 - (jan4DayOfWeek - 1));
    const weekStartDate = new Date(mondayOfWeek1);
    weekStartDate.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);

    // Get the month and calculate the week of the month
    const monthName = weekStartDate.toLocaleDateString(undefined, { month: 'short' });
    const firstDayOfMonth = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), 1);
    const weekOfMonth = Math.ceil((weekStartDate.getDate() + firstDayOfMonth.getDay()) / 7);

    return `${monthName} Wk ${weekOfMonth}, ${year}`; // e.g., "Jan Wk 1, 2024"
  } catch (e) {
    console.error("Error formatting weekly date:", weekStr, e);
    return weekStr; // Fallback
  }
};

const LineChartReports: React.FC<LineChartReportsProps> = ({
  data,
  isLoading,
  error,
  dataType,
  timePeriodDays = 7, // Default to 7 days for daily view
}) => {
  // Dynamically import and register the zoom plugin on the client side
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const zoomPlugin = (await import('chartjs-plugin-zoom')).default;
        // Check if already registered to avoid warnings, though Chart.js handles it
        if (isMounted && !ChartJS.registry.plugins.get(zoomPlugin.id)) {
          ChartJS.register(zoomPlugin);
          // Force chart re-render after plugin registration if needed,
          // though usually happens automatically on data/options change.
        }
      } catch (e) {
        console.error("Failed to load or register chartjs-plugin-zoom:", e);
      }
    })();
    return () => { isMounted = false; }; // Cleanup
  }, []);

  // Prepare data for Chart.js based on dataType
  const chartData = useMemo((): ChartData<'line'> => {
    let labels: string[] = [];
    let reportCounts: number[] = [];

    // Type guard functions
    const isDaily = (item: ReportDataPoint): item is ReportDataPointDaily =>
      dataType === 'daily' && typeof (item as any)?.date === 'string';
    const isWeekly = (item: ReportDataPoint): item is ReportDataPointWeekly =>
      dataType === 'weekly' && typeof (item as any)?.week === 'string';
    const isMonthly = (item: ReportDataPoint): item is ReportDataPointMonthly =>
      dataType === 'monthly' && typeof (item as any)?.month === 'string';
    const isYearly = (item: ReportDataPoint): item is ReportDataPointYearly =>
      dataType === 'yearly' && typeof (item as any)?.year === 'number';

    // Filter and Sort data chronologically based on the CURRENT dataType
    const filteredAndSortedData = (data || [])
      .filter((item): item is ReportDataPoint => { // Ensure item is of type ReportDataPoint
        switch (dataType) {
          case 'daily': return isDaily(item);
          case 'weekly': return isWeekly(item);
          case 'monthly': return isMonthly(item);
          case 'yearly': return isYearly(item);
          default: return false;
        }
      })
      .sort((a, b) => {
        // Provide robust sorting for each type
        if (isYearly(a) && isYearly(b)) return a.year - b.year;
        if (isMonthly(a) && isMonthly(b)) return a.month.localeCompare(b.month);
        if (isWeekly(a) && isWeekly(b)) return a.week.localeCompare(b.week);
        if (isDaily(a) && isDaily(b)) return a.date.localeCompare(b.date);
        return 0; // Should not happen if filtered correctly
      });

    // Populate labels and reportCounts based on dataType
    if (dataType === 'daily') {
      const dateRange = generateDateRange(timePeriodDays); // "YYYY-MM-DD" strings
      const dailyData = filteredAndSortedData as ReportDataPointDaily[];
      // Map API data for quick lookup by "YYYY-MM-DD"
      const dataMap = new Map(dailyData.map((item) => [item.date, item.count]));
      // Use the generated date range for labels and map counts
      labels = dateRange.map(formatDisplayDateDaily); // Format for display "Mmm D"
      reportCounts = dateRange.map((dateStr) => dataMap.get(dateStr) || 0); // Lookup using "YYYY-MM-DD"
    } else if (dataType === 'weekly') {
      const weeklyData = filteredAndSortedData as ReportDataPointWeekly[];
      labels = weeklyData.map((item) => formatDisplayDateWeekly(item.week)); // Format for display "Wk WW, YYYY"
      reportCounts = weeklyData.map((item) => item.count);
    } else if (dataType === 'monthly') {
      const monthlyData = filteredAndSortedData as ReportDataPointMonthly[];
      labels = monthlyData.map((item) => formatDisplayDateMonthly(item.month)); // Format for display "Mmm YYYY"
      reportCounts = monthlyData.map((item) => item.count);
    } else if (dataType === 'yearly') {
      const yearlyData = filteredAndSortedData as ReportDataPointYearly[];
      labels = yearlyData.map((item) => item.year.toString()); // Use year directly
      reportCounts = yearlyData.map((item) => item.count);
    }

    return {
      labels: labels,
      datasets: [
        {
          label: 'Reports Created', // Simplified label
          data: reportCounts,
          borderColor: '#4f46e5', // Indigo-600
          backgroundColor: 'rgba(79, 70, 229, 0.1)', // Light Indigo fill
          tension: 0.5, // Slight curve
          fill: true, // Fill area under line
          pointBackgroundColor: '#4f46e5',
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [data, dataType, timePeriodDays]);

  // Configure Chart.js options
  const chartOptions = useMemo((): ChartOptions<'line'> => {
    // Calculate dynamic Y-axis max based on data
    const maxCount = chartData.datasets[0]?.data
      ? Math.max(0, ...(chartData.datasets[0].data as number[]))
      : 0;
    // Ensure max is at least 5, add 10% padding
    const yAxisMax = Math.max(5, Math.ceil(maxCount * 1.1));

    // Adjust suggested max ticks based on data type for better readability
    let suggestedMaxTicks = 10;
    if (dataType === 'daily' && timePeriodDays) suggestedMaxTicks = Math.min(timePeriodDays, 7); // Show max 7 ticks for daily
    else if (dataType === 'weekly' || dataType === 'monthly') suggestedMaxTicks = 12; // Max 12 for weekly/monthly
    else if (dataType === 'yearly') suggestedMaxTicks = 10; // Max 10 for yearly

    return {
      responsive: true,
      maintainAspectRatio: false, // Crucial for fitting in container
      plugins: {
        legend: {
          position: 'top' as const,
          align: 'center', // Align legend
          labels: {
            font: { size: 12 },
            color: '#4b5563', // gray-600
            boxWidth: 15,
            padding: 15
          },
          // Hide legend if instructions are shown below
          // display: !showZoomPanInstructions,
        },
        tooltip: {
          enabled: true,
          mode: 'index', // Show tooltip for items at the same x-index
          intersect: false, // Tooltip appears even if not directly hovering point
          backgroundColor: 'rgba(17, 24, 39, 0.8)', // gray-900 with opacity
          titleColor: '#f9fafb', // gray-50
          bodyColor: '#f9fafb', // gray-50
          titleFont: { size: 12 },
          bodyFont: { size: 12 },
          padding: 8,
          cornerRadius: 4,
          callbacks: {
            // Title: Use the formatted x-axis label
            title: function(tooltipItems: TooltipItem<'line'>[]) {
                return tooltipItems[0]?.label || '';
            },
            // Label: Show only the count (value)
            label: function(context: TooltipItem<'line'>) {
                return context.formattedValue || '';
            },
          }
        },
        title: { display: false }, // No separate chart title, use header in parent
        // Zoom Plugin Configuration
        zoom: {
          pan: {
            enabled: true, // Enable panning
            mode: 'x',     // Allow panning only horizontally
            threshold: 5,  // Pixels threshold to start panning
          },
          zoom: {
            wheel: {
              enabled: true, // Enable zooming with mouse wheel
            },
            pinch: {
              enabled: true, // Enable zooming with pinch gesture
            },
            mode: 'x',     // Allow zooming only horizontally
          },
          // Optional: Limits for zooming/panning if needed
          // limits: {
          //   x: { min: 'original', max: 'original' }, // Keep original scale limits
          // },
        },
      },
      scales: {
        x: {
          grid: {
            display: false, // Hide vertical grid lines
          },
          ticks: {
            font: { size: 10 },
            color: '#6b7280', // gray-500
            maxRotation: 100, // Prevent label rotation
            autoSkip: true, // Automatically skip labels if too crowded
            // Suggest max ticks based on calculation
            maxTicksLimit: suggestedMaxTicks,
          },
          type: 'category', // Use category scale for discrete labels
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#e5e7eb', // gray-200
            borderDash: [3, 3] as [number, number], // Dashed lines
            drawBorder: false, // Hide the axis line itself
          },
          ticks: {
            font: { size: 10 },
            color: '#6b7280', // gray-500
            // Calculate a reasonable step size, ensuring at least 1
            stepSize: Math.max(1, Math.ceil(yAxisMax / 5)), // Aim for ~5 ticks
            precision: 0, // Show whole numbers only
          },
          max: yAxisMax, // Set calculated max value
        },
      },
      // Optimize interaction modes
      interaction: {
        mode: 'index',
        intersect: false,
      },
    };
  // Only recompute options if dataType changes, affecting scales/ticks
  }, [dataType, chartData.datasets, timePeriodDays]); // Include chartData.datasets for yAxisMax calculation

  // Determine if zoom/pan instructions should be shown
  const ZOOM_PAN_THRESHOLD = 15; // Show instructions if more than 15 data points
  const showZoomPanInstructions = useMemo(() => {
      // Check the length of the actual data points being displayed
      return chartData.labels ? chartData.labels.length > ZOOM_PAN_THRESHOLD : false;
  }, [chartData.labels]);

  return (
    // Use flex-col to position instructions below
    <div className="relative h-full flex flex-col">
      {/* Loading State Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 min-h-[200px]">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg
              className="animate-spin h-6 w-6 text-gray-400 dark:text-gray-500 mx-auto mb-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading chart data...
          </div>
        </div>
      )}
      {/* Error State Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50/90 dark:bg-red-900/50 z-10 p-4 min-h-[200px]">
          <p className="text-red-600 dark:text-red-300 text-sm text-center">
            Error loading chart data: {error}
          </p>
        </div>
      )}
      {/* Empty State Overlay */}
      {!isLoading && !error && (!data || data.length === 0 || (chartData.labels?.length ?? 0) === 0) && (
        <div className="absolute inset-0 flex items-center justify-center min-h-[200px]">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No report data available for this period.
          </p>
        </div>
      )}

      {/* Chart Container - Use flex-grow to take available space */}
      {/* Render chart container even if empty to maintain layout, hide chart itself */}
      <div className="relative flex-grow min-h-0">
        {!isLoading && !error && data && data.length > 0 && (chartData.labels?.length ?? 0) > 0 && (
          <Line options={chartOptions} data={chartData} />
        )}
      </div>

      {/* Zoom/Pan Instructions (Conditionally Rendered) */}
      {showZoomPanInstructions && !isLoading && !error && data && data.length > 0 && (chartData.labels?.length ?? 0) > 0 && (
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 flex-shrink-0">
              Use mouse wheel/pinch to zoom. Drag chart to pan.
          </div>
      )}
    </div>
  );
};

export default LineChartReports;
