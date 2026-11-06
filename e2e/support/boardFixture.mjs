import fs from "node:fs";
import path from "node:path";
import { verifyBoardReference } from "../../scripts/surface/render-board-reference.mjs";

export function frozenBuildBoard(root) {
  const reference = path.join(root, "prerender-board-reference.json");
  const metadata = verifyBoardReference(
    reference,
    path.join(root, "dist/client"),
  );
  const doc = JSON.parse(fs.readFileSync(reference, "utf8"));
  return {
    body: Buffer.from(doc.board_base64, "base64"),
    metadata: {
      ...metadata,
      mode: "FROZEN_BUILD_REFERENCE_FIXTURE_NOT_A_LIVE_OBSERVATION",
    },
  };
}
