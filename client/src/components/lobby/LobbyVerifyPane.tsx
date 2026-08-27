import { useEffect, useState } from "react";
import RecordVerifyForm from "@/components/gspc/RecordVerifyForm";
import { markQuest } from "@/components/os/quests";
import { FOCUS, SP, TYPE } from "./glass";

/**
 * LobbyVerifyPane — the Council OS verify tool. Native, no iframe.
 *
 * WHAT WAS WRONG HERE (2026-08-26). This pane rendered the form and nothing else,
 * and the shared verifier behind it hashed the wrong bytes: pasting one of the
 * estate's OWN published cards returned
 *
 *     content_id: Absent — hash check not applicable.
 *     Signature: INVALID — no published key verifies this signature.
 *
 * for a card that /signed/verify-card.mjs — our own published offline verifier —
 * calls VALID. The single loudest claim this estate makes ("anyone can re-check a
 * card, free, with no account") was refuted by the estate's own front door. The
 * verifier is now functions/_lib/cardVerify.ts, which implements the published rule
 * in /signed/HOW-TO-VERIFY.md, including the CPython float quirk that makes a naive
 * JavaScript verifier fail a third of the corpus.
 *
 * WHAT THIS PANE ADDS AROUND IT. A tool nobody can exercise is a tool nobody
 * trusts, so the pane fetches /signed/chain.json and offers a REAL published card
 * to check — the chain head, or any published position at random. Nothing is
 * bundled: if the chain cannot be read, the buttons do not appear and the pane
 * says why. Every number on this pane is read out of chain.json; none is typed.
 *
 * IT ALSO STATES THE LIMIT. A ✓ means the bytes reproduce the id and the signature
 * checks out under a key published at did:web:csoai.org. It does not mean the
 * measurement is right, and it is not a certification.
 */

type CardRef = {
  id: string;
  url: string;
};

/**
 * Where the sample cards came from, so the pane can name it.
 *
 * TWO SOURCES ON PURPOSE. /signed/chain.json is the richest — every position,
 * including the ones whose body is withheld — and it is the manifest /api/state
 * names. It was DELETED from master on 2026-08-26 (commit 43198c1f, "drop 335
 * chain.json after fat merge") while /api/state kept publishing its URL, so this
 * pane's loader went dead overnight. /signed/card_index.json is the exact-150
 * curated index the board-floor workflows defend, and it is still served. The pane
 * reads the chain when it is there, falls back to the index when it is not, and
 * SAYS which one it used — it never quotes chain totals off the index.
 */
type Source =
  | { kind: "chain"; positions: number; published: number; withheld: number }
  | { kind: "index"; listed: number };

type LoadState =
  | { phase: "loading" }
  | { phase: "ready"; source: Source; cards: CardRef[]; head: string | null }
  | { phase: "failed"; error: string };

async function readJson(url: string, signal?: AbortSignal): Promise<any> {
  const r = await fetch(url, { signal, headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`GET ${url} \u2192 HTTP ${r.status}`);
  const ct = (r.headers.get("content-type") || "").toLowerCase();
  // A dev server's SPA fallback answers 200 text/html for a missing file. Treat
  // that as absent rather than letting JSON.parse report a syntax error.
  if (ct.includes("text/html")) throw new Error(`GET ${url} returned HTML, not JSON \u2014 the file is not there`);
  return r.json();
}

async function fromChain(signal?: AbortSignal): Promise<Extract<LoadState, { phase: "ready" }>> {
  const raw = await readJson("/signed/chain.json", signal);
  // Since 2026-08-27 chain.json is card-shaped — {body: manifest, id, pubkey,
  // signature} — so the manifest itself verifies under /signed/verify-card.mjs.
  // Read the body when the envelope is present; accept the old flat shape too.
  const j = raw && typeof raw === "object" && raw.body && typeof raw.body === "object" ? raw.body : raw;
  const links: any[] = Array.isArray(j?.links) ? j.links : [];
  if (!links.length) throw new Error("/signed/chain.json carried no positions");
  const cards: CardRef[] = links
    .filter((l) => l?.body_published && typeof l.card_url === "string" && typeof l.id === "string")
    .map((l) => ({ id: l.id as string, url: l.card_url as string }));
  return {
    phase: "ready",
    head: typeof j?.head === "string" ? j.head : null,
    cards,
    source: {
      kind: "chain",
      positions: Number(j?.length ?? links.length),
      published: Number(j?.bodies_published ?? cards.length),
      withheld: Number(j?.bodies_withheld ?? Math.max(0, links.length - cards.length)),
    },
  };
}

async function fromIndex(signal?: AbortSignal): Promise<Extract<LoadState, { phase: "ready" }>> {
  const j = await readJson("/signed/card_index.json", signal);
  const rows: any[] = Array.isArray(j?.cards) ? j.cards : [];
  if (!rows.length) throw new Error("/signed/card_index.json carried no cards");
  const cards: CardRef[] = rows
    .filter((c) => typeof c?.card === "string" && c.card)
    .map((c) => ({ id: c.card as string, url: `/signed/cards/${c.card}.json` }));
  return {
    phase: "ready",
    head: typeof j?.head === "string" ? j.head : null,
    cards,
    // Counted from the array, never read off the header — the header and the array
    // disagreeing is exactly what the board-floor guards exist to catch.
    source: { kind: "index", listed: cards.length },
  };
}

export default function LobbyVerifyPane() {
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [seed, setSeed] = useState<string | undefined>();
  const [nonce, setNonce] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setState(await fromChain(ac.signal));
      } catch (chainErr: any) {
        if (ac.signal.aborted) return;
        try {
          setState(await fromIndex(ac.signal));
        } catch (indexErr: any) {
          if (ac.signal.aborted) return;
          setState({
            phase: "failed",
            error: `${String(chainErr?.message ?? chainErr)}; and ${String(indexErr?.message ?? indexErr)}`,
          });
        }
      }
    })();
    return () => ac.abort();
  }, []);

  /** Fetch one published card body and drop it in the box, unaltered. */
  const load = async (card: CardRef) => {
    setLoadError(null);
    try {
      const r = await fetch(card.url, { headers: { accept: "application/json" } });
      if (!r.ok) throw new Error(`GET ${card.url} \u2192 HTTP ${r.status}`);
      const raw = await r.text();
      setSeed(raw);
      setNonce((n) => n + 1);
      setLoadedId(card.id);
    } catch (e: any) {
      setLoadError(String(e?.message ?? e));
    }
  };

  const ready = state.phase === "ready" ? state : null;

  return (
    <div className={`${SP.panel} h-full overflow-y-auto`}>
      <p className={TYPE.section}>Verify a card</p>
      <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900">
        Recompute it here, in this tab
      </h2>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-slate-700">
        Native in Council OS. The record is canonicalised and hashed in your browser, and the
        Ed25519 signature is checked against trust anchors pinned in the verifier's own source —
        the keys published at <code className="font-mono text-[12px]">/.well-known/did.json</code>,
        fixed at build time so no key is looked up at check time. A live fetch of that document is
        shown as a labelled cross-check only. Nothing you paste leaves this device, and no account
        is asked for — here or ever.
      </p>

      {/* ── a real published card, so the tool can actually be exercised ── */}
      <div className="mt-5 rounded-2xl border border-slate-900/10 bg-white/70 p-4">
        {state.phase === "loading" && (
          <p className="text-[13px] text-slate-600">Reading the published cards…</p>
        )}

        {state.phase === "failed" && (
          <p className="text-[13px] text-amber-900">
            <strong>No published card list could be read</strong> — {state.error}. The box below
            still works on anything you paste; this pane simply cannot hand you one of ours right now,
            and it will not offer a bundled copy in its place.
          </p>
        )}

        {ready && (
          <>
            {ready.source.kind === "chain" ? (
              <p className="text-[13px] text-slate-700">
                <strong className="tabular-nums">{ready.source.positions}</strong> positions in the
                signed chain — <strong className="tabular-nums">{ready.source.published}</strong> with
                a published body you can check in full, and{" "}
                <strong className="tabular-nums">{ready.source.withheld}</strong> whose body is withheld
                and therefore cannot be. A withheld position is listed rather than dropped, so an
                absence is never invisible.
              </p>
            ) : (
              <p className="text-[13px] text-slate-700">
                <strong className="tabular-nums">{ready.source.listed}</strong> cards in the published
                index (<code className="font-mono text-[11.5px]">/signed/card_index.json</code>), counted
                from its array rather than read off its header. The fuller chain manifest,{" "}
                <code className="font-mono text-[11.5px]">/signed/chain.json</code>, is not being served,
                so this pane is drawing from the index instead and is not quoting chain totals it cannot
                read.
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const head = ready.cards.find((c) => c.id === ready.head) ?? ready.cards[0];
                  if (head) load(head);
                }}
                disabled={!ready.cards.length}
                className={`rounded-lg border border-emerald-700/30 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-900 transition hover:bg-emerald-100 disabled:opacity-40 ${FOCUS}`}
              >
                {ready.source.kind === "chain" ? "Load the chain head" : "Load the head card"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const pool = ready.cards;
                  if (pool.length) load(pool[Math.floor(Math.random() * pool.length)]);
                }}
                disabled={!ready.cards.length}
                className={`rounded-lg border border-slate-900/15 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-40 ${FOCUS}`}
              >
                Load a published card at random
              </button>
              <a
                href={ready.source.kind === "chain" ? "/signed/chain.json" : "/signed/card_index.json"}
                target="_blank"
                rel="noreferrer"
                className={`rounded-lg px-2 py-1.5 text-[12px] font-semibold text-emerald-800 underline decoration-emerald-700/40 underline-offset-2 hover:text-emerald-900 ${FOCUS}`}
              >
                {ready.source.kind === "chain" ? "chain.json" : "card_index.json"} ↗
              </a>
            </div>
            {loadedId && !loadError && (
              <p className="mt-2 font-mono text-[11px] text-slate-600">
                loaded {loadedId.slice(0, 16)}… — press Verify to check it
              </p>
            )}
            {loadError && (
              <p className="mt-2 text-[12px] text-amber-900">
                That card could not be fetched — {loadError}. Nothing was put in the box.
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-900/10 bg-white/90 p-5">
        <RecordVerifyForm
          variant="light"
          seed={seed}
          seedNonce={nonce}
          // The /os ladder's "verify a published card" quest is marked HERE, on a real
          // pass — not on the click of a link, which is what used to award it.
          onVerdict={(v) => { if (v.valid) markQuest("verify"); }}
        />
      </div>

      {/* ── what a pass means, and what it does not ── */}
      <div className="mt-5 rounded-2xl border border-slate-900/10 bg-slate-50/70 p-5">
        <h3 className="text-[14px] font-semibold text-slate-900">What a pass proves — and what it does not</h3>
        <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-slate-700">
          <li>
            <strong>It proves</strong> the record's bytes reproduce the id it declares, and that the
            signature over those bytes verifies under a key published at did:web:csoai.org.
          </li>
          <li>
            <strong>It does not prove</strong> the measurement inside is correct. A signature binds a
            body to a signer; it says nothing about whether the number is any good.
          </li>
          <li>
            <strong>It is not a certification.</strong> We measure and we sign. We do not certify, accredit
            or award a mark, and no result here is a conformity assessment.
          </li>
          <li>
            <strong>Three outcomes, never two.</strong> A failed hash, a failed signature and an unpublished
            signing key are different faults and are reported separately — "I could not check this" is
            never dressed up as "this is forged".
          </li>
        </ul>
        <p className="mt-3 text-[12px] text-slate-600">
          Prefer not to trust this pane? Run{" "}
          <a
            href="/signed/verify-card.mjs"
            className={`underline decoration-emerald-700/40 underline-offset-2 hover:text-emerald-900 ${FOCUS}`}
          >
            /signed/verify-card.mjs
          </a>{" "}
          yourself — zero dependencies, Node 19+ — or follow the byte-for-byte recipe in{" "}
          <a
            href="/signed/HOW-TO-VERIFY.md"
            className={`underline decoration-emerald-700/40 underline-offset-2 hover:text-emerald-900 ${FOCUS}`}
          >
            HOW-TO-VERIFY.md
          </a>
          . Both are the same rule this pane runs.
        </p>
      </div>
    </div>
  );
}
