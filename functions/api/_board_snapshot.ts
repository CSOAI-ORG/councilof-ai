/**
 * _board_snapshot — which signed board freeze is the newest, and does it agree with live?
 *
 * ONE place for the comparison /api/state and /api/counters both publish. Before
 * 2026-09-25 each endpoint imported public/signed/gspc-board.signed.json directly, so
 * adding a newer freeze would have left both comparing live counts to the 2026-09-02 file
 * forever. Freezes are now listed in SIGNED_BOARD_SNAPSHOTS; the newest by `frozen_at`
 * (read from each file's status document, never from list order) is the one compared.
 *
 * Every freeze is kept. A superseded one is history — its bytes still verify — and is
 * published in `history` with its own claim state, never deleted and never re-signed.
 *
 * `agrees` is true only when the newest freeze's counts equal the live derivation from
 * the committed axis arrays AND its status document says CURRENT. Matching counts are
 * necessary but not sufficient: a status can withdraw reliance on a freeze whose counts
 * happen to match (the 2026-09-02 freeze was 22·22 on a 22·22 board and still carried a
 * signed overclaim).
 */
import boardAug from "../../public/signed/gspc-board.signed.json";
import board20260902Status from "../../public/signed/gspc-board.status.json";
import board20260925 from "../../public/signed/gspc-board.2026-09-25.signed.json";
import board20260925Status from "../../public/signed/gspc-board.2026-09-25.status.json";
import board20260929 from "../../public/signed/gspc-board.2026-09-29.signed.json";
import board20260929Status from "../../public/signed/gspc-board.2026-09-29.status.json";

export interface SnapshotEntry {
  /** Repo-relative path of the signed file. */
  source: string;
  /** Repo-relative path of its unsigned status document. */
  status_source: string;
  doc: any;
  status: any;
}

export interface LiveCounts {
  axis_slots: number;
  measured_axes: number;
  unmeasured_axes: number;
}

export const SIGNED_BOARD_SNAPSHOTS: SnapshotEntry[] = [
  {
    source: "public/signed/gspc-board.signed.json",
    status_source: "public/signed/gspc-board.status.json",
    doc: boardAug,
    status: board20260902Status,
  },
  {
    source: "public/signed/gspc-board.2026-09-25.signed.json",
    status_source: "public/signed/gspc-board.2026-09-25.status.json",
    doc: board20260925,
    status: board20260925Status,
  },
  {
    source: "public/signed/gspc-board.2026-09-29.signed.json",
    status_source: "public/signed/gspc-board.2026-09-29.status.json",
    doc: board20260929,
    status: board20260929Status,
  },
];

/** The freeze instant, read from the status document. Null sorts oldest. */
export const frozenAt = (e: SnapshotEntry): string | null =>
  typeof e.status?.frozen_at === "string" ? e.status.frozen_at : null;

/** Newest by frozen_at, never by array position. Ties keep the later entry. */
export function newestSnapshot(entries: SnapshotEntry[]): SnapshotEntry {
  if (!entries.length) throw new Error("no signed board snapshots registered");
  let best = entries[0];
  for (const e of entries.slice(1)) {
    const a = frozenAt(best) ?? "";
    const b = frozenAt(e) ?? "";
    if (b >= a) best = e;
  }
  return best;
}

/** Signer fields, whichever of the two attestation shapes the file carries. */
export function snapshotSignature(doc: any) {
  if (doc?.board_attestation) {
    const p = doc.board_attestation.payload ?? {};
    const s = doc.board_attestation.signature ?? {};
    return {
      shape: "board_attestation",
      signer: p.signer ?? null,
      alg: s.alg ?? null,
      public_key_hex: s.public_key_hex ?? null,
      content_id: p.snapshot_content_id ?? null,
      payload_sha256: s.payload_sha256 ?? null,
      custody: p.custody ?? null,
      frozen_at: p.frozen_at ?? null,
      source_commit: p.source_commit ?? null,
      signed_at: s.signed_at ?? null,
      verify: doc.board_attestation.verify ?? null,
    };
  }
  const c = doc?.custody_attestation ?? {};
  return {
    shape: "custody_attestation",
    signer: c.signer ?? null,
    alg: c.alg ?? null,
    public_key_hex: c.public_key_hex ?? null,
    content_id: c.content_id ?? null,
    payload_sha256: null,
    custody: c.custody ?? null,
    frozen_at: null,
    source_commit: null,
    signed_at: null,
    verify: c.verify ?? null,
  };
}

export function crosscheckBoardSnapshot(live: LiveCounts, entries: SnapshotEntry[] = SIGNED_BOARD_SNAPSHOTS) {
  const newest = newestSnapshot(entries);
  const totals = newest.doc?.totals ?? {};
  const claimState: string = newest.status?.state ?? "UNCHECKABLE";
  const countsAgree =
    totals.axes === live.axis_slots &&
    totals.measured_axes === live.measured_axes &&
    totals.unmeasured_axes === live.unmeasured_axes;
  const agrees = countsAgree && claimState === "CURRENT";
  return {
    source: newest.source,
    status_source: newest.status_source,
    selected_by: "newest frozen_at among SIGNED_BOARD_SNAPSHOTS (functions/api/_board_snapshot.ts), read from each status document",
    counts_agree: countsAgree,
    agrees,
    claim_state: claimState,
    frozen_at: frozenAt(newest),
    axis_slots: totals.axes ?? null,
    measured_axes: totals.measured_axes ?? null,
    unmeasured_axes: totals.unmeasured_axes ?? null,
    public_count: totals.public_count ?? null,
    as_of: newest.doc?.measured_on?.date ?? null,
    status: agrees
      ? "newest signed freeze agrees with the live axis arrays"
      : countsAgree
        ? "newest signed freeze's counts match but its status withdraws reliance — do not file"
        : "newest signed freeze disagrees with the live axis arrays — do not file; a new freeze is due",
    signature: snapshotSignature(newest.doc),
    history: entries
      .filter((e) => e !== newest)
      .map((e) => ({
        source: e.source,
        status_source: e.status_source,
        claim_state: e.status?.state ?? "UNCHECKABLE",
        superseded_by: e.status?.superseded_by ?? null,
        frozen_at: frozenAt(e),
        public_count: e.doc?.totals?.public_count ?? null,
        signer: snapshotSignature(e.doc).signer,
      })),
  };
}
