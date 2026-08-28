import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ARENA_SUBJECTS, ARENA_MATCHES, ARENA_PROVISIONS } from "@/data/arena";
import GameBar from "@/components/os/GameBar";
import AxisPanel from "@/components/os/AxisPanel";
import { lobbyHref, openLobby } from "@/lib/lobbyLink";

/**
 * OsLauncher — crawlable /os page. The operable OS is the Council OS overlay
 * (Enter Council OS). This page keeps the town / arena / axes for readers and
 * crawlers; it no longer hosts a second chat. `/console` and `/council-os`
 * alias to the overlay.
 *
 * Brand: white background, emerald (#10b981) accent. Real data only — no
 * invented metrics, no killed/branded routes.
 */

type NavGroup = { label: string; items: { name: string; href: string; note?: string; badge?: string }[] };

const NAV: NavGroup[] = [
  {
    label: "Play",
    items: [
      { name: "Council Town", href: "#council-town", note: "the agent-town game", badge: "live" },
      { name: "The Arena", href: "/gspc-arena", note: "model vs model" },
      { name: "Live demo & tour", href: "/demo", note: "watch it run" },
    ],
  },
  {
    label: "Measure",
    items: [
      { name: "GSPC axes", href: "#axes", note: "living board · counts from /api/gspc" },
      { name: "Benchmarks", href: "/benchmarks", note: "every result" },
      { name: "Verify a card", href: "/gspc-verify", note: "offline check" },
      { name: "Methodology", href: "/methodology", note: "how we grade" },
    ],
  },
  {
    label: "Tools",
    items: [
      { name: "Framework Hive", href: "/hive" },
      { name: "Governance Graph", href: "/graph" },
      { name: "System Card", href: "/system-card" },
      { name: "Watchdog map", href: "/watchdog-map" },
      { name: "Status", href: "/status" },
    ],
  },
  {
    label: "Estate",
    items: [
      { name: "About", href: "/about" },
      { name: "Pricing", href: "/pricing" },
    ],
  },
];

function NavLink({ item }: { item: NavGroup["items"][number] }) {
  const isAnchor = item.href.startsWith("#");
  const inner = (
    <span className="flex items-center gap-2">
      <span className="flex-1 truncate">{item.name}</span>
      {item.badge && (
        <span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wide text-amber-600">
          {item.badge}
        </span>
      )}
    </span>
  );
  const cls =
    "group block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700";
  if (isAnchor) {
    return (
      <a href={item.href} className={cls}>
        {inner}
        {item.note && <span className="block text-[11px] font-normal text-slate-400 group-hover:text-emerald-600/70">{item.note}</span>}
      </a>
    );
  }
  return (
    <Link href={item.href} className={cls}>
      {inner}
      {item.note && <span className="block text-[11px] font-normal text-slate-400 group-hover:text-emerald-600/70">{item.note}</span>}
    </Link>
  );
}

export default function OsLauncher() {
  const [topModels, setTopModels] = useState(() => [...ARENA_SUBJECTS].sort((a, b) => b.refusal_rate - a.refusal_rate).slice(0, 5));

  useEffect(() => {
    document.title = "Council OS — the Council hub | councilof.ai";
    setTopModels([...ARENA_SUBJECTS].sort((a, b) => b.refusal_rate - a.refusal_rate).slice(0, 5));
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex max-w-7xl gap-8 px-5 py-8 lg:px-8">
        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside className="sticky top-8 hidden h-fit w-56 shrink-0 lg:block">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">C</span>
            <div>
              <div className="text-sm font-bold leading-none text-slate-900">Council OS</div>
              <div className="font-mono text-[10px] uppercase tracking-[1.5px] text-slate-400">councilof.ai</div>
            </div>
          </div>
          <nav className="space-y-5">
            {NAV.map((g) => (
              <div key={g.label}>
                <div className="mb-1 px-3 font-mono text-[10px] font-bold uppercase tracking-[2px] text-slate-400">{g.label}</div>
                <div className="space-y-0.5">
                  {g.items.map((it) => (
                    <NavLink key={it.name} item={it} />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* ── Main ────────────────────────────────────────────────── */}
        <main className="min-w-0 flex-1 space-y-10">
          {/* Hero + Council chat */}
          <section>
            <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-600">Council OS</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Measure. Sign. Check.
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">
              The living GSPC board, verify, Council Space, and the ask bar — one workspace.
              Counts come from GET /api/gspc. Empty cells stay empty.
            </p>
            <div className="mt-6 space-y-4">
              <a
                href={lobbyHref({ pane: "home" })}
                onClick={(e) => { e.preventDefault(); openLobby({ pane: "home" }); }}
                className="inline-flex rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Enter Council OS
              </a>
              <div className="flex flex-wrap gap-3 text-sm">
                <a href="/products" className="font-semibold text-emerald-700 hover:underline">Products</a>
                <a href="/indices" className="font-semibold text-emerald-700 hover:underline">Indices (UNMEASURED)</a>
                <a href="/mcp-fleet" className="font-semibold text-emerald-700 hover:underline">MCP fleet</a>
                <a href="/engine-axis" className="font-semibold text-emerald-700 hover:underline">Engine Axis</a>
                <a href="/dashboard" className="font-semibold text-emerald-700 hover:underline">DSH / dashboard</a>
              </div>
              <GameBar />
            </div>
          </section>

          {/* Zone 2 — the game (center stage) */}
          <section id="council-town" className="scroll-mt-8">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-emerald-50/60 to-white">
              <div className="grid gap-6 p-6 md:grid-cols-[1.3fr_1fr] md:p-8">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-600">Center stage · the game</span>
                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                      Client live
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Council Town</h2>
                  <p className="mt-2 max-w-md text-[14px] leading-relaxed text-slate-600">
                    Our estate-branded open-world town where AI agent clans deliberate — the living exhibit in the
                    Council OS Games arcade. Built on the open-source AI Town game shell (MIT), rebranded as
                    Council Town with the estate's own identity.
                  </p>
                  <p className="mt-3 max-w-md text-[13px] leading-relaxed text-slate-500">
                    The town client is deployed and playable. Its world (the agent simulation backend) switches on
                    with one owner-only login — nothing is simulated or faked in the meantime.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href="https://council-town.pages.dev"
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600"
                    >
                      Open Council Town ↗
                    </a>
                    <a
                      href={lobbyHref({ pane: "home" })}
                      onClick={(e) => { e.preventDefault(); openLobby({ pane: "home" }); }}
                      className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Open Council OS
                    </a>
                  </div>
                </div>

                {/* Deployed client — honest backend-state panel */}
                <div className="flex flex-col justify-center rounded-xl border border-emerald-200 bg-white/80 p-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-xl font-bold text-emerald-800">C</div>
                  <div className="mt-3 text-sm font-semibold text-slate-900">Client deployed · world owner-gated</div>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                    The town UI renders live. The agent world starts once the Convex backend login is completed
                    (one owner action) — then the clans walk, deliberate and get measured.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2 font-mono text-[11px] text-emerald-600">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    live at council-town.pages.dev
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Zone 3 — the Arena */}
          <section>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">The Arena</h2>
                  <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-slate-600">
                    Measured battles, deterministically graded — not preference votes. Each match is one provision and
                    two models, replayed from a recorded trace; the verdict is a predicate, not an opinion.
                  </p>
                </div>
                <div className="flex gap-5 font-mono text-[12px]">
                  <div className="text-center">
                    <div className="text-xl font-bold text-emerald-600">{ARENA_SUBJECTS.length}</div>
                    <div className="uppercase tracking-wide text-slate-400">models</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-emerald-600">{ARENA_MATCHES.length}</div>
                    <div className="uppercase tracking-wide text-slate-400">matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-emerald-600">{ARENA_PROVISIONS.length}</div>
                    <div className="uppercase tracking-wide text-slate-400">provisions</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-slate-600">Refusal rate on Art 5 prohibited practices</span>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-emerald-600">[measured]</span>
                </div>
                <div className="space-y-2">
                  {topModels.map((s, i) => (
                    <div key={s.id} className="grid items-center gap-3" style={{ gridTemplateColumns: "1.25rem minmax(6rem,9rem) 1fr auto" }}>
                      <span className="text-right font-mono text-[11px] text-slate-400">{i + 1}</span>
                      <span className="truncate text-[13px] font-semibold text-slate-800">{s.id}</span>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: `${s.refusal_rate * 100}%` }} />
                      </div>
                      <span className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-slate-500">
                        {(s.refusal_rate * 100).toFixed(1)}%
                        <span className="text-slate-400">n={s.n}</span>
                        {s.n < 20 && (
                          <span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold uppercase text-amber-600">lower bound</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <Link href="/gspc-arena" className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600">
                  Open the full Arena →
                </Link>
                <Link href="/methodology" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                  How it is graded — no LLM-as-judge
                </Link>
              </div>
            </div>
          </section>

          {/* Zone 4 — the GSPC axes */}
          <section id="axes" className="scroll-mt-8">
            <AxisPanel />
          </section>

          <footer className="border-t border-slate-100 pt-6 text-[12px] text-slate-400">
            One measured surface — the game, the arena, the axes and the Council together. Scores appear only where an
            axis has earned one; the Council refuses rather than guess.
          </footer>
        </main>
      </div>
    </div>
  );
}
