/**
 * GET /badge/axes.json — the shields.io endpoint badge for the board's axis count.
 *
 * WHY THIS IS A FUNCTION AND NOT A FILE. It was a hand-maintained static JSON at
 * public/badge/axes.json, written once and never regenerated, and on 2026-09-05 it was serving
 *
 *     {"label":"GSPC axes measured","message":"15 of 22"}
 *
 * while GET /api/gspc returned 22 slots · 22 measured · 0 UNMEASURED. A public badge is one of
 * the most-copied claims we publish — it ends up in READMEs we do not control — and it had drifted
 * seven axes behind the board. `_alignment/OUTSTANDING-MOVES-2026-08-31.md` names this exact risk
 * under GSPC-22157: "Public copy still saying 15/22 is stale."
 *
 * No generator wrote it, so nothing could keep it current: the same defect shape as an honesty
 * field hand-added to a generated document. The fix is to remove the possibility of drift rather
 * than to correct the number — the count is now DERIVED from the same axis arrays /api/gspc
 * counts, on every request, and cannot disagree with the board.
 *
 * It counts SLOTS and MEASURED slots, exactly as gspc.ts does. It is not a grade, not a score and
 * not a certificate: "measured" means a run exists behind the slot, nothing more.
 */
import { AXES_A } from "../api/_gspc_axes_a";
import { AXES_B } from "../api/_gspc_axes_b";
import { AXES_FIN } from "../api/_gspc_axes_fin";

export const onRequestGet: PagesFunction = async () => {
  const axes = [...AXES_A, ...AXES_B, ...AXES_FIN];
  const total = axes.length;
  const measured = axes.filter((a) => a.status === "MEASURED").length;

  return new Response(
    JSON.stringify(
      {
        schemaVersion: 1,
        label: "GSPC axes measured",
        message: `${measured} of ${total}`,
        // Green only when every declared slot carries a run. If a future slot ships with no run
        // behind it the badge goes amber on its own, rather than a person remembering to change
        // a colour — which is the failure this file exists to end.
        color: measured === total ? "brightgreen" : "orange",
        namedLogo: "checkmarx",
        cacheSeconds: 300,
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        // Short cache: a badge that outlives a board change is the defect being fixed.
        "cache-control": "public, max-age=300",
        "access-control-allow-origin": "*",
      },
    },
  );
};
