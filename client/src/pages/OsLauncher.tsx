import { useEffect } from "react";
import { Link } from "wouter";
import GameBar from "@/components/os/GameBar";
import AxisPanel from "@/components/os/AxisPanel";
import CityPanel from "@/components/os/CityPanel";
import { lobbyHref, openLobby } from "@/lib/lobbyLink";
import { FOCUS } from "@/components/lobby/glass";

/**
 * OsLauncher — crawlable /os page. The operable OS is the Council OS overlay
 * (Enter Council OS). This page keeps the town / arena / axes for readers and
 * crawlers; it no longer hosts a second chat. `/console` and `/council-os`
 * alias to the overlay.
 *
 * Brand: white background, emerald (#10b981) accent. Real data only — no
 * invented metrics, no killed/branded routes.
 */

type NavGroup = {
  label: string;
  items: { name: string; href: string; note?: string; badge?: string; task?: Parameters<typeof openLobby>[0]["task"]; pane?: Parameters<typeof openLobby>[0]["pane"] }[];
};

const NAV: NavGroup[] = [
  {
    label: "Play",
    items: [
      { name: "Council Town", href: "#council-town", note: "the agent-town game", badge: "live" },
      { name: "The Arena", href: "/gspc-arena", note: "model vs model", pane: "space" },
      { name: "Live demo & tour", href: "/demo", note: "watch it run" },
    ],
  },
  {
    label: "City",
    items: [
      { name: "Council City", href: "#city", note: "living printer of the public board" },
      { name: "Living board", href: "#city", note: "counts from GET /api/gspc" },
      { name: "Paper District", href: "https://councilof.ai/paper-district", note: "research library" },
      { name: "Council Space", href: "/gspc-arena", note: "the governed arena", pane: "space" },
    ],
  },
  {
    label: "Measure",
    items: [
      { name: "GSPC axes", href: "#axes", note: "living board · counts from /api/gspc" },
      { name: "Live board", href: "/gspc-scoreboard", note: "signed scores", pane: "board" },
      { name: "Results", href: "/benchmarks", note: "every artefact-bound figure", pane: "results" },
      { name: "Models", href: "/models", note: "ranked by signed scores", pane: "models" },
      { name: "Verify a card", href: "/gspc-verify", note: "offline check", pane: "verify" },
      { name: "Methodology", href: "/methodology", note: "how we grade", task: "browse-methodology" },
    ],
  },
  {
    label: "Tools",
    items: [
      { name: "Published tools", href: "/tools", pane: "tools" },
      { name: "Claim integrity", href: "/honesty", note: "claim-vs-artifact check", badge: "live", pane: "claimguard" },
      { name: "Workbench", href: "/workbench", pane: "workbench" },
      { name: "Library", href: "/library", pane: "library" },
      { name: "Watchdog map", href: "/watchdog-map", pane: "watchdog" },
      { name: "Get assessed", href: "/assess", note: "human-rail assessment", pane: "ras" },
    ],
  },
  {
    label: "Estate",
    items: [
      { name: "About", href: "/about" },
      { name: "How the free rail works", href: "/?lobby=measured&task=pricing-overview" },
    ],
  },
];

function NavLink({ item }: { item: NavGroup["items"][number] }) {
  const isAnchor = item.href.startsWith("#");
  const isExternal = item.href.startsWith("http");
  const inner = (
    <span className="flex items-center gap-2">
      <span className="flex-1 truncate">{item.name}</span>
      {item.badge && (
        <span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-amber-700">
          {item.badge}
        </span>
      )}
    </span>
  );
  const cls =
    "group block min-h-[44px] rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition " +
    "hover:bg-emerald-50 hover:text-emerald-800 lg:min-h-0 " + FOCUS;
  if (isAnchor || isExternal) {
    return (
      <a href={item.href} className={cls} {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}>
        {inner}
        {item.note && <span className="block text-[11px] font-normal text-slate-500 group-hover:text-emerald-800">{item.note}</span>}
      </a>
    );
  }
  if (item.pane || item.task) {
    const href = lobbyHref({ pane: item.pane, task: item.task, path: "/os" });
    return (
      <a
        href={href}
        className={cls}
        onClick={(e) => {
          e.preventDefault();
          openLobby({ pane: item.pane, task: item.task });
        }}
      >
        {inner}
        {item.note && <span className="block text-[11px] font-normal text-slate-500 group-hover:text-emerald-800">{item.note}</span>}
      </a>
    );
  }
  return (
    <Link href={item.href} className={cls}>
      {inner}
      {item.note && <span className="block text-[11px] font-normal text-slate-500 group-hover:text-emerald-800">{item.note}</span>}
    </Link>
  );
}

export default function OsLauncher() {
  useEffect(() => {
    document.title = "Council OS — the Council hub | councilof.ai";
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex max-w-7xl gap-8 px-5 py-8 lg:px-8">
        <aside className="sticky top-8 hidden h-fit w-56 shrink-0 lg:block" aria-label="Council OS sections">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">C</span>
            <div>
              <div className="text-sm font-bold leading-none text-slate-900">Council OS</div>
              <div className="font-mono text-[10px] uppercase tracking-[1.5px] text-slate-600">councilof.ai</div>
            </div>
          </div>
          <nav className="space-y-5">
            {NAV.map((g) => (
              <div key={g.label}>
                <div className="mb-1 px-3 font-mono text-[10px] font-bold uppercase tracking-[2px] text-slate-500">{g.label}</div>
                <div className="space-y-0.5">
                  {g.items.map((it) => (
                    <NavLink key={it.name} item={it} />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 space-y-10">
          {/* 2026-08-26: the sidebar above is `hidden lg:block`, so below 1024px
              every one of these ~20 destinations was unreachable from /os. The
              same NAV is rendered here as a disclosure for small screens. */}
          <details className="rounded-2xl border border-slate-200 bg-white lg:hidden">
            <summary className={`flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 ${FOCUS}`}>
              <span>Browse Council OS</span>
              <span aria-hidden="true" className="font-mono text-[11px] uppercase tracking-[2px] text-slate-500">menu</span>
            </summary>
            <nav aria-label="Council OS sections (mobile)" className="space-y-5 border-t border-slate-100 px-2 pb-4 pt-4">
              {NAV.map((g) => (
                <div key={g.label}>
                  <div className="mb-1 px-3 font-mono text-[10px] font-bold uppercase tracking-[2px] text-slate-500">{g.label}</div>
                  <div className="space-y-0.5">
                    {g.items.map((it) => (
                      <NavLink key={it.name} item={it} />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </details>
          <section>
            <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-700">Council OS</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Measure. Sign. Check.</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">
              The living GSPC board, verify, Council Space, and the ask bar — one workspace.
              Counts come from GET /api/gspc. Empty cells stay empty.
            </p>
            <div className="mt-6 space-y-4">
              <a href={lobbyHref({ pane: "home" })} onClick={(e) => { e.preventDefault(); openLobby({ pane: "home" }); }} className={`inline-flex min-h-[44px] items-center rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 ${FOCUS}`}>Enter Council OS</a>
              <GameBar />
            </div>
          </section>
          <section id="council-town" className="scroll-mt-8">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-emerald-50/60 to-white">
              <div className="grid gap-6 p-6 md:grid-cols-[1.3fr_1fr] md:p-8">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-700">Center stage · the game</span>
                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-emerald-700">Client live</span>
                  </div>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Council Town</h2>
                  <p className="mt-2 max-w-md text-[14px] leading-relaxed text-slate-600">Our estate-branded open-world town where AI agent clans deliberate — the living exhibit in the Council OS Games arcade.</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a href="https://council-town.pages.dev" target="_blank" rel="noreferrer" className={`inline-flex min-h-[44px] items-center rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 ${FOCUS}`}>Open Council Town ↗</a>
                    <a href={lobbyHref({ pane: "home" })} onClick={(e) => { e.preventDefault(); openLobby({ pane: "home" }); }} className={`inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 ${FOCUS}`}>Open Council OS</a>
                  </div>
                </div>
                <div className="flex flex-col justify-center rounded-xl border border-emerald-200 bg-white/80 p-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-xl font-bold text-emerald-800">C</div>
                  <div className="mt-3 text-sm font-semibold text-slate-900">Client deployed · world owner-gated</div>
                </div>
              </div>
            </div>
          </section>
          <section>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
              <h2 className="text-2xl font-bold text-slate-900">The Arena</h2>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <Link href="/gspc-arena" className={`inline-flex min-h-[44px] items-center rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 ${FOCUS}`}>Open the full Arena →</Link>
                <Link href="/methodology" className={`inline-flex min-h-[44px] items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800 ${FOCUS}`}>How it is graded — no LLM-as-judge</Link>
              </div>
            </div>
          </section>
          <section id="city" className="scroll-mt-8">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-emerald-50/40 to-white">
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-700">Council City</span>
                  <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-emerald-700">Live from /api/gspc</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Council City</h2>
                <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-slate-600">
                  The living printer of the public board. Axis and model counts come from GET /api/gspc.
                  Empty cells stay empty. Measurement credential, never certification.
                </p>
                <div className="mt-6"><CityPanel /></div>
              </div>
            </div>
          </section>
          <section id="axes" className="scroll-mt-8"><AxisPanel /></section>
          <footer className="border-t border-slate-100 pt-6 text-[12px] text-slate-500">One measured surface — the game, the arena, the axes and the Council together.</footer>
        </main>
      </div>
    </div>
  );
}
