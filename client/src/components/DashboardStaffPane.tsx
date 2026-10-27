import { useEffect, useState } from "react";
import PalAskPanel from "@/components/PalAskPanel";
import HitlConsole from "@/components/HitlConsole";
import { DESKS, DESK_IDS, deskDisclosure, type DeskId } from "../../../functions/api/_chatDesks";

/**
 * Council OS → Staff. The house staff, and a way to speak to one.
 *
 * SAME REGISTRY, SAME CHAT AS /team. This pane reads GET /api/pals — the registry the API
 * serves — and opens the same PalAskPanel component that /team opens, against the same
 * POST /api/pals/<slug>/chat. There is no second description of the staff and no second chat:
 * the desk definitions in _chatDesks.ts are what the registry is derived from, so the pane, the
 * page and the API cannot drift apart.
 *
 * The pane states plainly when no language model is configured, because that changes what a
 * reader is getting: the published records alone, or the records plus conversation. It never
 * implies a model is there when it is not.
 */

type PalRecord = {
  id: string;
  slug: string;
  name: string;
  one_line: string;
  did: string;
  signed: boolean;
  status: string;
};

export default function DashboardStaffPane() {
  const [open, setOpen] = useState<DeskId | null>(null);
  const [staff, setStaff] = useState<PalRecord[]>([]);
  const [modelConfigured, setModelConfigured] = useState<boolean | null>(null);
  const [modelActive, setModelActive] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  // The challenge a staff member raised instead of performing the act itself.
  const [challenge, setChallenge] = useState<any>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const r = await fetch("/api/pals");
        if (!r.ok) return;
        const j = await r.json();
        if (!live) return;
        setStaff((j?.staff ?? []) as PalRecord[]);
        setModelConfigured(Boolean(j?.model_configured));
        setModelActive(j?.model_active ?? null);
      } catch {
        // The staff list is also derivable from the desk definitions, so a registry that cannot
        // be read degrades to the local list rather than an empty pane.
      } finally {
        if (live) setLoaded(true);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  // The desk definitions are the fallback and the scope; the registry adds identity and state.
  const rows = DESK_IDS.map((id) => {
    const rec = staff.find((s) => s.slug === id);
    return { id, name: DESKS[id].name, role: DESKS[id].role, did: rec?.did ?? "" };
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-emerald-50">
      <h1 className="mb-2 text-2xl font-bold">Staff</h1>
      <p className="mb-6 text-sm text-gray-300">
        The Council of AI staff. Each one is an AI agent with its own identity, its own scope and its own
        memory namespace. It answers from published records, or says UNMEASURED, or talks — and it tells you which.
      </p>

      {modelConfigured === false ? (
        <p role="note" className="mb-6 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-100">
          No language model is configured for this deployment, so these staff answer from published records only.
          Nothing is invented to fill the gap.
        </p>
      ) : modelActive ? (
        <p role="note" className="mb-6 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-100">
          Model configured: <span className="font-semibold">{modelActive}</span>. Records are answered first; the
          model is consulted for conversation the records do not cover.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <article key={r.id} data-testid={`os-agent-${r.id}`} className="flex flex-col rounded-2xl border border-sky-400/30 bg-sky-500/5 p-5">
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-lg font-semibold">{r.name}</h2>
              <span className="rounded-full border border-sky-400/50 px-2 py-0.5 text-[11px] text-sky-200">AI agent</span>
            </div>
            <p className="mb-3 text-sm text-gray-300">{r.role}</p>
            <p role="note" className="mb-3 text-[12px] text-sky-100/80">{deskDisclosure(r.name)}</p>
            {r.did ? (
              <p className="mb-3 break-all text-[11px] text-emerald-100/60">
                did:key:{r.did.replace(/^did:key:/, "").slice(0, 16)}…
              </p>
            ) : (
              <p className="mb-3 text-[11px] text-emerald-100/60">
                No signing key yet — these answers cannot be attributed to a key.
              </p>
            )}
            <button
              type="button"
              onClick={() => setOpen(r.id)}
              className="mt-auto rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold"
            >
              Ask {r.name}
            </button>
          </article>
        ))}
      </div>

      {!loaded ? <p className="mt-4 text-xs text-emerald-100/50">Reading the registry…</p> : null}
      {open && <PalAskPanel desk={open} onClose={() => setOpen(null)} onEscalation={setChallenge} />}

      <HitlConsole challenge={challenge} />
    </div>
  );
}
