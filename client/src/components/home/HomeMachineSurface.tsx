/**
 * HomeMachineSurface — the data doors, and the addresses an agent needs.
 *
 * WHY IT IS NEW. Ten metered population doors shipped in September 2026 and the home page did
 * not mention one of them. They are the newest thing this business sells and the clearest thing
 * it does: take a population somebody argues about, count it from a named artifact, publish the
 * count with its as-of and its state, and let the rows themselves be bought. A reader who never
 * leaves the front page should know they exist.
 *
 * TEN POPULATIONS ARE TEN POPULATIONS. Every figure below is read from that door's own FREE
 * preview at render time, and no two of them are ever added. They count different things — assets
 * in a frozen index, banks named in dated notices, proofs that parse as proofs — and a total
 * across them would be a number about nothing. One door publishes no total at all, because its
 * two source indexes overlap and its artifact refuses to guess; that door says so in words where
 * the others show a figure.
 *
 * THE AGENT HALF NAMES ONLY DOORS THAT ANSWER. Every address in MACHINE_DOORS returned 200 on
 * the live site on 2026-09-22. Naming a machine surface that 404s wastes an agent's turn and is
 * exactly the class of defect the corrections ledger exists for.
 */
import {
  POPULATION_DOORS,
  doorLine,
  manifestSummary,
  type ReadState,
  type X402Manifest,
} from "./homeReads";
import type { DoorReads } from "./useHomeReads";

export interface MachineDoor {
  href: string;
  name: string;
  what: string;
}

export const MACHINE_DOORS: MachineDoor[] = [
  { href: "/api/gspc", name: "GET /api/gspc", what: "the whole board — every axis, sample size, state and separation" },
  { href: "/api/state", name: "GET /api/state", what: "what exists and how each count was derived, with its kind" },
  { href: "/mcp", name: "POST /mcp", what: "the tool surface, over streamable HTTP" },
  { href: "/.well-known/agent.json", name: "/.well-known/agent.json", what: "the A2A agent card: skills, endpoints and what they refuse" },
  { href: "/.well-known/x402.json", name: "/.well-known/x402.json", what: "every metered door, its payment terms and its free preview" },
  { href: "/.well-known/did.json", name: "/.well-known/did.json", what: "our public keys — pin one before you trust any signature" },
  { href: "/root.json", name: "/root.json", what: "the signed root over every published record" },
  { href: "/openapi.json", name: "/openapi.json", what: "the full HTTP surface, described" },
  { href: "/llms.txt", name: "/llms.txt", what: "what this site is, written for you rather than for a crawler" },
];

function DoorRow({ line }: { line: ReturnType<typeof doorLine> }) {
  return (
    <li
      className="flex flex-col gap-1 border-t border-border py-4 sm:flex-row sm:items-baseline sm:gap-5"
      data-door={line.id}
      data-door-state={line.state}
    >
      <a
        href={line.href}
        className="font-mono text-2xl font-black tabular-nums text-emerald-700 dark:text-emerald-300 sm:w-32 sm:shrink-0 sm:text-right"
      >
        {line.figure}
      </a>
      <div className="min-w-0">
        <p className="text-[15px] font-bold leading-snug text-foreground">{line.title}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
          {line.unit}
          {line.unit && line.asOf ? " · " : ""}
          <span className="whitespace-nowrap">as of {line.asOf}</span>
          {line.state ? (
            <>
              {" · "}
              <span className="font-mono text-[11px] font-bold uppercase tracking-wide">{line.state}</span>
            </>
          ) : null}
        </p>
      </div>
    </li>
  );
}

export default function HomeMachineSurface({
  doors,
  manifest,
}: {
  doors: DoorReads;
  manifest: ReadState<X402Manifest>;
}) {
  const lines = POPULATION_DOORS.map((id) => {
    const r = doors[id];
    return doorLine(id, r?.payload ?? null, r?.reason);
  });
  const m = manifest.kind === "ready" ? manifestSummary(manifest.payload) : null;

  return (
    <section
      id="machine-surface"
      aria-labelledby="machine-h"
      className="surface-sunken section-y scroll-mt-20"
      data-testid="home-machine-surface"
    >
      <div className="section-shell">
        <p className="t-kicker text-emerald-700 dark:text-emerald-300">Data, and the addresses behind it</p>
        <h2 id="machine-h" className="t-band mt-4 max-w-3xl text-foreground">
          Ten populations everybody argues about, counted from named sources.
        </h2>
        <p className="t-lede measure mt-5 text-muted-foreground">
          Each door takes one population, counts it from a published artifact, and says what the
          count is of, when it was read and what state it is in. The figures below are the doors'
          own free previews, read as this page loaded. They count ten different things and are
          never added together.
        </p>

        <div className="mt-12 grid gap-x-14 gap-y-10 lg:grid-cols-2">
          <ul className="border-b border-border" data-testid="population-doors">
            {lines.slice(0, 5).map((l) => (
              <DoorRow key={l.id} line={l} />
            ))}
          </ul>
          <ul className="border-b border-border">
            {lines.slice(5).map((l) => (
              <DoorRow key={l.id} line={l} />
            ))}
          </ul>
        </div>

        <p className="mt-7 max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
          A preview is free and always will be. The rows themselves, and the signed reading over
          them, are the part we meter — a rule this estate keeps everywhere: reading what we
          measured costs nothing, and the work we do on request is what is paid for.{" "}
          <a href="/pay" className="font-semibold text-emerald-700 underline underline-offset-2 dark:text-emerald-300">
            Every metered door, with its indexing state
          </a>
          .
        </p>

        {/* ── the agent half ────────────────────────────────────────────── */}
        <div className="mt-16 rounded-3xl border border-emerald-600/25 bg-emerald-500/[0.06] p-6 sm:p-9">
          <h3 className="text-2xl font-black tracking-tight text-foreground">
            Reading this as software? Start here.
          </h3>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Nothing needs to be guessed or scraped. Every surface below is published, stable and
            answers today.
            {m ? (
              <>
                {" "}
                The payment manifest lists {m.doors} doors, and the tool surface carries{" "}
                {m.freeTools} free tools beside {m.paidTools} metered ones.
              </>
            ) : manifest.kind === "failed" ? (
              <> The payment manifest could not be read just now — {manifest.reason}.</>
            ) : null}
          </p>
          <ul className="mt-7 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {MACHINE_DOORS.map((d) => (
              <li key={d.href}>
                <a href={d.href} className="group block">
                  <span className="block break-all font-mono text-[13px] font-bold text-emerald-800 group-hover:underline dark:text-emerald-300">
                    {d.name}
                  </span>
                  <span className="mt-1 block text-[13px] leading-snug text-muted-foreground">{d.what}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
