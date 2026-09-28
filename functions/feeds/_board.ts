/**
 * Board-change feed entries: /feeds/board.json (JSON Feed 1.1) and /feeds/board.atom (Atom).
 * One source, two syntaxes.
 *
 * WHAT COUNTS AS A BOARD CHANGE. Each signed freeze of the GSPC board is one entry. The
 * freezes are listed in SIGNED_BOARD_SNAPSHOTS (functions/api/_board_snapshot.ts), the same
 * list /api/state and /api/counters compare against. An entry carries:
 *   - the freeze's own totals.public_count
 *   - its frozen_at, read from its status document and never from new Date()
 *   - its claim state (CURRENT, SUPERSEDED_BY, ...), read from the same status document
 *   - where to verify it
 * A superseded freeze stays in the feed. It is history, and its bytes still verify.
 *
 * THE LIVE BOARD MAY BE AHEAD OF THE NEWEST FREEZE. The feed says so; it does not hide it.
 * The live counts are read in-process from /api/gspc and compared with crosscheckBoardSnapshot,
 * the comparison /api/state publishes. When they disagree:
 *   - the JSON Feed says so in its _gspc extension and in its description;
 *   - the Atom feed says so in its subtitle.
 * Neither invents a dated entry for the drift, because there is no artifact date to put on it.
 *
 * Measurement, not certification. No grade, rank or score appears in either feed.
 */
import { SIGNED_BOARD_SNAPSHOTS, crosscheckBoardSnapshot, frozenAt, type SnapshotEntry } from "../api/_board_snapshot";
import type { Entry } from "./_xml";
import type { BoardRead } from "../_lib/gspcBoardFacts";
import { BOARD_API, BOARD_PAGE, SITE } from "../_lib/gspcBoardFacts";

export const FEED_TITLE = "GSPC board changes";
export const FEED_DESC =
  "Each signed freeze of the GSPC board: its public count, when it was frozen, and whether it is still current. " +
  "The live board is GET https://councilof.ai/api/gspc. Measurement, not certification.";

/** Public URL of a repo-relative public/ path. */
const publicUrl = (repoPath: string) => `${SITE}/${repoPath.replace(/^public\//, "")}`;

export interface BoardEntry extends Entry {
  state: string;
  public_count: string | null;
  signed_file: string;
  status_file: string;
  superseded_by: string | null;
}

export function boardEntries(snaps: SnapshotEntry[] = SIGNED_BOARD_SNAPSHOTS): BoardEntry[] {
  return snaps
    .filter((s) => typeof frozenAt(s) === "string")
    .map((s) => {
      const doc = s.doc ?? {};
      const st = s.status ?? {};
      const pc: string | null = typeof doc?.totals?.public_count === "string" ? doc.totals.public_count : null;
      const state: string = typeof st.state === "string" ? st.state : "UNCHECKABLE";
      const cid: string | null = st?.integrity?.snapshot_content_id ?? doc?.board_attestation?.payload?.snapshot_content_id ?? null;
      const signedFile = publicUrl(s.source);
      const statusFile = publicUrl(s.status_source);
      const supersededBy: string | null = typeof st.superseded_by === "string" ? `${SITE}${st.superseded_by}` : null;
      const iso = frozenAt(s) as string;
      const verify: string | null = st?.integrity?.verification_command ?? null;
      const body = [
        `Public count at freeze: ${pc ?? "absent from the file"}.`,
        `Frozen at: ${iso}.`,
        `Claim state: ${state}${supersededBy ? ` (superseded by ${supersededBy})` : ""}.`,
        typeof st.relying_party_action === "string" ? `Relying-party action: ${st.relying_party_action}` : null,
        `Signed file: ${signedFile}. Status document: ${statusFile}.`,
        verify ? `Verify: ${verify}` : null,
        `The live board is ${BOARD_API}; a freeze is a dated copy of it, not a re-measurement.`,
      ]
        .filter(Boolean)
        .join(" ");
      return {
        id: `${signedFile}#${cid ?? iso}`,
        title: `GSPC board freeze ${iso}: ${pc ?? "public count absent"} (${state})`,
        link: signedFile,
        iso,
        body,
        state,
        public_count: pc,
        signed_file: signedFile,
        status_file: statusFile,
        superseded_by: supersededBy,
      };
    })
    .sort((a, b) => (a.iso < b.iso ? 1 : a.iso > b.iso ? -1 : 0));
}

export interface LiveNote {
  live: "derived" | "unread";
  live_public_count: string | null;
  newest_signed_freeze: string | null;
  newest_signed_freeze_agrees: boolean | null;
  note: string;
}

/** Compare the live board with the newest freeze. Unread live board → agrees is null, not false. */
export function liveNote(read: BoardRead, snaps: SnapshotEntry[] = SIGNED_BOARD_SNAPSHOTS): LiveNote {
  if ("unread" in read) {
    return {
      live: "unread",
      live_public_count: null,
      newest_signed_freeze: null,
      newest_signed_freeze_agrees: null,
      note: `The live board could not be read for this response (${read.unread}); the freezes below are unaffected.`,
    };
  }
  const f = read.facts;
  if (f.axes === null || f.measured_axes === null || f.unmeasured_axes === null) {
    return {
      live: "derived",
      live_public_count: f.public_count,
      newest_signed_freeze: null,
      newest_signed_freeze_agrees: null,
      note: "The live board carries no numeric totals to compare with the newest freeze.",
    };
  }
  const x = crosscheckBoardSnapshot(
    { axis_slots: f.axes, measured_axes: f.measured_axes, unmeasured_axes: f.unmeasured_axes },
    snaps,
  );
  return {
    live: "derived",
    live_public_count: f.public_count,
    newest_signed_freeze: publicUrl(x.source),
    newest_signed_freeze_agrees: x.agrees,
    note: x.agrees
      ? `The live board (${f.public_count}) agrees with the newest signed freeze.`
      : `The live board (${f.public_count}) differs from the newest signed freeze: ${x.status}. Quote ${BOARD_API}.`,
  };
}

export const JSON_FEED_URL = `${SITE}/feeds/board.json`;
export const ATOM_FEED_URL = `${SITE}/feeds/board.atom`;
export const HOME = BOARD_PAGE;
