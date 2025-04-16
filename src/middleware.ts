
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const AUTHENTICATED_ROOT = "/ui/dashboard";
// --- Add '/ui/about' here ---
const PUBLIC_PATHS = ["/", "/registration", "/about"];

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  console.log("Middleware running for:", pathname); // Keep logging for debug if needed

  // --- Allow access to explicitly public paths ---
  if (PUBLIC_PATHS.includes(pathname)) {
    console.log(`[Public Path Check] Path: ${pathname}`);
    let response: NextResponse | null = null;

    try {
      const token = await getToken({ req, secret: process.env.SESSION_SECRET });
      console.log(`[Public Path Check] Token fetched: ${token ? 'Exists' : 'None'}`);

      // Only redirect logged-in users away from the actual sign-in/registration pages
      const isAuthPage = pathname === "/" || pathname === "/registration";
      const shouldRedirect = token && isAuthPage;
      console.log(`[Public Path Check] Is auth page? ${isAuthPage}`);
      console.log(`[Public Path Check] Should redirect authenticated user? ${shouldRedirect}`);

      if (shouldRedirect) {
        console.log(`[Public Path Check] Redirecting authenticated user (Role: ${token?.role}) from ${pathname} to ${AUTHENTICATED_ROOT}.`);
        return NextResponse.redirect(new URL(AUTHENTICATED_ROOT, req.url));
      }

      console.log(`[Public Path Check] Allowing access for public path: ${pathname}`);
      response = NextResponse.next(); // Allow access

      // Apply no-store cache only to auth pages if needed, not necessarily to /ui/about
      if (isAuthPage) {
          response.headers.set('Cache-Control', 'no-store, must-revalidate');
          console.log(`[Public Path Check] Added Cache-Control: no-store, must-revalidate header for ${pathname}`);
      }

    } catch (error) {
      console.error("[Public Path Check] Error checking token for public path redirect:", error);
      // Allow access even if token check fails for public paths
      response = NextResponse.next();
      // Optionally set cache control here too if needed for error cases on auth pages
      // if (pathname === "/" || pathname === "/registration") {
      //    response.headers.set('Cache-Control', 'no-store, must-revalidate');
      // }
    }
    return response; // Return the response allowing access
  }

  // --- Check authentication for all other paths ---
  let token = null;
  try {
    token = await getToken({ req, secret: process.env.SESSION_SECRET });
    console.log("[Protected Path Check] Token fetched:", token ? `Exists (Role: ${token.role})` : "None");
  } catch (error) {
    console.error("[Protected Path Check] Error calling getToken:", error);
    const redirectUrl = new URL("/", req.url);
    redirectUrl.searchParams.set("error", "auth_check_failed");
    return NextResponse.redirect(redirectUrl);
  }

  if (!token) {
    console.log("[Protected Path Check] No token found, redirecting to signin.");
    return NextResponse.redirect(new URL("/", req.url));
  }

  // --- Role check specifically for admin paths ---
  if (pathname.startsWith("/ui/admin")) {
    console.log("[Admin Path Check] Checking access for admin path...");
    if (token.role !== "admin") {
      console.log(`[Admin Path Check] Role mismatch: User role is '${token.role}', redirecting.`);
      // Redirect non-admins trying to access admin pages to their dashboard
      return NextResponse.redirect(new URL(AUTHENTICATED_ROOT, req.url));
    }
    console.log("[Admin Path Check] Admin access granted.");
  } else {
    console.log("[Authenticated Path Check] Access granted for non-admin path:", pathname);
  }

  return NextResponse.next();
}

// --- Config remains the same ---
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
