# Catalyst Table Checklist

Use this checklist in Catalyst Console before running seed or import scripts.

- [ ] Create `roles` and columns from `database/schema/roles.json`
- [ ] Create `users` and columns from `database/schema/users.json`
- [ ] Create `user_profiles` and columns from `database/schema/user-profiles.json`
- [ ] Create `user_role_assignments` and columns from `database/schema/user-role-assignments.json`
- [ ] Create `jurisdiction_access` and columns from `database/schema/jurisdiction-access.json`
- [ ] Create `audit_events` and columns from `database/schema/audit-events.json`
- [ ] Create `districts` and columns from `database/schema/districts.json`
- [ ] Create `police_stations` and columns from `database/schema/police-stations.json`
- [ ] Create `officers` and columns from `database/schema/officers.json`
- [ ] Create `crime_categories` and columns from `database/schema/crime-categories.json`
- [ ] Create `crime_incidents` and columns from `database/schema/crime-incidents.json`
- [ ] Create `incident_locations` and columns from `database/schema/incident-locations.json`
- [ ] Create `case_records` and columns from `database/schema/case-records.json`
- [ ] Create `alerts` and columns from `database/schema/alerts.json`
- [ ] Create `reports` and columns from `database/schema/reports.json`
- [ ] Create `saved_queries` and columns from `database/schema/saved-queries.json`
- [ ] Create `chat_sessions` and columns from `database/schema/chat-sessions.json`
- [ ] Create `chat_messages` and columns from `database/schema/chat-messages.json`
- [ ] Mark all schema fields with `"unique": true` as unique in Catalyst Console
- [ ] Configure lookup relationships listed in each schema file
- [ ] Configure read/write permissions so row operations happen through AppSail/functions
- [ ] Run `npm run db:validate -- --environment development`
- [ ] Run `npm run db:seed:development`
