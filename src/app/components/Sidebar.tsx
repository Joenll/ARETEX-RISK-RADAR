"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// Removed useState import
import {
  FaUsers,
  FaRegUserCircle,
  FaChevronLeft, // Icon for collapse
  FaChevronRight, // Icon for expand
} from "react-icons/fa";
import { FaFileCircleExclamation } from "react-icons/fa6";
import { MdOutlineDashboard } from "react-icons/md";

// --- NEW: Define props for Sidebar ---
interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

// --- Accept props ---
export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  // Removed internal isOpen state and toggle function

  // --- Determine Dashboard URL based on role ---
  const dashboardUrl = session?.user?.role === 'admin' ? '/ui/admin/dashboard' : '/ui/dashboard';

  // --- isActive function remains the same ---
  const isActive = (href: string) => {
    if (href === dashboardUrl) {
       return pathname === '/ui/dashboard' || pathname === '/ui/admin/dashboard';
    }
    return pathname === href;
  };

  // Define a consistent color class for icons
  const iconColorClass = "text-orange-500";

  // toggleSidebar function is now passed via props

  return (
    // Use the isOpen prop for conditional styling
    <aside
      className={`
        min-h-screen bg-gray-50 shadow-md flex flex-col fixed top-0 left-0 pt-20 z-30
        transition-all duration-300 ease-in-out
        ${isOpen ? "w-60" : "w-16"} // Adjust width based on state
      `}
    >
      {/* Navigation Links */}
      {/* Added overflow-y-auto for scrolling if needed, overflow-x-hidden */}
      <nav className="flex-1 mt-0 overflow-y-auto overflow-x-hidden">
        {/* Added padding to the list itself */}
        <ul className="space-y-2 px-2 py-4">
          {/* Dashboard Link */}
          {session && (
            <li>
              <Link
                href={dashboardUrl}
                title="Dashboard" // Add title for collapsed view
                className={`flex items-center px-3 py-3 rounded-md transition-colors ${ // Adjusted padding
                  isActive(dashboardUrl)
                    ? "bg-gray-200 text-black font-semibold"
                    : "text-gray-800 hover:bg-gray-100 hover:text-orange-500"
                } ${!isOpen ? "justify-center" : ""}`} // Center icon when collapsed
                aria-current={isActive(dashboardUrl) ? "page" : undefined}
              >
                <MdOutlineDashboard
                  className={`flex-shrink-0 h-5 w-5 ${iconColorClass} ${isOpen ? "mr-3" : "mx-auto"}`} // Adjust margin/centering
                />
                {/* Hide text smoothly when collapsed */}
                <span className={`${isOpen ? "opacity-100" : "opacity-0 w-0"} transition-opacity duration-200 whitespace-nowrap`}>Dashboard</span>
              </Link>
            </li>
          )}

          {/* Admin Links */}
          {session?.user?.role === "admin" && (
            <>
              <li>
                <Link
                  href="/ui/admin/view-crime"
                  title="Crime Reports" // Add title for collapsed view
                  className={`flex items-center px-3 py-3 rounded-md transition-colors ${ // Adjusted padding
                    isActive('/ui/admin/view-crime')
                      ? "bg-gray-200 text-black font-semibold"
                      : "text-gray-800 hover:bg-gray-100 hover:text-orange-500"
                  } ${!isOpen ? "justify-center" : ""}`}
                  aria-current={isActive('/ui/admin/view-crime') ? "page" : undefined}
                >
                  <FaFileCircleExclamation
                     className={`flex-shrink-0 h-5 w-5 ${iconColorClass} ${isOpen ? "mr-3" : "mx-auto"}`}
                  />
                  <span className={`${isOpen ? "opacity-100" : "opacity-0 w-0"} transition-opacity duration-200 whitespace-nowrap`}>Crime Reports</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/ui/admin/user-management"
                  title="User Management" // Add title for collapsed view
                  className={`flex items-center px-3 py-3 rounded-md transition-colors ${ // Adjusted padding
                    isActive('/ui/admin/user-management')
                      ? "bg-gray-200 text-black font-semibold"
                      : "text-gray-800 hover:bg-gray-100 hover:text-orange-500"
                  } ${!isOpen ? "justify-center" : ""}`}
                   aria-current={isActive('/ui/admin/user-management') ? "page" : undefined}
                >
                  <FaUsers
                     className={`flex-shrink-0 h-5 w-5 ${iconColorClass} ${isOpen ? "mr-3" : "mx-auto"}`}
                  />
                  <span className={`${isOpen ? "opacity-100" : "opacity-0 w-0"} transition-opacity duration-200 whitespace-nowrap`}>User Management</span>
                </Link>
              </li>
            </>
          )}

          {/* Profile Link */}
          {session && (
            <li>
              <Link
                href="/ui/profile"
                title="Profile" // Add title for collapsed view
                className={`flex items-center px-3 py-3 rounded-md transition-colors ${ // Adjusted padding
                  isActive('/ui/profile')
                    ? "bg-gray-200 text-black font-semibold"
                    : "text-gray-800 hover:bg-gray-100 hover:text-orange-500"
                } ${!isOpen ? "justify-center" : ""}`}
                 aria-current={isActive('/ui/profile') ? "page" : undefined}
              >
                <FaRegUserCircle
                   className={`flex-shrink-0 h-5 w-5 ${iconColorClass} ${isOpen ? "mr-3" : "mx-auto"}`}
                />
                <span className={`${isOpen ? "opacity-100" : "opacity-0 w-0"} transition-opacity duration-200 whitespace-nowrap`}>Profile</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <div className={`border-t border-gray-200 mt-auto ${isOpen ? 'p-4' : 'p-2'}`}> {/* Reduced padding when closed */}
        <button
          onClick={toggleSidebar} // Use the prop here
          // Adjusted padding inside button for better fit when collapsed
          className="flex items-center justify-center w-full py-2 px-2 rounded-md text-gray-600 hover:bg-gray-200 hover:text-orange-500 transition-colors"
          title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {/* Show different icons based on state */}
          {isOpen ? (
            <FaChevronLeft className="h-5 w-5" />
          ) : (
            <FaChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
