import { useEffect, useState } from "react";
import { ANCHORING_CLAIM } from "../data/anchoringClaim";
import { Link } from "wouter";
import { VerifyButton } from "@/components/gspc/VerifyButton";
import RecordVerifyForm from "@/components/gspc/RecordVerifyForm";
import { setMetaDescription } from "@/lib/utils";
import { CHAIN_STATUS } from "@/data/chain";
import BoardAttestation from "@/components/board/BoardAttestation";

/**
 * /gspc-verify — recompute the chain yourself.
 *
 * The hash chain for any signed record set can be recomputed locally. If a
 * record was edited after signing, the recomputed hash will not match the
 * stored one, and that row is reported as BROKEN — visibly, with the row
 * identified. Everything runs in the browser; no record leaves the machine.
 */

export default function GSPCVerify() {
  const [boardData, setBoardData] = useState<any>(null);

  useEffect(() => {
    document.title = "Verify the chain — recompute it yourself, client-side | CSOAI";
    setMetaDescription("Verify a Council of AI measurement card client-side: recompute the Ed25519 signature chain in your browser against the published public key. No account, no server trust.");
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
            Paste a signed card.
          </h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
            VALID · INVALID · UNCHECKABLE. Nothing is sent. This is not a certificate, and it is
            not a training record.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12 space-y-16">
        {/* VERIFY ONE RECORD — single input, permalink-able */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">Verify a single record</h2>
          <p className="mt-1 text-[13px] text-emerald-100/60">
            Paste any one estate record — hash and signature are recomputed here, in your browser,
            against the published keys. Share a permalink and the recipient&apos;s browser re-runs
            the same check on the same bytes.
          </p>
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
            <RecordVerifyForm variant="dark" />
          </div>
        </section>

        {/* VERIFY */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">Verify a chain</h2>
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
            <VerifyButton />
          </div>
        </section>

        {/* PUBLISHED CHAIN STATUS */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">Published chain status</h2>
          <p className="mt-1 text-[13px] text-emerald-100/60">
            The status of the production chain as published by the instrument. The button above
            recomputes the public replay set independently — the two never have to take each
            other&apos;s word.
          </p>
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
            <div className="flex flex-wrap gap-8">
              <div>
                <span className="text-[12px] text-emerald-100/60">Status</span>
                <div
                  className={`text-lg font-bold ${CHAIN_STATUS.chain_valid ? "text-emerald-300" : "text-red-300"}`}
                >
                  {CHAIN_STATUS.chain_valid ? "VALID" : "BROKEN"}
                </div>
              </div>
              <div>
                <span className="text-[12px] text-emerald-100/60">Records</span>
                <div className="font-mono text-lg text-emerald-50">{CHAIN_STATUS.chain_length}</div>
              </div>
              <div>
                <span className="text-[12px] text-emerald-100/60">Hash algorithm</span>
                <div className="font-mono text-lg text-emerald-50">{CHAIN_STATUS.hash_algorithm}</div>
              </div>
              <div>
                <span className="text-[12px] text-emerald-100/60">Signature algorithm</span>
                <div className="font-mono text-lg text-emerald-50">{CHAIN_STATUS.signature_algorithm}</div>
              </div>
            </div>
            <p className="mt-4 text-[12px] text-emerald-100/60">{CHAIN_STATUS.note}</p>
            <p className="mt-2 text-[12px] text-emerald-100/60">
              Last record: <span className="font-mono">{CHAIN_STATUS.last_record.id}</span> —{" "}
              {CHAIN_STATUS.last_record.claim}
            </p>
          </div>
        </section>

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
              This button recomputes the <strong className="text-emerald-50">sha256 hash
              chain</strong> — tamper-evidence, not authorship. Authorship is carried by the
              signed card: a <strong className="text-emerald-50">~3KB</strong> measurement card
              signed against{" "}
              <a
                href="/.well-known/did.json"
                className="text-emerald-300 underline decoration-emerald-500/40 hover:decoration-emerald-300"
              >
                <code>did:web:csoai.org#card-attestation-1</code>
              </a>
              , public key{" "}
              <code className="text-emerald-300">d4cb0eaa16d5f50b…</code> — read it out of that
              document yourself and compare it to the <code>pubkey</code> on any card.{" "}
              {ANCHORING_CLAIM}{" "}
              <strong className="text-emerald-50">tsa.status: err</strong> — no OpenTimestamps
              proof is published on a <code>content_id</code>. The post-quantum ML-DSA-65
              (FIPS-204) signer is likewise{" "}
              <strong className="text-emerald-50">built, not shipped</strong>; the label will name
              it in the same commit it ships — never ahead of it.
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
