export type AccusedRiskLevel = "Low" | "Medium" | "High" | "Critical";
export type AccusedCaseStatus =
  | "Open"
  | "Under Investigation"
  | "Charge Sheet Filed"
  | "Closed";

export interface AccusedIdentity {
  name: string | null;
  ageRange: string | null;
  gender: string | null;
  addressSummary: string | null;
  identificationStatus: string;
}

export interface LinkedFirDetail {
  id: string;
  firNumber: string;
  crimeCategory: string;
  registeredAt: string;
  district: string;
  policeStation: string;
  caseStatus: AccusedCaseStatus;
  allegedRole: string;
}

export interface AccusedNetworkLink {
  id: string;
  personLabel: string | null;
  relationship: string;
  linkedFirCount: number;
  verificationStatus: "Verified" | "Under review" | "Unverified";
}

export interface AccusedProfile {
  id: string;
  identity: AccusedIdentity;
  aliases: string[] | null;
  repeatOffender: boolean;
  repeatOffenderReason: string;
  riskLevel: AccusedRiskLevel;
  associatedLocations: string[];
  associatedCategories: string[];
  linkedFirs: LinkedFirDetail[];
  networkLinks: AccusedNetworkLink[] | null;
  isSampleData: boolean;
  generatedAt: string;
  redaction: {
    pii: boolean;
    networkLinks: boolean;
  };
  auditNote: string;
}

export interface AccusedProfileResponse {
  profile: AccusedProfile | null;
}
