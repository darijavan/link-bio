import { NextRequest, NextResponse } from "next/server";

const APP_SUBDOMAINS = new Set(["app", "www"]);

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0];
  const parts = hostname.split(".");

  // Skip subdomain routing for localhost and app/www subdomains
  if (hostname === "localhost" || parts.length < 3) return NextResponse.next();
  const subdomain = parts[0];
  if (APP_SUBDOMAINS.has(subdomain)) return NextResponse.next();

  // Rewrite /<path> on the subdomain to /[username]/<path>
  const url = req.nextUrl.clone();
  url.pathname = `/${subdomain}${req.nextUrl.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
