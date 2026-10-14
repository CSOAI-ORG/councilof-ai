import { useState } from "react";
import AISystemNotice from "@/components/AISystemNotice";
import { DESKS, DESK_IDS, deskDisclosure, type DeskId } from "../../../functions/api/_chatDesks";

/**
 * /team — the people and the AI agents, on separate sections (the Griffin pattern: real humans
 * and named-by-role agents never mixed). People lists only who the About page names. Every agent
 * card is badged "AI agent", carries the Art. 50(1) disclosure, and its Ask opens the existing
 * Council chat (POST /api/chat) with a desk tag. No faces, no human bios, no fees.
 */

type Turn = { who: "you" | "agent"; text: string };

function AskPanel({ desk, onClose }: { desk: DeskId; onClose: () => void }) {
  const d = DESKS[desk];
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);

  async function send() {
    const message = q.trim();
    if (!message || busy) return;
    setTurns((t) => [...t, { who: "you", text: message }]);
    setQ("");
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, desk }),
      });
      const j = await r.json();
      setTurns((t) => [...t, { who: "agent", text: String(j?.answer ?? "UNMEASURED: no answer was returned.") }]);
    } catch {
      setTurns((t) => [...t, { who: "agent", text: "The chat could not be reached. Nothing was answered." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div role="dialog" aria-label={`Ask ${d.name}`} className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-xl rounded-2xl border border-emerald-500/30 bg-[#06110c] p-5 text-emerald-50">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-bold">Ask {d.name}</h2>
          <span className="rounded-full border border-sky-400/50 px-2 py-0.5 text-[11px] text-sky-200">AI agent</span>
          <button type="button" onClick={onClose} className="ml-auto text-sm underline">Close</button>
        </div>
        <p role="note" data-testid="chat-disclosure" className="mb-3 rounded-xl border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-[13px]">
          {deskDisclosure(d.name)}
        </p>
        <div className="mb-3 max-h-72 space-y-2 overflow-y-auto text-sm">
          {turns.map((t, i) => (
            <p key={i} className={t.who === "you" ? "text-right text-emerald-200" : "whitespace-pre-wrap text-emerald-50/90"}>
              <span className="mr-1 text-[11px] uppercase text-emerald-100/50">{t.who === "you" ? "You" : `${d.name} (AI)`}</span>
              {t.text}
            </p>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Ask ${d.name} about ${d.role.toLowerCase()}`}
            className="flex-1 rounded-lg border border-emerald-500/30 bg-black/40 px-3 py-2 text-sm"
          />
          <button type="submit" disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold disabled:opacity-50">
            {busy ? "…" : "Ask"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Team() {
  const [open, setOpen] = useState<DeskId | null>(null);
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 text-emerald-50">
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
        <p className="mb-6 text-gray-300">
          Each desk is the same Council chat with a narrower scope. It answers from published records or says UNMEASURED.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DESK_IDS.map((id) => {
            const d = DESKS[id];
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
                <button type="button" onClick={() => setOpen(id)} className="mt-auto rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold">
                  Ask {d.name}
                </button>
              </article>
            );
          })}
        </div>
      </section>
      {open && <AskPanel desk={open} onClose={() => setOpen(null)} />}
    </main>
  );
}
