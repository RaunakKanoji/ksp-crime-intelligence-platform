import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = process.argv[2];
const fileByTarget = {
  schema: "database/generated/schema.sql",
  seeds: "database/generated/seeds.sql",
};

if (!fileByTarget[target]) {
  console.error("Usage: node database/scripts/run-postgres-sql.mjs schema|seeds");
  process.exit(1);
}

loadDotEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Add it to .env.local or export it in your shell.");
  process.exit(1);
}

const sqlPath = path.join(root, fileByTarget[target]);
if (!fs.existsSync(sqlPath)) {
  console.error(`${fileByTarget[target]} does not exist. Run npm run db:generate:postgres first.`);
  process.exit(1);
}

const result = spawnSync("psql", [process.env.DATABASE_URL, "-v", "ON_ERROR_STOP=1", "-f", sqlPath], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);

function loadDotEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex <= 0) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = value;
  }
}
