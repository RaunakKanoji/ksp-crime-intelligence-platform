import fs from "node:fs";
import path from "node:path";
import { getCatalystScriptApp, normalizeCell, parseArgs, parseCsvLine, requireEnvironment, upsertRow } from "./catalyst-script-utils.mjs";

const args = parseArgs();

async function main() {
  const environment = requireEnvironment(args);
  const file = args.file;
  if (!file) throw new Error("Pass --file ./data/incidents.csv or --file ./data/incidents.json.");
  const tableName = args.table || "crime_incidents";
  const uniqueLookup = args["unique-lookup"] || "incident_id";
  const app = getCatalystScriptApp(environment);
  const table = app.datastore().table(tableName);
  const rows = loadRows(file);
  const rejected = [];
  const totals = { inserted: 0, updated: 0, rejected: 0 };

  for (const [index, row] of rows.entries()) {
    const error = validateImportRow(row, uniqueLookup);
    if (error) {
      rejected.push({ line: index + 2, error, row });
      totals.rejected += 1;
      continue;
    }
    const result = await upsertRow(table, uniqueLookup, row);
    if (result === "inserted") totals.inserted += 1;
    else totals.updated += 1;
  }

  if (rejected.length > 0) {
    const rejectedPath = path.join(process.cwd(), `import-rejected-${Date.now()}.json`);
    fs.writeFileSync(rejectedPath, JSON.stringify(rejected, null, 2));
    console.log(`Rejected rows written to ${rejectedPath}`);
  }

  console.log("Import complete");
  console.log(`Total rows: ${rows.length}`);
  console.log(`Inserted: ${totals.inserted}`);
  console.log(`Updated: ${totals.updated}`);
  console.log(`Rejected: ${totals.rejected}`);
}

function loadRows(file) {
  const absolute = path.resolve(process.cwd(), file);
  const text = fs.readFileSync(absolute, "utf8").trim();
  if (file.endsWith(".json")) return JSON.parse(text);
  const lines = text.split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = normalizeCell(cells[index] ?? "");
    });
    return row;
  });
}

function validateImportRow(row, uniqueLookup) {
  if (!row || typeof row !== "object") return "Row must be an object.";
  if (!row[uniqueLookup]) return `${uniqueLookup} is required.`;
  if (row.latitude !== undefined && (Number(row.latitude) < -90 || Number(row.latitude) > 90)) return "latitude must be between -90 and 90.";
  if (row.longitude !== undefined && (Number(row.longitude) < -180 || Number(row.longitude) > 180)) return "longitude must be between -180 and 180.";
  if (row.occurred_at && Number.isNaN(new Date(row.occurred_at).getTime())) return "occurred_at must be a valid date.";
  return null;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
