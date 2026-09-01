import GspcTerminal from "@/components/board/GspcTerminal";
import { SP, TYPE } from "./glass";

/**
 * LobbyBoardPane — the Council OS dashboard centrepiece: the interactive GSPC
 * terminal, rendered in-process from the live board (no iframe, no second copy).
 *
 * One board, every surface a window onto it. Click an axis to drill into the
 * signed per-model ranking; search axes or models; verify every card. Empty
 * cells stay empty. Nothing here writes the board.
 */
export default function LobbyBoardPane() {
  return (
    <div className={`${SP.panel} h-full overflow-y-auto`}>
      <p className={TYPE.section}>The board is the dashboard</p>
      <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900">
        Interactive GSPC terminal
      </h2>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-slate-700">
        Every published axis, live from GET /api/gspc. Click a row to open the signed per-model
        ranking; a TIE never crowns a winner. Play, verify and ask sit around this one board.
      </p>
      <div className="mt-6">
        <GspcTerminal />
      </div>
    </div>
  );
}
