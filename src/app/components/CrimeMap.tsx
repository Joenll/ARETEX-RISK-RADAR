import { useEffect, useState } from "react";

const CrimeMap = () => {
  const [mapHtml, setMapHtml] = useState("");

  useEffect(() => {
    fetch("http://backend-api.com/api/crime-map") // Replace with actual API URL
      .then((response) => response.text())
      .then((html) => setMapHtml(html))
      .catch((error) => console.error("Error fetching crime map:", error));
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: mapHtml }} />;
};

export default CrimeMap;
