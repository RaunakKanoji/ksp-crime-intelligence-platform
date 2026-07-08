import type {
  CrimeIncidentFeature,
  CrimeIncidentFeatureCollection,
  CrimeSeverity,
  PatternAlert,
  PoliceBoundaryFeatureCollection,
} from "./map-types";

function incident(
  id: number,
  coordinates: [number, number],
  crimeType: string,
  district: string,
  policeStation: string,
  dateTime: string,
  severity: CrimeSeverity,
  riskScore: number,
  caseStatus = "Under Investigation",
  addressText = "Area-level location",
  modusOperandi = "Similar cases found in nearby time and location windows."
): CrimeIncidentFeature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates },
    properties: {
      id: `CM-${String(id).padStart(3, "0")}`,
      firNumber: `FIR-2026-${district.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "K")}-${String(id).padStart(4, "0")}`,
      crimeType,
      crimeCategory: crimeType,
      district,
      policeStation,
      incidentDateTime: dateTime,
      caseStatus,
      severity,
      riskScore,
      addressText,
      modusOperandi,
    },
  };
}

export const MOCK_CRIME_INCIDENTS: CrimeIncidentFeatureCollection = {
  type: "FeatureCollection",
  features: [
    incident(1, [77.5946, 12.9716], "Vehicle Theft", "Bengaluru City", "Central Division", "2026-07-02T20:20:00+05:30", "high", 76, "Open", "MG Road commercial parking area", "Two-wheeler theft from high-turnover parking area."),
    incident(2, [77.6068, 12.9759], "Vehicle Theft", "Bengaluru City", "Central Division", "2026-07-04T21:10:00+05:30", "high", 79, "Under Investigation", "Richmond Road mixed commercial area", "Pattern detected around evening parking exits."),
    incident(3, [77.6201, 12.9352], "Chain Snatching", "Bengaluru City", "Koramangala", "2026-07-05T19:40:00+05:30", "critical", 86, "Open", "Koramangala transit stretch", "Spike observed in evening ride-by incidents."),
    incident(4, [77.6412, 12.9141], "Chain Snatching", "Bengaluru City", "HSR Layout", "2026-07-01T18:50:00+05:30", "high", 74, "Open", "HSR sector road", "Similar cases found near bus stops."),
    incident(5, [77.7499, 12.9698], "Cyber Fraud", "Bengaluru City", "Whitefield", "2026-06-24T15:05:00+05:30", "medium", 58, "Under Investigation", "Whitefield IT corridor", "Phone impersonation followed by payment-link fraud."),
    incident(6, [77.7284, 12.9823], "Cyber Fraud", "Bengaluru City", "Whitefield", "2026-07-01T14:40:00+05:30", "medium", 61, "Open", "Business park area", "Repeat modus operandi found across nearby stations."),
    incident(7, [77.4848, 12.9177], "Burglary", "Bengaluru City", "Kengeri", "2026-06-18T02:10:00+05:30", "critical", 88, "Charge Sheet Filed", "Kengeri residential lane", "Night entry through rear window."),
    incident(8, [77.5016, 12.9268], "Burglary", "Bengaluru City", "Kengeri", "2026-06-28T03:05:00+05:30", "high", 78, "Under Investigation", "Satellite bus stop residential area", "Burglary cluster detected at night."),
    incident(9, [77.5761, 13.0108], "Robbery", "Bengaluru City", "Malleswaram", "2026-06-30T22:25:00+05:30", "critical", 84, "Open", "Malleswaram market edge", "Area requires review for late-night patrol patterns."),
    incident(10, [77.551, 12.925], "Assault", "Bengaluru City", "Basavanagudi", "2026-06-11T19:30:00+05:30", "medium", 50, "Under Investigation", "Basavanagudi market street", "Dispute escalated near crowded market area."),
    incident(11, [76.6532, 12.3094], "Assault", "Mysuru", "Devaraja", "2026-06-11T19:30:00+05:30", "medium", 47, "Under Investigation", "Devaraja Market area"),
    incident(12, [76.6651, 12.3051], "Missing Person", "Mysuru", "Nazarbad", "2026-05-29T18:15:00+05:30", "high", 67, "Open", "Nazarbad transit point", "Area-level review requested; no personal details exposed."),
    incident(13, [76.6333, 12.3211], "Vehicle Theft", "Mysuru", "Vijayanagar", "2026-07-03T21:00:00+05:30", "medium", 59, "Open", "Vijayanagar parking lane"),
    incident(14, [74.8411, 12.8846], "Cyber Fraud", "Mangaluru", "Barke", "2026-04-09T11:25:00+05:30", "medium", 54, "Charge Sheet Filed", "Commercial office block"),
    incident(15, [74.856, 12.8698], "Narcotics", "Mangaluru", "Pandeshwar", "2026-06-25T23:50:00+05:30", "critical", 91, "Under Investigation", "Pandeshwar checkpoint", "Late-night movement pattern detected."),
    incident(16, [74.835, 12.912], "Robbery", "Mangaluru", "Kadri", "2026-07-02T21:45:00+05:30", "high", 73, "Open", "Kadri commercial road"),
    incident(17, [75.124, 15.3647], "Vehicle Theft", "Hubballi-Dharwad", "Vidyanagar", "2026-06-29T20:55:00+05:30", "medium", 63, "Open", "Vidyanagar retail premises"),
    incident(18, [75.1189, 15.371], "Vehicle Theft", "Hubballi-Dharwad", "Vidyanagar", "2026-07-03T19:35:00+05:30", "medium", 65, "Open", "Vidyanagar market lane"),
    incident(19, [75.101, 15.348], "Burglary", "Hubballi-Dharwad", "Gokul Road", "2026-06-16T02:35:00+05:30", "high", 75, "Under Investigation", "Gokul Road residential cluster"),
    incident(20, [74.5123, 15.8584], "Narcotics", "Belagavi", "Camp", "2026-05-17T23:45:00+05:30", "critical", 92, "Under Investigation", "Camp highway checkpoint"),
    incident(21, [74.506, 15.847], "Narcotics", "Belagavi", "Camp", "2026-06-20T22:50:00+05:30", "high", 80, "Open", "Camp outer road"),
    incident(22, [74.498, 15.856], "Robbery", "Belagavi", "Market", "2026-07-06T20:15:00+05:30", "high", 72, "Open", "Belagavi market road"),
    incident(23, [76.8343, 17.3297], "Assault", "Kalaburagi", "Station Bazar", "2026-04-22T09:15:00+05:30", "low", 28, "Closed", "Station Bazar junction"),
    incident(24, [76.821, 17.345], "Vehicle Theft", "Kalaburagi", "Brahmapur", "2026-06-22T18:40:00+05:30", "medium", 52, "Open", "Brahmapur parking stretch"),
    incident(25, [76.848, 17.314], "Cyber Fraud", "Kalaburagi", "Farhatabad", "2026-06-30T13:20:00+05:30", "medium", 48, "Under Investigation", "Farhatabad commercial block"),
  ],
};

export const MOCK_POLICE_BOUNDARIES: PoliceBoundaryFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [[[77.55, 12.92], [77.66, 12.92], [77.66, 13.02], [77.55, 13.02], [77.55, 12.92]]] },
      properties: { id: "BD-BLR-CEN", district: "Bengaluru City", policeStation: "Central Bengaluru Area" },
    },
    {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [[[77.69, 12.93], [77.79, 12.93], [77.79, 13.03], [77.69, 13.03], [77.69, 12.93]]] },
      properties: { id: "BD-BLR-WFD", district: "Bengaluru City", policeStation: "Whitefield Area" },
    },
    {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [[[76.61, 12.28], [76.69, 12.28], [76.69, 12.34], [76.61, 12.34], [76.61, 12.28]]] },
      properties: { id: "BD-MYS", district: "Mysuru", policeStation: "Mysuru Core Area" },
    },
  ],
};

export const MOCK_PATTERN_ALERTS: PatternAlert[] = [
  {
    id: "ALERT-001",
    title: "Vehicle theft spike in central Bengaluru",
    description: "Spike observed in evening vehicle theft reports around commercial parking areas. Area requires review.",
    alertType: "spike",
    severity: "high",
    riskScore: 79,
    district: "Bengaluru City",
    policeStation: "Central Division",
    crimeType: "Vehicle Theft",
    relatedIncidentCount: 4,
    createdAt: "2026-07-08T09:30:00+05:30",
  },
  {
    id: "ALERT-002",
    title: "Burglary cluster detected at night",
    description: "Pattern detected across nearby residential lanes after midnight. Suggested operational review for night patrol timing.",
    alertType: "cluster",
    severity: "critical",
    riskScore: 86,
    district: "Bengaluru City",
    policeStation: "Kengeri",
    crimeType: "Burglary",
    relatedIncidentCount: 2,
    createdAt: "2026-07-08T09:35:00+05:30",
  },
  {
    id: "ALERT-003",
    title: "Cyber fraud increase over last 30 days",
    description: "Similar cases found involving impersonation and payment links. Area-level analysis only; no individual behavior prediction.",
    alertType: "trend",
    severity: "medium",
    riskScore: 61,
    district: "Bengaluru City",
    policeStation: "Whitefield",
    crimeType: "Cyber Fraud",
    relatedIncidentCount: 3,
    createdAt: "2026-07-08T09:40:00+05:30",
  },
];
