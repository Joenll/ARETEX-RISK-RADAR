import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const AUTHENTICATED_ROOT = "/ui/dashboard";
const PUBLIC_PATHS = ["/", "/registration"];

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  console.log("Middleware running for:", pathname);

  // --- Allow access to explicitly public paths ---
  if (PUBLIC_PATHS.includes(pathname)) {
    console.log(`[Public Path Check] Path: ${pathname}`);
    let response: NextResponse | null = null; // Prepare response variable

    try {
      const token = await getToken({ req, secret: process.env.SESSION_SECRET });
      // (Keep your detailed logging here if you find it helpful)
      console.log(`[Public Path Check] Token fetched: ${token ? 'Exists' : 'None'}`);
      if (token) {
        console.log(`[Public Path Check] Token details (role): ${token.role}`);
      }
      const isPublicAuthPath = pathname === "/" || pathname === "/registration";
      const shouldRedirect = token && isPublicAuthPath;
      console.log(`[Public Path Check] Is public auth path? ${isPublicAuthPath}`);
      console.log(`[Public Path Check] Should redirect authenticated user? ${shouldRedirect}`);


      if (shouldRedirect) {
        console.log(`[Public Path Check] Redirecting authenticated user (Role: ${token?.role}) from ${pathname} to ${AUTHENTICATED_ROOT}.`);
        return NextResponse.redirect(new URL(AUTHENTICATED_ROOT, req.url));
      }

      // --- If NOT redirecting (i.e., allowing access to public path) ---
      console.log(`[Public Path Check] Allowing access for path: ${pathname}`);
      // Create the response to allow the request to proceed
      response = NextResponse.next();
      // --- CHANGE CACHE-CONTROL HEADER ---
      // Add header to discourage caching of the sign-in/registration pages
      response.headers.set('Cache-Control', 'no-store, must-revalidate'); // Use must-revalidate
      console.log(`[Public Path Check] Added Cache-Control: no-store, must-revalidate header for ${pathname}`);
      // --- END CHANGE CACHE-CONTROL ---

    } catch (error) {
      console.error("[Public Path Check] Error checking token for public path redirect:", error);
      // If an error occurs, still allow access but add cache control
      response = NextResponse.next();
      // Also update here if desired
      response.headers.set('Cache-Control', 'no-store, must-revalidate'); // Use must-revalidate
    }

    return response; // Return the prepared response
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
      return NextResponse.redirect(new URL(AUTHENTICATED_ROOT, req.url));
    }
    console.log("[Admin Path Check] Admin access granted.");
  } else {
    console.log("[Authenticated Path Check] Access granted for non-admin path:", pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
 