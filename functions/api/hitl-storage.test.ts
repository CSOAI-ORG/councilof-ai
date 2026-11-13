import { describe, expect, it, vi } from "vitest";
import { buildChallenge, buildReceipt, deriveModule, listChallenges, listCompletedModules, listReceipts, markModuleCompleted, putChallenge, putReceipt } from "./_hitl";

const { board } = vi.hoisted(() => ({ board: { axes: [{ axis: "governance", status: "MEASURED", separation: "TIE", n: 10 }] } }));
vi.mock("./_chatCanon", () => ({ loadBoard: async () => board }));
import { onRequestPost, onRequestGet, HITL_ASSESSMENT_SCOPE } from "./hitl";

function store(fail = false) {
  const values = new Map<string, string>();
  return {
    values,
    put: vi.fn(async (key: string, value: string) => { if (fail) throw new Error("storage failed"); values.set(key, value); }),
    get: async (key: string) => values.get(key) ?? null,
    list: async ({ prefix }: { prefix: string }) => ({ keys: [...values.keys()].filter(k => k.startsWith(prefix)).sort().map(name => ({ name })), list_complete: true }),
  };
}
async function challenge() {
  return buildChallenge({ at: "2026-10-29T00:00:00Z", axis: "governance", subject: "fixture", proposed_action: "review fixture", raised_by: "fixture", source: null, facts: null, required_module: null });
}
async function receipt(decision: "HOLD" | "REJECTED", at = "2026-10-29T00:00:01Z") {
  return buildReceipt({ operator: "fixture", axis: "governance", decision, note: "fixture", competency_verified: true, completed_modules: [], module_id: "governance", challenge: await challenge(), at });
}
async function post(path: string, body: unknown, kv?: ReturnType<typeof store>) {
  return onRequestPost({ request: new Request(`https://fixture.invalid/api/hitl/${path}`, { method: "POST", headers: { "content-type": "application/json", "x-hitl-token": "fixture-only-token" }, body: JSON.stringify(body) }), env: { HITL_KV: kv, HITL_DECIDE_TOKEN: "fixture-only-token" } } as any);
}
async function decisionBody() {
  const mod = deriveModule(board, "governance")!;
  return { decision: "HOLD", challenge: await challenge(), module_id: mod.id, answer: mod.correct_option, operator: "fixture" };
}

describe("HITL storage acknowledgement and decision history", () => {
  it("separates a caller label and answer match from identity and competence verification", async () => {
    const body = { ...await decisionBody(), operator: "caller-supplied label" };
    const res = await post("decision", body, store());
    expect(res.status).toBe(200);
    const reply = await res.json();
    expect(reply.assessment_scope).toEqual(HITL_ASSESSMENT_SCOPE);
    expect(reply.assessment_scope).toMatchObject({
      decision_recording_credential: "SHARED_OPERATOR_TOKEN",
      operator_identity: "NOT_VERIFIED", human_presence: "NOT_ESTABLISHED",
      competency_verified_meaning: "LIVE_BOARD_ANSWER_MATCH_ONLY",
      professional_competence: "NOT_ASSESSED", execution_authority: false,
    });
    // Compatibility fields and the signed payload remain the existing receipt shape.
    expect(reply.assessment_scope).not.toHaveProperty("credential_check");
    expect(reply.receipt.operator).toBe("caller-supplied label");
    expect(reply.receipt.competency_verified).toBe(true);
    expect(reply.receipt).not.toHaveProperty("assessment_scope");
    expect(reply.receipt.schema).toBe("csoai.hitl-oversight-receipt/0.1");
  });
  it("includes assessment limits when reading state and historical receipts", async () => {
    for (const path of ["", "/record"]) {
      const res = await onRequestGet({ request: new Request("https://fixture.invalid/api/hitl" + path), env: { HITL_KV: store() } } as any);
      expect((await res.json()).assessment_scope).toEqual(HITL_ASSESSMENT_SCOPE);
    }
  });
  it("does not report a challenge as stored after a rejected write", async () => {
    const res = await post("challenge", { subject: "fixture", proposed_action: "review fixture" }, store(true));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, stored: false, storage_state: "WRITE_UNCONFIRMED" });
  });
  it("does not report a decision as recorded after a rejected write", async () => {
    const res = await post("decision", await decisionBody(), store(true));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toMatchObject({ ok: false, stored: false, storage_state: "WRITE_UNCONFIRMED" });
    expect(body.receipt).toBeUndefined();
  });
  it("requires storage before recording a decision", async () => {
    const res = await post("decision", await decisionBody());
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, stored: false, storage_state: "UNBOUND" });
  });
  it("retains the deliberately stateless challenge path", async () => {
    const res = await post("challenge", { subject: "fixture", proposed_action: "review fixture" });
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ stored: false });
  });
  it("acknowledges a successful write without claiming execution authority", async () => {
    const res = await post("decision", await decisionBody(), store());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, stored: true, storage_state: "WRITE_ACKNOWLEDGED", execution_authority: false });
  });
  it("preserves two decisions about the same challenge", async () => {
    const kv = store();
    const a = await receipt("HOLD"); const b = await receipt("REJECTED", "2026-10-29T00:00:02Z");
    expect(await putReceipt(kv as any, a)).toBe(true);
    expect(await putReceipt(kv as any, b)).toBe(true);
    expect((await listReceipts(kv as any)).map(x => x.decision).sort()).toEqual(["HOLD", "REJECTED"]);
  });
  it("makes an exact receipt retry use the same content address", async () => {
    const kv = store(); const r = await receipt("HOLD");
    await putReceipt(kv as any, r); await putReceipt(kv as any, r);
    expect(kv.values.size).toBe(1);
    expect([...kv.values.keys()][0]).toMatch(/^hitl:receipt:[^:]+:[a-f0-9]{64}$/);
  });
  it("keeps legacy challenge-key receipts readable and untouched", async () => {
    const kv = store(); const a = await receipt("HOLD"); const b = await receipt("REJECTED");
    const key = `hitl:receipt:${a.challenge.id}`; const original = JSON.stringify(a);
    kv.values.set(key, original); await putReceipt(kv as any, b);
    expect(kv.values.get(key)).toBe(original);
    expect(await listReceipts(kv as any)).toHaveLength(2);
  });
  it("returns false to direct helper callers when storage refuses writes", async () => {
    expect(await putChallenge(store(true) as any, await challenge())).toBe(false);
    expect(await putReceipt(store(true) as any, await receipt("HOLD"))).toBe(false);
    expect(await putReceipt(null, await receipt("HOLD"))).toBe(false);
  });
  it("labels limited history without calling it every decision", async () => {
    const res = await onRequestGet({ request: new Request("https://fixture.invalid/api/hitl/record"), env: { HITL_KV: store() } } as any);
    const body = await res.json();
    expect(body.history_scope).toMatchObject({ limit: 50, complete: false, consistency: "eventual" });
    expect(body.note).not.toMatch(/Every decision/);
  });
  it("does not turn an unreadable history into a successful empty ledger", async () => {
    const kv = store(); kv.list = async () => { throw new Error("unavailable"); };
    const res = await onRequestGet({ request: new Request("https://fixture.invalid/api/hitl/record"), env: { HITL_KV: kv } } as any);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.storage_state).toBe("READ_FAILED");
    expect(body.receipts).toBeUndefined();
  });
  it("does not advertise the decision path as open without storage", async () => {
    const res = await onRequestGet({ request: new Request("https://fixture.invalid/api/hitl"), env: { HITL_DECIDE_TOKEN: "fixture-only-token" } } as any);
    expect(await res.json()).toMatchObject({ decision_path: "locked", operator_token_configured: true, store_bound: false });
  });
});

describe("shared HITL practice completion, separate from a person's decision", () => {
  async function answer(kv: ReturnType<typeof store>, correct: boolean) {
    const mod = deriveModule(board, "governance")!;
    const selected = correct ? mod.correct_option : mod.options.find(option => option.id !== mod.correct_option)!.id;
    // Practice has no token or named learner. Test the actual public branch.
    return onRequestPost({ request: new Request("https://fixture.invalid/api/hitl/modules", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ module_id: mod.id, answer: selected }),
    }), env: { HITL_KV: kv } } as any);
  }

  it("checks an incorrect answer without recording a completion", async () => {
    const kv = store();
    const response = await answer(kv, false);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, correct: false, recorded: false, oversight_gate_unlocked: false });
    expect(kv.put).not.toHaveBeenCalled();
    expect(await listCompletedModules(kv as any)).toEqual([]);
  });

  it("records a correct result and preserves it after a later incorrect attempt", async () => {
    const kv = store(); const id = deriveModule(board, "governance")!.id;
    expect(await (await answer(kv, true)).json()).toMatchObject({ correct: true, recorded: true });
    const original = kv.values.get(`hitl:module:${id}`);
    expect(await (await answer(kv, false)).json()).toMatchObject({ correct: false, recorded: false });
    expect(kv.values.get(`hitl:module:${id}`)).toBe(original);
    expect(kv.put).toHaveBeenCalledTimes(1);
    expect(await listCompletedModules(kv as any)).toEqual([id]);
  });

  it("filters legacy incorrect, unqualified and key-mismatched rows without rewriting them", async () => {
    const kv = store();
    const rows: Array<[string, unknown]> = [
      ["good", { module_id: "good", correct: true }],
      ["wrong", { module_id: "wrong", correct: false }],
      ["absent", { module_id: "absent" }],
      ["string", { module_id: "string", correct: "true" }],
      ["misbound", { module_id: "other", correct: true }],
      ["number", { module_id: 1, correct: true }],
      ["empty", null],
    ];
    for (const [key, value] of rows) kv.values.set(`hitl:module:${key}`, JSON.stringify(value));
    kv.values.set("hitl:module:malformed", "{");
    const original = [...kv.values.entries()];
    expect(await listCompletedModules(kv as any)).toEqual(["good"]);
    expect([...kv.values.entries()]).toEqual(original);
    expect(kv.put).not.toHaveBeenCalled();
    const response = await onRequestGet({ request: new Request("https://fixture.invalid/api/hitl"), env: { HITL_KV: kv } } as any);
    expect(await response.json()).toMatchObject({ completed_modules: ["good"] });
  });

  it("direct helper callers cannot mark an incorrect or misbound result complete", async () => {
    const kv = store();
    for (const record of [null, [], {}, { module_id: "m", correct: false },
      { module_id: "other", correct: true }, { module_id: "m", correct: "true" }]) {
      expect(await markModuleCompleted(kv as any, "m", record as any)).toBe(false);
    }
    expect(kv.put).not.toHaveBeenCalled();
    expect(await markModuleCompleted(kv as any, "m", { module_id: "m", correct: true })).toBe(true);
  });

  it("reports an unacknowledged correct-result write without inventing completion", async () => {
    const kv = store(true);
    expect(await (await answer(kv, true)).json()).toMatchObject({ correct: true, recorded: false });
    expect(await listCompletedModules(kv as any)).toEqual([]);
  });

  it("a new decision receipt contains only the module rechecked in that request", async () => {
    const kv = store();
    kv.values.set("hitl:module:someone-elses-module", JSON.stringify({ module_id: "someone-elses-module", correct: true }));
    const historical = await receipt("HOLD");
    await putReceipt(kv as any, historical);
    const oldEntries = [...kv.values.entries()];
    const response = await post("decision", await decisionBody(), kv);
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.execution_authority).toBe(false);
    expect(result.receipt.completed_modules).toEqual([deriveModule(board, "governance")!.id]);
    for (const [key, value] of oldEntries) expect(kv.values.get(key)).toBe(value);
  });

  it("shared completion cannot bypass the decision's current-answer recheck", async () => {
    const kv = store(); const mod = deriveModule(board, "governance")!;
    await answer(kv, true);
    const body = await decisionBody();
    body.answer = mod.options.find(option => option.id !== mod.correct_option)!.id;
    const response = await post("decision", body, kv);
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ ok: false, blocked_by_competency_gate: true });
    expect(await listReceipts(kv as any)).toEqual([]);
  });
});

describe("bounded HITL history integrity", () => {
  async function retainedHistory() {
    const kv = store();
    const c = await challenge();
    const a = await receipt("HOLD");
    const b = await receipt("REJECTED", "2026-10-29T00:00:02Z");
    await putChallenge(kv as any, c);
    // Exercise the old challenge-only address alongside the content-addressed form.
    const legacyKey = `hitl:receipt:${c.id}`;
    kv.values.set(legacyKey, JSON.stringify(a));
    await putReceipt(kv as any, b);
    const addressedKey = [...kv.values.keys()].find(k => k.startsWith(`${legacyKey}:`))!;
    kv.put.mockClear();
    return { kv, c, a, b, legacyKey, addressedKey };
  }

  async function read(kv: ReturnType<typeof store>, path = "record") {
    return onRequestGet({ request: new Request(`https://fixture.invalid/api/hitl/${path}`), env: { HITL_KV: kv } } as any);
  }

  async function expectUnavailable(kv: ReturnType<typeof store>, state = "HISTORY_INVALID", path = "record") {
    const snapshot = [...kv.values.entries()];
    const response = await read(kv, path);
    expect(response.status).toBe(503);
    const result = await response.json();
    expect(result).toMatchObject({ ok: false, store_bound: true, storage_state: state });
    for (const field of ["count", "receipts", "challenges", "review_queue_summary", "decision_path"]) {
      expect(result).not.toHaveProperty(field);
    }
    expect(kv.put).not.toHaveBeenCalled();
    expect([...kv.values.entries()]).toEqual(snapshot);
    return result;
  }

  it("retains valid legacy and content-addressed records byte-for-byte", async () => {
    const { kv, c, a, b } = await retainedHistory();
    const snapshot = [...kv.values.entries()];
    expect(await listChallenges(kv as any, 50, true)).toEqual([c]);
    expect(await listReceipts(kv as any, 50, true)).toEqual([a, b]);
    const response = await read(kv);
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.count).toBe(2);
    expect(result.history_scope).toMatchObject({
      complete: false, consistency: "eventual", integrity: "CANONICAL_DIGEST_AND_STORAGE_KEY_CHECKED",
      signature_verification: "NOT_PERFORMED",
    });
    expect(result.assessment_scope.operator_identity).toBe("NOT_VERIFIED");
    expect(result.assessment_scope.execution_authority).toBe(false);
    expect([...kv.values.entries()]).toEqual(snapshot);
    expect(kv.put).not.toHaveBeenCalled();
  });

  it("retains a structurally valid signed receipt without promoting its signer to verified", async () => {
    // This generated key exists only in the owned software fixture. No production
    // key, human enrollment, decision or execution is represented by this test.
    const { kv, c } = await retainedHistory();
    const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
    const pkcs8 = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
    const signingKey = btoa(String.fromCharCode(...new Uint8Array(pkcs8)));
    const signed = await buildReceipt({
      operator: "synthetic fixture", axis: "governance", decision: "HOLD", note: "software check only",
      competency_verified: true, completed_modules: [], module_id: "governance", challenge: c,
      at: "2026-10-29T00:00:03Z", signingKey,
    });
    await putReceipt(kv as any, signed);
    const snapshot = [...kv.values.entries()];
    const response = await read(kv);
    expect(response.status).toBe(200);
    const result = await response.json();
    const published = result.receipts.find((r: any) => r.at === signed.at);
    expect(published.signature).toEqual(signed.signature);
    expect(published.verification).toContain("has not verified the signature or authenticated its signer");
    expect(published.verification).not.toContain("is signed under the Council's board attestation key");
    expect(result.history_scope.signature_verification).toBe("NOT_PERFORMED");
    expect(result.assessment_scope.operator_identity).toBe("NOT_VERIFIED");
    expect([...kv.values.entries()]).toEqual(snapshot);
  });

  it.each(["{bad json", "null", "[]", "{}", ""])("does not silently omit unreadable receipt bytes: %s", async (raw) => {
    const { kv, legacyKey } = await retainedHistory();
    kv.values.set(legacyKey, raw);
    await expectUnavailable(kv);
  });

  it.each([
    ["decision", (r: any) => { r.decision = "APPROVED"; }],
    ["payload digest", (r: any) => { r.signature.sha256 = "0".repeat(64); }],
    ["payload byte count", (r: any) => { r.signature.bytes += 1; }],
    ["missing signature metadata", (r: any) => { delete r.signature; }],
    ["malformed decision shape", (r: any) => { r.completed_modules = "module"; }],
    ["contradictory signature state", (r: any) => { r.signature.value_b64 = "claimed-signature"; }],
  ] as const)("rejects altered %s even under a legacy address", async (_name, alter) => {
    const { kv, a, legacyKey } = await retainedHistory();
    alter(a);
    kv.values.set(legacyKey, JSON.stringify(a));
    await expectUnavailable(kv);
  });

  it("checks the whole content address, including metadata outside the signed payload", async () => {
    const { kv, b, addressedKey } = await retainedHistory();
    b.signature.unsigned_reason = "different signature metadata";
    kv.values.set(addressedKey, JSON.stringify(b));
    await expectUnavailable(kv);
  });

  it.each(["legacy", "content-addressed"])("rejects a receipt stored under another challenge's %s key", async (kind) => {
    const { kv, legacyKey, addressedKey } = await retainedHistory();
    const key = kind === "legacy" ? legacyKey : addressedKey;
    const raw = kv.values.get(key)!;
    kv.values.delete(key);
    kv.values.set(key.replace(/chl_[a-f0-9]{16}/, "chl_0000000000000000"), raw);
    await expectUnavailable(kv);
  });

  it.each(["hidden content", "displayed action", "missing field", "key binding"])("rejects a challenge with altered %s before showing queue state", async (kind) => {
    const { kv, c } = await retainedHistory();
    const key = `hitl:challenge:${c.id}`;
    if (kind === "key binding") {
      kv.values.delete(key);
      kv.values.set("hitl:challenge:chl_0000000000000000", JSON.stringify(c));
    } else {
      const changed: any = { ...c };
      if (kind === "hidden content") changed.facts = "private tampered value";
      else if (kind === "displayed action") changed.proposed_action = "changed action";
      else delete changed.axis;
      kv.values.set(key, JSON.stringify(changed));
    }
    const result = await expectUnavailable(kv, "HISTORY_INVALID", "challenges");
    expect(JSON.stringify(result)).not.toContain("private tampered value");
  });

  it.each(["challenge", "receipt"])("does not count a listed but missing %s as absent history", async (kind) => {
    const { kv, c, legacyKey } = await retainedHistory();
    const missingKey = kind === "challenge" ? `hitl:challenge:${c.id}` : legacyKey;
    const originalGet = kv.get;
    kv.get = async (key: string) => key === missingKey ? null : originalGet(key);
    await expectUnavailable(kv, "HISTORY_UNAVAILABLE");
  });

  it("does not expose partial results after a value-read failure", async () => {
    const { kv, addressedKey } = await retainedHistory();
    const originalGet = kv.get;
    kv.get = async (key: string) => {
      if (key === addressedKey) throw new Error("private backend failure");
      return originalGet(key);
    };
    const result = await expectUnavailable(kv, "READ_FAILED");
    expect(JSON.stringify(result)).not.toContain("private backend failure");
  });

  it("refuses duplicate listed identities instead of counting a decision twice", async () => {
    const { kv } = await retainedHistory();
    const originalList = kv.list;
    kv.list = async (query) => {
      const result = await originalList(query);
      if (query.prefix === "hitl:receipt:") result.keys.push(result.keys[0]);
      return result;
    };
    await expectUnavailable(kv);
  });

  it("does not advertise a clean oversight state when retained history is invalid", async () => {
    const { kv, legacyKey } = await retainedHistory();
    kv.values.set(legacyKey, "{invalid");
    await expectUnavailable(kv, "HISTORY_INVALID", "");
  });

  it("keeps a readable empty bounded store distinct from unavailable history", async () => {
    const kv = store();
    const response = await read(kv);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ count: 0, receipts: [], history_scope: { complete: false } });
  });
});
