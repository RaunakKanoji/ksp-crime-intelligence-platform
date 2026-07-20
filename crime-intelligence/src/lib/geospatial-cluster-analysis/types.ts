export interface GeospatialClusterFilters {
  radiusKm?: number;
  minimumPoints?: number;
  category?: string;
  district?: string;
  boundaryId?: string;
  from?: string;
  to?: string;
}

export interface ClusterCategoryCount {
  category: string;
  count: number;
}

export interface GeospatialCluster {
  id: string;
  center: [number, number];
  precision: "district-scale masked";
  radiusKm: number;
  incidentCount: number;
  dominantCategory: string;
  categoryDistribution: ClusterCategoryCount[];
  district: string;
  stations: string[];
  firstIncidentAt: string;
  lastIncidentAt: string;
  highestSeverity: "low" | "medium" | "high" | "critical";
  averageRiskScore: number;
  confidence: "Low" | "Medium" | "High";
  explanation: string;
}

export interface GeospatialClusterResponse {
  clusters: GeospatialCluster[];
  total: number;
  filteredIncidentCount: number;
  unclusteredIncidentCount: number;
  isSampleData: boolean;
  generatedAt: string;
  coordinatesMasked: true;
  algorithm: {
    name: "Radius-neighborhood connected components";
    radiusKm: number;
    minimumPoints: number;
    notes: string[];
  };
  limitations: string[];
  auditNote: string;
  availableFilters: {
    categories: string[];
    districts: string[];
    boundaries: Array<{ id: string; label: string; district: string }>;
  };
}
