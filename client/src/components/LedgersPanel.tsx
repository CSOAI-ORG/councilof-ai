/**
 * LedgersPanel — "Ledgers and corrections": every public ledger with its one authority, count,
 * head, last update and root inclusion, the withdrawals, the claim-maintenance schedule (due, done,
 * failed) and how to verify, all read at runtime from GET /api/state → ledgers
 * (functions/api/_ledgers.ts). Nothing is typed here: a missing field renders as "not recorded".
 *
 * Evidence states are shown as separate fields (signature · OTS calendar pending · Bitcoin verified
 * · public readback), never merged into one badge.
 */
import { useEffect, useState } from "react";

type Row = {
  key: string;
  name: string;
  authority_for: string;
  served_url: string;
  page: string | null;
  count: number | null;
  count_kind: string;
  head_id: string | null;
  head_digest: string | null;
  last_update: string | null;
  read_at: string;
  state: string;
  reason?: string;
  evidence_state: {
    signature: string;
    public_readback: string;
    root_inclusion: string;
    root_leaf_sha256: string | null;
    ots_calendar_pending: boolean | null;
    bitcoin_verified: boolean | null;
    rekor: string | null;
  };
};
type Check = { registry_id: string; check: string; due: string; outcome: string };
type Ledgers = {
  what_this_is: string;
  root: { as_of: string | null; merkle_root: string | null; card_count: number | string | null; rekor: string | null; ots: string | null; note: string };
  ledgers: Row[];
  corrections_in_this_deploy: { count: number; head_id: string | null };
  withdrawals: { signed_mill_cards_withdrawn: number | null; by_correction: Record<string, number> | null; admitted: number; rule: string; corrections_with_withdrawal_status: string[] };
  claim_maintenance: { scheduler: string; schedule_rule: string; state: string; run_at: string | null; counts: Record<string, number> | null; checks: Check[]; failures_feed: string; source: string };
  verify: { what: string; command: string }[];
};

type Load = { state: "reading" } | { state: "ok"; doc: Ledgers } | { state: "failed"; reason: string } | { state: "empty" };

const STALE_MS = 48 * 3600 * 1000;
const short = (s: string | null | undefined, n = 16) => (s ? (s.length > n ? `${s.slice(0, n)}…` : s) : "not recorded");
const yn = (v: boolean | null) => (v === null ? "not stated (head not in the root yet)" : v ? "yes" : "no");

function isStale(iso: string | null | undefined, now: number): boolean {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) && now - t > STALE_MS;
}

function CopyCommand({ label, command }: { label: string; command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        <button
          type="button"
          className="shrink-0 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          aria-label={`Copy command: ${label}`}
          onClick={() => {
            navigator.clipboard?.writeText(command).then(
              () => { setCopied(true); setTimeout(() => setCopied(false), 1500); },
              () => setCopied(false),
            );
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all text-xs text-slate-800"><code>{command}</code></pre>
    </div>
  );
}

export default function LedgersPanel() {
  const [load, setLoad] = useState<Load>({ state: "reading" });
  const now = Date.now();

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/state", { signal: ac.signal, headers: { accept: "application/json" } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const body = await r.json();
        const doc = body?.ledgers as Ledgers | undefined;
        if (!doc || !Array.isArray(doc.ledgers) || doc.ledgers.length === 0) setLoad({ state: "empty" });
        else setLoad({ state: "ok", doc });
      })
      .catch((e) => {
        if (!ac.signal.aborted) setLoad({ state: "failed", reason: e?.message ?? String(e) });
      });
    return () => ac.abort();
  }, []);

  return (
    <section id="ledgers" aria-labelledby="ledgers-h" className="mt-10 scroll-mt-24" data-testid="ledgers-panel">
      <h2 id="ledgers-h" className="text-2xl font-bold tracking-tight text-slate-900">Ledgers and corrections</h2>
      <p className="mt-2 max-w-3xl text-sm text-slate-700">
        Every public ledger we keep, with the one record that is the authority for its kind of entry. Each ledger's
        head is read from the bytes it serves and committed as a leaf of the one daily signed public root. Machine-readable:{" "}
        <a className="underline underline-offset-4" href="/api/state">GET /api/state</a> → <code>ledgers</code>.
      </p>

      {load.state === "reading" ? <p className="mt-4 text-sm text-slate-500" role="status">Reading the ledgers…</p> : null}
      {load.state === "failed" ? (
        <p className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="status">
          The ledgers could not be read on this load ({load.reason}). They are served at <a className="underline" href="/api/state">/api/state</a>.
        </p>
      ) : null}
      {load.state === "empty" ? (
        <p className="mt-4 text-sm text-slate-600" role="status">This deploy's /api/state carries no ledgers block. Nothing is shown in its place.</p>
      ) : null}

      {load.state === "ok" ? (
        <>
          <p className="mt-4 text-sm text-slate-700" data-testid="ledgers-root">
            Public root <code className="break-all">{short(load.doc.root.merkle_root)}</code> as of{" "}
            <time dateTime={load.doc.root.as_of ?? undefined}>{load.doc.root.as_of ?? "not recorded"}</time>, {String(load.doc.root.card_count ?? "?")} leaves ·
            Rekor <code>{load.doc.root.rekor ?? "not recorded"}</code> · OTS <code>{load.doc.root.ots ?? "not recorded"}</code>
            {isStale(load.doc.root.as_of, now) ? <strong className="ml-1 text-amber-800">(stale: older than 48 hours)</strong> : null}
          </p>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2" aria-label="Ledgers">
            {load.doc.ledgers.map((r) => (
              <li key={r.key} className="rounded-2xl border border-slate-200 bg-white p-4" data-testid="ledger-row">
                <h3 className="text-base font-semibold text-slate-900">
                  <a className="underline-offset-4 hover:underline" href={r.page ?? r.served_url}>{r.name}</a>
                </h3>
                <p className="mt-1 text-xs text-slate-600">Authority for: {r.authority_for}</p>
                <dl className="mt-2 grid grid-cols-[auto,1fr] gap-x-2 gap-y-1 text-xs">
                  <dt className="font-medium text-slate-700">Entries</dt>
                  <dd className="text-slate-900">{r.count === null ? `not measured (${r.state}${r.reason ? `: ${r.reason}` : ""})` : `${r.count} (${r.count_kind})`}</dd>
                  <dt className="font-medium text-slate-700">Head</dt>
                  <dd className="break-all text-slate-900"><code>{r.head_id ?? short(r.head_digest)}</code></dd>
                  <dt className="font-medium text-slate-700">Last entry</dt>
                  <dd className="text-slate-900">{r.last_update ?? "not recorded"}</dd>
                  <dt className="font-medium text-slate-700">Read</dt>
                  <dd className="text-slate-900">
                    {r.read_at}
                    {isStale(r.read_at, now) ? <span className="ml-1 text-amber-800">(stale)</span> : null}
                  </dd>
                  <dt className="font-medium text-slate-700">In root</dt>
                  <dd className="text-slate-900"><code>{r.evidence_state.root_inclusion}</code></dd>
                  <dt className="font-medium text-slate-700">Signature</dt>
                  <dd className="text-slate-900">{r.evidence_state.signature}</dd>
                  <dt className="font-medium text-slate-700">OTS pending</dt>
                  <dd className="text-slate-900">{yn(r.evidence_state.ots_calendar_pending)}</dd>
                  <dt className="font-medium text-slate-700">Bitcoin verified</dt>
                  <dd className="text-slate-900">{yn(r.evidence_state.bitcoin_verified)}</dd>
                  <dt className="font-medium text-slate-700">Public readback</dt>
                  <dd className="break-all text-slate-900">{r.evidence_state.public_readback}</dd>
                </dl>
                <p className="mt-2 text-xs"><a className="underline underline-offset-4" href={r.served_url}>Served bytes</a></p>
              </li>
            ))}
          </ul>

          <h3 className="mt-8 text-lg font-semibold text-slate-900" id="withdrawals">Withdrawals</h3>
          <p className="mt-1 text-sm text-slate-700">{load.doc.withdrawals.rule}</p>
          <dl className="mt-2 grid grid-cols-[auto,1fr] gap-x-2 gap-y-1 text-sm" data-testid="withdrawals">
            <dt className="font-medium">Signed mill cards withdrawn</dt>
            <dd>{load.doc.withdrawals.signed_mill_cards_withdrawn ?? "not measured"}</dd>
            <dt className="font-medium">Counted as admitted</dt>
            <dd>{load.doc.withdrawals.admitted}</dd>
            <dt className="font-medium">By correction</dt>
            <dd>
              {Object.entries(load.doc.withdrawals.by_correction ?? {}).map(([id, n], i) => (
                <span key={id}>{i ? ", " : ""}<a className="underline" href={`#${id}`}>{id}</a> ({n})</span>
              ))}
            </dd>
            <dt className="font-medium">Entries with a withdrawal status</dt>
            <dd>
              {load.doc.withdrawals.corrections_with_withdrawal_status.length
                ? load.doc.withdrawals.corrections_with_withdrawal_status.map((id, i) => (
                    <span key={id}>{i ? ", " : ""}<a className="underline" href={`#${id}`}>{id}</a></span>
                  ))
                : "none"}
            </dd>
          </dl>

          <h3 className="mt-8 text-lg font-semibold text-slate-900" id="claim-maintenance">Claim maintenance: re-check schedule</h3>
          <p className="mt-1 text-sm text-slate-700">{load.doc.claim_maintenance.schedule_rule}</p>
          <p className="mt-1 text-xs text-slate-600">
            {load.doc.claim_maintenance.scheduler} Last run: {load.doc.claim_maintenance.run_at ?? "not recorded"}
            {isStale(load.doc.claim_maintenance.run_at, now) ? <span className="ml-1 text-amber-800">(stale)</span> : null}
          </p>
          {load.doc.claim_maintenance.checks.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600" role="status">
              No executed schedule has been read yet ({load.doc.claim_maintenance.state}). Nothing is shown in its place.
            </p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[20rem] text-left text-xs" data-testid="claim-checks">
                <caption className="sr-only">Claim-maintenance checks with due date and outcome</caption>
                <thead>
                  <tr className="border-b border-slate-200">
                    <th scope="col" className="py-1 pr-2">Registry</th>
                    <th scope="col" className="py-1 pr-2">Check</th>
                    <th scope="col" className="py-1 pr-2">Due</th>
                    <th scope="col" className="py-1">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {load.doc.claim_maintenance.checks.map((c) => (
                    <tr key={`${c.registry_id}|${c.check}`} className="border-b border-slate-100 align-top">
                      <td className="break-all py-1 pr-2">{c.registry_id.replace(/^claimreg-/, "")}</td>
                      <td className="py-1 pr-2">{c.check}</td>
                      <td className="py-1 pr-2"><time dateTime={c.due}>{c.due}</time></td>
                      <td className="py-1"><code>{c.outcome}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-xs text-slate-600">
            {load.doc.claim_maintenance.failures_feed} <a className="underline" href={load.doc.claim_maintenance.source}>Executed schedule (JSON)</a>
          </p>

          <h3 className="mt-8 text-lg font-semibold text-slate-900" id="verify">How to verify</h3>
          <div className="mt-2 grid gap-2">
            {load.doc.verify.map((v) => <CopyCommand key={v.what} label={v.what} command={v.command} />)}
          </div>
        </>
      ) : null}
    </section>
  );
}
