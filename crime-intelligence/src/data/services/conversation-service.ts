import "server-only";

import type { CaseQuery } from "@/data/contracts/repositories";
import type { JsonValue } from "@/data/contracts/common";
import type { QueryIntent, ConversationalQueryResponse, EntityReference } from "@/data/contracts/conversation";
import { getRepositoryProvider } from "@/data/provider";
import { getMockDatabase } from "@/data/mock/database";
import { getMockConfig } from "@/data/mock/config";
import { AppError } from "@/server/catalyst/errors";

export type ParsedMockQuery = { intent: QueryIntent; filters: CaseQuery; normalizedQuery: string };

const categoryAliases: Record<string, string> = { theft: "Theft", burglary: "Burglary", robbery: "Robbery", assault: "Assault", cybercrime: "Cybercrime", fraud: "Fraud", narcotics: "Narcotics", "vehicle theft": "Vehicle theft", traffic: "Traffic offence" };

export function parseMockQuery(query: string): ParsedMockQuery {
  const normalizedQuery = query.trim().replace(/\s+/g, " "); if (normalizedQuery.length < 3) throw new AppError("VALIDATION_FAILED", "Ask a longer question.");
  const lower = normalizedQuery.toLowerCase(); let intent: QueryIntent = "crime_summary";
  if (lower.includes("officer") || lower.includes("workload") || lower.includes("assigned")) intent = "officer_workload";
  else if (lower.includes("station") && (lower.includes("highest") || lower.includes("performance") || lower.includes("pending"))) intent = "station_performance";
  else if (lower.includes("hotspot") || lower.includes("cluster")) intent = "hotspot_search";
  else if (lower.includes("trend") || lower.includes("over time") || lower.includes("last month")) intent = "trend_analysis";
  else if (lower.includes("evidence") || lower.includes("forensic")) intent = "evidence_status";
  else if (lower.includes("alert")) intent = "alert_summary";
  else if (lower.includes("fir")) intent = "fir_search";
  else if (lower.includes("case") || lower.includes("investigation")) intent = "case_search";
  else if (lower.includes("incident") || lower.includes("report")) intent = "incident_search";
  const provider = getRepositoryProvider(); const filters: CaseQuery = { page: 1, pageSize: 10 };
  const matchedCategory = Object.entries(categoryAliases).find(([alias]) => lower.includes(alias)); if (matchedCategory) { const category = getMockDatabase().data.categories.find((item) => item.name === matchedCategory[1]); if (category) filters.crimeCategoryId = category.id; }
  const district = getMockDatabase().data.districts.find((item) => lower.includes(item.name.toLowerCase())); if (district) filters.districtId = district.id;
  if (lower.includes("high priority") || lower.includes("high-priority")) filters.priority = ["high", "urgent"];
  if (lower.includes("closed")) filters.status = ["closed"];
  if (lower.includes("active") || lower.includes("pending")) filters.status = ["open", "under_investigation", "evidence_review", "suspect_identified", "charge_sheet", "court_support"];
  const dayMatch = lower.match(/last (\d+) days?/); if (dayMatch) { const days = Number(dayMatch[1]); const reference = new Date(getMockConfig().referenceDate); const from = new Date(reference.getTime() - days * 86_400_000).toISOString(); filters.openedFrom = from; filters.openedTo = getMockConfig().referenceDate; }
  void provider;
  return { intent, filters, normalizedQuery };
}

function referencesForCases(rows: Array<{ id: string; caseNumber: string; title: string }>): EntityReference[] { return rows.map((item) => ({ id: item.id, type: "case", label: item.caseNumber, href: `/cases/status-tracking?caseId=${item.id}` })); }

export async function answerMockQuery(query: string): Promise<ConversationalQueryResponse> {
  const parsed = parseMockQuery(query); const provider = getRepositoryProvider();
  if (parsed.intent === "officer_workload") { const rows = await provider.dashboard.casePerformance(); return { intent: parsed.intent, answer: `${rows.length} synthetic officers have case workload data. The busiest current queue is ${rows[0]?.officer ?? "not available"}.`, data: rows.slice(0, 10) as unknown as JsonValue, references: rows.slice(0, 10).map((item) => ({ id: item.officerId, type: "officer", label: item.officer, href: `/admin/user-management?officerId=${item.officerId}` })), visualization: { type: "bar", title: "Synthetic officer workload", data: rows.slice(0, 10) as unknown as JsonValue }, suggestedQueries: ["Which stations have the highest pending case count?", "Show high-priority cases from the last 30 days."], isSyntheticData: true }; }
  if (parsed.intent === "station_performance") { const rows = await provider.dashboard.stations(); return { intent: parsed.intent, answer: `${rows.length} synthetic stations were compared using incident, active-case, and overdue-task records.`, data: rows.slice(0, 10) as unknown as JsonValue, references: rows.slice(0, 10).map((item) => ({ id: item.stationId, type: "station", label: item.station, href: `/analytics?stationId=${item.stationId}` })), visualization: { type: "bar", title: "Synthetic station performance", data: rows.slice(0, 10) as unknown as JsonValue }, suggestedQueries: ["Show hotspots in Bengaluru North.", "Compare district crime trends."], isSyntheticData: true }; }
  if (parsed.intent === "hotspot_search") { const rows = await provider.hotspots.getMapMarkers({ districtId: parsed.filters.districtId, crimeCategoryId: parsed.filters.crimeCategoryId }); return { intent: parsed.intent, answer: `${rows.length} synthetic hotspot aggregates match the interpreted filters. These are area-level signals requiring human review.`, data: rows as unknown as JsonValue, references: rows.slice(0, 10).map((item) => ({ id: item.id, type: "hotspot", label: item.id, href: `/crime-map?hotspotId=${item.id}` })), visualization: { type: "map", title: "Synthetic hotspot markers", data: rows as unknown as JsonValue }, suggestedQueries: ["Show high-priority theft cases in the last 30 days.", "Which stations have the highest pending case count?"], isSyntheticData: true }; }
  if (parsed.intent === "trend_analysis") { const rows = await provider.dashboard.trends(); return { intent: parsed.intent, answer: "The trend result is calculated from the synthetic incident, FIR, and closed-case records for the latest reference window.", data: rows as unknown as JsonValue, references: [], visualization: { type: "line", title: "Synthetic 30-day trend", data: rows as unknown as JsonValue }, suggestedQueries: ["Show cybercrime incidents by district.", "Find repeat-location hotspots."], isSyntheticData: true }; }
  if (parsed.intent === "evidence_status") { const rows = await provider.evidence.findMany({ page: 1, pageSize: 100 }); const pending = rows.data.filter((item) => item.forensicStatus === "pending" || item.forensicStatus === "in_review"); return { intent: parsed.intent, answer: `${pending.length} synthetic evidence records require forensic or custody review.`, data: pending as unknown as JsonValue, references: pending.slice(0, 10).map((item) => ({ id: item.id, type: "evidence", label: item.evidenceNumber, href: `/cases/status-tracking?caseId=${item.caseId}` })), suggestedQueries: ["Show cases with no recent activity.", "Summarize active alerts."], isSyntheticData: true }; }
  if (parsed.intent === "alert_summary") { const rows = await provider.alerts.findMany({ page: 1, pageSize: 100, districtId: parsed.filters.districtId }); return { intent: parsed.intent, answer: `${rows.data.filter((item) => item.status !== "resolved").length} synthetic alerts remain open or acknowledged in the selected scope.`, data: rows.data as unknown as JsonValue, references: rows.data.slice(0, 10).map((item) => ({ id: item.id, type: "alert", label: item.title, href: `/cases/risk-alerts?alertId=${item.id}` })), suggestedQueries: ["Show high-priority theft cases in the last 30 days."], isSyntheticData: true }; }
  const result = parsed.intent === "fir_search" ? await provider.firs.findMany({ page: 1, pageSize: 10, districtId: parsed.filters.districtId, crimeCategoryId: parsed.filters.crimeCategoryId, priority: parsed.filters.priority }) : parsed.intent === "incident_search" ? await provider.incidents.findMany({ page: 1, pageSize: 10, districtId: parsed.filters.districtId, crimeCategoryId: parsed.filters.crimeCategoryId, priority: parsed.filters.priority }) : await provider.cases.findMany(parsed.filters);
  const rows = result.data; const caseReferences = parsed.intent === "case_search" ? referencesForCases(rows as Array<{ id: string; caseNumber: string; title: string }>) : [];
  return { intent: parsed.intent, answer: `${rows.length} synthetic ${parsed.intent.replace("_", " ")} records match the interpreted filters. Results are derived from the repository and are not operational evidence.`, data: rows as unknown as JsonValue, references: caseReferences, visualization: { type: "table", title: `Synthetic ${parsed.intent.replace("_", " ")} results`, data: rows as unknown as JsonValue }, suggestedQueries: ["Which stations have the highest pending case count?", "Show recent hotspot trends."], isSyntheticData: true };
}

export async function createMockConversation(userId: string, query: string) {
  const data = getMockDatabase().data; const answer = await answerMockQuery(query); const sessionId = `CONV-MOCK-USER-${String(data.conversations.length + 1).padStart(4, "0")}`; const createdAt = getMockConfig().referenceDate; data.conversations.push({ id: sessionId, userId, title: query.slice(0, 80), contextType: "search", startedAt: createdAt, lastMessageAt: createdAt, status: "active", isSyntheticData: true, createdAt, updatedAt: createdAt }); data.messages.push({ id: `MSG-MOCK-USER-${String(data.messages.length + 1).padStart(5, "0")}`, sessionId, role: "user", content: query, queryIntent: answer.intent, filters: {}, referencedEntityIds: [], isSyntheticData: true, createdAt }); data.messages.push({ id: `MSG-MOCK-USER-${String(data.messages.length + 1).padStart(5, "0")}`, sessionId, role: "assistant", content: answer.answer, queryIntent: answer.intent, filters: {}, referencedEntityIds: answer.references.map((item) => item.id), generatedVisualization: answer.visualization as unknown as JsonValue, isSyntheticData: true, createdAt }); return { session: data.conversations[data.conversations.length - 1], answer };
}
