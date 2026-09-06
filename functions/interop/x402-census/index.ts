/**
 * GET /interop/x402-census/ — the buyer's-eye x402 settlement census, as a time series.
 *
 * WHAT THIS SURFACE IS. Every conformant host in a fixed population is paid once per round, as an
 * ordinary buyer, from a wallet we control, and what came back is recorded. The Bazaar indexes
 * answer "does this host exist and did money move"; none of them answers "did the thing arrive",
 * and a listing does not move when a host stops answering paid requests. The rounds are diffed, and
 * the diff is the artefact.
 *
 * WHAT IT IS NOT. Not a ranking, a recommendation, a certification or an accusation. REFUSED is not
 * proof of bad faith — rate limits, account requirements and changed terms are indistinguishable
 * from outside. No per-host state above UNMEASURED is published below 30 paid observations, and
 * since one accrues per round, the ladder is rendered numerically on this page rather than left for
 * a reader to work out. Nothing this estate sells appears here: no prices, no tiers, no processors.
 *
 * DERIVED. Every number is read from public/interop/x402-census/index.json, produced by
 * scripts/grants/x402_census_round.py from the committed rows and gated by --check in CI. This page
 * types no count of its own, so it cannot outlive the artefact it describes.
 */
import index from "../../../public/interop/x402-census/index.json";

const SITE = "https://councilof.ai";
const HF = "https://huggingface.co/datasets/csoai/x402-settlement-census";
const GH = "https://github.com/CSOAI-ORG/councilof-ai";

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

interface Round {
  round_id: string; as_of: string | null; probed: number; paid_rows: number;
  outcome: Record<string, number>; take_and_refuse: number; spend_usdc: number;
  hosts_sha256: string; leaves_staged: number | null; url: string;
}
interface Delta {
  id: string; from_round: string; to_round: string; as_of: string | null; common_hosts: number;
  flipped: number; delivered_to_refused: number; refused_to_delivered: number;
  price_drift_hosts: number; pay_to_changed: number; take_and_refuse_persisted: number;
  dropped: number; added: number; url: string;
}
interface Ladder {
  rule: string; n_required: number; rounds_so_far: number; hosts_observed: number;
  hosts_by_observations: Record<string, number>; hosts_at_or_above_n_required: number;
  weeks_to_n_required_at_weekly_cadence: number; note: string;
}
interface Index {
  schema: string; as_of: string | null; what_this_is: string;
  rounds: Round[]; deltas: Delta[]; ladder: Ladder;
  cadence: { target: string; population_rule: string };
  caveats: string[];
  feeds: { rss: string; hf: string; verify: string };
}

/** The two numbers a buyer sees first, derived from the newest round — never typed. */
export function headline(idx: Index): { probed: number | null; refused: number | null; refused_pct: number | null; round_id: string | null } {
  const r = idx.rounds?.[0];
  if (!r) return { probed: null, refused: null, refused_pct: null, round_id: null };
  const refused = r.outcome?.REFUSED ?? null;
  return {
    probed: r.probed,
    refused,
    refused_pct: refused !== null && r.probed ? Math.round((refused / r.probed) * 1000) / 10 : null,
    round_id: r.round_id,
  };
}

export const onRequestGet: PagesFunction = async (ctx) => {
  const idx = index as unknown as Index;
  const h = headline(idx);
  const rounds = idx.rounds || [];
  const deltas = idx.deltas || [];

  if ((ctx.request.headers.get("accept") || "").includes("application/json")) {
    return new Response(
      JSON.stringify(
        {
          schema: "csoai.x402-census-surface/0.1",
          headline: h,
          index: `${SITE}/interop/x402-census/index.json`,
          rounds: rounds.map((r) => r.url),
          deltas: deltas.map((d) => d.url),
          feed: idx.feeds?.rss,
          dataset: HF,
          producers: [
            "scripts/grants/x402_census_round.py --check",
            "scripts/grants/x402_census_delta.py --check",
            "harness/x402-census/build_cards.py --check",
          ],
          derived_from: idx,
        },
        null,
        2,
      ),
      { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" } },
    );
  }

  const roundRows = rounds
    .map((r) => {
      const o = r.outcome || {};
      return `<tr><td><a href="${esc(r.url)}"><code>${esc(r.round_id)}</code></a></td><td>${esc(r.as_of)}</td>
<td>${r.probed}</td><td>${o.DELIVERED ?? 0}</td><td>${o.REFUSED ?? 0}</td><td>${o.MISMATCH ?? 0}</td>
<td>${o.NO_CHALLENGE ?? 0}</td><td>${r.take_and_refuse}</td><td>${r.spend_usdc}</td>
<td>${r.leaves_staged === null ? '<span class="u">none staged</span>' : r.leaves_staged}</td></tr>`;
    })
    .join("\n");

  const deltaBlock = deltas.length
    ? `<table><thead><tr><th>delta</th><th>common</th><th>flipped</th><th>D→R</th><th>R→D</th><th>price drift</th><th>payTo changed</th><th>took &amp; refused (persisted)</th><th>added</th><th>dropped</th></tr></thead><tbody>
${deltas
  .map(
    (d) =>
      `<tr><td><a href="${esc(d.url)}"><code>${esc(d.id)}</code></a></td><td>${d.common_hosts}</td><td><strong>${d.flipped}</strong></td>
<td>${d.delivered_to_refused}</td><td>${d.refused_to_delivered}</td><td>${d.price_drift_hosts}</td><td>${d.pay_to_changed}</td>
<td>${d.take_and_refuse_persisted}</td><td>${d.added}</td><td>${d.dropped}</td></tr>`,
  )
  .join("\n")}
</tbody></table>`
    : `<p class="u">No delta yet: ${rounds.length} round on file and a delta needs two. An empty table here would read as
&ldquo;nothing changed&rdquo;, which is a different claim from &ldquo;nothing has been compared&rdquo;. The next round is what makes this a series.</p>`;

  const ladder = idx.ladder;
  const ladderRows = Object.entries(ladder?.hosts_by_observations || {})
    .map(([n, hosts]) => `<tr><td>${esc(n)}</td><td>${hosts}</td></tr>`)
    .join("\n");

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>x402 settlement census — what hosts actually deliver</title>
<meta name="description" content="A fixed population of conformant x402 hosts, each paid once per round as an ordinary buyer, with the outcome recorded and the rounds diffed. Derived, signed, rooted and witnessed. Measurement, not certification.">
<link rel="canonical" href="${SITE}/interop/x402-census/">
<link rel="alternate" type="application/rss+xml" title="x402 settlement census" href="${SITE}/feeds/x402-census.xml">
<style>
:root{color-scheme:light dark;--fg:#111;--bg:#fff;--mut:#555;--line:#e5e5e5;--pre:#f6f6f6;--u:#b45309}
@media(prefers-color-scheme:dark){:root{--fg:#e9e9e9;--bg:#0f1115;--mut:#a2a2a2;--line:#262a31;--pre:#171a20;--u:#f59e0b}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:56rem;margin:0 auto;padding:2.5rem 1.25rem 4rem}
h1{font-size:1.7rem;margin:0 0 .3rem}h2{margin:2.2rem 0 .5rem;font-size:1.05rem;border-bottom:1px solid var(--line);padding-bottom:.3rem}
.mut{color:var(--mut);font-size:.9rem}.u{color:var(--u)}
.lede{font-size:1.15rem;margin:1rem 0 .3rem}
.big{font-size:2.1rem;font-weight:600;line-height:1.1}
.two{display:flex;gap:2.5rem;flex-wrap:wrap;margin:1.2rem 0 .5rem}
.two div{min-width:12rem}
table{border-collapse:collapse;width:100%;font-size:.87rem;margin:.6rem 0}
.scroll{overflow-x:auto}
th,td{border-bottom:1px solid var(--line);padding:.35rem .5rem;text-align:left;white-space:nowrap}
pre{background:var(--pre);border:1px solid var(--line);border-radius:6px;padding:.6rem .7rem;overflow-x:auto;font-size:.82rem}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
ul{padding-left:1.1rem}
a{color:inherit}
</style></head><body><main>
<h1>x402 settlement census</h1>
<p class="mut">What conformant x402 hosts do when an ordinary buyer actually pays them — round by round, and diffed.</p>

<div class="two">
  <div><div class="big">${h.refused ?? "—"}</div><div class="mut">hosts REFUSED a correctly-signed payment${h.refused_pct !== null ? ` (${h.refused_pct}%)` : ""}</div></div>
  <div><div class="big">${h.probed ?? "—"}</div><div class="mut">conformant hosts paid once each, round <code>${esc(h.round_id ?? "—")}</code></div></div>
</div>
<p class="mut">Both numbers are read from <a href="/interop/x402-census/index.json">index.json</a>, which is produced from the round&rsquo;s own rows and re-checked in CI. This page types no count of its own.</p>

<p class="lede">${esc(idx.what_this_is)}</p>

<h2>Rounds</h2>
<div class="scroll"><table><thead><tr><th>round</th><th>as_of</th><th>probed</th><th>DELIVERED</th><th>REFUSED</th><th>MISMATCH</th><th>NO_CHALLENGE</th><th>took &amp; refused</th><th>USDC spent</th><th>leaves staged</th></tr></thead>
<tbody>${roundRows}</tbody></table></div>
<p class="mut"><strong>took &amp; refused</strong> = the host reported a settlement transaction in its own <code>PAYMENT-RESPONSE</code> and answered the retried request 402/4xx anyway. Every tx hash is in the rows, so a reader checks the chain rather than taking our word. <strong>USDC spent</strong> is our cost; nothing on this surface is revenue, and our own hosts are excluded from the population.</p>

<h2>What changed</h2>
${deltaBlock}

<h2>The ladder — why nothing here says MEASURED</h2>
<p>${esc(ladder?.rule ?? "")}. Observations accrue one per host per round, so at ${esc(idx.cadence?.target ?? "weekly")} cadence the first host reaches the threshold in about ${ladder?.n_required ?? 30} rounds. Today ${ladder?.rounds_so_far ?? 0} round(s) exist and <strong>${ladder?.hosts_at_or_above_n_required ?? 0}</strong> hosts are at or above n=${ladder?.n_required ?? 30}.</p>
<div class="scroll"><table><thead><tr><th>paid observations</th><th>hosts</th></tr></thead><tbody>${ladderRows}</tbody></table></div>
<p class="mut">${esc(ladder?.note ?? "")}</p>

<h2>What this is not</h2>
<ul>${(idx.caveats || []).map((c) => `<li>${esc(c)}</li>`).join("")}
<li>Not a ranking, a recommendation, a certification or an accusation. No host was contacted.</li></ul>

<h2>Check it yourself</h2>
<pre><code>curl -s ${SITE}/interop/x402-census/index.json | jq .
curl -s ${SITE}/interop/x402-census/rounds/${esc(rounds[0]?.round_id ?? "&lt;round&gt;")}.json | jq .outcome

# recompute every number from the committed rows
git clone ${GH} &amp;&amp; cd councilof-ai
python3 scripts/grants/x402_census_round.py --check
python3 scripts/grants/x402_census_delta.py --check
python3 harness/x402-census/build_cards.py --check</code></pre>
<p class="mut">The rows also live on Hugging Face at <a href="${HF}">csoai/x402-settlement-census</a>. Subscribe to changes: <a href="/feeds/x402-census.xml">/feeds/x402-census.xml</a>. Verify a signed leaf without trusting us: <a href="/signed/HOW-TO-VERIFY-ROOT.md">HOW-TO-VERIFY-ROOT.md</a>. Machine-readable: this page with <code>accept: application/json</code>.</p>
</main></body></html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
};
