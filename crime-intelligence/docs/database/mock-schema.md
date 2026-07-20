# Mock schema

The normalized state lives in `src/data/contracts/entities.ts` and is stored in `MockDatabaseState`.

## Reference and operational entities

- `District` -> `PoliceStation` -> `PoliceOfficer` -> `UserAccount`
- `CrimeCategory` and `LegalSection`
- `GeographicLocation`, `PatrolBeat`, and `Vehicle`

## Case entities

- `Incident` -> `Fir` -> `CrimeCase`
- `Person` and `CasePersonRelationship`
- `SuspectProfile` and `Arrest`
- `Evidence` -> `EvidenceCustodyEvent`
- `CaseNote`, `CaseStatusHistory`, and `Task`

## Intelligence and operations

- `Alert`, `IntelligenceReport`, and `CrimeHotspot`
- `DocumentAttachment`
- `AuditLog`
- `ConversationSession` -> `ConversationMessage`

The repositories resolve relationships by stable IDs. Sensitive values are masked and locations are generalized. No real citizen, officer, or investigation data is used.
