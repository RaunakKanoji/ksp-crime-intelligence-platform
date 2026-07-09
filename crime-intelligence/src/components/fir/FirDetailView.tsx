"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { FirDetailValidationError, getFirDetail } from "@/lib/fir/detail";
import type { FirDetail, FirDetailParty } from "@/lib/fir/types";

const card = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

type LoadState = "loading" | "ready" | "empty" | "error" | "validation-error";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN");
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function RedactedValue({ value }: { value: string | null }) {
  if (value) return <>{value}</>;
  return <span className="italic text-slate-400">Restricted</span>;
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function FirDetailSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

function StateCard({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={`${card} p-10 text-center`}>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}

function PartyTable({ title, rows }: { title: string; rows: FirDetailParty[] }) {
  return (
    <section className={`${card} overflow-hidden p-0`}>
      <div className="px-6 py-5">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-6 py-2.5 font-medium">Name</th>
              <th scope="col" className="px-6 py-2.5 font-medium">Role</th>
              <th scope="col" className="px-6 py-2.5 font-medium">Age / gender</th>
              <th scope="col" className="px-6 py-2.5 font-medium">Address summary</th>
              <th scope="col" className="px-6 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No {title.toLowerCase()} recorded for this sample FIR.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 align-top last:border-0">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {(title === "Accused Information" || title === "Victim Information") && row.name ? (
                      <Link
                        href={title === "Accused Information" ? `/people?id=${row.id}` : `/victims?id=${row.id}`}
                        className="text-teal-700 hover:underline hover:text-teal-800"
                      >
                        <RedactedValue value={row.name} />
                      </Link>
                    ) : (
                      <RedactedValue value={row.name} />
                    )}
                  </td>
                  <td className="px-6 py-3 text-slate-700">{row.role}</td>
                  <td className="px-6 py-3 text-slate-700">
                    <RedactedValue
                      value={row.ageRange && row.gender ? `${row.ageRange} / ${row.gender}` : null}
                    />
                  </td>
                  <td className="px-6 py-3 text-slate-700">
                    <RedactedValue value={row.addressSummary} />
                  </td>
                  <td className="px-6 py-3 text-slate-700">{row.status ?? "Recorded"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FirDetailContent({ data }: { data: FirDetail }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
          Sample data
        </span>
        {!data.redaction.pii && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
            PII redacted
          </span>
        )}
        {!data.redaction.investigationNotes && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
            Investigation notes redacted
          </span>
        )}
      </div>

      <section className={card}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-800">{data.firNumber}</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              {data.crimeCategory} · {data.caseStatus}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">{data.incidentSummary}</p>
          </div>
          <Link
            href="/fir-search"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to FIR Search
          </Link>
        </div>

        <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem label="District" value={data.district} />
          <DetailItem label="Police station" value={data.policeStation} />
          <DetailItem label="Station code" value={data.stationCode} />
          <DetailItem label="Registered at" value={formatDateTime(data.registeredAt)} />
          <DetailItem label="Incident date" value={formatDate(data.incidentDate)} />
          <DetailItem label="Incident time" value={data.incidentTimeRange} />
          <DetailItem label="Reported date" value={formatDate(data.reportedDate)} />
          <DetailItem label="Act / sections" value={`${data.act} ${data.sections.join(", ")}`} />
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card}>
          <h2 className="text-lg font-semibold tracking-tight">Incident Details</h2>
          <dl className="mt-5 grid gap-5">
            <DetailItem label="Place of occurrence" value={data.placeOfOccurrence} />
            <DetailItem label="Jurisdiction" value={data.jurisdiction} />
            <DetailItem label="Investigating officer" value={<RedactedValue value={data.investigatingOfficer} />} />
          </dl>
          <p className="mt-5 text-sm leading-6 text-slate-700">{data.incidentNarrative}</p>
        </section>

        <section className={card}>
          <h2 className="text-lg font-semibold tracking-tight">Case Status</h2>
          <dl className="mt-5 grid gap-5">
            <DetailItem label="Current status" value={data.caseStatus} />
            <DetailItem label="Generated at" value={formatDateTime(data.generatedAt)} />
            <DetailItem label="Data source" value={data.isSampleData ? "Sample FIR detail record" : "Connected data"} />
          </dl>
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            {data.auditNote}
          </p>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PartyTable title="Accused Information" rows={data.accused} />
        <PartyTable title="Victim Information" rows={data.victims} />
      </div>

      <section className={`${card} overflow-hidden p-0`}>
        <div className="px-6 py-5">
          <h2 className="text-lg font-semibold tracking-tight">Investigation Notes</h2>
        </div>
        {data.investigationNotes ? (
          <div className="divide-y divide-slate-100">
            {data.investigationNotes.map((note) => (
              <article key={note.id} className="px-6 py-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{note.authorRole}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatDateTime(note.recordedAt)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{note.note}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="border-t border-slate-100 px-6 py-8 text-sm italic text-slate-500">
            Restricted. Investigation notes require investigation-note permission.
          </div>
        )}
      </section>

      <section className={`${card} overflow-hidden p-0`}>
        <div className="px-6 py-5">
          <h2 className="text-lg font-semibold tracking-tight">Linked Cases</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-6 py-2.5 font-medium">FIR number</th>
                <th scope="col" className="px-6 py-2.5 font-medium">Relationship</th>
                <th scope="col" className="px-6 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.linkedCases.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    No linked cases are recorded for this sample FIR.
                  </td>
                </tr>
              ) : (
                data.linkedCases.map((linkedCase) => (
                  <tr key={linkedCase.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-6 py-3 font-semibold text-slate-900">{linkedCase.firNumber}</td>
                    <td className="px-6 py-3 text-slate-700">{linkedCase.relationship}</td>
                    <td className="px-6 py-3 text-slate-700">{linkedCase.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function FirDetailLoader({ firId }: { firId: string }) {
  const { activeRole } = useAppSession();
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<FirDetail | null>(null);
  const [validationMessage, setValidationMessage] = useState("");
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    setState("loading");
    setValidationMessage("");
    try {
      const result = await getFirDetail(firId, activeRole);
      if (current !== requestId.current) return;
      setData(result);
      setState(result ? "ready" : "empty");
    } catch (err) {
      if (current !== requestId.current) return;
      if (err instanceof FirDetailValidationError) {
        setValidationMessage(err.message);
        setState("validation-error");
        return;
      }
      console.error("FIR detail failed:", err);
      setState("error");
    }
  }, [activeRole, firId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === "loading") return <FirDetailSkeleton />;
  if (state === "error") {
    return (
      <StateCard
        title="Unable to load FIR detail"
        message="Something went wrong while preparing the FIR detail view. Please try again."
        action={
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Retry
          </button>
        }
      />
    );
  }
  if (state === "validation-error") {
    return (
      <StateCard
        title="Invalid FIR identifier"
        message={validationMessage || "The requested FIR identifier is not valid."}
        action={
          <Link
            href="/fir-search"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Return to FIR Search
          </Link>
        }
      />
    );
  }
  if (state === "empty" || !data) {
    return (
      <StateCard
        title="FIR detail unavailable"
        message="No sample detail record is available for this FIR. The search result may not have a detail record until the connected FIR data layer is available."
        action={
          <Link
            href="/fir-search"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            Return to FIR Search
          </Link>
        }
      />
    );
  }
  return <FirDetailContent data={data} />;
}

export default function FirDetailView({ firId }: { firId: string }) {
  return (
    <AppShell
      title="FIR Detail View"
      description="Review FIR metadata, incident details, police station context, people information, case status, linked cases, and permission-controlled investigation fields."
      requiredPermission="page:fir-detail"
    >
      <FirDetailLoader firId={firId} />
    </AppShell>
  );
}
