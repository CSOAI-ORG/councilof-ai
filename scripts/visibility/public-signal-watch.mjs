// Evidence-limited outside visibility readback. No publication, promotion, payment, or endorsement.
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const ENDPOINTS = Object.freeze([
  { id: "hf_evidence", url: "https://huggingface.co/api/datasets/csoai/councilof-ai-evidence", kind: "PLATFORM_DOWNLOAD_COUNTER" },
  { id: "footprint", url: "https://councilof.ai/api/footprint", kind: "OWNER_REPORTED_FUNNEL" },
  { id: "institutions", url: "https://councilof.ai/api/institutions", kind: "LIVE_ROUTE_CHECK" },
  { id: "investors", url: "https://councilof.ai/investors", kind: "LIVE_ROUTE_CHECK" },
  { id: "w3c_fixtures", url: "https://api.github.com/repos/w3c-cg/aikr/pulls/25", kind: "EXTERNAL_REPOSITORY_EVENT" },
  { id: "external_mcp_monitor", url: "https://mcpcheckup.com/check/csoai-org/gspc", kind: "EXTERNAL_TECHNICAL_OBSERVATION" },
  { id: "directory_flag", url: "https://themcpindex.com/flagged", kind: "EXTERNAL_REPUTATIONAL_ALLEGATION" }
]);
const nOrNull = (v) => Number.isSafeInteger(v) && v >= 0 ? v : null;

export function interpret(source, status, body) {
  if (status !== 200) return { state: "UNAVAILABLE", evidence: null, limitation: "Route unavailable; absence is not zero." };
  try {
    if (source.id === "hf_evidence") {
      const d = JSON.parse(body);
      if (d.id !== "csoai/councilof-ai-evidence") throw Error("dataset mismatch");
      return { state: "OBSERVED", evidence: { downloads: nOrNull(d.downloads), likes: nOrNull(d.likes), revision: d.sha ?? null, last_modified: d.lastModified ?? null },
        limitation: "Platform download metric, NOT unique people, active integrations, or customer adoption." };
    }
    if (source.id === "footprint") {
      const d = JSON.parse(body);
      if (d.schema !== "csoai.footprint/0.1" || typeof d.funnel?.rule !== "string") throw Error("unknown footprint schema");
      const stages = {};
      for (const field of ["registry_listings", "gross_distribution", "qualified_distribution", "observed_execution", "economic_use", "repeat_payers", "institutional_use"]) {
        const s = d[field];
        if (!s || !["READ", "UNMEASURED", "UNPUBLISHED", "STALE"].includes(s.state)) throw Error("unknown stage: " + field);
        stages[field] = { state: s.state, value: s.state === "READ" ? nOrNull(s.value) : null, unit: s.unit ?? null, as_of: s.as_of ?? null, limitation: s.reason ?? null };
        if (s.state === "READ" && stages[field].value === null) throw Error("invalid value: " + field);
      }
      return { state: "OBSERVED", evidence: { stages, source_as_of: d.as_of ?? null }, limitation: "Seven different populations; never sum or infer buyers from earlier stages." };
    }
    if (source.id === "institutions" || source.id === "investors")
      return { state: "LIVE_HTTP_200", evidence: { route_http_200: true }, limitation: "HTTP availability does not establish conversion or buyer acceptance." };
    if (source.id === "w3c_fixtures") {
      const d = JSON.parse(body);
      if (d.number !== 25 || d.base?.repo?.full_name !== "w3c-cg/aikr") throw Error("PR identity mismatch");
      return { state: "OBSERVED", evidence: { merged_at: d.merged_at ?? null, state: d.state ?? null }, limitation: "Community Group repo merge, not a W3C Recommendation or customer adoption." };
    }
    if (source.id === "external_mcp_monitor")
      return { state: "OBSERVED", evidence: { server_named: /csoai-org\/gspc|Council of AI GSPC/i.test(body), monitor_30_of_30: /30 of 30 counted days/i.test(body), tools_54: /54 tools observed/i.test(body) },
        limitation: "External availability observation; not independent buyers or integrations." };
    if (source.id === "directory_flag")
      return { state: "OBSERVED", evidence: { mentions_operator: /MEOK AI Labs\s*\/\s*CSOAI/i.test(body), mentions_self_issued_badge: /self-issued trust signal/i.test(body), sample_listed: /io\.github\.CSOAI-ORG\/regex-ai-mcp/i.test(body) },
        limitation: "Unverified third-party allegation; check actual code and badge issuer. Do not publish as a verdict." };
    throw Error("unknown source");
  } catch (err) {
    return { state: "UNPARSEABLE", evidence: null, limitation: String(err?.message ?? err) };
  }
}

export async function capture({ fetcher = fetch, at = new Date().toISOString() } = {}) {
  const results = [];
  for (const source of ENDPOINTS) {
    try {
      const response = await fetcher(source.url, {
        headers: { "User-Agent": "CSOAI-public-signal-watch/0.1 (+https://councilof.ai)", Accept: "application/json, text/html;q=0.8" },
        signal: AbortSignal.timeout(12000)
      });
      const body = await response.text();
      if (Buffer.byteLength(body) > 5_000_000) throw Error("source body exceeds read limit");
      results.push({ ...source, http_status: response.status, content_sha256: createHash("sha256").update(body).digest("hex"), ...interpret(source, response.status, body) });
    } catch (error) {
      results.push({ ...source, state: "UNAVAILABLE", http_status: null, content_sha256: null, evidence: null,
        limitation: "Fetch failure; do not infer zero or remove an earlier reference.", diagnostic: String(error?.name ?? "fetch-error") });
    }
  }
  return { schema: "csoai.public-signal-watch/0.1", captured_at: at, publication_state: "UNSIGNED_RESEARCH_CAPTURE_NOT_ADMITTED",
    all_sources_owner_verified: false, buyers_inferred_from_downloads: false, external_endorsement_claimed: false, sources: results };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const out = process.argv.indexOf("--out");
  const data = JSON.stringify(await capture(), null, 2) + "\n";
  if (out >= 0 && process.argv[out + 1]) writeFileSync(process.argv[out + 1], data);
  else process.stdout.write(data);
}
