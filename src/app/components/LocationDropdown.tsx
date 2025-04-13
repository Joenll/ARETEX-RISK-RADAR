"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";

// --- Interfaces remain the same ---
interface Region { code: string; name: string; }
interface Province { code: string; name: string; }
interface City { code: string; name: string; }
interface Municipality { code: string; name: string; }
interface SubMunicipality { code: string; name: string; }
interface Barangay { code: string; name: string; }

interface LocationDropdownProps {
  onSelect: (name: string, value: string, nameValue: string) => void;
  selectedRegionFromParent: string;
  selectedProvinceFromParent: string;
  selectedMunicipalityFromParent: string;
  selectedBarangayFromParent: string;
}

const LocationDropdown = ({
  onSelect,
  selectedRegionFromParent,
  selectedProvinceFromParent,
  selectedMunicipalityFromParent,
  selectedBarangayFromParent,
}: LocationDropdownProps) => {
  // --- State for fetched data lists ---
  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  // Combine cities, municipalities, sub-municipalities into one list for the dropdown
  const [citiesAndMunicipalities, setCitiesAndMunicipalities] = useState<(City | Municipality | SubMunicipality)[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);

  // --- State for loading indicators ---
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(false);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);

  const API_BASE = "https://psgc.cloud/api";

  // --- Debugging: Log props on initial render and changes ---
  useEffect(() => {
    console.log("LocationDropdown Props Received (Codes):", {
        selectedRegionFromParent,
        selectedProvinceFromParent,
        selectedMunicipalityFromParent,
        selectedBarangayFromParent
    });
  }, [selectedRegionFromParent, selectedProvinceFromParent, selectedMunicipalityFromParent, selectedBarangayFromParent]);

  // --- Fetch Regions ---
  useEffect(() => {
    let isMounted = true; // Flag to prevent state update on unmounted component
    const fetchRegions = async () => {
      try {
        const res = await axios.get<Region[]>(`${API_BASE}/regions`);
        if (isMounted) {
            // Sort regions alphabetically by name
            setRegions(res.data.sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (err) {
        console.error("Error fetching regions:", err);
      }
    };
    fetchRegions();
    return () => { isMounted = false; }; // Cleanup function
  }, []); // Empty dependency array: runs only once on mount

  // --- Fetch Provinces (depends on selectedRegionFromParent prop) ---
  useEffect(() => {
    let isMounted = true;
    // Only fetch if a region code is provided
    if (!selectedRegionFromParent) {
      setProvinces([]); // Clear if no region selected
      return;
    }
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      setProvinces([]); // Clear previous list while fetching
      try {
        console.log(`Fetching provinces for region CODE: ${selectedRegionFromParent}`);
        // Use the region CODE prop for the API call
        const res = await axios.get<Province[]>(`${API_BASE}/regions/${selectedRegionFromParent}/provinces`);
        if (isMounted) {
            // Sort provinces alphabetically
            setProvinces(res.data.sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (err) {
        console.error("Error fetching provinces:", err);
        if (isMounted) setProvinces([]); // Clear on error
      } finally {
        if (isMounted) setIsLoadingProvinces(false);
      }
    };
    fetchProvinces();
    return () => { isMounted = false; }; // Cleanup
  }, [selectedRegionFromParent]); // Re-run when the region prop changes

  // --- Fetch Cities/Municipalities (depends on selectedProvinceFromParent prop) ---
  useEffect(() => {
    let isMounted = true;
    // Only fetch if a province code is provided
    if (!selectedProvinceFromParent) {
      setCitiesAndMunicipalities([]); // Clear if no province selected
      return;
    }
    const fetchCitiesMunicipalities = async () => {
      setIsLoadingMunicipalities(true);
      setCitiesAndMunicipalities([]); // Clear previous list
      try {
        console.log(`Fetching municipalities/cities for province CODE: ${selectedProvinceFromParent}`);
        // Corrected: Fetch based on province code
        const [citiesRes, municipalitiesRes, subMunicipalitiesRes] = await Promise.all([
          axios.get<City[]>(`${API_BASE}/provinces/${selectedProvinceFromParent}/cities`),
          axios.get<Municipality[]>(`${API_BASE}/provinces/${selectedProvinceFromParent}/municipalities`),
          axios.get<SubMunicipality[]>(`${API_BASE}/provinces/${selectedProvinceFromParent}/sub-municipalities`)
        ]);
        if (isMounted) {
            // Combine and sort alphabetically
            const combined = [
                ...citiesRes.data,
                ...municipalitiesRes.data,
                ...subMunicipalitiesRes.data
            ].sort((a, b) => a.name.localeCompare(b.name));
            setCitiesAndMunicipalities(combined);
        }
      } catch (err) {
        console.error("Error fetching cities/municipalities:", err);
        if (isMounted) setCitiesAndMunicipalities([]); // Clear on error
      } finally {
        if (isMounted) setIsLoadingMunicipalities(false);
      }
    };
    fetchCitiesMunicipalities();
    return () => { isMounted = false; }; // Cleanup
  }, [selectedProvinceFromParent]); // Re-run when the province prop changes

  // --- Fetch Barangays (depends on selectedMunicipalityFromParent prop) ---
  useEffect(() => {
    let isMounted = true;
    // Only fetch if a municipality/city code is provided
    if (!selectedMunicipalityFromParent) {
      setBarangays([]); // Clear if no municipality/city selected
      return;
    }
    const fetchBarangays = async () => {
      setIsLoadingBarangays(true);
      setBarangays([]); // Clear previous list
      try {
        console.log(`Fetching barangays for municipality/city CODE: ${selectedMunicipalityFromParent}`);

        let foundBarangays: Barangay[] = [];
        // Try fetching from different endpoints as the type isn't known directly
        const endpointsToTry = [
            `${API_BASE}/cities/${selectedMunicipalityFromParent}/barangays`,
            `${API_BASE}/municipalities/${selectedMunicipalityFromParent}/barangays`,
            `${API_BASE}/sub-municipalities/${selectedMunicipalityFromParent}/barangays`
        ];

        for (const endpoint of endpointsToTry) {
            try {
                // Optional: Add a small delay if rate limiting is severe
                // await new Promise(resolve => setTimeout(resolve, 100));
                const res = await axios.get<Barangay[]>(endpoint);
                if (res.data && res.data.length > 0) {
                    // Sort barangays alphabetically
                    foundBarangays = res.data.sort((a, b) => a.name.localeCompare(b.name));
                    console.log(`Found barangays using endpoint: ${endpoint}`);
                    break; // Found data, no need to try other endpoints
                }
            } catch (innerErr: any) {
                // Ignore 404 Not Found errors, log others
                if (innerErr.response?.status !== 404) {
                    console.warn(`Warn checking endpoint ${endpoint}:`, innerErr.message);
                }
            }
        }

        if (isMounted) {
            setBarangays(foundBarangays);
            if (foundBarangays.length === 0) {
                 console.warn(`Could not find barangays for code ${selectedMunicipalityFromParent} using any endpoint.`);
            }
        }

      } catch (err) {
        console.error(`Error in fetchBarangays logic for ${selectedMunicipalityFromParent}:`, err);
        if (isMounted) setBarangays([]); // Clear on outer error
      } finally {
        if (isMounted) setIsLoadingBarangays(false);
      }
    };
    fetchBarangays();
    return () => { isMounted = false; }; // Cleanup
  }, [selectedMunicipalityFromParent]); // Re-run when the municipality/city prop changes

  // --- Helper to find name by code from a list ---
  const findName = (code: string, list: { code: string; name: string }[]): string => {
    return list.find(item => item.code === code)?.name || "";
  };

  // --- Event Handlers (using useCallback for optimization) ---

  const handleRegionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    const newName = findName(newCode, regions);
    // Notify parent to update region and clear children
    onSelect("region", newCode, newName);
    onSelect("province", "", "");
    onSelect("municipality_city", "", "");
    onSelect("barangay", "", "");
  }, [regions, onSelect]); // Dependencies: list used and callback function

  const handleProvinceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    const newName = findName(newCode, provinces);
    // Notify parent to update province and clear children
    onSelect("province", newCode, newName);
    onSelect("municipality_city", "", "");
    onSelect("barangay", "", "");
  }, [provinces, onSelect]);

  const handleMunicipalityChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    const newName = findName(newCode, citiesAndMunicipalities); // Use combined list
    // Notify parent to update municipality/city and clear child
    onSelect("municipality_city", newCode, newName);
    onSelect("barangay", "", "");
  }, [citiesAndMunicipalities, onSelect]);

  const handleBarangayChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    const newName = findName(newCode, barangays);
    // Notify parent to update barangay
    onSelect("barangay", newCode, newName);
  }, [barangays, onSelect]);


  // --- Render ---
  return (
    <div className="space-y-4">
      {/* Region Dropdown */}
      <select
        name="region" // Add name attribute for consistency
        className="w-full border p-2 rounded bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50" // Use consistent styling
        value={selectedRegionFromParent} // Bind value directly to the prop
        onChange={handleRegionChange}
      >
        <option value="">Select Region</option>
        {regions.map((region) => (
          <option key={region.code} value={region.code}>
            {region.name}
          </option>
        ))}
      </select>

      {/* Province Dropdown */}
      <select
        name="province"
        className="w-full border p-2 rounded bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
        value={selectedProvinceFromParent} // Bind value directly to the prop
        onChange={handleProvinceChange}
        // Disable if parent region isn't selected, or if provinces are loading, or if regions haven't loaded yet
        disabled={!selectedRegionFromParent || isLoadingProvinces || regions.length === 0}
      >
        <option value="">{isLoadingProvinces ? 'Loading Provinces...' : 'Select Province'}</option>
        {provinces.map((province) => (
          <option key={province.code} value={province.code}>
            {province.name}
          </option>
        ))}
      </select>

      {/* Municipality/City Dropdown */}
      <select
        name="municipality_city"
        className="w-full border p-2 rounded bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
        value={selectedMunicipalityFromParent} // Bind value directly to the prop
        onChange={handleMunicipalityChange}
        // Disable if parent province isn't selected, or if municipalities are loading, or if provinces haven't loaded
        disabled={!selectedProvinceFromParent || isLoadingMunicipalities || provinces.length === 0}
      >
        <option value="">{isLoadingMunicipalities ? 'Loading Municipalities/Cities...' : 'Select Municipality/City'}</option>
        {citiesAndMunicipalities.map((municipality) => (
          <option key={municipality.code} value={municipality.code}>
            {municipality.name}
          </option>
        ))}
      </select>

      {/* Barangay Dropdown */}
      <select
        name="barangay"
        className="w-full border p-2 rounded bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
        value={selectedBarangayFromParent} // Bind value directly to the prop
        onChange={handleBarangayChange}
        // Disable if parent municipality isn't selected, or if barangays are loading, or if municipalities haven't loaded
        disabled={!selectedMunicipalityFromParent || isLoadingBarangays || citiesAndMunicipalities.length === 0}
      >
        <option value="">{isLoadingBarangays ? 'Loading Barangays...' : 'Select Barangay'}</option>
        {barangays.map((barangay) => (
          <option key={barangay.code} value={barangay.code}>
            {barangay.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LocationDropdown;
