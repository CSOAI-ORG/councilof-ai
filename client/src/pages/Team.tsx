import { useEffect, useState } from "react";
import AISystemNotice from "@/components/AISystemNotice";
import PalAskPanel from "@/components/PalAskPanel";
import { DESKS, DESK_IDS, deskDisclosure, type DeskId } from "../../../functions/api/_chatDesks";

/**
 * /team — the people and the AI agents, on separate sections (the Griffin pattern: real humans
 * and named-by-role agents never mixed). People lists only who the About page names. Every agent
 * card is badged "AI agent", carries the Art. 50(1) disclosure, and its Ask opens the PAL
 * runtime (POST /api/pals/<id>/chat). No faces, no human bios, no fees.
 *
 * THE ASK IS NOT THE OLD CHAT. The old Ask posted to /api/chat, which has no model in it: it
 * matched patterns and, when no published record answered, returned a refusal. A reader could
 * ask the Press desk a question and be told what to ask instead. The Ask now goes to the PAL
 * runtime, which answers from the published records FIRST and consults the model only for
 * conversation — and every reply says which of those happened, so the reader can tell.
 *
 * The cards are still built from DESKS, the same definitions the PAL registry is derived from.
 * One vocabulary: the page and the door cannot describe different staff members. The Ask panel
 * itself is the shared component the Council OS staff pane opens, so the two surfaces cannot
 * drift apart either.
 */

type PalRecord = { id: string; slug: string; name: string; did: string };

export default function Team() {
  const [open, setOpen] = useState<DeskId | null>(null);
  const [registry, setRegistry] = useState<Record<string, PalRecord>>({});
  const [modelConfigured, setModelConfigured] = useState<boolean | null>(null);

  // The registry, not a second copy of it. The cards already read DESKS; this adds each staff
  // member's identity — the did:key its answers can be signed with — and whether a language
  // model is configured for this deployment, so a reader knows before asking which of the two
  // they are about to get.
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const r = await fetch("/api/pals");
        if (!r.ok) return;
        const j = await r.json();
        if (!live) return;
        const byslug: Record<string, PalRecord> = {};
        for (const s of (j?.staff ?? []) as PalRecord[]) byslug[s.slug] = s;
        setRegistry(byslug);
        setModelConfigured(Boolean(j?.model_configured));
      } catch {
        // The cards do not depend on the registry. If it cannot be read, the page still works
        // and simply does not claim an identity it could not confirm.
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-emerald-50">
      <h1 className="mb-4 text-3xl font-bold sm:text-4xl">Team</h1>
      <p className="mb-8 text-gray-300">
        The people who run Council of AI, and the AI agents that answer questions from our published records.
        The agents are software. They are listed separately and are never presented as staff.
      </p>
      <AISystemNotice route="/team" />

      <section aria-labelledby="people" className="mb-12">
        <h2 id="people" className="mb-4 text-2xl font-bold">People</h2>
        <div className="rounded-2xl border border-emerald-500/20 p-5" data-testid="team-person">
          <h3 className="text-lg font-semibold">Nicholas Templeman</h3>
          <p className="text-gray-300">
            Founder of CSOAI Ltd (UK Companies House 16939677), which operates Council of AI and is accountable for
            everything published on this site. See <a href="/about/" className="underline">About</a>.
          </p>
        </div>
      </section>

      <section aria-labelledby="agents">
        <h2 id="agents" className="mb-2 text-2xl font-bold">AI agents</h2>
        <p className="mb-2 text-gray-300">
          Each desk is the same Council staff with a narrower scope. It answers from published records, or says
          UNMEASURED, or talks — and it tells you which of those it just did.
        </p>
        {modelConfigured === false ? (
          <p role="note" data-testid="team-model-state" className="mb-6 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-100">
            No language model is configured for this deployment, so these staff answer from published records only.
            Nothing is invented to fill the gap.
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DESK_IDS.map((id) => {
            const d = DESKS[id];
            const rec = registry[id];
            return (
              <article key={id} data-testid={`agent-${id}`} className="flex flex-col rounded-2xl border border-sky-400/30 bg-sky-500/5 p-5">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{d.name}</h3>
                  <span className="rounded-full border border-sky-400/50 px-2 py-0.5 text-[11px] text-sky-200">AI agent</span>
                </div>
                <p className="mb-3 text-sm text-gray-300">{d.role}</p>
                <p className="text-xs font-semibold uppercase text-emerald-300">Can answer</p>
                <ul className="mb-2 list-disc pl-5 text-sm">{d.can.map((c) => <li key={c}>{c}</li>)}</ul>
                <p className="text-xs font-semibold uppercase text-amber-300">Can't answer</p>
                <ul className="mb-3 list-disc pl-5 text-sm">{d.cannot.map((c) => <li key={c}>{c}</li>)}</ul>
                <p role="note" className="mb-4 text-[12px] text-sky-100/80">{deskDisclosure(d.name)}</p>
                {rec?.did ? (
                  <p className="mb-3 break-all text-[11px] text-emerald-100/60" data-testid={`agent-did-${id}`}>
                    did:key:{rec.did.replace(/^did:key:/, "").slice(0, 16)}…
                  </p>
                ) : null}
                <button type="button" onClick={() => setOpen(id)} className="mt-auto rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold">
                  Ask {d.name}
                </button>
              </article>
            );
          })}
        </div>
      </section>
      {open && <PalAskPanel desk={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
