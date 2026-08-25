import { Link } from "wouter";
import type { ToolCardInstance } from "./measuredToolCards";
import { openLobby } from "@/lib/lobbyLink";

/**
 * Controlled measured-tool card — agent picks the tool; we own the chrome.
 * Card appearance ≠ permission grant. Measurement, not certification.
 */
export default function MeasuredToolCard({
  card,
  onOpenPane,
}: {
  card: ToolCardInstance;
  onOpenPane?: () => void;
}) {
  const phase = card.phase ?? "done";
  const phaseLabel =
    phase === "running" ? "Running…" : phase === "error" ? "Failed" : "Done";

  return (
    <article
      className="mt-2 overflow-hidden rounded-xl border border-emerald-700/20 bg-emerald-50/60 text-left"
      aria-label={`${card.title} measurement card`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-700/10 px-3 py-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wide text-emerald-800/70">
            MCP · {card.tool}
          </p>
          <h3 className="text-sm font-bold text-emerald-950">{card.title}</h3>
        </div>
        <span
          className={
            "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase " +
            (phase === "done"
              ? "border-emerald-600/30 bg-emerald-100 text-emerald-900"
              : phase === "running"
                ? "border-amber-500/40 bg-amber-50 text-amber-900"
                : "border-red-400/40 bg-red-50 text-red-900")
          }
        >
          {phaseLabel}
        </span>
      </header>
      <div className="space-y-2 px-3 py-2.5">
        <p className="text-[13px] leading-snug text-emerald-950/85">{card.blurb}</p>
        <p className="font-mono text-[10px] text-emerald-800/70">{card.status}</p>
        {card.preview ? (
          <pre className="max-h-24 overflow-auto rounded-lg bg-white/80 p-2 font-mono text-[10px] text-slate-700">
            {card.preview}
          </pre>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href={card.path}
            className="rounded-lg bg-emerald-800 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-900"
          >
            Open surface
          </Link>
          {card.pane ? (
            <button
              type="button"
              className="rounded-lg border border-emerald-800/25 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100"
              onClick={() => {
                openLobby({ pane: card.pane! });
                onOpenPane?.();
              }}
            >
              Open in Council OS
            </button>
          ) : null}
        </div>
        <p className="text-[10px] text-emerald-900/55">
          Card is a render instruction — not a permission grant. Verify on the surface.
        </p>
      </div>
    </article>
  );
}
