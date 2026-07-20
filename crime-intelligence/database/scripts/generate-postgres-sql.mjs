import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifest = readJson("database/manifest.json");
const outputDir = path.join(root, "database/generated");

fs.mkdirSync(outputDir, { recursive: true });

const schemas = manifest.tables
  .map((table) => ({
    manifest: table,
    schema: readJson(table.schema),
  }))
  .sort((a, b) => (a.schema.creationOrder ?? 0) - (b.schema.creationOrder ?? 0));

const tableNames = new Set(schemas.map(({ schema }) => schema.table));

const schemaSql = [
  "-- Generated from database/schema/*.json. Do not edit by hand.",
  "-- Regenerate with: npm run db:generate:postgres",
  "",
  "BEGIN;",
  "",
  ...schemas.flatMap(({ manifest: table, schema }) => createTableSql(table, schema)),
  "COMMIT;",
  "",
].join("\n");

const seedSql = [
  "-- Generated from database/seeds/*.csv. Do not edit by hand.",
  "-- Regenerate with: npm run db:generate:postgres",
  "",
  "BEGIN;",
  "",
  ...schemas.flatMap(({ manifest: table, schema }) => createSeedSql(table, schema)),
  "COMMIT;",
  "",
].join("\n");

fs.writeFileSync(path.join(outputDir, "schema.sql"), schemaSql);
fs.writeFileSync(path.join(outputDir, "seeds.sql"), seedSql);

console.log("Generated database/generated/schema.sql");
console.log("Generated database/generated/seeds.sql");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function quoteIdent(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function quoteLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function pgType(column) {
  switch (column.type) {
    case "Email":
    case "Var Char":
      return `varchar(${column.maxLength ?? 255})`;
    case "Text":
      return "text";
    case "Integer":
      return "integer";
    case "Boolean":
      return "boolean";
    case "Date Time":
      return "timestamptz";
    case "Decimal":
      return "numeric";
    default:
      throw new Error(`Unsupported column type ${column.type} for ${column.name}.`);
  }
}

function pgDefault(value) {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  return quoteLiteral(value);
}

function parseForeignKey(value) {
  if (!value || typeof value !== "string") return null;
  const [table, column] = value.split(".");
  if (!table || !column || !tableNames.has(table)) return null;
  return { table, column };
}

function createTableSql(table, schema) {
  const primaryColumn = table.uniqueLookup;
  const columnLines = schema.columns.map((column) => {
    const parts = [quoteIdent(column.name), pgType(column)];
    if (column.mandatory) parts.push("NOT NULL");
    if (column.default !== undefined) parts.push(`DEFAULT ${pgDefault(column.default)}`);
    return `  ${parts.join(" ")}`;
  });

  const constraints = [];
  if (primaryColumn && schema.columns.some((column) => column.name === primaryColumn)) {
    constraints.push(`  CONSTRAINT ${quoteIdent(`${schema.table}_pkey`)} PRIMARY KEY (${quoteIdent(primaryColumn)})`);
  }

  for (const column of schema.columns) {
    if (column.unique && column.name !== primaryColumn) {
      constraints.push(`  CONSTRAINT ${quoteIdent(`${schema.table}_${column.name}_key`)} UNIQUE (${quoteIdent(column.name)})`);
    }

    const foreignKey = parseForeignKey(column.foreignKey);
    if (foreignKey) {
      constraints.push(
        `  CONSTRAINT ${quoteIdent(`${schema.table}_${column.name}_fkey`)} FOREIGN KEY (${quoteIdent(column.name)}) REFERENCES ${quoteIdent(foreignKey.table)} (${quoteIdent(foreignKey.column)})`
      );
    }
  }

  const indexFields = (schema.indexRecommendations ?? [])
    .filter((name) => schema.columns.some((column) => column.name === name))
    .filter((name) => name !== primaryColumn);

  return [
    `-- ${schema.purpose}`,
    `CREATE TABLE IF NOT EXISTS ${quoteIdent(schema.table)} (`,
    [...columnLines, ...constraints].join(",\n"),
    ");",
    ...indexFields.map(
      (name) =>
        `CREATE INDEX IF NOT EXISTS ${quoteIdent(`${schema.table}_${name}_idx`)} ON ${quoteIdent(schema.table)} (${quoteIdent(name)});`
    ),
    "",
  ];
}

function createSeedSql(table, schema) {
  if (!table.hasSeedData || !table.seed) return [];

  const seedPath = path.join(root, table.seed);
  if (!fs.existsSync(seedPath)) return [];

  const rows = parseCsv(fs.readFileSync(seedPath, "utf8"));
  if (rows.length < 2) return [];

  const [headers, ...records] = rows;
  const knownColumns = new Set(schema.columns.map((column) => column.name));
  const columns = headers.filter((header) => knownColumns.has(header));
  const primaryColumn = table.uniqueLookup;
  const columnTypes = new Map(schema.columns.map((column) => [column.name, column.type]));
  const headerIndexes = columns.map((column) => headers.indexOf(column));

  const values = records
    .filter((record) => record.some((value) => value.trim() !== ""))
    .map((record) => {
      const cells = headerIndexes.map((index) => toSqlValue(record[index] ?? "", columnTypes.get(headers[index])));
      return `  (${cells.join(", ")})`;
    });

  if (values.length === 0) return [];

  return [
    `-- ${table.seed}${table.developmentOnlySeed ? " (development seed)" : ""}`,
    `INSERT INTO ${quoteIdent(schema.table)} (${columns.map(quoteIdent).join(", ")})`,
    `VALUES\n${values.join(",\n")}`,
    primaryColumn ? `ON CONFLICT (${quoteIdent(primaryColumn)}) DO NOTHING;` : ";",
    "",
  ];
}

function toSqlValue(value, type) {
  const trimmed = value.trim();
  if (trimmed === "") return "NULL";
  if (type === "Integer" || type === "Decimal") return trimmed;
  if (type === "Boolean") return trimmed.toLowerCase() === "true" ? "true" : "false";
  return quoteLiteral(trimmed);
}

function parseCsv(input) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}
