import { useCallback, useState } from "react";
import { matchRefusal } from "@/components/lobby/lobbyRefuse";
import { fetchPinnedCardKey, verifyCard, type CardVerdict } from "@/lib/cardVerify";
import type { DoorId } from "./doors";
import {
  FOUR_TOOLS_HELP,
  formatAxis,
  formatBoardTotals,
  formatCardList,
  looksLikeCardJson,
  namedAxis,
  wantsBoardTotals,
  wantsListCards,
} from "./osChat";

export type OsTurn = {
  role: "user" | "council";
  text: string;
  tool?: string;
  verdict?: CardVerdict;
  card?: unknown;
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

      if (looksLikeCardJson(question)) {
        setBusy(true);
        try {
          const card = JSON.parse(question);
          const key = await fetchPinnedCardKey();
          const v = await verifyCard(card, key);
          push({
            role: "council",
            text:
              `verify_card (browser, nothing uploaded): **${v.state}**.\n${v.reason}\n` +
              `Three states only: VALID · INVALID · UNCHECKABLE. Glass only after VALID.`,
            tool: "verify_card",
            verdict: v,
            card: v.state === "VALID" ? card : undefined,
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

      if (wantsBoardTotals(question)) {
        setBusy(true);
        try {
          const r = await fetch("/api/gspc", { headers: { accept: "application/json" } });
          if (!r.ok) throw new Error("HTTP " + r.status);
          const j = await r.json();
          if (!j || !Array.isArray(j.axes)) throw new Error("not a GSPC payload");
          push({ role: "council", text: formatBoardTotals(j), tool: "board_totals" });
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
          push({ role: "council", text: formatAxis(row ?? null, axis), tool: "get_axis" });
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
