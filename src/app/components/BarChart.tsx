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
    ChartData
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
    /** The label for the bar (e.g., category name, location name) */
    label: string;
    /** The numerical value for the bar */
    count: number;
    /** Optional extra data */
    [key: string]: any;
}

// Define the props for the BarChart component (theme prop removed)
interface BarChartProps {
    /** The data array for the chart, expecting objects with 'label' and 'count' */
    data: BarChartDataItem[];
    /** Optional title displayed above the chart */
    title?: string;
    /** Optional CSS class name for the container div */
    className?: string;
    /** Optional label for the Y-axis */
    yAxisLabel?: string;
    /** Optional label for the X-axis */
    xAxisLabel?: string;
    /** Optional label for the dataset (used in tooltips) */
    datasetLabel?: string;
}

// Define default colors (based on previous light theme)
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
    // theme prop removed
    title,
    className = '',
    yAxisLabel = 'Count',
    xAxisLabel = 'Category',
    datasetLabel = 'Total Count'
}) => {

    // Removed theme selection logic, using defaultColors directly

    // Memoize chart data and options
    const chartData = useMemo<ChartData<'bar'>>(() => {
        const labels = data.map(item => item.label);
        const counts = data.map(item => item.count);

        return {
            labels: labels,
            datasets: [
                {
                    label: datasetLabel,
                    data: counts,
                    // Use default colors directly
                    backgroundColor: `rgba(${defaultColors.primaryBgColor}, 0.6)`,
                    borderColor: `rgb(${defaultColors.primaryBorderColor})`,
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false,
                },
            ],
        };
    // Removed colors from dependency array
    }, [data, datasetLabel]);

    const chartOptions = useMemo<ChartOptions<'bar'>>(() => {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                title: {
                    display: !!title,
                    text: title,
                    padding: { bottom: 15 },
                    font: { size: 16, weight: 600 },
                    // Use default colors directly
                    color: `rgb(${defaultColors.tickColor})`
                },
                tooltip: {
                    // Use default colors directly
                    backgroundColor: `rgb(${defaultColors.tooltipBgColor})`,
                    titleColor: `rgb(${defaultColors.tooltipTextColor})`,
                    bodyColor: `rgb(${defaultColors.tooltipTextColor})`,
                    boxPadding: 5,
                    padding: 10,
                    cornerRadius: 4,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed.y !== null) { label += context.parsed.y; }
                            return label;
                        }
                    }
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        // Use default colors directly
                        color: `rgba(${defaultColors.gridColor}, 0.3)`,
                        drawBorder: false,
                    },
                    ticks: {
                        // Use default colors directly
                        color: `rgb(${defaultColors.tickColor})`,
                        precision: 0,
                    },
                    title: {
                         display: !!yAxisLabel,
                         text: yAxisLabel,
                         // Use default colors directly
                         color: `rgb(${defaultColors.tickColor})`,
                         font: { size: 14 }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false,
                    },
                    ticks: {
                        // Use default colors directly
                        color: `rgb(${defaultColors.tickColor})`,
                        maxRotation: 45,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 15
                    },
                     title: {
                         display: !!xAxisLabel,
                         text: xAxisLabel,
                         // Use default colors directly
                         color: `rgb(${defaultColors.tickColor})`,
                         font: { size: 14 }
                    }
                },
            },
        };
    // Removed colors from dependency array
    }, [title, yAxisLabel, xAxisLabel, datasetLabel]);

    // Display a message if there's no data
    if (!data || data.length === 0) {
        // Removed dark mode class
        return (
            <div className={`flex items-center justify-center h-80 text-gray-500 ${className}`}>
                No data available to display.
            </div>
        );
    }

    // Container div structure remains the same
    return (
        <div className={`relative h-96 w-full ${className}`}>
            <Bar options={chartOptions} data={chartData} />
        </div>
    );
};

export default BarChart;
