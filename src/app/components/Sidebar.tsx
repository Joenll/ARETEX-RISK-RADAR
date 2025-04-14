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

  return (
    <aside className="w-60 min-h-screen bg-gray-50 shadow-md flex flex-col fixed top-0 left-0">
      {/* --- UPDATED App Title/Logo --- */}
      {/* Reduced padding slightly, adjusted image/text sizes */}
      <div className="flex items-center p-3 mb-4 border-b border-gray-200 h-16"> {/* Reduced p-4 to p-3 */}
        <img
          src="/riskradar.png"
          alt="Risk Radar Logo"
          className="h-8 mr-1" // Reduced height from h-9/h-10
        />
        <div className="flex items-center space-x-1">
          <img src="/aretex.png" alt="Aretex" className="h-3.5" /> {/* Reduced height from h-4/h-5 */}
          {/* Reduced font size from text-lg/text-xl */}
          <span className="text-base font-bold text-red-500 mt-1">RISK</span>
          <span className="text-base font-bold text-gray-800 mt-1">RADAR</span>
        </div>
      </div>
      {/* --- End UPDATED App Title/Logo --- */}


      {/* Navigation Links */}
      <nav className="flex-1 mt-0">
        <ul className="space-y-1 px-2">
          {/* Dashboard Link */}
          {session && (
            <li>
              <Link
                href="/ui/dashboard"
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                  isActive('/ui/dashboard')
                    ? "bg-gray-100 text-orange-500 font-semibold"
                    : "text-gray-800 hover:bg-gray-100 hover:text-orange-500"
                }`}
              >
                <FaTachometerAlt
                  className={`mr-3 ${isActive('/ui/dashboard') ? "text-orange-500" : "text-gray-600"}`}
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
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    isActive('/ui/admin/view-crime')
                      ? "bg-gray-100 text-orange-500 font-semibold"
                      : "text-gray-800 hover:bg-gray-100 hover:text-orange-500"
                  }`}
                >
                  <FaFileAlt
                     className={`mr-3 ${isActive('/ui/admin/view-crime') ? "text-orange-500" : "text-gray-600"}`}
                  />
                  <span>View Reports</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/ui/admin/user-management"
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    isActive('/ui/admin/user-management')
                      ? "bg-gray-100 text-orange-500 font-semibold"
                      : "text-gray-800 hover:bg-gray-100 hover:text-orange-500"
                  }`}
                >
                  <FaUsers
                     className={`mr-3 ${isActive('/ui/admin/user-management') ? "text-orange-500" : "text-gray-600"}`}
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
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                  isActive('/ui/profile')
                    ? "bg-gray-100 text-orange-500 font-semibold"
                    : "text-gray-800 hover:bg-gray-100 hover:text-orange-500"
                }`}
              >
                <FaUserCircle
                   className={`mr-3 ${isActive('/ui/profile') ? "text-orange-500" : "text-gray-600"}`}
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
