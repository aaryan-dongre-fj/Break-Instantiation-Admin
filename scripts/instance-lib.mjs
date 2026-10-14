import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const CONFIG_FILE = "instance.config.json";

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const URL = /^https?:\/\/\S+$/;

export function slugify(value) {
  const slug = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "admin";
}

export function configPath(dir) {
  return path.join(dir, CONFIG_FILE);
}

export function readConfig(dir) {
  const file = configPath(dir);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${file}`);
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`Could not parse ${file}: ${error.message}`);
  }
}

export function resolveInstance(raw) {
  const productName = text(raw.productName);
  if (!productName) throw new Error("productName is required.");

  const colors = raw.colors ?? {};
  const primary = text(colors.primary, "#000000");
  const primaryForeground = text(colors.primaryForeground, "#ffffff");
  const primaryHover = text(colors.primaryHover, "#808080");
  for (const [name, value] of [
    ["colors.primary", primary],
    ["colors.primaryForeground", primaryForeground],
    ["colors.primaryHover", primaryHover],
  ]) {
    if (!HEX.test(value)) throw new Error(`${name} must be a hex color like #111111.`);
  }

  const devPort = Number(raw.devPort ?? 3002);
  if (!Number.isInteger(devPort) || devPort < 1 || devPort > 65535) {
    throw new Error("devPort must be an integer from 1 to 65535.");
  }

  const apiBaseUrl = text(raw.apiBaseUrl, "http://127.0.0.1:8000").replace(/\/$/, "");
  const clientPortalOrigin = text(raw.clientPortalOrigin, "http://localhost:3001").replace(
    /\/$/,
    "",
  );
  const appUrl = text(raw.appUrl, `http://localhost:${devPort}`).replace(/\/$/, "");
  for (const [name, value] of [
    ["apiBaseUrl", apiBaseUrl],
    ["clientPortalOrigin", clientPortalOrigin],
    ["appUrl", appUrl],
  ]) {
    if (!URL.test(value)) throw new Error(`${name} must be an http(s) URL.`);
  }

  return {
    productName,
    packageName: text(raw.packageName, `${slugify(productName)}-admin`),
    title: text(raw.title, `Admin Panel — ${productName}`),
    description: text(raw.description, `Manage ${productName} clients and admins.`),
    logo: text(raw.logo, ""),
    favicon: text(raw.favicon, "/favicon.svg"),
    colors: { primary, primaryForeground, primaryHover },
    devPort,
    appUrl,
    apiBaseUrl,
    clientPortalOrigin,
    logoFile: text(raw.logoFile, ""),
    faviconFile: text(raw.faviconFile, ""),
  };
}

function text(value, fallback = "") {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

export function writeConfig(dir, instance) {
  const derivedTitle = `Admin Panel — ${instance.productName}`;
  const derivedDescription = `Manage ${instance.productName} clients and admins.`;
  const derivedAppUrl = `http://localhost:${instance.devPort}`;
  const stored = {
    productName: instance.productName,
    packageName: instance.packageName,
    title: instance.title === derivedTitle ? "" : instance.title,
    description: instance.description === derivedDescription ? "" : instance.description,
    logo: instance.logo,
    favicon: instance.favicon,
    colors: instance.colors,
    devPort: instance.devPort,
    appUrl: instance.appUrl === derivedAppUrl ? "" : instance.appUrl,
    apiBaseUrl: instance.apiBaseUrl,
    clientPortalOrigin: instance.clientPortalOrigin,
  };
  fs.writeFileSync(configPath(dir), `${JSON.stringify(stored, null, 2)}\n`);
}

export function faviconSvg(instance) {
  const letter = (instance.productName.match(/[A-Za-z0-9]/) ?? ["A"])[0].toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="${instance.colors.primary}"/>
  <text x="16" y="22" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16" font-weight="700" fill="${instance.colors.primaryForeground}">${letter}</text>
</svg>
`;
}

function copyAsset(source, target) {
  if (!fs.existsSync(source)) throw new Error(`Asset not found: ${source}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

export function applyInstance(dir) {
  const instance = resolveInstance(readConfig(dir));

  if (instance.logoFile) {
    const ext = path.extname(instance.logoFile) || ".png";
    copyAsset(path.resolve(instance.logoFile), path.join(dir, "public", "brand", `logo${ext}`));
    instance.logo = `/brand/logo${ext}`;
  }

  if (instance.faviconFile) {
    const ext = path.extname(instance.faviconFile) || ".png";
    copyAsset(path.resolve(instance.faviconFile), path.join(dir, "public", `favicon${ext}`));
    instance.favicon = `/favicon${ext}`;
  } else if (!instance.favicon || instance.favicon === "/favicon.svg") {
    fs.mkdirSync(path.join(dir, "public"), { recursive: true });
    fs.writeFileSync(path.join(dir, "public", "favicon.svg"), faviconSvg(instance));
    instance.favicon = "/favicon.svg";
  }

  writeConfig(dir, instance);
  syncPackage(dir, instance.packageName);
  ensureSecrets(dir);
  return resolveInstance(readConfig(dir));
}

function syncPackage(dir, packageName) {
  const pkgPath = path.join(dir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (pkg.name !== packageName) {
    pkg.name = packageName;
    fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  }

  const lockPath = path.join(dir, "package-lock.json");
  if (!fs.existsSync(lockPath)) return;
  const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  if (lock.name === packageName && lock.packages?.[""]?.name === packageName) return;
  lock.name = packageName;
  if (lock.packages?.[""]) lock.packages[""].name = packageName;
  fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
}

function readEnv(text, key) {
  const match = text.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match ? match[1].trim() : "";
}

function ensureSecrets(dir) {
  const envPath = path.join(dir, ".env.local");
  const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const instance = resolveInstance(readConfig(dir));
  let secret = readEnv(current, "SECRET");
  if (!secret || secret.includes("replace-with")) {
    secret = crypto.randomBytes(32).toString("base64");
  }
  const nextAuthSecret = readEnv(current, "NEXTAUTH_SECRET") || secret;
  const apiBaseUrl = readEnv(current, "API_BASE_URL") || instance.apiBaseUrl;
  const clientPortalOrigin =
    readEnv(current, "CLIENT_PORTAL_ORIGIN") || instance.clientPortalOrigin;
  const body = [
    "# Secrets and service URLs. Name, colors, and logo stay in instance.config.json.",
    "# One host serves every company at /<company>. Unset NEXTAUTH_URL on Vercel.",
    `SECRET=${secret}`,
    `NEXTAUTH_SECRET=${nextAuthSecret}`,
    `NEXTAUTH_URL=${readEnv(current, "NEXTAUTH_URL") || instance.appUrl}`,
    `API_BASE_URL=${apiBaseUrl}`,
    `CLIENT_PORTAL_ORIGIN=${clientPortalOrigin}`,
    "",
  ].join("\n");
  fs.writeFileSync(envPath, body);
}

const SKIP = new Set(["node_modules", ".next", ".git", "instance-build"]);

export function copyTemplate(source, dest) {
  const from = path.resolve(source);
  const to = path.resolve(dest);
  if (from === to) throw new Error("Destination is the template directory.");
  const relative = path.relative(from, to);
  const insideTemplate = relative && !relative.startsWith("..") && !path.isAbsolute(relative);
  if (insideTemplate && relative !== "instance-build" && !relative.startsWith(`instance-build${path.sep}`)) {
    throw new Error("Put the new app outside this repo. CI may use instance-build/.");
  }
  if (insideTemplate) SKIP.add("instance-build");
  fs.mkdirSync(to, { recursive: true });
  copyTree(from, to);
}

function copyTree(source, dest) {
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (SKIP.has(entry.name) || entry.name === ".env.local") continue;
    const from = path.join(source, entry.name);
    const target = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(target, { recursive: true });
      copyTree(from, target);
    } else if (entry.isFile()) {
      fs.copyFileSync(from, target);
    }
  }
}
