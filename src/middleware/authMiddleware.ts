import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function requireRole(req: Request, allowedRoles: string[]) {
  const token = await getToken({ req: req as any, secret: process.env.SESSION_SECRET });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!allowedRoles.includes(token.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null; // If role is allowed, return null (no error)
}