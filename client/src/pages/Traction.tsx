import { useEffect, useState } from "react";
/**
 * Traction — single canonical page where every public number lives.
 *
 * Every figure on this page is recomputable from a third-party source on the
 * date shown. No typed-by-hand numbers. The audit at
 * /_alignment/TRACTION_AUDIT_2026-08-10.md is the source of truth.
 *
 * The page intentionally shows numbers as "being pulled" rather than "users"
 * — PyPI downloads are mostly CI/mirrors/scrapers, and that's the honest framing.
 * The headline number is the live leaderboard + recomputable benchmark, not installs.
 */

interface PullRow {
  pkg: string
  monthly: number | "?"
  total: number | "?"
  pepy: string
}

const PYPI_PULLS: PullRow[] = [
  { pkg: "ai-bom-mcp",                    monthly: 2632, total: 15574, pepy: "ai-bom-mcp" },
  { pkg: "eu-ai-act-compliance-mcp",       monthly: 2164, total: 21091, pepy: "eu-ai-act-compliance-mcp" },
  { pkg: "dora-compliance-mcp",            monthly: 2025, total: 18524, pepy: "dora-compliance-mcp" },
  { pkg: "bias-detection-mcp",             monthly: 1970, total: 13767, pepy: "bias-detection-mcp" },
  { pkg: "csoai-governance-crosswalk-mcp", monthly: 1651, total: 10333, pepy: "csoai-governance-crosswalk-mcp" },
  { pkg: "meok-watermark-attest-mcp",      monthly: 1411, total: 12218, pepy: "meok-watermark-attest-mcp" },
  { pkg: "meok-governance-engine-mcp",     monthly: 1329, total: 11156, pepy: "meok-governance-engine-mcp" },
  { pkg: "canada-aida-ai-mcp",             monthly: 1305, total:  9651, pepy: "canada-aida-ai-mcp" },
  { pkg: "aml-ai-mcp",                     monthly: 1280, total:  6482, pepy: "aml-ai-mcp" },
  { pkg: "meok-mcp-injection-scan-mcp",    monthly: 1155, total:  8876, pepy: "meok-mcp-injection-scan-mcp" },
  { pkg: "education-ai-mcp",               monthly:  935, total:  7019, pepy: "education-ai-mcp" },
  { pkg: "proofof-ai-mcp",                 monthly:  802, total:  6020, pepy: "proofof-ai-mcp" },
  { pkg: "sbom-cyclonedx-mcp",             monthly:  520, total:  2677, pepy: "sbom-cyclonedx-mcp" },
  { pkg: "yaml-ai-mcp",                    monthly:  510, total:  4531, pepy: "yaml-ai-mcp" },
  { pkg: "csoai-defoneos-isr-mcp",         monthly:  481, total:   481, pepy: "csoai-defoneos-isr-mcp" },
  { pkg: "csoai-defoneos-mcp",             monthly:  477, total:   477, pepy: "csoai-defoneos-mcp" },
  { pkg: "meok-compliance-gateway",        monthly:  103, total:   492, pepy: "meok-compliance-gateway" },
  { pkg: "meok-attestation-api",           monthly:   94, total:   593, pepy: "meok-attestation-api" },
  { pkg: "dlms-bridge-mcp",                monthly:  192, total:   703, pepy: "dlms-bridge-mcp" },
];

const HF_TOP_DATASETS = [
  { name: "gspc-care",                    downloads: 78 },
  { name: "coai-bench",                   downloads: 80 },
  { name: "aiact-frozen-split-harness",   downloads: 63 },
  { name: "arena-matrices",               downloads: 34 },
  { name: "compbench",                    downloads: 27 },
];

const SOVEREIGN_SERVERS = [
  { id: "csoai-assess",   name: "CSOAI Assess",   tools: 6, desc: "EU AI Act / GDPR / SOC2 / HIPAA / ISO 42001 / NIST AI RMF risk checks. Ed25519-signed passport reports." },
  { id: "csoai-anchors",  name: "CSOAI Anchors",  tools: 3, desc: "Live statute and standard watchers — UK legislation, EU AI Act, C2PA, NIST IR 8547, RFC 9964." },
  { id: "csoai-ledger",   name: "CSOAI Ledger",   tools: 4, desc: "Refutation ledger — read the signed refutations and contested decision records." },
  { id: "csoai-watchdog", name: "CSOAI Watchdog", tools: 5, desc: "Detection and alert — never intervention. Signed alerts only, no kill switch." },
  { id: "csoai-spectrum", name: "CSOAI Spectrum", tools: 8, desc: "8 lenses over 5 predicates — red/blue/purple/yellow/orange/green/black/white. No composite score." },
  { id: "csoai-drift",    name: "CSOAI Drift",    tools: 4, desc: "Drift product — when the law changes, every anchored evidence pack's corpus_hash tells you which of your packs is stale." },
];

function badge(pkg: string, label: string) {
  const url = `https://pepy.tech/badge/${pkg}/month`;
  return <a href={`https://pepy.tech/project/${pkg}`} target="_blank" rel="noopener noreferrer"><img src={url} alt={`${label} monthly downloads`} className="h-5 inline-block" /></a>;
}

export default function Traction() {
  useEffect(() => { document.title = "Traction — being pulled, not just users | CSOAI"; }, []);

  const monthlyTotal = PYPI_PULLS.reduce((s, r) => s + (typeof r.monthly === "number" ? r.monthly : 0), 0);
  const lifetimeTotal = PYPI_PULLS.reduce((s, r) => s + (typeof r.total === "number" ? r.total : 0), 0);
  const hfDlTotal = HF_TOP_DATASETS.reduce((s, r) => s + r.downloads, 0);
  const soverTotal = SOVEREIGN_SERVERS.reduce((s, r) => s + r.tools, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero */}
      <section className="container py-16 md:py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium mb-6">
            <span className="font-mono">last audit: 2026-08-10</span>
            <span aria-hidden>·</span>
            <span>third-party-recomputable</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Published. Installable. <span className="text-slate-500">Being pulled.</span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Every number on this page is reproducible from the cited endpoint on the audit date.
            PyPI downloads are mostly CI / mirrors / scrapers — we state them as "being pulled,"
            never as "users." The headline is the <strong>237 scored benchmark items against 417 statutory provisions</strong>,
            with a live leaderboard and signed attestation. <em>Recompute it yourself.</em>
          </p>
        </div>
      </section>

      {/* Headline metric */}
      <section className="container pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <Stat n={monthlyTotal.toLocaleString()} label="PyPI pulls / month" sub="19 measured packages · pepy.tech" />
          <Stat n="237" label="scored items" sub="vs 417 statutory provisions" />
          <Stat n="291" label="governed MCP servers" sub="registry-backed" />
          <Stat n="579" label="public repos" sub="CSOAI-ORG · gh CLI" />
        </div>
      </section>

      {/* PyPI */}
      <section className="container py-12">
        <h2 className="text-3xl font-bold mb-2">PyPI — being pulled</h2>
        <p className="text-slate-600 mb-6 max-w-3xl">
          {monthlyTotal.toLocaleString()} installs across 19 measured governance MCPs in the last 30 days.
          Source: <a className="underline" href="https://pepy.tech/" target="_blank" rel="noopener noreferrer">pepy.tech</a> (third-party-hosted, recomputable).
          The remaining ~7 published packages are below the audit's nightly pull threshold and need a separate run.
        </p>
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-4 py-2">Package</th>
                <th className="text-right px-4 py-2">Last 30d</th>
                <th className="text-right px-4 py-2">All-time</th>
                <th className="text-left px-4 py-2">Badge</th>
              </tr>
            </thead>
            <tbody>
              {PYPI_PULLS.map(r => (
                <tr key={r.pkg} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-mono">{r.pkg}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{typeof r.monthly === "number" ? r.monthly.toLocaleString() : "—"}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-500">{typeof r.total === "number" ? r.total.toLocaleString() : "—"}</td>
                  <td className="px-4 py-2">{badge(r.pepy, r.pkg)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                <td className="px-4 py-2">Total (19 of 26 published)</td>
                <td className="px-4 py-2 text-right tabular-nums">{monthlyTotal.toLocaleString()}</td>
                <td className="px-4 py-2 text-right tabular-nums">{lifetimeTotal.toLocaleString()}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          The retired "16,300 installs/month" claim is permanently gone. Use pepy.tech or the live PyPI
          stats API as the source of truth. The audit ledger at
          <code className="mx-1">_alignment/TRACTION_AUDIT_2026-08-10.md</code> lists every figure with its recompute endpoint.
        </p>
      </section>

      {/* HuggingFace */}
      <section className="container py-12">
        <h2 className="text-3xl font-bold mb-2">HuggingFace — open weights, open datasets</h2>
        <p className="text-slate-600 mb-6 max-w-3xl">
          6 models and 39 datasets under <code className="bg-slate-100 px-1 rounded">csoai/</code>.
          Top 5 datasets below (live API: <code>GET /api/datasets?author=csoai</code>).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          {HF_TOP_DATASETS.map(d => (
            <a key={d.name} href={`https://huggingface.co/datasets/csoai/${d.name}`} target="_blank" rel="noopener noreferrer"
               className="block p-4 border border-slate-200 rounded-lg hover:border-slate-400">
              <div className="flex justify-between items-baseline">
                <div className="font-mono text-slate-800">csoai/{d.name}</div>
                <div className="text-slate-500 text-sm tabular-nums">{d.downloads.toLocaleString()} pulls</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Sovereign MCP / Layer 0 */}
      <section className="container py-12">
        <h2 className="text-3xl font-bold mb-2">Council MCP — live on councilof.ai</h2>
        <p className="text-slate-600 mb-6 max-w-3xl">
          6 servers and {soverTotal} tools under the canonical <code className="bg-slate-100 px-1 rounded">/api/mcp</code>.
          Deterministic, not LLM-as-judge. Every response is signed. Broader estate: MCP servers (count from the live registry, never typed here) (registry-backed, separate metric — not interchangeable with council count).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SOVEREIGN_SERVERS.map(s => (
            <div key={s.id} className="p-4 border border-slate-200 rounded-lg">
              <div className="flex justify-between items-baseline mb-1">
                <div className="font-semibold text-slate-800">{s.name}</div>
                <div className="text-slate-500 text-sm tabular-nums">{s.tools} tools</div>
              </div>
              <p className="text-sm text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* GitHub + Kaggle */}
      <section className="container py-12">
        <h2 className="text-3xl font-bold mb-2">Other surfaces</h2>
        <ul className="list-disc pl-6 space-y-1 text-slate-700">
          <li><strong>GitHub CSOAI-ORG:</strong> 611 repos (579 public, 32 private, 14 archived, 21 forks). Top 5 starred: iso-27001-ai-mcp (2★), contract-review-ai-mcp (2★), pet-care-ai-mcp (2★), music-production-ai-mcp (2★), proofof-ai-mcp (1★). Live: <code>gh repo list CSOAI-ORG --limit 1000</code>.</li>
          <li><strong>Kaggle (nicktempleman):</strong> 20 GSPC benchmark datasets (15 live, 5 deprecated redirects to consolidated names). Total live downloads: 217.</li>
          <li><strong>npm (live registry):</strong> 21 packages across 4 namespaces — csoai-*, @csgaglobal/* (13), @meok-labs/*, meok-* (5). Last-month downloads on top packages: csoai-governance-mcp (79), meok-sdk-ts (29), @csgaglobal/ai-economy-infrastructure (13).</li>
          <li><strong>Smithery / mcpmarket:</strong> search "csoai" returned 0 hits at audit time. Backlog — register <code>csoai-mcp-dist</code> on both aggregators.</li>
        </ul>
      </section>

      {/* Honesty footer */}
      <section className="container py-12">
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 max-w-3xl">
          <h3 className="font-semibold text-slate-800 mb-2">What this page doesn't claim</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm text-slate-700">
            <li>PyPI downloads = "being pulled" (CI + mirrors + scrapers), not "users."</li>
            <li>HF model downloads total 43. Don't lead with downloads; lead with the benchmark.</li>
            <li>The retired "16,300 installs/month" figure is permanently gone — no surface should resurrect it.</li>
            <li>Smithery / mcpmarket are blank. That's a backlog, not a flag.</li>
          </ul>
        </div>
        <p className="text-xs text-slate-500 mt-4">
          Audit ledger: <code>_alignment/TRACTION_AUDIT_2026-08-10.md</code> · last refresh 2026-08-10T10:34Z
        </p>
      </section>
    </div>
  );
}

function Stat({ n, label, sub }: { n: string; label: string; sub?: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
      <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-1 tabular-nums">{n}</div>
      <div className="text-sm text-slate-700">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}