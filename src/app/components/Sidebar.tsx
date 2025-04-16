// src/app/components/Sidebar.tsx
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaUsers,
  FaRegUserCircle,
} from "react-icons/fa";
// --- Cleaned up unused imports ---
import { FaFileCircleExclamation } from "react-icons/fa6";
import { MdOutlineDashboard } from "react-icons/md";

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // --- Determine Dashboard URL based on role ---
  const dashboardUrl = session?.user?.role === 'admin' ? '/ui/admin/dashboard' : '/ui/dashboard';

  // --- Updated isActive function to handle both dashboard paths ---
  const isActive = (href: string) => {
    // Special handling for dashboard link to match both admin/user paths
    if (href === '/ui/dashboard' || href === '/ui/admin/dashboard') {
      return pathname === '/ui/dashboard' || pathname === '/ui/admin/dashboard';
    }
    return pathname === href;
  };

  // Define a consistent color class for icons
  const iconColorClass = "text-orange-500";

  return (
    // Increased top padding significantly (pt-20) to push nav down
    <aside className="w-60 min-h-screen bg-gray-50 shadow-md flex flex-col fixed top-0 left-0 pt-20">
      {/* --- App Title/Logo REMOVED --- */}

      {/* Navigation Links */}
      {/* Adjusted mt-0 to keep links near the top (relative to the new padding) */}
      <nav className="flex-1 mt-0">
        {/* Adjusted padding/spacing */}
        <ul className="space-y-2">
          {/* Dashboard Link - Now conditional */}
          {session && (
            <li>
              <Link
                href={dashboardUrl} // Use the determined URL
                className={`flex items-center px-6 py-3 rounded-md transition-colors ${
                  // Use the determined URL for the active check
                  isActive(dashboardUrl)
                    ? "bg-gray-200 text-black font-semibold" // Reverted active style
                    : "text-gray-800 hover:bg-gray-100 hover:text-orange-500"
                }`}
              >
                <MdOutlineDashboard
                  className={`mr-3 ${iconColorClass}`} // Apply consistent icon color
                />
                <span>Dashboard</span>
              </Link>
            </li>
          )}

          {/* Admin Links */}
          {session?.user?.role === "admin" && (
            <>
              <li>
                <Link
                  href="/ui/admin/view-crime"
                  className={`flex items-center px-6 py-3 rounded-md transition-colors ${
                    isActive('/ui/admin/view-crime')
                      ? "bg-gray-200 text-black font-semibold" // Reverted active style
                      : "text-gray-800 hover:bg-gray-100 hover:text-orange-500"
                  }`}
                >
                  <FaFileCircleExclamation
                     className={`mr-3 ${iconColorClass}`} // Apply consistent icon color
                  />
                  <span>Crime Reports</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/ui/admin/user-management"
                  className={`flex items-center px-6 py-3 rounded-md transition-colors ${
                    isActive('/ui/admin/user-management')
                      ? "bg-gray-200 text-black font-semibold" // Reverted active style
                      : "text-gray-800 hover:bg-gray-100 hover:text-orange-500"
                  }`}
                >
                  <FaUsers
                     className={`mr-3 ${iconColorClass}`} // Apply consistent icon color
                  />
                  <span>User Management</span>
                </Link>
              </li>
            </>
          )}

          {/* Profile Link */}
          {session && (
            <li>
              <Link
                href="/ui/profile"
                className={`flex items-center px-6 py-3 rounded-md transition-colors ${
                  isActive('/ui/profile')
                    ? "bg-gray-200 text-black font-semibold" // Reverted active style
                    : "text-gray-800 hover:bg-gray-100 hover:text-orange-500"
                }`}
              >
                <FaRegUserCircle
                   className={`mr-3 ${iconColorClass}`} // Apply consistent icon color
                />
                <span>Profile</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}
