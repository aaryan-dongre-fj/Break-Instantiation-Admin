import raw from "../../instance.config.json";

export type InstanceConfig = {
  productName: string;
  packageName: string;
  title: string;
  description: string;
  logo: string;
  favicon: string;
  colors: {
    primary: string;
    primaryForeground: string;
    primaryHover: string;
  };
  devPort: number;
  appUrl: string;
  apiBaseUrl: string;
  clientPortalOrigin: string;
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

const productName = text(raw.productName, "Admin");
const devPort = Number(raw.devPort) || 3002;

export const instance: InstanceConfig = {
  productName,
  packageName: text(raw.packageName, "admin"),
  title: text(raw.title, `Admin Panel — ${productName}`),
  description: text(raw.description, `Manage ${productName} clients and admins.`),
  logo: text(raw.logo),
  favicon: text(raw.favicon, "/favicon.svg"),
  colors: {
    primary: text(raw.colors?.primary, "#000000"),
    primaryForeground: text(raw.colors?.primaryForeground, "#ffffff"),
    primaryHover: text(raw.colors?.primaryHover, "#808080"),
  },
  devPort,
  appUrl: text(raw.appUrl, `http://localhost:${devPort}`).replace(/\/$/, ""),
  apiBaseUrl: text(raw.apiBaseUrl, "http://127.0.0.1:8000").replace(/\/$/, ""),
  clientPortalOrigin: text(raw.clientPortalOrigin, "http://localhost:3001").replace(
    /\/$/,
    "",
  ),
};

export function apiBaseUrl() {
  return (process.env.API_BASE_URL || instance.apiBaseUrl).replace(/\/$/, "");
}

export function clientPortalOrigin() {
  return (process.env.CLIENT_PORTAL_ORIGIN || instance.clientPortalOrigin).replace(
    /\/$/,
    "",
  );
}
