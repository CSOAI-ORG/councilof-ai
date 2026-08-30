/**
 * HomeCinematicWorlds — three video-ready bands for the films that are landing.
 *
 * MERGE CONTRACT (audit of the storyboard / press / homepage v1+v2 specs).
 * The incoming stills and scripts are useful. Several claims in those docs
 * are not true of the living board and must not ship on this page:
 *
 *   REFUSE
 *   - "22/22" or "all 22 measured". Living GET /api/gspc is
 *     totals.public_count ("22 axis · 15 measured"). Quote that, never a typed 22.
 *   - "Axis 14 / jail is UNMEASURED / gated empty". Jail is MEASURED. Separation is TIE.
 *   - "Six-axis", "6 playable public arenas", "Dunder Mifflin Cities".
 *     Munder-Difflin is local-only. Do not mint /murder, /difflin, /mundrr.
 *   - Certification, accreditation, bought ranks, "coming soon: all 22-axis games".
 *   - `pip install csoai && csoai check` as a public CLI (not in this monorepo).
 *   - CSOAI as the mechanic that auto-repairs prompts in Cursor. We are the scale.
 *
 *   KEEP
 *   - Three worlds: Coliseum (arena), Harness (plugin), Council OS (front door).
 *   - Cream / ink / emerald. Click-to-play — no GSAP pin, no autoplay of a long file.
 *   - security.txt is RFC 9116 on the live host (councilof.ai), not a homepage claim.
 *   - Canonical methodology DOI 10.5281/zenodo.21991104. CSOAI Ltd UK 16939677.
 *
 * Videos drop at the three reserved paths below. Until HEAD is a real
 * video/* response, the still shows (Vite SPA fallback is HTML 200).
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { VideoEmbed } from "@/components/scrollworld";
import { useBoardCount } from "@/lib/boardCount";
import { type UnderstandItem } from "./HomeUnderstand";

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
  ink: "dark" | "light";
  takeaways: UnderstandItem[];
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
};

const WORLDS: World[] = [
  {
    id: "coliseum",
    video: CINEMATIC_VIDEO.coliseum,
    poster: "/images/cinematic/coliseum-plunge.jpg",
    title: "The Coliseum — how we test containment",
    kicker: "World 1 · the arena",
    headline: "The model goes in the arena. Not on a form.",
    lede:
      "A static checklist goes stale the day the model updates. We run frozen, published tests in an isolated arena. Practice stays practice. A signed run is a card you can hold. Jail, containment, is measured — and a TIE stays a TIE.",
    ink: "dark",
    takeaways: [
      { kind: "tick", text: "Frozen tests. The target does not move after you sit." },
      { kind: "tick", text: "Practice stays practice. Only a signed run is quoted." },
      { kind: "watch", text: "We do not list six public playable games. Local harnesses stay local." },
      { kind: "usp", text: "Jail is measured. A TIE is printed as a TIE — never dressed up as a pass." },
    ],
    primary: { href: "/gspc-scoreboard", label: "Open the scoreboard" },
    secondary: { href: "/gspc-verify", label: "Verify a card" },
  },
  {
    id: "harness",
    video: CINEMATIC_VIDEO.harness,
    poster: "/images/cinematic/harness-plugin.jpg",
    title: "The harness — measurement in the loop you already run",
    kicker: "World 2 · the plugin",
    headline: "Plug the scale into the loop. We do not turn the wrench.",
    lede:
      "One HTTP MCP, and a signed card you keep. Ask the board from the editor you already use. Failed checks can land as a payload in an IDE. We do not write the repair. We are the referee, not the mechanic.",
    ink: "light",
    takeaways: [
      { kind: "tick", text: "Ask the live board from Claude, Cursor, Kimi or Grok — same public GET /api/gspc." },
      { kind: "tick", text: "A passed run is a small signed card. Anyone checks it offline." },
      { kind: "watch", text: "We do not auto-repair your prompts. The scale does not ship the fix." },
      { kind: "usp", text: "Nothing you paste in the desk is sent to us. Verification needs no account." },
    ],
    primary: { href: "/tools", label: "Get the plugin snippet" },
    secondary: { href: "/gspc-verify", label: "Verify a card" },
  },
  {
    id: "os",
    video: CINEMATIC_VIDEO.os,
    poster: "/images/cinematic/council-os-lobby.jpg",
    title: "Council OS — one front door",
    kicker: "World 3 · the lobby",
    headline: "One door. Living counts. Empty stays empty.",
    lede:
      "Council OS is the workspace: board, verify, get measured, evidence. Nine doors that exist today. Counts come from GET /api/gspc. A dash is honest emptiness. A rank is never sold.",
    ink: "light",
    takeaways: [
      { kind: "tick", text: "Board, verify and get measured live in one window." },
      { kind: "tick", text: "Nine products. Each tile opens a page that exists today." },
      { kind: "watch", text: "We measure. We do not certify, accredit, enforce or give legal advice." },
      { kind: "usp", text: "Position on the page is layout, not a purchase." },
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

function useVideoArrived(src: string): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
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
    <figure>
      <img
        src={world.poster}
        alt={world.title}
        loading="lazy"
        decoding="async"
        width={1376}
        height={741}
        className="aspect-video w-full rounded-2xl object-cover shadow-xl ring-1 ring-black/10"
      />
      <figcaption className="mt-2 text-center text-xs text-current/60">
        Landscape still. The film for this world drops on this path: {world.video}
      </figcaption>
    </figure>
  );
}

function WorldBand({ world, count }: { world: World; count: string }) {
  const dark = world.ink === "dark";
  return (
    <article
      id={`world-${world.id}`}
      aria-labelledby={`world-${world.id}-h`}
      className={dark ? "bg-[#04120c] text-emerald-50" : "bg-white text-slate-900"}
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p
              className={`font-mono text-[11px] uppercase tracking-[0.22em] ${
                dark ? "text-emerald-300/80" : "text-emerald-700"
              }`}
            >
              {world.kicker}
            </p>
            <h2 id={`world-${world.id}-h`} className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              {world.headline}
            </h2>
            <p className={`mt-4 text-lg leading-relaxed ${dark ? "text-emerald-100/80" : "text-slate-600"}`}>
              {world.lede}
            </p>
            {world.id === "os" && (
              <p
                className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
                  dark ? "bg-white/10 text-emerald-100" : "border border-emerald-200 bg-emerald-50 text-emerald-950"
                }`}
              >
                {count}
                <span className={`mt-0.5 block text-[11px] font-medium ${dark ? "text-emerald-200/70" : "text-emerald-800/70"}`}>
                  living from GET /api/gspc — if this disagrees, the endpoint wins
                </span>
              </p>
            )}
            <ul className="mt-6 space-y-2.5">
              {world.takeaways.map((t) => {
                const kind = t.kind ?? "tick";
                const mark = kind === "usp" ? "★" : kind === "watch" ? "·" : "✓";
                return (
                  <li key={t.text} className="flex items-start gap-2.5 text-[15px] leading-relaxed">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                        kind === "usp"
                          ? "bg-amber-200 text-amber-900"
                          : kind === "watch"
                            ? dark
                              ? "bg-white/15 text-emerald-100"
                              : "bg-slate-100 text-slate-600"
                            : dark
                              ? "bg-emerald-500/25 text-emerald-200"
                              : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {mark}
                    </span>
                    <span className={dark ? "text-emerald-50/90" : "text-slate-700"}>{t.text}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={world.primary.href}
                className="inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-700"
              >
                {world.primary.label}
              </Link>
              <Link
                href={world.secondary.href}
                className={`inline-flex rounded-xl border px-5 py-3 text-sm font-extrabold ${
                  dark
                    ? "border-emerald-400/40 text-emerald-100 hover:bg-white/5"
                    : "border-emerald-700 bg-white text-emerald-900 hover:bg-emerald-50"
                }`}
              >
                {world.secondary.label}
              </Link>
            </div>
          </div>
          <WorldMedia world={world} />
        </div>
      </div>
    </article>
  );
}

export default function HomeCinematicWorlds() {
  const board = useBoardCount();
  return (
    <section id="worlds" aria-labelledby="worlds-h" className="border-t border-slate-200">
      <div className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-700">Three worlds</p>
          <h2 id="worlds-h" className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            Arena. Harness. Front door.
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Three landscape films are landing here — one per world. Until the file is on
            the path, you see the still. Counts stay living. Empty stays empty.
          </p>
        </div>
      </div>
      {WORLDS.map((w) => (
        <WorldBand key={w.id} world={w} count={board.public_count} />
      ))}
    </section>
  );
}
