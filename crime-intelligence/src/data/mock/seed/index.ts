import type {
  Alert, Arrest, AuditLog, CaseNote, CasePersonRelationship, CaseStatusHistory,
  CrimeCase, CrimeCategory, CrimeHotspot, District, DocumentAttachment, Evidence,
  EvidenceCustodyEvent, Fir, GeographicLocation, Incident, IntelligenceReport,
  LegalSection, MockDatabaseState, PatrolBeat, Person, PoliceOfficer, PoliceStation,
  SuspectProfile, Task, UserAccount, Vehicle,
} from "@/data/contracts/entities";
import type { MockConfig } from "../config";
import { addDays, maskAddress, maskEmail, maskPhone, seededDate, SeededRandom } from "../rng";

const districtSeeds = [
  ["BLR-N", "Bengaluru North", "South-East", "Bengaluru", 13.08, 77.58, "high"],
  ["BLR-S", "Bengaluru South", "South-East", "Bengaluru", 12.88, 77.58, "high"],
  ["MYS", "Mysuru", "South", "Mysuru", 12.30, 76.65, "medium"],
  ["MLR", "Mangaluru", "Coastal", "Mangaluru", 12.91, 74.86, "medium"],
  ["BEL", "Belagavi", "North-West", "Belagavi", 15.85, 74.50, "medium"],
  ["KLB", "Kalaburagi", "North-East", "Kalaburagi", 17.33, 76.83, "high"],
  ["HBL", "Hubballi-Dharwad", "North-West", "Hubballi", 15.36, 75.12, "medium"],
  ["SHM", "Shivamogga", "Central", "Shivamogga", 13.93, 75.57, "low"],
  ["TUM", "Tumakuru", "Central", "Tumakuru", 13.34, 77.10, "medium"],
  ["KDG", "Kodagu", "South", "Madikeri", 12.42, 75.74, "low"],
] as const;
const categorySeeds = [
  ["THEFT", "Theft", "Property loss or unauthorized taking of movable property", "medium", "amber", "shield"],
  ["BURGLARY", "Burglary", "Unlawful entry into a building or dwelling", "high", "orange", "home"],
  ["ROBBERY", "Robbery", "Property offence involving force or threat", "high", "red", "alert"],
  ["ASSAULT", "Assault", "Physical harm or threat of physical harm", "high", "rose", "person"],
  ["FRAUD", "Fraud", "Deception resulting in financial or property loss", "medium", "violet", "banknote"],
  ["CYBER", "Cybercrime", "Digital or online crime complaint", "high", "indigo", "monitor"],
  ["FINANCIAL", "Financial crime", "Financial records and transaction-related crime", "high", "purple", "chart"],
  ["VEHICLE", "Vehicle theft", "Theft or unauthorized use of a vehicle", "high", "blue", "car"],
  ["WOMEN", "Crimes against women", "Sensitive safety and protection case", "critical", "pink", "heart"],
  ["MISSING", "Missing persons", "Missing person report requiring coordinated response", "high", "teal", "search"],
  ["NARCOTICS", "Narcotics", "Controlled-substance offence or seizure", "critical", "slate", "flask"],
  ["PROPERTY", "Property dispute", "Dispute involving property or occupancy", "medium", "lime", "building"],
  ["PUBLIC", "Public order", "Public-order or community disturbance incident", "medium", "cyan", "users"],
  ["TRAFFIC", "Traffic offence", "Traffic offence or road safety incident", "low", "sky", "road"],
  ["ORGANISED", "Organized crime", "Potential coordinated or networked crime", "critical", "black", "network"],
  ["OTHER", "Other", "Other report requiring classification", "low", "gray", "file"],
] as const;
const stationNames = ["Central Division", "Whitefield", "Kengeri", "Malleswaram", "Koramangala", "HSR Layout", "Devaraja", "Nazarbad", "Vijayanagar", "Barke", "Pandeshwar", "Kadri", "Vidyanagar", "Gokul Road", "Camp", "Market", "Station Bazar", "Brahmapur", "Farhatabad", "Sagar Road", "Town", "Rural Circle", "City South", "Industrial Area", "Women Safety", "Cyber Crime", "Traffic East", "Railway", "Special Unit", "Control Room", "University", "Airport"] as const;
const firstNames = ["Aarav", "Meera", "Rohan", "Kavya", "Arjun", "Priya", "Dev", "Neha", "Ishan", "Tara", "Nikhil", "Sana", "Vikram", "Anaya", "Kabir", "Mira", "Aditya", "Riya", "Naveen", "Ira"] as const;
const lastNames = ["Sample", "Mock", "Fiction", "Karnataka", "Nair", "Iyer", "Rao", "Desai", "Shah", "Kapoor", "Menon", "Bhat", "Patil", "Kumar", "Das"] as const;
const occupations = ["service professional", "small business owner", "student", "retail worker", "driver", "teacher", "health worker", "software professional", "farmer", "self-employed consultant"] as const;
const ranks: PoliceOfficer["rank"][] = ["constable", "head_constable", "assistant_sub_inspector", "sub_inspector", "inspector", "deputy_superintendent", "assistant_commissioner"];
const specializations = ["investigation", "cybercrime", "traffic", "community policing", "forensics liaison", "missing persons", "financial crime"] as const;

const iso = (value: string) => new Date(value).toISOString();

function createDistricts(config: MockConfig): District[] {
  return districtSeeds.slice(0, config.counts.districts).map((item, index) => ({
    id: `DST-MOCK-${String(index + 1).padStart(3, "0")}`, code: item[0], name: item[1], region: item[2], headquarters: item[3],
    latitude: item[4], longitude: item[5], activePoliceStations: 0, totalPoliceStations: 0,
    populationEstimate: 600_000 + index * 170_000, areaSquareKm: 800 + index * 285, riskLevel: item[6] as District["riskLevel"],
    isSyntheticData: true, createdAt: iso("2026-01-01T00:00:00Z"), updatedAt: config.referenceDate,
  }));
}

function createCategories(config: MockConfig): CrimeCategory[] {
  return categorySeeds.map((item, index) => ({
    id: `CAT-MOCK-${String(index + 1).padStart(3, "0")}`, code: item[0], name: item[1], description: item[2],
    severityDefault: item[3] as CrimeCategory["severityDefault"], colorKey: item[4], iconKey: item[5], active: true,
    isSyntheticData: true, createdAt: iso("2026-01-01T00:00:00Z"), updatedAt: config.referenceDate,
  }));
}

function createLegalSections(config: MockConfig): LegalSection[] {
  return Array.from({ length: 12 }, (_, index) => ({
    id: `LAW-MOCK-${String(index + 1).padStart(3, "0")}`, code: `MOCK-SEC-${String(index + 1).padStart(2, "0")}`,
    title: `Synthetic legal section ${index + 1}`, actName: index % 3 === 0 ? "Illustrative Penal Code" : index % 3 === 1 ? "Illustrative Technology Act" : "Illustrative Safety Act",
    description: "Generalized demonstration metadata only; not a legal interpretation.", cognizable: index % 2 === 0, bailable: index % 3 !== 0,
    severity: index % 4 === 0 ? "high" : "medium", active: true, isSyntheticData: true,
    createdAt: iso("2026-01-01T00:00:00Z"), updatedAt: config.referenceDate,
  } satisfies LegalSection));
}

function createStations(config: MockConfig, districts: District[], rng: SeededRandom): PoliceStation[] {
  const stations = Array.from({ length: config.counts.stations }, (_, index) => {
    const district = districts[index % districts.length]; const name = stationNames[index % stationNames.length];
    const stationType: PoliceStation["stationType"] = name.includes("Cyber") ? "cyber_crime" : name.includes("Women") ? "women" : name.includes("Traffic") ? "traffic" : index % 5 === 0 ? "rural" : "urban";
    return {
      id: `PS-MOCK-${district.code}-${String(index + 1).padStart(3, "0")}`, stationCode: `PS-${district.code}-${String(index + 1).padStart(3, "0")}`, name,
      districtId: district.id, division: `${district.name} Division ${(index % 3) + 1}`, subDivision: `${district.region} Subdivision ${(index % 4) + 1}`,
      jurisdictionName: `${name} sample jurisdiction`, address: maskAddress(index, district.headquarters),
      latitude: district.latitude + rng.decimal(-0.06, 0.06, 4), longitude: district.longitude + rng.decimal(-0.06, 0.06, 4),
      phoneMasked: maskPhone(index + 100), email: `station${String(index + 1).padStart(3, "0")}@ksp.example.invalid`, stationType,
      operationalStatus: index % 17 === 0 ? "limited" : "active", sanctionedStrength: 24 + (index % 7) * 6,
      activeStrength: 19 + (index % 6) * 5, beatCount: 2 + (index % 4), isSyntheticData: true as const,
      createdAt: iso("2026-01-01T00:00:00Z"), updatedAt: config.referenceDate,
    } satisfies PoliceStation;
  });
  districts.forEach((district) => {
    district.totalPoliceStations = stations.filter((station) => station.districtId === district.id).length;
    district.activePoliceStations = stations.filter((station) => station.districtId === district.id && station.operationalStatus === "active").length;
  });
  return stations;
}

function createOfficers(config: MockConfig, stations: PoliceStation[], rng: SeededRandom): PoliceOfficer[] {
  return Array.from({ length: config.counts.officers }, (_, index) => {
    const station = stations[index % stations.length]; const firstName = firstNames[index % firstNames.length]; const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
    const rank: PoliceOfficer["rank"] = index < 4 ? "superintendent" : ranks[index % ranks.length];
    return {
      id: `OFF-MOCK-${String(index + 1).padStart(4, "0")}`, badgeNumber: `BADGE-MOCK-${String(index + 1).padStart(5, "0")}`, employeeCode: `EMP-MOCK-${String(index + 1).padStart(5, "0")}`,
      firstName, lastName, displayName: `${firstName} ${lastName}`, rank, stationId: station.id, districtId: station.districtId,
      unit: index % 6 === 0 ? "District Crime Team" : index % 5 === 0 ? "Special Operations" : "Station Operations", designation: `${rank.replaceAll("_", " ")} - synthetic profile`,
      email: `officer${String(index + 1).padStart(4, "0")}@ksp.example.invalid`, phoneMasked: maskPhone(index + 500), status: index % 23 === 0 ? "on_leave" : "active",
      dateOfJoining: seededDate(config.referenceDate, rng, 300, 3500, 9), specializations: [rng.choice(specializations), rng.choice(specializations)].filter((value, position, values) => values.indexOf(value) === position), currentCaseCount: 0,
      isSyntheticData: true, createdAt: iso("2026-01-01T00:00:00Z"), updatedAt: config.referenceDate,
    } satisfies PoliceOfficer;
  });
}

function createUsers(config: MockConfig, officers: PoliceOfficer[], stations: PoliceStation[], districts: District[]): UserAccount[] {
  const roles: UserAccount["role"][] = ["super_admin", "state_command", "district_admin", "station_admin", "investigating_officer", "crime_analyst", "intelligence_officer", "control_room_operator", "read_only"];
  const permissions = ["case:read", "case:write", "fir:create", "evidence:manage", "officer:manage", "analytics:read", "intelligence:read", "reports:create", "administration:write", "audit:read"];
  return Array.from({ length: Math.min(24, Math.max(12, Math.floor(officers.length / 7))) }, (_, index) => {
    const officer = officers[index]; const role = roles[index % roles.length];
    return {
      id: `USR-MOCK-${String(index + 1).padStart(4, "0")}`, officerId: officer.id, name: officer.displayName, email: `user${String(index + 1).padStart(3, "0")}@ksp.example.invalid`, role,
      permissions: role === "read_only" ? ["case:read", "analytics:read"] : permissions.slice(0, role === "crime_analyst" ? 7 : permissions.length), stationId: stations[index % stations.length].id, districtId: districts[index % districts.length].id,
      status: "active", lastLoginAt: config.referenceDate, isSyntheticData: true, createdAt: iso("2026-01-01T00:00:00Z"), updatedAt: config.referenceDate,
    } satisfies UserAccount;
  });
}

function createPersons(config: MockConfig, districts: District[], rng: SeededRandom): Person[] {
  return Array.from({ length: config.counts.persons }, (_, index) => {
    const firstName = firstNames[index % firstNames.length]; const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length]; const district = districts[index % districts.length];
    return {
      id: `PER-MOCK-${String(index + 1).padStart(5, "0")}`, personCode: `PERSON-MOCK-${String(index + 1).padStart(5, "0")}`, firstName, lastName, displayName: `${firstName} ${lastName} ${String(index + 1).padStart(3, "0")}`,
      gender: index % 5 === 0 ? "female" : index % 17 === 0 ? "unknown" : "male", approximateAge: 19 + (index % 57), dateOfBirth: `${1980 + (index % 25)}-${String((index % 12) + 1).padStart(2, "0")}-15T00:00:00.000Z`,
      nationality: "Synthetic Indian profile", occupation: rng.choice(occupations), phoneMasked: maskPhone(index + 1000), emailMasked: maskEmail(index + 1), addressMasked: maskAddress(index, district.headquarters), districtId: district.id,
      identityStatus: index % 29 === 0 ? "protected" : index % 7 === 0 ? "under_review" : "verified", riskFlag: index % 31 === 0 ? "high" : index % 13 === 0 ? "medium" : index % 5 === 0 ? "low" : "none", isProtectedIdentity: index % 29 === 0,
      isSyntheticData: true, createdAt: iso("2026-01-01T00:00:00Z"), updatedAt: config.referenceDate,
    } satisfies Person;
  });
}

function createIncidents(config: MockConfig, stations: PoliceStation[], categories: CrimeCategory[], rng: SeededRandom): Incident[] {
  return Array.from({ length: config.counts.incidents }, (_, index) => {
    const station = stations[index % stations.length]; const category = categories[(index * 7 + Math.floor(index / 4)) % categories.length]; const occurredAt = seededDate(config.referenceDate, rng, 0, 420); const severity = index % 17 === 0 ? "critical" : index % 5 === 0 ? "high" : category.severityDefault;
    const status: Incident["status"] = rng.weighted([{ value: "reported", weight: 10 }, { value: "under_review", weight: 12 }, { value: "assigned", weight: 18 }, { value: "fir_registered", weight: 35 }, { value: "closed", weight: 18 }, { value: "rejected", weight: 3 }, { value: "duplicate", weight: 4 }]);
    const locationName = `${station.name} sample jurisdiction point ${(index % 9) + 1}`;
    return {
      id: `INC-MOCK-2026-${String(index + 1).padStart(5, "0")}`, incidentNumber: `INC-MOCK-2026-${String(index + 1).padStart(5, "0")}`, title: `${category.name} report at ${locationName}`,
      description: `Synthetic ${category.name.toLowerCase()} incident used for workflow and analytics demonstrations.`, crimeCategoryId: category.id,
      reportedAt: (() => { const candidate = addDays(occurredAt, rng.integer(0, 3)); return candidate > config.referenceDate ? config.referenceDate : candidate; })(), occurredAt,
      reportedByType: rng.choice(["citizen", "officer", "anonymous", "system"] as const), reportingChannel: rng.choice(["station", "emergency_call", "online", "mobile_patrol", "control_room", "citizen_app", "anonymous_tip"] as const),
      stationId: station.id, districtId: station.districtId, jurisdictionId: `JUR-MOCK-${station.districtId}`, latitude: station.latitude + rng.decimal(-0.025, 0.025, 5), longitude: station.longitude + rng.decimal(-0.025, 0.025, 5),
      locationName, addressMasked: `Area ${(index % 20) + 1}, Sample Layout, Karnataka`, severity, priority: severity === "critical" ? "urgent" : severity === "high" ? "high" : rng.choice(["low", "normal", "normal", "high"] as const), status,
      source: "seed", assignedOfficerId: status === "reported" || status === "rejected" ? undefined : `OFF-MOCK-${String((index * 3) % config.counts.officers + 1).padStart(4, "0")}`, isSensitive: category.code === "WOMEN" || category.code === "MISSING" || index % 19 === 0,
      isSyntheticData: true, createdAt: occurredAt, updatedAt: config.referenceDate,
    } satisfies Incident;
  });
}

function createFirs(config: MockConfig, incidents: Incident[], categories: CrimeCategory[], sections: LegalSection[], persons: Person[], officers: PoliceOfficer[], rng: SeededRandom): Fir[] {
  return Array.from({ length: config.counts.firs }, (_, index) => {
    const incident = incidents[index]; const status: Fir["status"] = rng.weighted([{ value: "registered", weight: 18 }, { value: "investigation_open", weight: 28 }, { value: "evidence_collection", weight: 18 }, { value: "suspect_identified", weight: 10 }, { value: "arrest_made", weight: 6 }, { value: "charge_sheet_preparation", weight: 8 }, { value: "charge_sheet_filed", weight: 7 }, { value: "court_proceeding", weight: 3 }, { value: "closed", weight: 2 }]);
    const fir: Fir = {
      id: `FIR-MOCK-2026-${String(index + 1).padStart(5, "0")}`, firNumber: `FIR-MOCK-2026-${String(index + 1).padStart(5, "0")}`, incidentId: incident.id, stationId: incident.stationId, districtId: incident.districtId, registrationDate: incident.reportedAt,
      crimeCategoryId: incident.crimeCategoryId || categories[index % categories.length].id, legalSectionIds: [sections[index % sections.length].id, ...(index % 5 === 0 ? [sections[(index + 3) % sections.length].id] : [])], complainantPersonId: persons[index % persons.length].id, investigatingOfficerId: officers[(index * 5) % officers.length].id,
      status, caseNature: index % 11 === 0 ? "preventive" : index % 7 === 0 ? "non_cognizable" : "cognizable", priority: incident.priority,
      summary: `Synthetic FIR summary for ${categories.find((category) => category.id === incident.crimeCategoryId)?.name ?? "crime"} reported in a generalized station area.`, occurrenceLocation: incident.locationName, latitude: incident.latitude, longitude: incident.longitude,
      courtReference: status === "court_proceeding" || status === "charge_sheet_filed" ? `COURT-MOCK-${String(index + 1).padStart(5, "0")}` : undefined, chargeSheetStatus: ["charge_sheet_filed", "court_proceeding"].includes(status) ? "filed" : status === "charge_sheet_preparation" ? "in_preparation" : "not_started", chargeSheetDate: ["charge_sheet_filed", "court_proceeding"].includes(status) ? addDays(incident.reportedAt, 24 + (index % 80)) : undefined,
      closureReason: status === "closed" ? "Synthetic closure for demonstration workflow." : undefined, isSensitive: incident.isSensitive, isSyntheticData: true, createdAt: incident.reportedAt, updatedAt: config.referenceDate,
    };
    incident.linkedFirId = fir.id; return fir;
  });
}

function createCases(config: MockConfig, firs: Fir[], categories: CrimeCategory[], officers: PoliceOfficer[], rng: SeededRandom): CrimeCase[] {
  const cases = Array.from({ length: config.counts.cases }, (_, index) => {
    const fir = firs[index]; const status: CrimeCase["status"] = rng.weighted([{ value: "open", weight: 12 }, { value: "under_investigation", weight: 35 }, { value: "evidence_review", weight: 14 }, { value: "suspect_identified", weight: 8 }, { value: "charge_sheet", weight: 12 }, { value: "court_support", weight: 5 }, { value: "closed", weight: 10 }, { value: "transferred", weight: 4 }]);
    const leadOfficer = officers[(index * 5) % officers.length]; const openedAt = fir.registrationDate; const closedAt = status === "closed" ? addDays(openedAt, 20 + (index % 100)) : undefined;
    return {
      id: `CASE-MOCK-2026-${String(index + 1).padStart(5, "0")}`, caseNumber: `CASE-MOCK-2026-${String(index + 1).padStart(5, "0")}`, firId: fir.id,
      title: `${categories.find((category) => category.id === fir.crimeCategoryId)?.name ?? "Crime"} case ${String(index + 1).padStart(4, "0")}`, summary: "Synthetic case summary for KSP workflow demonstrations; no operational record is represented.", crimeCategoryId: fir.crimeCategoryId,
      stationId: fir.stationId, districtId: fir.districtId, leadOfficerId: leadOfficer.id, supportingOfficerIds: [officers[(index * 5 + 1) % officers.length].id, officers[(index * 5 + 2) % officers.length].id], priority: fir.priority,
      severity: index % 17 === 0 ? "critical" : index % 5 === 0 ? "high" : rng.choice(["low", "medium", "medium", "high"] as const), status,
      investigationStage: status === "closed" ? "case_closure" : status === "court_support" ? "court_support" : status === "charge_sheet" ? "charge_sheet" : rng.choice(["initial_assessment", "evidence_collection", "witness_interviews", "suspect_analysis", "field_investigation", "forensic_review", "arrest_and_recovery"] as const),
      riskScore: rng.integer(22, 96), confidenceScore: rng.integer(48, 94), openedAt, lastActivityAt: seededDate(config.referenceDate, rng, 0, Math.max(1, Math.floor((new Date(config.referenceDate).getTime() - new Date(openedAt).getTime()) / 86_400_000)), 11), expectedClosureDate: addDays(openedAt, 90 + (index % 180)), closedAt,
      tags: [index % 3 === 0 ? "sample-hotspot" : "standard-review", index % 5 === 0 ? "priority-review" : "general"], isSyntheticData: true, createdAt: openedAt, updatedAt: config.referenceDate,
    } satisfies CrimeCase;
  });
  cases.forEach((caseRecord) => { const officer = officers.find((item) => item.id === caseRecord.leadOfficerId); if (officer && caseRecord.status !== "closed") officer.currentCaseCount += 1; });
  return cases;
}

function createRelationships(config: MockConfig, cases: CrimeCase[], persons: Person[], rng: SeededRandom): CasePersonRelationship[] {
  const relationships: CasePersonRelationship[] = [];
  for (let index = 0; index < Math.min(cases.length, Math.ceil(config.counts.persons / 2)); index += 1) {
    const caseRecord = cases[index]; const add = (offset: number, relationshipType: CasePersonRelationship["relationshipType"]) => {
      const person = persons[(index * 3 + offset) % persons.length]; relationships.push({ id: `CPR-MOCK-${String(relationships.length + 1).padStart(5, "0")}`, caseId: caseRecord.id, personId: person.id, relationshipType, relationshipStatus: relationshipType === "suspect" && index % 9 === 0 ? "cleared" : "active", statementRecorded: rng.next() > 0.25, statementDate: rng.next() > 0.25 ? seededDate(config.referenceDate, rng, 0, 180, 10) : undefined, legalRepresentation: relationshipType === "accused" ? "Synthetic counsel reference" : undefined, notes: "Generalized relationship note for demonstration.", isSyntheticData: true, createdAt: caseRecord.openedAt, updatedAt: config.referenceDate });
    };
    add(0, "complainant"); add(1, "victim"); if (index % 2 === 0) add(2, "witness"); if (index % 3 !== 0) add(3, index % 5 === 0 ? "accused" : "suspect"); if (index % 11 === 0) add(4, "associate");
  }
  return relationships;
}

function createSuspects(config: MockConfig, relationships: CasePersonRelationship[], persons: Person[], cases: CrimeCase[], rng: SeededRandom): SuspectProfile[] {
  const suspectRelationships = relationships.filter((relationship) => relationship.relationshipType === "suspect" || relationship.relationshipType === "accused"); const personIds = Array.from(new Set(suspectRelationships.map((relationship) => relationship.personId))).slice(0, Math.min(140, Math.ceil(config.counts.persons / 5)));
  return personIds.map((personId, index) => {
    const person = persons.find((item) => item.id === personId)!; const linkedCaseIds = suspectRelationships.filter((relationship) => relationship.personId === personId).map((relationship) => relationship.caseId); const primaryCaseId = linkedCaseIds[0];
    return { id: `SUS-MOCK-${String(index + 1).padStart(5, "0")}`, personId, primaryCaseId, aliasNames: index % 3 === 0 ? [`Alias ${String(index + 1).padStart(3, "0")}`] : [], riskLevel: index % 17 === 0 ? "critical" : index % 7 === 0 ? "high" : index % 3 === 0 ? "medium" : "low", threatLevel: index % 17 === 0 ? "critical" : index % 7 === 0 ? "high" : "medium", knownAssociates: relationships.filter((relationship) => relationship.caseId === primaryCaseId && relationship.personId !== personId).slice(0, 3).map((relationship) => relationship.personId), linkedCaseIds, modusOperandi: `${person.occupation} pattern reference requiring investigator verification.`, lastKnownArea: person.addressMasked, latitude: 12.8 + rng.decimal(-0.4, 4.7, 4), longitude: 74.7 + rng.decimal(-0.1, 2.5, 4), watchlistStatus: index % 11 === 0 ? "watchlisted" : index % 5 === 0 ? "under_review" : "not_listed", verificationStatus: index % 4 === 0 ? "partially_verified" : "unverified", officerNotes: "Synthetic intelligence note. Human review required; not evidence of wrongdoing.", isSyntheticData: true, createdAt: cases.find((item) => item.id === primaryCaseId)?.openedAt ?? config.referenceDate, updatedAt: config.referenceDate } satisfies SuspectProfile;
  });
}

function createArrests(config: MockConfig, cases: CrimeCase[], relationships: CasePersonRelationship[], officers: PoliceOfficer[], rng: SeededRandom): Arrest[] {
  return relationships.filter((relationship) => relationship.relationshipType === "accused").slice(0, 64).map((relationship, index) => { const caseRecord = cases.find((item) => item.id === relationship.caseId)!; return { id: `ARR-MOCK-${String(index + 1).padStart(5, "0")}`, caseId: caseRecord.id, personId: relationship.personId, arrestNumber: `ARREST-MOCK-${String(index + 1).padStart(5, "0")}`, arrestedAt: seededDate(config.referenceDate, rng, 3, 200), arrestedByOfficerId: caseRecord.leadOfficerId ?? officers[index % officers.length].id, arrestLocation: `Sample arrest location ${index + 1}`, stationId: caseRecord.stationId, grounds: "Synthetic arrest grounds for demonstration only.", custodyStatus: index % 5 === 0 ? "judicial_custody" : index % 3 === 0 ? "released" : "police_custody", courtPresentedAt: index % 5 === 0 ? seededDate(config.referenceDate, rng, 2, 190, 12) : undefined, bailStatus: index % 3 === 0 ? "granted" : index % 5 === 0 ? "pending" : "not_applicable", releaseDate: index % 3 === 0 ? seededDate(config.referenceDate, rng, 0, 160, 15) : undefined, isSyntheticData: true, createdAt: caseRecord.openedAt, updatedAt: config.referenceDate } satisfies Arrest; });
}

function createEvidence(config: MockConfig, cases: CrimeCase[], officers: PoliceOfficer[], rng: SeededRandom): Evidence[] {
  const types: Evidence["type"][] = ["document", "photograph", "video", "audio", "digital_record", "financial_record", "physical_object", "vehicle"];
  return Array.from({ length: config.counts.evidence }, (_, index) => { const caseRecord = cases[index % cases.length]; const type = types[index % types.length]; const status: Evidence["chainOfCustodyStatus"] = index % 17 === 0 ? "at_lab" : index % 11 === 0 ? "at_court" : index % 7 === 0 ? "in_transit" : "sealed"; return { id: `EVD-MOCK-${String(index + 1).padStart(5, "0")}`, evidenceNumber: `EVD-MOCK-${String(index + 1).padStart(5, "0")}`, caseId: caseRecord.id, firId: caseRecord.firId, type, title: `Synthetic ${type.replaceAll("_", " ")} exhibit ${(index % 18) + 1}`, description: "Neutral placeholder evidence record; no disturbing media is stored.", collectedAt: seededDate(config.referenceDate, rng, 1, 300, 10), collectedByOfficerId: caseRecord.leadOfficerId ?? officers[index % officers.length].id, collectionLocation: `Generalized collection area ${(index % 25) + 1}`, storageLocation: status === "at_lab" ? "Synthetic Forensic Lab Queue" : `Evidence Store ${String((index % 8) + 1).padStart(2, "0")}`, chainOfCustodyStatus: status, forensicStatus: type === "digital_record" || type === "photograph" ? (index % 9 === 0 ? "in_review" : "completed") : index % 13 === 0 ? "pending" : "not_required", fileReference: `mock://evidence/${String(index + 1).padStart(5, "0")}`, thumbnailUrl: "/synthetic-evidence-placeholder.svg", sensitivity: index % 13 === 0 ? "highly_restricted" : index % 4 === 0 ? "restricted" : "normal", sealed: true, isSyntheticData: true, createdAt: caseRecord.openedAt, updatedAt: config.referenceDate } satisfies Evidence; });
}

function createCustodyEvents(config: MockConfig, evidence: Evidence[], officers: PoliceOfficer[]): EvidenceCustodyEvent[] {
  return evidence.map((item, index) => ({ id: `CUST-MOCK-${String(index + 1).padStart(5, "0")}`, evidenceId: item.id, action: item.chainOfCustodyStatus === "at_lab" ? "submitted_to_lab" : item.chainOfCustodyStatus === "at_court" ? "submitted_to_court" : "sealed", fromOfficerId: index % 3 === 0 ? officers[index % officers.length].id : undefined, toOfficerId: index % 4 === 0 ? officers[(index + 1) % officers.length].id : undefined, location: item.storageLocation, timestamp: item.collectedAt, remarks: "Synthetic custody event for traceability demonstration.", signatureStatus: index % 8 === 0 ? "pending" : "verified", isSyntheticData: true, createdAt: item.collectedAt } satisfies EvidenceCustodyEvent));
}

function createNotes(config: MockConfig, cases: CrimeCase[], officers: PoliceOfficer[], rng: SeededRandom): CaseNote[] {
  const noteTypes: CaseNote["noteType"][] = ["investigation", "field_visit", "witness", "handover", "general"];
  return Array.from({ length: config.counts.notes }, (_, index) => { const caseRecord = cases[index % cases.length]; const createdAt = seededDate(config.referenceDate, rng, 0, 350, 11); return { id: `NOTE-MOCK-${String(index + 1).padStart(5, "0")}`, caseId: caseRecord.id, authorOfficerId: caseRecord.leadOfficerId ?? officers[index % officers.length].id, noteType: noteTypes[index % noteTypes.length], content: "Synthetic case note: review the authorized record and document the next verified action.", visibility: index % 17 === 0 ? "restricted" : index % 4 === 0 ? "district" : "case_team", isSyntheticData: true, createdAt, updatedAt: createdAt } satisfies CaseNote; });
}

function createStatusHistory(config: MockConfig, cases: CrimeCase[], officer: PoliceOfficer): CaseStatusHistory[] {
  return cases.map((caseRecord, index) => ({ id: `CSH-MOCK-${String(index + 1).padStart(5, "0")}`, caseId: caseRecord.id, previousStatus: undefined, newStatus: caseRecord.status, changedByOfficerId: caseRecord.leadOfficerId ?? officer.id, reason: "Synthetic initial status history entry.", changedAt: caseRecord.openedAt, isSyntheticData: true } satisfies CaseStatusHistory));
}

function createTasks(config: MockConfig, cases: CrimeCase[], officers: PoliceOfficer[], rng: SeededRandom): Task[] {
  return Array.from({ length: config.counts.tasks }, (_, index) => { const caseRecord = cases[index % cases.length]; const dueDate = addDays(seededDate(config.referenceDate, rng, 0, 140, 9), index % 9 === 0 ? -4 : 4 + (index % 15)); const status: Task["status"] = dueDate < config.referenceDate && index % 7 !== 0 ? "pending" : index % 13 === 0 ? "blocked" : index % 5 === 0 ? "completed" : "in_progress"; return { id: `TASK-MOCK-${String(index + 1).padStart(5, "0")}`, caseId: caseRecord.id, title: ["Review evidence submission", "Schedule witness follow-up", "Verify station report", "Prepare case briefing", "Check forensic status"][index % 5], description: "Synthetic task for workflow and workload demonstrations.", assignedToOfficerId: caseRecord.leadOfficerId ?? officers[index % officers.length].id, assignedByOfficerId: officers[(index + 3) % officers.length].id, priority: index % 11 === 0 ? "urgent" : index % 4 === 0 ? "high" : "normal", status, dueDate, completedAt: status === "completed" ? addDays(dueDate, -1) : undefined, isSyntheticData: true, createdAt: caseRecord.openedAt, updatedAt: config.referenceDate } satisfies Task; });
}

function createAlerts(config: MockConfig, cases: CrimeCase[], incidents: Incident[], stations: PoliceStation[], rng: SeededRandom): Alert[] {
  const types: Alert["type"][] = ["crime_spike", "repeat_location", "suspect_match", "vehicle_match", "case_inactivity", "evidence_deadline", "missing_person", "high_risk_incident", "hotspot_escalation", "inter_station_link"];
  return Array.from({ length: config.counts.alerts }, (_, index) => { const caseRecord = cases[index % cases.length]; const incident = incidents[index % incidents.length]; const status: Alert["status"] = index % 5 === 0 ? "resolved" : index % 3 === 0 ? "acknowledged" : "new"; const generatedAt = seededDate(config.referenceDate, rng, 0, 120, 8); return { id: `ALT-MOCK-${String(index + 1).padStart(5, "0")}`, type: types[index % types.length], title: `${types[index % types.length].replaceAll("_", " ")} requires review`, message: "Synthetic alert generated from deterministic mock signals. Validate before operational use.", severity: index % 17 === 0 ? "critical" : index % 4 === 0 ? "high" : "medium", districtId: incident.districtId, stationId: stations[index % stations.length].id, caseId: caseRecord.id, latitude: incident.latitude, longitude: incident.longitude, status, assignedToOfficerId: caseRecord.leadOfficerId, generatedAt, acknowledgedAt: status !== "new" ? addDays(generatedAt, 1) : undefined, resolvedAt: status === "resolved" ? addDays(generatedAt, 2) : undefined, metadata: { source: "synthetic-seed", signalCount: 2 + (index % 4), reviewRequired: true }, isSyntheticData: true, createdAt: generatedAt, updatedAt: config.referenceDate } satisfies Alert; });
}

function createLocations(config: MockConfig, stations: PoliceStation[], incidents: Incident[]): GeographicLocation[] {
  const locations: GeographicLocation[] = stations.map((station, index) => ({ id: `LOC-MOCK-STATION-${String(index + 1).padStart(4, "0")}`, name: `${station.name} station area`, type: "station", districtId: station.districtId, stationId: station.id, latitude: station.latitude, longitude: station.longitude, geohash: `mock-${station.stationCode.toLowerCase()}`, ward: `Ward ${(index % 20) + 1}`, beat: `Beat ${(index % 6) + 1}`, jurisdiction: station.jurisdictionName, riskLevel: index % 11 === 0 ? "high" : "medium", isSyntheticData: true, createdAt: iso("2026-01-01T00:00:00Z"), updatedAt: config.referenceDate }));
  incidents.slice(0, Math.min(100, incidents.length)).forEach((incident, index) => locations.push({ id: `LOC-MOCK-SCENE-${String(index + 1).padStart(4, "0")}`, name: incident.locationName, type: index % 3 === 0 ? "hotspot" : "crime_scene", districtId: incident.districtId, stationId: incident.stationId, latitude: incident.latitude, longitude: incident.longitude, geohash: `mock-scene-${index + 1}`, ward: `Ward ${(index % 20) + 1}`, beat: `Beat ${(index % 6) + 1}`, jurisdiction: incident.jurisdictionId, riskLevel: incident.severity === "critical" ? "critical" : incident.severity, isSyntheticData: true, createdAt: incident.createdAt, updatedAt: config.referenceDate }));
  return locations;
}

function createHotspots(config: MockConfig, locations: GeographicLocation[], incidents: Incident[], categories: CrimeCategory[], rng: SeededRandom): CrimeHotspot[] {
  const groups = new Map<string, Incident[]>(); incidents.forEach((incident) => { const key = `${incident.stationId}:${incident.crimeCategoryId}`; const rows = groups.get(key) ?? []; rows.push(incident); groups.set(key, rows); }); const ordered = Array.from(groups.values()).sort((a, b) => b.length - a.length);
  return Array.from({ length: config.counts.hotspots }, (_, index) => { const rows = ordered[index % ordered.length]; const first = rows[0]; const category = categories.find((item) => item.id === first.crimeCategoryId)!; const location = locations.find((item) => item.stationId === first.stationId && item.type === "station") ?? locations[0]; return { id: `HOT-MOCK-${String(index + 1).padStart(5, "0")}`, locationId: location.id, districtId: first.districtId, stationId: first.stationId, crimeCategoryId: first.crimeCategoryId, periodStart: seededDate(config.referenceDate, rng, 90, 150, 0), periodEnd: config.referenceDate, incidentCount: rows.length + (index % 7), severityIndex: Math.min(100, Math.round(rows.reduce((sum, item) => sum + (item.severity === "critical" ? 100 : item.severity === "high" ? 75 : item.severity === "medium" ? 50 : 25), 0) / rows.length)), trendPercentage: rng.integer(-22, 68), riskLevel: rows.some((item) => item.severity === "critical") ? "critical" : rows.length > 12 ? "high" : rows.length > 7 ? "medium" : "low", latitude: location.latitude + rng.decimal(-0.01, 0.01, 5), longitude: location.longitude + rng.decimal(-0.01, 0.01, 5), radiusMeters: 180 + (index % 6) * 90, topCrimeTypes: [category.name], recommendedAction: "Review patrol coverage and validate the pattern with authorized incident records.", isSyntheticData: true, createdAt: config.referenceDate, updatedAt: config.referenceDate } satisfies CrimeHotspot; });
}

function createBeats(config: MockConfig, stations: PoliceStation[], officers: PoliceOfficer[], rng: SeededRandom): PatrolBeat[] {
  return Array.from({ length: config.counts.beats }, (_, index) => { const station = stations[index % stations.length]; const lastPatrolledAt = seededDate(config.referenceDate, rng, 0, 8, 5); return { id: `BEAT-MOCK-${String(index + 1).padStart(4, "0")}`, beatCode: `BEAT-${station.stationCode}-${String((index % station.beatCount) + 1).padStart(2, "0")}`, name: `${station.name} beat ${(index % station.beatCount) + 1}`, stationId: station.id, districtId: station.districtId, assignedOfficerIds: [officers[index % officers.length].id, officers[(index + 1) % officers.length].id], boundaryReference: `mock://boundaries/${station.stationCode}/${index + 1}`, riskLevel: index % 11 === 0 ? "high" : index % 4 === 0 ? "medium" : "low", activeIncidents: index % 8, patrolStatus: index % 9 === 0 ? "delayed" : index % 5 === 0 ? "completed" : "on_schedule", lastPatrolledAt, nextPatrolAt: addDays(lastPatrolledAt, 1), isSyntheticData: true, createdAt: iso("2026-01-01T00:00:00Z"), updatedAt: config.referenceDate } satisfies PatrolBeat; });
}

function createVehicles(config: MockConfig, persons: Person[], cases: CrimeCase[], rng: SeededRandom): Vehicle[] {
  const makes = [["Sample Motors", "Urban X"], ["Fiction Auto", "Roadster"], ["Demo Mobility", "City 2"], ["Synthetic Bikes", "Commuter"]] as const;
  return Array.from({ length: config.counts.vehicles }, (_, index) => { const make = makes[index % makes.length]; return { id: `VEH-MOCK-${String(index + 1).padStart(5, "0")}`, vehicleCode: `VEHICLE-MOCK-${String(index + 1).padStart(5, "0")}`, registrationMasked: `KA-XX-${String((index % 99) + 1).padStart(2, "0")}-XXXX`, make: make[0], model: make[1], color: rng.choice(["white", "silver", "blue", "black", "red"] as const), vehicleType: index % 2 === 0 ? "two_wheeler" : index % 5 === 0 ? "commercial" : "car", ownerPersonId: persons[index % persons.length].id, status: index % 23 === 0 ? "reported_stolen" : index % 17 === 0 ? "recovered" : index % 11 === 0 ? "under_verification" : "normal", linkedCaseIds: index % 4 === 0 ? [cases[index % cases.length].id] : [], lastSeenLocation: `Generalized vehicle location ${(index % 30) + 1}`, latitude: 12.8 + rng.decimal(-0.2, 4.5, 4), longitude: 74.7 + rng.decimal(-0.1, 2.4, 4), lastSeenAt: seededDate(config.referenceDate, rng, 0, 80, 16), isSyntheticData: true, createdAt: iso("2026-01-01T00:00:00Z"), updatedAt: config.referenceDate } satisfies Vehicle; });
}

function createReports(config: MockConfig, cases: CrimeCase[], persons: Person[], locations: GeographicLocation[], officers: PoliceOfficer[], rng: SeededRandom): IntelligenceReport[] {
  const types: IntelligenceReport["reportType"][] = ["district_summary", "case_link", "hotspot", "suspect", "vehicle", "trend", "patrol"];
  return Array.from({ length: config.counts.reports }, (_, index) => ({ id: `RPT-MOCK-${String(index + 1).padStart(5, "0")}`, reportNumber: `REPORT-MOCK-${String(index + 1).padStart(5, "0")}`, title: `Synthetic ${types[index % types.length].replaceAll("_", " ")} intelligence report`, summary: "Generalized intelligence report content for workflow demonstrations. Validate all signals before operational use.", reportType: types[index % types.length], classification: index % 7 === 0 ? "confidential" : index % 3 === 0 ? "restricted" : "internal", districtId: cases[index % cases.length].districtId, stationId: cases[index % cases.length].stationId, authorOfficerId: officers[index % officers.length].id, relatedCaseIds: [cases[index % cases.length].id, ...(index % 4 === 0 ? [cases[(index + 1) % cases.length].id] : [])], relatedPersonIds: [persons[index % persons.length].id], relatedLocationIds: [locations[index % locations.length].id], confidenceLevel: index % 5 === 0 ? "low" : index % 3 === 0 ? "medium" : "high", sourceReliability: index % 5 === 0 ? "limited" : index % 4 === 0 ? "moderate" : "strong", status: index % 6 === 0 ? "review" : index % 4 === 0 ? "draft" : "published", publishedAt: index % 4 !== 0 ? seededDate(config.referenceDate, rng, 0, 80, 13) : undefined, isSyntheticData: true, createdAt: seededDate(config.referenceDate, rng, 0, 180, 12), updatedAt: config.referenceDate } satisfies IntelligenceReport));
}

function createDocuments(config: MockConfig, cases: CrimeCase[], evidence: Evidence[], officers: PoliceOfficer[], rng: SeededRandom): DocumentAttachment[] {
  return Array.from({ length: Math.min(360, config.counts.evidence) }, (_, index) => { const entity = index % 2 === 0 ? cases[index % cases.length] : evidence[index % evidence.length]; return { id: `DOC-MOCK-${String(index + 1).padStart(5, "0")}`, entityType: index % 2 === 0 ? "case" : "evidence", entityId: entity.id, fileName: `synthetic-record-${String(index + 1).padStart(5, "0")}.pdf`, displayName: `Synthetic attachment ${index + 1}`, mimeType: "application/pdf", sizeBytes: 18_000 + index * 37, category: index % 4 === 0 ? "statement" : index % 5 === 0 ? "court" : "evidence", storageReference: `mock://documents/${String(index + 1).padStart(5, "0")}`, uploadedByOfficerId: officers[index % officers.length].id, uploadedAt: seededDate(config.referenceDate, rng, 0, 180, 14), verificationStatus: index % 11 === 0 ? "pending" : index % 7 === 0 ? "rejected" : "verified", sensitivity: index % 13 === 0 ? "highly_restricted" : index % 4 === 0 ? "restricted" : "normal", isSyntheticData: true, createdAt: config.referenceDate, updatedAt: config.referenceDate } satisfies DocumentAttachment; });
}

function createAuditLogs(config: MockConfig, users: UserAccount[], officers: PoliceOfficer[], cases: CrimeCase[], evidence: Evidence[], rng: SeededRandom): AuditLog[] {
  const actions = ["record_created", "record_updated", "status_changed", "evidence_transferred", "report_generated", "sensitive_record_viewed", "export_requested"] as const;
  return Array.from({ length: config.counts.auditLogs }, (_, index) => ({ id: `AUDIT-MOCK-${String(index + 1).padStart(5, "0")}`, actorUserId: users[index % users.length].id, actorOfficerId: officers[index % officers.length].id, action: actions[index % actions.length], entityType: index % 3 === 0 ? "case" : index % 3 === 1 ? "evidence" : "report", entityId: index % 3 === 0 ? cases[index % cases.length].id : index % 3 === 1 ? evidence[index % evidence.length].id : `RPT-MOCK-${String((index % config.counts.reports) + 1).padStart(5, "0")}`, previousData: index % 4 === 0 ? { status: "under_investigation" } : undefined, newData: { source: "synthetic-seed", reviewRequired: index % 5 === 0 }, ipAddressMasked: "10.0.XX.XX", userAgent: "KSP Mock Development Client", requestId: `REQ-MOCK-${String(index + 1).padStart(6, "0")}`, timestamp: seededDate(config.referenceDate, rng, 0, 420, 14), isSyntheticData: true } satisfies AuditLog));
}

function createConversations(config: MockConfig, users: UserAccount[], cases: CrimeCase[], stations: PoliceStation[], rng: SeededRandom): { conversations: MockDatabaseState["conversations"]; messages: MockDatabaseState["messages"] } {
  const conversations: MockDatabaseState["conversations"] = []; const messages: MockDatabaseState["messages"] = [];
  for (let index = 0; index < config.counts.conversations; index += 1) {
    const startedAt = seededDate(config.referenceDate, rng, 0, 90, 9); const sessionId = `CONV-MOCK-${String(index + 1).padStart(4, "0")}`;
    conversations.push({ id: sessionId, userId: users[index % users.length].id, title: ["Theft cases in sample district", "Station workload review", "Recent hotspot summary", "Pending evidence query", "High-priority case review"][index % 5], contextType: index % 4 === 0 ? "district" : index % 3 === 0 ? "station" : "search", contextEntityId: index % 4 === 0 ? cases[index % cases.length].districtId : index % 3 === 0 ? stations[index % stations.length].id : undefined, startedAt, lastMessageAt: addDays(startedAt, 0.01), status: index % 7 === 0 ? "archived" : "active", isSyntheticData: true, createdAt: startedAt, updatedAt: config.referenceDate });
    messages.push({ id: `MSG-MOCK-${String(messages.length + 1).padStart(5, "0")}`, sessionId, role: "user", content: ["Show high-priority theft cases in the last 30 days.", "Which stations have the highest pending case count?", "Show recent hotspot trends."][index % 3], queryIntent: "case_search", filters: { synthetic: true }, referencedEntityIds: [], isSyntheticData: true, createdAt: startedAt });
    messages.push({ id: `MSG-MOCK-${String(messages.length + 1).padStart(5, "0")}`, sessionId, role: "assistant", content: "This synthetic response is generated from the mock repository query and requires human review.", queryIntent: "case_search", filters: { synthetic: true }, referencedEntityIds: [cases[index % cases.length].id], generatedVisualization: { type: "table", title: "Synthetic result preview", data: [] }, isSyntheticData: true, createdAt: addDays(startedAt, 0.01) });
  }
  return { conversations, messages };
}

export function seedMockDatabase(config: MockConfig): MockDatabaseState {
  const rng = new SeededRandom(config.seed); const districts = createDistricts(config); const categories = createCategories(config); const legalSections = createLegalSections(config); const stations = createStations(config, districts, rng); const officers = createOfficers(config, stations, rng); const users = createUsers(config, officers, stations, districts); const persons = createPersons(config, districts, rng); const incidents = createIncidents(config, stations, categories, rng); const firs = createFirs(config, incidents, categories, legalSections, persons, officers, rng); const cases = createCases(config, firs, categories, officers, rng); const casePersons = createRelationships(config, cases, persons, rng); const suspects = createSuspects(config, casePersons, persons, cases, rng); const arrests = createArrests(config, cases, casePersons, officers, rng); const evidence = createEvidence(config, cases, officers, rng); const custodyEvents = createCustodyEvents(config, evidence, officers); const caseNotes = createNotes(config, cases, officers, rng); const caseStatusHistory = createStatusHistory(config, cases, officers[0]); const tasks = createTasks(config, cases, officers, rng); const alerts = createAlerts(config, cases, incidents, stations, rng); const locations = createLocations(config, stations, incidents); const hotspots = createHotspots(config, locations, incidents, categories, rng); const beats = createBeats(config, stations, officers, rng); const vehicles = createVehicles(config, persons, cases, rng); const intelligenceReports = createReports(config, cases, persons, locations, officers, rng); const documents = createDocuments(config, cases, evidence, officers, rng); const auditLogs = createAuditLogs(config, users, officers, cases, evidence, rng); const conversationData = createConversations(config, users, cases, stations, rng);
  return { districts, stations, officers, users, categories, legalSections, incidents, firs, cases, persons, casePersons, suspects, arrests, evidence, custodyEvents, caseNotes, caseStatusHistory, tasks, alerts, intelligenceReports, locations, hotspots, beats, vehicles, documents, auditLogs, conversations: conversationData.conversations, messages: conversationData.messages };
}
