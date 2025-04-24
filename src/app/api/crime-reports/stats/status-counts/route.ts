// src/app/api/crime-reports/stats/status-count/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CrimeReport from "@/models/CrimeReports"; // Your CrimeReport model
import { requireRole } from "@/middleware/authMiddleware";
import mongoose from "mongoose";

// Define the normalized status categories we want
type NormalizedStatus = "Ongoing" | "Pending" | "Resolved" | "Unknown";

export async function GET(req: NextRequest) {
    await connectDB();

    // --- Authentication (Admin Only) ---
    const roleCheck = await requireRole(req, ["admin"]);
    if (roleCheck) return roleCheck;

    try {
        // --- Aggregation Pipeline ---
        const pipeline: mongoose.PipelineStage[] = [
            // 1. Group by a normalized status
            {
                $group: {
                    _id: {
                        // Use $switch to map different status strings to normalized categories
                        $switch: {
                            branches: [
                                {
                                    case: { $in: ["$case_status", ["Under Investigation", "Ongoing"]] },
                                    then: "Ongoing" // Normalize both to "Ongoing"
                                },
                                {
                                    case: { $in: ["$case_status", ["Pending", "Open"]] },
                                    then: "Pending" // Normalize both to "Pending"
                                },
                                {
                                    case: { $in: ["$case_status", ["Closed", "Resolved"]] },
                                    then: "Resolved" // Normalize both to "Resolved"
                                }
                            ],
                            default: "Unknown" // Group any other statuses as "Unknown"
                        }
                    },
                    count: { $sum: 1 } // Count reports in each normalized group
                }
            },
            // 2. Project the final output shape
            {
                $project: {
                    _id: 0, // Exclude the default _id
                    status: "$_id", // Rename _id (which is the normalized status) to status
                    count: 1
                }
            },
             // 3. Optional: Sort results for consistency
             { $sort: { status: 1 } }
        ];

        console.log("Executing Status Count Pipeline:", JSON.stringify(pipeline, null, 2));

        const statusCounts = await CrimeReport.aggregate(pipeline);

        console.log("Found status counts:", statusCounts);

        // Ensure all expected statuses are present, even if count is 0
        const expectedStatuses: NormalizedStatus[] = ["Ongoing", "Pending", "Resolved", "Unknown"];
        const finalCounts = expectedStatuses.map(status => {
            const found = statusCounts.find(item => item.status === status);
            return { status: status, count: found ? found.count : 0 };
        }).filter(item => item.status !== 'Unknown' || item.count > 0); // Only include Unknown if it has counts

        return NextResponse.json(finalCounts, { status: 200 });

    } catch (error) {
        console.error("--- Error Aggregating Status Counts ---");
        console.error("Error Message:", error instanceof Error ? error.message : error);
        if (process.env.NODE_ENV === 'development' && error instanceof Error) {
            console.error("Stack Trace:", error.stack);
        }
        console.error("---------------------------------------");

        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: "Aggregation Error", details: errorMessage }, { status: 500 });
    }
}
