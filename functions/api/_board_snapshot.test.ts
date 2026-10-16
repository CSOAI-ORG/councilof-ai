import { describe, expect, it } from "vitest";
import { createHash, createPublicKey, verify as nodeVerify } from "node:crypto";
import { readFileSync } from "node:fs";

import { AXES_A } from "./_gspc_axes_a";
import { AXES_B } from "./_gspc_axes_b";
import { AXES_C } from "./_gspc_axes_c";
import { AXES_FIN } from "./_gspc_axes_fin";
import { AXES_D } from "./_gspc_axes_d";
import {
  SIGNED_BOARD_SNAPSHOTS,
  crosscheckBoardSnapshot,
  newestSnapshot,
  type SnapshotEntry,
} from "./_board_snapshot";
import { onRequestGet as stateGet } from "./state";
import { onRequestGet as countersGet } from "./counters";
import { onRequestGet as gspcGet } from "./gspc";

const LIVE_AXES = [...AXES_A, ...AXES_B, ...AXES_C, ...AXES_FIN, ...AXES_D];
// Measure ruling on #3266 (16 Oct 2026): the EXACT declared-UNMEASURED ids, typed on purpose so any
// other difference from the 2026-09-29 signed freeze fails.
const DECLARED_IDS = [
  "lab-practice",
  "company-practice",
  "measurer-integrity",
  "harness-fidelity",
  "interop-conformance",
  "humanoid-deployment",
  "regulator-transparency",
  "interpretability-reproducibility",
  "claim-maintenance",
  "serving-fidelity",
] as const;
const live = {
  axis_slots: LIVE_AXES.length,
  measured_axes: LIVE_AXES.filter((a) => a.status === "MEASURED").length,
  unmeasured_axes: LIVE_AXES.filter((a) => a.status !== "MEASURED").length,
};

const canonical = (o: unknown): string => {
  if (o === null || typeof o !== "object") return JSON.stringify(o);
  if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
  return (
    "{" +
    Object.keys(o as object)
      .sort()
      .map((k) => JSON.stringify(k) + ":" + canonical((o as Record<string, unknown>)[k]))
      .join(",") +
    "}"
  );
};

const entry = (source: string, frozen_at: string | null, totals: object, state = "CURRENT"): SnapshotEntry => ({
  source,
  status_source: source.replace(".signed.json", ".status.json"),
  doc: { totals, measured_on: { date: "x" } },
  status: { state, frozen_at },
});

describe("signed board freeze vs live axis arrays", () => {
  it("a deliberately STALE newest snapshot reports disagreement", () => {
    // 22 · 22 on a board whose live arrays say otherwise — the shape of the 2026-09-02 freeze.
    const stale = entry("public/signed/gspc-board.2099-01-01.signed.json", "2099-01-01T00:00:00Z", {
      axes: live.axis_slots - 1,
      measured_axes: live.measured_axes - 1,
      unmeasured_axes: 0,
      public_count: "stale",
    });
    const r = crosscheckBoardSnapshot(live, [...SIGNED_BOARD_SNAPSHOTS, stale]);
    expect(r.source).toBe(stale.source); // it IS the newest, so it is the one compared
    expect(r.counts_agree).toBe(false);
    expect(r.agrees).toBe(false);
    expect(r.status).toMatch(/disagrees/);
  });

  it("matching counts are not enough: a status that withdraws reliance fails closed", () => {
    const withdrawn = entry(
      "public/signed/gspc-board.2099-01-02.signed.json",
      "2099-01-02T00:00:00Z",
      { ...live, axes: live.axis_slots, public_count: "x" },
      "SUPERSEDED_KNOWN_CLAIM_DEFECT",
    );
    const r = crosscheckBoardSnapshot(live, [withdrawn]);
    expect(r.counts_agree).toBe(true);
    expect(r.agrees).toBe(false);
  });

  it("newest is chosen by frozen_at, never by list position", () => {
    const older = entry("a.signed.json", "2026-09-02", { axes: 1 });
    const newer = entry("b.signed.json", "2026-09-25T11:08:00Z", { axes: 2 });
    expect(newestSnapshot([newer, older]).source).toBe("b.signed.json");
    expect(newestSnapshot([older, newer]).source).toBe("b.signed.json");
  });

  it("the committed newest freeze agrees with the committed axis arrays", () => {
    const r = crosscheckBoardSnapshot(live);
    expect(r.source).toBe("public/signed/gspc-board.2026-09-29.signed.json");
    // The 2026-09-29 freeze predates the declared subject slots (2026-10-16). Until a new freeze is
    // signed (a separate step) the comparison must DISAGREE by exactly the 10 declared axis ids and
    // nothing else: measured stays exactly 23, and every n, score, card or root field is unchanged.
    expect(LIVE_AXES.filter((a) => a.status === "UNMEASURED").map((a) => a.axis).sort()).toEqual([...DECLARED_IDS].sort());
    expect(live.measured_axes).toBe(23);
    expect(r.measured_axes).toBe(23);
    expect(r.axis_slots).toBe(23);
    expect(live.axis_slots).toBe(23 + DECLARED_IDS.length);
    expect(r.counts_agree).toBe(false);
    expect(r.agrees).toBe(false);
    // The 2026-09-02 freeze is kept as history, superseded — never deleted.
    const mpc = r.history.find((h) => h.source === "public/signed/gspc-board.signed.json");
    expect(mpc?.claim_state).toBe("SUPERSEDED_BY");
    expect(mpc?.superseded_by).toBe("/signed/gspc-board.2026-09-25.signed.json");
  });

  it("the committed freeze's signature verifies and pins the body; a tampered body does not", () => {
    const bytes = readFileSync("public/signed/gspc-board.2026-09-29.signed.json");
    const doc = JSON.parse(bytes.toString("utf8"));
    const { board_attestation: ba, ...body } = doc;
    const bodyId = createHash("sha256").update(canonical(body)).digest("hex");
    expect(bodyId).toBe(ba.payload.snapshot_content_id);
    const payloadBytes = Buffer.from(canonical(ba.payload), "utf8");
    expect(createHash("sha256").update(payloadBytes).digest("hex")).toBe(ba.signature.payload_sha256);
    const key = createPublicKey({
      key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(ba.signature.public_key_hex, "hex")]),
      format: "der",
      type: "spki",
    });
    const sig = Buffer.from(ba.signature.sig_ed25519, "hex");
    expect(nodeVerify(null, payloadBytes, key, sig)).toBe(true);
    // Controls: a body edit changes the pinned id; a payload edit breaks the signature.
    const tampered = structuredClone(body);
    tampered.totals.measured_axes -= 1;
    expect(createHash("sha256").update(canonical(tampered)).digest("hex")).not.toBe(ba.payload.snapshot_content_id);
    const badPayload = { ...ba.payload, totals: { ...ba.payload.totals, measured_axes: 0 } };
    expect(nodeVerify(null, Buffer.from(canonical(badPayload), "utf8"), key, sig)).toBe(false);
    // The key is the DID's #board-attestation-1 (publicKeyJwk.x as published 2026-09-25).
    expect(ba.signature.public_key_hex).toBe("9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170");
    expect(ba.payload.custody).toMatch(/Not MPC/);
    // The signed payload's totals are the body's totals, not a second typed copy.
    for (const k of ["axes", "measured_axes", "unmeasured_axes", "public_count"]) {
      expect(ba.payload.totals[k]).toBe(body.totals[k]);
    }
  });

  it("/api/state and /api/counters publish the same comparison against the newest freeze", async () => {
    const s = await (await (stateGet as unknown as () => Promise<Response>)()).json();
    const c = await (await (countersGet as unknown as () => Promise<Response>)()).json();
    const x = s.board.live_derivation_crosscheck;
    expect(x.signed_snapshot.source).toBe("public/signed/gspc-board.2026-09-29.signed.json");
    expect(x.signed_snapshot_agrees).toBe(LIVE_AXES.every((a) => a.kind !== "declared-slot"));
    expect(x.signed_snapshot.claim_state).toBe("CURRENT");
    expect(x.history.map((h: { source: string }) => h.source)).toContain("public/signed/gspc-board.signed.json");
    expect(s.board.signature.signer).toBe("did:web:csoai.org#board-attestation-1");
    expect(s.board.signature.custody).not.toMatch(/3-party MPC/);
    expect(c.board_crosscheck.signed_source).toBe(x.signed_snapshot.source);
    expect(c.board_crosscheck.signed_snapshot_agrees).toBe(x.signed_snapshot_agrees);
  });
});

describe("served /api/gspc vs the 2026-09-29 signed freeze (Measure ruling on #3266)", () => {
  it("differs only by the 10 declared UNMEASURED axes: measured exactly 23, no n, score, card or root change", async () => {
    (globalThis as unknown as { caches: unknown }).caches = {
      default: { match: async () => undefined, put: async () => undefined },
    };
    const res = await (gspcGet as unknown as (c: unknown) => Promise<Response>)({
      request: new Request("https://councilof.ai/api/gspc"),
      env: {},
      waitUntil: () => undefined,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const freeze: any = JSON.parse(readFileSync("public/signed/gspc-board.2026-09-29.signed.json", "utf8"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const frozen = new Map<string, any>(freeze.axes.map((a: any) => [a.axis, a]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const served = body.axes as any[];
    const extra = served.filter((a) => !frozen.has(a.axis));
    expect(extra.map((a) => a.axis)).toEqual([...DECLARED_IDS]);
    for (const a of extra) {
      expect(a.status).toBe("UNMEASURED");
      expect(a.n ?? 0).toBe(0);
    }
    for (const id of frozen.keys()) expect(served.map((a) => a.axis)).toContain(id);
    expect(body.totals.measured_axes).toBe(23);
    expect(freeze.totals.measured_axes).toBe(23);
    expect(served.filter((a) => a.status === "MEASURED").map((a) => a.axis).sort()).toEqual([...frozen.keys()].sort());
    // Every n, numeric score, status, separation result, card or root field on the 23 frozen rows is unchanged.
    // method_status is additive only: absent from the freeze, present on every served row.
    const watched = (k: string, a: unknown, b: unknown) =>
      typeof a === "number" || typeof b === "number" || /card|root|^n$|^status$|^separation$/i.test(k);
    const drift: string[] = [];
    for (const a of served) {
      const f = frozen.get(a.axis);
      if (!f) continue;
      expect(f.method_status).toBeUndefined();
      expect(typeof a.method_status).toBe("string");
      for (const k of new Set([...Object.keys(f), ...Object.keys(a)])) {
        if (k === "method_status") continue;
        if (watched(k, f[k], a[k]) && canonical(f[k]) !== canonical(a[k])) drift.push(`${a.axis}.${k}`);
      }
    }
    for (const k of new Set([...Object.keys(freeze), ...Object.keys(body)]))
      if (/card|root/i.test(k) && canonical(freeze[k]) !== canonical(body[k])) drift.push(`board.${k}`);
    expect(drift).toEqual([]);
  });
});
