/**
 * Joined specs — a pin list, not a monorepo.
 *
 * council-os doctrine: bind, don't migrate. The lockfile belongs at
 * council-os/registry/bindings.json when that lane fills SHAs. This file is the
 * SITE render of those pins so the embed kit can show a tiny footer instead of
 * 600 MCP tiles. We call their verifiers. We do not vendor their trees.
 *
 * Status is honest: live = we already ship it; pin = upstream we will call;
 * gated = no service yet; err = attempted and failed; reproduction = their
 * vectors under their rule; local-only = hackathon, not prod.
 */
export type JoinedKind =
  | "product"
  | "c2pa-manifest"
  | "ots"
  | "scitt-receipt"
  | "emilia"
  | "vaara"
  | "conarium"
  | "xrpl-credential"
  | "did-web"
  | "cose-wrap"
  | "otel-run";

export type JoinedStatus = "live" | "pin" | "gated" | "err" | "reproduction" | "local-only";

export type JoinedSpec = {
  name: string;
  uri: string;
  pin: string;
  license: string;
  kind: JoinedKind;
  preimage_rule: string;
  status: JoinedStatus;
  wire: string;
};

export const JOINED_SPECS: JoinedSpec[] = [
  {
    name: "Glass embed",
    uri: "https://councilof.ai/embed",
    pin: "this kit",
    license: "measurement licence",
    kind: "product",
    preimage_rule: "card-v1",
    status: "live",
    wire: "n-site spray: their origin loads our 3kb card + /badge",
  },
  {
    name: "C2PA",
    uri: "https://github.com/contentauth/c2pa-python",
    pin: "contentauth/c2pa-python",
    license: "Apache-2.0",
    kind: "c2pa-manifest",
    preimage_rule: "c2pa",
    status: "pin",
    wire: "Call c2pa-python. Do not vendor HMAC watermark forks.",
  },
  {
    name: "OpenTimestamps",
    uri: "https://github.com/opentimestamps/opentimestamps-client",
    pin: "opentimestamps-client",
    license: "LGPL-3.0",
    kind: "ots",
    preimage_rule: "ots-v1",
    status: "err",
    wire: "tsa.status: err until one published content_id is stamped",
  },
  {
    name: "SCITT / CCF",
    uri: "https://github.com/microsoft/scitt-ccf-ledger",
    pin: "pyscitt",
    license: "Apache-2.0",
    kind: "scitt-receipt",
    preimage_rule: "rfc9943",
    status: "gated",
    wire: "Talk to a TS when one exists. Not our log.",
  },
  {
    name: "SCITT emulator",
    uri: "https://github.com/scitt-community/scitt-api-emulator",
    pin: "scitt-api-emulator",
    license: "experiment",
    kind: "scitt-receipt",
    preimage_rule: "rfc9943",
    status: "local-only",
    wire: "Hackathon only. Not production.",
  },
  {
    name: "Emilia",
    uri: "https://github.com/emiliaprotocol/emilia-protocol",
    pin: "e507acdf",
    license: "Apache-2.0",
    kind: "emilia",
    preimage_rule: "ep-scitt-statement-identity-v0.1",
    status: "pin",
    wire: "Consume vectors at that SHA. Do not vendor main.",
  },
  {
    name: "Vaara",
    uri: "https://councilof.ai/gspc-verify",
    pin: "SEP-2828 vectors",
    license: "upstream",
    kind: "vaara",
    preimage_rule: "vaara.receipt/v1",
    status: "reproduction",
    wire: "Reproduction row. Their receipt stays theirs.",
  },
  {
    name: "Conarium",
    uri: "https://github.com/dogrucanemek-alt/conarium",
    pin: "conarium-v0.1",
    license: "MIT",
    kind: "conarium",
    preimage_rule: "conarium-v0.1",
    status: "pin",
    wire: "Read receipt schema. New verifier path, not card-v1.",
  },
  {
    name: "XRPL",
    uri: "https://github.com/XRPLF/xrpl.js",
    pin: "xrpl.js / xrpl-py",
    license: "ISC",
    kind: "xrpl-credential",
    preimage_rule: "xrpl-devnet-memo",
    status: "live",
    wire: "Read objects on /xrpl-attest. No grade mint.",
  },
  {
    name: "did:web",
    uri: "https://councilof.ai/.well-known/did.json",
    pin: "did:web:csoai.org",
    license: "published",
    kind: "did-web",
    preimage_rule: "did-web",
    status: "live",
    wire: "Xu DID draft stays draft. This document is the signer.",
  },
  {
    name: "COSE",
    uri: "https://github.com/TimothyClaeys/pycose",
    pin: "pycose",
    license: "BSD",
    kind: "cose-wrap",
    preimage_rule: "cose-wrap",
    status: "gated",
    wire: "Envelope of card bytes. Not a new card.",
  },
  {
    name: "OpenTelemetry",
    uri: "https://github.com/open-telemetry/opentelemetry-python",
    pin: "official OTEL SDK",
    license: "Apache-2.0",
    kind: "otel-run",
    preimage_rule: "otel-run",
    status: "gated",
    wire: "Spans of our harness. Not partner traces. Not on home.",
  },
];

export const JOINED_SPECS_LOCK = "council-os/registry/bindings.json";
