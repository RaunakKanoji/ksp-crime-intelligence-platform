"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import {
  fetchVictimProfile,
  VictimProfileApiError,
} from "@/lib/victim-profile-summary/api";
import type { VictimProfileSummary as VictimProfile } from "@/lib/victim-profile-summary/types";

type LoadState = "loading" | "ready" | "empty" | "error" | "validation-error";
const card = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

function RestrictedValue({ value }: { value: string | null }) {
  return value ? <>{value}</> : <span className="italic text-slate-400">Restricted</span>;
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6" aria-label="Loading victim profile summary">
      <div className="h-52 animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

function StateCard({
  title,
  message,
  retry,
}: {
  title: string;
  message: string;
  retry?: () => void;
}) {
  return (
    <section className={`${card} p-10 text-center`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">{message}</p>
      {retry && (
        <button
          type="button"
          onClick={retry}
          className="mt-6 inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-semibold hover:bg-slate-50"
        >
          Retry
        </button>
      )}
    </section>
  );
}

function ProfileContent({ profile }: { profile: VictimProfile }) {
  const status = profile.caseStatusSummary;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
          Sample data
        </span>
        <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-800">
          {profile.identity.identityProtection} identity protection
        </span>
        {!profile.redaction.pii && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
            Identity and demographic fields redacted
          </span>
        )}
      </div>

      <section className={card}>
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
          Victim reference {profile.id}
        </p>
        <h2 className="mt-2 text-2xl font-bold">
          <RestrictedValue value={profile.identity.name} />
        </h2>
        <dl className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Age range" value={<RestrictedValue value={profile.identity.ageRange} />} />
          <Detail label="Gender" value={<RestrictedValue value={profile.identity.gender} />} />
          <Detail label="Address summary" value={<RestrictedValue value={profile.identity.addressSummary} />} />
          <Detail label="Linked cases" value={status.totalLinkedCases} />
        </dl>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-950">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Privacy warning</h2>
        <p className="mt-2 text-sm leading-6">{profile.privacyWarning}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card}>
          <h2 className="text-lg font-semibold">Case Status Summary</h2>
          <dl className="mt-5 grid grid-cols-2 gap-5">
            <Detail label="Open" value={status.openCases} />
            <Detail label="Under investigation" value={status.underInvestigationCases} />
            <Detail label="Closed" value={status.closedCases} />
            <Detail label="Total linked" value={status.totalLinkedCases} />
          </dl>
        </section>
        <section className={card}>
          <h2 className="text-lg font-semibold">Victim Support Context</h2>
          {profile.supportNote ? (
            <p className="mt-4 text-sm leading-6 text-slate-700">{profile.supportNote}</p>
          ) : (
            <p className="mt-4 text-sm italic text-slate-500">
              Restricted. Support context requires investigation-note permission.
            </p>
          )}
        </section>
      </div>

      <section className={`${card} overflow-hidden p-0`}>
        <div className="px-6 py-5">
          <h2 className="text-lg font-semibold">Linked FIRs</h2>
          <p className="mt-1 text-sm text-slate-500">
            Access linked records only when required for an authorized operational purpose.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">FIR</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Station</th>
                <th className="px-6 py-3 font-medium">Registered</th>
                <th className="px-6 py-3 font-medium">Victim role</th>
                <th className="px-6 py-3 font-medium">Case status</th>
              </tr>
            </thead>
            <tbody>
              {profile.linkedFirs.length ? profile.linkedFirs.map((fir) => (
                <tr key={fir.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-3 font-semibold">
                    <Link href={`/fir-search/${fir.id}`} className="text-teal-700 hover:underline">
                      {fir.firNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-3">{fir.crimeCategory}</td>
                  <td className="px-6 py-3">{fir.policeStation}, {fir.district}</td>
                  <td className="px-6 py-3">{new Date(fir.registeredAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-6 py-3">{fir.victimRole}</td>
                  <td className="px-6 py-3">{fir.caseStatus}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No linked FIRs are available for this profile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
        {profile.auditNote}
      </p>
    </div>
  );
}

function ProfileLoader() {
  const { activeRole } = useAppSession();
  const searchParams = useSearchParams();
  const profileId = searchParams.get("id") ?? "VIC-001-A";
  const [state, setState] = useState<LoadState>("loading");
  const [profile, setProfile] = useState<VictimProfile | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    setMessage("");
    try {
      const result = await fetchVictimProfile(profileId, activeRole);
      setProfile(result.profile);
      setState(result.profile ? "ready" : "empty");
    } catch (error) {
      if (error instanceof VictimProfileApiError && error.status === 400) {
        setMessage(error.message);
        setState("validation-error");
      } else {
        console.error("Victim profile failed:", error);
        setState("error");
      }
    }
  }, [activeRole, profileId]);

  useEffect(() => { void load(); }, [load]);

  if (state === "loading") return <LoadingState />;
  if (state === "validation-error") return <StateCard title="Invalid profile identifier" message={message} />;
  if (state === "error") return <StateCard title="Unable to load victim profile" message="The victim profile could not be loaded safely. Please try again." retry={() => void load()} />;
  if (state === "empty" || !profile) return <StateCard title="Victim profile unavailable" message="No victim profile matches this identifier, or the record is unavailable to your current role." />;
  return <ProfileContent profile={profile} />;
}

export default function VictimProfileSummary() {
  return (
    <AppShell
      title="Victim Profile Summary"
      description="Review permission-filtered victim demographics, linked FIRs, case status, privacy controls, and support context."
      requiredPermission="page:victim-profile"
    >
      <ProfileLoader />
    </AppShell>
  );
}
