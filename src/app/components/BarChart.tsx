// src/components/charts/BarChart.tsx

import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
    ChartData,
    // Import TooltipItem if needed for complex callbacks, though not used here currently
    // TooltipItem
} from 'chart.js';

// Register necessary Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// Define a generic structure for input data items
interface BarChartDataItem {
    label: string;
    count: number;
    [key: string]: any;
}

// Define the props for the BarChart component
interface BarChartProps {
    data: BarChartDataItem[];
    title?: string;
    className?: string;
    yAxisLabel?: string;
    xAxisLabel?: string;
    datasetLabel?: string;
}

// Define default colors
const defaultColors = {
    primaryBgColor: '59, 130, 246',   // blue-500 RGB
    primaryBorderColor: '59, 130, 246',
    gridColor: '229, 231, 235',  // gray-200 RGB
    tickColor: '55, 65, 81',    // gray-700 RGB
    tooltipBgColor: '17, 24, 39',    // gray-900 RGB
    tooltipTextColor: '249, 250, 251',// gray-50 RGB
};


const BarChart: React.FC<BarChartProps> = ({
    data = [],
    title,
    className = '',
    yAxisLabel = 'Count',
    xAxisLabel = 'Category',
    datasetLabel = 'Total Count'
}) => {

    // Memoize chart data
    const chartData = useMemo<ChartData<'bar'>>(() => {
        const labels = data.map(item => item.label);
        const counts = data.map(item => item.count);

        return {
            labels: labels,
            datasets: [
                {
                    label: datasetLabel,
                    data: counts,
                    backgroundColor: `rgba(${defaultColors.primaryBgColor}, 0.6)`,
                    borderColor: `rgb(${defaultColors.primaryBorderColor})`,
                    borderWidth: 1,
                    borderRadius: 4, // Slightly smaller radius
                    borderSkipped: false,
                    // Optional: Add hover styles if desired
                    // hoverBackgroundColor: `rgba(${defaultColors.primaryBgColor}, 0.8)`,
                    // hoverBorderColor: `rgb(${defaultColors.primaryBorderColor})`,
                },
            ],
        };
    }, [data, datasetLabel]);

    // Memoize chart options
    const chartOptions = useMemo<ChartOptions<'bar'>>(() => {
        // --- Optional: Dynamic Y-axis calculation ---
        const maxCount = chartData.datasets[0]?.data
            ? Math.max(0, ...(chartData.datasets[0].data as number[]))
            : 0;
        // Ensure max is at least 5, add some padding (e.g., 10%)
        const yAxisMax = Math.max(5, Math.ceil(maxCount * 1.1));
        // Calculate a reasonable step size, aiming for ~5-6 ticks
        const yStepSize = Math.max(1, Math.ceil(yAxisMax / 6));
        // --- End Optional ---

        return {
            responsive: true,
            maintainAspectRatio: false, // Crucial for flexible height
            plugins: {
                legend: {
                    display: false, // Often legend is not needed for single dataset bar charts
                },
                title: {
                    display: !!title,
                    text: title,
                    padding: { bottom: 15 },
                    font: { size: 16, weight: 600 }, // Use number for weight
                    color: `rgb(${defaultColors.tickColor})`
                },
                tooltip: {
                    backgroundColor: `rgba(${defaultColors.tooltipBgColor}, 0.85)`, // Slightly transparent
                    titleColor: `rgb(${defaultColors.tooltipTextColor})`,
                    bodyColor: `rgb(${defaultColors.tooltipTextColor})`,
                    boxPadding: 4,
                    padding: 8,
                    cornerRadius: 4,
                    usePointStyle: true, // Use point style in tooltip
                    callbacks: {
                        // Keep label callback simple for single dataset
                        label: function(context) {
                            return `${context.dataset.label}: ${context.formattedValue}`;
                        }
                    }
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: `rgba(${defaultColors.gridColor}, 0.5)`, // Slightly more visible grid
                        drawBorder: false,
                    },
                    ticks: {
                        color: `rgb(${defaultColors.tickColor})`,
                        precision: 0,
                        // --- Optional: Use dynamic step size ---
                        stepSize: yStepSize,
                        // --- End Optional ---
                        // Optional: Add padding so highest bar doesn't touch top edge
                        // padding: 10,
                    },
                    title: {
                         display: !!yAxisLabel,
                         text: yAxisLabel,
                         color: `rgb(${defaultColors.tickColor})`,
                         font: { size: 12, weight: 'normal' } // Add valid weight
                    },
                    // --- Optional: Use dynamic max ---
                    max: yAxisMax,
                    // --- End Optional ---
                },
                x: {
                    grid: {
                        display: false, // Keep x grid lines off
                    },
                    ticks: {
                        color: `rgb(${defaultColors.tickColor})`,
                        maxRotation: 45, // Allow rotation
                        minRotation: 0,
                        autoSkip: true, // Skip labels if too crowded
                        maxTicksLimit: 15, // Limit ticks for readability
                        padding: 5, // Add some padding below labels
                    },
                     title: {
                         display: !!xAxisLabel,
                         text: xAxisLabel,
                         color: `rgb(${defaultColors.tickColor})`,
                         font: { size: 12 } // Slightly smaller axis title
                    }
                },
            },
            // Optional: Improve hover interaction
            interaction: {
                mode: 'index', // Show tooltip for the bar at the hovered index
                intersect: false, // Tooltip appears even if not directly hovering the bar center
            },

             animation: {
                 duration: 400,
                 easing: 'easeOutQuad',
             },
        };
    // Include dependencies for dynamic calculations if added
    }, [title, yAxisLabel, xAxisLabel, datasetLabel, chartData.datasets]);

    // Display a message if there's no data
    if (!data || data.length === 0) {
        return (
            // Ensure this container also respects the parent's height context
            <div className={`flex items-center justify-center h-full text-gray-500 ${className}`}>
                No data available to display.
            </div>
        );
    }

    return (
        <div className={`relative w-full flex flex-col h-full ${className}`}>
            {/* Chart Container - flex-grow allows it to take available vertical space */}
            <div className="relative flex-grow min-h-0">
                <Bar options={chartOptions} data={chartData} />
            </div>
        </div>
    );
};

export default BarChart;
