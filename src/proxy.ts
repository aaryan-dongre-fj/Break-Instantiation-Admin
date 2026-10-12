import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.SECRET,
  });
  const { pathname } = request.nextUrl;
  const signedIn =
    token?.role === "admin" ||
    token?.role === "super_admin" ||
    token?.role === "backend_admin";

  if (signedIn && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!signedIn && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
