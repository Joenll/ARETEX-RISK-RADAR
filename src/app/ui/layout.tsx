// src/app/ui/layout.tsx
import type { Metadata } from "next";
// Removed font imports as they are in the root layout
import "../globals.css";
import Sidebar from "../components/Sidebar"; // Import the new Sidebar component
// Removed SessionProvider import - it's correctly in the root layout

// Metadata can often be inherited or refined here if needed, but keep root simple
// export const metadata: Metadata = { ... };

export default function UILayout({ children }: { children: React.ReactNode }) {
  return (
    // Use flex for the overall layout
    <div className="flex min-h-screen">
      {/* Render the Sidebar */}
      <Sidebar />

      {/* Main content area */}
      {/* Add left margin/padding equal to the sidebar width */}
      <main className="flex-1 ml-60 p-4 md:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {children}
      </main>
    </div>
  );
}
