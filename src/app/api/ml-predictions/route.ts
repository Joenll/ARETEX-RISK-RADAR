import { NextRequest, NextResponse } from "next/server";
import fetchMLPredictions from "@/lib/machineLearning"; // Import function

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const crimeId = searchParams.get("crime_id");

    if (!crimeId) {
        return NextResponse.json({ error: "Missing crime_id" }, { status: 400 });
    }

    const mlData = await fetchMLPredictions(crimeId);
    if (!mlData) {
        return NextResponse.json({ error: "ML service unavailable" }, { status: 500 });
    }

    return NextResponse.json({ data: mlData }, { status: 200 });
}