import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const sourceRoots = [join(root, "src", "app"), join(root, "src", "components")];
const failures = [];

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return walk(path);
    return path.endsWith(".tsx") ? [path] : [];
  });
}

const files = sourceRoots.flatMap(walk);

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const rel = file.replace(root, "");

  if (/\b(alert|confirm)\s*\(/.test(text)) {
    failures.push(`${rel}: uses blocking alert()/confirm(); use the shared feedback or confirmation pattern.`);
  }

  const buttonMatches = text.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g);
  for (const match of buttonMatches) {
    const openTag = match[0].split(">")[0];
    const body = match[1].replace(/<[^>]+>/g, "").trim();
    const hasAccessibleName = body.length > 0 || /aria-label=|aria-labelledby=|title=/.test(openTag);
    if (!hasAccessibleName) {
      failures.push(`${rel}: button without an accessible name.`);
    }
  }
}

const appShell = readFileSync(join(root, "src", "components", "layout", "AppShell.tsx"), "utf8");
if (!appShell.includes("ksp-skip-link") || !appShell.includes('id="main-content"')) {
  failures.push("AppShell: skip-to-content link or main content landmark is missing.");
}
if (!appShell.includes("aria-labelledby=\"page-title\"")) {
  failures.push("AppShell: main landmark is not associated with the page heading.");
}

if (failures.length) {
  console.error("Accessibility static checks failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Accessibility static checks passed for ${files.length} TSX files.`);
