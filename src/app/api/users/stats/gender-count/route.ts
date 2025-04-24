// src/app/api/users/stats/gender-count/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile"; // Assuming UserProfile has 'sex'
import { requireRole } from "@/middleware/authMiddleware";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
    await connectDB();

    // --- Authentication (Admin Only) ---
    const roleCheck = await requireRole(req, ["admin"]);
    if (roleCheck) return roleCheck;

    try {
        // --- Aggregation Pipeline ---
        const pipeline: mongoose.PipelineStage[] = [
            // 1. Optional: Match only users with a specific status if needed
            // { $match: { status: 'approved' } },

            // 2. Lookup UserProfile
            {
                $lookup: {
                    from: UserProfile.collection.name,
                    localField: "profile", // Field in User model linking to UserProfile
                    foreignField: "_id",   // _id field in UserProfile
                    as: "profileDetails"
                }
            },
            // 3. Unwind the profileDetails array
            {
                $unwind: {
                    path: "$profileDetails",
                    preserveNullAndEmptyArrays: true // Keep users even if profile lookup fails (they won't have 'sex')
                }
            },
            // 4. Group by the 'sex' field in the profile
            {
                $group: {
                    _id: "$profileDetails.sex", // Group by the value of the 'sex' field
                    count: { $sum: 1 }        // Count users in each group
                }
            },
            // 5. Handle potential null/_id (users without profile or sex field)
            {
                $project: {
                    _id: 0, // Exclude the default _id
                    gender: { $ifNull: ["$_id", "Unknown"] }, // Rename _id to gender, default null to "Unknown"
                    count: 1
                }
            },
             // 6. Optional: Sort results if needed
             { $sort: { gender: 1 } }
        ];

        console.log("Executing Gender Count Pipeline:", JSON.stringify(pipeline, null, 2));

        const genderCounts = await User.aggregate(pipeline);

        console.log("Found gender counts:", genderCounts);

        return NextResponse.json(genderCounts, { status: 200 });

    } catch (error) {
        console.error("--- Error Aggregating Gender Counts ---");
        console.error("Error Message:", error instanceof Error ? error.message : error);
        // Add stack trace in development for detailed debugging
        if (process.env.NODE_ENV === 'development' && error instanceof Error) {
            console.error("Stack Trace:", error.stack);
        }
        console.error("---------------------------------------");

        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: "Aggregation Error", details: errorMessage }, { status: 500 });
    }
}
