// src/app/components/Sidebar.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Import usePathname

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname(); // Get the current path

  // Handler for signing out with confirmation
  const handleSignOut = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      signOut({ callbackUrl: '/' });
    }
  };

  // Helper function to determine if a link is active
  const isActive = (href: string) => pathname === href;

  return (
    // Sidebar container: fixed position, full height, width, background, flex column
    <aside className="bg-gray-900 text-white w-60 h-screen p-4 flex flex-col fixed top-0 left-0 shadow-lg">
      {/* App Title/Logo */}
      <div className="text-2xl font-bold mb-6 border-b border-gray-700 pb-3">
        Aretex Risk Radar
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-2 flex-grow">
        

        {session && (
          <Link
            href="/ui/dashboard"
            className={`p-2 rounded hover:bg-gray-700 ${isActive('/ui/dashboard') ? 'bg-gray-700 font-semibold' : ''}`}
          >
            Dashboard
          </Link>
        )}

        {session?.user?.role === "admin" && (
          <>
            <Link
              href="/ui/admin/add-crime"
              className={`p-2 rounded hover:bg-gray-700 ${isActive('/ui/admin/add-crime') ? 'bg-gray-700 font-semibold' : ''}`}
            >
              Add Crime
            </Link>
            <Link
              href="/ui/admin/view-crime"
              className={`p-2 rounded hover:bg-gray-700 ${isActive('/ui/admin/view-crime') ? 'bg-gray-700 font-semibold' : ''}`}
            >
              View Reports
            </Link>
            <Link
              href="/ui/admin/user-management"
              className={`p-2 rounded hover:bg-gray-700 ${isActive('/ui/admin/user-management') ? 'bg-gray-700 font-semibold' : ''}`}
            >
              User Management
            </Link>
          </>
        )}

        {session && (
          <Link
            href="/ui/profile"
            className={`p-2 rounded hover:bg-gray-700 ${isActive('/ui/profile') ? 'bg-gray-700 font-semibold' : ''}`}
          >
            Profile
          </Link>
        )}
      </nav>

      {/* Sign Out / Sign In Section at the bottom */}
      <div className="mt-auto pt-4 border-t border-gray-700">
        {session ? (
          <button
            onClick={handleSignOut}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-center"
          >
            Sign Out
          </button>
        ) : (
          <Link
            href="/ui/signin"
            className={`block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded ${isActive('/ui/signin') ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-blue-400' : ''}`}
          >
            Sign In
          </Link>
        )}
      </div>
    </aside>
  );
}
