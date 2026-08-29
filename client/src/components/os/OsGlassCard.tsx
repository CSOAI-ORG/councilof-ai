import type { CardVerdict } from "@/lib/cardVerify";

/**
 * Glass card (~3 kb) — only after VALID. Fail closed: anything else renders nothing.
 */
export default function OsGlassCard({
  verdict,
}: {
  verdict?: CardVerdict;
}) {
  if (!verdict || verdict.state !== "VALID") return null;
  return (
    <div
      data-testid="os-glass-card"
      className="mt-2 max-w-md rounded-xl border border-emerald-400/50 bg-white/80 px-3 py-2.5 text-[12px] text-slate-800 shadow-sm backdrop-blur-sm"
    >
      <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-emerald-800">VALID · card-v1</p>
      {verdict.id && <p className="mt-1 truncate font-mono text-[11px]">{verdict.id}</p>}
      {verdict.axis && <p className="font-mono text-[11px] text-slate-600">{verdict.axis}</p>}
      {verdict.digest && (
        <p className="mt-1 truncate font-mono text-[10px] text-slate-500">sha256 {verdict.digest}</p>
      )}
      <p className="mt-1 text-[11px] text-slate-600">Ed25519 · in-browser · not a certificate.</p>
    </div>
  );
}
