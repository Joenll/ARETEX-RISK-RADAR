"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
  
    const formData = new FormData(event.currentTarget);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
      role: "user", // Default role for new users
      badgeNumber: formData.get("badgeNumber"),
      rank: formData.get("rank"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      birthdate: formData.get("birthdate"),
      department: formData.get("department"),
    };
  
    console.log("Submitting data:", data); // Log the data being sent
  
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  
    if (response.ok) {
      setSuccess("User registered successfully!");
      setTimeout(() => router.push("/signin"), 2000);
    } else {
      const resData = await response.json();
      setError(resData.error || "Registration failed");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl font-bold">Register</h2>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
        <input type="email" name="email" placeholder="Email" required className="border p-2" />
        <input type="password" name="password" placeholder="Password" required className="border p-2" />
        <input type="text" name="badgeNumber" placeholder="Badge Number" required className="border p-2" />
        <input type="text" name="rank" placeholder="Rank/Position" required className="border p-2" />
        <input type="text" name="firstName" placeholder="First Name" required className="border p-2" />
        <input type="text" name="lastName" placeholder="Last Name" required className="border p-2" />
        <input type="date" name="birthdate" required className="border p-2" />
        <input type="text" name="department" placeholder="Department" required className="border p-2" />
        <button type="submit" className="bg-blue-500 text-white p-2">Register</button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-500 mt-2">{success}</p>}
    </div>
  );
}
