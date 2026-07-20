import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (existsSync(".next/BUILD_ID")) {
  process.exit(0);
}

console.log("No production Next.js build found at .next/BUILD_ID; running npm run build first.");

const result = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
