import { hasPermission, type UserRole } from "@/lib/permissions";
import type {
  NetworkEdge,
  NetworkGraphFilters,
  NetworkGraphResponse,
  NetworkNode,
  NetworkNodeType,
  NetworkRelationshipType,
} from "./types";

interface RawNode extends Omit<NetworkNode, "degree" | "label"> {
  label: string;
  district: string;
}

export class NetworkGraphValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkGraphValidationError";
  }
}

const NODE_TYPES: NetworkNodeType[] = ["accused", "fir", "location", "category"];
const RELATIONSHIPS: NetworkRelationshipType[] = ["named-in", "associated-with", "occurred-at", "classified-as", "linked-case"];

const RAW_NODES: RawNode[] = [
  { id: "ACC-001-A", type: "accused", label: "Ravi K.", subtitle: "Repeat-offender indicator · identity under review", sensitive: true, href: "/people?id=ACC-001-A", district: "Bengaluru City" },
  { id: "ACC-006-A", type: "accused", label: "M. Shankar", subtitle: "Identity under review", sensitive: true, href: "/people?id=ACC-006-A", district: "Mysuru" },
  { id: "ACC-ASSOC-2", type: "accused", label: "Sample associate A", subtitle: "Association under review", sensitive: true, href: null, district: "Bengaluru City" },
  { id: "FIR-SAMPLE-001", type: "fir", label: "BLR-CEN-2026-0142", subtitle: "Theft · Under Investigation", sensitive: false, href: "/fir-search/FIR-SAMPLE-001", district: "Bengaluru City" },
  { id: "FIR-SAMPLE-009", type: "fir", label: "HBD-VID-2026-0092", subtitle: "Vehicle theft · Open", sensitive: false, href: "/fir-search/FIR-SAMPLE-009", district: "Bengaluru City" },
  { id: "FIR-SAMPLE-012", type: "fir", label: "BLR-UPR-2025-0811", subtitle: "Theft · Charge Sheet Filed", sensitive: false, href: "/fir-search/FIR-SAMPLE-012", district: "Bengaluru City" },
  { id: "FIR-SAMPLE-013", type: "fir", label: "MYS-LKR-2026-0031", subtitle: "Burglary · Open", sensitive: false, href: "/fir-search/FIR-SAMPLE-013", district: "Mysuru" },
  { id: "LOC-BLR-CENTRAL", type: "location", label: "Central Bengaluru", subtitle: "Generalized occurrence area", sensitive: false, href: null, district: "Bengaluru City" },
  { id: "LOC-BLR-WEST", type: "location", label: "West Bengaluru", subtitle: "Generalized occurrence area", sensitive: false, href: null, district: "Bengaluru City" },
  { id: "LOC-MYS-CENTRAL", type: "location", label: "Central Mysuru", subtitle: "Generalized occurrence area", sensitive: false, href: null, district: "Mysuru" },
  { id: "CAT-THEFT", type: "category", label: "Theft", subtitle: "Crime category", sensitive: false, href: null, district: "Bengaluru City" },
  { id: "CAT-VEHICLE", type: "category", label: "Vehicle theft", subtitle: "Crime category", sensitive: false, href: null, district: "Bengaluru City" },
  { id: "CAT-BURGLARY", type: "category", label: "Burglary", subtitle: "Crime category", sensitive: false, href: null, district: "Mysuru" },
];

const RAW_EDGES: NetworkEdge[] = [
  { id: "E-001", source: "ACC-001-A", target: "FIR-SAMPLE-001", relationship: "named-in", label: "Named in FIR", evidence: "Stable accused reference in the sample FIR." },
  { id: "E-002", source: "ACC-001-A", target: "FIR-SAMPLE-009", relationship: "associated-with", label: "Associated with FIR", evidence: "Association is under investigator review." },
  { id: "E-003", source: "ACC-001-A", target: "FIR-SAMPLE-012", relationship: "named-in", label: "Named in FIR", evidence: "Stable accused reference in the sample FIR." },
  { id: "E-004", source: "ACC-ASSOC-2", target: "FIR-SAMPLE-001", relationship: "associated-with", label: "Associated with FIR", evidence: "Sample co-accused association under review." },
  { id: "E-005", source: "ACC-ASSOC-2", target: "FIR-SAMPLE-009", relationship: "associated-with", label: "Associated with FIR", evidence: "Sample associate reference under review." },
  { id: "E-006", source: "ACC-006-A", target: "FIR-SAMPLE-013", relationship: "named-in", label: "Named in FIR", evidence: "Stable accused reference in the sample FIR." },
  { id: "E-007", source: "FIR-SAMPLE-001", target: "LOC-BLR-CENTRAL", relationship: "occurred-at", label: "Occurred at", evidence: "Generalized FIR occurrence area." },
  { id: "E-008", source: "FIR-SAMPLE-009", target: "LOC-BLR-WEST", relationship: "occurred-at", label: "Occurred at", evidence: "Generalized FIR occurrence area." },
  { id: "E-009", source: "FIR-SAMPLE-012", target: "LOC-BLR-CENTRAL", relationship: "occurred-at", label: "Occurred at", evidence: "Generalized FIR occurrence area." },
  { id: "E-010", source: "FIR-SAMPLE-013", target: "LOC-MYS-CENTRAL", relationship: "occurred-at", label: "Occurred at", evidence: "Generalized FIR occurrence area." },
  { id: "E-011", source: "FIR-SAMPLE-001", target: "CAT-THEFT", relationship: "classified-as", label: "Classified as", evidence: "FIR crime-category field." },
  { id: "E-012", source: "FIR-SAMPLE-009", target: "CAT-VEHICLE", relationship: "classified-as", label: "Classified as", evidence: "FIR crime-category field." },
  { id: "E-013", source: "FIR-SAMPLE-012", target: "CAT-THEFT", relationship: "classified-as", label: "Classified as", evidence: "FIR crime-category field." },
  { id: "E-014", source: "FIR-SAMPLE-013", target: "CAT-BURGLARY", relationship: "classified-as", label: "Classified as", evidence: "FIR crime-category field." },
  { id: "E-015", source: "FIR-SAMPLE-001", target: "FIR-SAMPLE-009", relationship: "linked-case", label: "Possible linked case", evidence: "Multiple authorized structured signals from feature 020." },
  { id: "E-016", source: "FIR-SAMPLE-001", target: "FIR-SAMPLE-012", relationship: "linked-case", label: "Possible linked case", evidence: "Multiple authorized structured signals from feature 020." },
];

export function validateNetworkFilters(input: NetworkGraphFilters): Required<Pick<NetworkGraphFilters, "nodeTypes" | "relationshipTypes" | "maxNodes">> & NetworkGraphFilters {
  const search = input.search?.trim() ?? "";
  if (search.length > 80) throw new NetworkGraphValidationError("Search text must be 80 characters or fewer.");
  const maxNodes = input.maxNodes ?? 50;
  if (!Number.isInteger(maxNodes) || maxNodes < 5 || maxNodes > 100) throw new NetworkGraphValidationError("Node limit must be between 5 and 100.");
  if (input.nodeTypes && input.nodeTypes.length === 0) throw new NetworkGraphValidationError("Select at least one node type.");
  const nodeTypes = input.nodeTypes ?? NODE_TYPES;
  if (nodeTypes.some((item) => !NODE_TYPES.includes(item))) throw new NetworkGraphValidationError("Node-type filter is invalid.");
  if (input.relationshipTypes && input.relationshipTypes.length === 0) throw new NetworkGraphValidationError("Select at least one relationship type.");
  const relationshipTypes = input.relationshipTypes ?? RELATIONSHIPS;
  if (relationshipTypes.some((item) => !RELATIONSHIPS.includes(item))) throw new NetworkGraphValidationError("Relationship filter is invalid.");
  const districts = Array.from(new Set(RAW_NODES.map((item) => item.district)));
  if (input.district && !districts.includes(input.district)) throw new NetworkGraphValidationError("District filter is invalid.");
  return { ...input, search, maxNodes, nodeTypes, relationshipTypes };
}

export async function getCriminalNetworkGraph(input: NetworkGraphFilters, role: UserRole): Promise<NetworkGraphResponse> {
  if (!hasPermission(role, "page:criminal-network-graph")) throw new Error("Permission denied.");
  const filters = validateNetworkFilters(input);
  const canViewPii = hasPermission(role, "data:view-pii");
  const search = filters.search?.toLowerCase();
  const matching = RAW_NODES.filter((node) =>
    filters.nodeTypes.includes(node.type) &&
    (!filters.district || node.district === filters.district) &&
    (!search || node.id.toLowerCase().includes(search) || (!node.sensitive || canViewPii) && node.label.toLowerCase().includes(search))
  );
  const totalNodesBeforeLimit = matching.length;
  const limited = matching.slice(0, filters.maxNodes);
  const ids = new Set(limited.map((node) => node.id));
  const edges = RAW_EDGES.filter((edge) =>
    ids.has(edge.source) && ids.has(edge.target) && filters.relationshipTypes.includes(edge.relationship)
  );
  const degree = new Map<string, number>();
  edges.forEach((edge) => {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  });
  const nodes = limited.map((node): NetworkNode => ({
    id: node.id, type: node.type,
    label: node.sensitive && !canViewPii ? `Restricted accused ${node.id.slice(-3)}` : node.label,
    subtitle: node.sensitive && !canViewPii ? "Identity details restricted" : node.subtitle,
    sensitive: node.sensitive, href: node.sensitive && !canViewPii ? null : node.href,
    degree: degree.get(node.id) ?? 0,
  }));
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    nodes, edges, totalNodesBeforeLimit, truncated: totalNodesBeforeLimit > filters.maxNodes,
    isSampleData: true, generatedAt: new Date().toISOString(), accusedLabelsRedacted: !canViewPii,
    explanation: "Nodes represent permission-filtered accused persons, FIRs, generalized locations, and categories. Edges represent recorded or feature-020-derived relationship types; selecting an item reveals its evidence.",
    limitation: "Graph proximity and edge presence show recorded associations only. They do not establish guilt, coordination, or the legal significance of a relationship.",
    auditNote: "Audit persistence is pending feature 035. Sensitive graph views must be logged to Catalyst Data Store when audit logs are active.",
    availableFilters: { districts: Array.from(new Set(RAW_NODES.map((item) => item.district))).sort(), nodeTypes: NODE_TYPES, relationshipTypes: RELATIONSHIPS },
  };
}
