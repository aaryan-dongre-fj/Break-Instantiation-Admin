import type { NextConfig } from "next";

import instance from "./instance.config.json";

const devPort = Number(instance.devPort) || 3002;
process.env.NEXTAUTH_URL ??= instance.appUrl || `http://localhost:${devPort}`;
process.env.API_BASE_URL ??= instance.apiBaseUrl;
process.env.CLIENT_PORTAL_ORIGIN ??= instance.clientPortalOrigin;

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
