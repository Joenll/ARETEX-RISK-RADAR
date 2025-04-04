import axios from "axios";

const PSGC_API_BASE = "https://psgc.cloud/api";

export const getPSGCName = async (code: string): Promise<string | null> => {
  try {
    if (!code) {
      return null;
    }
    let endpoint = "";
    if (code.length === 2) {
      endpoint = `${PSGC_API_BASE}/regions/${code}`;
    } else if (code.length === 4) {
      endpoint = `${PSGC_API_BASE}/provinces/${code}`;
    } else if (code.length === 6) {
      endpoint = `${PSGC_API_BASE}/municipalities/${code}`;
    } else if (code.length === 9) {
      endpoint = `${PSGC_API_BASE}/barangays/${code}`;
    } else {
      return null; // Invalid code length
    }

    const response = await axios.get(endpoint);
    return response.data.name;
  } catch (error) {
    console.error(`Error fetching PSGC name for code ${code}:`, error);
    return null;
  }
};
