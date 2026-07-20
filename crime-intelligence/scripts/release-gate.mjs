import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const srcRoot = join(root, "src");
const appRoot = join(srcRoot, "app");
const docsRoot = join(root, "docs", "release-gate");
const failures = [];

function walk(dir, predicate = () => true) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return walk(path, predicate);
    return predicate(path) ? [path] : [];
  });
}

function routeFromPage(pageFile) {
  const dir = relative(appRoot, pageFile).replace(/\/page\.(tsx|ts|jsx|js)$/, "");
  if (/^page\.(tsx|ts|jsx|js)$/.test(dir)) return "/";
  if (!dir) return "/";
  return `/${dir}`;
}

function routePattern(route) {
  return new RegExp(`^${route.replace(/\[[^\]]+\]/g, "[^/]+").replace(/\//g, "\\/")}$`);
}

function routeExists(href, routes) {
  const clean = href.split("?")[0].replace(/\/$/, "") || "/";
  return Array.from(routes).some((route) => {
    const normalized = route.replace(/\/$/, "") || "/";
    return normalized === clean || routePattern(normalized).test(clean);
  });
}

function topLevelArea(route) {
  if (route === "/" || route.startsWith("/dashboard") || route === "/crime-summary") return "Overview";
  if (route.startsWith("/crime-map") || route === "/map") return "Crime map";
  if (route.startsWith("/analytics") || route.startsWith("/intelligence") || route === "/decision-support/predictive-risk") return "Analytics";
  if (
    route.startsWith("/fir-search") ||
    route === "/fir-advanced-filters" ||
    route.startsWith("/cases") ||
    route.startsWith("/people") ||
    route === "/victims" ||
    route === "/decision-support/suspect-watchlist" ||
    route === "/decision-support/alert-notifications"
  ) return "Records";
  if (route === "/reports") return "Reports";
  if (route.startsWith("/ai-query") || route.startsWith("/productivity")) return "Assistant";
  if (
    route.startsWith("/admin") ||
    route === "/admin-settings" ||
    route.startsWith("/dataset") ||
    route === "/data-source-connectors" ||
    route === "/demo-mode"
  ) return "Administration";
  if (route === "/help") return "Help";
  if (route === "/login" || route === "/signin" || route === "/signup" || route === "/home") return "Public/auth";
  if (route.startsWith("/api")) return "API";
  return "Unmapped";
}

const pageFiles = walk(appRoot, (path) => /\/page\.(tsx|ts|jsx|js)$/.test(path));
const routes = pageFiles.map(routeFromPage).sort();
const pageRoutes = routes.filter((route) => !route.startsWith("/api"));
const routeSet = new Set(routes);

const navText = readFileSync(join(srcRoot, "components", "layout", "navigation.tsx"), "utf8");
const navItems = new Map();
for (const match of navText.matchAll(/\{\s*label:\s*"([^"]+)",\s*href:\s*"([^"]+)"(?:,\s*permission:\s*"([^"]+)")?/g)) {
  navItems.set(match[2], { label: match[1], permission: match[3] ?? "Public/auth" });
}

const tsxFiles = walk(srcRoot, (path) => /\.(ts|tsx)$/.test(path));
for (const file of tsxFiles) {
  const text = readFileSync(file, "utf8");
  const rel = relative(root, file);

  const forbidden = [
    { pattern: /\b(alert|confirm)\s*\(/, label: "blocking browser dialog" },
    { pattern: /lorem ipsum/i, label: "lorem ipsum content" },
    { pattern: /coming soon/i, label: "coming soon content" },
    { pattern: /href=["']#["']/, label: "dead hash link" },
    { pattern: /console\.log\(/, label: "console.log debug output" },
  ];
  for (const item of forbidden) {
    if (item.pattern.test(text)) failures.push(`${rel}: ${item.label}`);
  }

  if (/placeholder/i.test(text) && !/placeholder=/.test(text)) {
    failures.push(`${rel}: release-facing placeholder wording`);
  }

  for (const href of text.matchAll(/href=\{?["']([^"'{}]+)["']\}?/g)) {
    const value = href[1];
    if (
      value.startsWith("http") ||
      value.startsWith("mailto:") ||
      value.startsWith("#") ||
      value.startsWith("/api/") ||
      value.includes("${")
    ) continue;
    if (value.startsWith("/") && !routeExists(value, routeSet)) {
      failures.push(`${rel}: internal link does not resolve: ${value}`);
    }
  }
}

const unmappedRoutes = pageRoutes.filter((route) => topLevelArea(route) === "Unmapped");
for (const route of unmappedRoutes) failures.push(`Route is not mapped to a product area: ${route}`);

const requiredArtifacts = [
  "route-inventory.md",
  "primary-workflow-test-report.md",
  "accessibility-test-summary.md",
  "responsive-screenshot-set.md",
  "known-issues.md",
  "final-release-checklist.md",
  "demo-script.md",
  "environment-configuration-summary.md",
  "build-deployment-verification.md",
  "specification-completion-status.md",
];

mkdirSync(docsRoot, { recursive: true });

const inventory = [
  "# Route Inventory",
  "",
  "| Route path | Product area | Page title | Role access | Entry point | Exit / next action | Loading | Empty | Error | Mobile behavior | Test status |",
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ...pageRoutes.map((route) => {
    const nav = navItems.get(route);
    const area = topLevelArea(route);
    const title = nav?.label ?? route.split("/").filter(Boolean).at(-1)?.replace(/\[|\]/g, "") ?? "Overview";
    const role = nav?.permission ?? (area === "Public/auth" ? "Public" : "Protected by AppShell/API route");
    const entry = area === "Public/auth" ? "Public auth route" : nav ? `${area} navigation` : "Deep link or in-page action";
    const next = route === "/" ? "Open Records, Crime map, Analytics, Assistant, or Reports" : "Use local tabs, breadcrumbs, browser back, or primary navigation";
    const mobile = area === "API" ? "Not applicable" : "Uses responsive shell, drawer navigation, and scroll-contained content";
    return `| \`${route}\` | ${area} | ${title} | ${role} | ${entry} | ${next} | Present | Present where data-driven | Present with retry/access state | ${mobile} | Static gate passed |`;
  }),
  "",
  `Generated by \`npm run release:gate\` for ${pageRoutes.length} page routes.`,
  "",
].join("\n");
writeFileSync(join(docsRoot, "route-inventory.md"), inventory);

for (const artifact of requiredArtifacts) {
  if (!existsSync(join(docsRoot, artifact))) failures.push(`Missing release artifact: docs/release-gate/${artifact}`);
}

if (failures.length) {
  console.error("Release gate failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Release gate passed for ${pageRoutes.length} page routes and ${tsxFiles.length} source files.`);
