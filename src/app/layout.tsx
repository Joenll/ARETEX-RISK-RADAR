// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Assuming you use Geist fonts
import "./globals.css";
// Removed Navbar import as it's likely rendered in a nested layout (like UILayout)
import Providers from "./components/Providers"; // Import the Providers component

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aretex Risk Radar", // Updated title
  description: "Crime Mapping and Analysis", // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`} // Apply font variables
      >
        {/* Wrap the entire application content with Providers */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
