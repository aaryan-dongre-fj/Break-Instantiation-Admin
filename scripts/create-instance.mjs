import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

import {
  applyInstance,
  copyTemplate,
  readConfig,
  resolveInstance,
  slugify,
} from "./instance-lib.mjs";

const { values } = parseArgs({
  options: {
    dest: { type: "string" },
    config: { type: "string" },
    name: { type: "string" },
    package: { type: "string" },
    port: { type: "string" },
    api: { type: "string" },
    portal: { type: "string" },
    "app-url": { type: "string" },
    primary: { type: "string" },
    "primary-foreground": { type: "string" },
    hover: { type: "string" },
    logo: { type: "string" },
    favicon: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    "no-install": { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});

if (values.help || !values.dest) {
  console.log(`Usage:
  node scripts/create-instance.mjs --dest ../Acme-Admin --name "Acme" --port 3010

Options:
  --dest          Directory for the new admin app
  --config        JSON file to start from (defaults to this repo's instance.config.json)
  --name          Product name shown on the login screen and header
  --package       npm package name (default: <slug>-admin)
  --port          Local dev port
  --api           Generic backend origin
  --portal        Customer app origin sent with API calls
  --app-url       Public URL of this admin (default: http://localhost:<port>)
  --primary       Hex color for buttons and the wordmark accent
  --primary-foreground
  --hover         Hex color for the button hover state
  --logo          Image file copied to public/brand
  --favicon       Image file copied to public/
  --title         Browser title (default: Admin Panel — <name>)
  --description   Browser description
  --no-install    Skip npm install
`);
  process.exit(values.help ? 0 : 1);
}

const template = process.cwd();
const dest = path.resolve(values.dest);
const base = values.config
  ? JSON.parse(fs.readFileSync(path.resolve(values.config), "utf8"))
  : readConfig(template);

if (values.name) base.productName = values.name;
if (values.package) base.packageName = values.package;
else if (values.name) base.packageName = `${slugify(values.name)}-admin`;
if (values.port) base.devPort = Number(values.port);
if (values.api) base.apiBaseUrl = values.api;
if (values.portal) base.clientPortalOrigin = values.portal;
if (values["app-url"]) base.appUrl = values["app-url"];
else if (values.port) base.appUrl = "";
if (values.title !== undefined) base.title = values.title;
if (values.description !== undefined) base.description = values.description;
base.colors = {
  primary: "#000000",
  primaryForeground: "#ffffff",
  primaryHover: "#808080",
  ...(base.colors ?? {}),
};
if (values.primary) base.colors.primary = values.primary;
if (values["primary-foreground"]) base.colors.primaryForeground = values["primary-foreground"];
if (values.hover) base.colors.primaryHover = values.hover;
if (values.logo) base.logoFile = path.resolve(values.logo);
if (values.favicon) base.faviconFile = path.resolve(values.favicon);

resolveInstance(base);
copyTemplate(template, dest);
fs.writeFileSync(path.join(dest, "instance.config.json"), `${JSON.stringify(base, null, 2)}\n`);

const previous = process.cwd();
process.chdir(dest);
const instance = applyInstance(dest);
process.chdir(previous);

if (!values["no-install"]) {
  const install = spawnSync("npm", ["install"], { cwd: dest, stdio: "inherit" });
  if (install.status !== 0) process.exit(install.status ?? 1);
}

console.log("");
console.log(`Created ${dest}`);
console.log(`${instance.productName} is ready at ${instance.appUrl}`);
console.log(`cd ${dest} && npm run dev`);
