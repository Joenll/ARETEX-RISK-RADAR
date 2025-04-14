"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaMapMarkerAlt,
  FaChartLine,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";

const AboutPage = () => {
  const [isHomeHovered, setIsHomeHovered] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="w-full flex items-center justify-between px-8 py-4 bg-gray-100 shadow-md h-16 sticky top-0 z-50">
        <div className="flex items-center">
          {/* Using standard img tags as before, consider next/image if optimization needed */}
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
        {/* Navigation Links */}
        <nav className="flex items-center space-x-6 z-10">
          <Link
            href="/"
            className={`text-gray-600 hover:text-orange-500 relative px-2 py-1 transition-colors duration-200 ${
              isHomeHovered ? "text-orange-500" : ""
            }`}
            onMouseEnter={() => setIsHomeHovered(true)}
            onMouseLeave={() => setIsHomeHovered(false)}
          >
            Home
            <span
              className="absolute left-0 right-0 bottom-0 h-0.5 bg-orange-500 transform origin-left transition-transform duration-200"
              style={{
                transform: isHomeHovered ? "scaleX(1)" : "scaleX(0)",
              }}
            ></span>
          </Link>
          {/* Removed the empty Link to /admin/about */}
        </nav>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* ... (Hero, Mission/Vision, How It Works sections remain the same) ... */}
         <div className="mb-20 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img
              src="/radar.png"
              alt="Radar Icon"
              className="h-16 w-16 object-contain"
            />
            <h1 className="text-5xl font-bold text-gray-800">
              About Aretex Risk Radar
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Making Aretex family safe by predicting and mapping high-risk areas
            using spatiotemporal data trends
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="bg-white rounded-lg shadow-md p-10 mb-16 transform transition-all duration-300 hover:shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mr-4">
                  <FaChartLine className="text-orange-500 text-xl" />
                </span>
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                Our mission is to enhance safety and security for Aretex
                personnel by leveraging advanced data analytics to identify,
                predict, and visualize potential risk areas. We aim to provide
                actionable intelligence that helps prevent incidents before they
                occur.
              </p>
              <p className="text-lg text-gray-600">
                We are committed to creating a safer environment for everyone
                through innovation, data-driven insights, and collaborative
                approaches to security management.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mr-4">
                  <FaShieldAlt className="text-orange-500 text-xl" />
                </span>
                Our Vision
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                We envision a future where predictive analytics and real-time
                risk assessment are seamlessly integrated into everyday
                operations, enabling proactive rather than reactive safety
                measures.
              </p>
              <p className="text-lg text-gray-600">
                Through continuous improvement and innovation, we strive to set
                the standard for organizational risk management, protecting both
                people and assets through technological excellence.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
            How Risk Radar Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-8 mx-auto">
                <FaMapMarkerAlt className="text-blue-600 text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Data Collection
              </h3>
              <p className="text-gray-600 text-center text-lg">
                We gather spatiotemporal data from multiple sources including
                crime reports, weather patterns, and historical incidents to
                create comprehensive datasets.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-8 mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-orange-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Analysis & Prediction
              </h3>
              <p className="text-gray-600 text-center text-lg">
                Our advanced algorithms analyze patterns, correlations, and
                trends to identify high-risk areas and predict potential future
                incidents with high accuracy.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-8 mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Visualization
              </h3>
              <p className="text-gray-600 text-center text-lg">
                Results are presented through intuitive maps, heatmaps, and
                dashboards, making complex data easy to understand and
                actionable for all users.
              </p>
            </div>
          </div>
        </div>


        {/* About Aretex - Updated Section */}
        <div className="bg-white rounded-lg shadow-md p-10 mb-16 hover:shadow-lg transition-shadow duration-300">
          <div className="flex flex-col md:flex-row items-center">
            {/* Image Column */}
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-12">
              {/* First Image */}
              <div className="relative h-80 w-full rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,102,255,0.8)]">
                <Image
                  src="/aretex-team.jpg" // Keep existing image
                  alt="Aretex Team"
                  fill
                  className="object-cover rounded-lg hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority // Keep priority if it's above the fold
                />
              </div>

              {/* --- Added Second Image --- */}
              <div className="relative h-80 w-full rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,102,0,0.8)] mt-8"> {/* Added margin-top */}
                <Image
                  src="/intern-team.jpg" // --- CHANGE THIS to your second image path ---
                  alt="Interns" // --- CHANGE THIS alt text ---
                  fill
                  className="object-cover rounded-lg hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  // Remove priority if this image is lower down
                />
              </div>
              {/* --- End Added Second Image --- */}

            </div>
            {/* Text Column */}
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <FaUsers className="text-blue-600 text-xl" />
                </span>
                About Aretex
              </h2>
              <p className="text-lg text-gray-600 mb-5">
                Aretex is a forward-thinking organization dedicated to
                leveraging technology for creating a unified sense of purpose.
                With everyone pushing in the same direction and striving for the
                same goals - empowering our clients to embrace accounting best
                practices. Minimising wasted time and resources, and improving
                the quality of the information they use to run their business.
              </p>
              <p className="text-lg text-gray-600">
                Our team consists of dedicated professionals who are passionate
                about making a difference. We believe that by understanding
                patterns and predicting risks, we can significantly improve
                safety outcomes for organizations and communities.
              </p>
              <p className="text-lg text-gray-600">
                Spearheaded by a strong leadership team based both here in
                Manila and in Sydney, Australia. Aretex brings together the best
                in senior financial management with superior processes and
                execution.
              </p>
              <a
                href="https://aretex-ph.com/home"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 hover:shadow-lg"
              >
                Learn More About Us
              </a>
            </div>
          </div>
        </div>

        {/* ... (Key Features, Contact Section remain the same) ... */}
         <div className="mb-20">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md border-l-4 border-orange-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Real-time Risk Mapping
              </h3>
              <p className="text-lg text-gray-600">
                Visualize current risk levels across different geographical
                areas with our advanced mapping tools that update in real-time.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Predictive Analytics
              </h3>
              <p className="text-lg text-gray-600">
                Leverage machine learning algorithms that predict potential risk
                areas based on historical data and emerging patterns.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md border-l-4 border-orange-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Custom Alerts
              </h3>
              <p className="text-lg text-gray-600">
                Set up personalized alerts for specific areas or risk thresholds
                to stay informed about changing conditions.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Comprehensive Reporting
              </h3>
              <p className="text-lg text-gray-600">
                Generate detailed reports on risk assessments, incidents, and
                trends to support decision-making and resource allocation.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-lg shadow-md p-10 hover:shadow-lg transition-all duration-300">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Contact Us
          </h2>
          <p className="text-lg text-gray-600 text-center mb-10 max-w-3xl mx-auto">
            Have questions about Risk Radar? We are here to help. Reach out to
            our team for more information
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6">
            <button className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
              Contact Support
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 mt-20">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-600">
            © {new Date().getFullYear()} Aretex Risk Radar. All rights reserved. {/* Dynamic Year */}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
