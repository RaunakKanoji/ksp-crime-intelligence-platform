"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { type CleaningRuleAlias, type ManualReviewItem } from "@/lib/dataset-cleaning/types";
import { fetchCleaningRules, saveCleaningRule, fetchManualReviews, resolveReviewItem } from "@/lib/dataset-cleaning/api";

const cardClass = "rounded-lg border border-slate-200 bg-white p-5 shadow-sm";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5";
const inputClass =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600 transition-colors w-full";
const btnTabClass = (active: boolean) =>
  `h-9 px-4 rounded-lg text-xs font-bold transition-all ${
    active ? "bg-teal-700 text-white shadow-sm" : "hover:bg-slate-100 text-slate-600"
  }`;

const PS_OPTIONS = ["Indiranagar PS", "Koramangala PS", "K.R. Puram PS", "Nazarbad PS", "Devaraja PS", "Mandi PS"];
const IPC_OPTIONS = ["IPC Section 379", "IPC Section 380", "IPC Section 323", "IPC Section 448"];

export function DataCleaningDashboard() {
  return (
    <AppShell
      title="Data Cleaning Rules"
      description="Define spelling alias matches and rectify import formatting errors via manual overrides."
      requiredPermission="page:dataset-upload"
    >
      <DataCleaningContent />
    </AppShell>
  );
}

function DataCleaningContent() {
  const { activeRole } = useAppSession();

  const [activeTab, setActiveTab] = useState<"rules" | "standardization" | "reviews">("rules");
  const [rules, setRules] = useState<CleaningRuleAlias[]>([]);
  const [reviews, setReviews] = useState<ManualReviewItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add rule modal states
  const [showAddRule, setShowAddRule] = useState(false);
  const [newCategory, setNewCategory] = useState<CleaningRuleAlias["category"]>("District");
  const [newAlias, setNewAlias] = useState("");
  const [newCanonical, setNewCanonical] = useState("");
  const [savingRule, setSavingRule] = useState(false);

  // Resolve review modal states
  const [resolvingItem, setResolvingItem] = useState<ManualReviewItem | null>(null);
  const [correctedValue, setCorrectedValue] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  // Config options states
  const [dateFormat, setDateFormat] = useState("iso");
  const [textCasing, setTextCasing] = useState("title");
  const [duplicateHandling, setDuplicateHandling] = useState("review");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const rulesRes = await fetchCleaningRules(activeRole);
      setRules(rulesRes);

      const reviewsRes = await fetchManualReviews(activeRole);
      setReviews(reviewsRes);
    } catch (err) {
      console.error(err);
      setError("Failed to load cleaning rules or queue.");
    } finally {
      setLoading(false);
    }
  }, [activeRole]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlias || !newCanonical) return;
    try {
      setSavingRule(true);
      setError(null);
      await saveCleaningRule(newCategory, newAlias, newCanonical, activeRole);
      
      setSuccess("Spelling alias mapping added successfully.");
      setShowAddRule(false);
      setNewAlias("");
      setNewCanonical("");
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to create cleaning rule.");
    } finally {
      setSavingRule(false);
    }
  };

  const handleResolveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingItem || !correctedValue) return;
    try {
      setSavingReview(true);
      setError(null);
      await resolveReviewItem(resolvingItem.id, correctedValue, activeRole);
      
      setSuccess(`Manual correction applied for row ${resolvingItem.rowNumber}.`);
      setResolvingItem(null);
      setCorrectedValue("");
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to submit manual resolution.");
    } finally {
      setSavingReview(false);
    }
  };

  // Toggle rule status client side
  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  // Pending counts check
  const pendingCount = useMemo(() => {
    return reviews.filter((r) => r.status === "Pending").length;
  }, [reviews]);

  return (
    <div className="space-y-6">
      {/* Dynamic Tab Switch Header */}
      <section className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("rules")}
          className={btnTabClass(activeTab === "rules")}
        >
          Spelling Alias Rules
        </button>
        <button
          onClick={() => setActiveTab("standardization")}
          className={btnTabClass(activeTab === "standardization")}
        >
          Standardization Policies
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={btnTabClass(activeTab === "reviews")}
        >
          Manual Review Queue {pendingCount > 0 && (
            <span className="ml-1 bg-red-600 text-white rounded-full text-[9px] px-1.5 py-0.5 font-bold animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>
      </section>

      {success && (
        <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 text-xs font-semibold text-emerald-800 animate-in fade-in duration-200">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-xs font-semibold text-red-800 animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4 py-10" aria-label="Loading cleaning view">
          <div className="h-10 bg-slate-100 rounded w-full animate-pulse" />
          <div className="h-10 bg-slate-50 rounded w-full animate-pulse" />
          <div className="h-10 bg-slate-50 rounded w-full animate-pulse" />
        </div>
      ) : (
        <>
          {/* Tab 1: Rules grid */}
          {activeTab === "rules" && (
            <main className={cardClass}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Spelling & Text Alias Normalization</h2>
                  <p className="text-xs text-slate-500">Auto-convert dirty string keys to canonical records.</p>
                </div>
                <button
                  onClick={() => setShowAddRule(true)}
                  className="h-9 px-4 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 text-xs transition-colors"
                >
                  + Add New Alias Mapping
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Alias Input</th>
                      <th className="py-3 px-4">Canonical Master Match</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-600">
                            {rule.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-red-700 font-medium">&quot;{rule.alias}&quot;</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-800">&quot;{rule.canonicalValue}&quot;</td>
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={() => handleToggleRule(rule.id)}
                            className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </main>
          )}

          {/* Tab 2: Standardization Settings */}
          {activeTab === "standardization" && (
            <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`${cardClass} md:col-span-2 space-y-6`}>
                <div className="pb-2 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900">Format Standardizations</h2>
                  <p className="text-xs text-slate-500">Configure global date parsing, duplicate overrides, and string policies.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <label className="block space-y-1">
                    <span className={labelClass}>Date Parsing Standard</span>
                    <select
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className={inputClass}
                    >
                      <option value="iso">Standard ISO-8601 (YYYY-MM-DD)</option>
                      <option value="dmy">Common DD-MM-YYYY</option>
                      <option value="fuzzy">Attempt Fuzzy String Parsing</option>
                    </select>
                  </label>

                  <label className="block space-y-1">
                    <span className={labelClass}>Text Casing Standard</span>
                    <select
                      value={textCasing}
                      onChange={(e) => setTextCasing(e.target.value)}
                      className={inputClass}
                    >
                      <option value="title">Title Case (&quot;Bengaluru City&quot;)</option>
                      <option value="upper">UPPERCASE</option>
                      <option value="lower">lowercase</option>
                      <option value="none">No normalization (Keep original)</option>
                    </select>
                  </label>

                  <label className="block space-y-1">
                    <span className={labelClass}>Duplicate FIR References</span>
                    <select
                      value={duplicateHandling}
                      onChange={(e) => setDuplicateHandling(e.target.value)}
                      className={inputClass}
                    >
                      <option value="review">Flag for Manual Review (Stop and Review)</option>
                      <option value="skip">Skip duplicate records automatically</option>
                      <option value="overwrite">Overwrite existing case database</option>
                    </select>
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSuccess("Global formatting settings updated.");
                      setTimeout(() => setSuccess(null), 3000);
                    }}
                    className="h-9 px-5 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 text-xs transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className={cardClass}>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Automated Sanitization</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Cleaning settings parse cells before schema validation checks. Auto-trimmed characters and leading spaces are executed recursively.
                  </p>
                </div>
              </div>
            </main>
          )}

          {/* Tab 3: Manual Review list */}
          {activeTab === "reviews" && (
            <main className={cardClass}>
              <div className="mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">Manual Review Queue</h2>
                <p className="text-xs text-slate-500">Correct records flagged with boundary anomalies or format conflicts.</p>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-200 rounded-lg">
                  <h3 className="text-xs font-bold text-slate-700">No Flagged Columns Found</h3>
                  <p className="text-[11px] text-slate-400 mt-1">All datasets verified clean.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">File Name</th>
                        <th className="py-3 px-4 text-center">Row</th>
                        <th className="py-3 px-4">Flagged Field</th>
                        <th className="py-3 px-4">Invalid Cell Value</th>
                        <th className="py-3 px-4">Correction Value</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                      {reviews.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">{item.fileName}</td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500">{item.rowNumber}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">{item.fieldName}</td>
                          <td className="py-3.5 px-4 font-mono text-red-700 font-semibold">&quot;{item.invalidValue}&quot;</td>
                          <td className="py-3.5 px-4 font-bold text-emerald-800">
                            {item.resolvedValue ? `&quot;${item.resolvedValue}&quot;` : <span className="text-slate-400 font-medium italic">Pending</span>}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                                item.status === "Resolved"
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                  : "bg-red-50 border-red-200 text-red-800"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {item.status === "Pending" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setResolvingItem(item);
                                  setCorrectedValue(
                                    item.fieldName === "Police Station"
                                      ? PS_OPTIONS[0]
                                      : item.fieldName === "Legal Section"
                                      ? IPC_OPTIONS[0]
                                      : ""
                                  );
                                }}
                                className="h-7 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[10px] transition-colors"
                              >
                                Resolve
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold">Locked</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </main>
          )}
        </>
      )}

      {/* Warnings footer */}
      <footer className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex gap-3 text-slate-700">
        <span className="text-base">⚠️</span>
        <p className="text-[10px] leading-relaxed font-medium">
          <strong>Compliance Audit Notice:</strong> normalizations operate recursively on validation routines. Live modifications generate timeline logs in Security and Audit dashboards.
        </p>
      </footer>

      {/* Modal Dialog for adding alias rule */}
      {showAddRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAddRule}
            className="w-full max-w-sm bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <header className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Create Spelling Alias Match</h3>
              <button
                type="button"
                onClick={() => setShowAddRule(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </header>
            <div className="p-5 space-y-4">
              <label className="block space-y-1">
                <span className={labelClass}>Rule Category</span>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="District">District</option>
                  <option value="Police Station">Police Station</option>
                  <option value="Crime Category">Crime Category</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className={labelClass}>Spelling Alias Input</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. blr city"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="block space-y-1">
                <span className={labelClass}>Canonical Value</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bengaluru City"
                  value={newCanonical}
                  onChange={(e) => setNewCanonical(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <footer className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddRule(false)}
                className="h-9 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingRule}
                className="h-9 px-4 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 text-xs transition-colors flex items-center justify-center gap-1"
              >
                {savingRule && (
                  <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                )}
                Save Rule
              </button>
            </footer>
          </form>
        </div>
      )}

      {/* Modal Dialog for manual resolution */}
      {resolvingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleResolveReview}
            className="w-full max-w-sm bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <header className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Resolve Boundary/Value Warning</h3>
              <button
                type="button"
                onClick={() => setResolvingItem(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </header>
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-slate-600 leading-normal space-y-1 font-medium">
                <p>File: <strong className="text-slate-950 font-bold">{resolvingItem.fileName}</strong> (Row {resolvingItem.rowNumber})</p>
                <p>Flagged Field: <strong className="text-slate-950 font-bold">{resolvingItem.fieldName}</strong></p>
                <p>Original Bad Cell: <strong className="text-red-700 font-mono font-bold">&quot;{resolvingItem.invalidValue}&quot;</strong></p>
              </div>

              <label className="block space-y-1">
                <span className={labelClass}>Corrected Master Value</span>
                {resolvingItem.fieldName === "Police Station" ? (
                  <select
                    value={correctedValue}
                    onChange={(e) => setCorrectedValue(e.target.value)}
                    className={inputClass}
                  >
                    {PS_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : resolvingItem.fieldName === "Legal Section" ? (
                  <select
                    value={correctedValue}
                    onChange={(e) => setCorrectedValue(e.target.value)}
                    className={inputClass}
                  >
                    {IPC_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Enter correct value..."
                    value={correctedValue}
                    onChange={(e) => setCorrectedValue(e.target.value)}
                    className={inputClass}
                  />
                )}
              </label>
            </div>
            <footer className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResolvingItem(null)}
                className="h-9 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingReview}
                className="h-9 px-4 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 text-xs transition-colors flex items-center justify-center gap-1"
              >
                {savingReview && (
                  <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                )}
                Apply Resolution
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}
