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
    // --- NEW: Import TooltipItem if needed for complex tooltip callbacks ---
    // TooltipItem
} from 'chart.js';
// --- NEW: Import datalabels plugin ---
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register necessary Chart.js components AND the datalabels plugin
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels // Register the plugin
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
    primaryBgColorLight: '255, 165, 0',   // Orange RGB
    primaryBgColorDark: '204, 82, 0',     // Darker Orange RGB
    primaryBorderColor: '255, 165, 0',   // Orange RGB
    gridColor: '229, 231, 235',          // gray-200 RGB
    tickColor: '55, 65, 81',             // gray-700 RGB
    tooltipBgColor: '17, 24, 39',         // gray-900 RGB
    tooltipTextColor: '249, 250, 251',   // gray-50 RGB
    // --- NEW: Color for data labels inside bars ---
    dataLabelColor: 'rgb(31, 41, 55)', // Dark Gray (gray-800)
};


const BarChart: React.FC<BarChartProps> = ({
    data = [],
    title,
    className = '',
    yAxisLabel = 'Count',
    xAxisLabel = 'Category',
    datasetLabel = 'Total Count'
}) => {

    // Memoize chart data (remains the same)
    const chartData = useMemo<ChartData<'bar'>>(() => {
        const labels = data.map(item => item.label);
        const counts = data.map(item => item.count);

        return {
            labels: labels,
            datasets: [
                {
                    label: datasetLabel,
                    data: counts,
                    backgroundColor: (context) => {
                      const chart = context.chart;
                      const { ctx, chartArea } = chart;

                      if (!chartArea) {
                        return `rgba(${defaultColors.primaryBgColorLight}, 0.7)`; // Slightly more opaque fallback
                      }

                      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                      // Use slightly more opaque colors for better label contrast
                      gradient.addColorStop(0, `rgba(${defaultColors.primaryBgColorLight}, 0.7)`);
                      gradient.addColorStop(1, `rgba(${defaultColors.primaryBgColorDark}, 0.7)`);
                      return gradient;
                    },
                    borderColor: `rgb(${defaultColors.primaryBorderColor})`,
                    borderWidth: 1,
                    borderRadius: 10,
                    borderSkipped: false,
                },
            ],
        };
    }, [data, datasetLabel]);

    // Memoize chart options
    const chartOptions = useMemo<ChartOptions<'bar'>>(() => {
        // Dynamic Y-axis calculation (remains the same)
        const maxCount = chartData.datasets[0]?.data
            ? Math.max(0, ...(chartData.datasets[0].data as number[]))
            : 0;
        const yAxisMax = Math.max(5, Math.ceil(maxCount * 1.1));
        const yStepSize = Math.max(1, Math.ceil(yAxisMax / 6));

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
                    font: { size: 16, weight: 600 }, // Use number for weight
                    color: `rgb(${defaultColors.tickColor})`
                },
                tooltip: {
                    // Tooltip config remains the same
                    backgroundColor: `rgba(${defaultColors.tooltipBgColor}, 0.85)`,
                    titleColor: `rgb(${defaultColors.tooltipTextColor})`,
                    bodyColor: `rgb(${defaultColors.tooltipTextColor})`,
                    boxPadding: 4,
                    padding: 8,
                    cornerRadius: 4,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            // Use context.formattedValue which is already localized/formatted
                            return `${context.dataset.label}: ${context.formattedValue}`;
                        }
                    }
                },
                // --- NEW: Datalabels Configuration ---
                datalabels: {
                    display: (context) => {
                        // Only display label if value is > 0
                        const value = context.dataset.data[context.dataIndex] as number;
                        return value > 0;
                    },
                    formatter: (value, context) => {
                        // Display the raw value (count)
                        return `${value}`;
                    },
                    color: defaultColors.dataLabelColor, // Use the new dark color
                    anchor: 'center', // Position the label in the center of the bar
                    align: 'center', // Align the text centrally
                    font: {
                        weight: 'bold',
                        size: 13, // Adjust size as needed
                    },
                    // Optional: Add padding if needed
                    // padding: 4,
                    // Optional: Rotate label if bars are narrow
                    // rotation: -90
                }
                // --- End Datalabels ---
            },
            scales: {
                // Scales config remains the same
                y: {
                    beginAtZero: true,
                    grid: {
                        color: `rgba(${defaultColors.gridColor}, 0.5)`,
                        drawBorder: false,
                    },
                    ticks: {
                        color: `rgb(${defaultColors.tickColor})`,
                        precision: 0,
                        stepSize: yStepSize,
                    },
                    title: {
                         display: !!yAxisLabel,
                         text: yAxisLabel,
                         color: `rgb(${defaultColors.tickColor})`,
                         font: { size: 12, weight: 'normal' }
                    },
                    max: yAxisMax,
                },
                x: {
                    grid: {
                        display: false,
                    },
                    ticks: {
                        color: `rgb(${defaultColors.tickColor})`,
                        maxRotation: 45,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 15,
                        padding: 5,
                    },
                     title: {
                         display: !!xAxisLabel,
                         text: xAxisLabel,
                         color: `rgb(${defaultColors.tickColor})`,
                         font: { size: 12 }
                    }
                },
            },
            // Interaction config remains the same
            interaction: {
                mode: 'index',
                intersect: false,
            },
            // Animation config remains the same
             animation: {
                 duration: 400,
                 easing: 'easeOutQuad',
             },
        };
    }, [title, yAxisLabel, xAxisLabel, datasetLabel, chartData.datasets]); // Dependencies remain the same

    // Display a message if there's no data (remains the same)
    if (!data || data.length === 0) {
        return (
            <div className={`flex items-center justify-center h-full text-gray-500 ${className}`}>
                No data available to display.
            </div>
        );
    }

    // Render component (remains the same)
    return (
        <div className={`relative w-full flex flex-col h-full ${className}`}>
            <div className="relative flex-grow min-h-0">
                <Bar options={chartOptions} data={chartData} />
            </div>
        </div>
    );
};

export default BarChart;
