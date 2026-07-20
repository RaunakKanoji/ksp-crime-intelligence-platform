import fs from "node:fs";
import path from "node:path";
import catalyst from "zcatalyst-sdk-node";

export function projectRoot() {
  return process.cwd();
}

export function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(projectRoot(), relativePath), "utf8"));
}

export function readManifest() {
  return readJson("database/manifest.json");
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) args[key] = true;
    else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

export function requireEnvironment(args) {
  const environment = args.environment || process.env.CATALYST_ENVIRONMENT;
  if (!environment) {
    throw new Error("Pass --environment development|production or set CATALYST_ENVIRONMENT.");
  }
  return String(environment).toLowerCase();
}

export function getCatalystScriptApp(environment) {
  const required = ["CATALYST_PROJECT_ID", "CATALYST_PROJECT_KEY", "CATALYST_PROJECT_DOMAIN", "CATALYST_REFRESH_TOKEN", "CATALYST_CLIENT_ID", "CATALYST_CLIENT_SECRET"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing Catalyst script environment variables: ${missing.join(", ")}`);
  }

  return catalyst.initializeApp({
    projectId: process.env.CATALYST_PROJECT_ID,
    projectKey: process.env.CATALYST_PROJECT_KEY,
    projectDomain: process.env.CATALYST_PROJECT_DOMAIN,
    environment,
    credential: catalyst.credential.refreshToken({
      refresh_token: process.env.CATALYST_REFRESH_TOKEN,
      client_id: process.env.CATALYST_CLIENT_ID,
      client_secret: process.env.CATALYST_CLIENT_SECRET,
    }),
  });
}

export function readCsv(relativePath) {
  const text = fs.readFileSync(path.join(projectRoot(), relativePath), "utf8").trim();
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = normalizeCell(values[index] ?? "");
    });
    return row;
  });
}

export function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

export function normalizeCell(value) {
  if (value === "") return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+$/.test(value)) return Number(value);
  if (/^-?\d+\.\d+$/.test(value)) return Number(value);
  return value;
}

export async function upsertRow(table, uniqueLookup, row) {
  const existingRows = await table.getAllRows();
  const existing = existingRows.find((item) => String(item[uniqueLookup]) === String(row[uniqueLookup]));
  if (existing?.ROWID) {
    await table.updateRow({ ...existing, ...row, ROWID: existing.ROWID });
    return "updated";
  }
  await table.insertRow(row);
  return "inserted";
}

export function requiredColumns(schema) {
  return new Set((schema.columns ?? []).map((column) => column.name));
}
