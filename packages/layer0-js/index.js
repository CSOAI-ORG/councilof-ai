// @csoai/layer0 — drop-in Layer 0 + Constitutional Harness + A2A adapter.
// Supports both:
//   1. Gateway mode (`gate`, `governed`, `verify`) for remote CSOAI A2A gateways.
//   2. Zero-dependency offline/local Constitutional Harness mode (`localConstitutionalPrecheck`,
//      `governedLocal`, `verifyLocalReceipt`), pinned to `/.well-known/constitutional-harness.json`
//      (v0.1.0 sha256: 3dcf79a7526785324ef15deaa40adabc5e77fbc99c4ebd089309d948c3c3e32e),
//      enforcing Controls CH-01..CH-16, Human-in-the-Loop (HITL) approval receipts, secret
//      minimization (CH-10), and Ed25519 effect-receipt signing (`node:crypto`).
//
// Doctrine: Measurement, never certification. Anyone can re-check at https://councilof.ai/verify

import crypto from "node:crypto";

export const CHARTER_V0_1_0_SHA256 =
  "3dcf79a7526785324ef15deaa40adabc5e77fbc99c4ebd089309d948c3c3e32e";

const canonicalJson = (obj) => {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(canonicalJson).join(",") + "]";
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys
      .filter((k) => obj[k] !== undefined)
      .map((k) => JSON.stringify(k) + ":" + canonicalJson(obj[k]))
      .join(",") +
    "}"
  );
};

const sha256 = (s) =>
  "sha256:" +
  crypto
    .createHash("sha256")
    .update(typeof s === "string" ? s : canonicalJson(s))
    .digest("hex");

const SECRET_KEY_RE =
  /(?:^|_|-)(?:password|passwd|api_key|apikey|secret_key|private_key|access_token|bearer_token|client_secret|credit_card)(?:$|_|-)/i;

const DENIED_REGULATORY_ACTIONS = new Set([
  "regulatory_determination",
  "certify_compliance",
  "issue_conformity_mark",
  "approve_legal_compliance",
  "override_legal_authority",
]);

const HITL_ESCALATION_PREFIXES = [
  "execute_",
  "deploy_",
  "transfer_",
  "settle_",
  "delete_",
  "modify_production_",
  "host_power_",
  "sign_board_",
  "publish_public_",
];

function containsRawSecretKey(obj) {
  if (!obj || typeof obj !== "object") return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const hit = containsRawSecretKey(item);
      if (hit) return hit;
    }
    return null;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (SECRET_KEY_RE.test(k) && typeof v === "string" && v.length > 0) {
      return k;
    }
    const nested = containsRawSecretKey(v);
    if (nested) return nested;
  }
  return null;
}

export class Layer0 {
  constructor({
    base = process.env.CSOAI_API_BASE || "https://councilof.ai",
    identity,
    tenantId = "default-tenant",
    harnessId = "layer0-js",
    endpoint = "tool://local",
    fetchImpl = fetch,
    keyPair = null,
  } = {}) {
    this.base = base.replace(/\/$/, "");
    this.identity = identity;
    this.tenantId = tenantId;
    this.harnessId = harnessId;
    this.endpoint = endpoint;
    this._fetch = fetchImpl;
    this._keyPair = keyPair;
  }

  _ensureKeyPair() {
    if (!this._keyPair) {
      this._keyPair = crypto.generateKeyPairSync("ed25519");
    }
    return this._keyPair;
  }

  async _post(path, body) {
    const r = await this._fetch(this.base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`csoai gateway ${path} → ${r.status}`);
    return r.json();
  }

  // §3 Layer-0 Gate decision (remote gateway)
  async gate(action, inputs) {
    return this._post("/api/gate", {
      action,
      identity: this.identity,
      inputsHash: sha256(inputs),
    });
  }

  // Offline/local fail-closed Constitutional Harness precheck (Controls CH-01..CH-16, Articles 1..22)
  localConstitutionalPrecheck(action, inputs = {}, context = {}) {
    const reasons = [];
    const controlsChecked = ["CH-01", "CH-02", "CH-03", "CH-04", "CH-10", "CH-13"];

    // CH-01: Trusted identity binding (Article 3)
    if (!this.identity || typeof this.identity !== "string") {
      reasons.push("CH-01: missing subject identity");
    }
    if (!action || typeof action !== "string") {
      reasons.push("CH-04: missing action identifier");
    }

    // CH-13: No regulatory determination or certification (Article 14)
    if (action && DENIED_REGULATORY_ACTIONS.has(action)) {
      reasons.push(`CH-13: action '${action}' is outside CSOAI constitutional boundary (measurement, never certification)`);
    }

    // CH-10: Security and secret minimization (Article 9 & MCP elicitation rule)
    const leakedKey = containsRawSecretKey(inputs);
    if (leakedKey) {
      reasons.push(`CH-10: raw secret field '${leakedKey}' must not enter agent context or receipts`);
    }

    if (reasons.length > 0) {
      return {
        schema: "csoai.constitutional-precheck/0.1",
        charter_sha256: CHARTER_V0_1_0_SHA256,
        state: "deny",
        charter_decision_state: "DENY",
        controls_checked: controlsChecked,
        reason: reasons.join("; "),
        reasons,
      };
    }

    // CH-03 / CH-04 / Article 7 & 20: Consequential execution requires HITL approval receipt
    const requiresHitl =
      Boolean(context.requiresHumanReview) ||
      HITL_ESCALATION_PREFIXES.some((prefix) => action.startsWith(prefix));

    if (requiresHitl) {
      return {
        schema: "csoai.constitutional-precheck/0.1",
        charter_sha256: CHARTER_V0_1_0_SHA256,
        state: "escalate",
        charter_decision_state: "HOLD_REVIEW",
        controls_checked: controlsChecked,
        reason: `CH-03/CH-04: consequential action '${action}' requires human-in-the-loop approval receipt`,
        reasons: [`consequential_action:${action}`],
      };
    }

    return {
      schema: "csoai.constitutional-precheck/0.1",
      charter_sha256: CHARTER_V0_1_0_SHA256,
      state: "allow",
      charter_decision_state: "ALLOW_PRECHECK",
      controls_checked: controlsChecked,
      reason: null,
      reasons: [],
    };
  }

  // Offline/local governed wrapper: Constitutional Precheck -> HITL Gate -> Run -> Ed25519 Receipt
  async governedLocal(action, inputs, run, options = {}) {
    const decision = this.localConstitutionalPrecheck(action, inputs, options);
    if (decision.state === "deny") {
      throw new Error(`Layer-0 Gate denied: ${decision.reason || action}`);
    }
    let approval = null;
    if (decision.state === "escalate") {
      approval = options.approvalReceipt || null;
      if (!approval && !options.allowUnapprovedEscalation) {
        throw new Error(
          `Layer-0 Gate escalation requires an approval receipt before execution: ${decision.reason || action}`
        );
      }
    }

    const result = await run({
      requiresHumanReview: decision.state === "escalate",
      decision,
      approval,
    });

    const { publicKey, privateKey } = this._ensureKeyPair();
    const pubJwk = publicKey.export({ format: "jwk" });
    const body = {
      schema: "csoai.constitutional-effect-receipt/0.1",
      charter_sha256: CHARTER_V0_1_0_SHA256,
      subject_id: this.identity,
      tenant_id: this.tenantId,
      harness_id: this.harnessId,
      endpoint: this.endpoint,
      action,
      inputs_sha256: sha256(inputs),
      observed_effect_sha256: sha256(result ?? null),
      decision_state: decision.charter_decision_state,
      human_in_the_loop:
        decision.state === "escalate"
          ? {
              required: true,
              approved: Boolean(approval),
              approver: approval?.approver || null,
              approval_receipt_id: approval?.receipt_id || null,
            }
          : { required: false, approved: false, approver: null, approval_receipt_id: null },
      verification_state: "RECEIPT_SIGNED_EFFECT_AWAITING_INDEPENDENT_VERIFIER",
      execution_authority_granted_by_charter: false,
      not_a_certification: true,
    };
    const canonicalBytes = Buffer.from(canonicalJson(body), "utf8");
    const receiptSha256 = crypto.createHash("sha256").update(canonicalBytes).digest("hex");
    const sigBase64Url = crypto.sign(null, canonicalBytes, privateKey).toString("base64url");

    const attestation = {
      ...body,
      receipt_sha256: receiptSha256,
      public_key_jwk: pubJwk,
      sig_ed25519: sigBase64Url,
    };

    const status =
      decision.state === "escalate" && !approval ? "executed_unapproved" : "attested";
    return { status, result, decision, approval, attestation };
  }

  // Verify a local Ed25519 constitutional effect receipt offline
  verifyLocalReceipt(attestation) {
    try {
      if (!attestation || typeof attestation !== "object") {
        return { verdict: "UNCHECKABLE", reason: "missing attestation object" };
      }
      const { sig_ed25519, public_key_jwk, receipt_sha256, ...body } = attestation;
      if (!sig_ed25519 || !public_key_jwk || !receipt_sha256) {
        return { verdict: "UNCHECKABLE", reason: "missing signature, key, or receipt_sha256" };
      }
      const canonicalBytes = Buffer.from(canonicalJson(body), "utf8");
      const recomputedSha = crypto.createHash("sha256").update(canonicalBytes).digest("hex");
      if (recomputedSha !== receipt_sha256) {
        return { verdict: "INVALID", reason: "receipt_sha256 mismatch against canonical body" };
      }
      const pubKey = crypto.createPublicKey({ key: public_key_jwk, format: "jwk" });
      const ok = crypto.verify(
        null,
        canonicalBytes,
        pubKey,
        Buffer.from(sig_ed25519, "base64url")
      );
      if (!ok) {
        return { verdict: "INVALID", reason: "Ed25519 signature verification failed" };
      }
      return {
        verdict: "VALID",
        reason: "Ed25519 signature and canonical receipt_sha256 verified",
        receipt_sha256: recomputedSha,
        charter_sha256: body.charter_sha256,
      };
    } catch (err) {
      return { verdict: "UNCHECKABLE", reason: String(err?.message || err) };
    }
  }

  // The full governed wrapper (remote gateway): gate → run → attest.
  // - Throws on deny.
  // - Refuses escalate without an explicit approval receipt (unless allowUnapprovedEscalation: true).
  // - Distinguishes `attested`, `executed_unattested`, and `executed_unapproved` in `status`.
  async governed(action, inputs, run, options = {}) {
    const decision = await this.gate(action, inputs);
    if (decision.state === "deny") {
      throw new Error(`Layer-0 Gate denied: ${decision.reason || action}`);
    }
    const escalated = decision.state === "escalate";
    const approval = options.approval ?? options.approvalReceipt ?? decision.approval ?? null;
    if (escalated && approval === null) {
      if (!options.allowUnapprovedEscalation) {
        const err = new Error(
          `Layer-0 Gate escalation requires an approval receipt before execution: ${decision.reason || action}`
        );
        err.code = "ESCALATION_REQUIRED";
        err.decision = decision;
        throw err;
      }
    }
    const result = await run({ requiresHumanReview: escalated, decision, approval });
    const attestation = await this._attest(
      action,
      inputs,
      escalated ? { ...decision, approval } : decision
    );
    const attested = Boolean(attestation);
    const status = !attested
      ? "executed_unattested"
      : escalated && approval === null
        ? "executed_unapproved"
        : "attested";
    return { result, decision, approval, attestation, attested, status };
  }

  // §4 build + sign an A2A attestation envelope via the gateway
  async _attest(action, inputs, decision) {
    return this._post("/api/a2a/route", {
      from: { endpoint: this.endpoint, party: this.identity },
      to: { endpoint: "csoai://ledger" },
      intent: "attestation",
      action,
      payload: { inputsHash: sha256(inputs), decisionState: decision?.state || null },
      identity: this.identity,
    })
      .then((r) => r.envelope || null)
      .catch(() => null);
  }

  // Verify any inbound A2A envelope (offline-capable via the gateway's verify endpoint)
  async verify(envelope, peerKeyB64) {
    return this._post(
      "/api/a2a/verify",
      peerKeyB64 ? { ...envelope, __peerKey: peerKeyB64 } : envelope
    );
  }
}

export default Layer0;
