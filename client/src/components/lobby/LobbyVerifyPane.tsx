import { useEffect, useState } from "react";
import RecordVerifyForm from "@/components/gspc/RecordVerifyForm";
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

type ChainLink = {
  id: string;
  body_published?: boolean;
  card_url?: string;
};

type Chain = {
  length: number;
  bodies_published: number;
  bodies_withheld: number;
  head: string;
  links: ChainLink[];
};

type ChainState =
  | { phase: "loading" }
  | { phase: "ready"; chain: Chain; published: ChainLink[] }
  | { phase: "failed"; error: string };

async function fetchChain(signal?: AbortSignal): Promise<Chain> {
  const r = await fetch("/signed/chain.json", { signal, headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`GET /signed/chain.json → HTTP ${r.status}`);
  const j: any = await r.json();
  const links: ChainLink[] = Array.isArray(j?.links) ? j.links : [];
  if (!links.length) throw new Error("the chain carried no positions");
  return {
    length: Number(j?.length ?? links.length),
    bodies_published: Number(j?.bodies_published ?? 0),
    bodies_withheld: Number(j?.bodies_withheld ?? 0),
    head: String(j?.head ?? ""),
    links,
  };
}

export default function LobbyVerifyPane() {
  const [state, setState] = useState<ChainState>({ phase: "loading" });
  const [seed, setSeed] = useState<string | undefined>();
  const [nonce, setNonce] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetchChain(ac.signal)
      .then((chain) =>
        setState({
          phase: "ready",
          chain,
          published: chain.links.filter((l) => l.body_published && l.card_url),
        }),
      )
      .catch((e: any) => {
        if (ac.signal.aborted) return;
        setState({ phase: "failed", error: String(e?.message ?? e) });
      });
    return () => ac.abort();
  }, []);

  /** Fetch one published card body and drop it in the box, unaltered. */
  const load = async (link: ChainLink) => {
    setLoadError(null);
    try {
      const r = await fetch(link.card_url as string, { headers: { accept: "application/json" } });
      if (!r.ok) throw new Error(`GET ${link.card_url} → HTTP ${r.status}`);
      const raw = await r.text();
      setSeed(raw);
      setNonce((n) => n + 1);
      setLoadedId(link.id);
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
        Ed25519 signature is checked against the keys published at{" "}
        <code className="font-mono text-[12px]">/.well-known/did.json</code>. Nothing you paste
        leaves this device, and no account is asked for — here or ever.
      </p>

      {/* ── the live chain, so a reader can exercise the tool on a real card ── */}
      <div className="mt-5 rounded-2xl border border-slate-900/10 bg-white/70 p-4">
        {state.phase === "loading" && (
          <p className="text-[13px] text-slate-600">Reading the published chain from /signed/chain.json…</p>
        )}

        {state.phase === "failed" && (
          <p className="text-[13px] text-amber-900">
            <strong>The published chain could not be read</strong> — {state.error}. The box below still
            works on anything you paste; this pane simply cannot hand you one of ours right now, and it
            will not offer a bundled copy in its place.
          </p>
        )}

        {ready && (
          <>
            <p className="text-[13px] text-slate-700">
              <strong className="tabular-nums">{ready.chain.length}</strong> positions in the signed
              chain — <strong className="tabular-nums">{ready.chain.bodies_published}</strong> with a
              published body you can check in full, and{" "}
              <strong className="tabular-nums">{ready.chain.bodies_withheld}</strong> whose body is
              withheld and therefore cannot be. A withheld position is listed rather than dropped, so an
              absence is never invisible.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const head = ready.published.find((l) => l.id === ready.chain.head) ?? ready.published[0];
                  if (head) load(head);
                }}
                disabled={!ready.published.length}
                className={`rounded-lg border border-emerald-700/30 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-900 transition hover:bg-emerald-100 disabled:opacity-40 ${FOCUS}`}
              >
                Load the chain head
              </button>
              <button
                type="button"
                onClick={() => {
                  const pool = ready.published;
                  if (pool.length) load(pool[Math.floor(Math.random() * pool.length)]);
                }}
                disabled={!ready.published.length}
                className={`rounded-lg border border-slate-900/15 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-40 ${FOCUS}`}
              >
                Load a published card at random
              </button>
              <a
                href="/signed/chain.json"
                target="_blank"
                rel="noreferrer"
                className={`rounded-lg px-2 py-1.5 text-[12px] font-semibold text-emerald-800 underline decoration-emerald-700/40 underline-offset-2 hover:text-emerald-900 ${FOCUS}`}
              >
                chain.json ↗
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
        <RecordVerifyForm variant="light" seed={seed} seedNonce={nonce} />
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
