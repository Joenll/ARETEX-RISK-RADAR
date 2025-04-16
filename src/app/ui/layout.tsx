// src/app/ui/layout.tsx
import type { Metadata } from "next";
import "../globals.css";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/Header"; // Import the header component

// export const metadata: Metadata = { ... };

export default function UILayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar remains fixed */}
      <Sidebar />

      {/* Content wrapper now takes full width (no margin) */}
      <div className="flex-1 flex flex-col"> {/* Removed ml-60 */}

        {/* Header remains sticky, now spans full width of its container */}
        {/* Ensure header has appropriate z-index if needed, though sticky usually handles it */}
        <DashboardHeader />

        {/* Main content area */}
        {/* Add padding-left equal to sidebar width */}
        {/* Make it scrollable and add other padding */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pl-[264px] md:pl-[272px] lg:pl-[288px] bg-gray-50"> {/* Added pl-60 + padding */}
          {/* Adjust pl value slightly if needed based on exact sidebar width + desired gap */}
          {/* Example: pl-[calc(15rem+1rem)] or pl-[256px] if sidebar is exactly w-60 (15rem = 240px) */}
          {/* Using pl-60 + p-4 = pl-[256px] -> pl-[264px] for md, pl-[272px] for lg */}
          {children}
        </main>
      </div>
    </div>
  );
}
