// @csoai/layer0 — gateway adapter and experimental local diagnostics.
// localConstitutionalPrecheck reports declared-input diagnostics, not authority.
// governedLocal is held until a trusted host executor and current authority
// verifier are integrated. A caller-supplied receipt or a self-generated key
// cannot qualify that executor or authorize an effect.
// verifyLocalReceipt checks covered bytes against the supplied key only.
// Measurement, never certification.

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

  // Local input diagnostics only. An allow result is not execution authority.
  localConstitutionalPrecheck(action, inputs = {}, context = {}) {
    const reasons = [];
    const controlsChecked = ["CH-01", "CH-02", "CH-03", "CH-04", "CH-10", "CH-13"];

    // Declared identity presence only; this does not authenticate a principal.
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

  // Local diagnostics do not authorize an arbitrary callback. Keep this route
  // held until a separately reviewed host integration supplies current identity,
  // tenant/resource scope, expiry, replay, revocation, budget and effect controls.
  // No per-call option, typed name or signature can bypass this admission hold.
  async governedLocal(action, inputs, run, options = {}) {
    const decision = this.localConstitutionalPrecheck(action, inputs, options);
    if (decision.state === "deny") {
      throw new Error(`Layer-0 Gate denied: ${decision.reason || action}`);
    }
    const error = new Error("Local executor is not qualified; diagnostics and supplied receipts grant no execution authority");
    error.code = "LOCAL_EXECUTOR_NOT_QUALIFIED";
    error.decision = decision;
    throw error;
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
        reason: "Ed25519 signature and canonical digest verified against the supplied key; signer trust and human authority were not checked",
        verification_scope: "SUPPLIED_KEY_SIGNATURE_ONLY",
        authority_verified: false,
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
    if (decision.state === "escalate") {
      const approval = options.approvalReceipt || decision.approval || null;
      if (!approval && !options.allowUnapprovedEscalation) {
        throw new Error(
          `Layer-0 Gate escalation requires an approval receipt before execution: ${decision.reason || action}`
        );
      }
      const result = await run({ requiresHumanReview: true, decision, approval });
      const attestation = await this._attest(action, inputs, { ...decision, approval });
      const status = !approval
        ? "executed_unapproved"
        : attestation
          ? "attested"
          : "executed_unattested";
      return { status, result, decision, approval, attestation };
    }
    const result = await run({ decision });
    const attestation = await this._attest(action, inputs, decision);
    const status = attestation ? "attested" : "executed_unattested";
    return { status, result, decision, attestation };
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

