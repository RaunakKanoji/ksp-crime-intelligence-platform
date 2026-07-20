-- Generated from database/seeds/*.csv. Do not edit by hand.
-- Regenerate with: npm run db:generate:postgres

BEGIN;

-- database/seeds/roles.csv
INSERT INTO "roles" ("name", "description", "status", "catalyst_role_id", "created_at", "created_by", "updated_at", "updated_by", "version", "is_archived")
VALUES
  ('Admin', 'Full system administration, user management, dataset uploads, and system configuration.', 'active', NULL, '2026-07-11 00:00:00', 'seed', '2026-07-11 00:00:00', 'seed', 1, false),
  ('Investigator', 'Detailed crime investigation, suspect and victim profile access, and case intelligence workflows.', 'active', NULL, '2026-07-11 00:00:00', 'seed', '2026-07-11 00:00:00', 'seed', 1, false),
  ('Analyst', 'Statewide aggregated analytics, trends analysis, geospatial hotspots, and report building.', 'active', NULL, '2026-07-11 00:00:00', 'seed', '2026-07-11 00:00:00', 'seed', 1, false),
  ('Officer', 'Standard officer access for case searching, map viewing, and basic case details.', 'active', NULL, '2026-07-11 00:00:00', 'seed', '2026-07-11 00:00:00', 'seed', 1, false),
  ('Viewer', 'Read-only access to standard summaries and permitted public information.', 'active', NULL, '2026-07-11 00:00:00', 'seed', '2026-07-11 00:00:00', 'seed', 1, false)
ON CONFLICT ("name") DO NOTHING;

-- database/seeds/development-users.csv (development seed)
INSERT INTO "users" ("email", "display_name", "status", "role_id", "district_id", "station_id", "phone", "last_login_at", "created_at", "created_by", "updated_at", "updated_by", "version", "is_archived", "development_only")
VALUES
  ('dev.admin@ksp.local', 'Development Admin', 'active', 'Admin', NULL, NULL, '9999990001', NULL, '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false, true),
  ('dev.investigator@ksp.local', 'Development Investigator', 'active', 'Investigator', 'BENGALURU-URBAN', 'CENTRAL-STATION', '9999990002', NULL, '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false, true),
  ('dev.analyst@ksp.local', 'Development Analyst', 'active', 'Analyst', NULL, NULL, '9999990003', NULL, '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false, true),
  ('dev.officer@ksp.local', 'Development Officer', 'active', 'Officer', 'BENGALURU-URBAN', 'CENTRAL-STATION', '9999990004', NULL, '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false, true),
  ('dev.viewer@ksp.local', 'Development Viewer', 'active', 'Viewer', NULL, NULL, '9999990005', NULL, '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false, true)
ON CONFLICT ("email") DO NOTHING;

-- database/seeds/user-role-assignments.csv (development seed)
INSERT INTO "user_role_assignments" ("assignment_key", "user_id", "role_id", "status", "assigned_at", "assigned_by", "removed_at", "removed_by", "created_at", "created_by", "updated_at", "updated_by", "version", "is_archived")
VALUES
  ('dev.admin@ksp.local:Admin', 'dev.admin@ksp.local', 'Admin', 'active', '2026-07-11T00:00:00.000Z', 'seed', NULL, NULL, '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('dev.investigator@ksp.local:Investigator', 'dev.investigator@ksp.local', 'Investigator', 'active', '2026-07-11T00:00:00.000Z', 'seed', NULL, NULL, '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('dev.analyst@ksp.local:Analyst', 'dev.analyst@ksp.local', 'Analyst', 'active', '2026-07-11T00:00:00.000Z', 'seed', NULL, NULL, '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('dev.officer@ksp.local:Officer', 'dev.officer@ksp.local', 'Officer', 'active', '2026-07-11T00:00:00.000Z', 'seed', NULL, NULL, '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('dev.viewer@ksp.local:Viewer', 'dev.viewer@ksp.local', 'Viewer', 'active', '2026-07-11T00:00:00.000Z', 'seed', NULL, NULL, '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false)
ON CONFLICT ("assignment_key") DO NOTHING;

-- database/seeds/jurisdiction-access.csv (development seed)
INSERT INTO "jurisdiction_access" ("access_key", "user_id", "organization_id", "district_id", "station_id", "access_level", "status", "created_at", "created_by", "updated_at", "updated_by", "version", "is_archived")
VALUES
  ('dev.admin@ksp.local:statewide', 'dev.admin@ksp.local', 'KSP', NULL, NULL, 'statewide', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('dev.investigator@ksp.local:BENGALURU-URBAN:CENTRAL-STATION', 'dev.investigator@ksp.local', 'KSP', 'BENGALURU-URBAN', 'CENTRAL-STATION', 'station', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('dev.analyst@ksp.local:statewide', 'dev.analyst@ksp.local', 'KSP', NULL, NULL, 'statewide', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('dev.officer@ksp.local:BENGALURU-URBAN:CENTRAL-STATION', 'dev.officer@ksp.local', 'KSP', 'BENGALURU-URBAN', 'CENTRAL-STATION', 'station', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('dev.viewer@ksp.local:read-only', 'dev.viewer@ksp.local', 'KSP', NULL, NULL, 'read_only', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false)
ON CONFLICT ("access_key") DO NOTHING;

-- database/seeds/districts.csv
INSERT INTO "districts" ("district_id", "name", "status", "created_at", "created_by", "updated_at", "updated_by", "version", "is_deleted")
VALUES
  ('BENGALURU-CITY', 'Bengaluru City', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('MYSURU', 'Mysuru', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('BELAGAVI', 'Belagavi', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('KALABURAGI', 'Kalaburagi', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('MANGALURU', 'Mangaluru', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('HUBBALLI-DHARWAD', 'Hubballi-Dharwad', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false)
ON CONFLICT ("district_id") DO NOTHING;

-- database/seeds/police-stations.csv
INSERT INTO "police_stations" ("station_id", "district_id", "name", "status", "created_at", "created_by", "updated_at", "updated_by", "version", "is_deleted")
VALUES
  ('CENTRAL-DIVISION', 'BENGALURU-CITY', 'Central Division', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('WHITEFIELD', 'BENGALURU-CITY', 'Whitefield', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('DEVARAJA', 'MYSURU', 'Devaraja', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('NAZARBAD', 'MYSURU', 'Nazarbad', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('CAMP', 'BELAGAVI', 'Camp', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('STATION-BAZAR', 'KALABURAGI', 'Station Bazar', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false)
ON CONFLICT ("station_id") DO NOTHING;

-- database/seeds/crime-categories.csv
INSERT INTO "crime_categories" ("category_id", "name", "severity_default", "status", "created_at", "created_by", "updated_at", "updated_by", "version", "is_deleted")
VALUES
  ('VEHICLE-THEFT', 'Vehicle Theft', 'medium', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('BURGLARY', 'Burglary', 'high', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('CYBER-FRAUD', 'Cyber Fraud', 'high', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('ASSAULT', 'Assault', 'high', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false),
  ('NARCOTICS', 'Narcotics', 'critical', 'active', '2026-07-11T00:00:00.000Z', 'seed', '2026-07-11T00:00:00.000Z', 'seed', 1, false)
ON CONFLICT ("category_id") DO NOTHING;

COMMIT;
