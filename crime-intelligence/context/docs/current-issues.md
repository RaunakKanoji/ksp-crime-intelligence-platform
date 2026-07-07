# Current Issues

No confirmed issues yet.

## 1. Known Setup Issues

- No confirmed setup issues are known at documentation creation time.

## 2. Missing Environment Variables

Potential environment variables may be needed later, but none are confirmed yet:

- Database connection string
- Authentication provider keys
- AI provider key
- Map provider key
- File upload/storage configuration
- Demo mode flag

## 3. Pending Decisions

- Final authentication provider.
- Final database technology.
- Map/geospatial provider.
- AI provider and model.
- Dataset format and schema mapping.
- Deployment platform.
- Demo data generation process.

## 4. Blockers

- No confirmed blockers yet.

## 5. Bugs

- No confirmed bugs yet.

## 6. UI Inconsistencies

- No confirmed UI inconsistencies yet.
- The selected/default component system must remain unchanged.

## 7. Data Limitations

- Real KSP/SCRB data may not be available during hackathon implementation.
- Demo/sample data must be clearly labeled and must not contain real sensitive data.
- Population-normalized metrics require population data and should not be shown without it.

## 8. AI Limitations

- AI outputs must be grounded in available data.
- AI must not hallucinate crime records.
- AI must not present predictions or pattern detection as confirmed evidence.

## 9. Security Concerns

- FIR, victim, accused, witness, investigation, and evidence data require strict access control.
- Export features must include redaction and audit logs.
- Dataset upload must validate file type, schema, and content before import.

## 10. Deployment Concerns

- Production deployment requires secure environment variables, HTTPS, database backups, audit retention, and data governance review.
- Hackathon deployment should use demo data only unless real data is explicitly approved.

## Catalyst Setup Decisions Pending

- Catalyst project configuration has not yet been confirmed in the repository.
- The final deployment mode must be selected: Catalyst AppSail, Catalyst Web Client Hosting, or Slate depending on framework and rendering needs.
- Catalyst Authentication setup is pending.
- Catalyst Roles mapping for Admin, Investigator, Analyst, Officer, and Viewer is pending.
- Catalyst Data Store schema should be created incrementally, not all at once.
- Catalyst Stratus should be used for new file/object storage work.
- Do not plan new implementation work on Catalyst File Store, Event Listeners, or Cloud Scale Cron. Use Stratus, Signals, and Job Scheduling instead.
