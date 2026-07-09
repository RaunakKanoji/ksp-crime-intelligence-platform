export type VictimCaseStatus =
  | "Open"
  | "Under Investigation"
  | "Charge Sheet Filed"
  | "Closed";

export interface VictimIdentity {
  name: string | null;
  ageRange: string | null;
  gender: string | null;
  addressSummary: string | null;
  identityProtection: "Protected" | "Standard";
}

export interface VictimLinkedFir {
  id: string;
  firNumber: string;
  crimeCategory: string;
  registeredAt: string;
  district: string;
  policeStation: string;
  caseStatus: VictimCaseStatus;
  victimRole: string;
}

export interface VictimProfileSummary {
  id: string;
  identity: VictimIdentity;
  linkedFirs: VictimLinkedFir[];
  caseStatusSummary: {
    totalLinkedCases: number;
    openCases: number;
    underInvestigationCases: number;
    closedCases: number;
  };
  privacyWarning: string;
  supportNote: string | null;
  isSampleData: boolean;
  generatedAt: string;
  redaction: {
    pii: boolean;
    supportNote: boolean;
  };
  auditNote: string;
}

export interface VictimProfileResponse {
  profile: VictimProfileSummary | null;
}
