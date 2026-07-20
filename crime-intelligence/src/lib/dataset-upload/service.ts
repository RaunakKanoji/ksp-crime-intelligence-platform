import { type DatasetUploadJob, type ValidationErrorItem, type SchemaValidationResult } from "./types";

declare global {
  var _datasetJobs: DatasetUploadJob[] | undefined;
}

const INITIAL_JOBS: DatasetUploadJob[] = [
  {
    id: "JOB-003",
    fileName: "blr_crimes_2026_q2.csv",
    fileSize: "14.2 KB",
    rowCount: 140,
    status: "Completed",
    errorsCount: 0,
    createdTime: "2026-07-09T06:50:00Z",
    uploadedBy: "admin@ksp.gov.in",
    recordsProcessed: 140,
    recordsFailed: 0,
    validationPassed: true,
    hasErrorsFile: false,
  },
  {
    id: "JOB-002",
    fileName: "mysore_theft_data.xlsx",
    fileSize: "8.5 KB",
    rowCount: 85,
    status: "Completed",
    errorsCount: 2,
    createdTime: "2026-07-06T11:15:30Z",
    uploadedBy: "ali.inv@ksp.gov.in",
    recordsProcessed: 83,
    recordsFailed: 2,
    validationPassed: true,
    hasErrorsFile: true,
  },
  {
    id: "JOB-001",
    fileName: "invalid_schema_sample.csv",
    fileSize: "2.1 KB",
    rowCount: 20,
    status: "Failed",
    errorsCount: 5,
    createdTime: "2026-07-04T15:22:10Z",
    uploadedBy: "gowda.ana@ksp.gov.in",
    recordsProcessed: 0,
    recordsFailed: 20,
    validationPassed: false,
    hasErrorsFile: true,
  },
];

export function getUploadJobs(): DatasetUploadJob[] {
  if (!global._datasetJobs) {
    global._datasetJobs = [...INITIAL_JOBS];
  }
  return global._datasetJobs;
}

const REQUIRED_HEADERS = [
  "FIR Number",
  "Incident Date/Time",
  "Crime Category",
  "District",
  "Police Station",
  "Case Status",
  "Accused Name",
  "Victim Name",
  "Risk Score",
];

export function validateDatasetFile(fileName: string, content: string): SchemaValidationResult {
  const errors: ValidationErrorItem[] = [];
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return {
      valid: false,
      rowCount: 0,
      detectedHeaders: [],
      errors: [{ row: 0, column: "File Structure", message: "The uploaded file is empty." }],
    };
  }

  // Parse headers
  const detectedHeaders = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim());

  // Check column headers presence
  REQUIRED_HEADERS.forEach((req) => {
    if (!detectedHeaders.some((det) => det.toLowerCase() === req.toLowerCase())) {
      errors.push({
        row: 1,
        column: req,
        message: `Missing required schema column: "${req}".`,
      });
    }
  });

  const rowCount = lines.length - 1;

  // Row by row validations (simulate checking first 10 rows for schema structure)
  for (let i = 1; i <= Math.min(rowCount, 10); i++) {
    const rowCells = lines[i].split(",").map((c) => c.replace(/^["']|["']$/g, "").trim());
    
    if (rowCells.length !== detectedHeaders.length) {
      errors.push({
        row: i + 1,
        column: "Column Count",
        message: `Line cell count mismatch. Expected ${detectedHeaders.length} columns, found ${rowCells.length}.`,
      });
      continue;
    }

    // Risk score numeric check
    const riskIdx = detectedHeaders.findIndex((h) => h.toLowerCase() === "risk score");
    if (riskIdx !== -1) {
      const riskVal = parseFloat(rowCells[riskIdx]);
      if (isNaN(riskVal) || riskVal < 0 || riskVal > 100) {
        errors.push({
          row: i + 1,
          column: "Risk Score",
          message: `Invalid risk score "${rowCells[riskIdx]}". Must be a number between 0 and 100.`,
        });
      }
    }

    // FIR number check
    const firIdx = detectedHeaders.findIndex((h) => h.toLowerCase() === "fir number");
    if (firIdx !== -1 && !rowCells[firIdx]) {
      errors.push({
        row: i + 1,
        column: "FIR Number",
        message: "FIR Identifier key cannot be empty.",
      });
    }

    // Date/Time check
    const dateIdx = detectedHeaders.findIndex((h) => h.toLowerCase() === "incident date/time");
    if (dateIdx !== -1 && rowCells[dateIdx]) {
      const isTimestamp = !isNaN(Date.parse(rowCells[dateIdx]));
      if (!isTimestamp) {
        errors.push({
          row: i + 1,
          column: "Incident Date/Time",
          message: `Invalid date format "${rowCells[dateIdx]}". Use YYYY-MM-DD format.`,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    rowCount,
    detectedHeaders,
    errors,
  };
}

export function startImportJob(fileName: string, sizeText: string, rowCount: number): DatasetUploadJob {
  const jobs = getUploadJobs();
  const nextId = `JOB-${String(jobs.length + 1).padStart(3, "0")}`;
  
  const newJob: DatasetUploadJob = {
    id: nextId,
    fileName,
    fileSize: sizeText,
    rowCount,
    status: "Queued",
    errorsCount: 0,
    createdTime: new Date().toISOString(),
    uploadedBy: "admin@ksp.gov.in",
    recordsProcessed: rowCount,
    recordsFailed: 0,
    validationPassed: true,
    hasErrorsFile: false,
  };

  jobs.unshift(newJob);

  // Trigger simulated status updates
  simulateJobProgression(newJob.id);

  return newJob;
}

function simulateJobProgression(jobId: string) {
  const jobs = getUploadJobs();
  const logTransition = (status: string) => {
    if (process.env.KSP_DEBUG_JOBS === "true") {
      console.info(`[JOB] ${jobId} status transitioned to ${status}`);
    }
  };
  
  setTimeout(() => {
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      job.status = "Validating";
      logTransition("Validating");
    }
  }, 1500);

  setTimeout(() => {
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      job.status = "Importing";
      logTransition("Importing");
    }
  }, 3500);

  setTimeout(() => {
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      job.status = "Completed";
      logTransition("Completed");
    }
  }, 5500);
}

export function getDetailedValidationReport(fileName: string): any {
  const isMysore = fileName.toLowerCase().includes("mysore") || fileName.toLowerCase().includes("xlsx");
  const isFailedSample = fileName.toLowerCase().includes("invalid") || fileName.toLowerCase().includes("failed");

  if (isFailedSample) {
    return {
      fileName,
      rowCount: 20,
      requiredColumnsChecked: [
        { name: "FIR Number", present: true },
        { name: "Incident Date/Time", present: true },
        { name: "Crime Category", present: true },
        { name: "District", present: false },
        { name: "Police Station", present: false },
        { name: "Case Status", present: true },
        { name: "Accused Name", present: true },
        { name: "Victim Name", present: true },
        { name: "Risk Score", present: true },
      ],
      dataTypeChecked: [
        { columnName: "FIR Number", type: "Text", passedCount: 20 },
        { columnName: "Risk Score", type: "Number", passedCount: 15 },
      ],
      dateParsedCount: 18,
      duplicateFirNumbers: ["KSP/2026/BLR/900", "KSP/2026/BLR/901"],
      missingValueCounts: {
        "District": 20,
        "Police Station": 20,
        "Victim Name": 5,
      },
      invalidLocations: [
        { row: 4, station: "Unknown", district: "Missing", reason: "Required location structure is missing." }
      ],
      legalSectionSummary: { passed: 10, failed: 10, invalidSampleCodes: ["IPC-UNKNOWN"] },
      previewRows: []
    };
  }

  if (isMysore) {
    return {
      fileName,
      rowCount: 85,
      requiredColumnsChecked: REQUIRED_HEADERS.map((h) => ({ name: h, present: true })),
      dataTypeChecked: [
        { columnName: "FIR Number", type: "Text", passedCount: 85 },
        { columnName: "Incident Date/Time", type: "Timestamp", passedCount: 85 },
        { columnName: "Crime Category", type: "Text", passedCount: 85 },
        { columnName: "District", type: "Text", passedCount: 85 },
        { columnName: "Police Station", type: "Text", passedCount: 85 },
        { columnName: "Case Status", type: "Text", passedCount: 85 },
        { columnName: "Accused Name", type: "Text", passedCount: 85 },
        { columnName: "Victim Name", type: "Text", passedCount: 83 },
        { columnName: "Risk Score", type: "Number", passedCount: 83 },
      ],
      dateParsedCount: 85,
      duplicateFirNumbers: ["KSP/2026/MYS/004"],
      missingValueCounts: {
        "FIR Number": 0,
        "Incident Date/Time": 0,
        "Crime Category": 0,
        "District": 0,
        "Police Station": 0,
        "Case Status": 0,
        "Accused Name": 0,
        "Victim Name": 2,
        "Risk Score": 0,
      },
      invalidLocations: [
        {
          row: 15,
          station: "Indiranagar PS",
          district: "Mysuru City",
          reason: "Selected station boundary belongs to Bengaluru City, not Mysuru City.",
        },
      ],
      legalSectionSummary: {
        passed: 83,
        failed: 2,
        invalidSampleCodes: ["IPC-999Z", "IPC-000A"],
      },
      previewRows: [
        {
          firNumber: "KSP/2026/MYS/015",
          incidentDateTime: "2026-07-06 09:20",
          crimeCategory: "Burglary",
          district: "Mysuru City",
          policeStation: "K.R. Puram PS",
          caseStatus: "Arrested",
          accusedName: "Harish Naik",
          victimName: "Anitha R.",
          riskScore: 74,
        },
        {
          firNumber: "KSP/2026/MYS/016",
          incidentDateTime: "2026-07-06 10:15",
          crimeCategory: "Vehicle Theft",
          district: "Mysuru City",
          policeStation: "Devaraja PS",
          caseStatus: "Investigation",
          accusedName: "Mohan Lal",
          victimName: "Srinivas K.",
          riskScore: 45,
        },
        {
          firNumber: "KSP/2026/MYS/017",
          incidentDateTime: "2026-07-07 14:30",
          crimeCategory: "Assault",
          district: "Mysuru City",
          policeStation: "Mandi PS",
          caseStatus: "Arrested",
          accusedName: "Vikram R.",
          victimName: "Jayanth M.",
          riskScore: 61,
        },
        {
          firNumber: "KSP/2026/MYS/018",
          incidentDateTime: "2026-07-08 17:05",
          crimeCategory: "Burglary",
          district: "Mysuru City",
          policeStation: "Nazarbad PS",
          caseStatus: "Investigation",
          accusedName: "Prakash Gowda",
          victimName: "Nirupama S.",
          riskScore: 68,
        },
        {
          firNumber: "KSP/2026/MYS/019",
          incidentDateTime: "2026-07-09 11:40",
          crimeCategory: "Vehicle Theft",
          district: "Mysuru City",
          policeStation: "K.R. Puram PS",
          caseStatus: "Arrested",
          accusedName: "Lokesh M.",
          victimName: "Rakesh H.",
          riskScore: 50,
        },
      ],
    };
  }

  // Default: blr_crimes_2026_q2.csv / Clean csv
  return {
    fileName,
    rowCount: 140,
    requiredColumnsChecked: REQUIRED_HEADERS.map((h) => ({ name: h, present: true })),
    dataTypeChecked: REQUIRED_HEADERS.map((h) => ({
      columnName: h,
      type: h === "Risk Score" ? "Number" : "Text",
      passedCount: 140,
    })),
    dateParsedCount: 140,
    duplicateFirNumbers: [],
    missingValueCounts: {
      "FIR Number": 0,
      "Incident Date/Time": 0,
      "Crime Category": 0,
      "District": 0,
      "Police Station": 0,
      "Case Status": 0,
      "Accused Name": 0,
      "Victim Name": 0,
      "Risk Score": 0,
    },
    invalidLocations: [],
    legalSectionSummary: {
      passed: 140,
      failed: 0,
      invalidSampleCodes: [],
    },
    previewRows: [
      {
        firNumber: "KSP/2026/BLR/012",
        incidentDateTime: "2026-07-08 14:35",
        crimeCategory: "Vehicle Theft",
        district: "Bengaluru City",
        policeStation: "Indiranagar PS",
        caseStatus: "Investigation",
        accusedName: "Ramesh Kumar",
        victimName: "Sandeep J.",
        riskScore: 82,
      },
      {
        firNumber: "KSP/2026/BLR/013",
        incidentDateTime: "2026-07-08 16:40",
        crimeCategory: "Burglary",
        district: "Bengaluru City",
        policeStation: "Koramangala PS",
        caseStatus: "Arrested",
        accusedName: "Mohammed Farooq",
        victimName: "Aswath Gowda",
        riskScore: 78,
      },
      {
        firNumber: "KSP/2026/BLR/014",
        incidentDateTime: "2026-07-09 11:20",
        crimeCategory: "Assault",
        district: "Bengaluru City",
        policeStation: "Jayanagar PS",
        caseStatus: "Arrested",
        accusedName: "Suresh Gowda",
        victimName: "Praveen Lal",
        riskScore: 64,
      },
      {
        firNumber: "KSP/2026/BLR/015",
        incidentDateTime: "2026-07-09 13:10",
        crimeCategory: "Vehicle Theft",
        district: "Bengaluru City",
        policeStation: "Whitefield PS",
        caseStatus: "Investigation",
        accusedName: "Anand Murthy",
        victimName: "Karthik R.",
        riskScore: 49,
      },
      {
        firNumber: "KSP/2026/BLR/016",
        incidentDateTime: "2026-07-09 15:45",
        crimeCategory: "Burglary",
        district: "Bengaluru City",
        policeStation: "HSR Layout PS",
        caseStatus: "Investigation",
        accusedName: "Kumar Swamy",
        victimName: "Latha M.",
        riskScore: 71,
      },
    ],
  };
}
