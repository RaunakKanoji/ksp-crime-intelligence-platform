import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const root = process.cwd();
loadDotEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Add it to .env.local or export it in your shell.");
  process.exit(1);
}

const require = createRequire(import.meta.url);
installTypeScriptLoader();
const { getMockConfig } = require(path.join(root, "src/data/mock/config.ts"));
const { seedMockDatabase } = require(path.join(root, "src/data/mock/seed/index.ts"));
const state = seedMockDatabase(getMockConfig());
const mockUsers = state.users.map((user) => ({
  email: user.email,
  displayName: user.name,
  role: roleName(user.role),
  districtId: user.districtId,
  stationId: user.stationId,
  phone: user.email.includes("example.invalid") ? "999999XXXX" : "999999XXXX",
}));

const firById = new Map(state.firs.map((fir) => [fir.id, fir]));
const caseById = new Map(state.cases.map((record) => [record.id, record]));
const officerById = new Map(state.officers.map((officer) => [officer.id, officer]));
const userEmailById = new Map(state.users.map((user) => [user.id, user.email]));
const userEmailByOfficerId = new Map(state.users.filter((user) => user.officerId).map((user) => [user.officerId, user.email]));
const districtIdByName = new Map([["Bengaluru City", "BENGALURU-CITY"], ["Mysuru", "MYSURU"], ["Belagavi", "BELAGAVI"], ["Kalaburagi", "KALABURAGI"], ["Mangaluru", "MANGALURU"], ["Hubballi-Dharwad", "HUBBALLI-DHARWAD"]]);
const stationIdByName = new Map([["Central Division", "CENTRAL-DIVISION"], ["Whitefield", "WHITEFIELD"], ["Devaraja", "DEVARAJA"], ["Nazarbad", "NAZARBAD"], ["Camp", "CAMP"], ["Station Bazar", "STATION-BAZAR"]]);
const categoryIdByName = new Map([["Vehicle theft", "VEHICLE-THEFT"], ["Burglary", "BURGLARY"], ["Assault", "ASSAULT"], ["Narcotics", "NARCOTICS"]]);
const districtDbId = (id) => districtIdByName.get(state.districts.find((district) => district.id === id)?.name) ?? id;
const stationDbId = (id) => stationIdByName.get(state.stations.find((station) => station.id === id)?.name) ?? id;
const categoryDbId = (id) => categoryIdByName.get(state.categories.find((category) => category.id === id)?.name) ?? id;

const statements = [
  "BEGIN;",
  insert("districts", ["district_id", "name", "status", "created_at", "created_by", "updated_at", "updated_by", "version", "is_deleted"], state.districts.map((district) => [districtDbId(district.id), district.name, "active", district.createdAt, "mock-seed", district.updatedAt, "mock-seed", 1, false]), "district_id"),
  insert("police_stations", ["station_id", "district_id", "name", "status", "created_at", "created_by", "updated_at", "updated_by", "version", "is_deleted"], state.stations.map((station) => [stationDbId(station.id), districtDbId(station.districtId), station.name, station.operationalStatus === "inactive" ? "inactive" : "active", station.createdAt, "mock-seed", station.updatedAt, "mock-seed", 1, false]), "station_id"),
  insert("crime_categories", ["category_id", "name", "severity_default", "status", "created_at", "created_by", "updated_at", "updated_by", "version", "is_deleted"], state.categories.map((category) => [categoryDbId(category.id), category.name, category.severityDefault, category.active ? "active" : "inactive", category.createdAt, "mock-seed", category.updatedAt, "mock-seed", 1, false]), "category_id"),
  insert("officers", ["officer_id", "display_name", "rank_title", "district_id", "station_id", "status", "created_at", "created_by", "updated_at", "updated_by", "version", "is_deleted"], state.officers.map((officer) => [officer.id, officer.displayName, officer.rank, officer.districtId ? districtDbId(officer.districtId) : null, officer.stationId ? stationDbId(officer.stationId) : null, officer.status, officer.createdAt, "mock-seed", officer.updatedAt, "mock-seed", 1, false]), "officer_id"),
  insert("users", ["email", "display_name", "status", "role_id", "district_id", "station_id", "phone", "created_at", "created_by", "updated_at", "updated_by", "version", "is_archived", "development_only"], mockUsers.map((user) => [user.email, user.displayName, "active", user.role, user.districtId ? districtDbId(user.districtId) : null, user.stationId ? stationDbId(user.stationId) : null, user.phone, "2026-07-20T00:00:00.000Z", "mock-seed", "2026-07-20T00:00:00.000Z", "mock-seed", 1, false, true]), "email"),
  insert("user_profiles", ["user_id", "rank_title", "organization_id", "district_id", "station_id", "status", "created_at", "created_by", "updated_at", "updated_by", "version", "is_archived"], state.users.map((user) => [user.email, user.role, "KSP-MOCK", user.districtId ? districtDbId(user.districtId) : null, user.stationId ? stationDbId(user.stationId) : null, "active", user.createdAt, "mock-seed", user.updatedAt, "mock-seed", 1, false]), "user_id"),
  insert("crime_incidents", ["incident_id", "fir_number", "title", "description", "crime_category_id", "district_id", "station_id", "occurred_at", "reported_at", "status", "severity", "priority", "latitude", "longitude", "assigned_officer_id", "created_at", "created_by", "updated_at", "updated_by", "version", "is_deleted", "deleted_at", "deleted_by"], state.incidents.map((incident) => [incident.id, incident.incidentNumber, incident.title, incident.description, categoryDbId(incident.crimeCategoryId), districtDbId(incident.districtId), stationDbId(incident.stationId), incident.occurredAt, incident.reportedAt, incident.status, incident.severity, incident.priority, incident.latitude, incident.longitude, incident.assignedOfficerId ?? null, incident.createdAt, "mock-seed", incident.updatedAt, "mock-seed", 1, Boolean(incident.deletedAt), incident.deletedAt ?? null, null]), "incident_id"),
  insert("incident_locations", ["location_id", "incident_id", "latitude", "longitude", "address_text", "created_at", "created_by", "updated_at", "updated_by", "version", "is_deleted"], state.locations.filter((location) => location.type === "crime_scene" || location.type === "hotspot").map((location) => { const match = location.id.match(/SCENE-(\d+)$/); const incident = match ? state.incidents[Number(match[1]) - 1] : undefined; return [location.id, incident?.id ?? null, location.latitude, location.longitude, `${location.name}; ${location.ward}; ${location.jurisdiction}`, location.createdAt, "mock-seed", location.updatedAt, "mock-seed", 1, false]; }).filter((row) => row[1]), "location_id"),
  insert("case_records", ["case_id", "incident_id", "case_status", "assigned_officer_id", "created_at", "created_by", "updated_at", "updated_by", "version", "is_deleted"], state.cases.map((record) => { const fir = firById.get(record.firId); return [record.id, fir?.incidentId ?? null, record.status, record.leadOfficerId ?? null, record.createdAt, "mock-seed", record.updatedAt, "mock-seed", 1, Boolean(record.deletedAt)]; }).filter((row) => row[1]), "case_id"),
  insert("alerts", ["alert_id", "incident_id", "title", "severity", "status", "created_at", "created_by", "updated_at", "updated_by", "version", "is_deleted"], state.alerts.map((alert) => { const record = alert.caseId ? caseById.get(alert.caseId) : undefined; const fir = record ? firById.get(record.firId) : undefined; return [alert.id, fir?.incidentId ?? state.incidents[0]?.id ?? null, alert.title, alert.severity, alert.status, alert.generatedAt, "mock-seed", alert.updatedAt, "mock-seed", 1, false]; }).filter((row) => row[1]), "alert_id"),
  insert("reports", ["report_id", "title", "created_by", "created_at", "format", "status", "filters_json", "is_deleted"], state.intelligenceReports.map((report) => [report.id, report.title, userEmailByOfficerId.get(report.authorOfficerId) ?? mockUsers[0]?.email, report.createdAt, "json", report.status, JSON.stringify({ isSyntheticData: true, summary: report.summary, districtId: report.districtId ?? null }), false]), "report_id"),
  insert("chat_sessions", ["session_id", "owner_id", "title", "created_at", "updated_at", "is_deleted"], state.conversations.map((session) => [session.id, userEmailById.get(session.userId) ?? mockUsers[0]?.email, session.title, session.createdAt, session.updatedAt, false]), "session_id"),
  insert("chat_messages", ["message_id", "session_id", "role", "content", "created_at", "is_deleted"], state.messages.map((message) => [message.id, message.sessionId, message.role, message.content, message.createdAt, false]), "message_id"),
  "COMMIT;",
].filter(Boolean).join("\n");

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
const result = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", "-"], { cwd: root, env: process.env, input: statements, encoding: "utf8", stdio: ["pipe", "inherit", "inherit"] });
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`Seeded Neon with ${state.incidents.length} incidents, ${state.cases.length} cases, ${state.alerts.length} alerts, ${state.intelligenceReports.length} reports, and ${state.messages.length} messages.`);

function insert(table, columns, rows, conflictColumn) {
  if (!rows.length) return "";
  const values = rows.map((row) => `(${row.map(sqlValue).join(", ")})`).join(",\n");
  const updates = columns.filter((column) => column !== conflictColumn).map((column) => `${quoteIdent(column)} = EXCLUDED.${quoteIdent(column)}`).join(", ");
  return `INSERT INTO ${quoteIdent(table)} (${columns.map(quoteIdent).join(", ")}) VALUES\n${values}\nON CONFLICT (${quoteIdent(conflictColumn)}) DO UPDATE SET ${updates};\n`;
}

function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function quoteIdent(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function roleName(role) {
  if (role === "super_admin" || role === "district_admin" || role === "station_admin") return "Admin";
  if (role === "investigating_officer") return "Investigator";
  if (role === "crime_analyst" || role === "intelligence_officer") return "Analyst";
  if (role === "read_only") return "Viewer";
  return "Officer";
}

function normalizeDatabaseUrl(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith("psql ")) return trimmed.slice(5).trim().replace(/^['"]|['"]$/g, "");
  return trimmed.replace(/^['"]|['"]$/g, "");
}

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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

function installTypeScriptLoader() {
  const ts = require("typescript");
  const Module = require("node:module");
  const originalResolve = Module._resolveFilename;
  Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
    const base = request.startsWith("@/") ? path.join(root, "src", request.slice(2)) : request.startsWith(".") && parent?.filename?.endsWith(".ts") ? path.resolve(path.dirname(parent.filename), request) : null;
    if (base) {
      for (const candidate of [base, `${base}.ts`, `${base}.js`, path.join(base, "index.ts")]) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
      }
    }
    return originalResolve.call(this, request, parent, isMain, options);
  };
  Module._extensions[".ts"] = function compileTypeScript(module, filename) {
    const source = fs.readFileSync(filename, "utf8");
    const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true, moduleResolution: ts.ModuleResolutionKind.NodeJs } }).outputText;
    module._compile(output, filename);
  };
}
