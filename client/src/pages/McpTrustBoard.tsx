/**
 * MCP Trust Board — /trust (alias /boards/mcp)
 * Style: match AttestationNetwork / PricingFree dark emerald (bg #03110b)
 *
 * Renders the counts-only handshake census at /interop/mcp-trust/latest.json
 * (scripts/mcp-trust-round.py, docs/product/MCP-TRUST-BOARD-SPEC.md).
 *
 * LOCKS:
 * - Counts are DERIVED from the artifact at load — never typed into this file.
 * - A bucket is never a grade. A 401/402 is a term sheet, not delivery.
 * - UNREACHABLE is never FAIL. Host details are withheld by design.
 * - No artifact yet → the page shows the empty state; UNMEASURED stays visible.
 * - Measurement, never certification. Public names: Council of AI only.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

type Snapshot = {
  kind?: string;
  as_of?: string;
  partial?: boolean;
  enumeration?: {
    source?: string;
    unique_hosts?: number;
    registry_rows_seen?: number;
    complete?: boolean;
    stop_reason?: string;
  };
  counts?: Record<string, number>;
  headline?: string;
  method?: string;
  doctrine?: string;
  not?: string;
  third_party_context?: string;
};

const BUCKET_ORDER: { key: string; label: string; tone: string }[] = [
  { key: "initialize_ok_tools_listed", label: "Answered handshake · tools counted", tone: "text-emerald-300" },
  { key: "initialize_ok_open", label: "Answered handshake · open", tone: "text-emerald-300" },
  { key: "auth_challenged_401_403", label: "Auth challenge (401/403 — a term sheet, not delivery)", tone: "text-amber-300" },
  { key: "x402_challenged_402", label: "Payment challenge (402 — an invoice, not delivery)", tone: "text-amber-300" },
  { key: "alive_not_mcp", label: "Alive, but no protocol-valid MCP reply", tone: "text-slate-300" },
  { key: "listed_no_reply", label: "Listed, no usable reply", tone: "text-slate-400" },
  { key: "dead_404_or_unreachable", label: "Unreachable or gone (never FAIL)", tone: "text-slate-400" },
  { key: "other_error", label: "Other error", tone: "text-slate-400" },
];

function BucketBar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className={`font-mono ${tone}`}>{value}</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-slate-800">
        <div className="h-1.5 rounded-full bg-emerald-500/70" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function McpTrustBoard() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "empty">("loading");

  useEffect(() => {
    document.title = "MCP Trust Board — who answers the handshake, under what terms | Council of AI";
    setMetaDescription(
      "A measured, read-only handshake census of internet-facing MCP servers: who answers initialize, who challenges with auth, who is unreachable. Counts only — measurement, never certification.",
    );
  }, []);

  useEffect(() => {
    let ok = true;
    fetch("/interop/mcp-trust/latest.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Snapshot) => {
        if (!ok) return;
        if (d?.kind === "csoai.mcp-trust-snapshot/0.1" && d.counts) {
          setSnap(d);
          setState("ok");
        } else {
          setState("empty");
        }
      })
      .catch(() => ok && setState("empty"));
    return () => {
      ok = false;
    };
  }, []);

  const counts = snap?.counts || {};
  const total = counts.total || 0;

  return (
    <div className="min-h-screen bg-[#03110b] px-4 py-14 text-slate-200">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-400">
          Measurement, never certification
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-50">
          The MCP Trust Board
        </h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          One question per round: <em className="text-slate-200">how many publicly enumerable
          MCP servers answer a correct protocol handshake, and under what authentication
          posture?</em> Nothing more. Never server quality, never safety, never a trust score.
          Host names are withheld by design — naming is not the product.
        </p>

        {state === "loading" && (
          <p className="mt-10 font-mono text-sm text-slate-400">
            Loading the latest round from <code>/interop/mcp-trust/latest.json</code>…
          </p>
        )}

        {state === "empty" && (
          <div className="mt-10 rounded-2xl border border-slate-700 bg-slate-950/50 p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
              UNMEASURED — first-class empty
            </p>
            <p className="mt-2 text-slate-300">
              No completed round is published yet. The cell stays empty until a published
              round exists — empty is not zero, and it is never interpolated.
            </p>
          </div>
        )}

        {state === "ok" && snap && (
          <>
            <div className="mt-10 rounded-2xl border border-emerald-400/30 bg-emerald-950/40 p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400">
                Latest round · {snap.as_of}
                {snap.partial ? " · PARTIAL" : ""}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-100">{snap.headline}</p>
              <p className="mt-2 text-xs text-slate-500">
                Enumeration: {snap.enumeration?.unique_hosts ?? "—"} unique hosts from{" "}
                {snap.enumeration?.registry_rows_seen ?? "—"} registry rows (
                {snap.enumeration?.source}).{" "}
                {snap.enumeration?.complete
                  ? "Enumeration complete to the registry's stated end."
                  : `Enumeration incomplete — recorded, never passed off as complete (${snap.enumeration?.stop_reason}).`}
              </p>
            </div>

            <div className="mt-8 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-6">
              {BUCKET_ORDER.map(({ key, label, tone }) => (
                <BucketBar key={key} label={label} value={counts[key] || 0} total={total} tone={tone} />
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">Auth posture observed</p>
                <p className="mt-2 text-2xl font-bold text-slate-50">{counts.auth_scheme_bearer_or_oauth || 0}</p>
                <p className="text-xs text-slate-400">challenges indicating bearer/OAuth-family schemes</p>
              </div>
              <div className="rounded-xl border border-slate-800 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">Tools listed (aggregate)</p>
                <p className="mt-2 text-2xl font-bold text-slate-50">{counts.tools_listed_total || 0}</p>
                <p className="text-xs text-slate-400">
                  across {counts.servers_reporting_tools || 0} answering servers · median{" "}
                  {counts.tools_median_per_answering_server ?? 0} each — counted, never called, never named
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">Rate-limited probes</p>
                <p className="mt-2 text-2xl font-bold text-slate-50">{counts.rate_limited || 0}</p>
                <p className="text-xs text-slate-400">the board backs off; it never retries into a rate limit</p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-400">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">What this does not measure</p>
              <p className="mt-2">{snap.not}</p>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">Third-party context</p>
              <p className="mt-2">{snap.third_party_context}</p>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">Method</p>
              <p className="mt-2">{snap.method}</p>
            </div>
          </>
        )}

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-400">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">The rules of this board</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>Read-only by construction: one <code>initialize</code> per host per week; one{" "}
              <code>tools/list</code> only if the handshake answers. Tools are counted, never called.</li>
            <li>No authentication is ever attempted — the board holds no credentials and never will.</li>
            <li>A 401/402 challenge is recorded as a term sheet. It is never a verdict.</li>
            <li>UNREACHABLE is never FAIL. A timeout says where we stood, not what they are.</li>
            <li>Counts, snapshots and diffs are free, public, forever. A named party may commission
              a signed card for <em>their own</em> server via the existing metered door; host-level
              data about other parties' servers is not for sale at any price.</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-4">
            <a href="/interop/mcp-trust/latest.json" className="text-emerald-300 underline-offset-2 hover:underline">
              Machine artefact (JSON)
            </a>
            <a href="https://github.com/CSOAI-ORG/councilof-ai/blob/master/docs/product/MCP-TRUST-BOARD-SPEC.md"
               className="text-emerald-300 underline-offset-2 hover:underline">
              Methodology spec
            </a>
            <Link href="/attestation" className="text-emerald-300 underline-offset-2 hover:underline">
              How signing works
            </Link>
            <Link href="/doctrine" className="text-emerald-300 underline-offset-2 hover:underline">
              Doctrine
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
