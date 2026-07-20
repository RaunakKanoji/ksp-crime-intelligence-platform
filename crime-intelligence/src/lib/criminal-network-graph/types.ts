export type NetworkNodeType = "accused" | "fir" | "location" | "category";
export type NetworkRelationshipType =
  | "named-in"
  | "associated-with"
  | "occurred-at"
  | "classified-as"
  | "linked-case";

export interface NetworkGraphFilters {
  search?: string;
  district?: string;
  nodeTypes?: NetworkNodeType[];
  relationshipTypes?: NetworkRelationshipType[];
  maxNodes?: number;
}

export interface NetworkNode {
  id: string;
  type: NetworkNodeType;
  label: string;
  subtitle: string;
  degree: number;
  sensitive: boolean;
  href: string | null;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  relationship: NetworkRelationshipType;
  label: string;
  evidence: string;
}

export interface NetworkGraphResponse {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  totalNodesBeforeLimit: number;
  truncated: boolean;
  isSampleData: boolean;
  generatedAt: string;
  accusedLabelsRedacted: boolean;
  explanation: string;
  limitation: string;
  auditNote: string;
  availableFilters: {
    districts: string[];
    nodeTypes: NetworkNodeType[];
    relationshipTypes: NetworkRelationshipType[];
  };
}
