import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "database/manifest.json"), "utf8"));

console.log("Catalyst Data Store Console Schema Checklist");
console.log("===========================================");

for (const table of manifest.tables) {
  const schema = JSON.parse(fs.readFileSync(path.join(root, table.schema), "utf8"));
  console.log("");
  console.log(`Table: ${schema.table}`);
  console.log(`Purpose: ${schema.purpose}`);
  console.log(`Creation order: ${schema.creationOrder}`);
  console.log(`Scope: ${schema.tableScope}`);
  console.log("Columns:");

  for (const column of schema.columns) {
    const parts = [
      `  - ${column.name}`,
      `type=${column.type}`,
      column.maxLength ? `length=${column.maxLength}` : null,
      `mandatory=${column.mandatory === true}`,
      `unique=${column.unique === true}`,
      column.default !== undefined ? `default=${column.default}` : null,
      column.foreignKey ? `foreignKey=${column.foreignKey}` : null
    ].filter(Boolean);
    console.log(parts.join(" | "));
  }

  console.log(`Searchable fields: ${(schema.searchableFields ?? []).join(", ") || "none"}`);
  console.log(`Index recommendations: ${(schema.indexRecommendations ?? []).join(", ") || "none"}`);
  console.log(`Permissions: ${JSON.stringify(schema.rolePermissions)}`);
  console.log(`Archive behavior: ${schema.archiveBehavior}`);
  console.log(`Audit requirements: ${schema.auditRequirements}`);
}

