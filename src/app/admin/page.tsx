import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    redirect("/"); // Redirect non-admins
  }

  return <h1>Admin Dashboard</h1>;
}