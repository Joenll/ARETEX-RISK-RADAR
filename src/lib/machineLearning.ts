export default async function fetchMLPredictions(crimeId: string) {
    try {
        const response = await fetch(`http://localhost:5000/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ crime_id: crimeId }),
        });

        if (!response.ok) throw new Error("Failed to fetch ML predictions");
        return await response.json();
    } catch (error) {
        console.error("Error fetching ML predictions:", error);
        return null;
    }
}