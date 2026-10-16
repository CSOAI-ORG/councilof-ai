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
    // Measure ruling on #3266 (16 Oct 2026), two narrow exemptions and nothing else:
    //  (1) method_status is allowed ONLY as an added field: absent from the freeze and from master,
    //      present on every served row.
    //  (2) separation_method / separation_evidence may differ from the freeze ONLY on the 7 ids below,
    //      and only where the served text equals current master (sha256 pinned from master 53dc00a4).
    // Every other field of every frozen row is compared: the watched fields (every n, score, status,
    // measured flag, separation result, card or root field) against the freeze, and the WHOLE row
    // (minus method_status) against master, so this PR changes no existing row byte.
    const SEPARATION_TEXT_FROM_MASTER: Record<string, { separation_method: string; separation_evidence: string }> = {
      "governance": {
            "separation_method": "f090d2014b063987224f635b60f8914222822f1ee2fc446df9469506ce6e67e4",
            "separation_evidence": "6bc0bf7bb3977da1981ad0b2f6d4df30dd32e0a8b99d242dcc057c717ef6f2fb"
      },
      "safety": {
            "separation_method": "f090d2014b063987224f635b60f8914222822f1ee2fc446df9469506ce6e67e4",
            "separation_evidence": "132a589437ffaef64d5a6c9d7e2142ac18ef89de8710c7f061e9e727e63586e1"
      },
      "provenance": {
            "separation_method": "f090d2014b063987224f635b60f8914222822f1ee2fc446df9469506ce6e67e4",
            "separation_evidence": "c6fb40edcf3962ba63c645303254535095c6fe655f6ae3d9aab3bd57c2fc488a"
      },
      "continuity": {
            "separation_method": "f090d2014b063987224f635b60f8914222822f1ee2fc446df9469506ce6e67e4",
            "separation_evidence": "bba6cd474a4b7ff2485f6978982a58778ac45b8e4fa760549cc88398db2b7b20"
      },
      "conformance": {
            "separation_method": "f090d2014b063987224f635b60f8914222822f1ee2fc446df9469506ce6e67e4",
            "separation_evidence": "007af074a0a197e9b668e0adb2965f07c57f919e6e4a76db21efb5197391ef41"
      },
      "openness": {
            "separation_method": "f090d2014b063987224f635b60f8914222822f1ee2fc446df9469506ce6e67e4",
            "separation_evidence": "b8dc6c232238e36f99a677da2c16caec6917b75f9b4e82d3fc24f19b989c9d2a"
      },
      "care": {
            "separation_method": "f090d2014b063987224f635b60f8914222822f1ee2fc446df9469506ce6e67e4",
            "separation_evidence": "e06b2709a967cea55b99e5acb08a74dd8b5bce69fc0be5f53b366a397c8ba3a7"
      }
    };
    expect(Object.keys(SEPARATION_TEXT_FROM_MASTER).sort()).toEqual(
      ["governance", "safety", "provenance", "continuity", "conformance", "openness", "care"].sort(),
    );
    const ROW_SHA256_ON_MASTER: Record<string, string> = {
      "governance": "41ec12b9125980b39a1d959fa53bac62454ffe06eb0c311763146c76709c0bb8",
      "safety": "36160f3b1e35abcc7278eb6eb82ee5b9ff7a8036739ebd63c229a46d487ecc1f",
      "provenance": "a302bb52a3ba64b4b3584ff1ec255ff3d095687da15037af93f8efba5a79527d",
      "continuity": "f372687af9e0f7683436985008b593cc50077e4343bc3686fbeb404cd8ddd05f",
      "conformance": "82570ac11f8e7e166d481b9cae96847ddf394776d3701d694501ce48e70bf790",
      "openness": "5fd0dfe217601e4dde05da2cc210db70b956bd5ae8963968a454f5113447f4de",
      "machinery-conformity": "f5dbf9a6ad37950ce3f80c453dcd7bde6ddefbcf98d223d7f6df6c8c2b6e2094",
      "care": "b767dbe5a74626bdc9587bfb3dde9f89ed007660c55cadd4914d919deae6b120",
      "cross-reality": "f7950dbc329e92858c60038808e46f12ec48d07033c1d57ea82c5afa24c8e86b",
      "detector-interop": "963f1d43b057a111e3959b659117c46bfbe984d2a2800fa90790277ed2b02c0e",
      "art5-safeguard": "1f34e8fbf1c759088a9418e196a4e65a221663a38a8171e26ed200117ef5868d",
      "swarm": "00badc300d6efe8605c3455de2b511e5c94594c586dbb4247674f85942a26494",
      "affect": "5e723580dadb9aaf0d866eef68f8ce9b6c3284bee6d9150544394af31c747f72",
      "jail": "36bdf3540f4af06817f2b3613163ad37b7e8c2073a91fdbc95bdd03de3fb7ff7",
      "effect-binding": "973103717f8abb6fd13d9c5342de9bde0b9b3a8bbd5a18d33a72a8e73bb84c40",
      "provenance-controls": "e577960a9e68f3c6ef9a5f932262d986d2c45b5d9b66b5c7481bd12ed9bb6152",
      "reserve-attestation": "a456b010eee40a09ac9297b9b7cd304916288217e46a3eaee96d06af3367b8d1",
      "regulatory-framework": "2f3037b8b2bcc206bea41c428ee23fb52bb8fea8f56fb3004618d97e1bce0d13",
      "distribution-integrity": "28fcee3d5d7b0ec00931cbb7b6f4c7a12f4ee6d83d9fa48b79de1401be65ae29",
      "custody-disclosure": "c4be17d486943107eab4b05a569d61ee40e517b984fbcacb85a0901d360adeb7",
      "ai-adoption-components": "a779144d37e5a158d260e6ac94e369d955d3688b00ef9efba7bbab67d2b43bd3",
      "labour-components": "45d933eecf7f343587d15cd1e92461ef8fbee1d5ef9b7a6b89aae77f7cd57569",
      "humanoid-labour-index": "e3f2562de608a6994dacfec761341ef9c76ab7b13e6bf612a96ea201ec8b7148"
    };
    const sha = (x: unknown) => createHash("sha256").update(canonical(x ?? null)).digest("hex");
    const watched = (k: string, a: unknown, b: unknown) =>
      typeof a === "number" || typeof b === "number" || /card|root|^n$|^status$|^measured$|^separation$/i.test(k);
    const drift: string[] = [];
    for (const a of served) {
      const f = frozen.get(a.axis);
      if (!f) continue;
      expect(f.method_status, `${a.axis}: method_status must be ADDED, not changed`).toBeUndefined();
      expect(typeof a.method_status).toBe("string");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { method_status: _ms, ...rest } = a;
      if (sha(rest) !== ROW_SHA256_ON_MASTER[a.axis]) drift.push(`${a.axis}: row differs from master`);
      for (const k of new Set([...Object.keys(f), ...Object.keys(a)])) {
        if (k === "method_status") continue;
        if (k === "separation_method" || k === "separation_evidence") {
          if (canonical(f[k]) === canonical(a[k])) continue;
          const pin = SEPARATION_TEXT_FROM_MASTER[a.axis];
          if (pin && sha(a[k]) === pin[k]) continue;
          drift.push(`${a.axis}.${k}`);
          continue;
        }
        if (watched(k, f[k], a[k]) && canonical(f[k]) !== canonical(a[k])) drift.push(`${a.axis}.${k}`);
      }
    }
    expect(Object.keys(ROW_SHA256_ON_MASTER).sort()).toEqual([...frozen.keys()].sort());
    for (const k of new Set([...Object.keys(freeze), ...Object.keys(body)]))
      if (/card|root/i.test(k) && canonical(freeze[k]) !== canonical(body[k])) drift.push(`board.${k}`);
    expect(drift).toEqual([]);
  });
});
