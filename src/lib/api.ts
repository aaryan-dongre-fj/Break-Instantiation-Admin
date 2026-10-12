export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function messageFrom(data: unknown) {
  if (!data || typeof data !== "object") {
    return "We encountered an issue on our end. Please try again.";
  }

  const record = data as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;
  if (Array.isArray(record.detail)) return record.detail.map(String).join(" ");

  const parts: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string") {
      parts.push(key === "detail" ? value : `${key}: ${value}`);
    } else if (Array.isArray(value)) {
      parts.push(`${key}: ${value.map(String).join(" ")}`);
    }
  }

  return parts.join(" ") || "We encountered an issue on our end. Please try again.";
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const normalized = path.endsWith("/") ? path.slice(0, -1) : path;
  const response = await fetch(`/api/backend${normalized}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    throw new ApiError(messageFrom(data), response.status);
  }

  return data as T;
}

export function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
    return data.results as T[];
  }
  return [];
}

function safeJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
