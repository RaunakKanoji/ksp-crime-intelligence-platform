import { hasPermission, type UserRole } from "@/lib/permissions";
import type {
  AccusedNetworkLink,
  AccusedProfile,
  LinkedFirDetail,
} from "./types";

interface RawAccusedProfile {
  id: string;
  name: string;
  aliases: string[];
  ageRange: string;
  gender: string;
  addressSummary: string;
  identificationStatus: string;
  repeatOffender: boolean;
  repeatOffenderReason: string;
  riskLevel: AccusedProfile["riskLevel"];
  associatedLocations: string[];
  associatedCategories: string[];
  linkedFirs: LinkedFirDetail[];
  networkLinks: AccusedNetworkLink[];
}

export class AccusedProfileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccusedProfileValidationError";
  }
}

const SAMPLE_PROFILES: RawAccusedProfile[] = [
  {
    id: "ACC-001-A",
    name: "Ravi K.",
    aliases: ["Ravi Kumar", "RK"],
    ageRange: "25-35",
    gender: "Male",
    addressSummary: "Bengaluru urban limits",
    identificationStatus: "Identity under verification",
    repeatOffender: true,
    repeatOffenderReason:
      "Linked to two sample FIR records. This indicator is descriptive and requires investigator review.",
    riskLevel: "High",
    associatedLocations: ["Central Bengaluru", "Vijayanagar, Bengaluru"],
    associatedCategories: ["Theft", "Vehicle theft"],
    linkedFirs: [
      {
        id: "FIR-SAMPLE-001",
        firNumber: "BLR-CEN-2026-0142",
        crimeCategory: "Theft",
        registeredAt: "2026-07-02T10:35:00+05:30",
        district: "Bengaluru City",
        policeStation: "Central Division",
        caseStatus: "Under Investigation",
        allegedRole: "Named suspect",
      },
      {
        id: "FIR-SAMPLE-009",
        firNumber: "HBD-VID-2026-0092",
        crimeCategory: "Vehicle theft",
        registeredAt: "2026-04-18T09:15:00+05:30",
        district: "Bengaluru City",
        policeStation: "Vijayanagar",
        caseStatus: "Open",
        allegedRole: "Association under review",
      },
    ],
    networkLinks: [
      {
        id: "NET-001",
        personLabel: "Sample associate A",
        relationship: "Co-accused in one linked sample FIR",
        linkedFirCount: 1,
        verificationStatus: "Under review",
      },
      {
        id: "NET-002",
        personLabel: "Sample associate B",
        relationship: "Shared generalized location",
        linkedFirCount: 1,
        verificationStatus: "Unverified",
      },
    ],
  },
  {
    id: "ACC-002-A",
    name: "Unknown caller",
    aliases: ["Support agent"],
    ageRange: "Unknown",
    gender: "Unknown",
    addressSummary: "Digital channel under verification",
    identificationStatus: "Trace pending",
    repeatOffender: false,
    repeatOffenderReason: "One sample FIR is linked; no repeat-offender indicator is present.",
    riskLevel: "Medium",
    associatedLocations: ["Remote digital channel"],
    associatedCategories: ["Cybercrime", "Identity misuse"],
    linkedFirs: [
      {
        id: "FIR-SAMPLE-002",
        firNumber: "BLR-WFD-2026-0188",
        crimeCategory: "Cybercrime",
        registeredAt: "2026-06-25T11:20:00+05:30",
        district: "Bengaluru City",
        policeStation: "Whitefield",
        caseStatus: "Open",
        allegedRole: "Unknown accused",
      },
    ],
    networkLinks: [],
  },
  {
    id: "ACC-005-A",
    name: "Identity under verification",
    aliases: [],
    ageRange: "Unknown",
    gender: "Male",
    addressSummary: "Unknown",
    identificationStatus: "Identification pending",
    repeatOffender: false,
    repeatOffenderReason: "No repeat-offender indicator is present in the available sample record.",
    riskLevel: "Low",
    associatedLocations: ["Mysuru transit area"],
    associatedCategories: ["Women Safety"],
    linkedFirs: [
      {
        id: "FIR-SAMPLE-005",
        firNumber: "MYS-NZR-2026-0079",
        crimeCategory: "Women Safety",
        registeredAt: "2026-05-30T09:50:00+05:30",
        district: "Mysuru",
        policeStation: "Nazarbad",
        caseStatus: "Open",
        allegedRole: "Suspect",
      },
    ],
    networkLinks: [],
  },
];

export function validateAccusedProfileId(value: string): string {
  const id = value.trim();
  if (!id) throw new AccusedProfileValidationError("Accused person identifier is required.");
  if (id.length > 40 || !/^[A-Z0-9-]+$/i.test(id)) {
    throw new AccusedProfileValidationError("Accused person identifier is invalid.");
  }
  return id.toUpperCase();
}

function permissionFilteredProfile(
  raw: RawAccusedProfile,
  role: UserRole
): AccusedProfile {
  const canViewPii = hasPermission(role, "data:view-pii");
  const canViewNetworkLinks = hasPermission(role, "data:view-investigation-notes");

  return {
    id: raw.id,
    identity: {
      name: canViewPii ? raw.name : null,
      ageRange: canViewPii ? raw.ageRange : null,
      gender: canViewPii ? raw.gender : null,
      addressSummary: canViewPii ? raw.addressSummary : null,
      identificationStatus: raw.identificationStatus,
    },
    aliases: canViewPii ? raw.aliases : null,
    repeatOffender: raw.repeatOffender,
    repeatOffenderReason: raw.repeatOffenderReason,
    riskLevel: raw.riskLevel,
    associatedLocations: raw.associatedLocations,
    associatedCategories: raw.associatedCategories,
    linkedFirs: raw.linkedFirs,
    networkLinks: canViewNetworkLinks ? raw.networkLinks : null,
    isSampleData: true,
    generatedAt: new Date().toISOString(),
    redaction: {
      pii: canViewPii,
      networkLinks: canViewNetworkLinks,
    },
    auditNote:
      "Audit integration is pending feature 035. Accused profile views and restricted-field access must be written to Catalyst Data Store when audit logs are active.",
  };
}

export async function getAccusedProfile(
  id: string,
  role: UserRole
): Promise<AccusedProfile | null> {
  if (!hasPermission(role, "page:accused-profile")) return null;
  const safeId = validateAccusedProfileId(id);
  await new Promise((resolve) => setTimeout(resolve, 250));
  const record = SAMPLE_PROFILES.find((profile) => profile.id === safeId);
  return record ? permissionFilteredProfile(record, role) : null;
}
