"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import { fetchCoordinates } from "@/app/utils/geocoder";
import { isPSGCCode } from "@/app/utils/ispsgc";
import LocationDropdown from "@/app/components/LocationDropdown";
import Button from "@/app/components/Button";
import Swal from 'sweetalert2'; // Import SweetAlert2

// --- Define consistent input/select styling ---
const inputFieldStyles = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 text-sm";
const labelStyles = "block text-gray-700 text-sm font-bold mb-1"; // Added label styles
const selectStyles = `${inputFieldStyles} bg-white`; // Base select styles

// Debounce function
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

export default function CrimeReportForm() {
  const [formData, setFormData] = useState({
    crime_id: "",
    date: "",
    time: "",
    region: "",
    province: "",
    municipality_city: "",
    barangay: "",
    region_name: "",
    province_name: "",
    municipality_city_name: "",
    barangay_name: "",
    latitude: "" as string | number,
    longitude: "" as string | number,
    crime_type: "",
    crime_type_category: "",
    case_status: "",
    event_proximity: "",
    crime_occurred_indoors_or_outdoors: "",
    house_building_number: "",
    street_name: "",
    purok_block_lot: "",
    zip_code: "",
    day_of_week: "",
  });
  const [isFetchingCoordinates, setIsFetchingCoordinates] = useState(false);
  const [previousFullAddress, setPreviousFullAddress] = useState("");
  // Removed error and success state, handled by SweetAlert
  // const [error, setError] = useState<string | null>(null);
  // const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Add loading state for submission
  const router = useRouter(); // Initialize router

  // Handle input changes (remains the same)
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Trigger coordinate fetching for manual input fields
    if (
      e.target.name === "house_building_number" ||
      e.target.name === "street_name" ||
      e.target.name === "purok_block_lot" ||
      e.target.name === "zip_code"
    ) {
      debouncedFetchCoordinates();
    }
  };

  // Handle location dropdown selection (remains the same)
  const handleLocationSelect = async (
    name: string,
    value: string,
    nameValue: string
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value, [`${name}_name`]: nameValue }));
    debouncedFetchCoordinates();
  };

  // Function to fetch coordinates (remains the same)
  const fetchAndSetCoordinates = async () => {
    setIsFetchingCoordinates(true);
    const addressParts = [
      formData.house_building_number,
      formData.street_name,
      formData.purok_block_lot,
      formData.barangay_name,
      formData.municipality_city_name,
      formData.province_name,
      formData.zip_code,
      formData.region_name,
    ];
    let fullAddress = addressParts.filter(Boolean).join(", ").trim();
    console.log("Full Address:", fullAddress);

    if (
      isPSGCCode(formData.region) ||
      isPSGCCode(formData.province) ||
      isPSGCCode(formData.municipality_city) ||
      isPSGCCode(formData.barangay)
    ) {
      console.log("Skipping geocoding for PSGC code:", fullAddress);
      setFormData((prev) => ({ ...prev, latitude: "", longitude: "" }));
    } else {
      if (fullAddress !== "" && fullAddress !== previousFullAddress) {
        const coordinates = await fetchCoordinates(fullAddress);
        console.log("Coordinates:", coordinates);
        if (coordinates) {
          setFormData((prev) => ({
            ...prev,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          }));
        } else {
           setFormData((prev) => ({ ...prev, latitude: "", longitude: "" }));
        }
      } else if (fullAddress === "") {
          setFormData((prev) => ({ ...prev, latitude: "", longitude: "" }));
      }
    }
    setPreviousFullAddress(fullAddress);
    setIsFetchingCoordinates(false);
  };

  // Debounced version of fetchAndSetCoordinates (remains the same)
  const debouncedFetchCoordinates = useRef(
    debounce(fetchAndSetCoordinates, 500)
  ).current;

  // --- UPDATED Handle form submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // Set loading state for submission
    // Removed setError and setSuccess

    console.log("Form Data BEFORE stringify:", formData);

    // Basic validation example (add more as needed)
    if (!formData.crime_id || !formData.date || !formData.time || !formData.crime_type) {
        // Use SweetAlert for validation error
        Swal.fire({
            icon: 'error',
            title: 'Missing Information',
            text: 'Please fill in all required Crime Details (*).',
        });
        setIsLoading(false);
        return;
    }
    if (!formData.region || !formData.province || !formData.municipality_city || !formData.barangay) {
        // Use SweetAlert for validation error
        Swal.fire({
            icon: 'error',
            title: 'Missing Location',
            text: 'Please select the full location (Region, Province, Municipality/City, Barangay).',
        });
        setIsLoading(false);
        return;
    }

    try {
      const jsonString = JSON.stringify(formData);
      console.log("JSON String:", jsonString);

      const response = await fetch("/api/crime-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonString,
      });

      const result = await response.json();

      if (response.ok) {
        // Use SweetAlert for success
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Crime report submitted successfully!',
          timer: 2000, // Auto close after 2 seconds
          showConfirmButton: false,
        });

        // Reset form
        setFormData({
          crime_id: "", date: "", time: "", region: "", province: "", municipality_city: "", barangay: "",
          region_name: "", province_name: "", municipality_city_name: "", barangay_name: "",
          latitude: "", longitude: "", crime_type: "", crime_type_category: "", case_status: "",
          event_proximity: "", crime_occurred_indoors_or_outdoors: "", house_building_number: "",
          street_name: "", purok_block_lot: "", zip_code: "", day_of_week: "",
        });
        // Optionally redirect after success alert closes
        // setTimeout(() => router.push('/ui/admin/view-crime'), 2100);

      } else {
        // Handle specific errors like duplicates or general failure
        let errorMessage = result.message || result.error || "Failed to submit crime report.";
        // Check for duplicate ID error (adjust status code/message as needed)
        if (response.status === 409 || errorMessage.toLowerCase().includes('duplicate') || errorMessage.toLowerCase().includes('exists')) {
            errorMessage = `Crime report with ID "${formData.crime_id}" already exists. Please use a unique ID.`;
        }
        throw new Error(errorMessage); // Throw error to be caught below
      }
    } catch (error: any) {
      console.error("Error submitting crime report:", error);
      // Use SweetAlert for submission errors
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
        setIsLoading(false); // Clear loading state
    }
  };
  // --- END UPDATED handleSubmit ---

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 max-w-3xl mx-auto">
       {/* Back Button */}
       <button
            onClick={() => router.back()}
            className="mb-4 text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
        </button>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Report a Crime</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Removed Error/Success Message Display */}
        {/* {error && <p className="text-center text-sm text-red-700 bg-red-50 p-3 rounded-md">{error}</p>} */}
        {/* {success && <p className="text-center text-sm text-green-700 bg-green-50 p-3 rounded-md">{success}</p>} */}

        {/* Crime Details (remains the same) */}
        <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-lg font-semibold px-2 text-gray-700">Crime Details</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                    <label htmlFor="crime_id" className={labelStyles}>Crime ID <span className="text-red-500">*</span></label>
                    <input type="text" id="crime_id" name="crime_id" placeholder="e.g., CR-2024-001" value={formData.crime_id} onChange={handleChange} required className={inputFieldStyles} />
                </div>
                <div>
                    <label htmlFor="date" className={labelStyles}>Date <span className="text-red-500">*</span></label>
                    <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className={inputFieldStyles} />
                </div>
                <div>
                    <label htmlFor="time" className={labelStyles}>Time <span className="text-red-500">*</span></label>
                    <input type="time" id="time" name="time" value={formData.time} onChange={handleChange} required className={inputFieldStyles} />
                </div>
                <div>
                    <label htmlFor="day_of_week" className={labelStyles}>Day of Week <span className="text-red-500">*</span></label>
                    <input type="text" id="day_of_week" name="day_of_week" placeholder="e.g., Monday" value={formData.day_of_week} onChange={handleChange} required className={inputFieldStyles} />
                </div>
                <div>
                    <label htmlFor="crime_type" className={labelStyles}>Crime Type <span className="text-red-500">*</span></label>
                    <input type="text" id="crime_type" name="crime_type" placeholder="e.g., Theft" value={formData.crime_type} onChange={handleChange} required className={inputFieldStyles} />
                </div>
                <div>
                    <label htmlFor="crime_type_category" className={labelStyles}>Crime Category <span className="text-red-500">*</span></label>
                    <input type="text" id="crime_type_category" name="crime_type_category" placeholder="e.g., Property Crime" value={formData.crime_type_category} onChange={handleChange} required className={inputFieldStyles} />
                </div>
                <div>
                    <label htmlFor="case_status" className={labelStyles}>Case Status</label>
                    <select id="case_status" name="case_status" value={formData.case_status} onChange={handleChange} className={selectStyles}>
                        <option value="">Select Status</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Pending">Pending</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="event_proximity" className={labelStyles}>Event Proximity</label>
                    <input type="text" id="event_proximity" name="event_proximity" placeholder="e.g., Near School" value={formData.event_proximity} onChange={handleChange} className={inputFieldStyles} />
                </div>
                <div>
                    <label htmlFor="crime_occurred_indoors_or_outdoors" className={labelStyles}>Occurred</label>
                    <select id="crime_occurred_indoors_or_outdoors" name="crime_occurred_indoors_or_outdoors" value={formData.crime_occurred_indoors_or_outdoors} onChange={handleChange} className={selectStyles}>
                        <option value="">Select Location Type</option>
                        <option value="Indoors">Indoors</option>
                        <option value="Outdoors">Outdoors</option>
                    </select>
                </div>
            </div>
        </fieldset>

        {/* Location Details (remains the same) */}
        <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-lg font-semibold px-2 text-gray-700">Location Details</legend>
            <div className="space-y-4 pt-2">
                <LocationDropdown
                    onSelect={handleLocationSelect}
                    selectedRegionFromParent={formData.region}
                    selectedProvinceFromParent={formData.province}
                    selectedMunicipalityFromParent={formData.municipality_city}
                    selectedBarangayFromParent={formData.barangay}
                />
                <h4 className="font-medium text-gray-600 pt-2">Specific Address Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="house_building_number" className={labelStyles}>House/Bldg No.</label>
                        <input type="text" id="house_building_number" name="house_building_number" placeholder="e.g., 123" value={formData.house_building_number} onChange={handleChange} className={inputFieldStyles} />
                    </div>
                    <div>
                        <label htmlFor="street_name" className={labelStyles}>Street Name</label>
                        <input type="text" id="street_name" name="street_name" placeholder="e.g., Main St" value={formData.street_name} onChange={handleChange} className={inputFieldStyles} />
                    </div>
                    <div>
                        <label htmlFor="purok_block_lot" className={labelStyles}>Purok/Block/Lot</label>
                        <input type="text" id="purok_block_lot" name="purok_block_lot" placeholder="e.g., Block 5" value={formData.purok_block_lot} onChange={handleChange} className={inputFieldStyles} />
                    </div>
                    <div>
                        <label htmlFor="zip_code" className={labelStyles}>Zip Code</label>
                        <input type="text" id="zip_code" name="zip_code" placeholder="e.g., 1000" value={formData.zip_code} onChange={handleChange} className={inputFieldStyles} />
                    </div>
                </div>
                <div className="flex items-center justify-start space-x-3 pt-2 min-h-[30px]">
                    {isFetchingCoordinates && (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                    )}
                    {formData.latitude && formData.longitude ? (
                        <p className="text-sm text-gray-600">
                        Coordinates: {Number(formData.latitude).toFixed(6)}, {Number(formData.longitude).toFixed(6)}
                        </p>
                    ) : !isFetchingCoordinates && (formData.house_building_number || formData.street_name || formData.barangay_name) ? (
                        <p className="text-sm text-orange-600">Could not determine coordinates.</p>
                    ) : null}
                </div>
            </div>
        </fieldset>

        {/* Action Buttons (remains the same) */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex gap-3 justify-end">
            <Button
                type="button"
                variant="back"
                onClick={() => router.back()}
                disabled={isLoading}
            >
                Cancel
            </Button>
            <Button
                type="submit"
                variant="submit"
                className="min-w-[120px]"
                isLoading={isLoading}
                disabled={isLoading}
            >
                {isLoading ? 'Submitting...' : 'Submit Report'}
            </Button>
        </div>
      </form>
    </div>
  );
}
