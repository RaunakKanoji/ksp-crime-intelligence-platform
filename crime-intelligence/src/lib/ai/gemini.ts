// Server-side Gemini NLP interpreter for AI Querying.
//
// Uses the Gemini Interactions REST API directly so we do not add a new SDK
// dependency. Only prompt text and allowed enum values are sent; FIR records,
// PII, and investigation notes are never sent to Gemini.

import { CATEGORIES, DISTRICTS } from "@/lib/dashboard/types";
import { type QueryInterpretation, type QueryMetric, type StructuredFilters } from "./types";

type GeminiStructuredFilters = Omit<StructuredFilters, "metric" | "dimension"> & {
  metric: QueryMetric;
  dimension: StructuredFilters["dimension"];
};

interface GeminiInterpretationPayload {
  intent: string;
  summary: string;
  filters: GeminiStructuredFilters;
  confidence: "high" | "medium" | "low";
}

interface GeminiInteractionResponse {
  output_text?: string;
  steps?: Array<{
    output?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

export interface GeminiInterpretationResult {
  interpretation: QueryInterpretation;
  confidence: "high" | "medium" | "low";
  providerNote: string;
}

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const ALLOWED_METRICS: QueryMetric[] = ["count", "ranking", "trend", "lookup"];
const ALLOWED_DIMENSIONS: Array<StructuredFilters["dimension"]> = [
  "district",
  "station",
  "category",
  "time",
  null,
];

function parseGeminiText(response: GeminiInteractionResponse): string {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const text = response.steps
    ?.flatMap((step) => step.output ?? [])
    .map((part) => part.text)
    .filter((part): part is string => typeof part === "string")
    .join("");
  return text?.trim() ?? "";
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Gemini response did not contain a JSON object.");
  return JSON.parse(raw.slice(start, end + 1));
}

function asAllowedString(value: unknown, allowed: readonly string[]): string | null {
  if (typeof value !== "string") return null;
  return allowed.includes(value) ? value : null;
}

function asTimeframeDays(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded < 1 || rounded > 366) return null;
  return rounded;
}

function validatePayload(payload: unknown): GeminiInterpretationPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Gemini response was not an object.");
  }
  const obj = payload as Record<string, unknown>;
  const filters = obj.filters as Record<string, unknown> | undefined;
  if (!filters || typeof filters !== "object") {
    throw new Error("Gemini response did not include filters.");
  }

  const metric = asAllowedString(filters.metric, ALLOWED_METRICS) as QueryMetric | null;
  if (!metric) throw new Error("Gemini response included an unsupported metric.");

  const category = asAllowedString(filters.category, CATEGORIES);
  const district = asAllowedString(filters.district, DISTRICTS);
  const station = typeof filters.station === "string" ? filters.station : null;
  const dimension =
    filters.dimension === null || filters.dimension === undefined
      ? null
      : (asAllowedString(filters.dimension, ALLOWED_DIMENSIONS.filter(Boolean) as string[]) as
          | StructuredFilters["dimension"]
          | null);

  return {
    intent: typeof obj.intent === "string" && obj.intent.trim() ? obj.intent.trim().slice(0, 100) : "Aggregate crime analysis",
    summary:
      typeof obj.summary === "string" && obj.summary.trim()
        ? obj.summary.trim().slice(0, 220)
        : "Interpreted with Gemini NLP.",
    filters: {
      metric,
      category,
      district,
      station,
      timeframeDays: asTimeframeDays(filters.timeframeDays),
      dimension: ALLOWED_DIMENSIONS.includes(dimension) ? dimension : null,
    },
    confidence:
      obj.confidence === "high" || obj.confidence === "medium" || obj.confidence === "low"
        ? obj.confidence
        : "medium",
  };
}

export async function interpretQueryWithGemini(prompt: string): Promise<GeminiInterpretationResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_NLP_MODEL || "gemini-3.5-flash";
  const systemInstruction = [
    "You interpret natural-language crime analytics queries for a Karnataka State Police demo app.",
    "Return JSON only. Do not include markdown.",
    "Do not invent FIR records, people, counts, locations, categories, or legal advice.",
    "Map the prompt only to supported aggregate filters.",
    `Allowed metrics: ${ALLOWED_METRICS.join(", ")}.`,
    `Allowed categories: ${CATEGORIES.join(", ")}.`,
    `Allowed districts: ${DISTRICTS.join(", ")}.`,
    "Allowed dimensions: district, station, category, time, null.",
    "Use null where the prompt does not specify a value.",
    'Schema: {"intent":"string","summary":"string","filters":{"metric":"count|ranking|trend|lookup","category":"allowed category|null","district":"allowed district|null","station":"string|null","timeframeDays":"number|null","dimension":"district|station|category|time|null"},"confidence":"high|medium|low"}',
  ].join("\n");

  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      system_instruction: systemInstruction,
      input: prompt,
      generation_config: {
        temperature: 0,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini NLP request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as GeminiInteractionResponse;
  const text = parseGeminiText(data);
  const parsed = validatePayload(extractJson(text));

  return {
    interpretation: {
      intent: parsed.intent,
      summary: parsed.summary,
      filters: parsed.filters,
    },
    confidence: parsed.confidence,
    providerNote: `Gemini NLP interpretation used model ${model}. Aggregates and redaction were still computed locally from authorized data.`,
  };
}
