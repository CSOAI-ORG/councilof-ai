/**
 * Home composer — a box, not an AG-UI protocol.
 * Paste a card → verify. Claude-at-work → get measured. Name an axis → the board.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import {
  GET_MEASURED_REPLY,
  liveCountLine,
  looksLikeCardJson,
  namedAxis,
  wantsGetMeasured,
} from "@/components/os/osChat";
import { formatComputeReply } from "@/lib/computeBridge";
import { fetchPinnedCardKey, verifyCard, type CardVerdict } from "@/lib/cardVerify";
import {
  axisFromFn,
  censusNote,
  correctionsNote,
  parseTerminal,
  TERMINAL_HINT,
} from "@/lib/terminalFn";
import { loadWatchlist, saveWatchlist, upsertWatch } from "@/lib/watchlist";

export default function HomeComposer({
  onAskAxis,
}: {
  onAskAxis?: (axis: string) => void;
}) {
  const [, setLoc] = useLocation();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [verdict, setVerdict] = useState<CardVerdict | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function submit() {
    const raw = text.trim();
    setNote(null);
    setVerdict(null);
    if (!raw || busy) return;

    const parsed = parseTerminal(raw);

    if (parsed.fn === "BOARD") {
      setBusy(true);
      try {
        const r = await fetch("/api/gspc", { headers: { accept: "application/json" } });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const j = await r.json();
        setNote(`BOARD — ${liveCountLine(j?.totals ?? {})}. Empty stays empty.`);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setNote(`BOARD failed (${msg}). Cite GET /api/gspc.`);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (parsed.fn === "CORRECT") {
      setBusy(true);
      try {
        const r = await fetch("/api/corrections", { headers: { accept: "application/json" } });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const j = await r.json();
        const n = Array.isArray(j?.corrections) ? j.corrections.length : j?.count;
        setNote(correctionsNote(n));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setNote(`CORRECT failed (${msg}). Cite GET /api/corrections.`);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (parsed.fn === "COMPUTE") {
      setBusy(true);
      try {
        const r = await fetch("/api/compute", { headers: { accept: "application/json" } });
        if (!r.ok) throw new Error("HTTP " + r.status);
        setNote(formatComputeReply(await r.json()));
        setLoc("/os?lobby=harness");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setNote(`COMPUTE failed (${msg}). Cite GET /api/compute.`);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (parsed.fn === "CENSUS" || parsed.fn === "WATCH") {
      const id = parsed.paste === "hub-id" ? parsed.arg : parsed.arg.trim();
      if (!id) {
        setNote("CENSUS / WATCH needs an owner/name id. DISCOVERED, never MEASURED.");
        return;
      }
      const store = typeof localStorage === "undefined" ? null : localStorage;
      saveWatchlist(store, upsertWatch(loadWatchlist(store), [id]));
      setNote(
        parsed.fn === "WATCH"
          ? `WATCH ${id} — local digest compare. ${censusNote(id)}`
          : censusNote(id),
      );
      return;
    }

    if (parsed.fn === "HELP") {
      setNote(`${TERMINAL_HINT}. ${GET_MEASURED_REPLY}`);
      return;
    }

    const verifyBody = parsed.fn === "VERIFY" ? parsed.arg || raw : looksLikeCardJson(raw) ? raw : "";
    if (verifyBody && (parsed.fn === "VERIFY" || looksLikeCardJson(raw))) {
      if (!looksLikeCardJson(verifyBody)) {
        setNote("VERIFY needs a signed card JSON. Nothing was sent.");
        setLoc("/gspc-verify");
        return;
      }
      setBusy(true);
      try {
        const body = JSON.parse(verifyBody);
        const card = Array.isArray(body) ? body[0] : body;
        const key = await fetchPinnedCardKey();
        setVerdict(await verifyCard(card, key));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setNote(`UNCHECKABLE — could not parse that paste (${msg}). Nothing was sent.`);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (wantsGetMeasured(raw)) {
      setNote(GET_MEASURED_REPLY);
      setLoc("/assess");
      return;
    }

    const axis = axisFromFn(parsed) ?? namedAxis(raw);
    if (axis && onAskAxis) {
      onAskAxis(axis);
      setNote(`AXIS ${axis} — board jumped. Empty cells stay empty.`);
      return;
    }

    setNote(
      "Paste a signed card to verify it here, say what you use AI for to get measured, or click a row on the board. We measure. We do not certify. A rank is never sold.",
    );
  }

  return (
    <form
      className="mt-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <label htmlFor="os-chat" className="sr-only">
        Paste a signed card, or say what you use AI for.
      </label>
      <div className="flex items-end gap-2">
        <textarea
          id="os-chat"
          value={text}
          rows={4}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder="Paste a signed card, or say what you use AI for."
          className="min-h-[7rem] w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 placeholder-slate-500 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/30"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="shrink-0 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {busy ? "…" : "Ask"}
        </button>
      </div>
      {verdict && (
        <p
          role="status"
          className={
            verdict.state === "VALID"
              ? "mt-3 text-sm font-semibold text-emerald-800"
              : verdict.state === "INVALID"
                ? "mt-3 text-sm font-semibold text-rose-800"
                : "mt-3 text-sm font-semibold text-amber-800"
          }
        >
          {verdict.state}. {verdict.reason} Nothing was sent. Three states only: VALID · INVALID ·
          UNCHECKABLE.
        </p>
      )}
      {note && <p className="mt-3 text-sm text-slate-600">{note}</p>}
      <p className="mt-2 font-mono text-[11px] text-slate-500" data-testid="terminal-hint">
        {TERMINAL_HINT}
      </p>
    </form>
  );
}
