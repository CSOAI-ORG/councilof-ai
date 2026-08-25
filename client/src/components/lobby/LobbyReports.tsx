import { useCallback, useEffect, useState } from "react";
import { DOT, SP, TONE, TYPE, insetStyle } from "./glass";

/**
 * LobbyReports — the "Reports" section of the right rail.
 *
 * Links to the estate's signed / public artefacts, each with an HONEST live
 * state. Every figure below is read out of the response body at the moment it
 * arrives, or it is not shown at all. There is no cached fallback and no
 * hardcoded count anywhere in this file: a failed fetch says FAILED, shows the
 * reason, and shows no number in its place.
 *
 * The signature line is likewise read, never asserted: an artefact that ships no
 * signature is reported as "no signature in the response", which is a fact about
 * the response — not a claim that it was signed.
 */

type State = "idle" | "running" | "ok" | "failed";

type Report = {
  id: string;
  label: string;
  /** What the artefact IS, in one line. */
  what: string;
  endpoint: string;
  /** Optional human page for the same material. */
  page?: string;
  state: State;
  detail?: string;
  signature?: string;
  reason?: string;
};

const INITIAL: Report[] = [
  {
    id: "board",
    label: "The board",
    what: "Measured axes, the ones that carry no number, and the stamp on both.",
    endpoint: "/api/gspc",
    page: "/gspc-scoreboard",
    state: "idle",
  },
  {
    id: "corrections",
    label: "Corrections ledger",
    what: "What the estate got wrong, how it was caught, and the fix. Appended, never edited.",
    endpoint: "/api/corrections",
    state: "idle",
  },
  {
    id: "regulation",
    label: "Regulation feed",
    what: "Verified obligation dates with the legal basis for each.",
    endpoint: "/api/regulation",
    state: "idle",
  },
];

/**
 * Read a date STRING out of a body, or nothing.
 *
 * /api/gspc ships `measured_on` as an OBJECT ({model, endpoint, date, …}), so
 * the obvious `${j.measured_on}` renders the literal text "[object Object]" —
 * which is what the previous rail shipped. Anything that is not a string is
 * treated as absent: an unreadable stamp is no stamp, never a rendered object.
 */
function stampOf(j: any): string | null {
  const m = j?.measured_on;
  if (typeof m === "string") return m;
  if (m && typeof m === "object" && typeof m.date === "string") return m.date;
  if (typeof j?.date === "string") return j.date;
  return null;
}

/** Read a signature line out of a body without ever inventing one. */
function signatureOf(j: any): string {
  const s = j?.signature;
  if (!s) return "no signature in the response";
  if (typeof s === "string") return `signed · ${s.slice(0, 24)}…`;
  if (s.error) return `signature error · ${s.error}`;
  const state = j?.signature_state;
  const alg = s.alg ? String(s.alg) : "signed";
  const signer = s.signer ? String(s.signer) : "";
  return `${alg}${state ? ` · ${state}` : ""}${signer ? ` · ${signer}` : ""}`;
}

export default function LobbyReports({
  onOpenRoute,
}: {
  /** Open a route in the lobby pane — keeps the OS session alive. Without it the
   *  human-page link falls back to a full navigation (which ends the session). */
  onOpenRoute?: (path: string, label: string) => void;
}) {
  const [rows, setRows] = useState<Report[]>(INITIAL);
  const [busy, setBusy] = useState(false);
  const [ranAt, setRanAt] = useState<string | null>(null);

  const set = (id: string, patch: Partial<Report>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const run = useCallback(async () => {
    setBusy(true);
    setRows(INITIAL.map((r) => ({ ...r, state: "running" as State })));

    const grab = async (id: string, url: string, read: (j: any) => string) => {
      try {
        const r = await fetch(url, { headers: { accept: "application/json" } });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const j: any = await r.json();
        const detail = read(j);
        if (!detail) throw new Error("response carried nothing to report");
        set(id, { state: "ok", detail, signature: signatureOf(j) });
      } catch (e: any) {
        set(id, { state: "failed", reason: String(e?.message ?? e) });
      }
    };

    await grab("board", "/api/gspc", (j) => {
      const t = j?.totals ?? {};
      const bits: string[] = [];
      // Prefer the API's own published phrasing when it ships one — it is the
      // ruling, not our paraphrase of it.
      if (typeof t.public_count === "string") bits.push(t.public_count);
      else if (typeof t.axes === "number") bits.push(`${t.axes} axes`);
      if (typeof t.items === "number") bits.push(`${t.items.toLocaleString()} items`);
      const stamp = stampOf(j);
      if (stamp) bits.push(`measured ${stamp}`);
      return bits.join(" · ");
    });

    await grab("corrections", "/api/corrections", (j) => {
      const n = Array.isArray(j?.corrections) ? j.corrections.length : null;
      const latest = n ? j.corrections[n - 1] : null;
      const bits: string[] = [];
      if (n !== null) bits.push(`${n} published correction${n === 1 ? "" : "s"}`);
      if (latest?.date && latest?.id) bits.push(`latest ${latest.id} (${latest.date})`);
      return bits.join(" · ");
    });

    await grab("regulation", "/api/regulation", (j) => {
      const n = Array.isArray(j?.deadlines) ? j.deadlines.length : null;
      const bits: string[] = [];
      if (n !== null) bits.push(`${n} verified deadline${n === 1 ? "" : "s"}`);
      if (j?.verified_as_of) bits.push(`verified as of ${j.verified_as_of}`);
      const d = Array.isArray(j?.disputed) ? j.disputed.length : 0;
      if (d) bits.push(`${d} openly disputed`);
      return bits.join(" · ");
    });

    setRanAt(new Date().toISOString().replace("T", " ").slice(0, 19) + "Z");
    setBusy(false);
  }, []);

  useEffect(() => { void run(); }, [run]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-3">
        <h3 className={TYPE.section}>Signed &amp; public artefacts</h3>
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy}
          className="ml-auto rounded-lg border border-slate-900/10 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-white disabled:opacity-40 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 outline-none"
        >
          {busy ? "checking…" : "re-check"}
        </button>
      </div>

      <ul className={`${SP.stackTight} overflow-y-auto`}>
        {rows.map((r) => (
          <li key={r.id} className={`${SP.card} rounded-xl border border-slate-900/10`} style={insetStyle}>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[r.state]}`} aria-hidden="true" />
              <span className="text-[12.5px] font-semibold text-slate-900">{r.label}</span>
              <span
                className={`ml-auto rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wide ${
                  r.state === "ok" ? TONE.ok : r.state === "failed" ? TONE.failed : r.state === "running" ? TONE.running : TONE.idle
                }`}
              >
                {r.state === "ok" ? "live" : r.state}
              </span>
            </div>

            <p className={`mt-1.5 ${TYPE.fine}`}>{r.what}</p>

            {r.state === "ok" && (
              <>
                <p className="mt-2 text-[11.5px] leading-snug text-slate-800">{r.detail}</p>
                <p className={`mt-1 ${TYPE.mono}`}>{r.signature}</p>
              </>
            )}
            {r.state === "failed" && (
              <p className="mt-2 text-[11.5px] leading-snug text-rose-800">
                Failed — {r.reason}.
                <span className="mt-0.5 block text-rose-800">No value is shown in its place.</span>
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
              <a
                href={r.endpoint}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[10.5px] text-emerald-800 underline underline-offset-2 hover:text-emerald-900 outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 rounded"
              >
                {r.endpoint} ↗
              </a>
              {r.page && (onOpenRoute ? (
                <button
                  type="button"
                  onClick={() => onOpenRoute(r.page!, r.label)}
                  className="text-[10.5px] font-semibold text-slate-600 underline underline-offset-2 hover:text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 rounded"
                >
                  human page →
                </button>
              ) : (
                <a
                  href={r.page}
                  className="text-[10.5px] font-semibold text-slate-600 underline underline-offset-2 hover:text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 rounded"
                >
                  human page ↗
                </a>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <p className={`mt-auto pt-4 ${TYPE.fine}`}>
        Each row is a live fetch made just now. Nothing on this rail is stored in the page, and a
        failure is reported as a failure.
        {ranAt && <span className="mt-1 block font-mono text-[10px] text-slate-600">last checked {ranAt}</span>}
      </p>
    </div>
  );
}
