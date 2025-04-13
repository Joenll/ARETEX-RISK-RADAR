"use client";

import { useState, useEffect, useRef, use } from "react"; // Added 'use' import
import { fetchCoordinates } from "@/app/utils/geocoder";
import { isPSGCCode } from "@/app/utils/ispsgc";
import LocationDropdown from "@/app/components/LocationDropdown";
import { useRouter } from "next/navigation";

// Debounce function (Consider moving to a utils file)
function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

// CrimeReport interface (Consider moving to a types file, e.g., src/types/crimeReport.ts)
interface CrimeReport {
  _id: string;
  crime_id: string;
  date: string;
  time: string;
  region: string; // PSGC Code
  province: string; // PSGC Code
  municipality_city: string; // PSGC Code
  barangay: string; // PSGC Code
  region_name?: string;
  province_name?: string;
  municipality_city_name?: string;
  barangay_name?: string;
  latitude: string | number;
  longitude: string | number;
  crime_type: string;
  crime_type_category: string;
  case_status: string;
  event_proximity: string;
  crime_occurred_indoors_or_outdoors: string;
  house_building_number: string;
  street_name: string;
  purok_block_lot: string;
  zip_code: string;
  day_of_week: string;
  // Populated data from API
  location?: {
    _id: string;
    house_building_number: string;
    street_name: string;
    purok_block_lot: string;
    barangay: string; // PSGC Code
    municipality_city: string; // PSGC Code
    province: string; // PSGC Code
    zip_code: string;
    region: string; // PSGC Code
    latitude: number;
    longitude: number;
    // Assuming these name fields exist in your Location model/API response
    region_name?: string;
    province_name?: string;
    municipality_city_name?: string;
    barangay_name?: string;
  };
  crime_type_data?: {
    _id: string;
    crime_type: string;
    crime_type_category: string;
  };
}


// Define the props for the Page component, including params
interface EditCrimeReportPageProps {
  params: {
    crimeReportId: string; // This comes from the URL segment [crimeReportId]
  };
}



// This is the actual Page component that Next.js renders
export default function EditCrimeReportPage({ params }: EditCrimeReportPageProps) {
  // Extract crimeReportId from params
  // const resolvedParams = use(params); // Recommended way for future compatibility
  // const { crimeReportId } = resolvedParams;
  const { crimeReportId } = params; // Direct access (works for now in Client Components)

  // --- Component State and Logic ---
  const [formData, setFormData] = useState<Partial<CrimeReport>>({});
  const [isFetchingCoordinates, setIsFetchingCoordinates] = useState(false);
  const [previousFullAddress, setPreviousFullAddress] = useState("");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // State for error messages

  // --- useEffect to fetch data ---
  useEffect(() => {
    // Basic check if crimeReportId looks like a valid ID before fetching
    // Mongoose ObjectId is 24 hex characters
    if (!crimeReportId || !/^[0-9a-fA-F]{24}$/.test(crimeReportId)) {
      console.error("Invalid crimeReportId format:", crimeReportId);
      setError("Invalid Crime Report ID provided in URL.");
      setIsLoading(false);
      return; // Exit early
    }

    const fetchCrimeReport = async () => {
      setIsLoading(true);
      setError(null); // Clear previous errors
      try {
        const response = await fetch(`/api/crime-reports/${crimeReportId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})); // Try to parse error
          const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
          if (response.status === 404) {
            console.error(`Crime report with ID ${crimeReportId} not found.`);
            setError(`Crime report not found (ID: ${crimeReportId}).`);
          } else {
             console.error("API Error:", errorMessage);
             setError(`Failed to load crime report: ${errorMessage}`);
          }
          throw new Error(errorMessage); // Throw to stop execution in try block
        }

        const data = await response.json();

        if (data && data.data) {
          // Explicitly type the fetched data
          const crimeReport: CrimeReport = data.data;

          // Format date for the input field (YYYY-MM-DD)
          const formattedDate = crimeReport.date
            ? new Date(crimeReport.date).toISOString().split("T")[0]
            : "";

          // Populate form data using optional chaining for safety
          // Ensure location and crime_type_data exist before accessing properties
          const initialFormData: Partial<CrimeReport> = {
            _id: crimeReport._id, // Keep the original _id
            crime_id: crimeReport.crime_id,
            date: formattedDate,
            time: crimeReport.time,
            // Use codes from location for dropdowns
            region: crimeReport.location?.region,
            province: crimeReport.location?.province,
            municipality_city: crimeReport.location?.municipality_city,
            barangay: crimeReport.location?.barangay,
            // Use names for display/geocoding if available, otherwise fallback to codes
            region_name: crimeReport.location?.region_name || crimeReport.location?.region,
            province_name: crimeReport.location?.province_name || crimeReport.location?.province,
            municipality_city_name: crimeReport.location?.municipality_city_name || crimeReport.location?.municipality_city,
            barangay_name: crimeReport.location?.barangay_name || crimeReport.location?.barangay,
            // Use coordinates from location
            latitude: crimeReport.location?.latitude,
            longitude: crimeReport.location?.longitude,
            // Use details from crime_type_data
            crime_type: crimeReport.crime_type_data?.crime_type,
            crime_type_category: crimeReport.crime_type_data?.crime_type_category,
            // Other fields
            case_status: crimeReport.case_status,
            event_proximity: crimeReport.event_proximity,
            crime_occurred_indoors_or_outdoors: crimeReport.crime_occurred_indoors_or_outdoors,
            house_building_number: crimeReport.location?.house_building_number,
            street_name: crimeReport.location?.street_name,
            purok_block_lot: crimeReport.location?.purok_block_lot,
            zip_code: crimeReport.location?.zip_code,
            day_of_week: crimeReport.day_of_week,
          };
          setFormData(initialFormData);

          console.log("Setting initial FormData with:", {
    region: initialFormData.region,
    province: initialFormData.province,
    municipality_city: initialFormData.municipality_city,
    barangay: initialFormData.barangay,
    region_name: initialFormData.region_name,
    province_name: initialFormData.province_name,
    // etc.
}); // <-- ADD THIS LOG

           // Set initial address for geocoding comparison using names if available
           const initialAddressParts = [
            crimeReport.location?.house_building_number,
            crimeReport.location?.street_name,
            crimeReport.location?.purok_block_lot,
            initialFormData.barangay_name, // Use name from populated form data
            initialFormData.municipality_city_name, // Use name from populated form data
            initialFormData.province_name, // Use name from populated form data
            crimeReport.location?.zip_code,
            initialFormData.region_name, // Use name from populated form data
          ];
          setPreviousFullAddress(initialAddressParts.filter(Boolean).join(", ").trim());

        } else {
          console.error("Received invalid data structure from API:", data);
          setError("Failed to parse crime report data from API.");
        }
      } catch (fetchError: any) {
        // Error already logged or set above
        if (!error) { // Set a generic error if none was set before
             setError(`An unexpected error occurred while fetching data: ${fetchError.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };


    fetchCrimeReport();
  }, [crimeReportId]); // Dependency array only needs crimeReportId

  // --- Handlers (handleChange, handleLocationSelect, fetchAndSetCoordinates, handleSubmit) ---

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Trigger coordinate fetching only for specific address fields
    if (
      name === "house_building_number" ||
      name === "street_name" ||
      name === "purok_block_lot" ||
      name === "zip_code"
    ) {
      debouncedFetchCoordinates();
    }
  };

  const handleLocationSelect = (
    name: string, // e.g., 'region', 'province'
    value: string, // The PSGC code
    nameValue: string // The actual name
  ) => {
    // When a parent dropdown changes (e.g., region), clear child codes and names
    let resetFields: Partial<CrimeReport> = {};
    if (name === 'region') {
        resetFields = { province: '', province_name: '', municipality_city: '', municipality_city_name: '', barangay: '', barangay_name: '' };
    } else if (name === 'province') {
        resetFields = { municipality_city: '', municipality_city_name: '', barangay: '', barangay_name: '' };
    } else if (name === 'municipality_city') {
        resetFields = { barangay: '', barangay_name: '' };
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value, // Set the code (e.g., formData.region = '010000000')
      [`${name}_name`]: nameValue, // Set the name (e.g., formData.region_name = 'REGION I')
      ...resetFields, // Apply resets for child fields
    }));
    // Debounce coordinate fetching after dropdown selection
    debouncedFetchCoordinates();
  };

  const fetchAndSetCoordinates = async () => {
    setIsFetchingCoordinates(true);
    // Construct address using the name fields for better geocoding results
    const addressParts = [
      formData.house_building_number,
      formData.street_name,
      formData.purok_block_lot,
      formData.barangay_name, // Use name field
      formData.municipality_city_name, // Use name field
      formData.province_name, // Use name field
      formData.zip_code,
      formData.region_name, // Use name field
    ];
    let fullAddress = addressParts.filter(Boolean).join(", ").trim();
    console.log("Attempting geocoding for address:", fullAddress);

    // Check if any *code* field indicates a PSGC code selection (meaning dropdown was used)
    // OR if the specific address fields are empty
    const hasPSGCCode = formData.region || formData.province || formData.municipality_city || formData.barangay;
    const hasSpecificAddress = formData.house_building_number || formData.street_name || formData.purok_block_lot;

    if (hasPSGCCode && !hasSpecificAddress) {
        console.log("Skipping geocoding: PSGC selected but no specific address details provided.");
        // Keep existing coordinates or clear them if desired
        // setFormData((prev) => ({ ...prev, latitude: "", longitude: "" }));
    } else if (fullAddress && fullAddress !== previousFullAddress) {
      // Only fetch if address is present and changed
      try {
        const coordinates = await fetchCoordinates(fullAddress);
        console.log("Geocoding result:", coordinates);
        if (coordinates && typeof coordinates.latitude === 'number' && typeof coordinates.longitude === 'number') {
          setFormData((prev) => ({
            ...prev,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          }));
        } else {
          console.warn("Geocoding did not return valid coordinates for:", fullAddress);
          // Keep old coordinates or clear them
          // setFormData((prev) => ({ ...prev, latitude: "", longitude: "" }));
        }
      } catch (geoError) {
        console.error("Error during geocoding:", geoError);
        // Optionally inform the user, but don't block the form
      }
    } else if (!fullAddress) {
         console.log("Skipping geocoding: Address is empty.");
    } else {
         console.log("Skipping geocoding: Address unchanged.");
    }

    setPreviousFullAddress(fullAddress); // Update previous address regardless of fetch attempt
    setIsFetchingCoordinates(false);
  };

  // Debounced version of fetchAndSetCoordinates
  const debouncedFetchCoordinates = useRef(
    debounce(fetchAndSetCoordinates, 700) // Slightly longer debounce
  ).current;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous submission errors

    // Re-validate ID just before submission
    if (!crimeReportId || !/^[0-9a-fA-F]{24}$/.test(crimeReportId)) {
        setError("Error: Cannot update report. Invalid ID.");
        alert("Error: Cannot update report. Invalid ID."); // Also alert user
        return;
    }

    console.log("Submitting Form Data:", JSON.stringify(formData, null, 2));

    try {
      const response = await fetch(`/api/crime-reports/${crimeReportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData), // Send the current formData
      });

      const result = await response.json();

      if (response.ok) {
        alert("Crime report updated successfully!");
        router.push("/ui/admin/view-crime"); // Navigate on success
      } else {
        // Provide more specific error from backend if available
        const errorMessage = result.error || 'Unknown error during update.';
        console.error("Update Error:", errorMessage);
        setError(`Error updating report: ${errorMessage}`);
        alert(`Error updating report: ${errorMessage}`);
      }
    } catch (submitError: any) {
      console.error("Error submitting update:", submitError);
      const message = `Update failed: ${submitError.message || 'Network error'}`;
      setError(message);
      alert(message);
    }
  };

  // --- Render Logic ---

  // Show loading indicator
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  // Show error message if loading failed (formData wouldn't have _id)
  if (error && !formData._id) {
    return (
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-red-900 border border-red-700 text-red-100 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-4">Error Loading Report</h2>
            <p>{error}</p>
            <button
                onClick={() => router.back()} // Go back button
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                Go Back
            </button>
        </div>
    );
  }

  // --- JSX Form ---
  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-800 text-white rounded-lg shadow-xl my-8">
      <h2 className="text-3xl font-bold mb-6 border-b border-gray-600 pb-2">
        Edit Crime Report <span className="text-sm text-gray-400">(ID: {crimeReportId})</span>
      </h2>

      {/* Display submission error messages */}
      {error && <div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-100 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Crime Details Section */}
        <fieldset className="border border-gray-600 p-4 rounded-md">
          <legend className="text-xl font-semibold px-2">Crime Details</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Use a reusable Input component later if desired */}
            <div>
              <label htmlFor="crime_id" className="block text-sm font-medium mb-1">Crime ID *</label>
              <input id="crime_id" type="text" name="crime_id" value={formData.crime_id || ""} onChange={handleChange} required className="w-full border p-2 rounded bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"/>
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-1">Date *</label>
              <input id="date" type="date" name="date" value={formData.date || ""} onChange={handleChange} required className="w-full border p-2 rounded bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"/>
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium mb-1">Time *</label>
              <input id="time" type="time" name="time" value={formData.time || ""} onChange={handleChange} required className="w-full border p-2 rounded bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"/>
            </div>
            <div>
              <label htmlFor="day_of_week" className="block text-sm font-medium mb-1">Day of the Week *</label>
              <input id="day_of_week" type="text" name="day_of_week" placeholder="e.g., Monday" value={formData.day_of_week || ""} onChange={handleChange} required className="w-full border p-2 rounded bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"/>
            </div>
            <div>
              <label htmlFor="crime_type" className="block text-sm font-medium mb-1">Crime Type *</label>
              <input id="crime_type" type="text" name="crime_type" placeholder="e.g., Theft" value={formData.crime_type || ""} onChange={handleChange} required className="w-full border p-2 rounded bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"/>
            </div>
            <div>
              <label htmlFor="crime_type_category" className="block text-sm font-medium mb-1">Crime Type Category *</label>
              <input id="crime_type_category" type="text" name="crime_type_category" placeholder="e.g., Property Crime" value={formData.crime_type_category || ""} onChange={handleChange} required className="w-full border p-2 rounded bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"/>
            </div>
            <div>
              <label htmlFor="case_status" className="block text-sm font-medium mb-1">Case Status *</label>
              <select id="case_status" name="case_status" value={formData.case_status || ""} onChange={handleChange} required className="w-full border p-2 rounded bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50">
                <option value="">Select Status</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Resolved">Resolved</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div>
              <label htmlFor="event_proximity" className="block text-sm font-medium mb-1">Event Proximity</label>
              <input id="event_proximity" type="text" name="event_proximity" placeholder="e.g., Near School" value={formData.event_proximity || ""} onChange={handleChange} className="w-full border p-2 rounded bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"/>
            </div>
             <div className="md:col-span-2"> {/* Span across 2 columns on medium screens */}
              <label htmlFor="crime_occurred_indoors_or_outdoors" className="block text-sm font-medium mb-1">Occurred Indoors/Outdoors *</label>
              <select id="crime_occurred_indoors_or_outdoors" name="crime_occurred_indoors_or_outdoors" value={formData.crime_occurred_indoors_or_outdoors || ""} onChange={handleChange} required className="w-full border p-2 rounded bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50">
                <option value="">Select Location Type</option>
                <option value="Indoors">Indoors</option>
                <option value="Outdoors">Outdoors</option>
              </select>
            </div>
          </div>
        </fieldset>

       {/* Location Details Section */}
       <fieldset className="border border-gray-600 p-4 rounded-md">
          <legend className="text-xl font-semibold px-2">Location Details (Do not Select if there is no changes)</legend>
          <div className="space-y-4">
             {/* --- Ensure you are passing the CODE fields here --- */}
             <LocationDropdown
                onSelect={handleLocationSelect}
                selectedRegionFromParent={formData.region || ""} // Should be the PSGC code
                selectedProvinceFromParent={formData.province || ""} // Should be the PSGC code
                selectedMunicipalityFromParent={formData.municipality_city || ""} // Should be the PSGC code
                selectedBarangayFromParent={formData.barangay || ""} // Should be the PSGC code
             />

             {/* Specific Address Fields */}
             <h3 className="font-semibold text-lg pt-4 border-t border-gray-700 mt-4">Specific Address</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label htmlFor="house_building_number" className="block text-sm font-medium mb-1">House/Building No.</label>
                 <input id="house_building_number" type="text" name="house_building_number" value={formData.house_building_number || ""} onChange={handleChange} className="w-full border p-2 rounded bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"/>
               </div>
               <div>
                 <label htmlFor="street_name" className="block text-sm font-medium mb-1">Street Name</label>
                 <input id="street_name" type="text" name="street_name" value={formData.street_name || ""} onChange={handleChange} className="w-full border p-2 rounded bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"/>
               </div>
               <div>
                 <label htmlFor="purok_block_lot" className="block text-sm font-medium mb-1">Purok/Block/Lot</label>
                 <input id="purok_block_lot" type="text" name="purok_block_lot" value={formData.purok_block_lot || ""} onChange={handleChange} className="w-full border p-2 rounded bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"/>
               </div>
               <div>
                 <label htmlFor="zip_code" className="block text-sm font-medium mb-1">Zip Code</label>
                 <input id="zip_code" type="text" name="zip_code" value={formData.zip_code || ""} onChange={handleChange} className="w-full border p-2 rounded bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"/>
               </div>
             </div>

             {/* Coordinates Display */}
             <div className="flex items-center justify-start space-x-4 mt-4 pt-4 border-t border-gray-700">
                <span className="font-medium">Coordinates:</span>
                {isFetchingCoordinates ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-400"></div>
                ) : formData.latitude && formData.longitude ? (
                    <span className="text-green-400 font-mono">
                    {/* Ensure coordinates are numbers before calling toFixed */}
                    {typeof formData.latitude === 'number' ? formData.latitude.toFixed(6) : formData.latitude}, {typeof formData.longitude === 'number' ? formData.longitude.toFixed(6) : formData.longitude}
                    </span>
                ) : (
                    <span className="text-gray-500">Not available</span>
                )}
             </div>
          </div>
        </fieldset>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || isFetchingCoordinates} // Disable while loading initial data or fetching coords
        >
          {isLoading ? 'Loading Report Data...' : (isFetchingCoordinates ? 'Fetching Coordinates...' : 'Update Crime Report')}
        </button>
      </form>
    </div>
  );
}
