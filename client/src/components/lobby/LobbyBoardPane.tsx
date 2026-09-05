import CanonicalGspcBoard from "@/components/board/CanonicalGspcBoard";
import { SP, TYPE } from "./glass";

/**
 * LobbyBoardPane — the Council OS dashboard centrepiece: the interactive GSPC
 * table, rendered in-process from the live board (no iframe, no second copy).
 *
 * One board, every surface a window onto it. Click an axis to inspect the
 * evidence it actually carries: model comparisons may have signed cards and
 * rankings; deterministic-facts rows carry their own run artifacts. Empty
 * cells stay empty. Nothing here writes the board.
 */
export default function LobbyBoardPane() {
  return (
    <div className={`${SP.panel} h-full overflow-y-auto`}>
      <p className={TYPE.section}>The board is the dashboard</p>
      <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900">
        Interactive GSPC board
      </h2>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-slate-700">
        Every published axis, live from GET /api/gspc. Open a row to inspect the
        evidence it actually carries: model-comparison axes may have signed
        cards and rankings; deterministic-facts axes link their own run
        artifacts. A TIE never crowns a winner.
      </p>
      <div className="mt-6">
        <CanonicalGspcBoard />
      </div>
    </div>
  );
}
