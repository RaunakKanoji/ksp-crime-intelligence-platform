import { hasPermission, type UserRole } from "@/lib/permissions";
import type {
  MatchConfidence,
  MatchSignal,
  RepeatOffenderDetectionResponse,
  RepeatOffenderFilters,
  RepeatOffenderResult,
} from "./types";

interface IdentityRecord {
  personId: string;
  name: string;
  aliases: string[];
  ageRange: string;
  locations: string[];
  firs: RepeatOffenderResult["linkedFirs"];
}

export class RepeatOffenderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepeatOffenderValidationError";
  }
}

const RECORDS: IdentityRecord[] = [
  {
    personId: "ACC-001-A", name: "Ravi K.", aliases: ["Ravi Kumar", "RK"], ageRange: "25-35",
    locations: ["Central Bengaluru", "Vijayanagar, Bengaluru"],
    firs: [
      { id: "FIR-SAMPLE-001", firNumber: "BLR-CEN-2026-0142", category: "Theft", district: "Bengaluru City", station: "Central Division", registeredAt: "2026-07-02T10:35:00+05:30" },
      { id: "FIR-SAMPLE-009", firNumber: "HBD-VID-2026-0092", category: "Vehicle theft", district: "Bengaluru City", station: "Vijayanagar", registeredAt: "2026-04-18T09:15:00+05:30" },
      { id: "FIR-SAMPLE-012", firNumber: "BLR-UPR-2025-0811", category: "Theft", district: "Bengaluru City", station: "Upparpet", registeredAt: "2025-12-12T16:20:00+05:30" },
    ],
  },
  {
    personId: "ACC-006-A", name: "M. Shankar", aliases: ["Manju", "Shankar M."], ageRange: "35-45",
    locations: ["Mysuru Central", "Mandya"],
    firs: [
      { id: "FIR-SAMPLE-013", firNumber: "MYS-LKR-2026-0031", category: "Burglary", district: "Mysuru", station: "Lashkar", registeredAt: "2026-03-11T07:40:00+05:30" },
      { id: "FIR-SAMPLE-014", firNumber: "MDY-CEN-2025-0178", category: "Property crime", district: "Mandya", station: "Central", registeredAt: "2025-10-22T22:10:00+05:30" },
    ],
  },
  {
    personId: "ACC-007-A", name: "S. Manjunath", aliases: ["Manju"], ageRange: "25-35",
    locations: ["Mandya"],
    firs: [
      { id: "FIR-SAMPLE-015", firNumber: "MDY-WST-2026-0044", category: "Theft", district: "Mandya", station: "West", registeredAt: "2026-02-08T12:25:00+05:30" },
      { id: "FIR-SAMPLE-016", firNumber: "MDY-CEN-2025-0194", category: "Property crime", district: "Mandya", station: "Central", registeredAt: "2025-11-01T18:05:00+05:30" },
    ],
  },
];

function validDate(value: string, label: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new RepeatOffenderValidationError(`${label} must be a valid date.`);
  }
  return value;
}

export function validateFilters(input: RepeatOffenderFilters): Required<Pick<RepeatOffenderFilters, "minimumFirCount">> & RepeatOffenderFilters {
  const search = input.search?.trim() ?? "";
  if (search.length > 80) throw new RepeatOffenderValidationError("Search text must be 80 characters or fewer.");
  const minimumFirCount = input.minimumFirCount ?? 2;
  if (!Number.isInteger(minimumFirCount) || minimumFirCount < 2 || minimumFirCount > 20) {
    throw new RepeatOffenderValidationError("Minimum FIR count must be between 2 and 20.");
  }
  const from = input.from ? validDate(input.from, "From date") : undefined;
  const to = input.to ? validDate(input.to, "To date") : undefined;
  if (from && to && from > to) throw new RepeatOffenderValidationError("From date cannot be after to date.");
  for (const value of [input.category, input.district]) {
    if (value && (value.length > 60 || !/^[\w .&-]+$/i.test(value))) {
      throw new RepeatOffenderValidationError("A filter value is invalid.");
    }
  }
  return { ...input, search, from, to, minimumFirCount };
}

function scoreRecord(record: IdentityRecord): { score: number; confidence: MatchConfidence; signals: MatchSignal[]; conflicts: string[] } {
  const signals: MatchSignal[] = [
    { field: "name", explanation: "Normalized name is consistent across linked sample FIR identities.", weight: 45 },
    { field: "ageRange", explanation: `Age range ${record.ageRange} is consistent across available records.`, weight: 20 },
    { field: "location", explanation: `${record.locations.length} generalized location signal(s) overlap linked records.`, weight: 15 },
  ];
  const aliasCollision = record.aliases.some((alias) =>
    RECORDS.some((other) => other.personId !== record.personId && other.aliases.includes(alias))
  );
  const conflicts = aliasCollision
    ? ["Alias is shared with another sample identity; name and age range do not fully agree."]
    : [];
  if (record.aliases.length) signals.push({ field: "alias", explanation: `${record.aliases.length} alias signal(s) support the grouping.`, weight: aliasCollision ? 5 : 15 });
  const score = signals.reduce((sum, signal) => sum + signal.weight, 0) - conflicts.length * 15;
  return { score, confidence: score >= 85 ? "High" : score >= 60 ? "Medium" : "Low", signals, conflicts };
}

export async function detectRepeatOffenders(
  filtersInput: RepeatOffenderFilters,
  role: UserRole
): Promise<RepeatOffenderDetectionResponse> {
  if (!hasPermission(role, "page:repeat-offender-detection")) {
    throw new Error("Permission denied.");
  }
  const filters = validateFilters(filtersInput);
  const canViewPii = hasPermission(role, "data:view-pii");
  const search = filters.search?.toLowerCase();
  const results = RECORDS.map((record): RepeatOffenderResult | null => {
    const firs = record.firs.filter((fir) =>
      (!filters.category || fir.category === filters.category) &&
      (!filters.district || fir.district === filters.district) &&
      (!filters.from || fir.registeredAt.slice(0, 10) >= filters.from) &&
      (!filters.to || fir.registeredAt.slice(0, 10) <= filters.to)
    );
    if (firs.length < filters.minimumFirCount!) return null;
    if (search && ![record.personId, record.name, ...record.aliases].some((v) => v.toLowerCase().includes(search))) return null;
    const match = scoreRecord(record);
    const dates = firs.map((fir) => fir.registeredAt).sort();
    return {
      matchId: `MATCH-${record.personId}`, personId: record.personId,
      displayName: canViewPii ? record.name : null, firCount: firs.length,
      categories: Array.from(new Set(firs.map((fir) => fir.category))),
      locations: Array.from(new Set(firs.map((fir) => `${fir.station}, ${fir.district}`))),
      firstSeen: dates[0], lastSeen: dates[dates.length - 1],
      confidence: match.confidence, confidenceScore: Math.max(0, match.score),
      identityStatus: match.conflicts.length ? "Identity conflict" : match.confidence === "High" ? "Likely match" : "Possible match",
      signals: match.signals, conflicts: match.conflicts, linkedFirs: firs,
    };
  }).filter((result): result is RepeatOffenderResult => result !== null)
    .sort((a, b) => b.firCount - a.firCount || b.confidenceScore - a.confidenceScore);

  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    results, total: results.length, isSampleData: true,
    explanation: "Candidates are grouped using normalized identity, alias, age-range, and generalized location signals, then retained only when the filtered FIR count reaches the selected threshold.",
    limitation: "Sample records may be incomplete or inconsistent. Shared names, aliases, and locations can create false matches; this output is neither proof of identity nor a finding of guilt.",
    humanReviewRequired: true, redacted: !canViewPii, generatedAt: new Date().toISOString(),
    availableFilters: {
      categories: Array.from(new Set(RECORDS.flatMap((r) => r.firs.map((f) => f.category)))).sort(),
      districts: Array.from(new Set(RECORDS.flatMap((r) => r.firs.map((f) => f.district)))).sort(),
    },
  };
}
