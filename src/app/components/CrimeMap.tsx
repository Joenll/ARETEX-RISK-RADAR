"use client";

import { useEffect, useState, useCallback } from "react"; // Import useCallback

const PYTHON_API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || "http://localhost:8000";

interface CrimeMapProps {
  endpointPath: string;
  className?: string;
}

const CrimeMap: React.FC<CrimeMapProps> = ({ endpointPath, className = "" }) => {
  const [iframeKey, setIframeKey] = useState(Date.now()); // Use timestamp for initial key
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapUrl, setMapUrl] = useState<string | undefined>(undefined); // State to hold the valid URL or undefined

  // Memoize URL construction logic
  const constructUrl = useCallback((): string | null => {
    try {
      if (!endpointPath) {
        // This case should ideally be handled before calling, but good fallback
        console.warn("CrimeMap: Endpoint path is missing.");
        return null;
      }
      // Basic validation: check if endpointPath starts with '/'
      if (!endpointPath.startsWith('/')) {
         console.warn(`CrimeMap: endpointPath "${endpointPath}" should start with a '/'. Prepending.`);
         endpointPath = `/${endpointPath}`;
      }
      return new URL(endpointPath, PYTHON_API_URL).toString();
    } catch (err) {
      console.error("Invalid URL construction:", err);
      // Error state will be set in useEffect
      return null;
    }
  }, [endpointPath]); // Dependency: endpointPath

  // Effect to handle loading, URL construction, and errors
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setMapUrl(undefined); // Clear previous URL

    const url = constructUrl();

    if (url) {
      setMapUrl(url);
      // Key update can happen here or when URL is set, forcing reload if needed
      setIframeKey(Date.now());
    } else {
      // If constructUrl returned null (due to error or invalid path)
      setError("Invalid map endpoint configuration.");
      setIsLoading(false);
    }
    // No need to force iframe reload with key here if URL itself changes or is initially set

  }, [endpointPath, constructUrl]); // Rerun when endpointPath changes

  const handleIframeLoad = () => {
    // Only set loading to false if we actually expected a load (i.e., mapUrl is set)
    if (mapUrl) {
        setIsLoading(false);
        setError(null); // Clear any previous error on successful load
    }
  };

  const handleIframeError = () => {
    // Only set error if we were actually trying to load something
    if (mapUrl) {
        console.error(`Failed to load iframe source: ${mapUrl}`);
        setIsLoading(false);
        setError("Failed to load map content. Please check the connection or configuration.");
        setMapUrl(undefined); // Clear the problematic URL
    }
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setMapUrl(undefined); // Clear URL state

    const url = constructUrl(); // Re-attempt construction

    if (url) {
      setMapUrl(url);
      setIframeKey(Date.now()); // Force iframe reload on retry
    } else {
      setError("Invalid map endpoint configuration.");
      setIsLoading(false);
    }
  };


  return (
    <div className={`relative w-full h-full min-h-[500px] ${className}`}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 z-10">
          <div className="text-center text-gray-500">
            <svg
              className="animate-spin h-8 w-8 text-gray-400 mx-auto mb-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading crime map...
          </div>
        </div>
      )}

      {/* Error message - Show only if not loading and error exists */}
      {!isLoading && error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50/90 z-10 p-4">
          <div className="text-center text-red-600">
            <p className="font-semibold mb-2">⚠️ Map Loading Error</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={handleRetry} // Use the dedicated retry handler
              className="mt-3 px-4 py-2 text-sm bg-red-100 hover:bg-red-200 rounded-md transition-colors"
            >
              Retry Loading
            </button>
          </div>
        </div>
      )}

      {/* Iframe with security features - Render only if mapUrl is a valid string and no error */}
      {mapUrl && !error && (
        <iframe
          key={iframeKey} // Key forces re-render when it changes
          src={mapUrl}    // Now guaranteed to be a string
          className="w-full h-full border-none"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="Crime Map Visualization"
          loading="lazy"
          allow="geolocation"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </div>
  );
};

export default CrimeMap;