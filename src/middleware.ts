import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";
import { AuthOptions } from "next-auth";

export async function middleware(req: NextRequest) {
  const session = await auth();
  const pathname = req.nextUrl.pathname;

  if (!session) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  //  Restrict admin routes
  if (pathname.startsWith("/admin") && session.user.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"], //  Protects all admin routes
};
