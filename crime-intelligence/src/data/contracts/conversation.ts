import type { JsonValue } from "./common";

export type QueryIntent = "crime_summary" | "case_search" | "fir_search" | "incident_search" | "officer_workload" | "station_performance" | "district_comparison" | "hotspot_search" | "trend_analysis" | "case_inactivity" | "evidence_status" | "suspect_search" | "vehicle_link_search" | "alert_summary" | "report_generation";
export type EntityReference = { id: string; type: string; label: string; href: string };
export type ConversationalQueryResponse = { intent: QueryIntent; answer: string; data: JsonValue; references: EntityReference[]; visualization?: { type: "table" | "bar" | "line" | "map" | "metric"; title: string; data: JsonValue }; suggestedQueries: string[]; isSyntheticData: true };
