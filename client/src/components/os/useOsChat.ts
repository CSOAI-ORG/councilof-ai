import { useCallback, useState } from "react";
import { matchRefusal } from "@/components/lobby/lobbyRefuse";
import { fetchPinnedCardKey, verifyCard, type CardVerdict } from "@/lib/cardVerify";
import type { DoorId } from "./doors";
import {
  FOUR_TOOLS_HELP,
  GET_MEASURED_REPLY,
  formatAxis,
  formatBoardTotals,
  formatCardList,
  looksLikeCardJson,
  namedAxis,
  wantsBoardTotals,
  wantsGetMeasured,
  wantsListCards,
} from "./osChat";
import { formatComputeReply } from "@/lib/computeBridge";
import { censusNote, correctionsNote, parseTerminal } from "@/lib/terminalFn";
import { loadWatchlist, saveWatchlist, upsertWatch } from "@/lib/watchlist";

export type OsTurn = {
  role: "user" | "council";
  text: string;
  tool?: string;
  verdict?: CardVerdict;
  card?: unknown;
  /** Live stream card: axis id for GET /api/gspc row. */
  streamAxis?: string;
  /** Optional card content sha256 for /root.json membership. */
  streamSha?: string;
};

const NAV: { re: RegExp; door: DoorId }[] = [
  { re: /\b(show|open|go to|switch to)\b.*\bverify\b/i, door: "verify" },
  { re: /\b(show|open|go to|switch to)\b.*\b(space|arena)\b/i, door: "space" },
  { re: /\b(show|open|go to|switch to)\b.*\b(assess|get measured)\b/i, door: "assess" },
  { re: /\b(show|open|go to|switch to)\b.*\bharness\b/i, door: "harness" },
  { re: /\b(show|open|go to|switch to)\b.*\bboard\b/i, door: "board" },
];

export function useOsChat(onDoor: (id: DoorId) => void) {
  const [turns, setTurns] = useState<OsTurn[]>([]);
  const [busy, setBusy] = useState(false);

  const push = (t: OsTurn) => setTurns((prev) => [...prev, t]);

  const send = useCallback(
    async (raw: string) => {
      const question = raw.trim();
      if (!question || busy) return;
      push({ role: "user", text: question });

      const refusal = matchRefusal(question);
      if (refusal) {
        push({ role: "council", text: refusal.text, tool: `refusal · ${refusal.id}` });
        return;
      }

      const parsed = parseTerminal(question);
      if (parsed.fn === "CORRECT") {
        setBusy(true);
        try {
          const r = await fetch("/api/corrections", { headers: { accept: "application/json" } });
          if (!r.ok) throw new Error("HTTP " + r.status);
          const j = await r.json();
          const n = Array.isArray(j?.corrections) ? j.corrections.length : j?.count;
          push({ role: "council", text: correctionsNote(n), tool: "correct" });
        } catch (e: any) {
          push({
            role: "council",
            text: `CORRECT failed (${String(e?.message ?? e)}). Cite GET /api/corrections.`,
            tool: "correct",
          });
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
          const j = await r.json();
          push({ role: "council", text: formatComputeReply(j), tool: "compute" });
          onDoor("harness");
        } catch (e: any) {
          push({
            role: "council",
            text: `COMPUTE failed (${String(e?.message ?? e)}). Cite GET /api/compute. Nothing graded.`,
            tool: "compute",
          });
        } finally {
          setBusy(false);
        }
        return;
      }
      if (parsed.fn === "CENSUS" || parsed.fn === "WATCH") {
        const id = parsed.arg.trim();
        if (id && typeof localStorage !== "undefined") {
          saveWatchlist(localStorage, upsertWatch(loadWatchlist(localStorage), [id]));
        }
        push({
          role: "council",
          text: id ? censusNote(id) : "CENSUS needs an owner/name id. DISCOVERED, never MEASURED.",
          tool: "census",
        });
        return;
      }
      if (parsed.fn === "BOARD" || wantsBoardTotals(question)) {
        setBusy(true);
        try {
          const r = await fetch("/api/gspc", { headers: { accept: "application/json" } });
          if (!r.ok) throw new Error("HTTP " + r.status);
          const j = await r.json();
          if (!j || !Array.isArray(j.axes)) throw new Error("not a GSPC payload");
          push({ role: "council", text: formatBoardTotals(j), tool: "board_totals", streamAxis: "" });
          onDoor("board");
        } catch (e: any) {
          push({
            role: "council",
            text: `board_totals failed (${String(e?.message ?? e)}). Cite GET /api/gspc when it returns.`,
            tool: "board_totals",
          });
        } finally {
          setBusy(false);
        }
        return;
      }

      if (looksLikeCardJson(question) || (parsed.fn === "VERIFY" && parsed.paste === "card")) {
        setBusy(true);
        try {
          const card = JSON.parse(parsed.fn === "VERIFY" && parsed.arg ? parsed.arg : question);
          const key = await fetchPinnedCardKey();
          const v = await verifyCard(card, key);
          const sha =
            typeof (card as any)?.content_sha256 === "string"
              ? String((card as any).content_sha256)
              : typeof (card as any)?.sha256 === "string"
                ? String((card as any).sha256)
                : undefined;
          push({
            role: "council",
            text:
              `verify_card (browser, nothing uploaded): **${v.state}**.\n${v.reason}\n` +
              `Three states only: VALID · INVALID · UNCHECKABLE. Glass only after VALID.`,
            tool: "verify_card",
            verdict: v,
            card: v.state === "VALID" ? card : undefined,
            streamSha: v.state === "VALID" ? sha : undefined,
          });
          if (v.state === "VALID") onDoor("verify");
        } catch (e: any) {
          push({
            role: "council",
            text: `UNCHECKABLE — could not parse or check that paste (${String(e?.message ?? e)}). Nothing was sent to a server.`,
            tool: "verify_card",
          });
        } finally {
          setBusy(false);
        }
        return;
      }

      if (wantsListCards(question)) {
        setBusy(true);
        try {
          const r = await fetch("/api/cards", { headers: { accept: "application/json" } });
          if (!r.ok) throw new Error("HTTP " + r.status);
          const j = await r.json();
          push({ role: "council", text: formatCardList(j), tool: "list_cards" });
        } catch (e: any) {
          push({
            role: "council",
            text: `list_cards failed (${String(e?.message ?? e)}). Cite GET /api/cards when it returns.`,
            tool: "list_cards",
          });
        } finally {
          setBusy(false);
        }
        return;
      }

      if (wantsGetMeasured(question)) {
        onDoor("assess");
        push({
          role: "council",
          text: GET_MEASURED_REPLY,
          tool: "nav",
        });
        return;
      }

      for (const n of NAV) {
        if (n.re.test(question)) {
          onDoor(n.door);
          push({
            role: "council",
            text: `Opened ${n.door}. That was a pane switch, not a measurement.`,
            tool: "nav",
          });
          return;
        }
      }

      const axis = namedAxis(question);
      if (axis) {
        setBusy(true);
        try {
          const r = await fetch("/api/gspc", { headers: { accept: "application/json" } });
          if (!r.ok) throw new Error("HTTP " + r.status);
          const j = await r.json();
          const row = Array.isArray(j?.axes) ? j.axes.find((a: any) => a?.axis === axis) : null;
          push({
            role: "council",
            text: formatAxis(row ?? null, axis),
            tool: "get_axis",
            streamAxis: axis,
          });
          onDoor("board");
        } catch (e: any) {
          push({
            role: "council",
            text: `get_axis failed (${String(e?.message ?? e)}). Cite GET /api/gspc.`,
            tool: "get_axis",
          });
        } finally {
          setBusy(false);
        }
        return;
      }

      push({ role: "council", text: FOUR_TOOLS_HELP, tool: "help" });
    },
    [busy, onDoor],
  );

  return { turns, busy, send };
}
