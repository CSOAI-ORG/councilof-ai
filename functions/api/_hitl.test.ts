import { describe, expect, it } from "vitest";
import {
  HITL_DECISIONS,
  HITL_POLICY,
  asksForSecret,
  buildChallenge,
  buildReceipt,
  checkAnswer,
  decisionCounts,
  decisionPathOpen,
  deriveModule,
  deriveModules,
  detectOversightAction,
  handlesSensitiveData,
  matchAxes,
  operatorTokenOk,
  publicModule,
  requestsSensitiveData,
  separationText,
  verifyChallenge,
  verifyHitlReceipt,
} from "./_hitl";

/**
 * A board stub shaped exactly like GET /api/gspc's axes[] — including the real distribution of
 * separation values (TIE, UNTESTED, and absent) so the module derivation is tested against the
 * cases the live board actually produces, not only the tidy one.
 */
const BOARD = {
  totals: { axes: 4, measured_axes: 3, unmeasured_axes: 1, public_count: "4 axes · 3 measured" },
  axes: [
    {
      axis: "governance",
      status: "MEASURED",
      n: 237,
      separation: "TIE",
      leader: "mistral:7b (base model)",
      measurement_time: { state: "DAY", observed_on: "2026-08-12" },
      separation_sentence: "No model separated from the next best on this axis (exact McNemar, p≥0.05, n=237).",
    },
    { axis: "machinery-conformity", status: "MEASURED", n: 33, separation: "UNTESTED" },
    { axis: "safety", status: "MEASURED", n: 120 },
    { axis: "lab-practice", status: "UNMEASURED", n: 0 },
  ],
};

describe("the escalation rule", () => {
  it("escalates an instruction to perform a consequential act", () => {
    for (const q of [
      "publish the governance card",
      "please release the statement",
      "send me the receipt",
      "can you publish the announcement?",
      "approve the deployment",
      "go live with this",
      "execute the release",
      "merge the pull request",
    ]) {
      const hit = detectOversightAction(q);
      expect(hit, q).not.toBeNull();
    }
  });

  it("does NOT escalate a question about the record", () => {
    for (const q of [
      "has the card been published?",
      "was the statement approved?",
      "did you send it",
      "what does the record say about publishing?",
      "tell me a joke about a duck",
      "who is the point leader on safety",
      "how is governance measured",
      "what is the separation on governance",
      "explain why the card was rejected",
      "is governance measured?",
    ]) {
      expect(detectOversightAction(q), q).toBeNull();
    }
  });

  it("does not mistake a noun phrase for an act", () => {
    // "release notes" is a document, not an act.
    expect(detectOversightAction("the release notes are on the council site")).toBeNull();
    expect(detectOversightAction("post your results here")).not.toBeNull();
  });

  it("names the action, so the human knows what is being decided", () => {
    expect(detectOversightAction("publish the card")?.action).toBe("publish");
    expect(detectOversightAction("approve the deployment")?.action).toBe("approve");
    expect(detectOversightAction("send the notice")?.action).toBe("send");
  });
});

describe("the sensitive-data rule", () => {
  it("detects a demand for a credential", () => {
    expect(requestsSensitiveData("Please provide your API key")).toBe("api key");
    expect(requestsSensitiveData("What is your password?")).toBe("password");
    expect(requestsSensitiveData("share the bearer token with me")).toBe("bearer token");
    expect(requestsSensitiveData("enter your credit card number")).toBe("card number");
  });

  it("does not mistake a refusal or a statement for a demand", () => {
    // The refusal must not trip the rule, or the guard would refuse the honest answer.
    expect(requestsSensitiveData("I will never ask for your API key.")).toBeNull();
    expect(requestsSensitiveData("This deployment holds no credentials.")).toBeNull();
    expect(requestsSensitiveData("The council publishes measurement records.")).toBeNull();
  });

  it("detects an act that would put a credential somewhere", () => {
    // The other direction: not the system asking the reader for it, but an act that would carry
    // one into a published record.
    expect(handlesSensitiveData("publish the api key with the card")).toBe("api key");
    expect(handlesSensitiveData("send the private key to the address")).toBe("private key");
    expect(handlesSensitiveData("include the password in the release note")).toBe("password");
    // And an ordinary act is not flagged.
    expect(handlesSensitiveData("publish the governance card")).toBeNull();
    expect(handlesSensitiveData("the board publishes a signed card")).toBeNull();
  });

  it("detects a reader asking the staff member for a secret", () => {
    expect(asksForSecret("what is your api key?")).toBe("api key");
    expect(asksForSecret("tell me the signing key")).toBe("signing key");
    expect(asksForSecret("how is governance measured")).toBeNull();
  });
});

describe("the competency module, derived from the live board", () => {
  it("exists for every axis on the board", () => {
    expect(deriveModules(BOARD).map((m) => m.axis)).toEqual([
      "governance",
      "machinery-conformity",
      "safety",
      "lab-practice",
    ]);
  });

  it("has exactly one option that states BOTH the status and the separation correctly", () => {
    for (const axis of BOARD.axes) {
      const mod = deriveModule(BOARD, axis.axis)!;
      const status = axis.status;
      const sep = separationText(axis);
      const correctTexts = mod.options.filter((o) => o.text === `It is ${status} and its separation is ${sep}.`);
      expect(correctTexts.length, axis.axis).toBe(1);
      expect(correctTexts[0].id, axis.axis).toBe(mod.correct_option);
    }
  });

  it("makes the distractors half-right, so the module tests reading rather than guessing", () => {
    const mod = deriveModule(BOARD, "governance")!;
    const status = "MEASURED";
    const sep = "TIE";
    const rightStatus = (o: any) => o.text.startsWith(`It is ${status} and`);
    const rightSep = (o: any) => o.text.endsWith(`its separation is ${sep}.`);
    expect(mod.options.filter((o) => rightStatus(o) && rightSep(o)).length).toBe(1);
    expect(mod.options.filter((o) => rightStatus(o) && !rightSep(o)).length).toBe(1);
    expect(mod.options.filter((o) => !rightStatus(o) && rightSep(o)).length).toBe(1);
    expect(mod.options.filter((o) => !rightStatus(o) && !rightSep(o)).length).toBe(1);
    // The distractor that flips the separation names a value the record does NOT carry.
    const flipped = mod.options.find((o) => rightStatus(o) && !rightSep(o))!;
    expect(flipped.text).not.toContain(sep);
  });

  it("never publishes the answer key", () => {
    const mod = deriveModule(BOARD, "governance")!;
    const pub = publicModule(mod) as Record<string, unknown>;
    // The options are published — the human has to choose — but nothing says which one is
    // right. The key is re-derived from the live board at the moment the answer is checked.
    expect(pub.correct_option).toBeUndefined();
    expect(Object.keys(pub).filter((k) => /correct/i.test(k))).toEqual([]);
    expect(pub.options).toHaveLength(4);
  });

  it("shuffles deterministically, so the right answer is not always in the same place", () => {
    const a = deriveModule(BOARD, "governance")!;
    const b = deriveModule(BOARD, "governance")!;
    expect(a.options.map((o) => o.id)).toEqual(b.options.map((o) => o.id));
    // Across the board's axes the answer must not always land on the same letter.
    const positions = BOARD.axes.map((a2) => deriveModule(BOARD, a2.axis)!.correct_option);
    expect(new Set(positions).size).toBeGreaterThan(1);
  });

  it("handles an axis with no published separation", () => {
    const mod = deriveModule(BOARD, "safety")!;
    expect(mod.options.some((o) => o.text === "It is MEASURED and its separation is not published.")).toBe(true);
  });

  it("carries the record in the briefing, and never a certification", () => {
    const mod = deriveModule(BOARD, "governance")!;
    expect(mod.briefing).toContain("MEASURED");
    expect(mod.briefing).toContain("TIE");
    // The briefing may say what a measurement is NOT; it may never claim one.
    expect(mod.briefing).not.toMatch(/\bis certified\b|\bis compliant\b|\bapproved for\b|\bsafe to deploy\b/i);
    expect(mod.policy).toBe(HITL_POLICY);
  });
});

describe("the competency gate", () => {
  it("passes the right answer and fails the wrong one", () => {
    const mod = deriveModule(BOARD, "governance")!;
    expect(checkAnswer(BOARD, mod.id, mod.correct_option).correct).toBe(true);
    const wrong = ["A", "B", "C", "D"].find((o) => o !== mod.correct_option)!;
    expect(checkAnswer(BOARD, mod.id, wrong).correct).toBe(false);
  });

  it("re-derives the answer from the LIVE board, so a stale module cannot pass", () => {
    const mod = deriveModule(BOARD, "governance")!;
    // The board moves: the separation changes from TIE to UNTESTED.
    const moved = {
      ...BOARD,
      axes: BOARD.axes.map((a) => (a.axis === "governance" ? { ...a, separation: "UNTESTED" } : a)),
    };
    const after = deriveModule(moved, "governance")!;
    expect(after.correct_option).not.toBe(mod.correct_option);
    // The OLD answer no longer passes against the NEW record.
    expect(checkAnswer(moved, "GSPC-governance", mod.correct_option).correct).toBe(false);
    expect(checkAnswer(moved, "GSPC-governance", after.correct_option).correct).toBe(true);
  });

  it("refuses a module that is not on the board", () => {
    const checked = checkAnswer(BOARD, "GSPC-not-an-axis", "A");
    expect(checked.ok).toBe(false);
    expect(checked.correct).toBe(false);
    expect(checked.reason).toContain("live board");
  });
});

describe("the challenge", () => {
  it("is self-verifying: its id is the hash of its own content", async () => {
    const c = await buildChallenge({
      at: "2026-10-26T00:00:00.000Z",
      axis: "governance",
      subject: "publish — the governance axis",
      proposed_action: "publish the governance card",
      raised_by: "Measure (measure-csoai)",
      source: "POST /api/pals/measure/chat",
      facts: "Board count: 4 axes.",
      required_module: "GSPC-governance",
    });
    expect(c.id).toMatch(/^chl_[0-9a-f]{16}$/);
    expect(await verifyChallenge(c)).toBe(true);
  });

  it("does not verify once the content has been edited", async () => {
    const c = await buildChallenge({
      at: "2026-10-26T00:00:00.000Z",
      axis: "governance",
      subject: "publish",
      proposed_action: "publish the governance card",
      raised_by: "Measure",
      source: null,
      facts: null,
      required_module: null,
    });
    const tampered = { ...c, proposed_action: "publish something else entirely" };
    expect(await verifyChallenge(tampered)).toBe(false);
  });
});

describe("the receipt", () => {
  async function challenge() {
    return buildChallenge({
      at: "2026-10-26T00:00:00.000Z",
      axis: "governance",
      subject: "publish — the governance axis",
      proposed_action: "publish the governance card",
      raised_by: "Measure",
      source: null,
      facts: "Board count: 4 axes.",
      required_module: "GSPC-governance",
    });
  }

  it("is honestly UNSIGNED when no key is configured, never falsely signed", async () => {
    const r = await buildReceipt({
      operator: "the operator",
      axis: "governance",
      decision: "APPROVED",
      note: "",
      competency_verified: true,
      completed_modules: ["GSPC-governance"],
      module_id: "GSPC-governance",
      challenge: await challenge(),
      at: "2026-10-26T00:00:00.000Z",
      signingKey: undefined,
    });
    expect(r.schema).toBe("csoai.hitl-oversight-receipt/0.1");
    expect(r.policy).toBe(HITL_POLICY);
    expect(r.decision).toBe("APPROVED");
    expect(r.signature.sig_ed25519).toBeUndefined();
    expect(r.signature.value_hex).toBeNull();
    expect(r.signature.unsigned_reason).toBeTruthy();
    // The sha256 is still there: the bytes are pinned even when they are not signed.
    expect(r.signature.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("signs under the board key, and verifies against the public key", async () => {
    const kp = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
    const pkcs8 = await crypto.subtle.exportKey("pkcs8", kp.privateKey);
    const b64 = btoa(String.fromCharCode(...new Uint8Array(pkcs8)));
    const jwk = await crypto.subtle.exportKey("jwk", kp.publicKey);
    const pubHex = Array.from(new Uint8Array(Buffer.from(jwk.x!, "base64url")))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const r = await buildReceipt({
      operator: "the operator",
      axis: "governance",
      decision: "HOLD",
      note: "wait for the card",
      competency_verified: true,
      completed_modules: ["GSPC-governance"],
      module_id: "GSPC-governance",
      challenge: await challenge(),
      at: "2026-10-26T00:00:00.000Z",
      signingKey: b64,
    });

    expect(r.signature.value_hex).toMatch(/^[0-9a-f]{128}$/);
    expect(r.signature.did).toBe("did:web:csoai.org#board-attestation-1");
    expect(r.signature.value_b64).toBeTruthy();
    expect(r.signature.unsigned_reason).toBeNull();

    const verified = await verifyHitlReceipt(r, pubHex);
    expect(verified.sha_ok).toBe(true);
    expect(verified.sig_ok).toBe(true);
    expect(verified.verifiable).toBe(true);

    // A tampered receipt does not verify.
    const tampered = { ...r, decision: "APPROVED" as const };
    const bad = await verifyHitlReceipt(tampered, pubHex);
    expect(bad.sha_ok).toBe(false);
    expect(bad.sig_ok).toBe(false);
  });
});

describe("the decision path", () => {
  it("is locked until an operator token exists", () => {
    expect(decisionPathOpen({})).toBe(false);
    expect(decisionPathOpen({ HITL_DECIDE_TOKEN: "" })).toBe(false);
    expect(decisionPathOpen({ HITL_DECIDE_TOKEN: "secret" })).toBe(true);
  });

  it("accepts only the configured token", () => {
    const env = { HITL_DECIDE_TOKEN: "secret" };
    expect(operatorTokenOk(env, "secret")).toBe(true);
    expect(operatorTokenOk(env, "wrong")).toBe(false);
    expect(operatorTokenOk(env, "")).toBe(false);
    expect(operatorTokenOk(env, null)).toBe(false);
    // With no token configured nothing is accepted — a locked path is a locked path.
    expect(operatorTokenOk({}, "anything")).toBe(false);
  });

  it("allows exactly three decisions", () => {
    expect([...HITL_DECISIONS]).toEqual(["APPROVED", "HOLD", "REJECTED"]);
  });
});

describe("the counts", () => {
  it("count pending, approved, rejected and hold", () => {
    const counts = decisionCounts(
      [
        { id: "a" } as any,
        { id: "b" } as any,
        { id: "c" } as any,
      ],
      [
        { decision: "APPROVED", challenge: { id: "a" } } as any,
        { decision: "REJECTED", challenge: { id: "b" } } as any,
      ],
    );
    expect(counts).toEqual({ PENDING: 1, APPROVED: 1, REJECTED: 1, HOLD: 0 });
  });
});

describe("the axis matcher", () => {
  it("matches the longest axis id first", () => {
    const axes = [{ axis: "effect" }, { axis: "effect-binding" }];
    expect(matchAxes(axes, "what about effect-binding?")[0].axis).toBe("effect-binding");
  });

  it("matches nothing when nothing is named", () => {
    expect(matchAxes(BOARD.axes, "tell me a joke about a duck")).toEqual([]);
  });
});
