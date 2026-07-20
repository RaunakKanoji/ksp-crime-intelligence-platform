import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "database/manifest.json"), "utf8"));

console.log("Catalyst Data Store Import Commands");
console.log("===================================");
console.log("");

for (const table of manifest.tables) {
  if (!table.seed || !table.importConfig) continue;
  console.log(`# ${table.name}`);
  if (table.developmentOnlySeed) {
    console.log("# Development-only seed data. Do not run against production unless explicitly approved.");
  }
  console.log(`catalyst ds:import ${table.seed} --config ${table.importConfig}`);
  console.log("catalyst ds:status import");
  console.log("");
}

