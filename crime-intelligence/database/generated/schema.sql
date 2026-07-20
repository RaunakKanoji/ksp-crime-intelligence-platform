-- Generated from database/schema/*.json. Do not edit by hand.
-- Regenerate with: npm run db:generate:postgres

BEGIN;

-- Application role definitions mapped from Catalyst Authentication roles and app permissions.
CREATE TABLE IF NOT EXISTS "roles" (
  "name" varchar(50) NOT NULL,
  "description" varchar(500) NOT NULL,
  "status" varchar(30) NOT NULL DEFAULT 'active',
  "catalyst_role_id" varchar(100),
  "created_at" timestamptz NOT NULL,
  "created_by" varchar(100) NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "updated_by" varchar(100) NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "is_archived" boolean NOT NULL DEFAULT false,
  "archived_at" timestamptz,
  "archived_by" varchar(100),
  CONSTRAINT "roles_pkey" PRIMARY KEY ("name"),
  CONSTRAINT "roles_catalyst_role_id_key" UNIQUE ("catalyst_role_id")
);
CREATE INDEX IF NOT EXISTS "roles_status_idx" ON "roles" ("status");
CREATE INDEX IF NOT EXISTS "roles_is_archived_idx" ON "roles" ("is_archived");

-- Application profile for Catalyst-authenticated users. Authentication identity remains owned by Catalyst Auth.
CREATE TABLE IF NOT EXISTS "users" (
  "email" varchar(254) NOT NULL,
  "display_name" varchar(160) NOT NULL,
  "status" varchar(30) NOT NULL DEFAULT 'active',
  "role_id" varchar(100),
  "district_id" varchar(100),
  "station_id" varchar(100),
  "phone" varchar(30),
  "last_login_at" timestamptz,
  "created_at" timestamptz NOT NULL,
  "created_by" varchar(100) NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "updated_by" varchar(100) NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "is_archived" boolean NOT NULL DEFAULT false,
  "archived_at" timestamptz,
  "archived_by" varchar(100),
  "development_only" boolean NOT NULL DEFAULT false,
  CONSTRAINT "users_pkey" PRIMARY KEY ("email"),
  CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("name")
);
CREATE INDEX IF NOT EXISTS "users_role_id_idx" ON "users" ("role_id");
CREATE INDEX IF NOT EXISTS "users_district_id_idx" ON "users" ("district_id");
CREATE INDEX IF NOT EXISTS "users_station_id_idx" ON "users" ("station_id");
CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users" ("status");
CREATE INDEX IF NOT EXISTS "users_is_archived_idx" ON "users" ("is_archived");

-- Non-authentication profile details for application users.
CREATE TABLE IF NOT EXISTS "user_profiles" (
  "user_id" varchar(100) NOT NULL,
  "rank_title" varchar(120),
  "organization_id" varchar(100),
  "district_id" varchar(100),
  "station_id" varchar(100),
  "status" varchar(30) NOT NULL DEFAULT 'active',
  "created_at" timestamptz NOT NULL,
  "created_by" varchar(100) NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "updated_by" varchar(100) NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "is_archived" boolean NOT NULL DEFAULT false,
  "archived_at" timestamptz,
  "archived_by" varchar(100),
  CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id"),
  CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("email")
);
CREATE INDEX IF NOT EXISTS "user_profiles_organization_id_idx" ON "user_profiles" ("organization_id");
CREATE INDEX IF NOT EXISTS "user_profiles_district_id_idx" ON "user_profiles" ("district_id");
CREATE INDEX IF NOT EXISTS "user_profiles_station_id_idx" ON "user_profiles" ("station_id");
CREATE INDEX IF NOT EXISTS "user_profiles_status_idx" ON "user_profiles" ("status");

-- Assignment history connecting application users to roles.
CREATE TABLE IF NOT EXISTS "user_role_assignments" (
  "assignment_key" varchar(220) NOT NULL,
  "user_id" varchar(100) NOT NULL,
  "role_id" varchar(100) NOT NULL,
  "status" varchar(30) NOT NULL DEFAULT 'active',
  "assigned_at" timestamptz NOT NULL,
  "assigned_by" varchar(100) NOT NULL,
  "removed_at" timestamptz,
  "removed_by" varchar(100),
  "created_at" timestamptz NOT NULL,
  "created_by" varchar(100) NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "updated_by" varchar(100) NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "is_archived" boolean NOT NULL DEFAULT false,
  CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("assignment_key"),
  CONSTRAINT "user_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("email"),
  CONSTRAINT "user_role_assignments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("name")
);
CREATE INDEX IF NOT EXISTS "user_role_assignments_user_id_idx" ON "user_role_assignments" ("user_id");
CREATE INDEX IF NOT EXISTS "user_role_assignments_role_id_idx" ON "user_role_assignments" ("role_id");
CREATE INDEX IF NOT EXISTS "user_role_assignments_status_idx" ON "user_role_assignments" ("status");
CREATE INDEX IF NOT EXISTS "user_role_assignments_assigned_at_idx" ON "user_role_assignments" ("assigned_at");

-- Jurisdiction or organizational access granted to application users.
CREATE TABLE IF NOT EXISTS "jurisdiction_access" (
  "access_key" varchar(260) NOT NULL,
  "user_id" varchar(100) NOT NULL,
  "organization_id" varchar(100),
  "district_id" varchar(100),
  "station_id" varchar(100),
  "access_level" varchar(30) NOT NULL,
  "status" varchar(30) NOT NULL DEFAULT 'active',
  "created_at" timestamptz NOT NULL,
  "created_by" varchar(100) NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "updated_by" varchar(100) NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "is_archived" boolean NOT NULL DEFAULT false,
  "archived_at" timestamptz,
  "archived_by" varchar(100),
  CONSTRAINT "jurisdiction_access_pkey" PRIMARY KEY ("access_key"),
  CONSTRAINT "jurisdiction_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("email")
);
CREATE INDEX IF NOT EXISTS "jurisdiction_access_user_id_idx" ON "jurisdiction_access" ("user_id");
CREATE INDEX IF NOT EXISTS "jurisdiction_access_organization_id_idx" ON "jurisdiction_access" ("organization_id");
CREATE INDEX IF NOT EXISTS "jurisdiction_access_district_id_idx" ON "jurisdiction_access" ("district_id");
CREATE INDEX IF NOT EXISTS "jurisdiction_access_station_id_idx" ON "jurisdiction_access" ("station_id");
CREATE INDEX IF NOT EXISTS "jurisdiction_access_status_idx" ON "jurisdiction_access" ("status");

-- Append-only security and operational audit trail.
CREATE TABLE IF NOT EXISTS "audit_events" (
  "actor_id" varchar(100) NOT NULL,
  "actor_role" varchar(50),
  "action" varchar(120) NOT NULL,
  "entity_type" varchar(80) NOT NULL,
  "entity_id" varchar(120),
  "occurred_at" timestamptz NOT NULL,
  "outcome" varchar(30) NOT NULL DEFAULT 'success',
  "route" varchar(300),
  "previous_state_json" text,
  "new_state_json" text,
  "error_code" varchar(80),
  "correlation_id" varchar(120),
  CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users" ("email")
);
CREATE INDEX IF NOT EXISTS "audit_events_actor_id_idx" ON "audit_events" ("actor_id");
CREATE INDEX IF NOT EXISTS "audit_events_action_idx" ON "audit_events" ("action");
CREATE INDEX IF NOT EXISTS "audit_events_entity_type_idx" ON "audit_events" ("entity_type");
CREATE INDEX IF NOT EXISTS "audit_events_entity_id_idx" ON "audit_events" ("entity_id");
CREATE INDEX IF NOT EXISTS "audit_events_occurred_at_idx" ON "audit_events" ("occurred_at");
CREATE INDEX IF NOT EXISTS "audit_events_outcome_idx" ON "audit_events" ("outcome");

-- Reference list of Karnataka policing districts.
CREATE TABLE IF NOT EXISTS "districts" (
  "district_id" varchar(100) NOT NULL,
  "name" varchar(160) NOT NULL,
  "status" varchar(30) NOT NULL DEFAULT 'active',
  "created_at" timestamptz NOT NULL,
  "created_by" varchar(100) NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "updated_by" varchar(100) NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamptz,
  "deleted_by" varchar(100),
  CONSTRAINT "districts_pkey" PRIMARY KEY ("district_id"),
  CONSTRAINT "districts_name_key" UNIQUE ("name")
);
CREATE INDEX IF NOT EXISTS "districts_name_idx" ON "districts" ("name");
CREATE INDEX IF NOT EXISTS "districts_status_idx" ON "districts" ("status");
CREATE INDEX IF NOT EXISTS "districts_is_deleted_idx" ON "districts" ("is_deleted");

-- Police station reference data linked to districts.
CREATE TABLE IF NOT EXISTS "police_stations" (
  "station_id" varchar(100) NOT NULL,
  "district_id" varchar(100) NOT NULL,
  "name" varchar(160) NOT NULL,
  "status" varchar(30) NOT NULL DEFAULT 'active',
  "created_at" timestamptz NOT NULL,
  "created_by" varchar(100) NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "updated_by" varchar(100) NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamptz,
  "deleted_by" varchar(100),
  CONSTRAINT "police_stations_pkey" PRIMARY KEY ("station_id"),
  CONSTRAINT "police_stations_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts" ("district_id")
);
CREATE INDEX IF NOT EXISTS "police_stations_district_id_idx" ON "police_stations" ("district_id");
CREATE INDEX IF NOT EXISTS "police_stations_status_idx" ON "police_stations" ("status");
CREATE INDEX IF NOT EXISTS "police_stations_is_deleted_idx" ON "police_stations" ("is_deleted");

-- Normalized crime category reference data.
CREATE TABLE IF NOT EXISTS "crime_categories" (
  "category_id" varchar(100) NOT NULL,
  "name" varchar(160) NOT NULL,
  "severity_default" varchar(30) NOT NULL DEFAULT 'medium',
  "status" varchar(30) NOT NULL DEFAULT 'active',
  "created_at" timestamptz NOT NULL,
  "created_by" varchar(100) NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "updated_by" varchar(100) NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "is_deleted" boolean NOT NULL DEFAULT false,
  CONSTRAINT "crime_categories_pkey" PRIMARY KEY ("category_id"),
  CONSTRAINT "crime_categories_name_key" UNIQUE ("name")
);
CREATE INDEX IF NOT EXISTS "crime_categories_name_idx" ON "crime_categories" ("name");
CREATE INDEX IF NOT EXISTS "crime_categories_status_idx" ON "crime_categories" ("status");
CREATE INDEX IF NOT EXISTS "crime_categories_is_deleted_idx" ON "crime_categories" ("is_deleted");

-- Operational officer records for assignments and workload.
CREATE TABLE IF NOT EXISTS "officers" (
  "officer_id" varchar(100) NOT NULL,
  "display_name" varchar(160) NOT NULL,
  "rank_title" varchar(120),
  "district_id" varchar(100),
  "station_id" varchar(100),
  "status" varchar(30) NOT NULL DEFAULT 'active',
  "created_at" timestamptz NOT NULL,
  "created_by" varchar(100) NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "updated_by" varchar(100) NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamptz,
  "deleted_by" varchar(100),
  CONSTRAINT "officers_pkey" PRIMARY KEY ("officer_id"),
  CONSTRAINT "officers_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts" ("district_id"),
  CONSTRAINT "officers_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "police_stations" ("station_id")
);
CREATE INDEX IF NOT EXISTS "officers_district_id_idx" ON "officers" ("district_id");
CREATE INDEX IF NOT EXISTS "officers_station_id_idx" ON "officers" ("station_id");
CREATE INDEX IF NOT EXISTS "officers_status_idx" ON "officers" ("status");
CREATE INDEX IF NOT EXISTS "officers_is_deleted_idx" ON "officers" ("is_deleted");

-- Primary operational incident records.
CREATE TABLE IF NOT EXISTS "crime_incidents" (
  "incident_id" varchar(120) NOT NULL,
  "fir_number" varchar(80) NOT NULL,
  "title" varchar(180) NOT NULL,
  "description" text,
  "crime_category_id" varchar(100) NOT NULL,
  "district_id" varchar(100) NOT NULL,
  "station_id" varchar(100) NOT NULL,
  "occurred_at" timestamptz NOT NULL,
  "reported_at" timestamptz,
  "status" varchar(40) NOT NULL,
  "severity" varchar(30) NOT NULL,
  "priority" varchar(30) NOT NULL,
  "latitude" numeric,
  "longitude" numeric,
  "assigned_officer_id" varchar(100),
  "created_at" timestamptz NOT NULL,
  "created_by" varchar(100) NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "updated_by" varchar(100) NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamptz,
  "deleted_by" varchar(100),
  CONSTRAINT "crime_incidents_pkey" PRIMARY KEY ("incident_id"),
  CONSTRAINT "crime_incidents_fir_number_key" UNIQUE ("fir_number"),
  CONSTRAINT "crime_incidents_crime_category_id_fkey" FOREIGN KEY ("crime_category_id") REFERENCES "crime_categories" ("category_id"),
  CONSTRAINT "crime_incidents_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts" ("district_id"),
  CONSTRAINT "crime_incidents_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "police_stations" ("station_id"),
  CONSTRAINT "crime_incidents_assigned_officer_id_fkey" FOREIGN KEY ("assigned_officer_id") REFERENCES "officers" ("officer_id")
);
CREATE INDEX IF NOT EXISTS "crime_incidents_fir_number_idx" ON "crime_incidents" ("fir_number");
CREATE INDEX IF NOT EXISTS "crime_incidents_district_id_idx" ON "crime_incidents" ("district_id");
CREATE INDEX IF NOT EXISTS "crime_incidents_station_id_idx" ON "crime_incidents" ("station_id");
CREATE INDEX IF NOT EXISTS "crime_incidents_occurred_at_idx" ON "crime_incidents" ("occurred_at");
CREATE INDEX IF NOT EXISTS "crime_incidents_status_idx" ON "crime_incidents" ("status");
CREATE INDEX IF NOT EXISTS "crime_incidents_is_deleted_idx" ON "crime_incidents" ("is_deleted");

-- Detailed location records for incidents.
CREATE TABLE IF NOT EXISTS "incident_locations" (
  "location_id" varchar(120) NOT NULL,
  "incident_id" varchar(120) NOT NULL,
  "latitude" numeric NOT NULL,
  "longitude" numeric NOT NULL,
  "address_text" text,
  "created_at" timestamptz NOT NULL,
  "created_by" varchar(100) NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "updated_by" varchar(100) NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "is_deleted" boolean NOT NULL DEFAULT false,
  CONSTRAINT "incident_locations_pkey" PRIMARY KEY ("location_id"),
  CONSTRAINT "incident_locations_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "crime_incidents" ("incident_id")
);
CREATE INDEX IF NOT EXISTS "incident_locations_incident_id_idx" ON "incident_locations" ("incident_id");
CREATE INDEX IF NOT EXISTS "incident_locations_is_deleted_idx" ON "incident_locations" ("is_deleted");

-- Case lifecycle records linked to incidents.
CREATE TABLE IF NOT EXISTS "case_records" (
  "case_id" varchar(120) NOT NULL,
  "incident_id" varchar(120) NOT NULL,
  "case_status" varchar(60) NOT NULL,
  "assigned_officer_id" varchar(100),
  "created_at" timestamptz NOT NULL,
  "created_by" varchar(100) NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "updated_by" varchar(100) NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "is_deleted" boolean NOT NULL DEFAULT false,
  CONSTRAINT "case_records_pkey" PRIMARY KEY ("case_id"),
  CONSTRAINT "case_records_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "crime_incidents" ("incident_id"),
  CONSTRAINT "case_records_assigned_officer_id_fkey" FOREIGN KEY ("assigned_officer_id") REFERENCES "officers" ("officer_id")
);
CREATE INDEX IF NOT EXISTS "case_records_incident_id_idx" ON "case_records" ("incident_id");
CREATE INDEX IF NOT EXISTS "case_records_case_status_idx" ON "case_records" ("case_status");
CREATE INDEX IF NOT EXISTS "case_records_assigned_officer_id_idx" ON "case_records" ("assigned_officer_id");
CREATE INDEX IF NOT EXISTS "case_records_is_deleted_idx" ON "case_records" ("is_deleted");

-- Operational alerts and risk notifications.
CREATE TABLE IF NOT EXISTS "alerts" (
  "alert_id" varchar(120) NOT NULL,
  "incident_id" varchar(120),
  "title" varchar(180) NOT NULL,
  "severity" varchar(30) NOT NULL,
  "status" varchar(30) NOT NULL,
  "created_at" timestamptz NOT NULL,
  "created_by" varchar(100) NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "updated_by" varchar(100) NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "is_deleted" boolean NOT NULL DEFAULT false,
  CONSTRAINT "alerts_pkey" PRIMARY KEY ("alert_id"),
  CONSTRAINT "alerts_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "crime_incidents" ("incident_id")
);
CREATE INDEX IF NOT EXISTS "alerts_incident_id_idx" ON "alerts" ("incident_id");
CREATE INDEX IF NOT EXISTS "alerts_severity_idx" ON "alerts" ("severity");
CREATE INDEX IF NOT EXISTS "alerts_status_idx" ON "alerts" ("status");
CREATE INDEX IF NOT EXISTS "alerts_created_at_idx" ON "alerts" ("created_at");

-- Generated report metadata and export history.
CREATE TABLE IF NOT EXISTS "reports" (
  "report_id" varchar(120) NOT NULL,
  "title" varchar(180) NOT NULL,
  "created_by" varchar(100) NOT NULL,
  "created_at" timestamptz NOT NULL,
  "format" varchar(30) NOT NULL,
  "status" varchar(30) NOT NULL,
  "filters_json" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  CONSTRAINT "reports_pkey" PRIMARY KEY ("report_id"),
  CONSTRAINT "reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("email")
);
CREATE INDEX IF NOT EXISTS "reports_created_by_idx" ON "reports" ("created_by");
CREATE INDEX IF NOT EXISTS "reports_created_at_idx" ON "reports" ("created_at");
CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "reports" ("status");

-- Saved query definitions for reports and AI assistant.
CREATE TABLE IF NOT EXISTS "saved_queries" (
  "query_id" varchar(120) NOT NULL,
  "owner_id" varchar(100) NOT NULL,
  "name" varchar(180) NOT NULL,
  "query_type" varchar(60) NOT NULL,
  "definition_json" text NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "is_deleted" boolean NOT NULL DEFAULT false,
  CONSTRAINT "saved_queries_pkey" PRIMARY KEY ("query_id"),
  CONSTRAINT "saved_queries_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users" ("email")
);
CREATE INDEX IF NOT EXISTS "saved_queries_owner_id_idx" ON "saved_queries" ("owner_id");
CREATE INDEX IF NOT EXISTS "saved_queries_query_type_idx" ON "saved_queries" ("query_type");
CREATE INDEX IF NOT EXISTS "saved_queries_is_deleted_idx" ON "saved_queries" ("is_deleted");

-- AI assistant chat sessions.
CREATE TABLE IF NOT EXISTS "chat_sessions" (
  "session_id" varchar(120) NOT NULL,
  "owner_id" varchar(100) NOT NULL,
  "title" varchar(180) NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "is_deleted" boolean NOT NULL DEFAULT false,
  CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("session_id"),
  CONSTRAINT "chat_sessions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users" ("email")
);
CREATE INDEX IF NOT EXISTS "chat_sessions_owner_id_idx" ON "chat_sessions" ("owner_id");
CREATE INDEX IF NOT EXISTS "chat_sessions_updated_at_idx" ON "chat_sessions" ("updated_at");
CREATE INDEX IF NOT EXISTS "chat_sessions_is_deleted_idx" ON "chat_sessions" ("is_deleted");

-- AI assistant chat messages and responses.
CREATE TABLE IF NOT EXISTS "chat_messages" (
  "message_id" varchar(120) NOT NULL,
  "session_id" varchar(120) NOT NULL,
  "role" varchar(30) NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamptz NOT NULL,
  "is_deleted" boolean NOT NULL DEFAULT false,
  CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("message_id"),
  CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions" ("session_id")
);
CREATE INDEX IF NOT EXISTS "chat_messages_session_id_idx" ON "chat_messages" ("session_id");
CREATE INDEX IF NOT EXISTS "chat_messages_created_at_idx" ON "chat_messages" ("created_at");
CREATE INDEX IF NOT EXISTS "chat_messages_is_deleted_idx" ON "chat_messages" ("is_deleted");

COMMIT;
