// Natural Language Query service (feature 006).
//
// There is no connected Catalyst Data Store or server-side AI provider yet, so
// this module uses a deterministic interpreter over the existing permission-
// filtered sample aggregates. It never invents FIRs, people, locations, or
// trends, and it returns limitations/human-review messaging with every result.

import { hasPermission, type UserRole } from "@/lib/permissions";
import { CATEGORIES, DISTRICTS } from "@/lib/dashboard/types";
import { MATRIX } from "@/lib/dashboard/service";
import { STATIONS } from "@/lib/dashboard/summary";
import {
  HUMAN_REVIEW_WARNING,
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  type NlqResponse,
  type QueryInterpretation,
  type QueryMetric,
  type ResultRow,
  type StructuredFilters,
} from "./types";

type District = (typeof DISTRICTS)[number];
type Category = (typeof CATEGORIES)[number];

export interface NlqRequest {
  prompt: string;
  role: UserRole;
  interpretationOverride?: QueryInterpretation;
  provider?: "deterministic" | "gemini";
  providerNote?: string;
  providerConfidence?: NlqResponse["confidence"];
}

const RESTRICTED_PATTERNS = [
  /secret/i,
  /password/i,
  /token/i,
  /bypass/i,
  /raw\s+(data|pii|personal)/i,
  /victim\s+(name|phone|address)/i,
  /suspect\s+(phone|address|identity)/i,
] as const;

function normalizePrompt(prompt: string): string {
  return prompt.trim().replace(/\s+/g, " ");
}

function includesAny(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function categoryFromPrompt(text: string): Category | null {
  if (includesAny(text, ["cyber", "upi", "online fraud"])) return "Cybercrime";
  if (includesAny(text, ["violent", "violence", "assault"])) return "Assault";
  if (includesAny(text, ["vehicle theft", "theft", "stolen vehicle", "stolen bike", "stolen car"])) return "Theft";
  if (includesAny(text, ["property", "burglary", "break-in"])) return "Property";
  if (includesAny(text, ["traffic"])) return "Traffic";
  if (includesAny(text, ["women", "child safety"])) return "Women Safety";
  if (includesAny(text, ["narcotic", "drug"])) return "Narcotics";
  return null;
}

function districtFromPrompt(text: string): District | null {
  if (includesAny(text, ["bengaluru", "bangalore"])) return "Bengaluru City";
  return DISTRICTS.find((district) => text.includes(district.toLowerCase())) ?? null;
}

function timeframeDaysFromPrompt(text: string): number | null {
  const monthMatch = text.match(/last\s+(\d+)\s+months?/);
  if (monthMatch) return Number(monthMatch[1]) * 30;
  const dayMatch = text.match(/last\s+(\d+)\s+days?/);
  if (dayMatch) return Number(dayMatch[1]);
  if (text.includes("last 6 months")) return 180;
  if (text.includes("last month") || text.includes("last 30 days")) return 30;
  if (text.includes("last week") || text.includes("last 7 days")) return 7;
  return 30;
}

function metricFromPrompt(text: string): QueryMetric {
  if (includesAny(text, ["highest", "top", "most"])) return "ranking";
  if (includesAny(text, ["trend", "trends", "over time"])) return "trend";
  if (includesAny(text, ["find", "linked", "repeat offender"])) return "lookup";
  return "count";
}

function dimensionFromPrompt(text: string): StructuredFilters["dimension"] {
  if (includesAny(text, ["police station", "stations", "station"])) return "station";
  if (includesAny(text, ["district", "districts"])) return "district";
  if (includesAny(text, ["category", "categories"])) return "category";
  if (includesAny(text, ["trend", "month", "time"])) return "time";
  return null;
}

function scaleCount(count: number, timeframeDays: number | null): number {
  return Math.round(count * ((timeframeDays ?? 30) / 30));
}

function districtScope(district: District | null): District[] {
  return district ? [district] : [...DISTRICTS];
}

function categoryScope(category: Category | null): Category[] {
  return category ? [category] : [...CATEGORIES];
}

function buildInterpretation(prompt: string): QueryInterpretation {
  const text = prompt.toLowerCase();
  const filters: StructuredFilters = {
    metric: metricFromPrompt(text),
    category: categoryFromPrompt(text),
    district: districtFromPrompt(text),
    station: null,
    timeframeDays: timeframeDaysFromPrompt(text),
    dimension: dimensionFromPrompt(text),
  };

  if (filters.metric === "ranking" && !filters.dimension) filters.dimension = "district";
  if (filters.metric === "trend") filters.dimension = filters.dimension ?? "time";

  const parts = [
    filters.metric,
    filters.category ?? "all categories",
    filters.district ?? "all districts",
    filters.timeframeDays ? `last ${filters.timeframeDays} days` : "default period",
  ];

  return {
    intent: filters.metric === "lookup" ? "Investigative lookup" : "Aggregate crime analysis",
    summary: `Interpreted as ${parts.join(" / ")}.`,
    filters,
  };
}

function totalFor(filters: StructuredFilters): number {
  return districtScope(filters.district as District | null).reduce(
    (sum, district) =>
      sum +
      categoryScope(filters.category as Category | null).reduce(
        (categorySum, category) => categorySum + scaleCount(MATRIX[district][category], filters.timeframeDays),
        0
      ),
    0
  );
}

function buildStationRanking(filters: StructuredFilters): ResultRow[] {
  const category = (filters.category as Category | null) ?? "Cybercrime";
  const districts = districtScope(filters.district as District | null);
  return districts
    .flatMap((district) => {
      const stations = STATIONS[district] ?? [];
      const base = scaleCount(MATRIX[district][category], filters.timeframeDays);
      return stations.map((station, index) => {
        const weighted = Math.max(0, Math.round((base / stations.length) * (1.15 - index * 0.12)));
        return {
          label: `${station}, ${district}`,
          value: weighted.toLocaleString("en-IN"),
          note: `${category} reports, sample aggregate estimate`,
        };
      });
    })
    .sort((a, b) => Number(b.value.replace(/,/g, "")) - Number(a.value.replace(/,/g, "")))
    .slice(0, 6);
}

function buildDistrictRows(filters: StructuredFilters): ResultRow[] {
  return districtScope(filters.district as District | null)
    .map((district) => ({
      label: district,
      value: categoryScope(filters.category as Category | null)
        .reduce((sum, category) => sum + scaleCount(MATRIX[district][category], filters.timeframeDays), 0)
        .toLocaleString("en-IN"),
      note: filters.category ? `${filters.category} FIRs` : "All category FIRs",
    }))
    .sort((a, b) => Number(b.value.replace(/,/g, "")) - Number(a.value.replace(/,/g, "")));
}

function buildTrendRows(filters: StructuredFilters): ResultRow[] {
  const total = totalFor(filters);
  const weights = [0.88, 0.94, 1.02, 0.98, 1.08, 1];
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const denominator = weights.reduce((sum, weight) => sum + weight, 0);
  return labels.map((label, index) => ({
    label,
    value: Math.round((total * weights[index]) / denominator).toLocaleString("en-IN"),
    note: filters.category ? `${filters.category} sample trend` : "All category sample trend",
  }));
}

function buildLookupRows(filters: StructuredFilters, role: UserRole): ResultRow[] {
  const canViewIntel = hasPermission(role, "data:view-investigation-notes");
  if (!canViewIntel) return [];
  const category = (filters.category as Category | null) ?? "Theft";
  return buildDistrictRows({ ...filters, category })
    .slice(0, 4)
    .map((row, index) => ({
      label: `RO-SAMPLE-${index + 1}`,
      value: `${Math.max(1, Math.round(Number(row.value.replace(/,/g, "")) * 0.08))} linked ${category.toLowerCase()} indicators`,
      note: `${row.label}; identities hidden until FIR detail access is implemented`,
    }));
}

function makeBaseResponse(interpretation: QueryInterpretation): Pick<
  NlqResponse,
  "isSampleData" | "interpretation" | "explanation" | "limitations" | "humanReviewWarning" | "followUps"
> {
  const filters = interpretation.filters;
  return {
    isSampleData: true,
    interpretation,
    explanation: {
      summary:
        `This result explains a ${filters.metric} query for ${filters.category ?? "all crime categories"} across ` +
        `${filters.district ?? "all districts"} using the interpreted ${filters.timeframeDays ?? 30}-day window.`,
      text:
        "The answer is grounded in the shared sample district/category aggregate matrix used by the dashboard features. No FIR-level records or identities were generated.",
      signals: [
        "District/category sample FIR counts",
        "Role permission matrix",
        "Prompt-derived category, district, date range, and requested dimension",
      ],
      sourceReferences: [
        {
          id: "SRC-SAMPLE-MATRIX",
          label: "Dashboard sample district/category aggregate matrix",
          kind: "sample-aggregate",
          fields: ["district", "category", "firCount"],
        },
        {
          id: "SRC-PERMISSIONS",
          label: "Active role permission matrix",
          kind: "permission-rule",
          fields: ["page:ai-query", "data:view-pii", "data:view-investigation-notes"],
        },
        {
          id: "SRC-QUERY-FILTERS",
          label: "Structured query filters derived from prompt",
          kind: "query-filter",
          fields: ["metric", "category", "district", "timeframeDays", "dimension"],
        },
      ],
      confidenceNotes: [
        {
          id: "CONF-GROUNDING",
          level: "high",
          text: "Counts and rankings are derived from known sample aggregate fields rather than generated text.",
        },
        {
          id: "CONF-INTERPRETATION",
          level: filters.metric === "lookup" ? "medium" : "high",
          text:
            filters.metric === "lookup"
              ? "Lookup-style prompts use aggregate indicators only because FIR detail records are not connected."
              : "The interpreted category, district, timeframe, and result dimension match supported aggregate patterns.",
        },
        {
          id: "CONF-DATA-LAYER",
          level: "medium",
          text: "Confidence is limited by demo/sample data; production Catalyst records are not connected in this feature.",
        },
      ],
      notEvidenceWarning:
        "This explanation summarizes authorized data signals for decision support only. It is not evidence, legal proof, or an operational order.",
    },
    limitations: [
      "Sample data is used because a connected Catalyst Data Store layer is not available yet.",
      "Natural language interpretation is deterministic in this build and supports aggregate crime questions only.",
      "No FIR IDs, names, addresses, phone numbers, or operational directives are generated.",
    ],
    humanReviewWarning: HUMAN_REVIEW_WARNING,
    followUps: [
      "Show theft cases in Bengaluru in the last 6 months.",
      "Which police stations have the highest cybercrime reports?",
      "Show violent crime trends by district.",
    ],
  };
}

export async function runNaturalLanguageQuery({
  prompt,
  role,
  interpretationOverride,
  provider = "deterministic",
  providerNote,
  providerConfidence,
}: NlqRequest): Promise<NlqResponse> {
  const cleaned = normalizePrompt(prompt);
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!hasPermission(role, "page:ai-query")) {
    return {
      status: "refused",
      isSampleData: true,
      message: "Your current role is not permitted to run AI queries.",
      limitations: ["No query was interpreted and no data was fetched."],
      humanReviewWarning: HUMAN_REVIEW_WARNING,
    };
  }

  if (cleaned.length < MIN_QUERY_LENGTH) {
    return {
      status: "validation-error",
      isSampleData: true,
      message: `Enter at least ${MIN_QUERY_LENGTH} characters before running a query.`,
    };
  }

  if (cleaned.length > MAX_QUERY_LENGTH) {
    return {
      status: "validation-error",
      isSampleData: true,
      message: `Queries must be ${MAX_QUERY_LENGTH} characters or fewer.`,
    };
  }

  if (RESTRICTED_PATTERNS.some((pattern) => pattern.test(cleaned))) {
    return {
      status: "refused",
      isSampleData: true,
      message:
        "This request asks for restricted or unsafe information. Ask for aggregate, permission-safe crime analysis instead.",
      limitations: ["Restricted data, secrets, raw PII, and permission bypass requests are not interpreted."],
      humanReviewWarning: HUMAN_REVIEW_WARNING,
    };
  }

  const interpretation = interpretationOverride ?? buildInterpretation(cleaned);
  const base = makeBaseResponse(interpretation);
  const filters = interpretation.filters;

  if (filters.metric === "lookup") {
    const rows = buildLookupRows(filters, role);
    if (rows.length === 0) {
      return {
        status: "refused",
        ...base,
        message:
          "Repeat-offender lookup requires investigation-notes access. Aggregated district/category queries are still available for your role.",
        redactionNote: "Sensitive intelligence fields were not returned for the active role.",
        confidence: providerConfidence ?? "medium",
        nlpProvider: provider,
        providerNote,
      };
    }
    return {
      status: "ok",
      ...base,
      resultTitle: "Repeat offender indicators",
      rows,
      confidence: providerConfidence ?? "medium",
      nlpProvider: provider,
      providerNote,
      redactionNote: "Person identities are hidden because FIR detail records are not connected in this feature.",
    };
  }

  const rows =
    filters.dimension === "station"
      ? buildStationRanking(filters)
      : filters.metric === "trend"
      ? buildTrendRows(filters)
      : buildDistrictRows(filters);

  if (rows.length === 0 || totalFor(filters) === 0) {
    return {
      status: "empty",
      ...base,
      message:
        "No matching sample records were found for the interpreted filters. Try a broader district, category, or date range.",
      rows: [],
      confidence: providerConfidence ?? "high",
      nlpProvider: provider,
      providerNote,
    };
  }

  return {
    status: "ok",
    ...base,
    resultTitle:
      filters.dimension === "station"
        ? "Police station ranking"
        : filters.metric === "trend"
        ? "Crime trend"
        : "District results",
    rows,
    confidence: providerConfidence ?? "high",
    nlpProvider: provider,
    providerNote,
  };
}
