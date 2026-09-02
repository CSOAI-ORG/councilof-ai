import { useEffect, useRef } from "react";
import { openLobby } from "@/lib/lobbyLink";

/**
 * SovereignSpot — globe + Council OS entry for topic-scoped pages.
 *
 * The duplicate inline chat is retired: every ask opens the Council Lobby with
 * a seeded prompt (consent lock — typed, never auto-sent). One chat surface
 * estate-wide.
 */
export default function SovereignSpot({
  topic,
  layer,
  suggest,
  task,
  height = 300,
}: {
  topic: string;
  layer?: string;
  suggest?: string;
  /** Optional LOBBY_TASKS shortcut (e.g. sector-brief, regulator-brief). */
  task?: "sector-brief" | "regulator-brief" | "pricing-overview" | "enterprise-start";
  height?: number;
}) {
  const f = useRef<HTMLIFrameElement>(null);
  const seed =
    suggest?.trim() ||
    `What is published about ${topic} — frameworks named, evidence signed, and gaps left empty?`;

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const w = f.current?.contentWindow;
        if (!w) return;
        if (layer) w.postMessage({ cmd: "layer", tag: layer, on: true }, "*");
        w.postMessage({ cmd: "spin", on: true }, "*");
      } catch {
        /* cross-origin or blocked */
      }
    }, 2600);
    return () => clearTimeout(t);
  }, [layer]);

  function open(seedPrompt?: string) {
    if (task) {
      openLobby({ task, ctx: topic, prompt: seedPrompt });
      return;
    }
    openLobby({ prompt: seedPrompt || seed, pane: "home" });
  }

  return (
    <div className="grid gap-4 rounded-2xl border border-emerald-500/20 bg-[#04120c] p-4 md:grid-cols-2">
      <div
        className="overflow-hidden rounded-xl border border-emerald-500/15 bg-black/40"
        style={{ height }}
      >
        <iframe
          ref={f}
          src="/globe3d.html"
          title="Council governance globe"
          loading="lazy"
          className="h-full w-full border-0"
        />
      </div>
      <div className="flex min-h-0 flex-col justify-center gap-3">
        <div className="text-sm font-bold text-emerald-100">Council OS — {topic}</div>
        <p className="text-[11px] leading-relaxed text-emerald-300/60">
          Answers from published measurement, or it refuses. Your question is typed into the lobby — nothing sends until you press Ask.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={task ? `/dashboard?tab=home&task=${encodeURIComponent(task)}&ctx=${encodeURIComponent(topic)}` : `/dashboard?tab=home&ask=${encodeURIComponent(seed)}`}
            onClick={(e) => {
              e.preventDefault();
              open();
            }}
            className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-[#03110b] transition hover:bg-emerald-400"
          >
            Open Council OS
          </a>
          {suggest && (
            <button
              type="button"
              onClick={() => open(suggest)}
              className="rounded-full border border-emerald-500/30 px-3 py-1.5 text-[11px] text-emerald-100/90 transition hover:bg-emerald-500/10"
            >
              e.g. “{suggest}”
            </button>
          )}
        </div>
        <p className="text-[10px] text-emerald-300/40">
          Deterministic pane commands · grounded /api/chat lane · consent checkpoint on consequential steps
        </p>
      </div>
    </div>
  );
}
