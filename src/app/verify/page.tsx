import type { Metadata } from 'next';
import { Bitcoin, Link2, ShieldCheck } from 'lucide-react';
import { getSovLedgerHeadServer, getSovAnchorServer } from '@/lib/sovereign.server';
import type { SovAnchor } from '@/lib/sovereign';
import SovereignVerifier from '@/components/SovereignVerifier';

export const metadata: Metadata = {
  title: 'Verify — Sovereign Town signed ledger · CSOAI',
  description:
    'Verify the CSOAI Sovereign Town flywheel ledger yourself, in your browser, against the published Ed25519 issuer key. Bitcoin-anchored, no server called.',
  alternates: { canonical: '/verify' },
};

/**
 * The real verifier. Earlier this route was a "Coming Soon" stub backed by a
 * regex checker that validated nothing (see [[csoai-competitive-moat]]). It now
 * feeds the public Ed25519-signed ledger head into a client verifier and shows
 * the Bitcoin anchor — trust-minimized, no backend call required.
 */
export default async function VerifyPage() {
  const [ledgerHead, anchor] = await Promise.all([
    getSovLedgerHeadServer(),
    getSovAnchorServer(),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-4">
          Verify the <span className="text-emerald-400">signed ledger</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Every Sovereign Town flywheel entry is Ed25519-signed and hash-chained; the full ledger is
          Bitcoin-anchored. Verify any of it in your browser against the published issuer key — no
          CSOAI server called, no account, no trust in our numbers.
        </p>
      </div>

      {anchor && <AnchorCard anchor={anchor} />}

      <p className="text-[11px] text-slate-600 mb-6 text-center">
        {ledgerHead
          ? `Showing ${ledgerHead.entries.length} of ${ledgerHead.of_total} public signed entries (ledger head). The chain auto-verifies live below.`
          : 'Signed ledger head temporarily unreachable — paste a ledger or load the bundled copy to verify.'}
      </p>

      <SovereignVerifier entries={ledgerHead?.entries} />

      <div className="mt-10 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        Verifier runs entirely client-side via WebCrypto. See the live simulation at{' '}
        <a
          href="/sovereign-town"
          className="text-emerald-400 hover:underline"
        >
          /sovereign-town
        </a>
        .
      </div>
    </div>
  );
}

function AnchorCard({ anchor }: { anchor: SovAnchor }) {
  const blocks = anchor.bitcoin?.blocks ?? [];
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-6 mb-6">
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
        <Bitcoin className="w-4 h-4 text-amber-400" /> Externally anchored — full ledger
      </div>
      <div className="text-sm font-mono break-all text-slate-300">
        Merkle root {anchor.merkle_root?.slice(0, 24)}…
      </div>
      <div className="text-xs text-slate-400 mt-1">
        {anchor.n_attestable} attestable signed entries · ledger {anchor.ledger}
      </div>
      {anchor.bitcoin?.confirmed ? (
        <div className="text-xs text-emerald-400 mt-2">
          ✓ Bitcoin-confirmed at block{blocks.length > 1 ? 's' : ''}{' '}
          {blocks.map((b) => b.height).join(', ')}
          <span className="text-slate-500"> — per the .ots OpenTimestamps proof</span>
        </div>
      ) : (
        <div className="text-xs text-amber-400 mt-2">
          ⊘ Bitcoin attestation pending — calendar has not yet posted the tx
        </div>
      )}
      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2">
        <Link2 className="w-3 h-3" />
        <span className="font-mono break-all">{anchor.verify_cmd}</span>
      </div>
      <p className="text-[11px] text-slate-500 mt-2">{anchor.scope}</p>
    </div>
  );
}