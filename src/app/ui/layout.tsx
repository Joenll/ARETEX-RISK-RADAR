// src/app/ui/layout.tsx
import type { Metadata } from "next";
import "../globals.css";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/Header"; // Import the header component (using the filename you provided)

// Metadata can often be inherited or refined here if needed, but keep root simple
// export const metadata: Metadata = { ... };

export default function UILayout({ children }: { children: React.ReactNode }) {
  return (
    // Use flex for the overall layout
    <div className="flex min-h-screen bg-gray-100"> {/* Added background color */}
      {/* Render the Sidebar (fixed position) */}
      <Sidebar />

      {/* Main content area wrapper */}
      {/* Add left margin equal to the sidebar width */}
      {/* Use flex-col to stack header and main content */}
      <div className="flex-1 flex flex-col ml-60"> {/* ml-60 matches sidebar width */}

        {/* Render the Dashboard Header (sticky) */}
        <DashboardHeader />

        {/* Main content area */}
        {/* Make it scrollable and add padding */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50"> {/* Changed bg to gray-50 */}
          {children}
        </main>
      </div>
    </div>
  );
}
