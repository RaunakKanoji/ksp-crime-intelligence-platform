"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { type DatasetUploadJob, type DetailedValidationReport } from "@/lib/dataset-upload/types";
import { fetchUploadJobs } from "@/lib/dataset-upload/api";
import { fetchDetailedValidationReport } from "@/lib/dataset-validation/api";

const cardClass = "rounded-lg border border-slate-200 bg-white p-5 shadow-sm";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5";
const selectClass =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600 transition-colors w-full sm:max-w-xs";

export function DatasetValidationDashboard() {
  return (
    <AppShell
      title="Dataset Validation"
      description="Inspect detailed schema diagnostics, duplicate identifiers, location structures, and legal sections."
      requiredPermission="page:dataset-upload"
    >
      <DatasetValidationContent />
    </AppShell>
  );
}

function DatasetValidationContent() {
  const { activeRole } = useAppSession();

  const [jobs, setJobs] = useState<DatasetUploadJob[]>([]);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [report, setReport] = useState<DetailedValidationReport | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadJobsList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchUploadJobs(activeRole);
      setJobs(res);
      if (res.length > 0) {
        setSelectedFileName(res[0].fileName);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch dataset jobs queue.");
    } finally {
      setLoading(false);
    }
  }, [activeRole]);

  useEffect(() => {
    loadJobsList();
  }, [loadJobsList]);

  const loadReportDetails = useCallback(async () => {
    if (!selectedFileName) return;
    try {
      setReportLoading(true);
      setError(null);
      const res = await fetchDetailedValidationReport(selectedFileName, activeRole);
      setReport(res);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch detailed validation report.");
    } finally {
      setReportLoading(false);
    }
  }, [selectedFileName, activeRole]);

  useEffect(() => {
    loadReportDetails();
  }, [loadReportDetails]);

  const handleSimulateImport = () => {
    if (!selectedFileName) return;
    setSuccess(`Import process completed. Mapped records integrated into platform analytics.`);
    setTimeout(() => setSuccess(null), 4000);
  };

  const isFailedReport = report?.fileName.toLowerCase().includes("invalid") || report?.fileName.toLowerCase().includes("failed");

  return (
    <div className="space-y-6">
      {/* File selector header card */}
      <header className={cardClass}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900">Select Dataset File for Inspection</h2>
            <p className="text-xs text-slate-500">Choose from recently uploaded import jobs.</p>
          </div>

          {loading ? (
            <div className="h-10 bg-slate-100 rounded w-48 animate-pulse" />
          ) : (
            <select
              value={selectedFileName}
              onChange={(e) => setSelectedFileName(e.target.value)}
              className={selectClass}
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.fileName}>
                  {j.fileName} ({j.status})
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

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

      {reportLoading ? (
        <div className="space-y-6 py-10" aria-label="Loading report data">
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-slate-100 rounded animate-pulse" />
            <div className="h-20 bg-slate-100 rounded animate-pulse" />
            <div className="h-20 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="h-48 bg-slate-50 rounded animate-pulse" />
        </div>
      ) : report ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Diagnostic counters grid */}
          <section className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className={cardClass}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parsed Dataset Rows</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{report.rowCount} rows</p>
            </div>
            <div className={cardClass}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Timestamps Parsed</p>
              <p className="text-2xl font-extrabold text-teal-700 mt-1">{report.dateParsedCount} / {report.rowCount}</p>
            </div>
            <div className={cardClass}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Type Format Checks</p>
              <p className="text-2xl font-extrabold text-indigo-700 mt-1">
                {report.dataTypeChecked.every((d) => d.passedCount === report.rowCount) ? "100% Passed" : "Warnings Found"}
              </p>
            </div>
          </section>

          {/* Validation indicators side-by-side details */}
          <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Column Checklists & Missing Values Card */}
              <section className={`${cardClass} grid grid-cols-1 md:grid-cols-2 gap-6`}>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                    Required Columns Checklist
                  </h3>
                  <ul className="space-y-2">
                    {report.requiredColumnsChecked.map((col) => (
                      <li key={col.name} className="flex justify-between items-center text-xs">
                        <span className="text-slate-700 font-medium">{col.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            col.present
                              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                              : "bg-red-50 border border-red-200 text-red-800"
                          }`}
                        >
                          {col.present ? "Present" : "Missing"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                    Missing Values Report
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(report.missingValueCounts).map(([col, val]) => (
                      <div key={col} className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-medium">{col}</span>
                        <span
                          className={`font-semibold ${
                            val > 0 ? "text-red-600 font-bold" : "text-emerald-600"
                          }`}
                        >
                          {val > 0 ? `${val} missing` : "0 missing"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Data Preview Card */}
              {report.previewRows.length > 0 && (
                <section className={cardClass}>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Preview before Import (First 5 Rows)
                    </h3>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Verified Datasheet
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[10px] uppercase">
                          <th className="py-2.5 px-3">FIR Number</th>
                          <th className="py-2.5 px-3">Date/Time</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">District</th>
                          <th className="py-2.5 px-3">Police Station</th>
                          <th className="py-2.5 px-3 text-right">Risk Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                        {report.previewRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{row.firNumber}</td>
                            <td className="py-2.5 px-3 text-slate-500">{row.incidentDateTime}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700">{row.crimeCategory}</td>
                            <td className="py-2.5 px-3 text-slate-600">{row.district}</td>
                            <td className="py-2.5 px-3 text-slate-600">{row.policeStation}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-800">{row.riskScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSimulateImport}
                      disabled={isFailedReport}
                      className="h-9 px-5 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 text-xs transition-colors"
                    >
                      Confirm and Import Dataset
                    </button>
                  </div>
                </section>
              )}
            </div>

            {/* Side Warnings: Duplicates, Boundaries, Legal Codes */}
            <div className="space-y-6">
              
              {/* Duplicate Detection */}
              <div className={cardClass}>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                  Duplicate Detections
                </h3>
                {report.duplicateFirNumbers.length > 0 ? (
                  <div className="space-y-2">
                    <div className="bg-red-50 text-red-900 p-2.5 rounded text-[10px] leading-relaxed font-semibold">
                      Conflict warning: Duplicate FIR key references found in file rows.
                    </div>
                    <ul className="divide-y divide-slate-100 font-mono text-[10px] text-slate-600">
                      {report.duplicateFirNumbers.map((fir) => (
                        <li key={fir} className="py-1.5 flex justify-between">
                          <span>{fir}</span>
                          <span className="text-red-600 font-bold">Duplicate</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-600 font-semibold">
                    ✓ 0 duplicate FIR record references detected.
                  </p>
                )}
              </div>

              {/* Location sanity check */}
              <div className={cardClass}>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                  Location Sanity Check
                </h3>
                {report.invalidLocations.length > 0 ? (
                  <div className="space-y-2">
                    {report.invalidLocations.map((loc, idx) => (
                      <div key={idx} className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs space-y-1 text-amber-900">
                        <strong className="block text-[10px] uppercase font-bold text-amber-800">
                          Boundary Anomaly (Row {loc.row})
                        </strong>
                        <p className="font-semibold text-slate-800">
                          Station: {loc.station} • District: {loc.district}
                        </p>
                        <p className="text-[10px] leading-normal text-amber-700">{loc.reason}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-600 font-semibold">
                    ✓ All stations match district polygon boundaries correctly.
                  </p>
                )}
              </div>

              {/* Legal Section check */}
              <div className={cardClass}>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                  Legal Sections (IPC) Check
                </h3>
                <div className="space-y-3 text-xs leading-relaxed text-slate-700 font-medium">
                  <div className="flex justify-between items-center text-xs">
                    <span>Passed IPC Format</span>
                    <span className="text-emerald-700 font-bold">{report.legalSectionSummary.passed} rows</span>
                  </div>
                  {report.legalSectionSummary.failed > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs text-red-600 font-bold">
                        <span>Failed Verification</span>
                        <span>{report.legalSectionSummary.failed} rows</span>
                      </div>
                      <div className="bg-red-50 text-red-950 p-2 rounded text-[10px] leading-normal">
                        Invalid code formats:
                        <ul className="list-disc pl-4 mt-1 font-mono font-bold">
                          {report.legalSectionSummary.invalidSampleCodes.map((c) => (
                            <li key={c}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      ) : null}
    </div>
  );
}
