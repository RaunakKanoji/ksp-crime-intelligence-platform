import { hasPermission, type UserRole } from "@/lib/permissions";
import type { MoAnalysisFilters, MoAnalysisResponse, MoAttribute, MoConfidence, MoFir, MoPattern } from "./types";

interface RawFir {
  id: string; firNumber: string; category: string; district: string; station: string;
  registeredAt: string; incidentTimeRange: string; incidentNarrative: string;
}

export class MoAnalysisValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoAnalysisValidationError";
  }
}

const FIRS: RawFir[] = [
  { id: "FIR-SAMPLE-001", firNumber: "BLR-CEN-2026-0142", category: "Theft", district: "Bengaluru City", station: "Central Division", registeredAt: "2026-07-02T10:35:00+05:30", incidentTimeRange: "Morning", incidentNarrative: "Two-wheeler targeted in public parking. The steering lock was forced with a metal tool during daytime." },
  { id: "FIR-SAMPLE-009", firNumber: "HBD-VID-2026-0092", category: "Vehicle theft", district: "Bengaluru City", station: "Vijayanagar", registeredAt: "2026-04-18T09:15:00+05:30", incidentTimeRange: "Morning", incidentNarrative: "Two-wheeler taken from public parking after the steering lock was forced with a metal tool." },
  { id: "FIR-SAMPLE-012", firNumber: "BLR-UPR-2025-0811", category: "Theft", district: "Bengaluru City", station: "Upparpet", registeredAt: "2025-12-12T16:20:00+05:30", incidentTimeRange: "Afternoon", incidentNarrative: "Two-wheeler targeted near a market. Steering lock showed force marks consistent with a metal tool." },
  { id: "FIR-SAMPLE-013", firNumber: "MYS-LKR-2026-0031", category: "Burglary", district: "Mysuru", station: "Lashkar", registeredAt: "2026-03-11T07:40:00+05:30", incidentTimeRange: "Early morning", incidentNarrative: "Shop entered through a rear opening. Tool marks were found on the shutter after an early-morning entry." },
  { id: "FIR-SAMPLE-017", firNumber: "MYS-NZR-2025-0227", category: "Burglary", district: "Mysuru", station: "Nazarbad", registeredAt: "2025-11-21T06:50:00+05:30", incidentTimeRange: "Early morning", incidentNarrative: "Rear entry into a shop after the shutter was pried. Similar tool marks were documented." },
  { id: "FIR-SAMPLE-018", firNumber: "BLR-WFD-2026-0204", category: "Cybercrime", district: "Bengaluru City", station: "Whitefield", registeredAt: "2026-06-20T14:10:00+05:30", incidentTimeRange: "Afternoon", incidentNarrative: "Caller impersonated a support agent and sent a phishing link requesting account credentials." },
  { id: "FIR-SAMPLE-019", firNumber: "MYS-CYB-2026-0064", category: "Cybercrime", district: "Mysuru", station: "Cyber Crime", registeredAt: "2026-05-09T15:35:00+05:30", incidentTimeRange: "Afternoon", incidentNarrative: "Message impersonated customer support and used a phishing link to request account credentials." },
];

const RULES: Array<{ type: MoAttribute["type"]; value: string; terms: string[]; sourceField?: MoAttribute["sourceField"] }> = [
  { type: "entry-method", value: "Forced lock", terms: ["lock was forced", "force marks"] },
  { type: "entry-method", value: "Rear entry", terms: ["rear opening", "rear entry"] },
  { type: "entry-method", value: "Phishing link", terms: ["phishing link"] },
  { type: "target", value: "Two-wheeler", terms: ["two-wheeler"] },
  { type: "target", value: "Shop", terms: ["shop"] },
  { type: "target", value: "Account credentials", terms: ["account credentials"] },
  { type: "tool", value: "Metal tool", terms: ["metal tool", "tool marks"] },
  { type: "approach", value: "Support impersonation", terms: ["support agent", "customer support"] },
  { type: "transport", value: "Public parking vehicle", terms: ["public parking"] },
  { type: "timing", value: "Morning", terms: ["morning"], sourceField: "incidentTimeRange" },
  { type: "timing", value: "Afternoon", terms: ["afternoon"], sourceField: "incidentTimeRange" },
];

export function extractMoAttributes(fir: RawFir): MoAttribute[] {
  return RULES.filter((rule) => {
    const field = rule.sourceField ?? "incidentNarrative";
    const source = fir[field].toLowerCase();
    return rule.terms.some((term) => source.includes(term));
  }).map((rule) => ({ type: rule.type, value: rule.value, sourceField: rule.sourceField ?? "incidentNarrative" }));
}

function date(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) throw new MoAnalysisValidationError(`${label} must be a valid date.`);
}

export function validateMoFilters(input: MoAnalysisFilters): Required<Pick<MoAnalysisFilters, "minimumSimilarity">> & MoAnalysisFilters {
  const search = input.search?.trim() ?? "";
  if (search.length > 100) throw new MoAnalysisValidationError("Search text must be 100 characters or fewer.");
  const minimumSimilarity = input.minimumSimilarity ?? 50;
  if (!Number.isInteger(minimumSimilarity) || minimumSimilarity < 20 || minimumSimilarity > 100) throw new MoAnalysisValidationError("Minimum similarity must be between 20 and 100.");
  if (input.from) date(input.from, "From date");
  if (input.to) date(input.to, "To date");
  if (input.from && input.to && input.from > input.to) throw new MoAnalysisValidationError("From date cannot be after to date.");
  const categories = Array.from(new Set(FIRS.map((fir) => fir.category)));
  const districts = Array.from(new Set(FIRS.map((fir) => fir.district)));
  if (input.category && !categories.includes(input.category)) throw new MoAnalysisValidationError("Category filter is invalid.");
  if (input.district && !districts.includes(input.district)) throw new MoAnalysisValidationError("District filter is invalid.");
  return { ...input, search, minimumSimilarity };
}

function similarity(a: MoAttribute[], b: MoAttribute[]) {
  const left = new Set(a.map((item) => `${item.type}:${item.value}`));
  const right = new Set(b.map((item) => `${item.type}:${item.value}`));
  const intersection = Array.from(left).filter((item) => right.has(item)).length;
  const union = new Set([...Array.from(left), ...Array.from(right)]).size;
  return union ? Math.round(intersection / union * 100) : 0;
}

function publicFir(fir: RawFir, attributes: MoAttribute[]): MoFir {
  return { id: fir.id, firNumber: fir.firNumber, category: fir.category, district: fir.district, station: fir.station, registeredAt: fir.registeredAt, attributes };
}

export async function analyzeModusOperandi(input: MoAnalysisFilters, role: UserRole): Promise<MoAnalysisResponse> {
  if (!hasPermission(role, "page:modus-operandi-analysis")) throw new Error("Permission denied.");
  const filters = validateMoFilters(input);
  const search = filters.search?.toLowerCase();
  const records = FIRS.filter((fir) =>
    (!filters.category || fir.category === filters.category) &&
    (!filters.district || fir.district === filters.district) &&
    (!filters.from || fir.registeredAt.slice(0, 10) >= filters.from) &&
    (!filters.to || fir.registeredAt.slice(0, 10) <= filters.to) &&
    (!search || `${fir.firNumber} ${fir.category} ${fir.incidentNarrative}`.toLowerCase().includes(search))
  ).map((fir) => ({ fir, attributes: extractMoAttributes(fir) }));
  const used = new Set<string>();
  const patterns: MoPattern[] = [];
  records.forEach((base) => {
    if (used.has(base.fir.id) || base.attributes.length === 0) return;
    const matches = records.filter((candidate) =>
      !used.has(candidate.fir.id) && similarity(base.attributes, candidate.attributes) >= filters.minimumSimilarity
    );
    matches.forEach((match) => used.add(match.fir.id));
    if (!matches.length) return;
    const scores = matches.map((match) => similarity(base.attributes, match.attributes));
    const score = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
    const confidence: MoConfidence = score >= 80 ? "High" : score >= 55 ? "Medium" : "Low";
    const shared = base.attributes.filter((attribute) => matches.every((match) => match.attributes.some((item) => item.type === attribute.type && item.value === attribute.value)));
    const linkedFirs = matches.map((match) => publicFir(match.fir, match.attributes));
    patterns.push({
      id: `MO-${base.fir.id}`, label: shared.map((item) => item.value).join(" + ") || `${base.fir.category} method`,
      category: base.fir.category, attributes: shared, linkedFirs, firCount: linkedFirs.length,
      districts: Array.from(new Set(matches.map((match) => match.fir.district))),
      similarityScore: score, confidence, repeatPattern: linkedFirs.length >= 2,
      explanation: `${shared.length} controlled attribute${shared.length === 1 ? "" : "s"} recur across ${linkedFirs.length} authorized FIRs. Similarity is the intersection-over-union of extracted type/value attributes.`,
    });
  });
  const categoryGroups = Array.from(new Set(patterns.map((pattern) => pattern.category))).map((category) => ({
    category, patternCount: patterns.filter((pattern) => pattern.category === category).length,
    linkedFirCount: patterns.filter((pattern) => pattern.category === category).reduce((sum, pattern) => sum + pattern.firCount, 0),
  }));
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    patterns: patterns.sort((a, b) => b.firCount - a.firCount || b.similarityScore - a.similarityScore),
    categoryGroups, total: patterns.length, isSampleData: true, extractionMethod: "deterministic-rules",
    generatedAt: new Date().toISOString(),
    explanation: "Deterministic rules extract controlled MO attributes only from authorized incident narrative, incident time range, and crime category fields. Pattern similarity uses a separately testable set-overlap calculation.",
    limitation: "Narrative wording and missing fields can hide or overstate similarity. A repeated method does not prove common authorship, identity, intent, or guilt.",
    humanReviewRequired: true,
    auditNote: "AI-query audit persistence is pending feature 035. MO analysis views and verification outcomes must be logged to Catalyst Data Store when audit logs are active.",
    availableFilters: { categories: Array.from(new Set(FIRS.map((fir) => fir.category))).sort(), districts: Array.from(new Set(FIRS.map((fir) => fir.district))).sort() },
  };
}
