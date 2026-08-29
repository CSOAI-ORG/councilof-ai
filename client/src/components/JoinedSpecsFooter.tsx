/**
 * Tiny joined-specs footer. Pins, not 600 tiles. Not a partner logo wall.
 * We call their verifiers; we do not ship Emilia/C2PA/SCITT inside the glass snippet.
 */
import { JOINED_SPECS, JOINED_SPECS_LOCK } from "@/data/joinedSpecs";

const TONE: Record<string, string> = {
  live: "text-emerald-700",
  pin: "text-slate-600",
  gated: "text-slate-500",
  err: "text-amber-800",
  reproduction: "text-slate-600",
  "local-only": "text-slate-500",
};

export default function JoinedSpecsFooter({ variant = "light" }: { variant?: "light" | "dark" }) {
  const ink = variant === "dark" ? "text-emerald-100/70" : "text-slate-600";
  const line = variant === "dark" ? "border-emerald-500/15" : "border-slate-200";
  const link = variant === "dark" ? "text-emerald-300" : "text-emerald-800";
  return (
    <footer className={`mt-8 border-t ${line} pt-4`} aria-labelledby="joined-specs-title">
      <p id="joined-specs-title" className={`font-mono text-[10px] uppercase tracking-[0.18em] ${ink}`}>
        Joined specs — pins, not a monorepo
      </p>
      <p className={`mt-1 text-[12px] leading-relaxed ${ink}`}>
        Bind, don&apos;t migrate. Lockfile belongs at <code className="font-mono text-[11px]">{JOINED_SPECS_LOCK}</code>.
        Each site loads our glass card; optional attachments dispatch to <em>their</em> verifier.
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {JOINED_SPECS.map((s) => (
          <li key={s.kind + s.name} className="text-[11.5px]">
            <a href={s.uri} className={`font-semibold ${link} underline-offset-2 hover:underline`}>
              {s.name}
            </a>
            <span className={`ml-1 font-mono ${TONE[s.status] ?? ""}`}>{s.status}</span>
          </li>
        ))}
      </ul>
    </footer>
  );
}
