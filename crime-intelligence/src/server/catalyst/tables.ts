export const CATALYST_TABLES = {
  USERS: "users",
  USER_PROFILES: "user_profiles",
  ROLES: "roles",
  USER_ROLE_ASSIGNMENTS: "user_role_assignments",
  JURISDICTION_ACCESS: "jurisdiction_access",
  DISTRICTS: "districts",
  POLICE_STATIONS: "police_stations",
  OFFICERS: "officers",
  CRIME_CATEGORIES: "crime_categories",
  CRIME_INCIDENTS: "crime_incidents",
  INCIDENT_LOCATIONS: "incident_locations",
  CASE_RECORDS: "case_records",
  ALERTS: "alerts",
  REPORTS: "reports",
  SAVED_QUERIES: "saved_queries",
  CHAT_SESSIONS: "chat_sessions",
  CHAT_MESSAGES: "chat_messages",
  AUDIT_EVENTS: "audit_events",
} as const;

export type CatalystTableName = (typeof CATALYST_TABLES)[keyof typeof CATALYST_TABLES];
