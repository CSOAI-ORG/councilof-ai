/**
 * client/src/data — GSPC overlay schema notes.
 * Live authority: GET https://councilof.ai/api/gspc (totals derived live, never typed here).
 * Not a board axis. Do not import this into axis arrays.
 */
export const GSPC_OVERLAY_NOTES = {
  notes:
    "overlay ARC-AGI UNMEASURED until a frozen gold bank exists; not a board axis. Public GET https://councilof.ai/api/gspc totals are unaffected by this overlay.",
  overlay: "ARC-AGI",
  status: "UNMEASURED" as const,
  not_a_23rd_axis: true,
  gold_bank: "none — UNMEASURED until a frozen gold bank exists",
  see: ["/gspc-overlays.json", "/schema/gspc-axes-notes.json"],
} as const;
