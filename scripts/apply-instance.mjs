import { applyInstance, resolveInstance, readConfig } from "./instance-lib.mjs";

const check = process.argv.includes("--check");
const dir = process.cwd();

if (check) {
  const instance = resolveInstance(readConfig(dir));
  console.log(`${instance.productName} → ${instance.appUrl}`);
  process.exit(0);
}

const instance = applyInstance(dir);
console.log(`Applied ${instance.productName}`);
console.log(`Dev server: ${instance.appUrl}`);
console.log(`API: ${instance.apiBaseUrl}`);
