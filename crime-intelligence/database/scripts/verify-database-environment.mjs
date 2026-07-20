import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "database/manifest.json"), "utf8"));
const missing = [];

for (const variable of manifest.requiredEnvironment ?? []) {
  if (!process.env[variable]) missing.push(variable);
}

if (missing.length > 0) {
  console.error("Missing required database environment variables:");
  for (const variable of missing) console.error(`- ${variable}`);
  process.exit(1);
}

console.log("Required database environment variables are present.");

