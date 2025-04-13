// src/app/components/Providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

interface ProvidersProps {
  children: React.ReactNode;
  // You might pass the session object if needed for initial state,
  // but SessionProvider usually handles fetching it.
  // session?: any;
}

export default function Providers({ children }: ProvidersProps) {
  // You can pass the session prop to SessionProvider if needed,
  // e.g., <SessionProvider session={session}>
  return <SessionProvider>{children}</SessionProvider>;
}

