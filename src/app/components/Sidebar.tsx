// src/app/components/Sidebar.tsx
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaTachometerAlt,
  FaFileAlt,
  FaUsers,
  FaUserCircle,
} from "react-icons/fa";

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  // Define a consistent color class for icons - CHANGED TO GRAY-800
  const iconColorClass = "text-gray-800"; // Changed from text-orange-500

  return (
    // Increased top padding significantly (pt-20) to push nav down
    <aside className="w-60 min-h-screen bg-gray-50 shadow-md flex flex-col fixed top-0 left-0 pt-20">
      {/* --- App Title/Logo REMOVED --- */}

      {/* Navigation Links */}
      {/* Adjusted mt-0 to keep links near the top (relative to the new padding) */}
      <nav className="flex-1 mt-0">
        {/* Adjusted padding/spacing to match previous request */}
        <ul className="space-y-2">
          {/* Dashboard Link */}
          {session && (
            <li>
              <Link
                href="/ui/dashboard"
                className={`flex items-center px-6 py-3 rounded-md transition-colors ${
                  isActive('/ui/dashboard')
                    ? "bg-gray-100 text-orange-500 font-semibold" // Active text remains orange
                    : "text-gray-800 hover:bg-gray-100 hover:text-orange-500" // Non-active text is gray
                }`}
              >
                <FaTachometerAlt
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
                      ? "bg-gray-100 text-orange-500 font-semibold"
                      : "text-gray-800 hover:bg-gray-100 hover:text-orange-500"
                  }`}
                >
                  <FaFileAlt
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
                      ? "bg-gray-100 text-orange-500 font-semibold"
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
                    ? "bg-gray-100 text-orange-500 font-semibold"
                    : "text-gray-800 hover:bg-gray-100 hover:text-orange-500"
                }`}
              >
                <FaUserCircle
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
