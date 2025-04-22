"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { FaChevronDown } from "react-icons/fa";
import Swal from 'sweetalert2'; // Import SweetAlert2

const DashboardHeader = () => {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Close dropdown when clicking outside ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // --- Updated Sign Out Handler with SweetAlert ---
  const handleSignOut = () => {
    // Close the dropdown first
    setIsDropdownOpen(false);

    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6', // Blue
      cancelButtonColor: '#d33',    // Red
      confirmButtonText: 'Yes, sign out!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // If confirmed, proceed with sign out
        signOut({ callbackUrl: '/' });
      }
      // If cancelled, do nothing
    });
  };
  // --- End Updated Handler ---

  const handleEditProfile = () => {
     setIsDropdownOpen(false);
     // Navigation will happen via Link component's onClick
  }

  // --- Get user details from session ---
  const userDisplayName = session?.user?.name || session?.user?.email || "User";
  const userRole = session?.user?.role || "User";
  const userInitial = userDisplayName.charAt(0).toUpperCase();
  const displayRole = userRole.charAt(0).toUpperCase() + userRole.slice(1);

  return (
    <header className="w-full flex items-center justify-between px-4 sm:px-8 py-3 bg-gray-100 shadow-md h-16 sticky top-0 z-40">
      {/* Left Section: Logo */}
      <div className="flex items-center">
        <img
          src="/riskradar.png"
          alt="Risk Radar Logo"
          className="h-9 mr-1"
        />
        <div className="flex items-center space-x-1">
          <img src="/aretex.png" alt="Aretex" className="h-4" />
          <span className="text-lg font-bold text-red-500 mt-1">RISK</span>
          <span className="text-lg font-bold text-gray-800 mt-1">RADAR</span>
        </div>
      </div>

      {/* Right Section: User Info & Dropdown */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="text-right hidden sm:block">
          <p className="text-gray-800 font-semibold text-sm sm:text-base truncate max-w-[150px]">
            {userDisplayName}
          </p>
        </div>
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-orange-500 overflow-hidden flex items-center justify-center bg-orange-500 text-white font-bold text-lg">
          <span>{userInitial}</span>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center px-3 py-1 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 transition-colors"
          >
            {displayRole}
            <FaChevronDown className={`ml-2 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-40 z-50">
              <ul className="py-1">
                <li>
                  <Link
                    href="/ui/profile"
                    onClick={handleEditProfile} // Closes dropdown on click
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-orange-500 transition-colors"
                  >
                    Edit Profile
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleSignOut} // Calls the SweetAlert handler
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-orange-500 transition-colors"
                  >
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
