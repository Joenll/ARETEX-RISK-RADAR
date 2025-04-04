import { getServerSession } from "next-auth";
import { authOptions } from "@/auth"; // Ensure the path is correct
import Link from "next/link";

export default async function Navbar() {
  const session = await getServerSession(authOptions); // Use getServerSession

  return (
    <nav>
      <Link href="/">Home</Link>
      {session?.user.role === "admin" || session?.user.role === "user" && <Link href="/ui/dashboard">Dashboard</Link>}
      {session?.user.role === "admin" && <Link href="/ui/admin/add-crime">Crime Reports</Link>}
      {session?.user.role === "admin" && <Link href="/admin">User Management</Link>}
      {session?.user.role === "admin" || session?.user.role === "user" &&<Link href="/admin">Profile</Link>}
      {session?.user.role === "admin" || session?.user.role === "user" && <Link href="/">SignOut</Link>}
    </nav>
  );
}
