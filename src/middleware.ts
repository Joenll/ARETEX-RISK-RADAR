import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Define root paths based on role
const USER_AUTHENTICATED_ROOT = "/ui/dashboard";
const ADMIN_AUTHENTICATED_ROOT = "/ui/admin/dashboard";
const PUBLIC_PATHS = ["/", "/registration", "/about", "/terms"]; // Your public pages
const AUTH_PAGES = ["/", "/registration"]; // Pages logged-in users should be redirected away from

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const secret = process.env.SESSION_SECRET;
  console.log("Middleware running for:", pathname);

  // --- Get Token ---
  // Encapsulate token fetching to handle potential errors gracefully
  let token = null;
  try {
    token = await getToken({ req, secret });
    console.log("[Token Check] Token fetched:", token ? `Exists (Role: ${token.role})` : "None");
  } catch (error) {
    console.error("[Token Check] Error calling getToken:", error);
    // If token check fails, treat as unauthenticated and redirect to sign-in
    const signInUrl = new URL("/", req.url);
    signInUrl.searchParams.set("error", "auth_check_failed");
    return NextResponse.redirect(signInUrl);
  }

  const isLoggedIn = !!token;
  const userRole = token?.role as string | undefined;

  // --- Handle Public Paths ---
  if (PUBLIC_PATHS.includes(pathname)) {
    // If user is logged in AND on a page they should be redirected away from (/, /registration)
    if (isLoggedIn && AUTH_PAGES.includes(pathname)) {
      // *** CHANGE: Use role-specific root path ***
      const redirectUrl = userRole === 'admin' ? ADMIN_AUTHENTICATED_ROOT : USER_AUTHENTICATED_ROOT;
      console.log(`[Public Auth Page Redirect] Redirecting logged-in ${userRole} from ${pathname} to ${redirectUrl}.`);
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
    // Otherwise, allow access to public paths (/, /registration for logged-out users, /about for everyone)
    console.log(`[Public Path Access] Allowing access to ${pathname}.`);
    const response = NextResponse.next();
     // Apply no-store cache only to auth pages if needed
     if (AUTH_PAGES.includes(pathname)) {
        response.headers.set('Cache-Control', 'no-store, must-revalidate');
        console.log(`[Public Path Check] Added Cache-Control header for ${pathname}`);
    }
    return response;
  }

  // --- Handle Authenticated Routes ---

  // If user is NOT logged in, redirect to sign-in page
  if (!isLoggedIn) {
    console.log(`[Auth Required] No token found for ${pathname}, redirecting to sign-in.`);
    const signInUrl = new URL("/", req.url);
    // Preserve the intended destination as callbackUrl
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // --- *** NEW: Redirect logged-in users landing on '/' after login *** ---
  // This handles the case after successful login where NextAuth redirects to '/'
  if (pathname === '/') {
      const redirectUrl = userRole === 'admin' ? ADMIN_AUTHENTICATED_ROOT : USER_AUTHENTICATED_ROOT;
      console.log(`[Post-Login Redirect] Redirecting logged-in ${userRole} from / to ${redirectUrl}`);
      return NextResponse.redirect(new URL(redirectUrl, req.url));
  }
  // --- *** END NEW SECTION *** ---


  // --- Handle Admin Path Authorization ---
  if (pathname.startsWith("/ui/admin")) {
    if (userRole !== "admin") {
      console.log(`[Admin Path Denied] Non-admin user (${userRole}) accessing ${pathname}. Redirecting to ${USER_AUTHENTICATED_ROOT}.`);
      // *** CHANGE: Redirect non-admins to the USER dashboard ***
      return NextResponse.redirect(new URL(USER_AUTHENTICATED_ROOT, req.url));
    }
    console.log(`[Admin Path Access] Admin access granted for ${pathname}.`);
  } else {
    // Optional: Prevent admins from accessing user-specific pages if needed
    // if (userRole === 'admin' && pathname.startsWith('/some/user/only/path')) {
    //    return NextResponse.redirect(new URL(ADMIN_AUTHENTICATED_ROOT, req.url));
    // }
    console.log(`[Authenticated Path Access] Allowing ${userRole} access to ${pathname}.`);
  }

  // If all checks pass, allow the request to proceed
  return NextResponse.next();
}

// Config remains the same
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Any file extension (e.g., .png, .jpg) - this prevents middleware from running on static assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
