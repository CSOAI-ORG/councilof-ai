/**
 * /verify-server — paste an MCP server, A2A agent or x402 endpoint URL and see every signed
 * measurement capsule Council of AI holds about it, each with a button that re-derives it in the
 * browser (client/src/lib/serverLookup.ts → functions/_lib/measurementCapsule.ts, the same module
 * the MCP tools server_evidence / verify_capsule and the A2A skills run).
 *
 * States and proofs only. No score, grade, verdict or ranking is computed or shown anywhere on this
 * page; an unknown URL is NOT_MEASURED, never "clean". Data: the static tree /measurement-capsules/
 * written by scripts/measurement_capsule_layout.py from the board-signed index.
 */
import MomentumStrip from "@/components/momentum/MomentumStrip";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import FixQueue from "@/components/verify/FixQueue";
import {
  DOCTRINE,
  LOOKUP_MEANING,
  STATE_MEANING,
  capsuleBody,
  lookupServer,
  normaliseEndpoint,
  verifyCapsuleText,
  type Check,
  type Lookup,
  type ShardCapsule,
} from "@/lib/serverLookup";

const TITLE = "Verify a server: signed measurements | Council of AI";
const DESCRIPTION =
  "Paste an MCP server, A2A agent or x402 endpoint URL to see every signed measurement Council of AI holds about it, and re-check each one in your browser.";

const EXAMPLES: { label: string; url: string }[] = [
  { label: "our own MCP door", url: "https://councilof.ai/mcp" },
  { label: "one of our doors with a disagreement", url: "https://councilof.ai/api/request-attestation?subject=model-or-subject-id" },
  { label: "a URL we hold nothing about", url: "https://example.com/mcp" },
];

const ADAPTER_LABEL: Record<string, string> = {
  contract_parity: "MCP contract parity — what the server's public descriptions declare vs what it answered",
  a2a_card: "A2A agent card — does the card's signature verify",
  tool_drift: "Tool drift — did the listed tool names change between two reads",
  self_parity: "Self-parity — our own doors, declared vs served",
};

const pretty = (v: unknown) => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object" && Object.keys(v as object).length === 0) return "(empty)";
  return JSON.stringify(v, null, 2);
};

function origin(): string {
  return typeof window === "undefined" ? "https://councilof.ai" : window.location.origin;
}

export default function VerifyServer() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Lookup | null>(null);
  const [looked, setLooked] = useState<string>("");
  const [failure, setFailure] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  async function run(raw: string) {
    const value = raw.trim();
    setInput(value);
    setLooked(value);
    setBusy(true);
    setFailure(null);
    try {
      const r = await lookupServer(origin(), value);
      setResult(r);
      if (typeof window !== "undefined") {
        const u = new URL(window.location.href);
        if (value) u.searchParams.set("url", value);
        else u.searchParams.delete("url");
        window.history.replaceState(null, "", u.pathname + u.search);
      }
    } catch (e) {
      setResult(null);
      setFailure(`The lookup stopped: ${(e as Error).message}. Nothing was concluded.`);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => headingRef.current?.focus());
    }
  }

  useEffect(() => {
    document.title = TITLE;
    setMetaDescription(DESCRIPTION);
    const q = new URLSearchParams(window.location.search).get("url");
    if (q) void run(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ask GSPC watch mode: runVerify {kind:"server", id} looks up that URL here (FixQueue re-checks its rows).
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ tool: string; args: Record<string, unknown>; handled?: boolean }>).detail;
      if (d?.tool !== "runVerify" || d.args?.kind !== "server" || typeof d.args.id !== "string") return;
      if (d.args.id !== looked || !result) {
        d.handled = true;
        void run(d.args.id);
      }
    };
    window.addEventListener("council:ui", on);
    return () => window.removeEventListener("council:ui", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [looked, result]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void run(input);
  }

  const preview = input.trim() ? normaliseEndpoint(input) : null;

  return (
    <div
      data-testid="verify-server-page"
      className="mx-auto max-w-3xl px-4 py-10 sm:py-14"
      data-ui-subject={result?.endpoint ?? undefined}
      data-ui-subject-kind={result?.endpoint ? "server" : undefined}
    >
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <Link href="/">Home</Link> › <span>Verify a server</span>
      </nav>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Verify a server</h1>
      <p className="mt-4 text-slate-700">
        Paste the URL of an MCP server, an A2A agent card or an x402 endpoint. You get every signed measurement we hold
        about that one URL — per server, not totals — and a button on each that re-checks it in your browser.
      </p>
      <p data-testid="doctrine" className="mt-4 rounded-md border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800">
        <strong className="font-semibold">Measurement, not endorsement.</strong> This page shows states and proofs only —
        never a score, grade or verdict. A URL we hold nothing about is <code>NOT_MEASURED</code>, never “clean”. Think a
        record is wrong, or want an endpoint left out?{" "}
        <Link href="/census" className="font-medium text-slate-900 underline underline-offset-4">
          Ask for a re-check or object
        </Link>
        .
      </p>

      <form onSubmit={onSubmit} className="mt-8" role="search" aria-label="Look up an endpoint">
        <label htmlFor="endpoint-url" className="block text-sm font-semibold text-slate-900">
          Endpoint URL
        </label>
        <p id="endpoint-url-help" className="mt-1 text-sm text-slate-600">
          For example <code className="break-all">https://example.com/mcp</code>. Scheme and host case, a default port and
          a trailing slash do not matter; the query string does.
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="endpoint-url"
            name="url"
            type="text"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            autoCapitalize="none"
            aria-describedby="endpoint-url-help endpoint-url-key"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://…"
            className="min-w-0 flex-1 rounded-md border border-slate-500 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-60"
          >
            {busy ? "Looking up…" : "Look up"}
          </button>
        </div>
        <p id="endpoint-url-key" className="mt-2 text-xs text-slate-600" aria-live="polite">
          {input.trim()
            ? preview
              ? <>Looked up as <code className="break-all">{preview}</code> — its SHA-256 is the lookup key, computed in your browser.</>
              : "Not an http(s) URL we can key — it will answer NOT_MEASURED."
            : null}
        </p>
        <p className="mt-3 text-sm text-slate-700">
          Try:{" "}
          {EXAMPLES.map((x, i) => (
            <span key={x.url}>
              {i > 0 ? " · " : ""}
              <button type="button" onClick={() => void run(x.url)} className="text-slate-900 underline underline-offset-4 hover:text-slate-600">
                {x.label}
              </button>
            </span>
          ))}
        </p>
      </form>

      <section aria-labelledby="results-heading" className="mt-10" aria-busy={busy}>
        <h2 id="results-heading" ref={headingRef} tabIndex={-1} className="text-xl font-bold text-slate-900 focus:outline-none">
          {result ? "What we hold about this URL" : "Results"}
        </h2>
        <div aria-live="polite">
          {busy ? <p className="mt-3 text-slate-700">Looking up {looked}…</p> : null}
          {failure ? <p className="mt-3 text-slate-800">{failure}</p> : null}
          {!busy && !result && !failure ? (
            <p className="mt-3 text-slate-700">Enter a URL above. Nothing is sent anywhere but this site's static files.</p>
          ) : null}
          {!busy && result ? <EvidenceView result={result} onLookup={(u) => void run(u)} /> : null}
        </div>
      </section>

      <MomentumStrip variant="panel" title="What there is to check, counted live" ids={["capsules", "census_rows", "signed_cards"]} />

      <section aria-labelledby="how-heading" className="mt-12">
        <h2 id="how-heading" className="text-xl font-bold text-slate-900">How this works</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-slate-700">
          <li>Your browser normalises the URL and takes its SHA-256. The first two hex characters pick one of 256 static shards.</li>
          <li>
            The shard lists every capsule keyed to that URL. A capsule is one signed record: what was declared, what was observed,
            when, and its limits.
          </li>
          <li>
            “Verify” recomputes the capsule id from its exact bytes, rebuilds the batch's Merkle tree from the published leaves,
            folds the audit path to the batch root, and checks that the index naming that root is signed under the pinned
            board key.
          </li>
        </ol>
        <p className="mt-3 text-sm text-slate-700">
          The same check is open to agents: MCP tools <code>server_evidence</code> and <code>verify_capsule</code> at{" "}
          <code>POST https://councilof.ai/mcp</code>, and the A2A skills <code>server-evidence</code> and{" "}
          <code>measurement-capsules</code>. The published index:{" "}
          <a className="underline underline-offset-4" href="/measurement-capsules/latest.json">/measurement-capsules/latest.json</a>.
          Verification is free.
        </p>
        <p className="mt-2 text-xs text-slate-600">{DOCTRINE}.</p>
      </section>
    </div>
  );
}

export function EvidenceView({ result, onLookup }: { result: Lookup; onLookup?: (url: string) => void }) {
  const groups = new Map<string, ShardCapsule[]>();
  for (const c of result.capsules) groups.set(c.adapter, [...(groups.get(c.adapter) ?? []), c]);
  return (
    <div data-testid="evidence" data-state={result.state} className="mt-3">
      <p className="text-slate-800">
        <span data-testid="lookup-state" className="rounded bg-slate-200 px-2 py-0.5 font-mono text-sm font-semibold text-slate-900">
          {result.state}
        </span>{" "}
        {result.state === "MEASURED" ? `${result.capsules.length} signed capsule${result.capsules.length === 1 ? "" : "s"}.` : null}{" "}
        {LOOKUP_MEANING[result.state] ?? ""}
      </p>
      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="font-semibold text-slate-900">Endpoint</dt>
        <dd className="break-all font-mono text-slate-800">{result.endpoint ?? "— (not an http(s) URL)"}</dd>
        {result.key ? (
          <>
            <dt className="font-semibold text-slate-900">SHA-256 key</dt>
            <dd className="break-all font-mono text-slate-800">{result.key}</dd>
          </>
        ) : null}
        {result.shard_url ? (
          <>
            <dt className="font-semibold text-slate-900">Shard</dt>
            <dd className="break-all font-mono text-slate-800">
              <a className="underline underline-offset-4" href={result.shard_url}>{result.shard_url.replace(/^https?:\/\/[^/]+/, "")}</a>
            </dd>
          </>
        ) : null}
        {result.index_root ? (
          <>
            <dt className="font-semibold text-slate-900">Index root</dt>
            <dd className="break-all font-mono text-slate-800">{result.index_root}{result.as_of ? ` (as of ${result.as_of})` : ""}</dd>
          </>
        ) : null}
        {result.reason ? (
          <>
            <dt className="font-semibold text-slate-900">Why</dt>
            <dd className="text-slate-800">{result.reason}</dd>
          </>
        ) : null}
      </dl>

      {result.endpoint && (result.state === "MEASURED" || result.state === "NOT_MEASURED") ? <FixQueue result={result} onRelookup={onLookup} /> : null}

      {[...groups.entries()].map(([adapter, caps]) => (
        <section key={adapter} className="mt-8" aria-label={ADAPTER_LABEL[adapter] ?? adapter}>
          <h3 className="text-lg font-bold text-slate-900">{ADAPTER_LABEL[adapter] ?? adapter}</h3>
          <ul className="mt-3 space-y-4">
            {caps.map((c) => (
              <li key={`${c.batch.merkle_root}:${c.capsule_id}`}>
                <CapsuleCard capsule={c} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {result.siblings.length ? (
        <section className="mt-8" aria-labelledby="siblings-heading">
          <h3 id="siblings-heading" className="text-lg font-bold text-slate-900">Other URLs we hold capsules about on this origin</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {result.siblings.slice(0, 50).map((u) => (
              <li key={u} className="break-all">
                {onLookup ? (
                  <button type="button" className="text-left font-mono text-slate-900 underline underline-offset-4" onClick={() => onLookup(u)}>
                    {u}
                  </button>
                ) : (
                  <span className="font-mono">{u}</span>
                )}
              </li>
            ))}
          </ul>
          {result.siblings.length > 50 ? <p className="mt-1 text-sm text-slate-600">and {result.siblings.length - 50} more in the shard.</p> : null}
        </section>
      ) : null}
    </div>
  );
}

const OUTCOME_STYLE: Record<Check["outcome"], string> = {
  PASS: "border-emerald-700 bg-emerald-50 text-emerald-900",
  FAIL: "border-red-700 bg-red-50 text-red-900",
  UNCHECKABLE: "border-amber-700 bg-amber-50 text-amber-950",
};

export function CapsuleCard({ capsule: c }: { capsule: ShardCapsule }) {
  const [check, setCheck] = useState<Check | null>(null);
  const [running, setRunning] = useState(false);
  const body = capsuleBody(c);
  const state = c.measurement_state ?? "—";
  const dim = typeof c.claim?.dimension === "string" ? (c.claim.dimension as string) : null;
  const statement = typeof c.claim?.statement === "string" ? (c.claim.statement as string) : null;

  async function verify() {
    if (!c.capsule_json) {
      setCheck({ outcome: "UNCHECKABLE", state: "NO_BYTES", why: "This listing carries no capsule text to re-derive.", recomputed_id: null, claimed_id: c.capsule_id, leaf_index: null, tree_size: null, batch_root: null, recomputed_root: null, signature: null });
      return;
    }
    setRunning(true);
    try {
      setCheck(await verifyCapsuleText(origin(), c.capsule_json, c.capsule_id));
    } catch (e) {
      setCheck({ outcome: "UNCHECKABLE", state: "ERROR", why: (e as Error).message, recomputed_id: null, claimed_id: c.capsule_id, leaf_index: null, tree_size: null, batch_root: null, recomputed_root: null, signature: null });
    } finally {
      setRunning(false);
    }
  }

  return (
    <article data-testid="capsule" data-capsule-id={c.capsule_id} className="rounded-lg border border-slate-300 bg-white p-4">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span data-testid="capsule-state" className="rounded bg-slate-200 px-2 py-0.5 font-mono text-sm font-semibold text-slate-900">{state}</span>
        {dim ? <span className="font-mono text-sm text-slate-800">{dim}</span> : null}
        <span className="font-mono text-xs text-slate-600">{c.kind}</span>
      </header>
      <p className="mt-2 text-sm text-slate-800">{STATE_MEANING[state] ?? "The state as the capsule records it; read its limitations."}</p>
      {statement ? <p className="mt-1 text-sm text-slate-700">Claim checked: {statement}.</p> : null}

      <dl className="mt-3 grid grid-cols-1 gap-x-3 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="font-semibold text-slate-900">Observed at</dt>
        <dd className="font-mono text-slate-800">{c.observed_at ?? "—"}</dd>
        <dt className="font-semibold text-slate-900">Correction</dt>
        <dd className="break-all text-slate-800">{c.correction_pointer ? <span className="font-mono">{String(c.correction_pointer)}</span> : "none recorded"}</dd>
        <dt className="font-semibold text-slate-900">Capsule id</dt>
        <dd className="break-all font-mono text-slate-800">{c.capsule_id}</dd>
        <dt className="font-semibold text-slate-900">Batch root</dt>
        <dd className="break-all font-mono text-slate-800">{c.batch?.merkle_root}</dd>
      </dl>

      {body ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">Declared vs observed</summary>
          <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">Declared</h4>
              <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-100 p-2 text-xs text-slate-900">{pretty(body.declared)}</pre>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">Observed</h4>
              <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-100 p-2 text-xs text-slate-900">{pretty(body.observed)}</pre>
            </div>
          </div>
          {body.differential && Object.keys(body.differential as object).length ? (
            <div className="mt-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">Difference</h4>
              <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-100 p-2 text-xs text-slate-900">{pretty(body.differential)}</pre>
            </div>
          ) : null}
        </details>
      ) : null}

      {c.limitations?.length ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">Limitations ({c.limitations.length})</summary>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {c.limitations.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </details>
      ) : null}

      <div className="mt-3">
        <button
          type="button"
          onClick={() => void verify()}
          disabled={running}
          data-testid="verify-capsule"
          className="rounded-md border border-slate-900 px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-60"
        >
          {running ? "Verifying…" : "Verify this capsule"}
        </button>
        <div aria-live="polite">
          {check ? (
            <div data-testid="verify-result" data-outcome={check.outcome} className={`mt-3 rounded-md border-l-4 p-3 text-sm ${OUTCOME_STYLE[check.outcome]}`}>
              <p>
                <strong className="font-mono">{check.outcome}</strong> <span className="font-mono text-xs">({check.state})</span> — {check.why}
              </p>
              <dl className="mt-2 grid grid-cols-1 gap-x-3 gap-y-0.5 text-xs sm:grid-cols-[auto_1fr]">
                <dt className="font-semibold">Recomputed id</dt>
                <dd className="break-all font-mono">{check.recomputed_id ?? "—"}</dd>
                {check.leaf_index !== null ? (
                  <>
                    <dt className="font-semibold">Leaf</dt>
                    <dd className="font-mono">{check.leaf_index} of {check.tree_size}</dd>
                  </>
                ) : null}
                {check.recomputed_root ? (
                  <>
                    <dt className="font-semibold">Root from path</dt>
                    <dd className="break-all font-mono">{check.recomputed_root}</dd>
                  </>
                ) : null}
                <dt className="font-semibold">Index signature</dt>
                <dd className="font-mono">{check.signature ?? "—"}</dd>
              </dl>
              <p className="mt-2 text-xs">This checks the bytes were published and bound. It says nothing about the server beyond the capsule's own state.</p>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
