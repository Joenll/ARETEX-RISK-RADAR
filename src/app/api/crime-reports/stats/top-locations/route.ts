import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CrimeReport from "@/models/CrimeReports"; // Your CrimeReport model
import Location from "@/models/location"; // Your Location model
import mongoose from "mongoose";
import { requireRole } from "@/middleware/authMiddleware"; // Keep authentication

// --- UPDATED: Define valid grouping fields ---
type GroupByField = 'municipality_city' | 'barangay' | 'province'; // Added 'province'
const ALLOWED_GROUP_BY: GroupByField[] = ['municipality_city', 'barangay', 'province']; // Added 'province'

export async function GET(req: NextRequest) {
    await connectDB();

    // --- Authentication ---
    const roleCheck = await requireRole(req, ["admin"]);
    if (roleCheck) return roleCheck;

    try {
        const { searchParams } = req.nextUrl;

        // --- Parameters ---
        const startDate = searchParams.get("start_date");
        const endDate = searchParams.get("end_date");
        const limitParam = searchParams.get("limit") || "10"; // Default to top 10
        const groupByParam = searchParams.get("groupBy") as GroupByField | null;

        // --- UPDATED: Validate and set the grouping field ---
        let groupByField: GroupByField = 'municipality_city'; // Default
        if (groupByParam && ALLOWED_GROUP_BY.includes(groupByParam)) { // Check against updated array
            groupByField = groupByParam;
        } else if (groupByParam) {
            // If a groupBy param was provided but it's invalid
            return NextResponse.json(
                // Updated error message
                { error: `Invalid 'groupBy' parameter. Allowed values are: ${ALLOWED_GROUP_BY.join(', ')}.` },
                { status: 400 }
            );
        }
        console.log(`Grouping by: ${groupByField}`);

        // --- Build the initial $match stage for filtering CrimeReports ---
        const matchStage: mongoose.FilterQuery<any> = {};

        // Date range filter (logic remains the same)
        if (startDate || endDate) {
            matchStage.date = {};
            if (startDate) { /* ... */ }
            if (endDate) { /* ... */ }
            if (matchStage.date && Object.keys(matchStage.date).length === 0) {
                delete matchStage.date;
            }
        }
        // --- End Filter Building ---

        // --- Aggregation Pipeline (The pipeline itself handles the dynamic field) ---
        const pipeline: mongoose.PipelineStage[] = [
            // 1. Initial Match (e.g., date)
            { $match: matchStage },

            // 2. Lookup Location
            {
                $lookup: {
                    from: Location.collection.name,
                    localField: "location",
                    foreignField: "_id",
                    as: "locationDetails"
                }
            },

            // 3. Unwind Location Details
            {
                $unwind: {
                    path: "$locationDetails",
                    preserveNullAndEmptyArrays: true
                }
            },

            // 4. Filter out docs with missing/invalid location or grouping field
            // This stage now correctly handles 'province' if it exists in the Location schema
            {
                $match: {
                    [`locationDetails.${groupByField}`]: { $exists: true, $ne: null },
                    $expr: { $ne: [`$locationDetails.${groupByField}`, ""] }
                }
            },

            // 5. Group by the specified location field
            {
                $group: {
                    _id: `$locationDetails.${groupByField}`, // Correctly uses 'province' if passed
                    count: { $sum: 1 }
                }
            },

            // 6. Sort by count descending
            { $sort: { count: -1 } },

            // 7. Limit the results
            { $limit: parseInt(limitParam, 10) },

            // 8. Project the final output shape
            {
                $project: {
                    _id: 0,
                    locationName: "$_id",
                    count: 1
                }
            }
        ];
        // --- End Aggregation Pipeline ---

        console.log("Executing Top Locations Pipeline:", JSON.stringify(pipeline, null, 2));

        // Execute the aggregation pipeline
        const topLocations = await CrimeReport.aggregate(pipeline);

        console.log(`Found ${topLocations.length} aggregated top locations.`);

        return NextResponse.json(topLocations, { status: 200 });

    } catch (error) {
        console.error("--- Error Aggregating Top Locations ---");
        console.error("Error Message:", error instanceof Error ? error.message : error);
        if (process.env.NODE_ENV === 'development' && error instanceof Error) {
            console.error("Stack Trace:", error.stack);
        }
        console.error("---------------------------------------");

        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: "Aggregation Error", details: errorMessage }, { status: 500 });
    }
}
