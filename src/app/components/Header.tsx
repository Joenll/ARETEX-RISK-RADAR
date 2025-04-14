// src/app/components/Header.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { FaChevronDown } from "react-icons/fa";

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

  const handleSignOut = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      signOut({ callbackUrl: '/' });
    }
  };

  const handleEditProfile = () => {
     setIsDropdownOpen(false);
  }

  // --- Get user details from session ---
  const userDisplayName = session?.user?.email || "User";
  const userRole = session?.user?.role || "User";
  const userInitial = userDisplayName.charAt(0).toUpperCase();
  const displayRole = userRole.charAt(0).toUpperCase() + userRole.slice(1);

  return (
    // Added justify-end since the left logo is removed
    <header className="w-full flex items-center justify-end px-4 sm:px-8 py-3 bg-gray-100 shadow-md h-16 sticky top-0 z-40">
      {/* Left Section: Logo REMOVED */}
      {/* <div className="flex items-center"> ... </div> */}

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
                    onClick={handleEditProfile}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-orange-500 transition-colors"
                  >
                    Edit Profile
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleSignOut}
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
