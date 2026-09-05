import { Link } from "wouter";
import type { Finding, FindingPointer } from "@/hooks/useFindingsIndex";
import { pct } from "@/hooks/useFindingsIndex";

/**
 * Shared render pieces for the regulation-findings views. The honesty grammar lives here so every
 * view speaks it identically: findings are DISCOVERED behind signed cards; mappings are
 * 'relevant-to' pointers; fines are the tier's statutory maximum, cited, never asserted as owed.
 */

const REG_STYLE: Record<string, string> = {
  "eu-ai-act": "border-sky-500/40 bg-sky-500/10 text-sky-200",
  "nist-ai-rmf": "border-violet-500/40 bg-violet-500/10 text-violet-200",
  "owasp-asi": "border-amber-500/40 bg-amber-500/10 text-amber-200",
  "iso-42001": "border-teal-500/40 bg-teal-500/10 text-teal-200",
};

export function RegBadge({ id, name }: { id: string; name?: string }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${REG_STYLE[id] || "border-slate-500/40 bg-slate-500/10 text-slate-200"}`}>
      {name || id}
    </span>
  );
}

export function Pointer({ p }: { p: FindingPointer }) {
  return (
    <li className="rounded-lg border border-emerald-500/15 bg-black/30 p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <RegBadge id={p.regulator} name={p.regulator_name} />
        <span className="text-[11px] font-medium text-emerald-300/70">relevant-to</span>
        <span className="text-sm text-emerald-50">{p.obligation}</span>
      </div>
      <div className="mt-1.5 text-[11px] text-emerald-300/55">
        {p.statutory_maximum
          ? <>Statutory maximum: <span className="text-emerald-200/80">{p.statutory_maximum}</span> <span className="text-emerald-300/40">({p.fine_cited_to})</span></>
          : <span className="text-emerald-300/40">No statutory fine — {p.regulator_name} is a {p.regulator === "owasp-asi" ? "security taxonomy" : "voluntary framework"}.</span>}
      </div>
    </li>
  );
}

/** The "no fine is owed" line that must accompany every fine figure. */
export function FineDisclaimer() {
  return (
    <p className="text-[11px] leading-relaxed text-emerald-300/45">
      Figures are the <b className="text-emerald-200/70">statutory maximum</b> the legislature set for the tier, cited to the
      provision — the ceiling for that obligation class, <b className="text-emerald-200/70">not a sum asserted as owed</b> by
      anyone. Mappings are <b className="text-emerald-200/70">"relevant-to" pointers</b>, never a finding of violation or
      compliance. Whether a measured result clears an obligation is a legal question for counsel and the competent authority —
      not a measured one.
    </p>
  );
}

export function FindingCard({ f, showModel = true, showAxis = true }: { f: Finding; showModel?: boolean; showAxis?: boolean }) {
  const capability = f.axis_kind === "capability-benchmark";
  return (
    <div className="rounded-2xl border border-emerald-500/15 bg-[#05140d] p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          {showAxis && <h3 className="font-mono text-base font-bold text-emerald-100">{f.axis_label}</h3>}
          {showModel && (
            <Link to={`/model/${encodeURIComponent(f.model)}`} className="font-mono text-xs text-emerald-300/70 underline-offset-2 hover:text-emerald-200 hover:underline">
              {f.model}
            </Link>
          )}
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl leading-none text-emerald-100">{pct(f.measurement.accuracy)}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">DISCOVERED</p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <a href={f.measurement.card_url} className="rounded-full border border-emerald-500/25 px-2 py-0.5 font-mono text-[10px] text-emerald-200/70 hover:bg-emerald-500/10">
          signed card ↗
        </a>
        {f.measurement.signed && <span className="font-mono text-[10px] text-emerald-400/60">Ed25519 ✓</span>}
      </div>

      {capability ? (
        <p className="mt-3 rounded-lg border border-slate-600/25 bg-slate-600/10 p-2.5 text-[11px] text-slate-300/70">
          {f.crosswalk.no_obligation_reason || "Capability benchmark — no direct regulatory obligation mapped."}
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {f.crosswalk.pointers.map((p, i) => <Pointer key={i} p={p} />)}
        </ul>
      )}
    </div>
  );
}

export function HonestyStrip() {
  return (
    <div className="mt-8 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
      <FineDisclaimer />
      <p className="mt-3 text-center text-[11px] text-emerald-300/50">
        Measurement, not certification. Every finding stands behind an{" "}
        <Link to="/gspc-verify" className="underline hover:text-emerald-200">Ed25519-signed card you can verify</Link>.{" "}
        <Link to="/challenge" className="underline hover:text-emerald-200">Challenge a measurement →</Link>
      </p>
    </div>
  );
}
