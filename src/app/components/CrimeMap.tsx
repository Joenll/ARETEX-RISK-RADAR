// src/app/components/CrimeMap.tsx
"use client"; // Required for useEffect and useState

import { useEffect, useState } from "react";

// Ensure this environment variable is set in your .env.local or environment
// It should point to the base URL of your Python FastAPI service
const PYTHON_API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || "http://localhost:8000"; // Default for local dev

interface CrimeMapProps {
  /** The specific API path on the Python service (e.g., "/api/heatmap") */
  endpointPath: string;
  /** Optional additional CSS classes for the container div */
  className?: string;
}

const CrimeMap: React.FC<CrimeMapProps> = ({ endpointPath, className = "" }) => {
  const [mapHtml, setMapHtml] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when the endpointPath prop changes
    setIsLoading(true);
    setError(null);
    setMapHtml("");

    if (!endpointPath) {
        console.error("CrimeMap: endpointPath prop is missing.");
        setError("Map endpoint path is not provided.");
        setIsLoading(false);
        return;
    }

    // Construct the full URL to fetch the map HTML
    const mapUrl = `${PYTHON_API_URL}${endpointPath}`;
    console.log(`Fetching map from: ${mapUrl}`); // Helpful for debugging

    fetch(mapUrl)
      .then((response) => {
        if (!response.ok) {
          // Handle specific errors like 503 Service Unavailable during initialization
          if (response.status === 503) {
              return response.json().then(errData => { // Try to get detail message
                 throw new Error(errData.detail || "Map service is initializing. Please try again shortly.");
              });
          }
          // Handle other HTTP errors
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text(); // Get the response body as HTML text
      })
      .then((html) => {
        setMapHtml(html);
      })
      .catch((fetchError: any) => {
        console.error(`Error fetching crime map from ${endpointPath}:`, fetchError);
        // Set a user-friendly error message
        setError(fetchError.message || "Failed to load the crime map. Please check the connection or try again later.");
      })
      .finally(() => {
        setIsLoading(false); // Stop loading indicator
      });

    // Re-run the effect if the endpointPath changes
  }, [endpointPath]);

  // --- Render loading state ---
  if (isLoading) {
    return (
        <div className={`flex items-center justify-center min-h-[300px] h-full bg-gray-100 rounded ${className}`}>
            <div className="text-center text-gray-500">
                {/* Simple spinner */}
                <svg className="animate-spin h-8 w-8 text-gray-400 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading Map...
            </div>
        </div>
    );
  }

  // --- Render error state ---
  if (error) {
    return (
        <div className={`flex flex-col items-center justify-center min-h-[300px] h-full bg-red-50 border border-red-200 rounded p-4 ${className}`}>
            <div className="text-center text-red-600">
                <p className="font-semibold mb-1">Error Loading Map</p>
                <p className="text-sm">{error}</p>
            </div>
        </div>
    );
  }

  // --- Render the fetched HTML map ---
  // WARNING: dangerouslySetInnerHTML can be risky if the HTML source isn't trusted.
  // Since this HTML comes from *your* backend service that you control, it's generally acceptable here.
  // Ensure your Python service properly sanitizes any user input if it's used in generating the HTML.
  return (
    <div
        className={`w-full h-full overflow-hidden ${className}`} // Ensure container has dimensions and hides overflow
        dangerouslySetInnerHTML={{ __html: mapHtml }}
    />
  );
};

export default CrimeMap;
