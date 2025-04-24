import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CrimeReport from "@/models/CrimeReports"; // Adjust path if needed
import { requireRole } from "@/middleware/authMiddleware"; // Adjust path if needed
import mongoose from "mongoose"; // Import mongoose for PipelineStage type

// Define the allowed grouping types
type GroupByType = 'yearly' | 'monthly' | 'weekly';
const ALLOWED_GROUP_BY: GroupByType[] = ['yearly', 'monthly', 'weekly'];

// Define the structure of the aggregation result based on group type
interface YearlyResult { year: number; count: number; }
interface MonthlyResult { month: string; count: number; } // YYYY-MM
interface WeeklyResult { week: string; count: number; }   // YYYY-WW (ISO Week)
type AggregationResult = YearlyResult | MonthlyResult | WeeklyResult;

// Define the timezone consistently
const TIMEZONE = "UTC"; // Or your specific timezone like "Asia/Manila"

export async function GET(req: NextRequest) {
  await connectDB();

  // --- Authentication ---
  const roleCheck = await requireRole(req, ["admin"]);
  if (roleCheck) return roleCheck;

  try {
    const { searchParams } = req.nextUrl;
    const groupByParam = searchParams.get("groupBy")?.toLowerCase();

    // --- Input Validation for groupBy ---
    let groupBy: GroupByType = 'yearly'; // Default to yearly
    if (groupByParam && ALLOWED_GROUP_BY.includes(groupByParam as GroupByType)) {
      groupBy = groupByParam as GroupByType;
    } else if (groupByParam) {
        // If a groupBy param was provided but it's invalid
        return NextResponse.json(
            { error: `Invalid 'groupBy' parameter. Allowed values are: ${ALLOWED_GROUP_BY.join(', ')}.` },
            { status: 400 }
        );
    }

    console.log(`Fetching report stats grouped by: ${groupBy}`);

    // --- Dynamic Aggregation Pipeline Construction ---
    let groupStageId: any;
    let projectStage: any;
    let sortStage: any;
    let outputFieldName: string;

    switch (groupBy) {
      case 'monthly':
        groupStageId = {
          $dateToString: { format: "%Y-%m", date: "$date", timezone: TIMEZONE }
        };
        outputFieldName = 'month';
        projectStage = { _id: 0, month: "$_id", count: 1 };
        sortStage = { month: 1 as 1 | -1 };
        break;
      case 'weekly':
        groupStageId = {
          // %G is ISO Week Year, %V is ISO Week Number (01-53)
          $dateToString: { format: "%G-%V", date: "$date", timezone: TIMEZONE }
        };
        outputFieldName = 'week';
        projectStage = { _id: 0, week: "$_id", count: 1 };
        sortStage = { week: 1 as 1 | -1 };
        break;
      case 'yearly':
      default:
        groupStageId = {
          $year: { date: "$date", timezone: TIMEZONE }
        };
        outputFieldName = 'year';
        projectStage = { _id: 0, year: "$_id", count: 1 };
        sortStage = { year: 1 as 1 | -1 };
        break;
    }

    // Define the pipeline using mongoose types for better type checking
    const aggregationPipeline: mongoose.PipelineStage[] = [
      // Optional: Add a $match stage here to filter by date range,
      // especially useful for 'monthly' or 'weekly' to avoid processing all documents.
      // Example:
      // {
      //   $match: {
      //     date: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) } // Last 1 year
      //   }
      // },
      {
        $group: {
          _id: groupStageId,
          count: { $sum: 1 },
        },
      },
      {
        $project: projectStage,
      },
      {
        $sort: sortStage,
      },
    ];

    // --- Execute Aggregation ---
    // Specify the expected result type for better type safety
    const results: AggregationResult[] = await CrimeReport.aggregate<AggregationResult>(aggregationPipeline);

    console.log(`Aggregation results count (${groupBy}): ${results.length}`);
    // console.log(`Results (${groupBy}):`, results); // Keep logging minimal in production

    // --- Return Results ---
    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error(`Error fetching report stats grouped by ${req.nextUrl.searchParams.get("groupBy") || 'year'}:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Database Error", details: errorMessage },
      { status: 500 }
    );
  }
}
