// The company is the first path segment: /ej/dashboard is EJ. The API
// serves that company at API_BASE_URL/t/ej/. Same slug rule as the API.
const COMPANY_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
const RESERVED = new Set(["api", "_next", "favicon.ico"]);

export function companyFromPath(pathname: string): string | null {
  const segment = pathname.split("/")[1] ?? "";
  return COMPANY_PATTERN.test(segment) && !RESERVED.has(segment) ? segment : null;
}

/** The company of the page in the browser. Client components only. */
export function currentCompany(): string {
  return companyFromPath(window.location.pathname) ?? "";
}

// Every company's API cookies sit on this one host, so each is stored under
// a company prefix. Signing in to Break then cannot replace EJ's session.
function prefix(company: string) {
  return `${company}__`;
}

/** The browser's cookies for this company, named as the API set them. */
export function apiCookieHeader(cookieHeader: string | null, company: string) {
  const own = prefix(company);
  return (cookieHeader ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(own))
    .map((part) => part.slice(own.length))
    .join("; ");
}

/** An API Set-Cookie stored under this company's prefix, on every path. */
export function companySetCookie(setCookie: string, company: string) {
  const [pair, ...attributes] = setCookie.split(";");
  const kept = attributes.filter((attr) => !/^\s*path=/i.test(attr));
  return [`${prefix(company)}${pair.trim()}`, ...kept.map((a) => a.trim()), "Path=/"].join(
    "; ",
  );
}

export function apiCsrfToken(cookieHeader: string | null, company: string) {
  for (const part of apiCookieHeader(cookieHeader, company).split("; ")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const name = part.slice(0, separator);
    if (name === "csrftoken" || name === "__Secure-csrftoken") {
      return decodeURIComponent(part.slice(separator + 1));
    }
  }
  return null;
}
