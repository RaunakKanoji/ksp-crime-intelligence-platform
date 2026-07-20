import { getCatalystScriptApp, parseArgs, readCsv, readManifest, requireEnvironment, upsertRow } from "./catalyst-script-utils.mjs";

const args = parseArgs();

async function main() {
  const environment = requireEnvironment(args);
  if (environment === "production" && !args["confirm-production-seed"]) {
    throw new Error("Production seeding requires --confirm-production-seed.");
  }

  const manifest = readManifest();
  const app = getCatalystScriptApp(environment);
  const datastore = app.datastore();
  const totals = { inserted: 0, updated: 0, skipped: 0, failed: 0 };

  console.log(`Seeding Catalyst Data Store for ${environment}`);
  console.log("===========================================");

  for (const entry of manifest.tables) {
    if (!entry.seed || !entry.uniqueLookup) continue;
    if (entry.developmentOnlySeed && environment === "production" && !args["include-development-seeds"]) {
      console.log(`Skipped ${entry.name}: development-only seed data.`);
      totals.skipped += 1;
      continue;
    }

    const rows = readCsv(entry.seed);
    const table = datastore.table(entry.name);
    let inserted = 0;
    let updated = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        const result = await upsertRow(table, entry.uniqueLookup, row);
        if (result === "inserted") inserted += 1;
        else updated += 1;
      } catch (error) {
        failed += 1;
        console.error(`${entry.name} seed failed for ${row[entry.uniqueLookup]}: ${error.message}`);
      }
    }

    totals.inserted += inserted;
    totals.updated += updated;
    totals.failed += failed;
    console.log(`${entry.name}: inserted=${inserted} updated=${updated} failed=${failed}`);
  }

  console.log("");
  console.log(`Seed complete. Inserted: ${totals.inserted}. Updated: ${totals.updated}. Skipped: ${totals.skipped}. Failed: ${totals.failed}.`);
  if (totals.failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
