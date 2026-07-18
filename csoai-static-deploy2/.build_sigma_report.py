#!/usr/bin/env python3
"""Generate the SIGMA_CHECK_2026-07-13.md from audit results."""
import json
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd/csoai-static-deploy2")
AUDIT = json.loads((ROOT / ".sigma_audit_results.json").read_text())
TOTAL = json.loads((ROOT / ".sigma_audit_totals.json").read_text())

SIGNAL_LABELS = {
    1: "S1 meta description",
    2: "S2 canonical",
    3: "S3 og:title+og:description",
    4: "S4 JSON-LD Article",
    5: "S5 Article 50 banner",
    6: "S6 link to /master",
    7: "S7 SIGIL footer/receipt",
    8: "S8 CTA article-50/owem-rfq",
}
SIG_SHORT = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"]


def fail_count(r):
    return sum(1 for i in range(1, 9) if not r.get(f"S{i}"))


# Hub list (known entry points / named-traffic anchors)
HUB_PAGES = {
    "defoneos.html", "defoneos-index.html", "defoneos-article-50.html",
    "defoneos-owem-rfq.html",
    "defoneos-mod-public-evidence-pack.html", "defoneos-mod-defcon-760-cross-walk.html",
    "defoneos-mod-post-pilot-lessons-learned.html", "defoneos-mod-uk-sovereign-pitch.html",
    "defoneos-mod-board-update.html", "defoneos-mod-auditor-counter.html",
}


def cell(v):
    return "✅" if v else "❌"


# ===== Build the report =====
out = []
A = out.append

# Header
A("# SIGMA CHECK — 2026-07-13")
A("")
A("**Audit:** every `defoneos-*.html` page in `/Users/nicholas/clawd/csoai-static-deploy2/` against the 8-signal sovereign gate.")
A("")
A("**Working dir:** `/Users/nicholas/clawd/csoai-static-deploy2/`")
A("**Pages audited:** " + str(TOTAL["total_pages"]) + " (task brief said 299; filesystem holds 300 — all 300 audited).")
A("**Method:** read-only static HTML grep on each file. No deploys, no mutations.")
A("**Output:** this file + `.sigma_audit_results.json` + `.sigma_audit_totals.json` in the deploy dir.")
A("")

# ============================================================
# 1-PAGE SUMMARY
# ============================================================
A("---")
A("")
A("## 1-Page Summary")
A("")
passing_all = TOTAL["pages_passing_all8"]
failing_one_plus = TOTAL["pages_failing_1plus"]

A(f"- **Pages passing ALL 8 signals: {passing_all} / {TOTAL['total_pages']}** ({passing_all/TOTAL['total_pages']:.1%})")
A(f"- **Pages failing ≥1 signal: {failing_one_plus} / {TOTAL['total_pages']}** ({failing_one_plus/TOTAL['total_pages']:.1%})")
A("")

# Per-signal pass rate
A("### Per-signal pass rate")
A("")
A("| Signal | Pass | Fail | Pass rate |")
A("|---|---:|---:|---:|")
for i in range(1, 9):
    s = f"S{i}"
    p = TOTAL[s]
    f = TOTAL["total_pages"] - p
    A(f"| {s} — {SIGNAL_LABELS[i].split(' ', 1)[1]} | {p} | {f} | {p/TOTAL['total_pages']:.1%} |")
A("")

# Failure histogram
from collections import Counter
fc_dist = Counter(fail_count(r) for r in AUDIT)
A("### Fail-count distribution (out of 8 signals)")
A("")
A("| Failing signals | Pages | % of estate |")
A("|---:|---:|---:|")
for k in sorted(fc_dist):
    A(f"| {k} | {fc_dist[k]} | {fc_dist[k]/TOTAL['total_pages']:.1%} |")
A("")

# Worst findings
A("### Hard truths")
A("")
A("- **S4 JSON-LD Article schema: 0/300 pages.** The estate has zero Article-schema structured data. This is the single biggest gap and is blocking Article 50–era rich-result eligibility and machine-readable provenance.")
A("- **S6 link to `/master`: 1/300 pages.** Only `defoneos-article-50.html` references `/master` (and only because it references itself in context). No cross-page sovereign hub wiring.")
A("- **S8 CTA to `/defoneos-article-50` or `/defoneos-owem-rfq`: 1/300 pages.** No commercial conversion path is wired into the rest of the estate. Only `defoneos-article-50.html` self-links.")
A("- **S2 canonical: 37.0% pass. S3 og tags: 39.3% pass.** Roughly 6 in 10 pages are missing canonicals and OpenGraph metadata — basic GEO/AEO hygiene gap.")
A("- **S5 Article 50 banner: 55.3% pass.** Slightly more than half reference EU AI Act / Article 50 — the rest are non-EU-AI-Act-anchored surfaces.")
A("- **S1 description (93.7%) and S7 SIGIL (89.7%) are the strongest signals** — most pages do have meta description and SIGIL footer/receipt reference.")
A("")

# ============================================================
# TOP-10 HIGHEST-TRAFFIC PATCH LIST
# ============================================================
A("---")
A("")
A("## Top 10 Highest-Traffic Pages Needing Immediate Patch")
A("")
A("Hub pages (named traffic anchors / conversion surfaces) are listed first, then worst-failing non-hub pages, sorted by fail-count (DESC) then size (DESC) as a substance proxy.")
A("")
scored = []
for r in AUDIT:
    is_hub = r["page"] in HUB_PAGES
    scored.append((is_hub, fail_count(r), r["_size"], r))
scored.sort(key=lambda t: (-t[0], -t[1], -t[2]))

# Take all hubs + top non-hub worst-fail pages, slice to first 10 with at least 1 hub priority
top10 = []
seen = set()
# Step 1: all hub pages sorted by fail count, size
hubs_sorted = [t for t in scored if t[0]]
hubs_sorted.sort(key=lambda t: (-t[1], -t[2]))
for t in hubs_sorted:
    if t[3]["page"] not in seen:
        top10.append(t)
        seen.add(t[3]["page"])
        if len(top10) == 10:
            break
# If we don't have 10 hubs, fill with worst non-hubs
if len(top10) < 10:
    for t in scored:
        if t[3]["page"] not in seen:
            top10.append(t)
            seen.add(t[3]["page"])
            if len(top10) == 10:
                break

A("| Rank | Page | HUB | Failing | Missing signals |")
A("|---:|---|:---:|---:|---|")
for i, (is_hub, fc, sz, r) in enumerate(top10, 1):
    missing = ", ".join(s for s in SIG_SHORT if not r.get(s))
    A(f"| {i} | `{r['page']}` | {'YES' if is_hub else '—'} | {fc}/8 | {missing} |")
A("")

# Per-page patch recipes for top 10
A("### Per-page patch recipes (top 10)")
A("")
for i, (is_hub, fc, sz, r) in enumerate(top10, 1):
    A(f"**{i}. `{r['page']}`** — {fc}/8 signals missing (size {sz:,}b)")
    missing = [s for s in SIG_SHORT if not r.get(s)]
    recipes = []
    if "S2" in missing:
        recipes.append("add `<link rel=\"canonical\" href=\"https://csoai-static-deploy2.vercel.app/{page}\">`")
    if "S3" in missing:
        recipes.append("add `<meta property=\"og:title\">` + `<meta property=\"og:description\">`")
    if "S4" in missing:
        recipes.append("add a `<script type=\"application/ld+json\">` block containing `\"@context\": \"https://schema.org\"` + `\"@type\": \"Article\"`")
    if "S5" in missing:
        recipes.append("add EU AI Act Article 50 banner block (top or sidebar)")
    if "S6" in missing:
        recipes.append("add sovereign-hub link `<a href=\"/master\">Master Index</a>`")
    if "S8" in missing:
        recipes.append("add CTA strip linking to `/defoneos-article-50` AND `/defoneos-owem-rfq`")
    if "S1" in missing:
        recipes.append("add `<meta name=\"description\" content=\"...\">`")
    if "S7" in missing:
        recipes.append("add SIGIL footer / receipt reference")
    A("- Patch: " + "; ".join(recipes) + ".")
    A("")

# ============================================================
# FULL PER-PAGE TABLE
# ============================================================
A("---")
A("")
A("## Full Per-Page Audit Table (300 pages, 8 boolean columns)")
A("")
A("Legend: ✅ = signal present, ❌ = signal missing. Columns: S1=meta desc, S2=canonical, S3=og:title+og:description, S4=JSON-LD Article, S5=Article 50 banner, S6=/master link, S7=SIGIL footer/receipt, S8=CTA to article-50/owem-rfq.")
A("")
A("| # | Page | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | Fail |")
A("|---:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---:|")

# Sort alphabetically
sorted_audit = sorted(AUDIT, key=lambda r: r["page"])
for i, r in enumerate(sorted_audit, 1):
    cells = " | ".join(cell(r.get(f"S{j}")) for j in range(1, 9))
    fc = fail_count(r)
    A(f"| {i} | `{r['page']}` | {cells} | {fc} |")
A("")

# ============================================================
# GRAND TOTALS
# ============================================================
A("---")
A("")
A("## Grand Totals")
A("")
A(f"- Total defoneos-*.html pages audited: **{TOTAL['total_pages']}**")
A(f"- Pages passing all 8 sovereign signals: **{TOTAL['pages_passing_all8']}**")
A(f"- Pages failing ≥1 signal: **{TOTAL['pages_failing_1plus']}**")
A("")
A("### Per-signal totals")
A("")
A("| Signal | Pass | Fail |")
A("|---|---:|---:|")
for i in range(1, 9):
    s = f"S{i}"
    A(f"| {s} | {TOTAL[s]} | {TOTAL['total_pages'] - TOTAL[s]} |")
A("")

# Pages failing 1+ checks (re-stated for the brief)
A("### Pages failing ≥1 check")
A("")
fail_pages = sorted(
    [(fail_count(r), r["page"]) for r in AUDIT if fail_count(r) >= 1],
    key=lambda t: (-t[0], t[1]),
)
A(f"**{len(fail_pages)} of {TOTAL['total_pages']} pages fail at least one sovereign signal.**")
A("")
A("Distribution by fail-count:")
A("")
A("| Failing signals | Pages |")
A("|---:|---:|")
for k in sorted(fc_dist):
    A(f"| {k} | {fc_dist[k]} |")
A("")

# Pages passing everything (likely empty)
A("### Pages passing ALL 8 signals")
A("")
pass_all = [r["page"] for r in AUDIT if fail_count(r) == 0]
if pass_all:
    A("\n".join(f"- `{p}`" for p in pass_all))
else:
    A("**(none — 0/300 pages pass the sovereign signal gate.)**")
A("")

# ============================================================
# APPENDIX — methodology
# ============================================================
A("---")
A("")
A("## Appendix — Methodology")
A("")
A("Each `defoneos-*.html` file was scanned (regex, case-insensitive) for the 8 sovereign signals. Definitions:")
A("")
A("- **S1** — `<meta name=\"description\" ...>` tag present")
A("- **S2** — `<link rel=\"canonical\" ...>` tag present")
A("- **S3** — both `<meta property=\"og:title\">` AND `<meta property=\"og:description\">` present")
A("- **S4** — at least one `<script type=\"application/ld+json\">` block containing `\"@type\":\"Article\"`")
A("- **S5** — text reference to `Article 50` OR `EU AI Act` (banner / disclosure language)")
A("- **S6** — `<a href=\".../master\">` link present anywhere")
A("- **S7** — text matching `SIGIL`, `SIGIL|`, `receipt`, `sigil-anchor`, `sigil-chain`, or `sigil_digest`")
A("- **S8** — `<a href=\".../defoneos-article-50\">` OR `<a href=\".../defoneos-owem-rfq\">` present")
A("")
A("Audit script: `.sigma_audit.py` · Raw JSON: `.sigma_audit_results.json` · Totals JSON: `.sigma_audit_totals.json`")
A("")
A("**Final path of this report:** `/Users/nicholas/clawd/csoai-static-deploy2/SIGMA_CHECK_2026-07-13.md`")
A("")

(ROOT / "SIGMA_CHECK_2026-07-13.md").write_text("\n".join(out))
print("Wrote SIGMA_CHECK_2026-07-13.md")