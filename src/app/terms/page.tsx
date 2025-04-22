"use client";

import React, { useState } from "react";
import Link from "next/link";

const TermsPage = () => {
  const [isHomeHovered, setIsHomeHovered] = useState(false);
  return (
    <div>
      {/* Navbar */}
      <header className="w-full flex items-center justify-between px-8 py-4 bg-gray-100 shadow-md h-16 sticky top-0 z-50">
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
          <Link
            href="/admin/about"
            className={`text-orange-500 relative px-2 py-1 transition-colors duration-200`}
          ></Link>
        </nav>
      </header>

      {/* Main Section */}
      <main className="relative flex flex-col items-center justify-center w-full px-8 py-12 mx-auto">
        <div className="z-10 bg-white p-8 rounded-lg shadow-md w-full max-w-6xl border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Terms and Conditions
          </h1>
          <p className="text-gray-600 mb-8 text-center">
            Last Updated: April 22, 2025
          </p>

          <div className="space-y-8">
            {/* Introduction Section */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">
                1. Introduction
              </h2>
              <p className="text-gray-600 mb-3">
                Welcome to Aretex Risk Radar. These Terms and Conditions govern
                your use of our web application and services offered by Aretex
              </p>
              <p className="text-gray-600 mb-3">
                By accessing or using the Risk Radar application, you agree to
                be bound by these Terms. If you disagree with any part of these
                terms, you may not access the service.
              </p>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">
                2. User Accounts
              </h2>
              <p className="text-gray-600 mb-3">
                When you create an account with us, you must provide accurate,
                complete, and up-to-date information. You are responsible for
                safeguarding the password and for all activities that occur
                under your account.
              </p>
              <p className="text-gray-600 mb-3">
                You agree to notify us immediately of any unauthorized use of
                your account or any other breach of security. We cannot and will
                not be liable for any loss or damage arising from your failure
                to comply with the above requirements.
              </p>
            </section>

            {/* Data and Privacy */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">
                3. Data and Privacy
              </h2>
              <p className="text-gray-600 mb-3">
                Risk Radar collects and processes spatiotemporal data, including
                crime reports, weather patterns, and other relevant information
                to provide risk assessment services. By using our application,
                you consent to such processing and you warrant that all data
                provided by you is accurate.
              </p>
              <p className="text-gray-600 mb-3">
                We take appropriate measures to protect your personal
                information in accordance with our Privacy Policy, which is
                incorporated into these Terms and Conditions by reference.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">
                4. Intellectual Property
              </h2>
              <p className="text-gray-600 mb-3">
                The Risk Radar application, its original content, features, and
                functionality are owned by Aretex and are protected by
                international copyright, trademark, patent, trade secret, and
                other intellectual property laws.
              </p>
              <p className="text-gray-600 mb-3">
                You may not modify, reproduce, distribute, create derivative
                works or adaptations of, publicly display or in any way exploit
                any of the content in whole or in part except as expressly
                authorized by us.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">
                5. Limitation of Liability
              </h2>
              <p className="text-gray-600 mb-3">
                In no event shall Aretex, nor its directors, employees,
                partners, agents, suppliers, or affiliates, be liable for any
                indirect, incidental, special, consequential or punitive
                damages, including without limitation, loss of profits, data,
                use, goodwill, or other intangible losses, resulting from:
              </p>
              <ul className="list-disc pl-8 mb-3 text-gray-600 space-y-2">
                <li>
                  Your access to or use of or inability to access or use the
                  service
                </li>
                <li>
                  Any conduct or content of any third party on the service
                </li>
                <li>Any content obtained from the service</li>
                <li>
                  Unauthorized access, use or alteration of your transmissions
                  or content
                </li>
              </ul>
              <p className="text-gray-600 mb-3">
                Risk Radar provides predictive analytics and risk assessments,
                but we do not guarantee 100% accuracy of all predictions or
                assessments.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">
                6. Changes to Terms
              </h2>
              <p className="text-gray-600 mb-3">
                We reserve the right, at our sole discretion, to modify or
                replace these Terms at any time. If a revision is material we
                will try to provide at least 30 days notice prior to any new
                terms taking effect.
              </p>
              <p className="text-gray-600 mb-3">
                By continuing to access or use our Service after those revisions
                become effective, you agree to be bound by the revised terms. If
                you do not agree to the new terms, please stop using the
                service.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">
                7. Governing Law
              </h2>
              <p className="text-gray-600 mb-3">
                These Terms shall be governed and construed in accordance with
                the laws of Philippines, without regard to its conflict of law
                provisions.
              </p>
              <p className="text-gray-600 mb-3">
                Our failure to enforce any right or provision of these Terms
                will not be considered a waiver of those rights. If any
                provision of these Terms is held to be invalid or unenforceable
                by a court, the remaining provisions of these Terms will remain
                in effect.
              </p>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">
                8. Contact Us
              </h2>
              <p className="text-gray-600 mb-3">
                If you have any questions about these Terms, please contact us
                at:
              </p>
              <p className="text-gray-800 font-medium">
                support@aretexriskradar.com
              </p>
            </section>
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/registration"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 inline-block"
            >
              Back to Registration
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
