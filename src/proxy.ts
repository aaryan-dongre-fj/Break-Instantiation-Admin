import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { companyFromPath } from "@/lib/company";

// One admin serves every company under its own path: /ej/dashboard is the
// /dashboard page for EJ. The path is rewritten, and the company travels to
// the server components in x-company, so the page files stay where they are.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const company = companyFromPath(pathname);
  const headers = new Headers(request.headers);
  headers.delete("x-company");
  if (!company) {
    return NextResponse.next({ request: { headers } });
  }
  headers.set("x-company", company);

  const token = await getToken({
    req: request,
    secret: process.env.SECRET,
  });
  // A session from another company's path counts as signed out here.
  const signedIn =
    token?.company === company &&
    (token.role === "admin" || token.role === "backend_admin");
  const page = pathname.slice(company.length + 1) || "/";

  if (signedIn && page === "/") {
    return NextResponse.redirect(new URL(`/${company}/dashboard`, request.url));
  }
  if (!signedIn && page.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL(`/${company}`, request.url));
  }

  const target = request.nextUrl.clone();
  target.pathname = page;
  return NextResponse.rewrite(target, { request: { headers } });
}

export const config = {
  matcher: ["/((?!api/|_next/|.*\\.[a-zA-Z0-9]+$).*)"],
};
