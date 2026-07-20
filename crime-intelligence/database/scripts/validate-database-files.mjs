import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "database/manifest.json");
const errors = [];
const seenJson = new Map();

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  try {
    const text = fs.readFileSync(absolutePath, "utf8");
    const parsed = JSON.parse(text);
    seenJson.set(relativePath, parsed);
    return parsed;
  } catch (error) {
    errors.push(`${relativePath} is missing or contains invalid JSON: ${error.message}`);
    return null;
  }
}

function readCsv(relativePath) {
  const absolutePath = path.join(root, relativePath);
  try {
    const text = fs.readFileSync(absolutePath, "utf8").trim();
    if (!text) {
      errors.push(`${relativePath} is empty.`);
      return { headers: [], rows: [] };
    }
    const lines = text.split(/\r?\n/);
    const headers = parseCsvLine(lines[0]);
    const rows = lines.slice(1).map(parseCsvLine);
    return { headers, rows };
  } catch (error) {
    errors.push(`${relativePath} is missing or unreadable: ${error.message}`);
    return { headers: [], rows: [] };
  }
}

function parseCsvLine(line) {
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

function fileExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

if (!fileExists("database/manifest.json")) {
  errors.push("database/manifest.json does not exist.");
}

const manifest = readJson("database/manifest.json");
const schemas = new Map();

if (manifest) {
  if (!Array.isArray(manifest.tables)) {
    errors.push("database/manifest.json must contain a tables array.");
  } else {
    const tableNames = new Set(manifest.tables.map((table) => table.name));
    const created = new Set();

    for (const table of manifest.tables) {
      for (const key of ["schema", "seed", "importConfig"]) {
        if (table[key] && !fileExists(table[key])) {
          errors.push(`${table.name}.${key} points to missing file ${table[key]}.`);
        }
      }

      const schema = table.schema ? readJson(table.schema) : null;
      if (schema) {
        schemas.set(table.name, schema);
        if (!schema.table) errors.push(`${table.schema} must define table.`);
        if (schema.table !== table.name) {
          errors.push(`${table.schema} table "${schema.table}" does not match manifest name "${table.name}".`);
        }
        if (!Array.isArray(schema.columns) || schema.columns.length === 0) {
          errors.push(`${table.schema} must define at least one column.`);
        }
      }

      if (table.importConfig) {
        const config = readJson(table.importConfig);
        if (config) validateImportConfig(table, schema, config);
      }

      if (table.seed) validateCsvSeed(table, schema);

      for (const dependency of table.dependsOn ?? []) {
        if (!tableNames.has(dependency)) {
          errors.push(`${table.name} depends on unknown table ${dependency}.`);
        }
        if (!created.has(dependency)) {
          errors.push(`${table.name} appears before dependency ${dependency} in manifest order.`);
        }
      }

      created.add(table.name);
    }

    validateDuplicateSeeds(manifest.tables);
  }
}

for (const [relativePath, parsed] of seenJson) {
  if (parsed && typeof parsed === "object" && relativePath.includes("import-config")) {
    if (!["insert", "upsert"].includes(parsed.operation)) {
      errors.push(`${relativePath} operation must be insert or upsert.`);
    }
  }
}

function validateImportConfig(table, schema, config) {
  if (!config.table_identifier) {
    errors.push(`${table.importConfig} must include table_identifier.`);
  }
  if (config.table_identifier !== table.name) {
    errors.push(`${table.importConfig} table_identifier must match ${table.name}.`);
  }
  if (!["insert", "upsert"].includes(config.operation)) {
    errors.push(`${table.importConfig} operation must be insert or upsert.`);
  }
  if (config.operation === "upsert" && !config.find_by) {
    errors.push(`${table.importConfig} upsert operation must include find_by.`);
  }
  if (config.find_by && schema?.columns) {
    const column = schema.columns.find((item) => item.name === config.find_by);
    if (!column) {
      errors.push(`${table.importConfig} find_by column ${config.find_by} does not exist in ${schema.table}.`);
    } else if (column.unique !== true) {
      errors.push(`${table.importConfig} find_by column ${config.find_by} must be unique in ${schema.table}.`);
    }
  }
}

function validateCsvSeed(table, schema) {
  const { headers, rows } = readCsv(table.seed);
  if (headers.length === 0) {
    errors.push(`${table.seed} must contain a header row.`);
    return;
  }
  if (headers.includes("ROWID")) {
    errors.push(`${table.seed} must not include Catalyst-managed ROWID.`);
  }

  const schemaColumns = new Set((schema?.columns ?? []).map((column) => column.name));
  for (const header of headers) {
    if (!schemaColumns.has(header)) {
      errors.push(`${table.seed} header ${header} is not documented in ${table.schema}.`);
    }
  }

  const secretPattern = /(password|secret|token|api[_-]?key|private[_-]?key)/i;
  rows.forEach((row, rowIndex) => {
    row.forEach((cell) => {
      if (secretPattern.test(cell)) {
        errors.push(`${table.seed} row ${rowIndex + 2} appears to contain a secret-like value.`);
      }
    });
  });
}

function validateDuplicateSeeds(tables) {
  const roleTable = tables.find((table) => table.name === "roles");
  if (roleTable?.seed) {
    rejectDuplicates(roleTable.seed, "name", "Duplicate role codes are not allowed.");
  }

  const userTable = tables.find((table) => table.name === "users");
  if (userTable?.seed) {
    rejectDuplicates(userTable.seed, "email", "Duplicate user identifiers are not allowed.");
  }
}

function rejectDuplicates(seedPath, columnName, message) {
  const { headers, rows } = readCsv(seedPath);
  const columnIndex = headers.indexOf(columnName);
  if (columnIndex === -1) return;
  const seen = new Set();
  for (const row of rows) {
    const value = row[columnIndex];
    if (seen.has(value)) errors.push(`${message} ${value}`);
    seen.add(value);
  }
}

if (errors.length > 0) {
  console.error("Database artifact validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Database artifact validation passed.");

