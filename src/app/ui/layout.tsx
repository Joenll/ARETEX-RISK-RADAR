// src/app/ui/layout.tsx
"use client"; // Add this because we're using useState

import type { Metadata } from "next";
import "../globals.css";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/Header"; // Import the header component
import React, { useState } from 'react'; // Import useState

// export const metadata: Metadata = { ... }; // Metadata can be defined if needed, but keep "use client"

export default function UILayout({ children }: { children: React.ReactNode }) {
  // --- State for sidebar visibility ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default to open

  // Function to toggle the sidebar state
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Pass state and toggle function to Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col">
        {/* Header remains sticky */}
        <DashboardHeader />

        {/* Main content area */}
        {/* Apply conditional margin-left and transitions */}
        <main className={`flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50
                         transition-all duration-300 ease-in-out
                         ${isSidebarOpen ? 'ml-60' : 'ml-16'}`} // Adjust margin based on state
        >
          {children}
        </main>
      </div>
    </div>
  );
}
