import { useState } from "react";
import { DESKS, deskDisclosure, type DeskId } from "../../../functions/api/_chatDesks";

/**
 * The one chat a staff member is reached through.
 *
 * SHARED BY /team AND THE COUNCIL OS STAFF PANE, ON PURPOSE. Two surfaces that each carried
 * their own copy of "ask the desk" is how a page and a door end up describing different
 * behaviour. There is one component, one endpoint (POST /api/pals/<slug>/chat) and one reply
 * shape, so both surfaces show the reader the same thing.
 *
 * THE REPLY CARRIES ITS PROVENANCE. Every answer reports which of the four things happened:
 *
 *   grounded   the published records answered; the model was never consulted
 *   model      the model spoke, on the records, for conversation the records do not cover
 *   ungrounded no published record answers it, and nothing was invented
 *   refused    the reply broke a standing rule and was withheld
 *
 * A reader can tell which happened without asking, and a reply that was withheld says so
 * rather than being quietly replaced by something that sounds fine.
 */

export type PalState = "grounded" | "model" | "ungrounded" | "refused";

export type PalTurn = {
  who: "you" | "agent";
  text: string;
  state?: PalState;
  source?: string | null;
  model?: string | null;
  guardrail?: string | null;
};

/** What the runtime reported, in the reader's words. */
const STATE_NOTE: Record<PalState, string> = {
  grounded: "answered from published records",
  model: "answered by the language model, on the records",
  ungrounded: "no published record answers that",
  refused: "that reply was withheld",
};

const STATE_CLASS: Record<PalState, string> = {
  grounded: "border-emerald-400/50 text-emerald-200",
  model: "border-sky-400/50 text-sky-200",
  ungrounded: "border-amber-400/50 text-amber-200",
  refused: "border-rose-400/50 text-rose-200",
};

export default function PalAskPanel({ desk, onClose }: { desk: DeskId; onClose: () => void }) {
  const d = DESKS[desk];
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<PalTurn[]>([]);
  const [busy, setBusy] = useState(false);

  async function send() {
    const message = q.trim();
    if (!message || busy) return;
    const history = turns
      .filter((t) => t.who === "agent" && t.text)
      .slice(-6)
      .map((t) => ({ role: "assistant" as const, content: t.text }));
    setTurns((t) => [...t, { who: "you", text: message }]);
    setQ("");
    setBusy(true);
    try {
      const r = await fetch(`/api/pals/${desk}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const j = await r.json();
      if (!r.ok) {
        setTurns((t) => [
          ...t,
          {
            who: "agent",
            text: String(j?.error ?? "The staff member could not be reached. Nothing was answered."),
            state: "ungrounded",
          },
        ]);
        return;
      }
      setTurns((t) => [
        ...t,
        {
          who: "agent",
          text: String(j?.answer ?? "UNMEASURED: no answer was returned."),
          state: (j?.state as PalState) ?? "ungrounded",
          source: j?.source ?? null,
          model: j?.model?.model ?? null,
          guardrail: j?.guardrail ?? null,
        },
      ]);
    } catch {
      setTurns((t) => [
        ...t,
        { who: "agent", text: "The staff member could not be reached. Nothing was answered.", state: "ungrounded" },
      ]);
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
            <div key={i} className={t.who === "you" ? "text-right text-emerald-200" : "text-emerald-50/90"}>
              <p className={t.who === "you" ? "" : "whitespace-pre-wrap"}>
                <span className="mr-1 text-[11px] uppercase text-emerald-100/50">{t.who === "you" ? "You" : `${d.name} (AI)`}</span>
                {t.text}
              </p>
              {t.who === "agent" && t.state ? (
                <p className="mt-1 text-[11px] text-emerald-100/70">
                  <span data-testid="pal-turn-state" className={`inline-block rounded-full border px-2 py-0.5 ${STATE_CLASS[t.state]}`}>{t.state}</span>{" "}
                  {STATE_NOTE[t.state]}
                  {t.source ? <> · record: <span className="text-emerald-100/90">{t.source}</span></> : null}
                  {t.model ? <> · model: <span className="text-emerald-100/90">{t.model}</span></> : null}
                  {t.guardrail ? <> · withheld: <span className="text-rose-200">{t.guardrail}</span></> : null}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="flex gap-2">
          <input
            data-testid="pal-ask-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Ask ${d.name} about ${d.role.toLowerCase()}`}
            className="flex-1 rounded-lg border border-emerald-500/30 bg-black/40 px-3 py-2 text-sm"
          />
          <button type="submit" data-testid="pal-ask-send" disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold disabled:opacity-50">
            {busy ? "…" : "Ask"}
          </button>
        </form>
      </div>
    </div>
  );
}
