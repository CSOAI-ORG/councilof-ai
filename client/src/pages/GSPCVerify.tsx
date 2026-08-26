import { useEffect } from "react";
import { Link } from "wouter";
import { VerifyButton } from "@/components/gspc/VerifyButton";
import RecordVerifyForm from "@/components/gspc/RecordVerifyForm";
import { setMetaDescription } from "@/lib/utils";
import { CHAIN_STATUS } from "@/data/chain";
import CouncilOsPageShell from "@/components/os/CouncilOsPageShell";

/**
 * /gspc-verify — recompute the chain yourself.
 *
 * The hash chain for any signed record set can be recomputed locally. If a
 * record was edited after signing, the recomputed hash will not match the
 * stored one, and that row is reported as BROKEN — visibly, with the row
 * identified. Everything runs in the browser; no record leaves the machine.
 */

export default function GSPCVerify() {
  useEffect(() => {
    document.title = "Verify the chain — recompute it yourself, client-side | CSOAI";
    setMetaDescription("Verify a Council of AI measurement card client-side: recompute the Ed25519 signature chain in your browser against the published public key. No account, no server trust.");
    // Anonymous surface hit — path only, no record content. Not MEASURED.
    void fetch("/api/surface-hits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: "/gspc-verify" }),
    }).catch(() => {});
  }, []);

  return (
    <CouncilOsPageShell title="Verify" subtitle="Recompute Ed25519 chain client-side — no account required" className="min-h-screen bg-[#03110b] text-emerald-50">
      {/* HERO */}
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-4xl px-6 pt-14 pb-10">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            Chain verification · client-side · no server involved
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">
            Don&apos;t take our word for it.{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">
              Recompute the chain.
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
            If a record was edited after signing, the recomputed hash will not match the stored
            one — and that row is reported as <strong className="text-red-300">BROKEN</strong>,
            visibly, with the row identified. The button below proves it, including what happens
            when a record is deliberately tampered with.
          </p>
          <p className="mt-3 text-[13px] text-emerald-200/70">
            Privacy: verification runs entirely in your browser. Nothing you check is sent to us,
            logged, or stored — and it never will be. No login, no fee, forever.
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
                <span className="text-[12px] text-emerald-100/50">Status</span>
                <div
                  className={`text-lg font-bold ${CHAIN_STATUS.chain_valid ? "text-emerald-300" : "text-red-300"}`}
                >
                  {CHAIN_STATUS.chain_valid ? "VALID" : "BROKEN"}
                </div>
              </div>
              <div>
                <span className="text-[12px] text-emerald-100/50">Records</span>
                <div className="font-mono text-lg text-emerald-50">{CHAIN_STATUS.chain_length}</div>
              </div>
              <div>
                <span className="text-[12px] text-emerald-100/50">Hash algorithm</span>
                <div className="font-mono text-lg text-emerald-50">{CHAIN_STATUS.hash_algorithm}</div>
              </div>
              <div>
                <span className="text-[12px] text-emerald-100/50">Signature algorithm</span>
                <div className="font-mono text-lg text-emerald-50">{CHAIN_STATUS.signature_algorithm}</div>
              </div>
            </div>
            <p className="mt-4 text-[12px] text-emerald-100/50">{CHAIN_STATUS.note}</p>
            <p className="mt-2 text-[12px] text-emerald-100/45">
              Last record: <span className="font-mono">{CHAIN_STATUS.last_record.id}</span> —{" "}
              {CHAIN_STATUS.last_record.claim}
            </p>
          </div>
        </section>

        {/* WHAT THIS DOES NOT DO */}
        <section className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
          <h2 className="text-2xl font-bold text-emerald-50">What this button does NOT do</h2>
          <ul className="mt-4 space-y-3 text-[13px] text-emerald-100/80 leading-relaxed list-disc pl-5">
            <li>
              This button recomputes the <strong className="text-emerald-50">sha256 hash
              chain</strong> — tamper-evidence, not authorship. Authorship is carried by the
              signed card: a <strong className="text-emerald-50">~3KB</strong> measurement card
              signed with <strong className="text-emerald-50">Ed25519</strong> and{" "}
              <strong className="text-emerald-50">SHA-256 hash-chained</strong>, verifiable offline
              against the published key <code className="text-emerald-300">f4b4278d…</code>{" "}
              (<code className="text-emerald-300">did:web:csoai.org</code>).{" "}
              <strong className="text-emerald-50">OpenTimestamps (Bitcoin) anchoring is roadmap,
              not yet shipped</strong> — the label will name it in the commit it ships, as with
              ML-DSA-65. The post-quantum ML-DSA-65 (FIPS-204) signer is likewise{" "}
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

        {/* RWA pack verify path — Stage 2 honesty (NEXT_300 #183) */}
        <section className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-6">
          <h2 className="text-2xl font-bold text-emerald-50">RWA attestation pack (Stage 2)</h2>
          <p className="mt-2 text-[13px] text-emerald-100/80 leading-relaxed">
            RWA targets ship as an <strong className="text-emerald-50">UNMEASURED</strong> catalog
            until custody + counsel gates clear. Verify path: fetch{" "}
            <code className="text-emerald-300">GET /api/rwa-attestation</code> — every row has{" "}
            <code className="text-emerald-300">measured_score: null</code> and{" "}
            <code className="text-emerald-300">signing_state: unsigned</code>. Attestation ≠
            tokenization ≠ ownership. Testnet Memo pointers (when published) follow{" "}
            <code className="text-emerald-300">docs/SOVOS/RECEIPT-SPEC-0.1.md</code> §12 — hash
            pointers only; never invent AUM as MEASURED.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-[13px]">
            <a href="/api/rwa-attestation" className="text-emerald-300 hover:underline font-mono text-xs">
              GET /api/rwa-attestation
            </a>
            <Link href="/products" className="text-emerald-300 hover:underline">
              Products · RWA posture →
            </Link>
            <Link href="/indices" className="text-emerald-300 hover:underline">
              Indices · UNMEASURED →
            </Link>
          </div>
        </section>

        {/* LINKS */}
        <div className="flex flex-wrap gap-4 pb-4 text-[13px]">
          <Link href="/east-west/verify" className="text-emerald-300 hover:underline">
            East-West cross-border card →
          </Link>
          <Link href="/gspc-arena" className="text-emerald-300 hover:underline">
            See the records in the arena →
          </Link>
          <Link href="/methodology" className="text-emerald-300 hover:underline">
            Read the methodology →
          </Link>
          <Link href="/refutation-ledger" className="text-emerald-300 hover:underline">
            Read the refutation ledger →
          </Link>
        </div>
      </div>
    </CouncilOsPageShell>
  );
}
