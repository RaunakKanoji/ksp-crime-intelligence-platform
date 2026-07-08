"use client";

import { useCallback, useRef, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { EXAMPLE_QUERIES, MAX_QUERY_LENGTH, type NlqResponse } from "@/lib/ai/types";

const card = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

type ExplanationState = "idle" | "loading" | "ready" | "error";

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

function Badge({ children, tone }: { children: React.ReactNode; tone: "amber" | "teal" | "slate" | "red" }) {
  const styles = {
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    teal: "border-teal-200 bg-teal-50 text-teal-800",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
    red: "border-red-200 bg-red-50 text-red-700",
  };
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}

function ExplanationSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3" aria-hidden="true">
      <div className="h-72 animate-pulse rounded-2xl bg-slate-100 lg:col-span-2" />
      <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-56 animate-pulse rounded-2xl bg-slate-100 lg:col-span-3" />
    </div>
  );
}

function EmptyState() {
  return (
    <section className={`${card} p-10 text-center`}>
      <h2 className="text-lg font-semibold tracking-tight">No explanation generated</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
        Run a permission-safe AI query to see a plain-language summary, source references, confidence notes,
        limitations, suggested follow-up queries, and review warnings.
      </p>
    </section>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section className={`${card} p-10 text-center`}>
      <h2 className="text-lg font-semibold tracking-tight">Unable to generate explanation</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        Something went wrong while preparing the result explanation. Please try again.
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

function ResultExplanation({ response }: { response: NlqResponse }) {
  const explanation = response.explanation;
  const filters = response.interpretation?.filters;
  const statusTone = response.status === "ok" ? "teal" : response.status === "refused" ? "red" : "amber";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <section className={`${card} lg:col-span-2`}>
          <div className="flex flex-wrap gap-2">
            <Badge tone={statusTone}>{response.status.replace("-", " ")}</Badge>
            {response.confidence && <Badge tone="slate">{response.confidence} confidence</Badge>}
            {response.nlpProvider && (
              <Badge tone={response.nlpProvider === "gemini" ? "teal" : "slate"}>{response.nlpProvider} NLP</Badge>
            )}
            <Badge tone="amber">Sample data</Badge>
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">Summary Explanation</h2>
          {response.message && <p className="mt-2 text-sm text-slate-700">{response.message}</p>}
          <p className="mt-2 text-sm text-slate-600">
            {explanation?.summary ?? "No summary explanation was returned for this query."}
          </p>
          {response.providerNote && <p className="mt-3 text-xs text-slate-500">{response.providerNote}</p>}

          {response.interpretation && (
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Interpreted intent</dt>
                <dd className="mt-1 font-medium text-slate-800">{response.interpretation.intent}</dd>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Structured filters</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {filters?.category ?? "All categories"} · {filters?.district ?? "All districts"} ·{" "}
                  {filters?.timeframeDays ?? 30} days
                </dd>
              </div>
            </dl>
          )}
        </section>

        <section className={card}>
          <h2 className="text-lg font-semibold tracking-tight">Confidence Notes</h2>
          {explanation?.confidenceNotes?.length ? (
            <ul className="mt-4 space-y-3">
              {explanation.confidenceNotes.map((note) => (
                <li key={note.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">{note.text}</p>
                    <Badge tone={note.level === "high" ? "teal" : note.level === "medium" ? "amber" : "red"}>
                      {note.level}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No confidence notes available.</p>
          )}
        </section>
      </div>

      <section className={`${card} overflow-hidden p-0`}>
        <div className="px-6 pt-6">
          <h2 className="text-lg font-semibold tracking-tight">Result Area</h2>
          <p className="text-sm text-slate-600">Authorized query rows used for the explanation</p>
        </div>
        {response.rows && response.rows.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-6 py-2.5 font-medium">Result</th>
                  <th scope="col" className="px-6 py-2.5 text-right font-medium">Value</th>
                  <th scope="col" className="px-6 py-2.5 font-medium">Explanation context</th>
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
            No authorized result rows were available to explain.
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className={card}>
          <h2 className="text-lg font-semibold tracking-tight">Data Source References</h2>
          <ul className="mt-4 space-y-3">
            {(explanation?.sourceReferences ?? []).map((source) => (
              <li key={source.id} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">{source.label}</p>
                <p className="mt-1 text-xs capitalize text-slate-500">{source.kind.replace("-", " ")}</p>
                <p className="mt-2 text-xs text-slate-600">Fields: {source.fields.join(", ")}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={card}>
          <h2 className="text-lg font-semibold tracking-tight">Limitations</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {(response.limitations ?? []).map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {response.redactionNote && <p className="mt-4 text-xs text-slate-500">{response.redactionNote}</p>}
        </section>

        <section className={card}>
          <h2 className="text-lg font-semibold tracking-tight">Suggested Follow-Up Queries</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {(response.followUps ?? []).map((query) => (
              <li key={query} className="rounded-lg border border-slate-200 p-3">{query}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-900">Not Evidence Warning</h2>
        <p className="mt-2 text-sm font-medium text-amber-950">
          {explanation?.notEvidenceWarning ?? response.humanReviewWarning}
        </p>
        {response.humanReviewWarning && (
          <p className="mt-2 text-sm text-amber-900">Human review required: {response.humanReviewWarning}</p>
        )}
      </section>
    </div>
  );
}

function AIQueryResultExplanationContent() {
  const { activeRole } = useAppSession();
  const [prompt, setPrompt] = useState<string>(EXAMPLE_QUERIES[1]);
  const [state, setState] = useState<ExplanationState>("idle");
  const [response, setResponse] = useState<NlqResponse | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const requestId = useRef(0);

  const submit = useCallback(
    async (query: string = prompt) => {
      const current = ++requestId.current;
      const cleaned = query.trim();
      setClientError(null);

      if (!cleaned) {
        setClientError("Enter a query before generating an explanation.");
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
        console.error("AI query result explanation failed:", err);
        setState("error");
      }
    },
    [activeRole, prompt]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="amber">Sample data</Badge>
        <span className="text-xs text-slate-500">
          Explanations are grounded in authorized sample aggregates until Catalyst Data Store is connected.
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
            <label htmlFor="explanation-query" className="text-sm font-semibold text-slate-900">
              Query input area
            </label>
            <p className="mt-1 text-sm text-slate-600">
              Generate an explainable AI query result with source references, confidence notes, and limitations.
            </p>
            <textarea
              id="explanation-query"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              maxLength={MAX_QUERY_LENGTH}
              rows={4}
              className="mt-3 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
              placeholder="Which police stations have the highest cybercrime reports?"
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
                onClick={() => {
                  setPrompt(example);
                  void submit(example);
                }}
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
              {state === "loading" ? "Generating explanation..." : "Generate explanation"}
            </button>
          </div>
        </form>
      </section>

      {state === "loading" ? (
        <ExplanationSkeleton />
      ) : state === "error" ? (
        <ErrorState onRetry={() => void submit()} />
      ) : response ? (
        <ResultExplanation response={response} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

export default function AIQueryResultExplanation() {
  return (
    <AppShell
      title="AI Query Result Explanation"
      description="Explain AI-generated crime query results with source references, confidence notes, limitations, and human-review warnings."
      requiredPermission="page:ai-query"
    >
      <AIQueryResultExplanationContent />
    </AppShell>
  );
}
