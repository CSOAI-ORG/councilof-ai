import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnswerText } from "@/components/lobby/answerText";
import OsGlassCard from "@/components/os/OsGlassCard";
import {
  GET_MEASURED_REPLY,
  liveCountLine,
  looksLikeCardJson,
  namedAxis,
  wantsBoardTotals,
  wantsGetMeasured,
} from "@/components/os/osChat";

function homeAxisLine(row: GspcAxis | null, asked: string): string {
  if (!row) return `No axis named “${asked}”. We do not invent a 23rd axis. Empty stays empty.`;
  const st = String(row.status || "UNMEASURED");
  if (st !== "MEASURED") {
    return `**${row.axis}** is UNMEASURED — empty, not a zero. Not a certificate.`;
  }
  const n = typeof row.n === "number" ? ` n=${row.n}.` : "";
  return `**${row.axis}** is MEASURED.${n} Empty cells stay empty. Not a ranking for sale.`;
}
import { fetchPinnedCardKey, verifyCard, type CardVerdict } from "@/lib/cardVerify";
import { orderedRows, useGspcBoard, type GspcAxis } from "@/components/board/useGspcBoard";
import { setMetaDescription } from "@/lib/utils";

type Turn = { role: "user" | "council"; text: string; verdict?: CardVerdict };

/**
 * OpenRouter layout without becoming OpenRouter:
 * composer (verify / measure / totals) + GSPC list. No tokens. No 200 models.
 */
export default function HomeVerify() {
  const [, setLoc] = useLocation();
  const { data, error, loading } = useGspcBoard();
  const rows = orderedRows(data);
  const strip = error
    ? "Board is unreachable right now. Empty stays empty."
    : loading
      ? "Reading the board…"
      : liveCountLine(data?.totals ?? {});
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [focusAxis, setFocusAxis] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.title = "Check an AI claim | councilof.ai";
    setMetaDescription(
      "Chat + GSPC list. Verify a card, get measured, or read the board. Empty stays empty. Not a certificate. Not a ranking for sale.",
    );
  }, []);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    setQ("");
    setTurns((t) => [...t, { role: "user", text }]);

    if (looksLikeCardJson(text)) {
      setBusy(true);
      try {
        const card = JSON.parse(text);
        const key = await fetchPinnedCardKey();
        const v = await verifyCard(card, key);
        setTurns((t) => [
          ...t,
          {
            role: "council",
            text: `**${v.state}**. ${v.reason} Nothing was sent. Three states only: VALID · INVALID · UNCHECKABLE.`,
            verdict: v,
          },
        ]);
      } catch (e: any) {
        setTurns((t) => [
          ...t,
          {
            role: "council",
            text: `UNCHECKABLE — could not parse that paste (${String(e?.message ?? e)}). Nothing was sent.`,
          },
        ]);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (wantsGetMeasured(text)) {
      setTurns((t) => [...t, { role: "council", text: GET_MEASURED_REPLY + " Opening Get measured." }]);
      setLoc("/assess");
      return;
    }

    if (wantsBoardTotals(text)) {
      setTurns((t) => [
        ...t,
        {
          role: "council",
          text: `The list on the right is the live board. **${strip}** Empty rows stay empty. Not a ranking for sale.`,
        },
      ]);
      return;
    }

    const axis = namedAxis(text);
    if (axis) {
      const row = rows.find((r) => r.axis === axis) ?? null;
      setFocusAxis(axis);
      setTurns((t) => [...t, { role: "council", text: homeAxisLine(row, axis) }]);
      return;
    }

    setTurns((t) => [
      ...t,
      {
        role: "council",
        text:
          "Paste a signed card to verify it here, say what you use AI for to get measured, or click a row on the board. We measure. We do not certify. We do not sell a rank.",
      },
    ]);
  }

  function clickRow(row: GspcAxis) {
    setFocusAxis(row.axis);
    setTurns((t) => [
      ...t,
      { role: "user", text: row.axis },
      { role: "council", text: homeAxisLine(row, row.axis) },
    ]);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14" data-testid="home-verify">
      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="os-h1">
          <h1 id="os-h1" className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Check an AI claim. Or measure your system.
          </h1>
          <p className="mt-3 text-slate-600">
            Empty cells stay empty. Not a certificate. Free, no account.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/gspc-verify"
              data-testid="home-btn-verify"
              className="inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Verify a card
            </Link>
            <Link
              href="/assess"
              data-testid="home-btn-assess"
              className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Get measured
            </Link>
          </div>

          <label htmlFor="os-chat" className="sr-only">
            Paste a signed card, or say what you use AI for.
          </label>
          <div className="mt-6 flex items-end gap-2">
            <textarea
              id="os-chat"
              ref={inputRef}
              value={q}
              rows={4}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(q);
                }
              }}
              placeholder="Paste a signed card, or say what you use AI for."
              className="min-h-[7rem] w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 placeholder-slate-500 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/30"
            />
            <button
              type="button"
              disabled={busy || !q.trim()}
              onClick={() => void send(q)}
              className="shrink-0 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {busy ? "…" : "Ask"}
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Already in Claude / Cursor / Kimi / Grok?</p>
            <p className="mt-1">
              Add <code className="rounded bg-white px-1 font-mono text-[13px]">gspc</code> — same
              board, same verify.{" "}
              <Link href="/tools" className="font-medium text-emerald-800 hover:underline">
                Plugin snippet
              </Link>
              {" · "}
              <code className="font-mono text-[12px]">https://councilof.ai/mcp</code>
            </p>
          </div>

          <p className="mt-3 text-[12px] text-slate-500">
            Paid arms (enquiry, never a bought rank):{" "}
            <a href="/products" className="text-emerald-800 hover:underline">
              Run / re-attest
            </a>
            {" · "}
            <a href="/products" className="text-emerald-800 hover:underline">
              Ledger
            </a>
            {" · "}
            <a href="/products" className="text-emerald-800 hover:underline">
              Data
            </a>
          </p>

          {turns.length > 0 && (
            <div
              role="log"
              aria-live="polite"
              className="mt-6 max-h-72 space-y-3 overflow-y-auto"
            >
              {turns.map((t, i) => (
                <div
                  key={i}
                  className={
                    t.role === "user"
                      ? "ml-auto max-w-[92%] rounded-2xl bg-emerald-700 px-4 py-3 text-[15px] text-white"
                      : "max-w-[96%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900"
                  }
                >
                  {t.role === "user" ? t.text : <AnswerText text={t.text} />}
                  {t.role === "council" && t.verdict && <OsGlassCard verdict={t.verdict} />}
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="home-board-h">
          <h2 id="home-board-h" className="text-xl font-bold text-slate-900">
            GSPC board
          </h2>
          <p className="mt-1 text-sm font-semibold text-emerald-800" data-testid="os-live-strip">
            {strip}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Empty rows stay empty. Not a ranking for sale.
          </p>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Axis</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">n</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const st = String(row.status || "UNMEASURED");
                  const active = focusAxis === row.axis;
                  return (
                    <tr
                      key={row.axis}
                      data-axis={row.axis}
                      onClick={() => clickRow(row)}
                      className={`cursor-pointer border-t border-slate-100 ${
                        active ? "bg-emerald-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-3 py-2 font-medium text-slate-900">{row.axis}</td>
                      <td className="px-3 py-2">
                        {st === "MEASURED" ? (
                          <span className="text-emerald-800">MEASURED</span>
                        ) : (
                          <span className="text-slate-500">UNMEASURED</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-600">
                        {st === "MEASURED" && typeof row.n === "number" ? row.n : "—"}
                      </td>
                    </tr>
                  );
                })}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-slate-500">
                      Empty stays empty. The board did not return rows.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm">
            <a href="/gspc-scoreboard" className="font-medium text-emerald-800 hover:underline">
              Full board
            </a>
            {" · "}
            <a href="/methodology" className="text-slate-600 hover:underline">
              Methodology
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
