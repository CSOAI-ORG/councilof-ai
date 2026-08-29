/**
 * HomeWorlds — two full-bleed doors, then named OS links.
 *
 * Replaces the small "Open Council OS" CTA, the white verify card, the four-pill
 * encore, and the XRPL/arena outcome tiles. HeroBoard stays the doctrine hero.
 *
 * Posters are images this repo already ships. Optional `/video/measure.mp4` and
 * `/video/verify.mp4` play when present; a missing file falls back to the poster.
 */
import { type ReactNode, useState } from "react";
import { ChevronRight } from "lucide-react";

export const OS_DOORS = [
  { label: "Board", href: "/os?lobby=board" },
  { label: "Verify", href: "/os?lobby=verify" },
  { label: "Cards", href: "/os?lobby=cards" },
  { label: "Assess", href: "/assess" },
  { label: "Evidence", href: "/evidence-rail" },
] as const;

function WorldScrim({
  poster,
  posterAlt,
  videoSrc,
  children,
}: {
  poster: string;
  posterAlt: string;
  videoSrc?: string;
  children: ReactNode;
}) {
  const [videoOk, setVideoOk] = useState(!!videoSrc);
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden">
      {videoOk && videoSrc ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={poster}
          aria-hidden
          onError={() => setVideoOk(false)}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : (
        <img
          src={poster}
          alt={posterAlt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-slate-950/70" aria-hidden />
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-5xl flex-col justify-end px-4 py-16 sm:px-6 sm:py-24">
        {children}
      </div>
    </section>
  );
}

function WorldMeasure() {
  return (
    <WorldScrim
      poster="/images/coliseum_hero_arena.jpg"
      posterAlt="Clay figures and green verification seals in a marble arena"
      videoSrc="/video/measure.mp4"
    >
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
        Living board
      </p>
      <h2 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
        22 axis. 15 measured. 7 empty.
      </h2>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
        Counts come from GET /api/gspc. Ties are ties. Jail is the floor. In-lane
        human-vs-AI stays off this grid.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href="/gspc-scoreboard"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400"
        >
          Read the board <ChevronRight className="h-4 w-4" />
        </a>
        <a
          href="/os?lobby=board"
          className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20"
        >
          Open the matrix <ChevronRight className="h-4 w-4" />
        </a>
      </div>
    </WorldScrim>
  );
}

function WorldVerify() {
  return (
    <WorldScrim
      poster="/images/secure_evidence_vault.jpg"
      posterAlt="Clay figures holding a signed measurement card before a vault door"
      videoSrc="/video/verify.mp4"
    >
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
        Free forever
      </p>
      <h2 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
        Verify a card
      </h2>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
        Paste a signed record. The browser recomputes SHA-256 and checks Ed25519
        against the published key. Nothing is uploaded. Three states only: VALID ·
        INVALID · UNCHECKABLE.
      </p>
      <a
        href="/gspc-verify"
        className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400"
      >
        Open verifier <ChevronRight className="h-4 w-4" />
      </a>
    </WorldScrim>
  );
}

function OsNamedLinks({ id }: { id?: string }) {
  return (
    <section id={id} className="surface-raised py-12 sm:py-16">
      <div className="section-shell max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Council OS</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          One loginless window for the instrument. Not a second website inside itself.
        </p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {OS_DOORS.map((d) => (
            <li key={d.href}>
              <a
                href={d.href}
                className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:border-emerald-500 hover:text-emerald-800"
              >
                {d.label}
                <span className="ml-2 font-mono text-[11px] font-normal text-muted-foreground">{d.href}</span>
              </a>
            </li>
          ))}
        </ul>
        <a
          href="/os?lobby=home"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-500"
        >
          Open OS <ChevronRight className="h-4 w-4" />
        </a>
        <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">
          If a pane tries to load the marketing site, that is a bug. Use the named links.
        </p>
      </div>
    </section>
  );
}

export default function HomeWorlds() {
  return (
    <>
      <WorldMeasure />
      <WorldVerify />
      <OsNamedLinks id="cta-os" />
    </>
  );
}
