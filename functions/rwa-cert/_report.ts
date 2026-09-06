/**
 * The report an EAS attestation points at. DERIVED from two committed artifacts, joined by
 * contract address: the staged attestation batch and the on-chain control facts.
 *
 * WHY THIS EXISTS AND WHY IT READS THE WAY IT DOES. Three attestations are staged for on-chain
 * submission (BlackRock BUIDL, Franklin Templeton BENJI, Apollo ACRED). Each carries
 * report_uri = https://councilof.ai/rwa-cert/<slug>, and all three were 404. An EAS attestation
 * is written to a chain: submitting one whose report_uri is a 404 makes that 404 permanent and
 * immutable, against a named third party, under a doctrine line that says "NO issuer consent".
 * The payloads are already ed25519-signed, so the URI cannot be repointed without re-signing —
 * the page has to exist at the path the signature already names.
 *
 * WHAT THE PAGE MAY NOT DO. risk_tier on all three is "unmeasured". So the report states the
 * facts that ARE measured — four deterministic EVM control facts, recomputable by a stranger
 * from a public RPC — and refuses to imply anything else. It also names its own gap: the
 * attestation's verdict_sha256 does not resolve to any card published in this repository, so a
 * reader cannot recompute it today. Serving a page that quietly omitted that would be worse
 * than the 404 it replaces.
 *
 * The path says "rwa-cert". It is not a certificate and the page says so twice. The name is
 * fixed by a signature that already exists; the meaning is not.
 */
import batch from "../../public/interop/eas-attestation-batch.json";
import controls from "../../public/interop/evm-control-facts.json";

interface Att { recipient?: string; refUID?: string; data?: string }
interface Facts {
  instrument?: string; contract?: string;
  control_facts?: { status?: string; as_of?: string; rubric?: string; facts?: Record<string, unknown>;
                    decoded_name?: string; decimals?: number; coverage_rate?: number; n_facts?: number; wilson95?: number[] };
}

export function report(slug: string) {
  const atts = (batch as unknown as { attestations?: Att[] }).attestations || [];
  const hit = atts.find((a) => {
    try { return String(JSON.parse(a.data || "{}").report_uri || "").endsWith(`/rwa-cert/${slug}`); }
    catch { return false; }
  });
  if (!hit) return null;
  const payload = JSON.parse(hit.data || "{}");
  const rows = (controls as unknown as { measured?: Facts[] }).measured || [];
  const cf = rows.find((r) => String(r.contract || "").toLowerCase() === String(hit.recipient || "").toLowerCase()) || null;

  // The verdict hash the attestation carries: can a reader resolve it here? Today, no.
  const verdict = String(payload.verdict_sha256 || "");
  return {
    schema: "csoai.rwa-control-report/0.1",
    not_a_certificate:
      "This is not a certificate, a rating, an endorsement, or investment advice. It is a report of deterministic on-chain facts. The path contains the string 'rwa-cert' because an already-signed attestation names it; the name is fixed, the meaning is not.",
    asset: payload.asset ?? null,
    contract: hit.recipient ?? null,
    issuer_field_on_attestation: payload.issuer || null,
    risk_tier: payload.risk_tier ?? null,
    risk_tier_note:
      "UNMEASURED means no risk verdict exists. It is not a low rating, and it is not a pending one. Nothing on this page should be read as a view on the instrument.",
    consent: "Permissionless off-chain attestation. The issuer was not asked and has not consented. Measurement, not certification.",
    control_facts: cf?.control_facts ?? null,
    control_facts_note: cf
      ? "Deterministic EVM facts read from a public RPC and recomputable by anyone with the contract address. They describe the CONTRACT, not the fund, its reserves, or its risk."
      : "No control-facts row matched this contract address, so none are shown rather than any being inferred.",
    verdict_sha256: verdict || null,
    verdict_resolvable: false,
    verdict_note:
      "The staged attestation carries this verdict_sha256, and it does not resolve to any card published in this repository — a reader cannot recompute it from what we publish today. It is recorded here rather than omitted, because a report that hides the one number it cannot support is the reason a report is not trusted.",
    sources: {
      control_facts: "https://councilof.ai/interop/evm-control-facts.json",
      staged_attestation: "https://councilof.ai/interop/eas-attestation-batch.json",
      board: "https://councilof.ai/api/gspc",
      corrections: "https://councilof.ai/api/corrections",
    },
    verify_yourself: [
      "curl -s https://councilof.ai/interop/evm-control-facts.json | jq '.measured[] | select(.contract==\"" + (hit.recipient || "") + "\")'",
      "cast code " + (hit.recipient || "") + "   # the contract_deployed fact, from any public RPC",
    ],
    license: "CC-BY-4.0",
    publisher: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
  };
}

export const SLUGS = ["buidl", "benji", "acred"];
