import { hasPermission, type UserRole } from "@/lib/permissions";
import type {
  CaseLinkSignal,
  LinkConfidence,
  LinkedCaseCandidate,
  LinkedCaseDetectionResponse,
  LinkedCaseFilters,
  LinkSignalType,
} from "./types";

interface CaseRecord {
  id: string; firNumber: string; category: string; district: string; station: string;
  registeredAt: string; status: string; accusedIds: string[]; vehicleIds: string[];
  modusOperandi: string[]; locationKey: string; phoneHashes: string[]; hourBand: string;
  propertyType: string; associateIds: string[];
}

export class LinkedCaseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LinkedCaseValidationError";
  }
}

const CASES: CaseRecord[] = [
  { id: "FIR-SAMPLE-001", firNumber: "BLR-CEN-2026-0142", category: "Theft", district: "Bengaluru City", station: "Central Division", registeredAt: "2026-07-02T10:35:00+05:30", status: "Under Investigation", accusedIds: ["ACC-001-A"], vehicleIds: ["VEH-HASH-17"], modusOperandi: ["forced-lock", "two-wheeler", "daytime"], locationKey: "BLR-CENTRAL-MARKET", phoneHashes: ["PHONE-HASH-4"], hourBand: "morning", propertyType: "vehicle", associateIds: ["ACC-ASSOC-2"] },
  { id: "FIR-SAMPLE-009", firNumber: "HBD-VID-2026-0092", category: "Vehicle theft", district: "Bengaluru City", station: "Vijayanagar", registeredAt: "2026-04-18T09:15:00+05:30", status: "Open", accusedIds: ["ACC-001-A"], vehicleIds: ["VEH-HASH-31"], modusOperandi: ["forced-lock", "two-wheeler", "daytime"], locationKey: "BLR-WEST-PARKING", phoneHashes: ["PHONE-HASH-4"], hourBand: "morning", propertyType: "vehicle", associateIds: ["ACC-ASSOC-2"] },
  { id: "FIR-SAMPLE-012", firNumber: "BLR-UPR-2025-0811", category: "Theft", district: "Bengaluru City", station: "Upparpet", registeredAt: "2025-12-12T16:20:00+05:30", status: "Charge Sheet Filed", accusedIds: ["ACC-001-A"], vehicleIds: ["VEH-HASH-17"], modusOperandi: ["forced-lock", "two-wheeler"], locationKey: "BLR-CENTRAL-MARKET", phoneHashes: [], hourBand: "afternoon", propertyType: "vehicle", associateIds: [] },
  { id: "FIR-SAMPLE-013", firNumber: "MYS-LKR-2026-0031", category: "Burglary", district: "Mysuru", station: "Lashkar", registeredAt: "2026-03-11T07:40:00+05:30", status: "Open", accusedIds: ["ACC-006-A"], vehicleIds: [], modusOperandi: ["rear-entry", "toolmarks", "early-morning"], locationKey: "MYS-MARKET", phoneHashes: ["PHONE-HASH-9"], hourBand: "morning", propertyType: "shop", associateIds: ["ACC-ASSOC-8"] },
  { id: "FIR-SAMPLE-017", firNumber: "MYS-NZR-2025-0227", category: "Burglary", district: "Mysuru", station: "Nazarbad", registeredAt: "2025-11-21T06:50:00+05:30", status: "Under Investigation", accusedIds: [], vehicleIds: [], modusOperandi: ["rear-entry", "toolmarks", "early-morning"], locationKey: "MYS-MARKET", phoneHashes: [], hourBand: "morning", propertyType: "shop", associateIds: ["ACC-ASSOC-8"] },
];

const WEIGHTS: Record<LinkSignalType, number> = {
  "same-accused": 35, "same-vehicle": 25, "similar-modus-operandi": 20,
  "same-location": 15, "same-phone": 25, "similar-time-pattern": 8,
  "same-property-type": 7, "shared-associate": 15,
};

function intersects(a: string[], b: string[]) {
  return a.some((value) => b.includes(value));
}

function signal(type: LinkSignalType, label: string, explanation: string, sensitive = false): CaseLinkSignal {
  return { type, label, explanation, weight: WEIGHTS[type], sensitive };
}

function buildSignals(source: CaseRecord, target: CaseRecord): CaseLinkSignal[] {
  const signals: CaseLinkSignal[] = [];
  if (intersects(source.accusedIds, target.accusedIds)) signals.push(signal("same-accused", "Same accused", "A stable accused-person reference occurs in both sample FIRs.", true));
  if (intersects(source.vehicleIds, target.vehicleIds)) signals.push(signal("same-vehicle", "Same vehicle", "A protected normalized vehicle reference occurs in both sample FIRs."));
  const sharedMo = source.modusOperandi.filter((item) => target.modusOperandi.includes(item));
  if (sharedMo.length >= 2) signals.push(signal("similar-modus-operandi", "Similar modus operandi", `${sharedMo.length} structured MO attributes overlap: ${sharedMo.join(", ")}.`));
  if (source.locationKey === target.locationKey) signals.push(signal("same-location", "Same location", "Both FIRs share the same generalized occurrence-area key."));
  if (intersects(source.phoneHashes, target.phoneHashes)) signals.push(signal("same-phone", "Same phone reference", "A protected normalized phone reference occurs in both FIRs.", true));
  if (source.hourBand === target.hourBand) signals.push(signal("similar-time-pattern", "Similar time pattern", `Both incidents occurred in the ${source.hourBand} time band.`));
  if (source.propertyType === target.propertyType) signals.push(signal("same-property-type", "Same property type", `Both incidents concern the ${source.propertyType} property type.`));
  if (intersects(source.associateIds, target.associateIds)) signals.push(signal("shared-associate", "Shared associate", "A protected associate reference occurs in both FIRs.", true));
  return signals;
}

function validateDate(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new LinkedCaseValidationError(`${label} must be a valid date.`);
  }
}

export function validateLinkedCaseFilters(input: LinkedCaseFilters): LinkedCaseFilters {
  const sourceFirId = input.sourceFirId.trim().toUpperCase();
  if (!sourceFirId || sourceFirId.length > 40 || !/^[A-Z0-9-]+$/.test(sourceFirId)) {
    throw new LinkedCaseValidationError("A valid source FIR identifier is required.");
  }
  if (!CASES.some((item) => item.id === sourceFirId)) throw new LinkedCaseValidationError("The source FIR is unavailable.");
  if (input.from) validateDate(input.from, "From date");
  if (input.to) validateDate(input.to, "To date");
  if (input.from && input.to && input.from > input.to) throw new LinkedCaseValidationError("From date cannot be after to date.");
  const allowedConfidence: LinkConfidence[] = ["High", "Medium", "Low"];
  if (input.minimumConfidence && !allowedConfidence.includes(input.minimumConfidence)) throw new LinkedCaseValidationError("Confidence filter is invalid.");
  const districts = Array.from(new Set(CASES.map((item) => item.district)));
  if (input.district && !districts.includes(input.district)) throw new LinkedCaseValidationError("District filter is invalid.");
  return { ...input, sourceFirId };
}

function publicCase(record: CaseRecord): LinkedCaseCandidate["target"] {
  return { id: record.id, firNumber: record.firNumber, category: record.category, district: record.district, station: record.station, registeredAt: record.registeredAt, status: record.status };
}

export async function detectLinkedCases(input: LinkedCaseFilters, role: UserRole): Promise<LinkedCaseDetectionResponse> {
  if (!hasPermission(role, "page:linked-case-detection")) throw new Error("Permission denied.");
  const filters = validateLinkedCaseFilters(input);
  const source = CASES.find((item) => item.id === filters.sourceFirId)!;
  const canViewPhone = hasPermission(role, "data:view-pii");
  const canViewAssociates = hasPermission(role, "data:view-investigation-notes");
  const minimum = filters.minimumConfidence ?? "Low";
  const rank: Record<LinkConfidence, number> = { Low: 1, Medium: 2, High: 3 };
  const candidates = CASES.filter((item) =>
    item.id !== source.id &&
    (!filters.district || item.district === filters.district) &&
    (!filters.from || item.registeredAt.slice(0, 10) >= filters.from) &&
    (!filters.to || item.registeredAt.slice(0, 10) <= filters.to)
  ).map((target): LinkedCaseCandidate | null => {
    const allSignals = buildSignals(source, target);
    const visibleSignals = allSignals.filter((item) =>
      (item.type !== "same-phone" || canViewPhone) &&
      (item.type !== "shared-associate" || canViewAssociates) &&
      (item.type !== "same-accused" || hasPermission(role, "data:view-pii"))
    );
    const score = Math.min(100, visibleSignals.reduce((total, item) => total + item.weight, 0));
    const confidence: LinkConfidence = score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";
    if (score < 15 || rank[confidence] < rank[minimum]) return null;
    return {
      linkId: `LINK-${source.id}-${target.id}`, sourceFirId: source.id, target: publicCase(target),
      score, confidence, signals: visibleSignals,
      explanation: `${visibleSignals.length} authorized signal${visibleSignals.length === 1 ? "" : "s"} contribute to this possible link. The score is a weighted indicator, not evidence.`,
    };
  }).filter((item): item is LinkedCaseCandidate => item !== null)
    .sort((a, b) => b.score - a.score);
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    sourceCase: publicCase(source), candidates, total: candidates.length, isSampleData: true,
    generatedAt: new Date().toISOString(), phoneSignalsRedacted: !canViewPhone,
    associateSignalsRedacted: !canViewAssociates,
    explanation: "Possible case links are scored from authorized exact-reference matches and structured similarities. Every displayed signal states the field-level reason and fixed weight.",
    limitation: "Incomplete records, reused identifiers, common locations, and similar methods can create false links. MO similarity uses structured deterministic attributes rather than generative AI interpretation.",
    humanReviewRequired: true,
    availableFilters: {
      sourceCases: CASES.map((item) => ({ id: item.id, firNumber: item.firNumber })),
      districts: Array.from(new Set(CASES.map((item) => item.district))).sort(),
    },
  };
}
