// @csoai/layer0 — drop-in Layer 0 + Constitutional Harness + A2A adapter.
// Supports both:
//   1. Gateway mode (`gate`, `governed`, `verify`) for remote CSOAI A2A gateways.
//   2. Zero-dependency offline/local Constitutional Harness mode (`localConstitutionalPrecheck`,
//      `governedLocal`, `verifyLocalReceipt`), pinned to `/.well-known/constitutional-harness.json`
//      (v0.1.0 sha256: 3dcf79a7526785324ef15deaa40adabc5e77fbc99c4ebd089309d948c3c3e32e),
//      enforcing Controls CH-01..CH-16, Human-in-the-Loop (HITL) approval receipts, secret
//      minimization (CH-10), and Ed25519 effect-receipt signing (`node:crypto`).
//
// Configure host approval verification as described in APPROVAL-CONTRACT.md.
//
// LOCAL EXECUTION IS HELD. localConstitutionalPrecheck reports declared-input diagnostics, not
// authority. governedLocal is held until a trusted host executor and current authority verifier
// are integrated: a caller-supplied receipt or a self-generated key cannot qualify that executor
// or authorize an effect. verifyLocalReceipt checks covered bytes against the supplied key only.
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

// Fingerprint supported callback JSON, not arbitrary JavaScript objects or external
// artifact bytes. Do not invoke getters/toJSON or silently discard unsupported values.
function bindCallbackResult(value) {
  const seen = new Set(); let nodes = 0;
  const encode = (item, depth = 0) => {
    if (++nodes > 100000 || depth > 64) throw new Error("result limit");
    if (item === null || typeof item === "boolean" || typeof item === "string") return JSON.stringify(item);
    if (typeof item === "number" && Number.isFinite(item)) return JSON.stringify(item);
    if (!item || typeof item !== "object" || seen.has(item)) throw new Error("unsupported result");
    const array = Array.isArray(item), proto = Object.getPrototypeOf(item);
    if (!array && proto !== Object.prototype && proto !== null) throw new Error("unsupported result prototype");
    const descriptors = Object.getOwnPropertyDescriptors(item), keys = Reflect.ownKeys(descriptors);
    if (keys.some(k => typeof k !== "string" || !("value" in descriptors[k]) ||
      (!descriptors[k].enumerable && !(array && k === "length")))) throw new Error("unsupported result property");
    seen.add(item);
    let text;
    if (array) {
      if (keys.length !== item.length + 1) throw new Error("sparse or decorated result array");
      const parts = [];
      for (let i = 0; i < item.length; i++) {
        if (!Object.hasOwn(descriptors, String(i))) throw new Error("sparse result array");
        parts.push(encode(descriptors[i].value, depth + 1));
      }
      text = "[" + parts.join(",") + "]";
    } else {
      text = "{" + keys.sort().map(k => JSON.stringify(k) + ":" + encode(descriptors[k].value, depth + 1)).join(",") + "}";
    }
    seen.delete(item);
    if (Buffer.byteLength(text, "utf8") > 2000000) throw new Error("result byte limit");
    return text;
  };
  try {
    const text = encode(value);
    if (Buffer.byteLength(text, "utf8") > 2000000) throw new Error("result byte limit");
    return Object.freeze({ state: "HASHED", sha256: sha256(text), encoding: "L0_CANONICAL_JSON", scope: "CALLBACK_RESULT_ONLY" });
  } catch {
    return Object.freeze({ state: "UNCHECKABLE", sha256: null, encoding: null, scope: "CALLBACK_RESULT_ONLY" });
  }
}

// This is structural and echoed-binding validation ONLY. No response-provided key
// or claimed verified flag is trusted. Signature, issuer and actual effect remain
// separate, unperformed checks. Legacy `attested` means receipt, never verification.
function checkReturnedAttestation(envelope, expected, output) {
  const report = (state) => Object.freeze({ state,
    signatureVerification: "NOT_PERFORMED", issuerTrust: "NOT_ESTABLISHED",
    authorityVerified: false, independentEffect: "NOT_OBSERVED" });
  if (envelope === null || envelope === undefined) return report("NO_RECEIPT");
  try {
    const object = v => v !== null && typeof v === "object" && !Array.isArray(v);
    const strings = v => Array.isArray(v) && v.every(x => typeof x === "string");
    const t = envelope.ts;
    const time = typeof t === "string" && /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?Z$/.test(t) &&
      Number.isFinite(Date.parse(t)) && new Date(t).toISOString().slice(0, 10) === t.slice(0, 10);
    if (!object(envelope) || envelope.v !== "csoai.a2a/0.1" || typeof envelope.id !== "string" || !envelope.id || !time ||
      !object(envelope.from) || !object(envelope.to) || !object(envelope.payload) || !object(envelope.policy) ||
      !strings(envelope.policy.controls) || !strings(envelope.policy.conditions) ||
      !(envelope.policy.statutory_basis === null || typeof envelope.policy.statutory_basis === "string") ||
      !object(envelope.episode) || typeof envelope.episode.anchor !== "string" ||
      !object(envelope.sig) || envelope.sig.alg !== "Ed25519" || typeof envelope.sig.kid !== "string" || !envelope.sig.kid ||
      typeof envelope.sig.value !== "string" || !/^[A-Za-z0-9+/]{86}==$/.test(envelope.sig.value) ||
      Buffer.from(envelope.sig.value, "base64").toString("base64") !== envelope.sig.value) return report("MALFORMED_RECEIPT");
    if (envelope.intent !== "attestation" || envelope.action !== expected.action ||
      envelope.from.party !== expected.identity || envelope.from.endpoint !== expected.endpoint ||
      envelope.to.endpoint !== "csoai://ledger" || envelope.payload.inputsHash !== expected.inputsHash ||
      envelope.payload.decisionState !== expected.decisionState || envelope.policy.decision !== expected.decisionState)
      return report("REQUEST_BINDING_MISMATCH");
    if (output.state !== "HASHED") return report("OUTPUT_UNCHECKABLE");
    if (envelope.payload.outputsHash !== output.sha256 || envelope.payload.outputEncoding !== output.encoding)
      return report("OUTPUT_BINDING_MISMATCH");
    const { from, to, action, payload } = envelope;
    if (envelope.episode.hash !== sha256({ from, to, action, payload })) return report("EPISODE_DIGEST_MISMATCH");
    return report("RECEIVED_UNVERIFIED");
  } catch {
    return report("MALFORMED_RECEIPT");
  }
}

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

// A rejected callback may already have produced an effect. The wrapper cannot
// infer rollback or safe retry from its rejection. Preserve the original cause.
export class Layer0ExecutionError extends Error {
  constructor(cause, { action, inputsHash, signal }) {
    super("Execution callback failed; reconcile the effect before retrying", { cause });
    this.name = "Layer0ExecutionError";
    this.code = "EXECUTION_OUTCOME_UNKNOWN";
    this.status = "execution_outcome_unknown";
    this.callbackStarted = true;
    this.action = action;
    this.inputsHash = inputsHash;
    this.cancellationRequested = signal?.aborted === true;
  }
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
    verifyApproval,
  } = {}) {
    this.base = base.replace(/\/$/, "");
    this.identity = identity;
    this.tenantId = tenantId;
    this.harnessId = harnessId;
    this.endpoint = endpoint;
    this._fetch = fetchImpl;
    this._keyPair = keyPair;
    // Trusted host configuration, never an agent-supplied per-call option. The host
    // must authenticate the receipt and check scope, tenant, epoch, expiry and revocation.
    if (verifyApproval !== undefined && typeof verifyApproval !== "function") {
      throw new TypeError("verifyApproval must be a trusted host function");
    }
    this.verifyApproval = verifyApproval;
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
  // - Throws on deny, and on an unknown or malformed gate decision.
  // - Refuses escalate without an approval receipt AND a trusted host verifier. The
  //   legacy allowUnapprovedEscalation escape is deliberately gone: a receipt the host
  //   has not verified is not an approval.
  // - Distinguishes `attested`, `executed_unattested`, and `executed_unapproved` in `status`.
  // - Cancellation is cooperative: once run() starts the executor must honour signal.
  async governed(action, inputs, run, options = {}) {
    if (typeof run !== "function") throw new TypeError("run must be a function");
    // Bind the cancellation channel at admission; mutating options while an
    // authorization request is pending must not detach an existing cancellation.
    const signal = options.signal;
    const stopIfAborted = () => {
      if (signal?.aborted) {
        const err = new Error("Execution cancelled before dispatch");
        err.code = "EXECUTION_CANCELLED";
        throw err;
      }
    };
    const inputsHash = sha256(inputs);
    const identity = this.identity, endpoint = this.endpoint;
    stopIfAborted();
    const decision = await this.gate(action, inputs);
    if (!decision || typeof decision !== "object" || Array.isArray(decision) ||
        !["allow", "deny", "escalate"].includes(decision.state)) {
      const err = new Error("Layer-0 Gate returned an unknown or malformed decision");
      err.code = "INVALID_GATE_DECISION";
      throw err;
    }
    if (decision.state === "deny") {
      throw new Error(`Layer-0 Gate denied: ${decision.reason || action}`);
    }
    const escalated = decision.state === "escalate";
    const binding = Object.freeze({ action, inputsHash, identity, endpoint, decisionState: decision.state });
    const approval = options.approval ?? options.approvalReceipt ?? decision.approval ?? null;
    if (escalated) {
      if (!approval || typeof approval !== "object" || Array.isArray(approval)) {
        const err = new Error(
          `Layer-0 Gate escalation requires an approval receipt before execution: ${decision.reason || action}`
        );
        err.code = "ESCALATION_REQUIRED";
        err.decision = decision;
        throw err;
      }
      // Trusted host configuration, never an agent-supplied per-call option. The host
      // must authenticate the receipt and check scope, tenant, epoch, expiry and revocation.
      if (!this.verifyApproval ||
          (await this.verifyApproval(approval, {
            action, inputsHash, identity: this.identity, endpoint: this.endpoint, decision,
          })) !== true) {
        const err = new Error("Escalation approval was not verified by the trusted host");
        err.code = "APPROVAL_NOT_VERIFIED";
        throw err;
      }
    }
    if (sha256(inputs) !== inputsHash) {
      const err = new Error("Inputs changed after the authorization request");
      err.code = "AUTHORIZATION_INPUTS_CHANGED";
      throw err;
    }
    if (this.identity !== identity || this.endpoint !== endpoint) {
      const error = new Error("Attribution context changed after the authorization request");
      error.code = "AUTHORIZATION_CONTEXT_CHANGED";
      throw error;
    }
    stopIfAborted();
    let result;
    try {
      result = await run({ requiresHumanReview: escalated, decision, approval, signal });
    } catch (cause) {
      throw new Layer0ExecutionError(cause, { action, inputsHash, signal });
    }
    // Evidence-service failure cannot erase a callback result already obtained.
    // Preserve the same executed_unattested contract for custom transports too.
    const outputBinding = bindCallbackResult(result);
    let attestation = null;
    try {
      attestation = await this._attest(
        action,
        inputs,
        escalated ? { ...decision, approval } : decision,
        inputsHash,
        outputBinding,
        binding
      );
    } catch { /* The effect is retained below; no automatic retry or attestation. */ }
    let attestationCheck = checkReturnedAttestation(attestation, binding, outputBinding);
    // A mutable callback object may change while evidence retrieval is pending.
    // Retain it, but never label its earlier fingerprint as matching this result.
    if (outputBinding.state === "HASHED") {
      const returnedBinding = bindCallbackResult(result);
      if (returnedBinding.sha256 !== outputBinding.sha256) {
        attestationCheck = Object.freeze({ ...attestationCheck, state: "OUTPUT_CHANGED_AFTER_CAPTURE" });
      }
    }
    const attested = attestationCheck.state === "RECEIVED_UNVERIFIED";
    // Missing attestation is a distinct outcome, never a silent success.
    // An abort after dispatch must not erase a possibly completed effect.
    const status = !attested
      ? "executed_unattested"
      : escalated && approval === null
        ? "executed_unapproved"
        : "attested";
    return { result, decision, approval, attestation, attested, status,
      outputBinding, attestationCheck,
      cancellationRequested: signal?.aborted === true };
  }

  // §4 build + sign an A2A attestation envelope via the gateway
  async _attest(action, inputs, decision, inputsHash = sha256(inputs), outputBinding = null, binding = null) {
    const identity = binding ? binding.identity : this.identity;
    const endpoint = binding ? binding.endpoint : this.endpoint;
    return this._post("/api/a2a/route", {
      from: { endpoint, party: identity },
      to: { endpoint: "csoai://ledger" },
      intent: "attestation",
      action,
      payload: { inputsHash, decisionState: binding ? binding.decisionState : decision?.state || null,
        outputsHash: outputBinding?.sha256 ?? null, outputEncoding: outputBinding?.encoding ?? null },
      identity,
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
