import { NextRequest, NextResponse } from "next/server";

import { apiBaseUrl, clientPortalOrigin } from "@/lib/instance";

type BackendContext = {
  params: Promise<{ path: string[] }>;
};

function apiBase() {
  return apiBaseUrl();
}

function portalOrigin() {
  return clientPortalOrigin();
}

function csrfFromCookie(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const name = trimmed.slice(0, separator);
    if (name === "csrftoken" || name === "__Secure-csrftoken") {
      return decodeURIComponent(trimmed.slice(separator + 1));
    }
  }
  return null;
}

async function proxy(request: NextRequest, context: BackendContext) {
  const { path } = await context.params;
  const target = new URL(`${apiBase()}/api/${path.join("/")}/`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const csrf =
    request.headers.get("x-csrftoken") ?? csrfFromCookie(cookie);
  if (csrf) headers.set("x-csrftoken", csrf);

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("accept", request.headers.get("accept") ?? "application/json");

  // Django checks Origin against CSRF_TRUSTED_ORIGINS. Invite emails use
  // CLIENT_PORTAL_FRONTEND_URL on the API, not this header.
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
    response.headers.append("set-cookie", setCookie);
  }
  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
