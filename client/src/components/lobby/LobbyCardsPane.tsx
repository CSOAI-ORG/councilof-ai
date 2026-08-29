import { useCallback, useEffect, useMemo, useState } from "react";
import { FOCUS, MEASURE, PRIMARY, SP, TYPE } from "./glass";
import { PaneHead } from "./paneKit";
import { fetchPinnedCardKey, verifyCard, type CardVerdict } from "@/lib/cardVerify";

/**
 * LobbyCardsPane — "Signed cards", NATIVE in Council OS.
 *
 * WHAT IT DOES. Reads the published card index, lists what it declares, and
 * VERIFIES any card the reader picks — fetching the card, recomputing the sha256
 * of its canonical body, and checking the Ed25519 signature against the key in
 * the estate's DID document. Everything happens in the reader's browser. No
 * account, no request to us beyond the two static files, and the result is a
 * fact the reader established rather than one we asserted.
 *
 * WHY IT IS A TAB. The estate publishes 150 signed cards and a JavaScript
 * verifier for them, and until now Council OS exposed neither: the Verify pane
 * accepted a pasted record and offered no way to GET one. A verifier with
 * nothing to verify is a demo of a capability, not the capability.
 *
 * THE COUNT IS THE INDEX'S, NOT THE DIRECTORY'S. `public/signed/cards/` holds
 * more files than the index names. The index is the authority — BOARD-RULING.md
 * freezes the board at the verifiable floor of what the published index actually
 * contains — so this pane lists `index.cards` and never counts files. The
 * headline figure is `index.cards.length`, and the index's own `n_cards` is
 * shown beside it so a disagreement between the two would be visible rather
 * than resolved silently in our favour.
 *
 * VERIFYING IS ALWAYS A DELIBERATE ACT. Cards are fetched one at a time, on a
 * click. "Verify all" exists, runs the same code path over every declared card,
 * and reports VALID / INVALID / UNCHECKABLE as three separate tallies — never a
 * pass rate, which would hide an uncheckable card inside a percentage.
 */

interface IndexRow {
  card: string;
  axis: string;
  ts?: string;
  signed?: boolean;
  kid?: string;
}

interface CardIndex {
  rows: IndexRow[];
  /** The index's own declared count. Shown BESIDE rows.length, never instead of it. */
  declaredNCards: number | null;
  pubkey: string;
  head: string;
  created: string;
  packagedAt: string;
}

type IndexState =
  | { phase: "loading" }
  | { phase: "ready"; index: CardIndex }
  | { phase: "failed"; error: string };

const str = (v: unknown): string => (typeof v === "string" ? v : "");

async function fetchIndex(signal?: AbortSignal): Promise<CardIndex> {
  const r = await fetch("/signed/card_index.json", { signal, headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`GET /signed/card_index.json → HTTP ${r.status}`);
  const j: any = await r.json();
  const rows: IndexRow[] = (Array.isArray(j?.cards) ? j.cards : [])
    .filter((c: any) => c && typeof c.card === "string" && c.card)
    .map((c: any) => ({
      card: c.card,
      axis: str(c.axis) || "(unnamed)",
      ts: c.ts ? str(c.ts) : undefined,
      signed: c.signed === true,
      kid: c.kid ? str(c.kid) : undefined,
    }));
  if (!rows.length) throw new Error("the published index declares no cards");
  return {
    rows,
    declaredNCards: typeof j?.n_cards === "number" ? j.n_cards : null,
    pubkey: str(j?.pubkey),
    head: str(j?.head),
    created: str(j?.created),
    packagedAt: str(j?.packaged_at),
  };
}

const TONE: Record<CardVerdict["state"], string> = {
  VALID: "border-emerald-700/30 bg-emerald-50 text-emerald-900",
  INVALID: "border-rose-700/30 bg-rose-50 text-rose-900",
  UNCHECKABLE: "border-amber-700/30 bg-amber-50 text-amber-900",
};

export default function LobbyCardsPane({
  onOpenRoute,
}: {
  onOpenRoute: (path: string, label: string) => void;
}) {
  const [state, setState] = useState<IndexState>({ phase: "loading" });
  const [key, setKey] = useState<Uint8Array | null | "pending">("pending");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Record<string, CardVerdict>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [sweeping, setSweeping] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    fetchIndex(ac.signal)
      .then((index) => setState({ phase: "ready", index }))
      .catch((e: any) => {
        if (!ac.signal.aborted) setState({ phase: "failed", error: String(e?.message ?? e) });
      });
    fetchPinnedCardKey(ac.signal).then((k) => {
      if (!ac.signal.aborted) setKey(k);
    });
    return () => ac.abort();
  }, []);

  const rows = state.phase === "ready" ? state.index.rows : [];

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => r.axis.toLowerCase().includes(t) || r.card.toLowerCase().startsWith(t));
  }, [rows, q]);

  const check = useCallback(
    async (id: string): Promise<CardVerdict> => {
      let card: unknown;
      try {
        const r = await fetch(`/signed/cards/${id}.json`, { headers: { accept: "application/json" } });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        card = await r.json();
      } catch (e: any) {
        // The card could not be fetched. That is a fact about the fetch, not
        // about the card, so it is UNCHECKABLE and never INVALID.
        return { state: "UNCHECKABLE", reason: `The card could not be fetched: ${e?.message ?? e}.`, id };
      }
      return verifyCard(card, key === "pending" ? null : key);
    },
    [key],
  );

  const verifyOne = useCallback(
    async (id: string) => {
      setBusy(id);
      const v = await check(id);
      setResults((p) => ({ ...p, [id]: v }));
      setBusy(null);
    },
    [check],
  );

  const verifyAll = useCallback(async () => {
    setSweeping(true);
    const next: Record<string, CardVerdict> = {};
    for (const r of rows) {
      // Sequential on purpose: 150 parallel fetches is a burst a reader did not
      // ask for, and the tally is the point rather than the wall-clock time.
      next[r.card] = await check(r.card);
      setResults({ ...next });
    }
    setSweeping(false);
  }, [rows, check]);

  const tally = useMemo(() => {
    const t = { VALID: 0, INVALID: 0, UNCHECKABLE: 0 };
    for (const v of Object.values(results)) t[v.state] += 1;
    return t;
  }, [results]);

  const checked = tally.VALID + tally.INVALID + tally.UNCHECKABLE;

  return (
    <div className={`${SP.panel} h-full overflow-y-auto`}>
      <PaneHead eyebrow="Signed cards" title="Check a published card yourself, here">
        Every card the published index declares. Pick one and this pane fetches it, recomputes the
        sha256 of its canonical body, and checks the Ed25519 signature against{" "}
        <code className="font-mono text-[12px]">did:web:csoai.org#card-attestation-1</code> — in your
        browser, with no account. The result is something you established, not something we told you.
        Card-v1 only — VALID · INVALID · UNCHECKABLE. No attachment table on the card.
      </PaneHead>

      {state.phase === "loading" && (
        <p className={`mt-6 rounded-xl border border-slate-900/10 bg-white/80 px-4 py-3 ${TYPE.muted}`}>
          Reading <code className="font-mono text-[11px]">/signed/card_index.json</code>…
        </p>
      )}

      {state.phase === "failed" && (
        <div className="mt-6 rounded-xl border border-amber-600/35 bg-amber-50 px-4 py-3.5">
          <p className="text-[13px] font-semibold text-amber-900">The published card index did not answer.</p>
          <p className={`mt-1.5 ${MEASURE} text-[12px] leading-relaxed text-amber-900/90`}>
            No card list is shown, and no count is shown in its place.
          </p>
          <p className="mt-2 font-mono text-[11px] text-amber-900/80">{state.error}</p>
        </div>
      )}

      {state.phase === "ready" && (
        <>
          <div className="mt-5 rounded-2xl border border-slate-900/10 bg-white/85 p-4">
            <p className={`${MEASURE} ${TYPE.body}`}>
              <strong>{state.index.rows.length}</strong> cards declared by the index
              {state.index.declaredNCards !== null && state.index.declaredNCards !== state.index.rows.length && (
                <>
                  {" "}
                  — though the index's own <code className="font-mono text-[12px]">n_cards</code> says{" "}
                  <strong>{state.index.declaredNCards}</strong>, which is a defect in the artefact and
                  is shown rather than reconciled here.
                </>
              )}
              {state.index.declaredNCards === state.index.rows.length && (
                <>
                  , matching its own <code className="font-mono text-[12px]">n_cards</code>.
                </>
              )}
            </p>
            <p className={`mt-2 ${MEASURE} ${TYPE.fine}`}>
              The repository carries more card files than the index names. The index is the
              authority: this list is what it declares, never what a directory contains.
            </p>
            <dl className="mt-3 space-y-1">
              {state.index.created && (
                <div className="flex flex-wrap gap-x-2">
                  <dt className={TYPE.mono}>created</dt>
                  <dd className={TYPE.fine}>{state.index.created}</dd>
                </div>
              )}
              {state.index.packagedAt && (
                <div className="flex flex-wrap gap-x-2">
                  <dt className={TYPE.mono}>packaged at</dt>
                  <dd className={TYPE.fine}>{state.index.packagedAt}</dd>
                </div>
              )}
              {state.index.head && (
                <div className="flex flex-wrap gap-x-2">
                  <dt className={TYPE.mono}>chain head</dt>
                  <dd className={`${TYPE.fine} break-all font-mono`}>{state.index.head}</dd>
                </div>
              )}
            </dl>
            {key === null && (
              <p className="mt-3 rounded-lg border border-amber-700/30 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-900">
                The published card key could not be read from{" "}
                <code className="font-mono text-[11px]">/.well-known/did.json</code>, so nothing below
                can be verified — every result will say <strong>UNCHECKABLE</strong>. That is a
                statement about this browser session, not about the cards.
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
            <label htmlFor="coai-cards-q" className="block min-w-[14rem] flex-1">
              <span className="block text-[12.5px] font-semibold text-slate-900">Find a card</span>
              <span className={`mt-0.5 block ${TYPE.fine}`}>By axis name, or by the start of its id.</span>
              <input
                id="coai-cards-q"
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g. care-refusal, or 8299…"
                className={`mt-1.5 w-full rounded-xl border border-slate-900/15 bg-white px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-500 ${FOCUS}`}
              />
            </label>
            <button
              type="button"
              onClick={() => void verifyAll()}
              disabled={sweeping || key === "pending"}
              className={`${PRIMARY} px-3.5 py-2 text-[12.5px] disabled:opacity-40`}
            >
              {sweeping ? `Verifying… ${checked}/${state.index.rows.length}` : `Verify all ${state.index.rows.length}`}
            </button>
          </div>

          {checked > 0 && (
            <p className={`mt-3 rounded-xl border border-slate-900/10 bg-white/85 px-4 py-2.5 ${TYPE.body}`}>
              {/* Three tallies, never a pass rate — a percentage would fold an
                  uncheckable card in with a verified one. */}
              <strong>{tally.VALID}</strong> VALID · <strong>{tally.INVALID}</strong> INVALID ·{" "}
              <strong>{tally.UNCHECKABLE}</strong> UNCHECKABLE, of {checked} checked. Counted, not
              scored — an uncheckable card is not a failed one and is never averaged into a rate.
            </p>
          )}

          <p className={`mt-5 ${TYPE.section}`}>
            {shown.length === state.index.rows.length
              ? `All ${shown.length} declared cards`
              : `${shown.length} of ${state.index.rows.length} declared cards`}
          </p>

          <ul className="mt-2 grid gap-2 lg:grid-cols-2">
            {shown.map((r) => {
              const v = results[r.card];
              return (
                <li key={r.card} className="rounded-xl border border-slate-900/10 bg-white/85 p-3.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[13px] font-semibold text-slate-900">{r.axis}</span>
                    {v && (
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wide ${TONE[v.state]}`}
                      >
                        {v.state}
                      </span>
                    )}
                  </div>
                  <a
                    href={`/signed/cards/${r.card}.json`}
                    target="_blank"
                    rel="noreferrer"
                    className={`mt-1 block break-all font-mono text-[10.5px] text-emerald-800 underline decoration-emerald-800/40 underline-offset-2 ${FOCUS}`}
                  >
                    {r.card}
                  </a>
                  {r.ts && <p className={`mt-1 ${TYPE.mono}`}>signed {r.ts}</p>}
                  {v && <p className={`mt-2 ${MEASURE} text-[12px] leading-relaxed text-slate-700`}>{v.reason}</p>}
                  <button
                    type="button"
                    onClick={() => void verifyOne(r.card)}
                    disabled={busy === r.card || sweeping}
                    className={`mt-2.5 rounded-lg border border-slate-900/12 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-slate-700 transition hover:bg-slate-900/5 disabled:opacity-40 motion-reduce:transition-none ${FOCUS}`}
                  >
                    {busy === r.card ? "Verifying…" : v ? "Verify again" : "Verify this card"}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-7 rounded-2xl border border-slate-900/10 bg-slate-50/80 p-5">
            <h3 className={TYPE.section}>What a card is, and what it is not</h3>
            <ul className={`mt-2 space-y-2 ${MEASURE} text-[12.5px] leading-relaxed text-slate-700`}>
              <li>
                <strong>A card is frozen.</strong> Its id is the sha256 of its body, so nothing in it
                can be edited without invalidating every citation of it. That means a card can carry
                wording that has since been superseded — read the live count from{" "}
                <code className="font-mono text-[11.5px]">GET /api/gspc</code>, never from a card.
              </li>
              <li>
                <strong>A card is a measurement, not a certification.</strong> It records that a run
                happened and what it produced. It is not a conformity mark and we issue none.
              </li>
              <li>
                <strong>Verifying costs nothing and needs nobody.</strong> The same check runs from
                the command line with{" "}
                <a
                  href="/signed/verify-card.mjs"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[11.5px] text-emerald-800 underline decoration-emerald-800/40 underline-offset-2"
                >
                  /signed/verify-card.mjs
                </a>{" "}
                — this pane is the same algorithm, and a test fails the build if the two ever
                disagree on a published card.
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => onOpenRoute("/gspc-verify", "Verify a card")}
                className={`rounded-xl border border-slate-900/12 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 transition hover:bg-slate-900/5 motion-reduce:transition-none ${FOCUS}`}
              >
                Verify a record you were given
              </button>
              <a
                href="/signed/HOW-TO-VERIFY.md"
                target="_blank"
                rel="noreferrer"
                className={`rounded-xl border border-slate-900/12 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 transition hover:bg-slate-900/5 motion-reduce:transition-none ${FOCUS}`}
              >
                How to verify, written out ↗
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
