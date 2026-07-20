import type { DataProvider } from "@/data/contracts/common";

function numberEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function referenceDateEnv(): string {
  const value = process.env.MOCK_REFERENCE_DATE || "2026-07-20";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "2026-07-20T00:00:00.000Z" : parsed.toISOString();
}

export type MockConfig = {
  enabled: boolean;
  seed: number;
  referenceDate: string;
  latencyMs: number;
  failureMode: boolean;
  counts: {
    districts: number;
    stations: number;
    officers: number;
    persons: number;
    incidents: number;
    firs: number;
    cases: number;
    evidence: number;
    notes: number;
    tasks: number;
    alerts: number;
    reports: number;
    hotspots: number;
    beats: number;
    vehicles: number;
    auditLogs: number;
    conversations: number;
  };
};

export function getDataProvider(): DataProvider {
  return process.env.DATA_PROVIDER === "neon" ? "neon" : "mock";
}

export function getMockConfig(): MockConfig {
  return {
    enabled: process.env.MOCK_DATABASE_ENABLED !== "false",
    seed: numberEnv("MOCK_DATABASE_SEED", 20260720),
    referenceDate: referenceDateEnv(),
    latencyMs: Number.isFinite(Number(process.env.MOCK_DATABASE_LATENCY_MS)) ? Math.max(0, Number(process.env.MOCK_DATABASE_LATENCY_MS)) : 0,
    failureMode: process.env.MOCK_DATABASE_FAILURE === "true",
    counts: {
      districts: Math.max(8, Math.min(12, numberEnv("MOCK_DISTRICT_COUNT", 10))),
      stations: Math.max(25, Math.min(40, numberEnv("MOCK_STATION_COUNT", 32))),
      officers: Math.max(40, Math.min(180, numberEnv("MOCK_OFFICER_COUNT", 146))),
      persons: Math.max(400, Math.min(700, numberEnv("MOCK_PERSON_COUNT", 612))),
      incidents: Math.max(300, Math.min(500, numberEnv("MOCK_INCIDENT_COUNT", 420))),
      firs: Math.max(200, Math.min(350, numberEnv("MOCK_FIR_COUNT", 286))),
      cases: Math.max(200, Math.min(350, numberEnv("MOCK_CASE_COUNT", 278))),
      evidence: Math.max(400, Math.min(800, numberEnv("MOCK_EVIDENCE_COUNT", 648))),
      notes: Math.max(500, Math.min(1000, numberEnv("MOCK_NOTE_COUNT", 760))),
      tasks: Math.max(500, Math.min(1000, numberEnv("MOCK_TASK_COUNT", 700))),
      alerts: Math.max(100, Math.min(200, numberEnv("MOCK_ALERT_COUNT", 132))),
      reports: Math.max(30, Math.min(60, numberEnv("MOCK_REPORT_COUNT", 45))),
      hotspots: Math.max(50, Math.min(100, numberEnv("MOCK_HOTSPOT_COUNT", 80))),
      beats: Math.max(30, Math.min(60, numberEnv("MOCK_BEAT_COUNT", 45))),
      vehicles: Math.max(150, Math.min(300, numberEnv("MOCK_VEHICLE_COUNT", 220))),
      auditLogs: Math.max(500, Math.min(1000, numberEnv("MOCK_AUDIT_COUNT", 800))),
      conversations: Math.max(20, Math.min(40, numberEnv("MOCK_CONVERSATION_COUNT", 30))),
    },
  };
}
