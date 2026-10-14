import { cache } from "react";
import { headers } from "next/headers";

import { apiBaseUrl, instance } from "@/lib/instance";

export type Look = {
  name: string;
  logo: string;
  favicon: string;
  title: string;
  description: string;
  colors: {
    primary: string;
    primaryForeground: string;
    primaryHover: string;
  };
};

export function fallbackLook(): Look {
  return {
    name: instance.productName,
    logo: instance.logo,
    favicon: instance.favicon,
    title: instance.title,
    description: instance.description,
    colors: { ...instance.colors },
  };
}

/** The API for one company: API_BASE_URL/t/<company>. */
export function companyApiBase(company: string) {
  return `${apiBaseUrl()}/t/${company}`;
}

/** The company of the page being rendered. src/proxy.ts sets the header. */
export async function requestCompany(): Promise<string | null> {
  return (await headers()).get("x-company");
}

export const loadLook = cache(async (): Promise<Look> => {
  const company = await requestCompany();
  if (!company) return fallbackLook();
  try {
    const response = await fetch(`${companyApiBase(company)}/api/look/`, {
      cache: "no-store",
    });
    if (!response.ok) return fallbackLook();
    return normalizeLook(await response.json());
  } catch {
    return fallbackLook();
  }
});

function normalizeLook(data: unknown): Look {
  const fallback = fallbackLook();
  if (!data || typeof data !== "object") return fallback;
  const record = data as Record<string, unknown>;
  const colors =
    record.colors && typeof record.colors === "object"
      ? (record.colors as Record<string, unknown>)
      : {};
  return {
    name: text(record.name, fallback.name),
    logo: text(record.logo),
    favicon: text(record.favicon, fallback.favicon),
    title: text(record.title, fallback.title),
    description: text(record.description, fallback.description),
    colors: {
      primary: text(colors.primary, fallback.colors.primary),
      primaryForeground: text(
        colors.primaryForeground,
        fallback.colors.primaryForeground,
      ),
      primaryHover: text(colors.primaryHover, fallback.colors.primaryHover),
    },
  };
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
