import { useEffect, useState, type MouseEvent } from "react";
import { openLobby, lobbyHref } from "@/lib/lobbyLink";

// Academy - training + demo distribution surface. Turns the OS into courses anyone can
// learn from and share. Each track is a short, sharable path through the live OS.
type TrackStep =
  | { t: string; href: string }
  | { t: string; lobby: { pane: "home"; ask?: string } };

type Track = { id: string; name: string; level: string; mins: number; blurb: string; steps: TrackStep[] };

const TRACKS: Track[] = [
  { id: "board", name: "Read the living board", level: "Beginner", mins: 15, blurb: "What is measured, what is empty, how to check a card. Completion attests training, not conformity.", steps: [
    { t: "Open Council OS", lobby: { pane: "home" } },
    { t: "The living board — empty cells stay empty", href: "/gspc-scoreboard" },
    { t: "Verify a card in your browser", href: "/gspc-verify" },
    { t: "Ask as the reader you are", lobby: { pane: "home", ask: "In plain words, what does the Council of AI actually measure?" } },
  ]},
  { id: "found", name: "Foundations of AI Governance", level: "Beginner", mins: 20, blurb: "Why governance, where it comes from, and how the OS decides.", steps: [
    { t: "Rediscovered, Not Invented - 4,000 years", href: "/lineage" },
    { t: "The Hive - how consensus works", href: "/hive" },
    { t: "The 4-Wing Model", href: "/dragonfly" },
    { t: "Try the Council yourself", href: "/try" },
  ]},
  { id: "law", name: "Know Your Jurisdiction", level: "Beginner", mins: 15, blurb: "Read the cross-layer law stack for any place.", steps: [
    { t: "MEOK Law by jurisdiction", href: "/meok-law" },
    { t: "Framework Temples", href: "/temples" },
    { t: "Relevance Map", href: "/map" },
  ]},
  { id: "sector", name: "Govern Your Sector", level: "Practitioner", mins: 25, blurb: "Find your industry, its frameworks, and the next steps.", steps: [
    { t: "Sector Atlas - find your sector", href: "/sectors" },
    { t: "Industry Playbooks", href: "/playbooks" },
    { t: "Ask the Council about your system", href: "/try" },
  ]},
  { id: "build", name: "Build on the OS", level: "Advanced", mins: 30, blurb: "Legacy bridging, Council towns, and the distribution model.", steps: [
    { t: "Legacy Bridge", href: "/legacy" },
    { t: "Council Towns - the multiplication engine", href: "/towns" },
    { t: "Services - the whole OS", href: "/services" },
  ]},
];

function stepHref(step: TrackStep): string {
  if ("lobby" in step) {
    return lobbyHref({
      pane: step.lobby.pane,
      prompt: step.lobby.ask,
    });
  }
  return step.href;
}

function onStepClick(e: MouseEvent, step: TrackStep) {
  if (!("lobby" in step)) return;
  e.preventDefault();
  openLobby({
    pane: step.lobby.pane,
    prompt: step.lobby.ask,
  });
}

export default function Academy() {
  useEffect(() => { document.title = "CSOAI Academy — learn the living board"; }, []);
  const [t, setT] = useState("board");
  const track = TRACKS.find((x) => x.id === t) || TRACKS[0];
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - academy</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">Learn the board in an afternoon</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Short tracks through the live site. Course completion attests training, not conformity. Pick a track, follow the steps, send the link.</p>
          <p className="mt-2 max-w-2xl text-sm text-emerald-100/80">Completion issues a measurement credential (training attestation), not a certificate of conformity or framework accreditation.</p>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-10 grid gap-8 lg:grid-cols-[300px_1fr] items-start">
        <div className="space-y-2">
          {TRACKS.map((x) => (
            <button key={x.id} onClick={() => setT(x.id)} className={"w-full rounded-xl border px-4 py-3 text-left transition-colors " + (t === x.id ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:bg-gray-50")}>
              <div className="font-bold text-gray-900">{x.name}</div>
              <div className="text-xs text-gray-500">{x.level} - {x.mins} min</div>
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-gray-200 p-6">
          <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">{track.level} - {track.mins} min</div>
          <div className="mt-1 text-2xl font-black text-gray-900">{track.name}</div>
          <p className="mt-1 text-gray-600">{track.blurb}</p>
          <ol className="mt-5 space-y-3">
            {track.steps.map((s, i) => (
              <li key={stepHref(s)}>
                <a
                  href={stepHref(s)}
                  onClick={(e) => onStepClick(e, s)}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 hover:border-emerald-300 hover:bg-emerald-50/40"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">{i + 1}</span>
                  <span className="font-semibold text-gray-800">{s.t}</span>
                  <span className="ml-auto text-emerald-700 font-bold">-&gt;</span>
                </a>
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Share this track: send the first link. Every step is a live page. Completing it does not certify a system.
          </div>
        </div>
      </section>
    </div>
  );
}
