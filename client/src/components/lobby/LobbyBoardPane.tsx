import LivingBoard from "./LivingBoard";
import { SP, TYPE } from "./glass";

/**
 * LobbyBoardPane — native GSPC board inside Council OS (no iframe).
 *
 * The lobby frames live routes when it must; the board is hot enough to render
 * in-process from GET /api/gspc via LivingBoard.
 */
export default function LobbyBoardPane() {
  return (
    <div className={`${SP.panel} h-full overflow-y-auto`}>
      <p className={TYPE.section}>Live board</p>
      <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900">
        Every published axis
      </h2>
      <p className={`mt-2 max-w-2xl text-[14px] leading-relaxed text-slate-700`}>
        Native in Council OS — GET /api/gspc. Interval and TIE/SEPARATED as
        published. Empty cells stay empty. In-lane is not a board slot.
      </p>
      <div className="mt-6">
        <LivingBoard embedded onOpenBoard={() => { /* already on board */ }} />
      </div>
    </div>
  );
}
