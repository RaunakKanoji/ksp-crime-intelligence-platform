"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { Button, StateNotice, useToast } from "@/components/ui";
import {
  DEFAULT_REPORT_CONFIG,
  type ReportConfig,
  type ReportPreviewData,
  type ReportChartPoint,
  type ReportTableFir,
} from "@/lib/report-builder/types";
import { fetchReportPreview, downloadReportFile } from "@/lib/report-builder/api";

const cardClass = "rounded-lg border border-slate-200 bg-white p-5 shadow-sm";
const inputClass =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600 transition-colors w-full";
const labelClass = "flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 w-full";

type LoadState = "loading" | "ready" | "empty" | "error" | "validation-error";

const DISTRICTS = [
  "Bengaluru City",
  "Mysuru",
  "Belagavi",
  "Kalaburagi",
  "Mangaluru",
  "Hubballi-Dharwad",
];

const CATEGORIES = [
  "Vehicle Theft",
  "Burglary",
  "Chain Snatching",
  "Cyber Fraud",
  "Assault",
  "Robbery",
  "Missing Person",
  "Narcotics",
];

const CATEGORY_BG_COLORS: Record<string, string> = {
  "Vehicle Theft": "bg-teal-500",
  "Burglary": "bg-indigo-500",
  "Chain Snatching": "bg-rose-500",
  "Cyber Fraud": "bg-amber-500",
  "Assault": "bg-emerald-500",
  "Robbery": "bg-violet-500",
  "Missing Person": "bg-sky-500",
  "Narcotics": "bg-slate-500",
};

function ReportBuilderDashboard() {
  const { activeRole } = useAppSession();
  const { notify } = useToast();

  const [config, setConfig] = useState<ReportConfig>(DEFAULT_REPORT_CONFIG);
  const [draftConfig, setDraftConfig] = useState<ReportConfig>(DEFAULT_REPORT_CONFIG);
  const [data, setData] = useState<ReportPreviewData | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(draftConfig),
    [config, draftConfig]
  );

  // Validate form draft configuration
  const handleValidate = (): boolean => {
    setValidationError(null);
    
    if (!draftConfig.title || draftConfig.title.trim() === "") {
      setValidationError("Report title is required.");
      titleRef.current?.focus();
      return false;
    }
    
    if (draftConfig.range === "custom") {
      if (!draftConfig.startDate || !draftConfig.endDate) {
        setValidationError("Start and end dates are required for custom time window.");
        return false;
      }
      if (new Date(draftConfig.startDate) > new Date(draftConfig.endDate)) {
        setValidationError("Start date cannot be after end date.");
        return false;
      }
    }
    
    return true;
  };

  const handleApplyPreview = () => {
    if (handleValidate()) {
      setConfig(draftConfig);
      setExportStatus("Report preview request started. Your filters are still applied.");
    }
  };

  const handleSaveDraft = () => {
    if (handleValidate()) {
      const message = `Draft saved at ${new Date().toLocaleTimeString("en-IN")}.`;
      setSaveStatus(message);
      notify({ tone: "success", title: "Report draft saved.", description: "Your report settings remain on this page." });
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleExportPdf = async () => {
    if (exportingPdf || exportingCsv) return;
    if (!handleValidate()) return;
    try {
      setExportingPdf(true);
      setExportStatus("Preparing PDF export. Your report settings are preserved.");
      await downloadReportFile(draftConfig, activeRole, "pdf");
      setExportStatus(`PDF export prepared at ${new Date().toLocaleTimeString("en-IN")}.`);
      notify({ tone: "success", title: "PDF export prepared.", description: "The report file download has started." });
    } catch (error) {
      console.error(error);
      setExportStatus("Could not prepare the PDF export. Your filters are still applied. Try again.");
      notify({
        tone: "danger",
        title: "Could not prepare PDF export.",
        description: "Your report settings were preserved. Try again.",
        persistent: true,
      });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportCsv = async () => {
    if (exportingPdf || exportingCsv) return;
    if (!handleValidate()) return;
    try {
      setExportingCsv(true);
      setExportStatus("Preparing CSV export. Your report settings are preserved.");
      await downloadReportFile(draftConfig, activeRole, "csv");
      setExportStatus(`CSV export prepared at ${new Date().toLocaleTimeString("en-IN")}.`);
      notify({ tone: "success", title: "CSV export prepared.", description: "The export file download has started." });
    } catch (error) {
      console.error(error);
      setExportStatus("Could not prepare the CSV export. Your filters are still applied. Try again.");
      notify({
        tone: "danger",
        title: "Could not prepare CSV export.",
        description: "Your report settings were preserved. Try again.",
        persistent: true,
      });
    } finally {
      setExportingCsv(false);
    }
  };

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges || exportingPdf || exportingCsv) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [exportingCsv, exportingPdf, hasUnsavedChanges]);

  // Synchronize dynamic preview from API/Service
  useEffect(() => {
    let active = true;

    async function loadPreview() {
      try {
        setState("loading");
        const result = await fetchReportPreview(config, activeRole);
        if (!active) return;
        setData(result);
        setExportStatus(`Preview updated at ${new Date(result.generatedAt).toLocaleTimeString("en-IN")}.`);
        if (result.totalCount === 0) {
          setState("empty");
        } else {
          setState("ready");
        }
      } catch (error) {
        if (!active) return;
        console.error(error);
        setState("error");
      }
    }

    loadPreview();

    return () => {
      active = false;
    };
  }, [config, activeRole]);

  // SVG dynamic bar chart rendering variables
  const maxVal = useMemo(() => {
    if (!data || data.chartData.length === 0) return 1;
    return Math.max(...data.chartData.map((d) => d.value), 1);
  }, [data]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Configurations */}
        <aside className="space-y-4">
          <section className={`${cardClass} space-y-4`}>
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">
              Report Specifications
            </h2>

            {validationError && (
              <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-800 border border-red-200">
                {validationError} Your report settings are still here.
              </div>
            )}

            <div className="space-y-3">
              <label className={labelClass}>
                Report Title
                <input
                  ref={titleRef}
                  type="text"
                  value={draftConfig.title}
                  onChange={(e) => setDraftConfig({ ...draftConfig, title: e.target.value })}
                  placeholder="e.g. Crime Summary Report"
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Time Window
                <select
                  value={draftConfig.range}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      range: e.target.value,
                      // Clear dates if not custom
                      startDate: e.target.value === "custom" ? draftConfig.startDate : "",
                      endDate: e.target.value === "custom" ? draftConfig.endDate : "",
                    })
                  }
                  className={inputClass}
                >
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="180d">Last 180 Days</option>
                  <option value="1y">Last 1 Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </label>

              {draftConfig.range === "custom" && (
                <div className="grid grid-cols-2 gap-2">
                  <label className={labelClass}>
                    Start Date
                    <input
                      type="date"
                      value={draftConfig.startDate}
                      onChange={(e) => setDraftConfig({ ...draftConfig, startDate: e.target.value })}
                      className={inputClass}
                    />
                  </label>
                  <label className={labelClass}>
                    End Date
                    <input
                      type="date"
                      value={draftConfig.endDate}
                      onChange={(e) => setDraftConfig({ ...draftConfig, endDate: e.target.value })}
                      className={inputClass}
                    />
                  </label>
                </div>
              )}

              <label className={labelClass}>
                District Scope
                <select
                  value={draftConfig.district}
                  onChange={(e) => setDraftConfig({ ...draftConfig, district: e.target.value })}
                  className={inputClass}
                >
                  <option value="all">All Districts</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                Crime Category
                <select
                  value={draftConfig.category}
                  onChange={(e) => setDraftConfig({ ...draftConfig, category: e.target.value })}
                  className={inputClass}
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Report Inclusions
              </p>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftConfig.includeAiSummary}
                  onChange={(e) => setDraftConfig({ ...draftConfig, includeAiSummary: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                Include AI Executive Summary
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftConfig.includeCharts}
                  onChange={(e) => setDraftConfig({ ...draftConfig, includeCharts: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                Include Data Visualizations
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftConfig.includeTables}
                  onChange={(e) => setDraftConfig({ ...draftConfig, includeTables: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                Include Detailed Case Records
              </label>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3 flex flex-col">
              <button
                type="button"
                onClick={handleApplyPreview}
                disabled={state === "loading"}
                className="h-10 rounded-lg bg-teal-700 hover:bg-teal-800 text-sm font-semibold text-white transition-colors w-full"
              >
                {state === "loading" ? "Generating preview..." : "Generate preview"}
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="h-10 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors w-full"
              >
                Save Draft Template
              </button>
              {saveStatus && (
                <p className="text-center text-[10px] font-semibold text-green-700 mt-1">
                  ✓ {saveStatus}
                </p>
              )}
              {hasUnsavedChanges && (
                <p className="text-center text-[10px] font-semibold text-amber-700">
                  Preview has unsaved changes. Generate preview before exporting.
                </p>
              )}
            </div>
          </section>

          {/* Export Actions Panel */}
          <section className={`${cardClass} space-y-3`}>
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">
              Report Export PDF & CSV
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="primary"
                loading={exportingPdf}
                loadingLabel="Preparing..."
                disabled={exportingCsv || state === "loading" || state === "error"}
                onClick={handleExportPdf}
                className="w-full text-xs"
              >
                Export PDF
              </Button>
              <Button
                type="button"
                variant="primary"
                loading={exportingCsv}
                loadingLabel="Preparing..."
                disabled={exportingPdf || state === "loading" || state === "error"}
                onClick={handleExportCsv}
                className="w-full text-xs"
              >
                Export CSV
              </Button>
            </div>
            {exportStatus && (
              <StateNotice
                tone={exportingPdf || exportingCsv ? "loading" : exportStatus.startsWith("Could not") ? "error" : "info"}
                title="Report status"
                description={exportStatus}
              />
            )}
            <p className="text-[10px] text-slate-400 leading-normal">
              Note: Exported files are audit-logged in the database. PII fields will be redacted automatically based on your active role.
            </p>
          </section>
        </aside>

        {/* Right column: Document Preview */}
        <main className="lg:col-span-2 space-y-4">
          <section className="bg-white border border-slate-300 shadow-lg rounded-lg min-h-[600px] flex flex-col p-8 font-sans relative overflow-hidden">
            {/* Stamp mark */}
            <div className="absolute top-4 right-4 bg-amber-50 text-amber-800 border border-amber-200 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider select-none">
              Live Preview Card
            </div>

            {state === "loading" && (
              <div className="space-y-6 flex-1 py-10" aria-label="Loading report preview">
                <div className="h-8 bg-slate-100 rounded w-2/3 animate-pulse" />
                <div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse" />
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="h-20 bg-slate-100 rounded animate-pulse" />
                  <div className="h-44 bg-slate-100 rounded animate-pulse" />
                  <div className="h-32 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
            )}

            {state === "error" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                <h3 className="text-base font-bold text-red-800">Preview Engine Error</h3>
                <p className="text-sm text-slate-600 mt-2 max-w-sm">
                  Could not load the report preview. Your filters are still applied. Try again or broaden the report scope.
                </p>
                <Button type="button" className="mt-5" onClick={handleApplyPreview}>
                  Retry preview
                </Button>
              </div>
            )}

            {state === "empty" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                <svg
                  className="h-12 w-12 text-slate-300 stroke-1.5 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-sm font-bold text-slate-800">No Matching Case Records</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  There are no incidents matching district: {config.district}, category: {config.category} inside the selected time window.
                </p>
              </div>
            )}

            {state === "ready" && data && (
              <div className="space-y-6 flex-1 flex flex-col">
                {/* Document Header */}
                <header className="border-b-2 border-slate-900 pb-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                        KSP Intelligence Platform
                      </p>
                      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-1 uppercase">
                        {data.config.title}
                      </h1>
                    </div>
                    <div className="text-right text-[10px] text-slate-500">
                      <p><strong>Generated At:</strong> {new Date(data.generatedAt).toLocaleString("en-IN")}</p>
                      <p><strong>Status:</strong> Draft Summary (Mock)</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p>
                      <strong>Date Window:</strong> {data.config.startDate} to {data.config.endDate}
                    </p>
                    <p>
                      <strong>District Filter:</strong> {data.config.district === "all" ? "All Districts" : data.config.district}
                    </p>
                    <p>
                      <strong>Category Filter:</strong> {data.config.category === "all" ? "All Categories" : data.config.category}
                    </p>
                    <p>
                      <strong>Case Scope Count:</strong> {data.totalCount} incidents
                    </p>
                  </div>
                </header>

                {/* AI Executive Summary Block */}
                {config.includeAiSummary && data.aiSummary && (
                  <section className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        AI Executive Summary
                      </h2>
                      <span className="bg-teal-50 border border-teal-200 text-teal-800 text-[8px] font-bold uppercase px-1 rounded">
                        Advisory
                      </span>
                    </div>
                    <div className="rounded-lg border border-teal-100 bg-teal-50/20 p-4 text-xs leading-relaxed text-teal-900 italic">
                      &quot;{data.aiSummary}&quot;
                    </div>
                  </section>
                )}

                {/* Chart Block */}
                {config.includeCharts && data.chartData.length > 0 && (
                  <section className="space-y-2" aria-labelledby="report-category-chart-title">
                    <h2 id="report-category-chart-title" className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Category Proportions
                    </h2>
                    <p className="text-xs text-slate-600">
                      {data.chartData.map((point) => `${point.label}: ${point.value} cases`).join("; ")}.
                    </p>
                    <div className="rounded-lg border border-slate-100 p-4 bg-slate-50/40">
                      <div className="space-y-3">
                        {data.chartData.map((point) => {
                          const percent = totalCrimesValue(data.totalCount) > 0 ? (point.value / data.totalCount) * 100 : 0;
                          const barWidth = `${(point.value / maxVal) * 100}%`;
                          const bgColors = CATEGORY_BG_COLORS[point.label] || "bg-slate-500";
                          return (
                            <div key={point.label} className="text-xs flex items-center justify-between gap-4">
                              <span className="w-28 text-slate-700 font-semibold truncate text-left">{point.label}</span>
                              <div className="flex-1 h-3.5 bg-slate-100 rounded overflow-hidden relative">
                                <div
                                  className={`h-full rounded-r ${bgColors} transition-all duration-300`}
                                  style={{ width: barWidth }}
                                  role="img"
                                  aria-label={`${point.label}: ${point.value} cases, ${percent.toFixed(1)} percent`}
                                />
                              </div>
                              <span className="w-16 text-right font-bold text-slate-900">
                                {point.value} cases ({percent.toFixed(1)}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                )}

                {/* Case Records Table Block */}
                {config.includeTables && data.tableData.length > 0 && (
                  <section className="space-y-2 flex-1">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Scope Case Listing (Capped at 5)
                      </h2>
                      <span className="text-[10px] text-slate-400">
                        Showing {Math.min(5, data.tableData.length)} of {data.tableData.length} matches
                      </span>
                    </div>
                    <div className="overflow-hidden border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs border-collapse">
                        <caption className="sr-only">
                          Report preview case listing capped at five records.
                        </caption>
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 font-semibold uppercase border-b border-slate-200">
                            <th className="py-2.5 px-3">FIR Number</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Station</th>
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3">Accused</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                          {data.tableData.slice(0, 5).map((fir) => (
                            <tr key={fir.id} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-semibold text-teal-800">{fir.firNumber}</td>
                              <td className="py-2 px-3">{fir.incidentDateTime.slice(0, 10)}</td>
                              <td className="py-2 px-3">{fir.policeStation}</td>
                              <td className="py-2 px-3 font-medium text-slate-950">{fir.crimeCategory}</td>
                              <td className="py-2 px-3">
                                <span className={fir.accusedName.includes("Redacted") ? "italic text-red-500 font-medium" : "font-medium text-slate-900"}>
                                  {fir.accusedName}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-50 border border-slate-200">
                                  {fir.caseStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* Audit and Warning Notice */}
                <footer className="border-t border-slate-200 pt-4 mt-auto">
                  <div className="flex gap-2 bg-slate-50 border border-slate-200 p-3 rounded-lg text-[10px] leading-relaxed text-slate-500">
                    <span className="text-slate-700 font-bold">ℹ NOTICE:</span>
                    <p>{data.auditNote}</p>
                  </div>
                </footer>
              </div>
            )}
          </section>
        </main>
      </div>
  );
}

export function ReportBuilder() {
  return (
    <AppShell
      title="Report Builder"
      description="Design and generate custom analytical PDF summaries or raw CSV record logs."
      requiredPermission="feature:export-pdf"
    >
      <ReportBuilderDashboard />
    </AppShell>
  );
}

// Simple safety helper for zero division
function totalCrimesValue(total: number): number {
  return total || 0;
}
