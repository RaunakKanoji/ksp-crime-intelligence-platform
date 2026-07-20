'use strict';

const { URL } = require("url");
const catalyst = require("zcatalyst-sdk-node");

const FIR_TABLE = "FIRs";
const FIR_ALLOWED_FIELDS = [
  "fir_number",
  "crime_type",
  "district",
  "fir_date",
  "accused",
  "victim",
  "description",
  "police_station",
  "reported_date",
  "crime_category",
  "act",
  "section",
  "case_status",
  "sensitive_note",
];
const FIR_REQUIRED_FIELDS = ["fir_number", "crime_type", "district", "fir_date", "description"];

const rolesWithMapAccess = new Set(["Admin", "Investigator", "Analyst", "Officer"]);
const rolesWithIntel = new Set(["Admin", "Investigator"]);
const auditLog = [];

const incidents = [
  ["CM-001", "BLR-CEN-2026-0142", "Vehicle theft", "Theft", "2026-07-02T20:20:00+05:30", "Bengaluru City", "Central Division", "Commercial parking area, MG Road", 12.9759, 77.6068, "Under Investigation", "high"],
  ["CM-002", "BLR-CEN-2026-0147", "Vehicle theft", "Theft", "2026-07-04T21:10:00+05:30", "Bengaluru City", "Central Division", "Transit parking, Richmond Road", 12.9669, 77.5994, "Open", "high"],
  ["CM-003", "BLR-WFD-2026-0188", "UPI fraud", "Cybercrime", "2026-06-24T15:05:00+05:30", "Bengaluru City", "Whitefield", "IT corridor service road", 12.9698, 77.7499, "Open", "medium"],
  ["CM-004", "BLR-WFD-2026-0194", "Credential misuse", "Cybercrime", "2026-07-01T14:40:00+05:30", "Bengaluru City", "Whitefield", "Business park area", 12.9823, 77.7284, "Under Investigation", "medium"],
  ["CM-005", "BLR-KEN-2026-0117", "House break-in", "Property", "2026-06-18T02:10:00+05:30", "Bengaluru City", "Kengeri", "Residential lane near satellite bus stop", 12.9177, 77.4848, "Charge Sheet Filed", "critical"],
  ["CM-006", "MYS-DVR-2026-0064", "Assault", "Assault", "2026-06-11T19:30:00+05:30", "Mysuru", "Devaraja", "Market street", 12.3094, 76.6532, "Under Investigation", "medium"],
  ["CM-007", "MYS-NZR-2026-0079", "Harassment", "Women Safety", "2026-05-29T18:15:00+05:30", "Mysuru", "Nazarbad", "Transit point near bus stand", 12.3051, 76.6651, "Open", "high"],
  ["CM-008", "BLG-CMP-2026-0041", "Narcotics seizure", "Narcotics", "2026-05-17T23:45:00+05:30", "Belagavi", "Camp", "Highway checkpoint", 15.8584, 74.5123, "Under Investigation", "critical"],
  ["CM-009", "KLB-SBZ-2026-0033", "Rash driving", "Traffic", "2026-04-22T09:15:00+05:30", "Kalaburagi", "Station Bazar", "Main junction", 17.3297, 76.8343, "Closed", "low"],
  ["CM-010", "MNG-BRK-2026-0058", "Identity misuse", "Cybercrime", "2026-04-09T11:25:00+05:30", "Mangaluru", "Barke", "Commercial office block", 12.8846, 74.8411, "Charge Sheet Filed", "medium"],
  ["CM-011", "HBD-VID-2026-0092", "Mobile theft", "Theft", "2026-06-29T20:55:00+05:30", "Hubballi-Dharwad", "Vidyanagar", "Retail premises", 15.3647, 75.124, "Open", "medium"],
  ["CM-012", "HBD-VID-2026-0098", "Mobile theft", "Theft", "2026-07-03T19:35:00+05:30", "Hubballi-Dharwad", "Vidyanagar", "Market lane", 15.371, 75.1189, "Open", "medium"],
].map(([id, fir, type, category, date, district, station, address, lat, lon, status, severity]) => ({
  id, fir, type, category, date, district, station, address, lat, lon, status, severity,
}));

const boundaries = [
  ["BD-001", "Bengaluru City", "Central Division", [[77.57, 12.94], [77.64, 12.94], [77.64, 13.0], [77.57, 13.0], [77.57, 12.94]]],
  ["BD-002", "Bengaluru City", "Whitefield", [[77.69, 12.94], [77.78, 12.94], [77.78, 13.02], [77.69, 13.02], [77.69, 12.94]]],
  ["BD-003", "Mysuru", "Nazarbad", [[76.63, 12.28], [76.69, 12.28], [76.69, 12.33], [76.63, 12.33], [76.63, 12.28]]],
  ["BD-004", "Hubballi-Dharwad", "Vidyanagar", [[75.09, 15.34], [75.15, 15.34], [75.15, 15.39], [75.09, 15.39], [75.09, 15.34]]],
];

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function getRoutePath(url) {
  return url.pathname.replace(/^\/server\/ksp_crime_app_function(?=\/|$)/, "") || "/";
}

function getFirTable(req) {
  const catalystApp = catalyst.initialize(req);
  return catalystApp.datastore().table(FIR_TABLE);
}

function mapFirRow(row) {
  return {
    id: String(row.ROWID),
    firNumber: row.fir_number ?? "",
    crimeType: row.crime_type ?? "",
    district: row.district ?? "",
    firDate: row.fir_date ?? "",
    accused: row.accused ?? "",
    victim: row.victim ?? "",
    description: row.description ?? "",
    createdAt: row.CREATEDTIME ?? null,
    updatedAt: row.MODIFIEDTIME ?? null,
    policeStation: row.police_station ?? "",
    reportedDate: row.reported_date ?? row.fir_date ?? "",
    crimeCategory: row.crime_category ?? row.crime_type ?? "",
    act: row.act ?? "",
    section: row.section ?? "",
    caseStatus: row.case_status ?? "Open",
    sensitiveNote: row.sensitive_note ?? "",
  };
}

function getAllowedFirFields(input) {
  const source = input && typeof input === "object" ? input : {};
  return Object.fromEntries(
    FIR_ALLOWED_FIELDS
      .filter((field) => source[field] !== undefined)
      .map((field) => [field, source[field]])
  );
}

function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  if (typeof req.body === "string" && req.body.trim()) {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch {
      return Promise.reject(new Error("Invalid JSON body."));
    }
  }

  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body is too large."));
      }
    });
    req.on("end", () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

async function handleFirRoutes(req, res, url) {
  const routePath = getRoutePath(url);

  if (routePath === "/api/firs" && req.method === "GET") {
    try {
      const requestedLimit = Number(url.searchParams.get("limit") || 25);
      const maxRows = Math.min(Math.max(requestedLimit, 1), 100);
      const options = { maxRows };
      const nextToken = url.searchParams.get("nextToken");

      if (nextToken) {
        options.nextToken = nextToken;
      }

      const result = await getFirTable(req).getPagedRows(options);

      return send(res, 200, {
        data: (result.data || []).map(mapFirRow),
        nextToken: result.next_token || result.nextToken || null,
        hasMore: Boolean(result.more_records || result.moreRecords),
      });
    } catch (error) {
      console.error("Failed to list FIRs", error);
      return send(res, 500, {
        error: "DATABASE_READ_FAILED",
        message: "FIR records could not be loaded.",
      });
    }
  }

  const firDetailMatch = routePath.match(/^\/api\/firs\/([^/]+)$/);
  if (firDetailMatch && req.method === "GET") {
    try {
      const row = await getFirTable(req).getRow(firDetailMatch[1]);
      return send(res, 200, { data: mapFirRow(row) });
    } catch (error) {
      console.error("Failed to read FIR", error);
      return send(res, 404, {
        error: "FIR_NOT_FOUND",
        message: "The requested FIR could not be found.",
      });
    }
  }

  if (routePath === "/api/firs" && req.method === "POST") {
    try {
      const body = await readJsonBody(req);
      const rowData = getAllowedFirFields(body);
      const missingFields = FIR_REQUIRED_FIELDS.filter(
        (field) => rowData[field] === undefined || String(rowData[field]).trim().length === 0
      );

      if (missingFields.length > 0) {
        return send(res, 400, {
          error: "VALIDATION_FAILED",
          message: "Required FIR fields are missing.",
          fields: missingFields,
        });
      }

      const row = await getFirTable(req).insertRow(rowData);
      return send(res, 201, { data: mapFirRow(row) });
    } catch (error) {
      console.error("Failed to create FIR", error);
      return send(res, 500, {
        error: "DATABASE_WRITE_FAILED",
        message: "The FIR could not be created.",
      });
    }
  }

  if (firDetailMatch && req.method === "PATCH") {
    try {
      const body = await readJsonBody(req);
      const updates = getAllowedFirFields(body);
      const row = await getFirTable(req).updateRow({
        ...updates,
        ROWID: firDetailMatch[1],
      });

      return send(res, 200, { data: mapFirRow(row) });
    } catch (error) {
      console.error("Failed to update FIR", error);
      return send(res, 500, {
        error: "DATABASE_UPDATE_FAILED",
        message: "The FIR could not be updated.",
      });
    }
  }

  if (routePath === "/api/firs" || firDetailMatch) {
    return send(res, 405, {
      error: "METHOD_NOT_ALLOWED",
      message: "This FIR endpoint does not support the requested method.",
    });
  }

  return false;
}

function normalize(url) {
  const params = url.searchParams;
  return {
    role: params.get("role") || "Viewer",
    filters: {
      district: params.get("district") || "all",
      policeStation: params.get("policeStation") || "all",
      crimeType: params.get("crimeType") || "all",
      dateFrom: params.get("dateFrom") || "2026-06-01",
      dateTo: params.get("dateTo") || "2026-07-08",
      caseStatus: params.get("caseStatus") || "all",
      severity: params.get("severity") || "all",
      timeOfDay: params.get("timeOfDay") || "all",
      search: (params.get("search") || "").trim().slice(0, 80),
    },
  };
}

function hourBucket(dateTime) {
  const hour = new Date(dateTime).getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

function applyFilters(filters) {
  const q = filters.search.toLowerCase();
  return incidents.filter((item) => {
    const day = item.date.slice(0, 10);
    return (filters.district === "all" || item.district === filters.district)
      && (filters.policeStation === "all" || item.station === filters.policeStation)
      && (filters.crimeType === "all" || item.category === filters.crimeType)
      && (filters.caseStatus === "all" || item.status === filters.caseStatus)
      && (filters.severity === "all" || item.severity === filters.severity)
      && (filters.timeOfDay === "all" || hourBucket(item.date) === filters.timeOfDay)
      && day >= filters.dateFrom
      && day <= filters.dateTo
      && (!q || `${item.fir} ${item.type} ${item.district} ${item.station}`.toLowerCase().includes(q));
  });
}

function wrap(data, extra) {
  return {
    source: "mock",
    data,
    ...(extra || {}),
  };
}

function incidentFeatures(filters, role) {
  const features = applyFilters(filters).map((item) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: rolesWithIntel.has(role) ? [item.lon, item.lat] : [Number((item.lon + 0.006).toFixed(4)), Number((item.lat + 0.006).toFixed(4))],
    },
    properties: {
      id: item.id,
      firNumber: item.fir,
      crimeType: item.type,
      crimeCategory: item.category,
      incidentDateTime: item.date,
      district: item.district,
      policeStation: item.station,
      accuracyLevel: item.severity === "critical" ? "area" : "street",
      caseStatus: item.status,
      severity: item.severity,
      safeLocationLabel: rolesWithIntel.has(role) ? item.address : `${item.station} area`,
    },
  }));
  return { type: "FeatureCollection", features };
}

function hotspots(filters) {
  const groups = new Map();
  applyFilters(filters).forEach((item) => {
    const key = `${item.district}|${item.station}|${Math.floor(item.lat * 20)}|${Math.floor(item.lon * 20)}`;
    groups.set(key, [...(groups.get(key) || []), item]);
  });
  return Array.from(groups.entries()).filter((entry) => entry[1].length >= 2).map(([key, rows], index) => {
    const counts = {};
    rows.forEach((row) => { counts[row.category] = (counts[row.category] || 0) + 1; });
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    const previous = Math.max(1, Math.round(rows.length * (index % 2 === 0 ? 0.45 : 0.8)));
    const [district, station] = key.split("|");
    return {
      id: `HOT-${index + 1}`,
      district,
      policeStation: station,
      incidentCount: rows.length,
      previousIncidentCount: previous,
      dominantCrimeType: dominant,
      peakTimeWindow: "18:00-22:00",
      trend: rows.length > previous ? "up" : "flat",
      riskLevel: rows.some((row) => row.severity === "critical") ? "critical" : "high",
      severity: rows.some((row) => row.severity === "critical") ? "critical" : "high",
      riskScore: rows.some((row) => row.severity === "critical") ? 86 : 72,
      confidence: rows.length >= 4 ? "high" : rows.length >= 3 ? "medium" : "low",
      explanation: `Hotspot identified from ${rows.length} area-level incidents. Pattern detected for ${dominant.toLowerCase()} using frequency, severity, recent growth, time-window concentration, and repeat-pattern signals.`,
      scoringSignals: {
        frequencyScore: Math.min(100, rows.length * 25),
        severityScore: rows.some((row) => row.severity === "critical") ? 90 : 70,
        recentGrowthScore: rows.length >= 3 ? 80 : 50,
        timePatternScore: 60,
        repeatPatternScore: Math.min(100, rows.length * 20),
      },
      summary: `Hotspot identified: ${rows.length} incidents grouped in ${station}. Pattern detected around ${dominant.toLowerCase()} activity.`,
      radiusMeters: 850,
      center: [rows.reduce((sum, row) => sum + row.lon, 0) / rows.length, rows.reduce((sum, row) => sum + row.lat, 0) / rows.length],
    };
  });
}

function ranking(rows, hotspotRows, field) {
  return Array.from(new Set(rows.map((row) => row[field]))).map((name) => {
    const scoped = rows.filter((row) => row[field] === name);
    const stationSet = new Set(scoped.map((row) => row.station));
    const relatedHotspots = hotspotRows.filter((hotspot) => stationSet.has(hotspot.policeStation));
    const crimeCounts = {};
    scoped.forEach((row) => { crimeCounts[row.category] = (crimeCounts[row.category] || 0) + 1; });
    const dominantCrimeType = Object.entries(crimeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Mixed";
    const averageRiskScore = relatedHotspots.length
      ? Math.round(relatedHotspots.reduce((sum, hotspot) => sum + hotspot.riskScore, 0) / relatedHotspots.length)
      : 0;
    return {
      name,
      incidentCount: scoped.length,
      hotspotCount: relatedHotspots.length,
      dominantCrimeType,
      averageRiskScore,
      highestSeverity: scoped.some((row) => row.severity === "critical") ? "critical" : scoped.some((row) => row.severity === "high") ? "high" : "medium",
    };
  }).sort((a, b) => b.averageRiskScore - a.averageRiskScore || b.incidentCount - a.incidentCount).slice(0, 6);
}

function hotspotDetection(filters, hotspotRows) {
  const rows = applyFilters(filters);
  const windows = ["morning", "afternoon", "evening", "night"];
  const categories = Array.from(new Set(rows.map((row) => row.category)));
  return {
    scoringFormula: "riskScore = frequencyScore * 0.35 + severityScore * 0.25 + recentGrowthScore * 0.20 + timePatternScore * 0.10 + repeatPatternScore * 0.10",
    limitations: [
      "Scores describe area-level incident concentration and require human review.",
      "Mock/demo data is not operational evidence.",
      "The model does not predict individual criminal behavior or determine guilt.",
    ],
    humanReviewRequired: true,
    districtRankings: ranking(rows, hotspotRows, "district"),
    policeStationRankings: ranking(rows, hotspotRows, "station"),
    timeWindows: windows.map((window) => {
      const scoped = rows.filter((row) => hourBucket(row.date) === window);
      return { window, incidentCount: scoped.length, hotspotCount: 0, averageRiskScore: 0 };
    }),
    categoryHotspots: categories.map((crimeType) => {
      const scoped = rows.filter((row) => row.category === crimeType);
      const related = hotspotRows.filter((hotspot) => hotspot.dominantCrimeType === crimeType);
      return {
        crimeType,
        incidentCount: scoped.length,
        hotspotCount: related.length,
        averageRiskScore: related.length ? Math.round(related.reduce((sum, hotspot) => sum + hotspot.riskScore, 0) / related.length) : 0,
      };
    }).sort((a, b) => b.averageRiskScore - a.averageRiskScore || b.incidentCount - a.incidentCount).slice(0, 8),
  };
}

module.exports = async (req, res) => {
  const url = new URL(req.url, "https://ksp.local");
  const routePath = getRoutePath(url);
  const firRouteHandled = await handleFirRoutes(req, res, url);
  if (firRouteHandled !== false) return;

  const { role, filters } = normalize(url);
  if (!rolesWithMapAccess.has(role)) return send(res, 403, { error: "Restricted crime map access." });

  auditLog.push({ id: `MAP-AUDIT-${auditLog.length + 1}`, path: routePath, role, filters, created_at: new Date().toISOString() });

  if (routePath === "/api/map/incidents") return send(res, 200, wrap(incidentFeatures(filters, role)));
  if (routePath === "/api/map/hotspots") {
    const hotspotRows = hotspots(filters);
    const features = hotspotRows.map((h) => ({ type: "Feature", geometry: { type: "Point", coordinates: h.center }, properties: Object.fromEntries(Object.entries(h).filter(([k]) => k !== "center")) }));
    return send(res, 200, wrap({ type: "FeatureCollection", features }, {
      summary: {
        totalHotspots: features.length,
        criticalHotspots: features.filter((feature) => feature.properties.riskLevel === "critical").length,
        risingAreas: features.filter((feature) => feature.properties.trend === "up").length,
      },
      detection: hotspotDetection(filters, hotspotRows),
    }));
  }
  if (routePath === "/api/map/clusters") {
    return send(res, 200, wrap({ type: "FeatureCollection", features: hotspots(filters).map((h) => ({ type: "Feature", geometry: { type: "Point", coordinates: h.center }, properties: { id: h.id.replace("HOT", "CLU"), incidentCount: h.incidentCount, dominantCrimeType: h.dominantCrimeType, district: h.district, policeStation: h.policeStation, severity: h.riskLevel } })) }));
  }
  if (routePath === "/api/map/timeline") {
    const counts = {};
    applyFilters(filters).forEach((item) => { counts[item.date.slice(0, 10)] = (counts[item.date.slice(0, 10)] || 0) + 1; });
    return send(res, 200, wrap(Object.entries(counts).sort().map(([label, incidentCount]) => ({ label, incidentCount }))));
  }
  if (routePath === "/api/map/pattern-alerts") {
    return send(res, 200, wrap(hotspots(filters).filter((h) => h.incidentCount >= h.previousIncidentCount * 1.5).map((h) => ({ id: `ALERT-${h.id}`, title: "Spike observed", description: `Spike observed in ${h.policeStation}: ${h.incidentCount} ${h.dominantCrimeType.toLowerCase()} incidents compared with ${h.previousIncidentCount} in the previous period.`, alertType: "spike", district: h.district, policeStation: h.policeStation, crimeType: h.dominantCrimeType, severity: h.riskLevel, riskScore: h.riskLevel === "critical" ? 86 : 72, relatedIncidentCount: h.incidentCount, createdAt: "2026-07-08T09:15:00+05:30" }))));
  }
  if (routePath === "/api/map/boundaries") {
    const features = boundaries
      .filter(([, district, station]) => (filters.district === "all" || district === filters.district) && (filters.policeStation === "all" || station === filters.policeStation))
      .map(([id, district, station, polygon]) => ({ type: "Feature", geometry: { type: "Polygon", coordinates: [polygon] }, properties: { id, district, policeStation: station } }));
    return send(res, 200, wrap({ type: "FeatureCollection", features }));
  }
  if (routePath.startsWith("/api/map/case/")) {
    const id = routePath.split("/").pop();
    const item = incidents.find((row) => row.id === id);
    if (!item) return send(res, 404, wrap(null));
    return send(res, 200, wrap({
      id: item.id,
      firNumber: item.fir,
      crimeType: item.type,
      crimeCategory: item.category,
      incidentDateTime: item.date,
      reportedDateTime: item.date,
      district: item.district,
      policeStation: item.station,
      safeLocationLabel: rolesWithIntel.has(role) ? item.address : `${item.station} area`,
      accuracyLevel: item.severity === "critical" ? "area" : "street",
      caseStatus: item.status,
      sections: [item.category === "Cybercrime" ? "IT Act 66C/66D" : "IPC/BNS mapped section"],
      severity: item.severity,
      propertyLossValue: null,
      weaponUsed: null,
      modusOperandi: rolesWithIntel.has(role) ? "Pattern detected from area-level incident attributes." : null,
    }));
  }

  return send(res, 404, { error: "Route not found." });
};
