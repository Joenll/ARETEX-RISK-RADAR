"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session } = useSession();

  return session ? (
    <div>
      <p>Logged in as {session.user?.email} ({session.user?.role})</p>
      <button onClick={() => signOut()}>Logout</button>
    </div>
  ) : (
    <button onClick={() => signIn()}>Login</button>
  );
}