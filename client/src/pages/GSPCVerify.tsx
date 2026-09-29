import { useCallback, useEffect, useState } from "react";
import PublicRootCatalogue from "@/components/gspc/PublicRootCatalogue";
import { ANCHORING_CLAIM, CURRENT_ROOT_OTS_CLAIM } from "../data/anchoringClaim";
import { Link } from "wouter";
import RecordVerifyForm from "@/components/gspc/RecordVerifyForm";
import { setMetaDescription } from "@/lib/utils";
import BoardAttestation from "@/components/board/BoardAttestation";

/**
 * /gspc-verify — verify published card bytes yourself.
 *
 * The estate-card mode verifies exact pasted card bytes against the published
 * Ed25519 key. The public-root mode checks membership in the current unsigned
 * catalogue. A former local replay demo was removed because it generated both
 * its bodies and expected hashes in the same bundle and therefore could not
 * prove a published chain.
 */

type PublishedRef = { id: string; url: string };

/** Live governance retrieve — free preview only; not a certificate. */
const GOVERNANCE_RETRIEVE = "/interop/mill-cards-signed/signed-governan-e9bc92b7b39b.json";

async function pickPublishedCard(signal?: AbortSignal): Promise<PublishedRef> {
  // Prefer the signed chain links with a published body; fall back to card_index.
  // Never invent a body — only URLs the estate actually lists.
  try {
    const r = await fetch("/signed/chain.json", { signal, headers: { accept: "application/json" } });
    if (r.ok) {
      const j = await r.json();
      const body = j?.body && typeof j.body === "object" ? j.body : j;
      const links = Array.isArray(body?.links) ? body.links : [];
      const published = links.filter(
        (pos: any) => pos?.body_published === true && typeof pos?.card_url === "string" && pos.card_url,
      );
      const pool = published.length ? published : links.filter((pos: any) => typeof pos?.card_url === "string" && pos.card_url);
      if (pool.length) {
        const pos = pool[Math.floor(Math.random() * pool.length)];
        return { id: String(pos.id || pos.card_url), url: pos.card_url };
      }
    }
  } catch {
    /* fall through to index */
  }
  const r2 = await fetch("/signed/card_index.json", { signal, headers: { accept: "application/json" } });
  if (!r2.ok) throw new Error(`card list unreachable (chain + index HTTP ${r2.status})`);
  const idx = await r2.json();
  const cards = Array.isArray(idx?.cards) ? idx.cards : Array.isArray(idx) ? idx : [];
  const withUrl = cards.filter((c: any) => typeof (c?.card_url || c?.url) === "string");
  if (!withUrl.length) throw new Error("no published card body listed");
  const c = withUrl[Math.floor(Math.random() * withUrl.length)];
  const url = c.card_url || c.url;
  return { id: String(c.id || c.card || url), url };
}

export default function GSPCVerify() {
  const [boardData, setBoardData] = useState<any>(null);
  const [mode, setMode] = useState<"estate" | "public-root">("estate");
  const [seed, setSeed] = useState<string | undefined>(undefined);
  const [seedNonce, setSeedNonce] = useState(0);
  const [tryBusy, setTryBusy] = useState(false);
  const [tryErr, setTryErr] = useState<string | null>(null);

  const tryPublished = useCallback(async () => {
    setTryBusy(true);
    setTryErr(null);
    try {
      const ref = await pickPublishedCard();
      const r = await fetch(ref.url, { headers: { accept: "application/json" } });
      if (!r.ok) throw new Error(`GET ${ref.url} → HTTP ${r.status}`);
      const raw = await r.text();
      setSeed(raw);
      setSeedNonce((n) => n + 1);
    } catch (e: any) {
      setTryErr(String(e?.message ?? e));
    } finally {
      setTryBusy(false);
    }
  }, []);

  const tryGovernanceRetrieve = useCallback(async () => {
    setTryBusy(true);
    setTryErr(null);
    try {
      const r = await fetch(GOVERNANCE_RETRIEVE, { headers: { accept: "application/json" } });
      if (!r.ok) throw new Error(`GET ${GOVERNANCE_RETRIEVE} → HTTP ${r.status}`);
      const raw = await r.text();
      setSeed(raw);
      setSeedNonce((n) => n + 1);
    } catch (e: any) {
      setTryErr(String(e?.message ?? e));
    } finally {
      setTryBusy(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Verify a signed card — client-side | CSOAI";
    setMetaDescription("Verify a Council of AI measurement card client-side: recompute its payload hash and Ed25519 signature in your browser against the published public key.");
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/gspc", { signal: ac.signal, headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => {
        if (d && typeof d === "object" && Array.isArray(d.axes)) {
          setBoardData(d);
        }
      })
      .catch(() => { /* verification page still works without the board data */ });
    return () => ac.abort();
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      {/* HERO */}
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-4xl px-6 pt-14 pb-10">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            Verify · nothing sent · no account
          </p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">
            Paste a signed card. Recompute it here.
          </h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
            Two modes. Cards recompute Ed25519 against the key the card names: estate cards use
            did:web:csoai.org#card-attestation-1, and mill and pod measurement cards use
            did:web:csoai.org#board-attestation-1.
            Public-root mode loads GET /root.json, verifies its Ed25519 envelope against the pinned
            board key, and binds inclusion proofs to that root. Root membership does not individually
            sign a leaf. This is not a certificate, and it is not a training record.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-emerald-200/75 leading-relaxed">
            Every check ends in one of three results: <strong>VALID</strong> (the signature and the
            content match), <strong>INVALID</strong> (a check failed, and it says which), or{" "}
            <strong>UNCHECKABLE</strong> (the check could not be completed). Could-not-check is never
            reported as a failure.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-3" aria-label="What verification checks">
            {[
              ["01", "Hash", "Recompute the content identifier from the exact bytes."],
              ["02", "Signature", "Check Ed25519 against the published key named by the record."],
              ["03", "Inclusion", "Where applicable, bind the leaf proof to the published root."],
            ].map(([n, label, copy]) => (
              <div key={label} className="rounded-2xl border border-emerald-400/15 bg-white/[0.035] p-4">
                <p className="font-mono text-[10px] font-bold tracking-[0.18em] text-emerald-400/70">{n}</p>
                <p className="mt-2 text-sm font-bold text-emerald-50">{label}</p>
                <p className="mt-1 text-xs leading-5 text-emerald-100/60">{copy}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Verify mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "estate"}
              onClick={() => setMode("estate")}
              className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-semibold ${
                mode === "estate"
                  ? "bg-emerald-500 text-[#03110b]"
                  : "border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/10"
              }`}
            >
              Estate card
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "public-root"}
              onClick={() => setMode("public-root")}
              className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-semibold ${
                mode === "public-root"
                  ? "bg-amber-400 text-[#03110b]"
                  : "border border-amber-400/30 text-amber-200 hover:bg-amber-500/10"
              }`}
            >
              Public-root catalogue
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12 space-y-16">
        {mode === "public-root" && (
          <section>
            <h2 className="text-2xl font-bold text-amber-200">Public-root card + inclusion</h2>
            <p className="mt-1 text-[13px] text-emerald-100/60">
              The root envelope is signed and verified here. Its leaves may separately be signed
              or unsigned; inclusion alone never changes that leaf state.
            </p>
            <div className="mt-4">
              <PublicRootCatalogue variant="dark" />
            </div>
          </section>
        )}

        {mode === "estate" && (
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">Verify a single estate record</h2>
          <p className="mt-1 text-[13px] text-emerald-100/60">
            Paste any one estate record — hash and signature are recomputed here, in your browser,
            against the published keys. Share a permalink and the recipient&apos;s browser re-runs
            the same check on the same bytes.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void tryPublished()}
              disabled={tryBusy}
              data-testid="try-published-card"
              className="min-h-[44px] rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-40"
            >
              {tryBusy ? "Loading…" : "Try a published card"}
            </button>
            <button
              type="button"
              onClick={() => void tryGovernanceRetrieve()}
              disabled={tryBusy}
              data-testid="try-governance-retrieve"
              className="min-h-[44px] rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-40"
            >
              {tryBusy ? "Loading…" : "Try a governance card"}
            </button>
            <span className="text-[12px] text-emerald-100/65">
              Each loads one published card into the box, unaltered. Both are free.
            </span>
          </div>
          {tryErr && (
            <p className="mt-2 text-[13px] text-amber-200/90" role="status">
              Could not load a published card — {tryErr}. Paste still works.
            </p>
          )}
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
            <RecordVerifyForm variant="dark" seed={seed} seedNonce={seedNonce} />
          </div>
        </section>
        )}

        {mode === "estate" && (
        <section>
          <h2 className="text-2xl font-bold text-amber-200">Chain replay is not claimed</h2>
          <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-6 text-sm leading-relaxed text-amber-100/85">
            A previous demo rehashed records and expected values generated by the same browser
            bundle. That can demonstrate SHA-256 mechanics, but it cannot independently establish
            a published chain or prove that a record was unchanged after signing. It is withdrawn
            until exact published bytes, trusted reference hashes, and link continuity are bound
            into one verifiable input. Use the estate-card verifier above for the capability that
            is live today.
          </div>
        </section>
        )}

        {/* LIVING ATTESTATION TABLES — from GET /api/gspc */}
        {boardData && (
          <section>
            <h2 className="text-2xl font-bold text-emerald-50">Board stamp — living board, not your card</h2>
            <p className="mt-1 text-[13px] text-emerald-100/60">
              This is the published board stamp. It is not a stamp on a card you just pasted.
              Empty fields show exactly why they are empty.
            </p>
            <div className="mt-4">
              <BoardAttestation
                data={boardData}
                variant="dark"
                showProgress={true}
                showInLane={true}
                compact={false}
              />
            </div>
          </section>
        )}

        {/* WHAT THIS DOES NOT DO */}
        <section className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
          <h2 className="text-2xl font-bold text-emerald-50">What this button does NOT do</h2>
          <ul className="mt-4 space-y-3 text-[13px] text-emerald-100/80 leading-relaxed list-disc pl-5">
            <li>
              It does no more than recompute the record&apos;s hash and check its Ed25519 signature
              against the key the record names. Authorship rests on that key: read it out of the{" "}
              <a
                href="/.well-known/did.json"
                className="text-emerald-300 underline decoration-emerald-500/40 hover:decoration-emerald-300"
              >
                DID document
              </a>{" "}
              yourself (<code>did:web:csoai.org#card-attestation-1</code>, starting{" "}
              <code className="text-emerald-300">d4cb0eaa16d5f50b…</code>) and compare it to the{" "}
              <code>pubkey</code> on the card.
            </li>
            <li>
              It does not contact a server. Verification is local; you bring the records and
              the WebCrypto implementation in your browser.
            </li>
            <li>
              It does not assert that a model is &quot;safe&quot;, &quot;compliant&quot;, or
              &quot;authentic&quot;. Those words are not in the button&apos;s vocabulary, on
              purpose.
            </li>
          </ul>
        </section>

        {/* The paid door comes after the free verifier, never before it (audit 2026-09-28 #22). */}
        {mode === "estate" && (
        <section data-testid="governance-retrieve-raas">
          <h2 className="text-2xl font-bold text-emerald-50">Optional: a commission receipt</h2>
          <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.05] p-4 space-y-3">
            <p className="text-[13px] text-emerald-100/80 leading-relaxed">
              Everything above is free and stays free. The metered commission door issues a receipt
              for a named subject and re-serves signed cards already on file;
              it does not run a new measurement. Before paying, check the 402 challenge for the
              signer state, corpus date and cards available for your subject.
            </p>
            <p className="text-[13px] text-emerald-100/70 leading-relaxed">
              The governance card the free button loads is{" "}
              <a
                href="/interop/mill-cards-signed/signed-governan-e9bc92b7b39b.json"
                className="font-mono break-all underline underline-offset-2 hover:text-emerald-50"
                data-testid="governance-retrieve-url"
              >
                /interop/mill-cards-signed/signed-governan-e9bc92b7b39b.json
              </a>
              , a historical signed card. Its current board admission and quotability are not
              established by this example.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard?tab=tools&tool=commission_card"
                className="min-h-[44px] inline-flex items-center rounded-lg border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/15"
                data-testid="governance-commission-cta"
              >
                Commission receipt · existing evidence
              </Link>
              <a
                href="/pay"
                className="min-h-[44px] inline-flex items-center rounded-lg border border-emerald-400/25 px-4 py-2 text-sm font-semibold text-emerald-200/90 hover:bg-emerald-500/10"
                data-testid="governance-pay-cta"
              >
                Browse all metered doors
              </a>
            </div>
          </div>
        </section>
        )}

        {/* TECHNICAL NOTES — collapsed (audit 2026-09-28 #22): true, published, and not part of
            the first check a stranger makes. */}
        <details className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6" data-testid="verify-technical-notes">
          <summary className="cursor-pointer text-lg font-bold text-emerald-50">Technical notes</summary>
          <ul className="mt-4 space-y-3 text-[13px] text-emerald-100/80 leading-relaxed list-disc pl-5">
            <li>
              UNCHECKABLE covers, among other cases, the superseded v0.1 board stamp, a missing
              post-quantum seal, and any verify path not wired yet. None of those is reported as
              INVALID.
            </li>
            <li>
              Current v0.1 signed cards are{" "}
              <strong className="text-emerald-50">under 1KB</strong>; the envelope specification
              allows a maximum of 3KB.{" "}
              {ANCHORING_CLAIM}{" "}
              <strong className="text-emerald-50">{CURRENT_ROOT_OTS_CLAIM}</strong>. This covers
              the exact public-root bytes only, not an individual <code>content_id</code> or the
              separate signed-card index. The post-quantum ML-DSA-65
              (FIPS-204) path is <strong className="text-emerald-50">planned and scaffolded only</strong>;
              no PQC signer/runtime is built or published.
            </li>
            <li>
              The <strong className="text-emerald-50">3KB envelope ceiling is binding</strong>;
              it is not the current card size. An ML-DSA-65 signature is ~3.3KB and cannot live
              inside that ceiling. Hybrid, when it ships, is a
              second receipt on the root / DID / inclusion bundle — never a PQC-signed card.
              <code>#board-pqc-1</code> is <strong className="text-emerald-50">ABSENT</strong>.
              No PQC verify helper is wired. Fail-closed: a missing PQC seal is UNCHECKABLE,
              never VALID. PQCBench is the GSPC continuity arena (<code>csoai/gspc-asi</code>),
              not a post-quantum signature on these cards.
            </li>
          </ul>
        </details>

        {/* LINKS */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 pb-4 text-[13px]">
          <Link href="/gspc-arena" className="inline-flex min-h-[44px] items-center text-emerald-300 hover:underline">
            See the records in the arena →
          </Link>
          <Link href="/methodology" className="inline-flex min-h-[44px] items-center text-emerald-300 hover:underline">
            Read the methodology →
          </Link>
          <Link href="/refutation-ledger" className="inline-flex min-h-[44px] items-center text-emerald-300 hover:underline">
            Read the refutation ledger →
          </Link>
        </div>
      </div>
    </div>
  );
}
