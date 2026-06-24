// @csoai/layer0 — drop-in Layer 0 + A2A adapter.
// Wraps the CSOAI gateway (api-server) so any tool/MCP/package becomes governed:
// Sovereign Gate policy check → run → Ed25519-signed attestation → A2A envelope.
//
// Usage:
//   import { Layer0 } from "@csoai/layer0";
//   const l0 = new Layer0({ base: process.env.CSOAI_API_BASE, identity: "did:csoai:acme" });
//   const { result, attestation } = await l0.governed("evidence.collect", inputs, () => doWork());
//
// Set CSOAI_API_BASE to your gateway (e.g. https://api.csoai.org). No secrets needed client-side.

import crypto from "node:crypto";

const sha256 = (s) => "sha256:" + crypto.createHash("sha256").update(typeof s === "string" ? s : JSON.stringify(s)).digest("hex");

export class Layer0 {
  constructor({ base = process.env.CSOAI_API_BASE || "https://api.csoai.org", identity, endpoint = "tool://local" } = {}) {
    this.base = base.replace(/\/$/, "");
    this.identity = identity;
    this.endpoint = endpoint;
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

  // The full governed wrapper: gate → run → attest. Throws on deny; surfaces escalation.
  async governed(action, inputs, run) {
    const decision = await this.gate(action, inputs);
    if (decision.state === "deny") throw new Error(`Sovereign Gate denied: ${decision.reason || action}`);
    if (decision.state === "escalate") {
      // control G — caller decides how to obtain human approval; we attach the marker.
      const result = await run({ requiresHumanReview: true, decision });
      return { result, decision, attestation: await this._attest(action, inputs, decision) };
    }
    const result = await run({ decision });
    return { result, decision, attestation: await this._attest(action, inputs, decision) };
  }

  // §4 build + sign an A2A attestation envelope via the gateway
  async _attest(action, inputs, decision) {
    return this._post("/api/a2a/route", {
      from: { endpoint: this.endpoint, party: this.identity },
      to: { endpoint: "csoai://ledger" },
      intent: "attestation", action, payload: { inputsHash: sha256(inputs) }, identity: this.identity,
    }).then((r) => r.envelope).catch(() => null);
  }

  // Verify any inbound A2A envelope (offline-capable via the gateway's verify endpoint)
  async verify(envelope, peerKeyB64) {
    return this._post("/api/a2a/verify", peerKeyB64 ? { ...envelope, __peerKey: peerKeyB64 } : envelope);
  }
}

export default Layer0;
