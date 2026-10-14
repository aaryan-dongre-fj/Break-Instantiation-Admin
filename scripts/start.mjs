import { spawn } from "node:child_process";
import { createRequire } from "node:module";

import { readConfig, resolveInstance } from "./instance-lib.mjs";

const instance = resolveInstance(readConfig(process.cwd()));
const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(process.execPath, [nextBin, "start", "-p", String(instance.devPort)], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
