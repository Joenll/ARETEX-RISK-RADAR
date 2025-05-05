"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { FaChevronDown, FaBell, FaTimes } from "react-icons/fa"; // Import FaBell, FaTimes
import Swal from 'sweetalert2'; // Import SweetAlert2
import { INotification } from "@/models/Notification"; // Import notification type

// --- Helper to format date ---
const formatNotificationDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' +
         date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const DashboardHeader = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false); // State for notification dropdown
  const [notifications, setNotifications] = useState<INotification[]>([]); // State for notifications
  const [unreadCount, setUnreadCount] = useState(0); // State for unread count
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
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

  // --- Fetch Notifications for Authenticated User ---
  useEffect(() => {
    // Fetch if authenticated, regardless of role
    if (sessionStatus === 'authenticated' && session?.user?.role === 'admin') {
      const fetchNotifications = async () => {
        setIsLoadingNotifications(true);
        setNotificationError(null);
        try {
          const response = await fetch('/api/notifications?read=false'); // Fetch only unread initially
          if (!response.ok) {
            throw new Error('Failed to fetch notifications');
          }
          const data = await response.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        } catch (error: any) {
          console.error("Error fetching notifications:", error);
          setNotificationError(error.message || 'Could not load notifications.');
          setUnreadCount(0); // Reset count on error
        } finally {
          setIsLoadingNotifications(false);
        }
      };
      fetchNotifications();
      // Optional: Set up polling or WebSocket for real-time updates
      // const intervalId = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
      // return () => clearInterval(intervalId);
    } else {
      // Clear notifications if user is not authenticated
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [sessionStatus]); // Re-fetch only if session status changes
  
  // --- Mark Notifications as Read ---
  const markNotificationsRead = async () => {
    // Only mark if there are unread notifications
    if (unreadCount === 0) return;

    // Optimistically update UI
    const previousUnreadCount = unreadCount;
    setUnreadCount(0);

    try {
      await fetch('/api/notifications/mark-read', { method: 'PATCH' });
      // Optionally refetch notifications to get the full list including read ones if needed
      // fetchNotifications(true); // Pass a flag to fetch all
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      // Revert optimistic update on error
      setUnreadCount(previousUnreadCount);
      // Optionally show an error message to the user
    }
  };

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

  // --- Toggle Notification Dropdown ---
  const toggleNotifications = () => {
    const willOpen = !isNotificationsOpen;
    setIsNotificationsOpen(willOpen);
    if (willOpen) {
      markNotificationsRead(); // Mark as read when opening
    }
  };

  // --- Get user details from session ---
  const userDisplayName = session?.user?.name || session?.user?.email || "User";
  const userRole = session?.user?.role || "User";
  const userInitial = userDisplayName.charAt(0).toUpperCase();
  const profilePictureUrl = session?.user?.profilePictureUrl; // Get profile picture URL
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


      <div className="flex items-center space-x-3 sm:space-x-4">

        {/* --- Notification Bell (Admin Only) --- */}
        {session?.user?.role === 'admin' && ( // Check for admin role specifically
          <div className="relative"> {/* Add relative positioning container */}
            <button
              onClick={toggleNotifications}
              className="relative text-gray-600 hover:text-orange-500 transition-colors focus:outline-none"
              title="Notifications"
              aria-label="View Notifications"
            >
            <FaBell className="h-5 w-5 sm:h-6 sm:w-6" />

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            </button>


            {isNotificationsOpen && (
              <div
                // ref={notificationDropdownRef} // Add ref if needed for outside click handling
                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
              >
                <div className="flex justify-between items-center px-4 py-2 border-b">
                  <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                  <button onClick={() => setIsNotificationsOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <FaTimes />
                  </button>
                </div>
                {isLoadingNotifications ? (
                  <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
                ) : notificationError ? (
                  <div className="p-4 text-center text-red-600 text-sm">{notificationError}</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">No new notifications.</div>
                ) : (
                  <ul>
                    {notifications.map((notif) => (
                      <li key={notif._id as string} className="border-b last:border-b-0 hover:bg-gray-50">
                        <Link href={notif.link || '#'} className="block px-4 py-3" onClick={() => setIsNotificationsOpen(false)}>
                          <p className="text-sm text-gray-700 mb-1">{notif.message}</p>
                          <p className="text-xs text-gray-500">{formatNotificationDate(notif.createdAt)}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div> // End relative positioning container
        )}

        <div className="text-right hidden sm:block">
          <p className="text-gray-800 font-semibold text-sm sm:text-base truncate max-w-[150px]">
            {userDisplayName}
          </p>
        </div>

        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-orange-500 overflow-hidden flex items-center justify-center bg-blue-500 text-white font-bold text-lg">
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt="Profile"
              className="w-full h-full object-cover" // Ensure image covers the circle
            />
          ) : (
            <span>{userInitial}</span> // Fallback to initial
          )}
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
