import { auth } from "@platform/auth";
import { NextResponse } from "next/server";

// Route protection for every studio page. As modules/script, modules/image,
// etc. add their own routes under apps/web/app/(app)/*, they fall under
// this same matcher automatically — no per-module middleware needed.
const PUBLIC_PATHS = ["/login", "/register"];

export default auth((req) => {
  // "/" (the marketing landing page) is public too, but as an exact match
  // only — using `startsWith` for it the way the other entries do would
  // make literally every path "public" since every pathname starts with
  // "/".
  const isPublic =
    req.nextUrl.pathname === "/" || PUBLIC_PATHS.some((path) => req.nextUrl.pathname.startsWith(path));
  const isLoggedIn = Boolean(req.auth?.user);

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Skip static assets, the auth API routes, and the billing webhook
  // routes (added Chunk 9) — Stripe/Razorpay POST these with no session
  // cookie at all, so without this exclusion `auth()` would redirect every
  // incoming webhook to /login before it ever reached the handler, and
  // both providers would see that as a failed delivery and keep retrying.
  matcher: ["/((?!api/auth|api/webhooks|_next/static|_next/image|favicon.ico).*)"],
};
