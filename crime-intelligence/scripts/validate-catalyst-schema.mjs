import { getCatalystScriptApp, parseArgs, readJson, readManifest, requireEnvironment, requiredColumns } from "./catalyst-script-utils.mjs";

const args = parseArgs();
const manifest = readManifest();

async function main() {
  const environment = requireEnvironment(args);
  const app = getCatalystScriptApp(environment);
  const datastore = app.datastore();
  const failures = [];

  console.log(`Validating Catalyst Data Store schema for ${environment}`);
  console.log("=================================================");

  const tables = await datastore.getAllTables();
  const tableNames = new Set(tables.map((table) => table.toJSON().table_name || table.toJSON().table_identifier || table.identifier));

  for (const entry of manifest.tables) {
    const schema = readJson(entry.schema);
    const table = datastore.table(entry.name);
    if (!tableNames.has(entry.name)) {
      failures.push(`${entry.name} table missing`);
      console.log(`✗ ${entry.name} table missing`);
      continue;
    }

    console.log(`✓ ${entry.name} table found`);
    const columns = await table.getAllColumns();
    const columnNames = new Set(columns.map((column) => column.toJSON?.().column_name || column.column_name || column.name));
    for (const column of requiredColumns(schema)) {
      if (columnNames.has(column)) console.log(`  ✓ ${column} column found`);
      else {
        failures.push(`${entry.name}.${column} column missing`);
        console.log(`  ✗ ${column} column missing`);
      }
    }
  }

  if (failures.length > 0) {
    console.error("");
    console.error("Schema validation failed. Create or update these items in Catalyst Console:");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("");
  console.log("Catalyst schema validation passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
