"use client";

export default function CrimeMapError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-950">
      <section className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">Unable to load crime map</h1>
        <p className="mt-2 text-sm text-slate-600">The map route failed to render. Retry after the server finishes rebuilding.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Retry
        </button>
      </section>
    </main>
  );
}
