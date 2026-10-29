// @csoai/layer0 — prototype Layer 0 + A2A gateway client.
// Gate check → callback → gateway attestation request. The host owns identity,
// execution isolation, effect binding and independent evidence verification.
//
// Usage:
//   import { Layer0 } from "@csoai/layer0";
//   const l0 = new Layer0({ base: process.env.CSOAI_API_BASE, identity: "did:csoai:acme" });
//   const { result, attestation } = await l0.governed("evidence.collect", inputs, () => doWork());
//
// Set CSOAI_API_BASE to a configured gateway. See APPROVAL-CONTRACT.md.

import crypto from "node:crypto";

const sha256 = (s) => "sha256:" + crypto.createHash("sha256").update(typeof s === "string" ? s : JSON.stringify(s)).digest("hex");

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
  constructor({ base = process.env.CSOAI_API_BASE || "https://api.csoai.org", identity, endpoint = "tool://local", verifyApproval } = {}) {
    this.base = base.replace(/\/$/, "");
    this.identity = identity;
    this.endpoint = endpoint;
    // Trusted host configuration, never an agent-supplied per-call option. The host
    // must authenticate the receipt and check scope, tenant, epoch, expiry and revocation.
    if (verifyApproval !== undefined && typeof verifyApproval !== "function") {
      throw new TypeError("verifyApproval must be a trusted host function");
    }
    this.verifyApproval = verifyApproval;
  }

  async _post(path, body) {
    const r = await fetch(this.base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`csoai gateway ${path} → ${r.status}`);
    return r.json();
  }

  // §3 Sovereign Gate decision
  async gate(action, inputs) {
    return this._post("/api/gate", { action, identity: this.identity, inputsHash: sha256(inputs) });
  }

  // The full governed wrapper: gate → run → attest.
  // Only explicit allow or a host-verified escalation can reach run(). This wrapper
  // cannot constrain an arbitrary callback's effects or an administrator of its host.
  // Cancellation is cooperative: once run() starts the executor must honour signal.
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
    stopIfAborted();
    const decision = await this.gate(action, inputs);
    if (!decision || typeof decision !== "object" || Array.isArray(decision) ||
        !["allow", "deny", "escalate"].includes(decision.state)) {
      const err = new Error("Sovereign Gate returned an unknown or malformed decision");
      err.code = "INVALID_GATE_DECISION";
      throw err;
    }
    if (decision.state === "deny") throw new Error(`Sovereign Gate denied: ${decision.reason || action}`);
    const escalated = decision.state === "escalate";
    const approval = options.approval ?? null;
    if (escalated) {
      if (!approval || typeof approval !== "object" || Array.isArray(approval)) {
        const err = new Error(`Sovereign Gate escalated ${action}: an approval receipt is required before execution`);
        err.code = "ESCALATION_REQUIRED";
        err.decision = decision;
        throw err;
      }
      if (!this.verifyApproval || await this.verifyApproval(approval, {
        action, inputsHash, identity: this.identity, endpoint: this.endpoint, decision,
      }) !== true) {
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
    stopIfAborted();
    let result;
    try {
      result = await run({ requiresHumanReview: escalated, decision, approval, signal });
    } catch (cause) {
      throw new Layer0ExecutionError(cause, { action, inputsHash, signal });
    }
    // Evidence-service failure cannot erase a callback result already obtained.
    // Preserve the same executed_unattested contract for custom transports too.
    let attestation = null;
    try { attestation = await this._attest(action, inputs, decision, inputsHash); }
    catch { /* The effect is retained below; no automatic retry or attestation. */ }
    const attested = Boolean(attestation);
    // Missing attestation is a distinct outcome, never a silent success.
    // An abort after dispatch must not erase a possibly completed effect.
    const status = attested ? "attested" : "executed_unattested";
    return { result, decision, attestation, attested, status,
      cancellationRequested: signal?.aborted === true };
  }

  // §4 build + sign an A2A attestation envelope via the gateway
  async _attest(action, inputs, decision, inputsHash = sha256(inputs)) {
    return this._post("/api/a2a/route", {
      from: { endpoint: this.endpoint, party: this.identity },
      to: { endpoint: "csoai://ledger" },
      intent: "attestation", action, payload: { inputsHash }, identity: this.identity,
    }).then((r) => r.envelope).catch(() => null);
  }

  // Verification via the configured gateway; this method needs that gateway to be reachable.
  async verify(envelope, peerKeyB64) {
    return this._post("/api/a2a/verify", peerKeyB64 ? { ...envelope, __peerKey: peerKeyB64 } : envelope);
  }
}

export default Layer0;

