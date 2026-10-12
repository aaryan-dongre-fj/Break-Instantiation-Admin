import { spawn } from "node:child_process";
import { createRequire } from "node:module";

import { readConfig, resolveInstance } from "./instance-lib.mjs";

const instance = resolveInstance(readConfig(process.cwd()));
const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

process.env.NEXTAUTH_URL ??= instance.appUrl;
process.env.API_BASE_URL ??= instance.apiBaseUrl;
process.env.CLIENT_PORTAL_ORIGIN ??= instance.clientPortalOrigin;

const child = spawn(process.execPath, [nextBin, "dev", "-p", String(instance.devPort)], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
