// src/app/ui/dashboard/page.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import CrimeMap from '@/app/components/CrimeMap';
import WeatherMap from '@/app/components/WeatherForecast';
// Removed unused icons FaChartLine, FaChartBar
import { FaMap, FaCloudSun, FaFilter, FaChevronDown, FaBrain } from 'react-icons/fa';
// Removed unused components LineChartReports, BarChart
import PredictionCharts from '@/app/components/PredictionCharts';

// --- Define Types ---
// Removed unused chart-specific types
type MapType = 'heat' | 'hotspot' | 'status';
interface LegendItem { color: string; label: string; }
// --- End Types ---


export default function DashBoardPage() {
  // --- State for Maps ---
  const [activeMap, setActiveMap] = useState<MapType>('heat');
  const [activeGeospatialView, setActiveGeospatialView] = useState<'crime' | 'weather'>('crime');
  const [isMapFilterOpen, setIsMapFilterOpen] = useState(false);
  const mapFilterDropdownRef = useRef<HTMLDivElement>(null);

  // --- State for Charts (Removed unused state) ---
  // No state needed specifically for PredictionCharts as they fetch internally

  // --- Map Endpoints & Legends ---
  const mapEndpoints: Record<MapType, string> = {
    heat: '/api/heatmap',
    hotspot: '/api/hotspot-map',
    status: '/api/status-map',
  };
  const statusMapLegend: LegendItem[] = [ { color: 'bg-red-500', label: 'Open / Ongoing' }, { color: 'bg-blue-500', label: 'Pending / Under Investigation' }, { color: 'bg-green-500', label: 'Closed / Resolved' } ];
  const heatLegend: LegendItem[] = [ { color: 'bg-blue-500', label: 'Low Risk' }, { color: 'bg-green-500', label: 'Moderate Risk' }, { color: 'bg-yellow-400', label: 'Medium Risk' }, { color: 'bg-red-500', label: 'High Risk' }, { color: 'bg-red-800', label: 'Very High Risk' } ];
  const hotspotMapLegend: LegendItem[] = [ { color: 'bg-red-600', label: 'Indicates areas with a higher probability of future crime incidents.' } ];

  // --- Helper Functions ---
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
  const currentLegend = useMemo(getCurrentLegend, [activeMap]);

  // --- Handlers ---
  const handleMapSelect = (mapType: MapType) => { setActiveMap(mapType); setIsMapFilterOpen(false); };
  const handleGeospatialViewChange = (view: 'crime' | 'weather') => { setActiveGeospatialView(view); };
  // Removed unused chart handlers: handleTrendTypeChange, handleLocationGroupByChange, handleLocationYearChange
  // Removed unused useEffect hooks for fetching trend, years, and top location data

  // Click outside handler for map filter dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mapFilterDropdownRef.current && !mapFilterDropdownRef.current.contains(event.target as Node)) {
        setIsMapFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [mapFilterDropdownRef]);

  // --- Determine Chart Titles (Removed unused titles) ---
  // No titles needed here as PredictionCharts handles its own title prop


  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">User Dashboard</h1>

      {/* --- Section: Geospatial Analysis / Weather Forecast --- */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        {/* --- Controls Row --- */}
        <div className="mb-4 flex flex-wrap items-center justify-end gap-4">
          {/* Crime Map Filter (Conditional) */}
          {activeGeospatialView === 'crime' && (
            <div className="relative mr-auto" ref={mapFilterDropdownRef}>
              <button
                onClick={() => setIsMapFilterOpen(!isMapFilterOpen)}
                className={`flex items-center px-4 py-2 font-semibold rounded-lg shadow-md text-sm transition-colors duration-150 ${
                  isMapFilterOpen
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-indigo-500 hover:text-white"
                }`}
              >
                <FaFilter className="mr-2" />
                {formatMapName(activeMap)}
                <FaChevronDown
                  className={`ml-2 transition-transform duration-200 ${
                    isMapFilterOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isMapFilterOpen && (
                <div className="absolute left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-48 z-20">
                  <ul className="py-1">
                    {(["heat", "hotspot", "status"] as MapType[]).map(
                      (mapType) => (
                        <li key={mapType}>
                          <button
                            onClick={() => handleMapSelect(mapType)}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                              activeMap === mapType
                                ? "bg-gray-100 text-orange-500 font-medium"
                                : "text-gray-700 hover:bg-gray-100 hover:text-orange-500"
                            }`}
                          >
                            {formatMapName(mapType)}
                          </button>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* View Switch Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleGeospatialViewChange("crime")}
              className={`flex items-center px-4 py-2 font-semibold rounded-lg shadow-md text-sm transition-colors duration-150 ${
                activeGeospatialView === "crime"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-blue-500 hover:text-white"
              }`}
            >
              <FaMap className="mr-2" /> Crime Map
            </button>
            <button
              onClick={() => handleGeospatialViewChange("weather")}
              className={`flex items-center px-4 py-2 font-semibold rounded-lg shadow-md text-sm transition-colors duration-150 ${
                activeGeospatialView === "weather"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-blue-500 hover:text-white"
              }`}
            >
              <FaCloudSun className="mr-2" /> Weather
            </button>
          </div>
        </div>

        {/* Map/Weather Display Area */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {activeGeospatialView === "crime"
              ? `Crime Map: ${formatMapName(activeMap)}`
              : "Weather Forecast"}
          </h2>
          <div className="w-full h-[600px] md:h-[780px] bg-white rounded-lg overflow-hidden shadow-inner">
            {activeGeospatialView === "crime" && (
              <CrimeMap
                key={activeMap}
                endpointPath={mapEndpoints[activeMap]}
                className="w-full h-full"
                legendTitle={currentLegend.title}
                legendItems={currentLegend.items}
              />
            )}
            {activeGeospatialView === "weather" && (
              <WeatherMap
                key="weather-map"
                endpointPath="/api/generate-weather"
                title="Weather Forecast"
                className="relative w-full h-full flex-grow"
              />
            )}
          </div>
        </div>
      </div>

      {/* --- Section: Predictions --- */}
      <h1 className="text-2xl font-bold text-gray-800 mb-2 py-5">Crime Predictions</h1>
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6"> {/* Single column layout */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col">
          <div className="relative h-[750px] flex-grow">
            <PredictionCharts
              endpointPath="/api/forecast/crime-trend"
              title="Crime Trend Forecast Chart"
              className="w-full h-full"
            />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col">
          <div className="relative h-[700px] flex-grow">
            <PredictionCharts
              endpointPath="/api/forecast/top-locations"
              title="Top Predicted Locations Chart"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* You can add other user-specific dashboard components here */}

    </div>
  );
}
