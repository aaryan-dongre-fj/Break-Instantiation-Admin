import { NextRequest, NextResponse } from "next/server";

import { apiCookieHeader, apiCsrfToken, companyFromPath, companySetCookie } from "@/lib/company";
import { clientPortalOrigin } from "@/lib/instance";
import { companyApiBase } from "@/lib/look";

type BackendContext = {
  params: Promise<{ path: string[] }>;
};

function portalOrigin() {
  return clientPortalOrigin();
}

async function proxy(request: NextRequest, context: BackendContext) {
  // /api/backend/<company>/<api path>: the company picks /t/<company>/.
  const [segment = "", ...path] = (await context.params).path;
  const company = companyFromPath(`/${segment}`);
  if (!company || path.length === 0) {
    return NextResponse.json({ detail: "Unknown company." }, { status: 404 });
  }
  const target = new URL(`${companyApiBase(company)}/api/${path.join("/")}/`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  const browserCookies = request.headers.get("cookie");
  const cookie = apiCookieHeader(browserCookies, company);
  if (cookie) headers.set("cookie", cookie);

  const csrf =
    request.headers.get("x-csrftoken") ?? apiCsrfToken(browserCookies, company);
  if (csrf) headers.set("x-csrftoken", csrf);

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("accept", request.headers.get("accept") ?? "application/json");

  // Django checks Origin against CSRF_TRUSTED_ORIGINS. Invite emails use
  // the company's client_site_url on the API, not this header.
  const origin = portalOrigin();
  headers.set("origin", origin);
  headers.set("referer", `${origin}/`);

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { detail: "Could not reach the API. Is the backend running?" },
      { status: 502 },
    );
  }

  const response =
    upstream.status === 204
      ? new NextResponse(null, { status: 204 })
      : new NextResponse(await upstream.arrayBuffer(), {
          status: upstream.status,
        });
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) response.headers.set("content-type", upstreamType);
  for (const setCookie of upstream.headers.getSetCookie()) {
    response.headers.append("set-cookie", companySetCookie(setCookie, company));
  }
  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
