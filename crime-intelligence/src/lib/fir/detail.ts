// FIR Detail data service (feature 009).
//
// Catalyst Data Store is not connected yet, so this service returns clearly
// labeled SAMPLE detail records. Sensitive party fields and investigation notes
// are removed before the UI receives data for roles that lack permission.

import { hasPermission, type UserRole } from "@/lib/permissions";
import {
  type CaseStatus,
  type FirDetail,
  type FirDetailInvestigationNote,
  type FirDetailLinkedCase,
  type FirDetailParty,
} from "./types";

interface RawFirDetailParty {
  id: string;
  name: string;
  ageRange: string;
  gender: string;
  addressSummary: string;
  role: string;
  status?: string;
}

interface RawFirDetail {
  id: string;
  firNumber: string;
  district: string;
  policeStation: string;
  stationCode: string;
  jurisdiction: string;
  registeredAt: string;
  incidentDate: string;
  incidentTimeRange: string;
  reportedDate: string;
  placeOfOccurrence: string;
  crimeCategory: string;
  act: string;
  sections: string[];
  caseStatus: CaseStatus;
  investigatingOfficer: string;
  incidentSummary: string;
  incidentNarrative: string;
  accused: RawFirDetailParty[];
  victims: RawFirDetailParty[];
  investigationNotes: FirDetailInvestigationNote[];
  linkedCases: FirDetailLinkedCase[];
}

export class FirDetailValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FirDetailValidationError";
  }
}

const SAMPLE_FIR_DETAILS: RawFirDetail[] = [
  {
    id: "FIR-SAMPLE-001",
    firNumber: "BLR-CEN-2026-0142",
    district: "Bengaluru City",
    policeStation: "Central Division",
    stationCode: "BLR-CEN",
    jurisdiction: "Central business district and adjoining parking zones",
    registeredAt: "2026-07-02T10:35:00+05:30",
    incidentDate: "2026-07-02",
    incidentTimeRange: "08:10-08:40",
    reportedDate: "2026-07-02",
    placeOfOccurrence: "Commercial parking area near KG Road",
    crimeCategory: "Theft",
    act: "IPC",
    sections: ["379"],
    caseStatus: "Under Investigation",
    investigatingOfficer: "PI Central Division",
    incidentSummary: "Two-wheeler theft reported near a commercial parking area.",
    incidentNarrative:
      "Complainant reported that a parked two-wheeler was missing after returning from a nearby office complex. CCTV collection and vehicle movement checks are in progress.",
    accused: [
      {
        id: "ACC-001-A",
        name: "Ravi K.",
        ageRange: "25-35",
        gender: "Male",
        addressSummary: "Bengaluru urban limits",
        role: "Named suspect",
        status: "Verification pending",
      },
    ],
    victims: [
      {
        id: "VIC-001-A",
        name: "Meera S.",
        ageRange: "30-40",
        gender: "Female",
        addressSummary: "Central Bengaluru",
        role: "Complainant",
      },
    ],
    investigationNotes: [
      {
        id: "NOTE-001-A",
        recordedAt: "2026-07-02T14:10:00+05:30",
        authorRole: "Investigation team",
        note: "Possible link to vehicle theft cluster under manual review.",
      },
    ],
    linkedCases: [
      {
        id: "FIR-SAMPLE-009",
        firNumber: "HBD-VID-2026-0092",
        relationship: "Similar property-theft pattern; unconfirmed",
        status: "Open",
      },
    ],
  },
  {
    id: "FIR-SAMPLE-002",
    firNumber: "BLR-WFD-2026-0188",
    district: "Bengaluru City",
    policeStation: "Whitefield",
    stationCode: "BLR-WFD",
    jurisdiction: "Whitefield technology corridor",
    registeredAt: "2026-06-25T11:20:00+05:30",
    incidentDate: "2026-06-24",
    incidentTimeRange: "19:30-20:15",
    reportedDate: "2026-06-25",
    placeOfOccurrence: "Remote phone and UPI transaction channel",
    crimeCategory: "Cybercrime",
    act: "IT Act",
    sections: ["66D"],
    caseStatus: "Open",
    investigatingOfficer: "Cyber liaison officer",
    incidentSummary: "UPI fraud complaint involving impersonation over phone.",
    incidentNarrative:
      "Victim reported a caller impersonating support staff and inducing a UPI transfer. Bank reference requests and subscriber-detail verification are pending.",
    accused: [
      {
        id: "ACC-002-A",
        name: "Unknown caller",
        ageRange: "Unknown",
        gender: "Unknown",
        addressSummary: "Digital channel under verification",
        role: "Unknown accused",
        status: "Trace pending",
      },
    ],
    victims: [
      {
        id: "VIC-002-A",
        name: "Anil R.",
        ageRange: "35-45",
        gender: "Male",
        addressSummary: "Whitefield, Bengaluru",
        role: "Complainant",
      },
    ],
    investigationNotes: [
      {
        id: "NOTE-002-A",
        recordedAt: "2026-06-25T16:45:00+05:30",
        authorRole: "Cyber cell",
        note: "Bank transaction trail requested; account identifiers are withheld from restricted views.",
      },
    ],
    linkedCases: [
      {
        id: "FIR-SAMPLE-010",
        firNumber: "BLR-WFD-2026-0067",
        relationship: "Same station and cyber identity-misuse category",
        status: "Closed",
      },
    ],
  },
  {
    id: "FIR-SAMPLE-005",
    firNumber: "MYS-NZR-2026-0079",
    district: "Mysuru",
    policeStation: "Nazarbad",
    stationCode: "MYS-NZR",
    jurisdiction: "Nazarbad transit and public areas",
    registeredAt: "2026-05-30T09:50:00+05:30",
    incidentDate: "2026-05-29",
    incidentTimeRange: "18:00-18:30",
    reportedDate: "2026-05-30",
    placeOfOccurrence: "Transit area near bus stand",
    crimeCategory: "Women Safety",
    act: "IPC",
    sections: ["354"],
    caseStatus: "Open",
    investigatingOfficer: "Women safety desk officer",
    incidentSummary: "Harassment complaint registered near transit area.",
    incidentNarrative:
      "Protected complaint involving harassment in a crowded transit area. Patrol pattern review and witness identification are in progress.",
    accused: [
      {
        id: "ACC-005-A",
        name: "Identity under verification",
        ageRange: "Unknown",
        gender: "Male",
        addressSummary: "Unknown",
        role: "Suspect",
        status: "Identification pending",
      },
    ],
    victims: [
      {
        id: "VIC-005-A",
        name: "Protected victim",
        ageRange: "18-25",
        gender: "Female",
        addressSummary: "Withheld for safety",
        role: "Victim",
      },
    ],
    investigationNotes: [
      {
        id: "NOTE-005-A",
        recordedAt: "2026-05-30T13:30:00+05:30",
        authorRole: "Investigation team",
        note: "Victim identity and statement require strict permission control.",
      },
    ],
    linkedCases: [],
  },
];

function validateFirId(id: string): string {
  const cleaned = id.trim();
  if (!cleaned) throw new FirDetailValidationError("FIR record identifier is required.");
  if (!/^[A-Z0-9-]+$/i.test(cleaned) || cleaned.length > 40) {
    throw new FirDetailValidationError("FIR record identifier is invalid.");
  }
  return cleaned.toUpperCase();
}

function redactedParty(party: RawFirDetailParty, canViewPii: boolean): FirDetailParty {
  return {
    id: party.id,
    name: canViewPii ? party.name : null,
    ageRange: canViewPii ? party.ageRange : null,
    gender: canViewPii ? party.gender : null,
    addressSummary: canViewPii ? party.addressSummary : null,
    role: party.role,
    status: party.status,
    redacted: !canViewPii,
  };
}

function toDetail(record: RawFirDetail, role: UserRole): FirDetail {
  const canViewPii = hasPermission(role, "data:view-pii");
  const canViewNotes = hasPermission(role, "data:view-investigation-notes");

  return {
    id: record.id,
    firNumber: record.firNumber,
    district: record.district,
    policeStation: record.policeStation,
    stationCode: record.stationCode,
    jurisdiction: record.jurisdiction,
    registeredAt: record.registeredAt,
    incidentDate: record.incidentDate,
    incidentTimeRange: record.incidentTimeRange,
    reportedDate: record.reportedDate,
    placeOfOccurrence: record.placeOfOccurrence,
    crimeCategory: record.crimeCategory,
    act: record.act,
    sections: record.sections,
    caseStatus: record.caseStatus,
    investigatingOfficer: canViewNotes ? record.investigatingOfficer : null,
    incidentSummary: record.incidentSummary,
    incidentNarrative: record.incidentNarrative,
    accused: record.accused.map((party) => redactedParty(party, canViewPii)),
    victims: record.victims.map((party) => redactedParty(party, canViewPii)),
    investigationNotes: canViewNotes ? record.investigationNotes : null,
    linkedCases: record.linkedCases,
    isSampleData: true,
    generatedAt: new Date().toISOString(),
    redaction: {
      pii: canViewPii,
      investigationNotes: canViewNotes,
    },
    auditNote:
      "Audit integration is pending feature 035. FIR detail views and restricted field access should be logged in Catalyst Data Store when audit logs are active.",
  };
}

export async function getFirDetail(id: string, role: UserRole): Promise<FirDetail | null> {
  const safeId = validateFirId(id);

  await new Promise((resolve) => setTimeout(resolve, 250));

  const record = SAMPLE_FIR_DETAILS.find((item) => item.id === safeId);
  return record ? toDetail(record, role) : null;
}
