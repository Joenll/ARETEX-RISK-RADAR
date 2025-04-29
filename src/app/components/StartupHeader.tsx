// src/app/components/StarupHeader.tsx
"use client";

import React, { ReactNode, useState } from "react";
import Link from 'next/link'; // Import the Link component

interface StartupHeaderProps {
  children: ReactNode;
}

const StartupHeader: React.FC<StartupHeaderProps> = ({ children }) => {
  const [isAboutHovered, setIsAboutHovered] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center overflow-hidden font-sans relative">
      {/* Navbar */}
      <header className="w-full flex items-center justify-between px-8 py-4 bg-gray-100 shadow-md h-16">
        {/* Left Section: Logo */}
        <div className="flex items-center">
          <img
            src="/riskradar.png"
            alt="Risk Radar Logo"
            className="h-11 mr-1"
          />
          <div className="flex items-center space-x-1">
            <img src="/aretex.png" alt="Aretex" className="h-5" />
            <span className="text-xl h-6 font-bold text-red-500">RISK</span>
            <span className="text-xl h-6 font-bold text-gray-800">RADAR</span>
          </div>
        </div>

        {/* Navigation Links - Updated to use Link */}
        <nav className="flex items-center space-x-6 z-10">
          <Link 
            href="/about"
            className={`text-gray-600 hover:text-orange-500 relative px-2 py-1 transition-colors duration-200 ${
              isAboutHovered ? "text-orange-500" : ""
            }`}
            onMouseEnter={() => setIsAboutHovered(true)}
            onMouseLeave={() => setIsAboutHovered(false)}
          >
            About
            <span
              className="absolute left-0 right-0 bottom-0 h-0.5 bg-orange-500 transform origin-left transition-transform duration-200"
              style={{
                transform: isAboutHovered ? "scaleX(1)" : "scaleX(0)",
              }}
            ></span>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative w-full flex-grow z-10 px-8 flex justify-center">
        <div className="w-full max-w-7xl">{children}</div>
      </main>

      {/* Radar Image */}
      {/* Consider optimizing this image with next/image if it's large */}
      <div className="absolute w-[1500px] h-[1300px] -right-96 -top-20 opacity-30 md:opacity-100 pointer-events-none"> {/* Added opacity and pointer-events */}
        <img
          src="/radar.png"
          alt="Radar"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};

export default StartupHeader;
