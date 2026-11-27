import { useEffect, useState } from "react";
import PalAskPanel from "@/components/PalAskPanel";
import HitlConsole from "@/components/HitlConsole";
import { reportedStaffDid, staffStoreState } from "@/lib/staffReadiness";
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
  const [storeState, setStoreState] = useState<ReturnType<typeof staffStoreState>>("UNKNOWN");
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
        setStaff((Array.isArray(j?.staff) ? j.staff.filter((v: unknown) => v && typeof v === "object") : []) as PalRecord[]);
        setStoreState(staffStoreState(j));
        setModelConfigured(typeof j?.model_configured === "boolean" ? j.model_configured : null);
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
    return { id, name: DESKS[id].name, role: DESKS[id].role, did: reportedStaffDid(rec) };
  });

  // This pane draws no background of its own: it sits on the light Council OS shell, so it uses the
  // shell's tokens (text-foreground, text-muted-foreground, bg-card, border-border). Until 17 Nov 2026
  // it used colours made for a dark page (text-emerald-50, text-gray-300, text-sky-200), and its text
  // read at 1.05-1.67:1 contrast: white on white. PalAskPanel and HitlConsole draw their own dark box.
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-foreground">
      <h1 className="mb-2 text-2xl font-bold">Staff</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        The Council of AI staff. Each desk is an AI agent with a declared scope. Persistent storage and signing depend on the live registry; neither grants human or execution authority. It answers from published records, or says UNMEASURED, or talks — and it tells you which.
      </p>

      {modelConfigured === false ? (
        <p role="note" className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
          No language model is configured for this deployment, so these staff answer from published records only.
          Nothing is invented to fill the gap.
        </p>
      ) : modelActive ? (
        <p role="note" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-900">
          Model configured: <span className="font-semibold">{modelActive}</span>. Records are answered first; the
          model is consulted for conversation the records do not cover.
        </p>
      ) : null}

      <p role="note" className="mb-6 rounded-xl border border-border bg-card p-3 text-sm" data-testid="staff-store-state">
        {storeState === "UNBOUND" ? "Staff storage is not bound in this deployment. Do not rely on persistent staff memory or case retention." :
          storeState === "BOUND_REPORTED" ? "Staff storage is reported bound. This does not establish persistence of a particular case." :
          "Staff storage status is unknown. Do not rely on persistent memory or case retention."}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <article key={r.id} data-testid={`os-agent-${r.id}`} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-lg font-semibold">{r.name}</h2>
              <span className="rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-[11px] text-sky-800">AI agent</span>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">{r.role}</p>
            <p role="note" className="mb-3 text-[12px] text-slate-700">{deskDisclosure(r.name)}</p>
            {r.did ? (
              <p className="mb-3 break-all text-[11px] text-muted-foreground">
                Registry-reported did:key:{r.did.replace(/^did:key:/, "").slice(0, 16)}…
              </p>
            ) : (
              <p className="mb-3 text-[11px] text-muted-foreground">
                No signing key yet — these answers cannot be attributed to a key.
              </p>
            )}
            <button
              type="button"
              onClick={() => setOpen(r.id)}
              className="mt-auto rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Ask {r.name}
            </button>
          </article>
        ))}
      </div>

      {!loaded ? <p className="mt-4 text-xs text-muted-foreground">Reading the registry…</p> : null}
      {open && <PalAskPanel desk={open} onClose={() => setOpen(null)} onEscalation={setChallenge} />}

      <HitlConsole challenge={challenge} />
    </div>
  );
}
