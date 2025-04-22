"use client"; // Required because we are using useState

import React, { useState } from 'react';
import CrimeMap from '@/app/components/CrimeMap'; // Adjust path if needed

// Define the types of maps available for the user dashboard
// You might want to customize this list compared to the admin dashboard
type MapType = 'heatmap' | 'hotspot' | 'status';

export default function DashBoardPage() {
  // State to manage which map is currently active
  const [activeMap, setActiveMap] = useState<MapType>('heatmap');

  // Define the API endpoints for each map type
  // These might be the same or different from the admin endpoints
  const mapEndpoints: Record<MapType, string> = {
    heatmap: '/api/heatmap',       // Example endpoint for heatmap
    hotspot: '/api/hotspot-map',   // Example endpoint for hotspot map
    status: '/api/status-map',     // Example endpoint for status map
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">User Dashboard</h1>

      {/* --- Section: Crime Map Visualizations --- */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Crime Map Visualizations</h2>

        {/* Map Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {/* Define which map types are available for users */}
            {(['heatmap', 'hotspot', 'status'] as MapType[]).map((mapType) => (
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
                {mapType.replace('-', ' ')} Map
              </button>
            ))}
          </nav>
        </div>

        {/* Map Container - Adjust height as needed */}
        <div className="w-full h-[500px] md:h-[600px] bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          {/* Render the CrimeMap component */}
          {/* The key prop ensures the iframe reloads when the activeMap changes */}
          <CrimeMap
            key={activeMap}
            endpointPath={mapEndpoints[activeMap]} // Pass the correct API endpoint based on the active tab
            className="w-full h-full" // Ensure map fills its container
          />
        </div>
      </div>

      {/* You can add other user-specific dashboard components here */}

    </div>
  );
}