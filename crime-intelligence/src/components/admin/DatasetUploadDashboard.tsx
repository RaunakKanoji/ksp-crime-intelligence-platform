"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { type DatasetUploadJob, type SchemaValidationResult } from "@/lib/dataset-upload/types";
import { fetchUploadJobs, validateDataset, startImport } from "@/lib/dataset-upload/api";

const cardClass = "rounded-lg border border-slate-200 bg-white p-5 shadow-sm";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5";
const selectClass =
  "h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-teal-600 transition-colors w-full";

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

export function DatasetUploadDashboard() {
  return (
    <AppShell
      title="Dataset Upload"
      description="Import and map external crime intelligence CSV lists into the platform."
      requiredPermission="page:dataset-upload"
    >
      <DatasetUploadContent />
    </AppShell>
  );
}

function DatasetUploadContent() {
  const { activeRole } = useAppSession();

  const [jobs, setJobs] = useState<DatasetUploadJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Upload wizard states
  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState("");
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validationReport, setValidationReport] = useState<SchemaValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);

  // Fetch list of import jobs
  const loadJobs = useCallback(async () => {
    try {
      const res = await fetchUploadJobs(activeRole);
      setJobs(res);
    } catch (err) {
      console.error("Failed to load jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [activeRole]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Polling effect: if any job is not Completed or Failed, poll every 2 seconds to show real-time progress transitions
  useEffect(() => {
    const hasActiveJob = jobs.some((j) => j.status !== "Completed" && j.status !== "Failed");
    if (!hasActiveJob) return;

    const timer = setInterval(() => {
      loadJobs();
    }, 2000);

    return () => clearInterval(timer);
  }, [jobs, loadJobs]);

  // Handle local CSV parser
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError(null);
    setSuccess(null);
    setValidationReport(null);
    setFile(selected);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileText(text);
      
      // Auto-extract header row
      const firstLine = text.split(/\r?\n/)[0] || "";
      const headers = firstLine.split(",").map((h) => h.replace(/^["']|["']$/g, "").trim());
      setDetectedHeaders(headers);

      // Auto-match mapping defaults (fuzzy matching)
      const initialMap: Record<string, string> = {};
      REQUIRED_HEADERS.forEach((req) => {
        const match = headers.find((h) => h.toLowerCase() === req.toLowerCase());
        initialMap[req] = match || "";
      });
      setMapping(initialMap);
    };
    reader.readAsText(selected);
  };

  const handleMappingChange = (target: string, value: string) => {
    setMapping((prev) => ({ ...prev, [target]: value }));
  };

  const handleValidateSchema = async () => {
    if (!file || !fileText) return;
    try {
      setValidating(true);
      setError(null);
      
      // Construct a mapped CSV string using user selections if manual mapping differs
      let parsedContent = fileText;
      const needRebuilding = Object.entries(mapping).some(([req, mapped]) => req !== mapped && mapped !== "");
      
      if (needRebuilding) {
        const lines = fileText.split(/\r?\n/).filter((l) => l.trim().length > 0);
        const originalHeaders = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim());
        
        // Re-construct line headers with standard required keys based on mappings
        const headerRow = originalHeaders.map((oh) => {
          const matchEntry = Object.entries(mapping).find(([_, mapped]) => mapped === oh);
          return matchEntry ? matchEntry[0] : oh;
        }).join(",");
        
        parsedContent = [headerRow, ...lines.slice(1)].join("\n");
      }

      const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
      const result = await validateDataset(parsedContent, file.name, sizeStr, activeRole);
      setValidationReport(result);
    } catch (err: any) {
      setError(err.message || "Schema validation failed.");
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!file || !validationReport) return;
    try {
      setImporting(true);
      setError(null);
      const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
      
      await startImport(file.name, sizeStr, validationReport.rowCount, activeRole);
      setSuccess(`Dataset import job scheduled successfully for file "${file.name}".`);
      
      // Reset wizard
      setFile(null);
      setFileText("");
      setDetectedHeaders([]);
      setMapping({});
      setValidationReport(null);
      
      loadJobs();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to trigger dataset import.");
    } finally {
      setImporting(false);
    }
  };

  const getStatusPercentage = (status: DatasetUploadJob["status"]) => {
    switch (status) {
      case "Queued":
        return 25;
      case "Validating":
        return 50;
      case "Importing":
        return 75;
      case "Completed":
        return 100;
      default:
        return 0;
    }
  };

  const getStatusColor = (status: DatasetUploadJob["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-500";
      case "Failed":
        return "bg-red-500";
      default:
        return "bg-teal-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Policy Warning Card */}
      <section className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-900">
        <span className="text-xl">⚠️</span>
        <div className="text-xs leading-relaxed">
          <strong className="block font-bold mb-1 uppercase tracking-wide">Data Governance Advisory</strong>
          Importing datasets updates the central crime patterns and risk scoring pools dynamically. Ensure data files are scrubbed of unverified, draft metadata before committing.
        </div>
      </section>

      {success && (
        <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 text-xs font-semibold text-emerald-800">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-xs font-semibold text-red-800">
          {error}
        </div>
      )}

      {/* Upload Wizard Card */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={cardClass}>
            <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              1. Import & Schema Validation Wizard
            </h2>
            
            <div className="space-y-5">
              {/* File Select */}
              <div className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-lg p-6 text-center cursor-pointer transition-colors relative bg-slate-50/50">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-slate-700">
                    {file ? `✓ Selected: ${file.name}` : "Click to select or drop CSV dataset file"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {file ? `${(file.size / 1024).toFixed(1)} KB` : "Support formatted CSV sheets up to 10MB"}
                  </p>
                </div>
              </div>

              {/* Header Schema Mapping Grid */}
              {file && detectedHeaders.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 mb-1">Align Column Headings</h3>
                    <p className="text-[10px] text-slate-400">
                      Map standard platform variables to matching columns from your imported file.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {REQUIRED_HEADERS.map((req) => (
                      <div key={req} className="space-y-1">
                        <span className={labelClass}>{req}</span>
                        <select
                          value={mapping[req]}
                          onChange={(e) => handleMappingChange(req, e.target.value)}
                          className={selectClass}
                        >
                          <option value="">-- Ignore / Unmapped --</option>
                          {detectedHeaders.map((dh) => (
                            <option key={dh} value={dh}>
                              {dh}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={handleValidateSchema}
                      disabled={validating}
                      className="h-9 px-4 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 text-xs transition-colors flex items-center gap-1.5"
                    >
                      {validating && (
                        <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                      )}
                      Validate Schema Mapping
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Validation Results Report */}
          {validationReport && (
            <div className={`${cardClass} animate-in fade-in slide-in-from-top-4 duration-300`}>
              <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                2. Validation Assessment Report
              </h2>

              <div className="space-y-4">
                {validationReport.valid ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-lg flex gap-3 text-xs leading-relaxed">
                    <span className="text-base">✓</span>
                    <div>
                      <strong className="block font-bold mb-0.5">Schema Verified</strong>
                      Successfully validated {validationReport.rowCount} records. No structural anomalies or empty identifiers detected.
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 text-red-950 p-4 rounded-lg flex gap-3 text-xs leading-relaxed">
                    <span className="text-base">⚠️</span>
                    <div>
                      <strong className="block font-bold mb-0.5">Validation Anomalies Detected</strong>
                      Found {validationReport.errors.length} formatting errors in the first few rows of your file. Fix mapping alignment or source cells.
                    </div>
                  </div>
                )}

                {/* Errors list */}
                {validationReport.errors.length > 0 && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[10px] uppercase">
                          <th className="py-2.5 px-3 w-16">Row</th>
                          <th className="py-2.5 px-3 w-28">Column</th>
                          <th className="py-2.5 px-3">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                        {validationReport.errors.map((err, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-500">{err.row}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-800">{err.column}</td>
                            <td className="py-2.5 px-3 text-red-700 font-medium">{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Import Confirmation Trigger */}
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={importing || !validationReport.valid}
                    className="h-9 px-5 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 text-xs transition-colors flex items-center gap-1.5"
                  >
                    {importing && (
                      <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                    )}
                    Confirm Import to Database
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel: Upload Queue Status Monitor */}
        <div className="space-y-6">
          <div className={cardClass}>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              Active Import Job Queue
            </h3>

            {loading ? (
              <div className="space-y-3 py-6" aria-label="Loading upload jobs">
                <div className="h-10 bg-slate-50 rounded animate-pulse" />
                <div className="h-10 bg-slate-50 rounded animate-pulse" />
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-[10px] text-slate-400 text-center py-10">No upload history found.</p>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => {
                  const percent = getStatusPercentage(job.status);
                  const isProcessing = job.status !== "Completed" && job.status !== "Failed";
                  return (
                    <div key={job.id} className="border border-slate-100 rounded-lg p-3 space-y-2 bg-slate-50/50">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-800 truncate">{job.fileName}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {job.fileSize} • {job.rowCount} records • {new Date(job.createdTime).toLocaleTimeString("en-IN")}
                          </p>
                        </div>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border ${
                            job.status === "Completed"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : job.status === "Failed"
                              ? "bg-red-50 border-red-200 text-red-800"
                              : "bg-teal-50 border-teal-200 text-teal-800 animate-pulse"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>

                      {/* Progress bar line indicators */}
                      {isProcessing && (
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${getStatusColor(job.status)} transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      )}

                      {job.errorsCount > 0 && (
                        <p className="text-[9px] text-red-600 font-semibold">
                          ⚠️ Integrated with {job.errorsCount} schema warnings.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
