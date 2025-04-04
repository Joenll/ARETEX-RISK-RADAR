"use client";

import { useEffect, useState } from "react";
import axios from "axios";

// Define types for API responses
interface Region {
  code: string;
  name: string;
}

interface Province {
  code: string;
  name: string;
}

interface City {
  code: string;
  name: string;
}

interface Municipality {
  code: string;
  name: string;
}

interface SubMunicipality {
  code: string;
  name: string;
}

interface Barangay {
  code: string;
  name: string;
}

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
  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [subMunicipalities, setSubMunicipalities] = useState<SubMunicipality[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);

  const [selectedRegion, setSelectedRegion] = useState(selectedRegionFromParent);
  const [selectedProvince, setSelectedProvince] = useState(selectedProvinceFromParent);
  const [selectedMunicipality, setSelectedMunicipality] = useState(selectedMunicipalityFromParent);
  const [selectedBarangay, setSelectedBarangay] = useState(selectedBarangayFromParent);
  const [selectedRegionName, setSelectedRegionName] = useState("");
  const [selectedProvinceName, setSelectedProvinceName] = useState("");
  const [selectedMunicipalityName, setSelectedMunicipalityName] = useState("");
  const [selectedBarangayName, setSelectedBarangayName] = useState("");

  const API_BASE = "https://psgc.cloud/api"; // PSGC API Base
  const REGION_API = `${API_BASE}/regions`;

  // Update states when parent values change
  useEffect(() => {
    setSelectedRegion(selectedRegionFromParent);
  }, [selectedRegionFromParent]);

  useEffect(() => {
    setSelectedProvince(selectedProvinceFromParent);
  }, [selectedProvinceFromParent]);

  useEffect(() => {
    setSelectedMunicipality(selectedMunicipalityFromParent);
  }, [selectedMunicipalityFromParent]);

  useEffect(() => {
    setSelectedBarangay(selectedBarangayFromParent);
  }, [selectedBarangayFromParent]);

  // Helper function to clear child dropdowns
  const clearChildDropdowns = () => {
    setProvinces([]);
    setCities([]);
    setMunicipalities([]);
    setSubMunicipalities([]);
    setBarangays([]);
    setSelectedProvince("");
    setSelectedMunicipality("");
    setSelectedBarangay("");
    setSelectedProvinceName("");
    setSelectedMunicipalityName("");
    setSelectedBarangayName("");
    onSelect("province", "", "");
    onSelect("municipality_city", "", "");
    onSelect("barangay", "", "");
  };

  // Fetch Regions
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await axios.get<Region[]>(REGION_API);
        setRegions(res.data);
      } catch (err) {
        console.error("Error fetching regions:", err);
      }
    };
    fetchRegions();
  }, []);

  // Fetch Provinces when a Region is selected
  useEffect(() => {
    const fetchProvinces = async () => {
      if (selectedRegion) {
        try {
          const res = await axios.get<Province[]>(`${REGION_API}/${selectedRegion}/provinces`);
          setProvinces(res.data);
        } catch (err) {
          console.error("Error fetching provinces:", err);
        }
      } else {
        setProvinces([]);
      }
    };
    fetchProvinces();
  }, [selectedRegion]);

  // Fetch Cities and Municipalities when a Province is selected
  useEffect(() => {
    const fetchCitiesMunicipalities = async () => {
      if (selectedProvince && selectedRegion) {
        try {
          const citiesRes = await axios.get<City[]>(`${API_BASE}/regions/${selectedRegion}/cities`);
          setCities(citiesRes.data);

          const municipalitiesRes = await axios.get<Municipality[]>(
            `${API_BASE}/regions/${selectedRegion}/municipalities`
          );
          setMunicipalities(municipalitiesRes.data);

          const subMunicipalitiesRes = await axios.get<SubMunicipality[]>(
            `${API_BASE}/regions/${selectedRegion}/sub-municipalities`
          );
          setSubMunicipalities(subMunicipalitiesRes.data);
        } catch (err) {
          console.error(
            "Error fetching cities/municipalities and sub-municipalities:",
            err
          );
        }
      } else {
        setCities([]);
        setMunicipalities([]);
        setSubMunicipalities([]);
      }
    };
    fetchCitiesMunicipalities();
  }, [selectedProvince, selectedRegion]);

  // Fetch Barangays when a Municipality/City is selected. Uses a loading state.
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);
  useEffect(() => {
    const fetchBarangays = async () => {
      if (selectedMunicipality) {
        setIsLoadingBarangays(true); // Set loading state
        try {
          const isCity = cities.some((city) => city.code === selectedMunicipality);
          const isMunicipality = municipalities.some((muni) => muni.code === selectedMunicipality);
          const isSubMunicipality = subMunicipalities.some((sub) => sub.code === selectedMunicipality);

          let barangaysEndpoint = "";
          if (isCity) {
            barangaysEndpoint = `${API_BASE}/cities/${selectedMunicipality}/barangays`;
          } else if (isMunicipality) {
            barangaysEndpoint = `${API_BASE}/municipalities/${selectedMunicipality}/barangays`;
          } else if (isSubMunicipality) {
            barangaysEndpoint = `${API_BASE}/sub-municipalities/${selectedMunicipality}/barangays`;
          }

          if (barangaysEndpoint) {
            const res = await axios.get<Barangay[]>(barangaysEndpoint);
            setBarangays(res.data);
          } else {
            setBarangays([]);
          }
        } catch (err) {
          console.error("Error fetching barangays:", err);
        } finally {
          setIsLoadingBarangays(false); // Reset loading state
        }
      } else {
        setBarangays([]);
      }
    };
    fetchBarangays();
  }, [selectedMunicipality, cities, municipalities, subMunicipalities]);

  // Combine cities/municipalities and sub-municipalities for the dropdown
  const combinedMunicipalities = [...cities, ...municipalities, ...subMunicipalities];

  return (
    <div className="space-y-4">
      {/* Region Dropdown */}
      <select
        className="w-full border p-2 rounded bg-black text-white"
        value={selectedRegion}
        onChange={(e) => {
          const newRegionCode = e.target.value;
          const newRegion = regions.find((region) => region.code === newRegionCode);
          setSelectedRegion(newRegionCode);
          setSelectedRegionName(newRegion ? newRegion.name : "");
          clearChildDropdowns();
          onSelect("region", newRegionCode, newRegion ? newRegion.name : "");
        }}
      >
        <option value="" className="bg-white text-black">
          Select a Region
        </option>
        {regions.map((region) => (
          <option key={region.code} value={region.code} className="bg-white text-black">
            {region.name}
          </option>
        ))}
      </select>

      {/* Province Dropdown */}
      <select
        className="w-full border p-2 rounded bg-black text-white"
        value={selectedProvince}
        onChange={(e) => {
          const newProvinceCode = e.target.value;
          const newProvince = provinces.find((province) => province.code === newProvinceCode);
          setSelectedProvince(newProvinceCode);
          setSelectedProvinceName(newProvince ? newProvince.name : "");
          setSelectedMunicipality("");
          setSelectedBarangay("");
          setBarangays([]);
          onSelect("province", newProvinceCode, newProvince ? newProvince.name : "");
          onSelect("municipality_city", "", "");
          onSelect("barangay", "", "");
        }}
        disabled={!selectedRegion}
      >
        <option value="" className="bg-white text-black">
          Select a Province
        </option>
        {provinces.map((province) => (
          <option key={province.code} value={province.code} className="bg-white text-black">
            {province.name}
          </option>
        ))}
      </select>

      {/* Municipality Dropdown */}
      <select
        className="w-full border p-2 rounded bg-black text-white"
        value={selectedMunicipality}
        onChange={(e) => {
          const newMunicipalityCode = e.target.value;
          const newMunicipality = combinedMunicipalities.find((municipality) => municipality.code === newMunicipalityCode);
          setSelectedMunicipality(newMunicipalityCode);
          setSelectedMunicipalityName(newMunicipality ? newMunicipality.name : "");
          setSelectedBarangay("");
          setBarangays([]);
          onSelect("municipality_city", newMunicipalityCode, newMunicipality ? newMunicipality.name : "");
          onSelect("barangay", "", "");
        }}
        disabled={!selectedProvince}
      >
        <option value="" className="bg-white text-black">
          Select a Municipality/City
        </option>
        {combinedMunicipalities.map((municipality) => (
          <option
            key={municipality.code}
            value={municipality.code}
            className="bg-white text-black"
          >
            {municipality.name}
          </option>
        ))}
      </select>

      {/* Barangay Dropdown */}
      <select
        className="w-full border p-2 rounded bg-black text-white"
        value={selectedBarangay}
        onChange={(e) => {
          const newBarangayCode = e.target.value;
          const newBarangay = barangays.find((barangay) => barangay.code === newBarangayCode);
          setSelectedBarangay(newBarangayCode);
          setSelectedBarangayName(newBarangay ? newBarangay.name : "");
          onSelect("barangay", newBarangayCode, newBarangay ? newBarangay.name : "");
        }}
        disabled={!selectedMunicipality}
      >
        <option value="" className="bg-white text-black">
          Select a Barangay
        </option>
        {barangays.map((barangay) => (
          <option
            key={barangay.code}
            value={barangay.code}
            className="bg-white text-black"
          >
            {barangay.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LocationDropdown;
