"use client"; // Required because we are using useState

import React, { useState, useMemo } from 'react'; // Added useMemo
import CrimeMap from '@/app/components/CrimeMap'; // Adjust path if needed
import WeatherMap from '@/app/components/WeatherForecast'; // <-- Import WeatherMap
import { FaMap, FaCloudSun } from 'react-icons/fa'; // <-- Import Icons

// Define the types of maps available for the user dashboard
// You might want to customize this list compared to the admin dashboard
type MapType = 'heat' | 'hotspot' | 'status'; // Changed 'heatmap' to 'heat' for consistency

// --- NEW: Interface for Legend Items (copied from admin dashboard) ---
interface LegendItem { color: string; label: string; }

export default function DashBoardPage() {
  // State to manage which map is currently active
  const [activeMap, setActiveMap] = useState<MapType>('heat'); // Default to 'heat'

  // Define the API endpoints for each map type
  // These might be the same or different from the admin endpoints
  const mapEndpoints: Record<MapType, string> = {
    heat: '/api/heatmap',       // Example endpoint for heat
    hotspot: '/api/hotspot-map',   // Example endpoint for hotspot map
    status: '/api/status-map',     // Example endpoint for status map
  };

  // --- Legends (copied from admin dashboard) ---
  const statusMapLegend: LegendItem[] = [ { color: 'bg-red-500', label: 'Open / Ongoing' }, { color: 'bg-blue-500', label: 'Pending / Under Investigation' }, { color: 'bg-green-500', label: 'Closed / Resolved' } ];
  const heatLegend: LegendItem[] = [ { color: 'bg-blue-500', label: 'Low Risk' }, { color: 'bg-green-500', label: 'Moderate Risk' }, { color: 'bg-yellow-400', label: 'Medium Risk' }, { color: 'bg-red-500', label: 'High Risk' }, { color: 'bg-red-800', label: 'Very High Risk' } ];
  const hotspotMapLegend: LegendItem[] = [ { color: 'bg-red-600', label: 'Indicates areas with a higher probability of future crime incidents.' } ];

  // --- Helper Functions (copied from admin dashboard) ---
  const formatMapName = (mapType: MapType): string => {
    const name = mapType.charAt(0).toUpperCase() + mapType.slice(1).replace('-', ' ');
    return `${name} Map`;
  };

  const getCurrentLegend = (): { title?: string; items?: LegendItem[] } => {
    switch (activeMap) {
      case 'status': return { title: "Case Status", items: statusMapLegend };
      case 'heat': return { title: "Risk Level", items: heatLegend };
      case 'hotspot': return { title: "Prediction", items: hotspotMapLegend };
      default: return { title: undefined, items: undefined };
    }
  };
  const currentLegend = useMemo(getCurrentLegend, [activeMap]); // Memoize legend calculation

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">User Dashboard</h1>

      {/* --- Section: Crime Map Visualizations --- */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        {/* Map Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {/* Define which map types are available for users */}
            {(['heat', 'hotspot', 'status'] as MapType[]).map((mapType) => (
              <button
                key={mapType}
                onClick={() => setActiveMap(mapType)}
                className={`${
                  activeMap === mapType
                    ? 'border-orange-500 text-orange-600' // Active tab style
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' // Inactive tab style
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm capitalize`}
                aria-current={activeMap === mapType ? 'page' : undefined}
              >
                {/* Display map type name nicely (e.g., "Hotspot Map") */}
                {formatMapName(mapType)} {/* Use helper function */}
              </button>
            ))}
          </nav>
        </div>

        {/* Map Container - Adjust height as needed */}
        {/* Increased height slightly */}
        <div className="w-full h-[550px] md:h-[650px] bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          {/* Render the CrimeMap component */}
          {/* The key prop ensures the iframe reloads when the activeMap changes */}
          <CrimeMap
            key={activeMap}
            endpointPath={mapEndpoints[activeMap]} // Pass the correct API endpoint based on the active tab
            className="w-full h-full" // Ensure map fills its container
            legendTitle={currentLegend.title} // Pass legend title
            legendItems={currentLegend.items} // Pass legend items
          />
        </div>
      </div>

      {/* --- Section: Weather Forecast --- */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <FaCloudSun className="mr-2 text-blue-500" /> Weather Forecast
        </h2>
        {/* Weather Map Container - Use a suitable height */}
        <div className="w-full h-[600px] md:h-[780px] bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          <WeatherMap
            endpointPath="/api/generate-weather" // Endpoint for the weather map HTML
            className="relative w-full h-full flex-grow" // Ensure it fills the container
            title="Weather Forecast"
          />
        </div>
      </div>

      {/* You can add other user-specific dashboard components here */}

    </div>
  );
}