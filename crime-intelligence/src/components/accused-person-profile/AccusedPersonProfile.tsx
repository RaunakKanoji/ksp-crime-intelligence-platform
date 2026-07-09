"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import {
  AccusedProfileApiError,
  fetchAccusedProfile,
} from "@/lib/accused-person-profile/api";
import type { AccusedProfile } from "@/lib/accused-person-profile/types";

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

function ProfileSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading accused person profile">
      <div className="h-52 animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
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

function ProfileContent({ profile }: { profile: AccusedProfile }) {
  const aliases =
    profile.aliases === null
      ? "Restricted"
      : profile.aliases.length
        ? profile.aliases.join(", ")
        : "No known aliases recorded";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
          Sample data
        </span>
        {!profile.redaction.pii && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
            Identity fields redacted
          </span>
        )}
        {!profile.redaction.networkLinks && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
            Network details redacted
          </span>
        )}
      </div>

      <section className={card}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Profile reference {profile.id}
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              <RestrictedValue value={profile.identity.name} />
            </h2>
            <p className="mt-1 text-sm text-slate-600">{profile.identity.identificationStatus}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold">
              Risk: {profile.riskLevel}
            </span>
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                profile.repeatOffender
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {profile.repeatOffender ? "Repeat-offender indicator" : "No repeat-offender indicator"}
            </span>
          </div>
        </div>
        <dl className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Age range" value={<RestrictedValue value={profile.identity.ageRange} />} />
          <Detail label="Gender" value={<RestrictedValue value={profile.identity.gender} />} />
          <Detail label="Address summary" value={<RestrictedValue value={profile.identity.addressSummary} />} />
          <Detail label="Known aliases" value={aliases} />
        </dl>
        <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          {profile.repeatOffenderReason}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card}>
          <h2 className="text-lg font-semibold">Associated Locations</h2>
          {profile.associatedLocations.length ? (
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {profile.associatedLocations.map((location) => (
                <li key={location} className="rounded-lg bg-slate-50 px-3 py-2">{location}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No associated locations recorded.</p>
          )}
        </section>
        <section className={card}>
          <h2 className="text-lg font-semibold">Associated Crime Categories</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.associatedCategories.length ? (
              profile.associatedCategories.map((category) => (
                <span key={category} className="rounded-full bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-800">
                  {category}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-500">No associated categories recorded.</p>
            )}
          </div>
        </section>
      </div>

      <section className={`${card} overflow-hidden p-0`}>
        <div className="px-6 py-5">
          <h2 className="text-lg font-semibold">Linked FIRs</h2>
          <p className="mt-1 text-sm text-slate-500">Case links are allegations or associations, not findings of guilt.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">FIR</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Station</th>
                <th className="px-6 py-3 font-medium">Registered</th>
                <th className="px-6 py-3 font-medium">Alleged role</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {profile.linkedFirs.length ? profile.linkedFirs.map((fir) => (
                <tr key={fir.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-3 font-semibold">
                    <Link className="text-teal-700 hover:underline" href={`/fir-search/${fir.id}`}>{fir.firNumber}</Link>
                  </td>
                  <td className="px-6 py-3">{fir.crimeCategory}</td>
                  <td className="px-6 py-3">{fir.policeStation}, {fir.district}</td>
                  <td className="px-6 py-3">{new Date(fir.registeredAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-6 py-3">{fir.allegedRole}</td>
                  <td className="px-6 py-3">{fir.caseStatus}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No linked FIRs recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${card} overflow-hidden p-0`}>
        <div className="px-6 py-5">
          <h2 className="text-lg font-semibold">Network Links</h2>
          <p className="mt-1 text-sm text-slate-500">Associations require human verification and are not evidence by themselves.</p>
        </div>
        {profile.networkLinks === null ? (
          <div className="border-t border-slate-100 px-6 py-8 text-sm italic text-slate-500">
            Restricted. Network details require investigation-note permission.
          </div>
        ) : profile.networkLinks.length ? (
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {profile.networkLinks.map((link) => (
              <div key={link.id} className="grid gap-2 px-6 py-4 text-sm sm:grid-cols-4">
                <span className="font-semibold"><RestrictedValue value={link.personLabel} /></span>
                <span className="sm:col-span-2 text-slate-600">{link.relationship}</span>
                <span className="text-slate-600">{link.verificationStatus} · {link.linkedFirCount} FIR</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-t border-slate-100 px-6 py-8 text-sm text-slate-500">No network links recorded.</div>
        )}
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
  const profileId = searchParams.get("id") ?? "ACC-001-A";
  const [state, setState] = useState<LoadState>("loading");
  const [profile, setProfile] = useState<AccusedProfile | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    setMessage("");
    try {
      const result = await fetchAccusedProfile(profileId, activeRole);
      setProfile(result.profile);
      setState(result.profile ? "ready" : "empty");
    } catch (error) {
      if (error instanceof AccusedProfileApiError && error.status === 400) {
        setMessage(error.message);
        setState("validation-error");
      } else {
        console.error("Accused profile failed:", error);
        setState("error");
      }
    }
  }, [activeRole, profileId]);

  useEffect(() => { void load(); }, [load]);

  if (state === "loading") return <ProfileSkeleton />;
  if (state === "validation-error") return <StateCard title="Invalid profile identifier" message={message} />;
  if (state === "error") return <StateCard title="Unable to load profile" message="The profile could not be loaded safely. Please try again." retry={() => void load()} />;
  if (state === "empty" || !profile) return <StateCard title="Profile unavailable" message="No accused person profile matches this identifier, or the record is unavailable to your current role." />;
  return <ProfileContent profile={profile} />;
}

export default function AccusedPersonProfile() {
  return (
    <AppShell
      title="Accused Person Profile"
      description="Review permission-filtered identity, case associations, aliases, repeat-offender indicators, locations, crime categories, and network links."
      requiredPermission="page:accused-profile"
    >
      <ProfileLoader />
    </AppShell>
  );
}
