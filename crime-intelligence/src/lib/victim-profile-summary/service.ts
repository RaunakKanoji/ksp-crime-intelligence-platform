import { hasPermission, type UserRole } from "@/lib/permissions";
import type {
  VictimLinkedFir,
  VictimProfileSummary,
} from "./types";

interface RawVictimProfile {
  id: string;
  name: string;
  ageRange: string;
  gender: string;
  addressSummary: string;
  identityProtection: VictimProfileSummary["identity"]["identityProtection"];
  linkedFirs: VictimLinkedFir[];
  privacyWarning: string;
  supportNote: string;
}

export class VictimProfileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VictimProfileValidationError";
  }
}

const SAMPLE_VICTIM_PROFILES: RawVictimProfile[] = [
  {
    id: "VIC-001-A",
    name: "Meera S.",
    ageRange: "30-40",
    gender: "Female",
    addressSummary: "Central Bengaluru",
    identityProtection: "Standard",
    linkedFirs: [
      {
        id: "FIR-SAMPLE-001",
        firNumber: "BLR-CEN-2026-0142",
        crimeCategory: "Theft",
        registeredAt: "2026-07-02T10:35:00+05:30",
        district: "Bengaluru City",
        policeStation: "Central Division",
        caseStatus: "Under Investigation",
        victimRole: "Complainant",
      },
    ],
    privacyWarning:
      "Use this summary only for an authorized operational purpose. Do not copy victim identity or location details into unapproved channels.",
    supportNote: "No victim-support referral is recorded in this sample profile.",
  },
  {
    id: "VIC-002-A",
    name: "Anil R.",
    ageRange: "35-45",
    gender: "Male",
    addressSummary: "Whitefield, Bengaluru",
    identityProtection: "Standard",
    linkedFirs: [
      {
        id: "FIR-SAMPLE-002",
        firNumber: "BLR-WFD-2026-0188",
        crimeCategory: "Cybercrime",
        registeredAt: "2026-06-25T11:20:00+05:30",
        district: "Bengaluru City",
        policeStation: "Whitefield",
        caseStatus: "Open",
        victimRole: "Complainant",
      },
    ],
    privacyWarning:
      "Financial and contact identifiers are excluded. Use approved case systems for any operational follow-up.",
    supportNote: "Digital-fraud assistance information was provided in the sample workflow.",
  },
  {
    id: "VIC-005-A",
    name: "Protected victim",
    ageRange: "18-25",
    gender: "Female",
    addressSummary: "Withheld for safety",
    identityProtection: "Protected",
    linkedFirs: [
      {
        id: "FIR-SAMPLE-005",
        firNumber: "MYS-NZR-2026-0079",
        crimeCategory: "Women Safety",
        registeredAt: "2026-05-30T09:50:00+05:30",
        district: "Mysuru",
        policeStation: "Nazarbad",
        caseStatus: "Open",
        victimRole: "Victim",
      },
    ],
    privacyWarning:
      "Protected profile. Identity, address, and statement details must not be disclosed outside the authorized investigation team.",
    supportNote: "Victim-support follow-up is marked as required in this sample workflow.",
  },
];

export function validateVictimProfileId(value: string): string {
  const id = value.trim();
  if (!id) throw new VictimProfileValidationError("Victim profile identifier is required.");
  if (id.length > 40 || !/^[A-Z0-9-]+$/i.test(id)) {
    throw new VictimProfileValidationError("Victim profile identifier is invalid.");
  }
  return id.toUpperCase();
}

function toPermissionFilteredProfile(
  record: RawVictimProfile,
  role: UserRole
): VictimProfileSummary {
  const canViewPii = hasPermission(role, "data:view-pii");
  const canViewSupportNote = hasPermission(role, "data:view-investigation-notes");
  const statuses = record.linkedFirs.map((fir) => fir.caseStatus);

  return {
    id: record.id,
    identity: {
      name: canViewPii ? record.name : null,
      ageRange: canViewPii ? record.ageRange : null,
      gender: canViewPii ? record.gender : null,
      addressSummary: canViewPii ? record.addressSummary : null,
      identityProtection: record.identityProtection,
    },
    linkedFirs: record.linkedFirs,
    caseStatusSummary: {
      totalLinkedCases: statuses.length,
      openCases: statuses.filter((status) => status === "Open").length,
      underInvestigationCases: statuses.filter(
        (status) => status === "Under Investigation"
      ).length,
      closedCases: statuses.filter((status) => status === "Closed").length,
    },
    privacyWarning: record.privacyWarning,
    supportNote: canViewSupportNote ? record.supportNote : null,
    isSampleData: true,
    generatedAt: new Date().toISOString(),
    redaction: {
      pii: canViewPii,
      supportNote: canViewSupportNote,
    },
    auditNote:
      "Audit persistence is pending feature 035. Victim profile views and restricted-field access must be logged in Catalyst Data Store when audit logs are active.",
  };
}

export async function getVictimProfile(
  id: string,
  role: UserRole
): Promise<VictimProfileSummary | null> {
  if (!hasPermission(role, "page:victim-profile")) return null;
  const safeId = validateVictimProfileId(id);
  await new Promise((resolve) => setTimeout(resolve, 250));
  const record = SAMPLE_VICTIM_PROFILES.find((profile) => profile.id === safeId);
  return record ? toPermissionFilteredProfile(record, role) : null;
}
