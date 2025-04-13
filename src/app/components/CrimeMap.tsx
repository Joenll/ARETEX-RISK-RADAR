// src/app/components/CrimeMap.tsx
import { useEffect, useState } from "react";

// --- Consider using an environment variable for the URL ---
const PYTHON_API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || "http://localhost:8000"; // Example default

const CrimeMap = () => {
  const [mapHtml, setMapHtml] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Added loading state
  const [error, setError] = useState<string | null>(null); // Added error state

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    // --- Use the actual URL here ---
    fetch(`${PYTHON_API_URL}/api/crime-map`) // Replace '/api/crime-map' if the path is different
      .then((response) => {
        if (!response.ok) {
          // Handle HTTP errors (like 404 Not Found, 500 Server Error)
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text(); // Get the response body as text (HTML)
      })
      .then((html) => {
        setMapHtml(html);
      })
      .catch((error) => {
        console.error("Error fetching crime map:", error);
        setError("Failed to load the crime map. Please try again later."); // Set user-friendly error
      })
      .finally(() => {
        setIsLoading(false); // Stop loading indicator regardless of success/failure
      });
  }, []); // Empty dependency array means this runs once on mount

  // --- Render loading, error, or the map ---
  if (isLoading) {
    // You can replace this with a spinner or skeleton loader
    return <div className="text-center p-4">Loading Map...</div>;
  }

  if (error) {
    // Display the error message
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  // This renders the HTML string received from the Python service directly
  // Ensure you trust the source of this HTML to avoid XSS vulnerabilities
  return <div dangerouslySetInnerHTML={{ __html: mapHtml }} />;
};

export default CrimeMap;
