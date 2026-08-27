// TrainingView — the Council OS "Live Training" tab.
// The frozen→fluid bridge: regulation/AI changes (from the signed /api/regulation
// feed, reverified quarterly + on provision-change) surface as LIVE training
// quests. Each quest links the existing Academy/CEASAI courses into the town
// simulation (in-game training) and ends in a signed training record.
//
// Register: training attestation, never certification. A completed quest attests
// that training HAPPENED against the provision-version at completion time — it
// does not certify conformity. When the provision changes, the quest updates
// (frozen→fluid) and the learner is notified.
import { useEffect, useState } from "react";

interface Deadline {
  date: string;
  instrument: string;
  what: string;
  basis: string;
  status: "IN_FORCE" | "UPCOMING";
  penalty_exposure: string;
}

interface Quest {
  id: string;
  instrument: string;
  what: string;
  date: string;
  status: "IN_FORCE" | "UPCOMING";
  fresh: boolean;
  course: string;
  courseHref: string;
  townQuest: string;
  /** Carried from the deadline row; absent rows render nothing. */
  penalty_exposure?: string;
}

const COURSE_MAP: Record<string, { course: string; href: string; town: string }> = {
  "EU AI Act": { course: "EU AI Act Deep Dive", href: "/credential-training", town: "EU AI Act quest — keep the town's GPAI providers Art 50-transparent" },
  "Texas TRAIGA (HB 149)": { course: "AI Safety Fundamentals", href: "/credential-training", town: "Texas TRAIGA quest — 60-day cure: find the non-compliant deploy before the AG does" },
  "California SB 53": { course: "AI Safety Fundamentals", href: "/credential-training", town: "CA SB 53 quest — frontier developer disclosure: who must file and when" },
  "China GB 45438-2025": { course: "Incident Analysis", href: "/credential-training", town: "GB 45438 quest — spot the AI content missing its mandatory label" },
  "EU Cyber Resilience Act": { course: "Incident Analysis", href: "/credential-training", town: "CRA quest — 24h early warning: the town's IoT fleet got breached" },
  "Illinois SB 315": { course: "NIST AI RMF", href: "/credential-training", town: "IL SB 315 quest — first US audit mandate: walk the frontier model through its audit" },
  "EU Product Liability Directive": { course: "NIST AI RMF", href: "/credential-training", town: "PLD quest — strict liability: trace the defective software's lineage" },
};

export default function TrainingView() {
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/regulation")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((d) => {
        const deadlines: Deadline[] = d?.deadlines ?? [];
        const qs: Quest[] = deadlines
          .filter((dl) => COURSE_MAP[dl.instrument])
          .map((dl) => {
            const cm = COURSE_MAP[dl.instrument];
            return {
              id: dl.instrument + "-" + dl.date,
              instrument: dl.instrument,
              what: dl.what,
              date: dl.date,
              status: dl.status,
              fresh: dl.date >= "2026-08-01",
              course: cm.course,
              courseHref: cm.href,
              townQuest: cm.town,
              penalty_exposure: dl.penalty_exposure,
            };
          })
          .sort((a, b) => (a.status === b.status ? a.date.localeCompare(b.date) : a.status === "UPCOMING" ? -1 : 1));
        setQuests(qs);
      })
      .catch((e) => setErr(String(e)));
  }, []);

  const upcoming = quests?.filter((q) => q.status === "UPCOMING") ?? [];
  const inForce = quests?.filter((q) => q.status === "IN_FORCE") ?? [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-emerald-100">Live Training</h1>
        <p className="mt-1 text-xs text-emerald-200/60">
          Frozen → fluid: every regulation and AI change on the signed feed becomes a{" "}
          <span className="text-emerald-300">live training quest</span>. When a provision changes
          or a deadline lands, the quest updates here. What is live today: the deadline feed and
          the Academy course each quest maps to. The in-game town leg and the signed per-quest
          training record are <span className="text-amber-300">not built yet</span> — the cards
          below say so instead of linking you to a page that cannot train you.
          <span className="text-amber-300"> Attestation of training, never certification of conformity.</span>
        </p>
      </div>

      {err && <p className="text-xs text-red-300">regulation feed: {err}</p>}
      {!quests && !err && <p className="text-xs text-emerald-200/50">loading live quests…</p>}

      {/* UPCOMING — the fluid side: new obligations you must train for */}
      {quests && (
        <section className="mb-8 rounded-2xl border border-amber-400/20 bg-amber-950/20 p-5">
          <h2 className="mb-3 text-sm font-bold text-amber-100">
            ⏳ Upcoming — train before the deadline ({upcoming.length})
          </h2>
          {upcoming.length === 0 && <p className="text-xs text-amber-200/50">no upcoming mapped quests.</p>}
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.map((q) => (
              <div key={q.id} className="rounded-xl border border-amber-400/15 bg-amber-900/10 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-amber-100">{q.instrument}</h3>
                  {q.fresh && (
                    <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">NEW</span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-amber-200/70">{q.what}</p>
                <p className="mt-1 text-[10px] text-amber-200/50">
                  effective <span className="font-mono text-amber-300">{q.date}</span>
                </p>
                <p className="mt-1 text-[10px] text-amber-200/40">{q.penalty_exposure ?? ""}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={q.courseHref} className="rounded-lg bg-amber-400/20 px-3 py-1 text-[10px] font-bold text-amber-100 hover:bg-amber-400/30">
                    📚 {q.course}
                  </a>
                  <span
                    title="The in-game town leg of this quest is designed but not built. The towns page is a ledger record, not a playable trainer, so this chip does not link there."
                    className="rounded-lg border border-amber-400/20 px-3 py-1 text-[10px] text-amber-200/50"
                  >
                    🏘 {q.townQuest.slice(0, 52)}… — in-game leg not yet built
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* IN_FORCE — the frozen side: active obligations, keep fresh */}
      {quests && (
        <section className="rounded-2xl border border-emerald-400/20 bg-emerald-950/30 p-5">
          <h2 className="mb-3 text-sm font-bold text-emerald-100">
            🟢 In force — keep current ({inForce.length})
          </h2>
          {inForce.length === 0 && <p className="text-xs text-emerald-200/50">no in-force mapped quests.</p>}
          <div className="grid gap-3 md:grid-cols-2">
            {inForce.map((q) => (
              <div key={q.id} className="rounded-xl border border-emerald-400/15 bg-emerald-900/10 p-4">
                <h3 className="text-sm font-bold text-emerald-100">{q.instrument}</h3>
                <p className="mt-1 text-[11px] text-emerald-200/70">{q.what}</p>
                <p className="mt-1 text-[10px] text-emerald-200/50">
                  in force since <span className="font-mono text-emerald-300">{q.date}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={q.courseHref} className="rounded-lg bg-emerald-400/20 px-3 py-1 text-[10px] font-bold text-emerald-100 hover:bg-emerald-400/30">
                    📚 {q.course}
                  </a>
                  <span
                    title="The in-game town leg is designed but not built; the towns page is a ledger record, not a playable trainer."
                    className="rounded-lg border border-emerald-400/20 px-3 py-1 text-[10px] text-emerald-200/50"
                  >
                    🏘 In-game leg not yet built
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="mt-4 text-[10px] text-emerald-200/40">
        Quest source: /api/regulation (schema csoai.regulation-deadlines/0.1, verified 2026-08-19,
        reverified quarterly + on provision-change). When the signed per-quest training record
        ships it will attest training against the provision-version at completion time — never a
        certification of conformity. Today the Academy issues its own completion records; no
        per-quest record exists yet and none is implied.
        Frozen→fluid: a provision change re-issues the quest.
      </p>
    </div>
  );
}
