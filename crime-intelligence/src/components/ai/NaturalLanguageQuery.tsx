"use client";

import { useCallback, useRef, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { EXAMPLE_QUERIES, MAX_QUERY_LENGTH, type NlqResponse } from "@/lib/ai/types";

const card = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

type QueryState = "idle" | "loading" | "ready" | "error";

async function runAiQuery(prompt: string, role: string): Promise<NlqResponse> {
  const response = await fetch("/api/ai/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, role }),
  });
  const data = (await response.json()) as NlqResponse | { error?: string };
  if (!response.ok && "error" in data) {
    throw new Error(data.error ?? "AI query failed.");
  }
  return data as NlqResponse;
}

function StatusBadge({ label, tone }: { label: string; tone: "amber" | "teal" | "slate" | "red" }) {
  const styles = {
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    teal: "border-teal-200 bg-teal-50 text-teal-800",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
    red: "border-red-200 bg-red-50 text-red-700",
  };
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>{label}</span>;
}

function QuerySkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3" aria-hidden="true">
      <div className="h-64 animate-pulse rounded-2xl bg-slate-100 lg:col-span-2" />
      <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

function EmptyState() {
  return (
    <section className={`${card} p-10 text-center`}>
      <h2 className="text-lg font-semibold tracking-tight">No query run yet</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
        Ask an aggregate question about crime data. Results will show the interpreted query, structured filters,
        grounded sample results, explanation, and limitations.
      </p>
    </section>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section className={`${card} p-10 text-center`}>
      <h2 className="text-lg font-semibold tracking-tight">Unable to run query</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        Something went wrong while preparing the AI query response. Please try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Retry
      </button>
    </section>
  );
}

function ResponsePanel({ response }: { response: NlqResponse }) {
  const filters = response.interpretation?.filters;
  const tone = response.status === "ok" ? "teal" : response.status === "refused" ? "red" : "amber";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className={card}>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={response.status.replace("-", " ")} tone={tone} />
            {response.confidence && <StatusBadge label={`${response.confidence} confidence`} tone="slate" />}
            {response.nlpProvider && (
              <StatusBadge label={`${response.nlpProvider} NLP`} tone={response.nlpProvider === "gemini" ? "teal" : "slate"} />
            )}
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">Interpreted Query</h2>
          {response.message && <p className="mt-2 text-sm text-slate-700">{response.message}</p>}
          {response.interpretation && (
            <>
              <p className="mt-2 text-sm text-slate-600">{response.interpretation.summary}</p>
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Intent</dt>
                  <dd className="mt-1 font-medium text-slate-800">{response.interpretation.intent}</dd>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Metric</dt>
                  <dd className="mt-1 font-medium capitalize text-slate-800">{filters?.metric ?? "—"}</dd>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Category</dt>
                  <dd className="mt-1 font-medium text-slate-800">{filters?.category ?? "All categories"}</dd>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Scope</dt>
                  <dd className="mt-1 font-medium text-slate-800">
                    {filters?.district ?? "All districts"} · {filters?.timeframeDays ?? 30} days
                  </dd>
                </div>
              </dl>
            </>
          )}
        </section>

        <section className={`${card} overflow-hidden p-0`}>
          <div className="px-6 pt-6">
            <h2 className="text-lg font-semibold tracking-tight">{response.resultTitle ?? "Results"}</h2>
            <p className="text-sm text-slate-600">Authorized, grounded output only</p>
          </div>
          {response.rows && response.rows.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-6 py-2.5 font-medium">Result</th>
                    <th scope="col" className="px-6 py-2.5 text-right font-medium">Value</th>
                    <th scope="col" className="px-6 py-2.5 font-medium">Source note</th>
                  </tr>
                </thead>
                <tbody>
                  {response.rows.map((row) => (
                    <tr key={`${row.label}-${row.value}`} className="border-b border-slate-100 last:border-0">
                      <td className="px-6 py-3 font-medium text-slate-800">{row.label}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-700">{row.value}</td>
                      <td className="px-6 py-3 text-slate-600">{row.note ?? "Sample aggregate"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="m-6 rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              No result rows were returned for this query.
            </p>
          )}
        </section>
      </div>

      <aside className="space-y-6">
        <section className={card}>
          <h2 className="text-lg font-semibold tracking-tight">Explanation</h2>
          <p className="mt-2 text-sm text-slate-600">{response.explanation?.text ?? "No explanation available."}</p>
          {response.providerNote && <p className="mt-3 text-xs text-slate-500">{response.providerNote}</p>}
          {response.explanation?.signals && (
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {response.explanation.signals.map((signal) => (
                <li key={signal} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-700" aria-hidden="true" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <h2 className="text-lg font-semibold tracking-tight">Limitations</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {(response.limitations ?? []).map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {response.redactionNote && <p className="mt-4 text-xs text-slate-500">{response.redactionNote}</p>}
          {response.humanReviewWarning && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900">
              {response.humanReviewWarning}
            </p>
          )}
        </section>
      </aside>
    </div>
  );
}

function NaturalLanguageQueryContent() {
  const { activeRole } = useAppSession();
  const [prompt, setPrompt] = useState<string>(EXAMPLE_QUERIES[0]);
  const [state, setState] = useState<QueryState>("idle");
  const [response, setResponse] = useState<NlqResponse | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const requestId = useRef(0);

  const submit = useCallback(
    async (query: string = prompt) => {
      const current = ++requestId.current;
      const cleaned = query.trim();
      setClientError(null);

      if (!cleaned) {
        setClientError("Enter a query before running analysis.");
        return;
      }
      if (cleaned.length > MAX_QUERY_LENGTH) {
        setClientError(`Queries must be ${MAX_QUERY_LENGTH} characters or fewer.`);
        return;
      }

      setState("loading");
      try {
        const result = await runAiQuery(cleaned, activeRole);
        if (current !== requestId.current) return;
        setResponse(result);
        setState("ready");
      } catch (err) {
        if (current !== requestId.current) return;
        console.error("Natural language query failed:", err);
        setState("error");
      }
    },
    [activeRole, prompt]
  );

  const runExample = (example: string) => {
    setPrompt(example);
    void submit(example);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label="Sample data" tone="amber" />
        <span className="text-xs text-slate-500">
          Demonstration figures only; connected Catalyst data and AI provider orchestration are pending.
        </span>
      </div>

      <section className={card}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="nlq-prompt" className="text-sm font-semibold text-slate-900">
              Query input
            </label>
            <p className="mt-1 text-sm text-slate-600">
              Ask for aggregate counts, rankings, trends, or permission-safe intelligence indicators.
            </p>
            <textarea
              id="nlq-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              maxLength={MAX_QUERY_LENGTH}
              rows={4}
              className="mt-3 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
              placeholder="Show theft cases in Bengaluru in the last 6 months."
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>{prompt.length}/{MAX_QUERY_LENGTH} characters</span>
              {clientError && <span className="font-medium text-red-600">{clientError}</span>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => runExample(example)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                {example}
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={state === "loading"}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {state === "loading" ? "Running query..." : "Run query"}
            </button>
          </div>
        </form>
      </section>

      {state === "loading" ? (
        <QuerySkeleton />
      ) : state === "error" ? (
        <ErrorState onRetry={() => void submit()} />
      ) : response ? (
        <ResponsePanel response={response} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

export default function NaturalLanguageQuery() {
  return (
    <AppShell
      title="Natural Language Query"
      description="Ask permission-safe natural-language questions about crime aggregates with structured filters and explainable results."
      requiredPermission="page:ai-query"
    >
      <NaturalLanguageQueryContent />
    </AppShell>
  );
}
