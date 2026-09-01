/**
 * BoardAttestation — living tables showing Ed25519 signature, SHA-256 hash,
 * XRPL ledger status, and progress visualization from the live board.
 *
 * LOCKS: Living root-as-index GET /root.json; never certify; board 22·15·7.
 */

import { useState } from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import AttestationDeepDive, { type DeepDiveKind } from "./AttestationDeepDive";

export default function BoardAttestation(props: any) {
  const [deepDive, setDeepDive] = useState<{ kind: DeepDiveKind; extra?: any } | null>(null);
  const data = props?.data;
  const dark = props?.variant === "dark";
  const textMuted = dark ? "text-emerald-100/70" : "text-gray-600";
  const textPrimary = dark ? "text-emerald-50" : "text-gray-900";
  const borderCls = dark ? "border-emerald-500/20" : "border-emerald-600/15";
  const bgCls = dark ? "bg-[#05140d]" : "bg-white";
  const linkCls = dark ? "text-emerald-300 hover:underline" : "text-emerald-700 hover:underline";

  return (
    <>
      <div className={`rounded-2xl border ${borderCls} ${bgCls} p-5 space-y-5`}>
        <h3 className={`text-[11px] font-bold uppercase tracking-wider ${dark ? 'text-emerald-300/60' : 'text-emerald-700/70'} mb-3`}>
          Attestation · live from GET /api/gspc · click any row for traces
        </h3>
        <p className={`text-[12px] ${textPrimary}`}>
          Living root-as-index: GET /root.json (unsigned envelope until keystone;
          leaf attestations = coverage harvest, not grades). /api/xrpl is a reader.
          Board stays 22 · 15 · 7. Never certify.
        </p>
        <div className={`border-t ${borderCls} pt-4 flex flex-wrap gap-3 text-[12px]`}>
          <Link href="/gspc-verify" className={linkCls}>Verify the chain →</Link>
          <a href="/.well-known/did.json" className={linkCls}>DID document →</a>
          <a href="/api/gspc" className={linkCls}>Raw JSON →</a>
          <a href="/root.json" className={linkCls}>Living root-as-index (/root.json) →</a>
          <Link href="/xrpl-attest" className={linkCls}>XRPL public-root catalogue →</Link>
        </div>
        <button
          type="button"
          className={`rounded-lg border ${borderCls} p-3 text-left ${textMuted}`}
          onClick={() => setDeepDive({ kind: "xrpl" })}
        >
          Open XRPL / root.json deep dive (reader)
          <ChevronRight className="inline h-3 w-3 ml-1" />
        </button>
      </div>
      {deepDive && (
        <AttestationDeepDive
          kind={deepDive.kind}
          data={{ ...data, ...(deepDive.extra || {}) }}
          onClose={() => setDeepDive(null)}
        />
      )}
    </>
  );
}
