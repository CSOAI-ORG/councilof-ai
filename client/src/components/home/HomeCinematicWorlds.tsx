/**
 * HomeCinematicWorlds — three films in one row: Arena · Harness · Front door.
 *
 * MERGE CONTRACT. Living GET /api/gspc is totals.public_count. Jail is MEASURED,
 * TIE stays TIE. No 22/22, Six-axis, Dunder Mifflin, bought ranks, or pip install csoai.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { VideoEmbed } from "@/components/scrollworld";
import { useBoardCount } from "@/lib/boardCount";

export const CINEMATIC_VIDEO = {
  coliseum: "/videos/csoai-coliseum-plunge.mp4",
  harness: "/videos/csoai-harness-plugin.mp4",
  os: "/videos/csoai-council-os.mp4",
} as const;

type World = {
  id: string;
  video: string;
  poster: string;
  title: string;
  kicker: string;
  headline: string;
  lede: string;
  takeaways: string[];
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
};

const WORLDS: World[] = [
  {
    id: "coliseum",
    video: CINEMATIC_VIDEO.coliseum,
    poster: "/images/cinematic/coliseum-plunge.jpg",
    title: "The Coliseum — how we test containment",
    kicker: "Arena",
    headline: "The model goes in the arena.",
    lede: "Frozen, published tests. Practice stays practice. Jail is measured — a TIE stays a TIE.",
    takeaways: [
      "The target does not move after you sit.",
      "Jail is measured. A TIE is never dressed up as a pass.",
    ],
    primary: { href: "/gspc-scoreboard", label: "Open the scoreboard" },
    secondary: { href: "/gspc-verify", label: "Verify a card" },
  },
  {
    id: "harness",
    video: CINEMATIC_VIDEO.harness,
    poster: "/images/cinematic/harness-plugin.jpg",
    title: "The harness — measurement in the loop you already run",
    kicker: "Harness",
    headline: "Plug the scale into the loop.",
    lede: "One HTTP MCP. Ask the live board from the editor you already use. We are the referee, not the mechanic.",
    takeaways: [
      "Claude, Cursor, Kimi or Grok — same public GET /api/gspc.",
      "We do not auto-repair your prompts.",
    ],
    primary: { href: "/tools", label: "Get the plugin snippet" },
    secondary: { href: "/gspc-verify", label: "Verify a card" },
  },
  {
    id: "os",
    video: CINEMATIC_VIDEO.os,
    poster: "/images/cinematic/council-os-lobby.jpg",
    title: "Council OS — one front door",
    kicker: "Front door",
    headline: "One door. Empty stays empty.",
    lede: "Board, verify, get measured — in one window. Counts come from GET /api/gspc. A rank is never sold.",
    takeaways: [
      "Nine products. Each tile opens a page that exists today.",
      "We measure. We do not certify.",
    ],
    primary: { href: "/os", label: "Open Council OS" },
    secondary: { href: "/gspc-scoreboard", label: "Read the board" },
  },
];

function isVideoHead(r: Response): boolean {
  if (!r.ok) return false;
  const type = (r.headers.get("content-type") || "").toLowerCase();
  return type.startsWith("video/");
}

// Progressive enhancement: the still ships now, and the film swaps in only once
// its .mp4 is actually on the path. But we NEVER HEAD-probe a film we have not
// published — a probe for a missing file logs a 404 to every visitor's console
// (three of them, sitewide, for the reels that do not exist yet), which is exactly
// the kind of unbacked noise this site refuses. A reel joins this set in the SAME
// commit that adds its file under public/videos/, and the probe + click-to-play
// turn on for it then. Empty today: none of the three cinematic reels are built.
const PUBLISHED_CINEMATIC = new Set<string>([]);

function useVideoArrived(src: string): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    // Unpublished reel: show the still, issue no request, keep the console clean.
    if (!PUBLISHED_CINEMATIC.has(src)) {
      setOk(false);
      return;
    }
    let alive = true;
    fetch(src, { method: "HEAD" })
      .then((r) => {
        if (alive) setOk(isVideoHead(r));
      })
      .catch(() => {
        if (alive) setOk(false);
      });
    return () => {
      alive = false;
    };
  }, [src]);
  return ok;
}

function WorldMedia({ world }: { world: World }) {
  const ready = useVideoArrived(world.video);
  if (ready) {
    return (
      <VideoEmbed
        src={world.video}
        poster={world.poster}
        title={world.title}
        caption="Click to play. The file loads only then."
        className="max-w-none"
      />
    );
  }
  return (
    <img
      src={world.poster}
      alt={world.title}
      loading="lazy"
      decoding="async"
      width={1376}
      height={741}
      className="aspect-video w-full object-cover"
    />
  );
}

function WorldCard({ world, count }: { world: World; count: string }) {
  return (
    <article
      id={`world-${world.id}`}
      aria-labelledby={`world-${world.id}-h`}
      className="flex flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_18px_40px_-28px_rgba(4,18,12,.45)]"
    >
      <WorldMedia world={world} />
      <div className="flex flex-1 flex-col px-5 py-6 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-700">{world.kicker}</p>
        <h3 id={`world-${world.id}-h`} className="mt-2 text-2xl font-black tracking-tight text-slate-900">
          {world.headline}
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{world.lede}</p>
        {world.id === "os" && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-950">
            {count}
            <span className="mt-0.5 block text-[11px] font-medium text-emerald-800/70">
              living from GET /api/gspc
            </span>
          </p>
        )}
        <ul className="mt-4 space-y-2 text-[14px] leading-relaxed text-slate-700">
          {world.takeaways.map((t) => (
            <li key={t} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-800">
                ✓
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={world.primary.href}
            className="inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700"
          >
            {world.primary.label}
          </Link>
          <Link
            href={world.secondary.href}
            className="inline-flex rounded-xl border border-emerald-700 bg-white px-4 py-2.5 text-sm font-extrabold text-emerald-900 hover:bg-emerald-50"
          >
            {world.secondary.label}
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function HomeCinematicWorlds() {
  const board = useBoardCount();
  return (
    <section id="worlds" aria-labelledby="worlds-h" className="border-t border-slate-200 bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-700">Three worlds</p>
        <h2 id="worlds-h" className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Arena. Harness. Front door.
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
          Three landscape films, one row. Until the file is on the path, you see the still.
          Counts stay living. Empty stays empty.
        </p>
        <div className="mt-14 grid gap-8 lg:grid-cols-3 lg:gap-7">
          {WORLDS.map((w) => (
            <WorldCard key={w.id} world={w} count={board.public_count} />
          ))}
        </div>
      </div>
    </section>
  );
}
