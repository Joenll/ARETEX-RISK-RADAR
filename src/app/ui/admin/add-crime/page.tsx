"use client";

import { useState, useEffect, useRef } from "react";
import { fetchCoordinates } from "@/app/utils/geocoder";
import { isPSGCCode } from "@/app/utils/ispsgc";
import LocationDropdown from "@/app/components/LocationDropdown";


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
    latitude: "" as string | number, // Change the type to string | number
    longitude: "" as string | number, // Change the type to string | number
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

  // Handle input changes
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

  // Handle location dropdown selection
  const handleLocationSelect = async (
    name: string,
    value: string,
    nameValue: string
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value, [`${name}_name`]: nameValue }));
    debouncedFetchCoordinates();
  };

  // Function to fetch coordinates
  const fetchAndSetCoordinates = async () => {
    setIsFetchingCoordinates(true);
    // Construct the address parts, prioritizing dropdown selections
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

    // Filter out empty strings and join with commas
    let fullAddress = addressParts.filter(Boolean).join(", ").trim();
    console.log("Full Address:", fullAddress);

    // Check if the address is a PSGC code
    if (
      isPSGCCode(formData.region) ||
      isPSGCCode(formData.province) ||
      isPSGCCode(formData.municipality_city) ||
      isPSGCCode(formData.barangay)
    ) {
      console.log("Skipping geocoding for PSGC code:", fullAddress);
      setFormData((prev) => ({
        ...prev,
        latitude: "",
        longitude: "",
      }));
    } else {
      // Check if we have a valid address before fetching coordinates
      if (fullAddress !== "" && fullAddress !== previousFullAddress) {
        const coordinates = await fetchCoordinates(fullAddress);
        console.log("Coordinates:", coordinates);
        if (coordinates) {
          setFormData((prev) => ({
            ...prev,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          }));
        }
      }
    }
    setPreviousFullAddress(fullAddress);
    setIsFetchingCoordinates(false);
  };

  // Debounced version of fetchAndSetCoordinates
  const debouncedFetchCoordinates = useRef(
    debounce(fetchAndSetCoordinates, 500)
  ).current;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Data BEFORE stringify:", formData); // Add this line
  
    try {
      const jsonString = JSON.stringify(formData);
      console.log("JSON String:", jsonString); // Add this line
  
      const response = await fetch("/api/crime-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonString,
      });

      const result = await response.json();
      if (response.ok) {
        alert("Crime report submitted successfully!");
        setFormData({
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
          latitude: "",
          longitude: "",
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
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error submitting crime report:", error);
      alert("Submission failed.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-black rounded-md shadow-md">
      <h2 className="text-2xl font-bold mb-4">Report a Crime</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Crime Details */}
        <div className="border p-4 rounded-md">
          <h3 className="font-semibold mb-2">Crime Details</h3>
          <input
            type="text"
            name="crime_id"
            placeholder="Crime ID"
            value={formData.crime_id}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded mb-2"
          />
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded mb-2"
          />
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded mb-2"
          />
          <input
            type="text"
            name="day_of_week"
            placeholder="Day of the Week"
            value={formData.day_of_week}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded mb-2"
          />
          <input
            type="text"
            name="crime_type"
            placeholder="Crime Type"
            value={formData.crime_type}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded mb-2"
          />
          <input
            type="text"
            name="crime_type_category"
            placeholder="Crime Type Category"
            value={formData.crime_type_category}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded mb-2"
          />
          <select
            name="case_status"
            value={formData.case_status}
            onChange={handleChange}
            className="w-full border p-2 rounded bg-black text-white mb-2"
          >
            <option value="" className="bg-white text-black">
              Select Case Status
            </option>
            <option value="Ongoing" className="bg-white text-black">
              Ongoing
            </option>
            <option value="Resolved" className="bg-white text-black">
              Resolved
            </option>
            <option value="Pending" className="bg-white text-black">
              Pending
            </option>
          </select>
          <input
            type="text"
            name="event_proximity"
            placeholder="Event Proximity"
            value={formData.event_proximity}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-2"
          />
          <select
            name="crime_occurred_indoors_or_outdoors"
            value={formData.crime_occurred_indoors_or_outdoors}
            onChange={handleChange}
            className="w-full border p-2 rounded bg-black text-white mb-2"
          >
            <option value="" className="bg-white text-black">
              Select Location
            </option>
            <option value="Indoors" className="bg-white text-black">
              Indoors
            </option>
            <option value="Outdoors" className="bg-white text-black">
              Outdoors
            </option>
          </select>
        </div>

        {/* Location Details */}
        <div className="border p-4 rounded-md">
          <h3 className="font-semibold mb-2">Location Details</h3>

          {/* Location Dropdowns (Region, Province, Municipality, Barangay) */}
          <LocationDropdown
            onSelect={handleLocationSelect}
            selectedRegionFromParent={formData.region}
            selectedProvinceFromParent={formData.province}
            selectedMunicipalityFromParent={formData.municipality_city}
            selectedBarangayFromParent={formData.barangay}
          />

          {/* Additional Location Fields */}
          <h3 className="font-semibold mb-2 mt-2">Specific Address Details</h3>
          <input
            type="text"
            name="house_building_number"
            placeholder="House/Building Number"
            value={formData.house_building_number}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-2"
          />
          <input
            type="text"
            name="street_name"
            placeholder="Street Name"
            value={formData.street_name}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-2"
          />
          <input
            type="text"
            name="purok_block_lot"
            placeholder="Purok/Block/Lot"
            value={formData.purok_block_lot}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-2"
          />
          <input
            type="text"
            name="zip_code"
            placeholder="Zip Code"
            value={formData.zip_code}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-2"
          />
        </div>
        <div className="flex items-center justify-between mt-4">
          {isFetchingCoordinates && (
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
          )}
          {formData.latitude && formData.longitude && (
            <p>
              Coordinates: {formData.latitude}, {formData.longitude}
            </p>
          )}
        </div>
        {/* Submit Button */}
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4 w-full"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
