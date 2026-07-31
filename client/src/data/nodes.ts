/**
 * nodes — the connected-node registry rendered on the jurisdiction globe.
 *
 * Every node is an institution the instrument is verifiably connected to,
 * placed at jurisdiction resolution (GL1: jurisdiction-level only, never
 * personal, never IP-derived). Live status is merged at render time from
 * data/anchors.ts — the same registry the /gspc-anchors page reads, so the
 * globe can never disagree with it.
 *
 * Status vocabulary follows the anchor registry: live | degraded |
 * unreachable. A node absent from the registry renders hollow (status
 * unknown) — never silently upgraded. Node ids match anchor ids exactly.
 */

import type { Jurisdiction } from "./anchors";

export interface ConnectedNode {
  /** Matches the anchor registry id when the node is watcher-backed. */
  id: string;
  name: string;
  jurisdiction: Jurisdiction;
  kind: "statute" | "standard" | "registry" | "operator";
}

export const CONNECTED_NODES: ConnectedNode[] = [
  { id: "UK-legislation", name: "UK legislation.gov.uk", jurisdiction: "UK", kind: "statute" },
  { id: "Crosswalk-registry", name: "Crosswalk registry (self-hosted)", jurisdiction: "UK", kind: "operator" },
  { id: "EU-CELLAR", name: "EUR-Lex / CELLAR (EU AI Act)", jurisdiction: "EU", kind: "statute" },
  { id: "C2PA-spec", name: "C2PA 2.4 specification", jurisdiction: "US", kind: "standard" },
  { id: "RFC-9964", name: "RFC 9964 (PQC for IETF)", jurisdiction: "US", kind: "standard" },
  { id: "NIST-IR8547", name: "NIST IR 8547 (PQC transition)", jurisdiction: "US", kind: "standard" },
];
