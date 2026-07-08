// Typed domain models for Natural Language Query (feature 006).
// No unstructured `any`; all AI output is grounded in labeled sample data.

export type QueryMetric = "count" | "ranking" | "trend" | "lookup";
export type Confidence = "high" | "medium" | "low";
export type NlqStatus = "ok" | "empty" | "refused" | "validation-error";
export type NlpProvider = "deterministic" | "gemini";

/** The machine-readable query the interpreter derived from the prompt. */
export interface StructuredFilters {
  metric: QueryMetric;
  category: string | null;
  district: string | null;
  station: string | null;
  timeframeDays: number | null;
  dimension: "district" | "station" | "category" | "time" | null;
}

export interface QueryInterpretation {
  intent: string;
  summary: string;
  filters: StructuredFilters;
}

export interface ResultRow {
  label: string;
  value: string;
  note?: string;
}

export interface SourceReference {
  id: string;
  label: string;
  kind: "sample-aggregate" | "permission-rule" | "query-filter" | "derived-signal";
  fields: string[];
}

export interface ConfidenceNote {
  id: string;
  level: Confidence;
  text: string;
}

export interface QueryExplanation {
  summary: string;
  text: string;
  /** Source fields / signals the answer was derived from. */
  signals: string[];
  sourceReferences: SourceReference[];
  confidenceNotes: ConfidenceNote[];
  notEvidenceWarning: string;
}

export interface NlqResponse {
  status: NlqStatus;
  isSampleData: boolean;
  nlpProvider?: NlpProvider;
  providerNote?: string;
  /** User-facing message for empty / refused / validation-error states. */
  message?: string;
  interpretation?: QueryInterpretation;
  resultTitle?: string;
  rows?: ResultRow[];
  explanation?: QueryExplanation;
  confidence?: Confidence;
  limitations?: string[];
  humanReviewWarning?: string;
  followUps?: string[];
  redactionNote?: string;
}

export const EXAMPLE_QUERIES = [
  "Show theft cases in Bengaluru in the last 6 months.",
  "Which police stations have the highest cybercrime reports?",
  "Find repeat offenders linked to vehicle theft.",
  "Show violent crime trends by district.",
] as const;

export const MIN_QUERY_LENGTH = 4;
export const MAX_QUERY_LENGTH = 300;

export const HUMAN_REVIEW_WARNING =
  "This AI interpretation is decision-support only. It is not final legal, investigative, or operational proof and must be verified by an authorized officer against source FIR records.";
