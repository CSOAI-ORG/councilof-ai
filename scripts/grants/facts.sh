#!/usr/bin/env bash
# facts.sh — derive every number a grant/procurement application cites. Never type a count.
#
# Reads the live estate (councilof.ai), the registries (PyPI, npm), the DOIs and the GitHub API,
# and prints one JSON document. Applications under docs/grants/<date>/ quote from this output and
# name its as_of; if a figure is not in here it is not to be quoted.
#
#   bash scripts/grants/facts.sh > docs/grants/$(date -u +%F)/FACTS-$(date -u +%F).json
#
# Needs: curl, python3, and `gh auth` for the commit-activity block (Gitcoin's OSS criteria).
set -euo pipefail
UA="Mozilla/5.0 (compatible; csoai-grants-facts/1.0)"
get() { curl -fsSL --max-time 40 -A "$UA" "$1"; }

GSPC=$(get https://councilof.ai/api/gspc)
ROOT=$(get https://councilof.ai/root.json)
REV=$(get https://councilof.ai/api/revenue)
CORR=$(get https://councilof.ai/api/corrections)
X402=$(get https://councilof.ai/.well-known/x402.json)
PYPI=$(get https://pypi.org/pypi/csoai-gspc/json)
NPM=$(get https://registry.npmjs.org/csoai-gspc-mcp)
ZEN_M=$(get "https://zenodo.org/api/records/21991105")
ZEN_S=$(get "https://zenodo.org/api/records/22344048")
REPO=$(gh api repos/CSOAI-ORG/councilof-ai 2>/dev/null || echo '{}')
# commit days in the last 90 days, default branch — Gitcoin's "activity on >20 days in last 90"
SINCE=$(python3 -c "import datetime;print((datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(days=90)).strftime('%Y-%m-%dT%H:%M:%SZ'))")
COMMIT_DATES=$(gh api --paginate "repos/CSOAI-ORG/councilof-ai/commits?since=$SINCE&per_page=100" -q '.[].commit.committer.date' 2>/dev/null || true)

python3 - "$GSPC" "$ROOT" "$REV" "$CORR" "$X402" "$PYPI" "$NPM" "$ZEN_M" "$ZEN_S" "$REPO" "$COMMIT_DATES" <<'PY'
import sys, json, datetime
gspc, root, rev, corr, x402, pypi, npm, zm, zs, repo = [json.loads(a) if a.strip() else {} for a in sys.argv[1:11]]
dates = [d[:10] for d in sys.argv[11].split() if d]
t = gspc.get("totals", {})
one = rev.get("one_number", {})
out = {
  "schema": "csoai.grants-facts/0.1",
  "read_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
  "rule": "Every figure here was read from the named source at read_at. Applications quote these and state the as_of; nothing is typed.",
  "board": {
    "source": "https://councilof.ai/api/gspc",
    "lid_verbatim": t.get("lid"),
    "axes": t.get("axes"), "measured_axes": t.get("measured_axes"), "unmeasured_axes": t.get("unmeasured_axes"),
    "model_fleets": t.get("model_fleets"), "fact_runs": t.get("fact_runs"),
    "public_leader_count": t.get("public_leader_count"), "license": t.get("license"),
  },
  "public_root": {
    "source": "https://councilof.ai/root.json",
    "as_of": root.get("as_of"), "card_count": root.get("card_count"), "merkle_root": root.get("merkle_root"),
    "did": root.get("did_intended"), "kind": root.get("kind"),
    "leaf_list_matches_count": (len(root.get("card_sha256", [])) == root.get("card_count")),
  },
  "revenue": {
    "source": "https://councilof.ai/api/revenue",
    "one_number_id": one.get("id"), "all_time": one.get("all_time"), "last_30d": one.get("last_30d"),
    "settled_usdc_status": (rev.get("settled_usdc") or {}).get("status"),
    "settled_usdc_count": (rev.get("settled_usdc") or {}).get("count"),
  },
  "corrections": {
    "source": "https://councilof.ai/api/corrections",
    "count": len(corr.get("corrections", [])),
    "latest_id": (corr.get("corrections") or [{}])[0].get("id"),
    "latest_date": (corr.get("corrections") or [{}])[0].get("date"),
    "license": corr.get("license"),
  },
  "x402": {
    "source": "https://councilof.ai/.well-known/x402.json",
    "x402Version": x402.get("x402Version"), "scheme": x402.get("scheme"), "network": x402.get("network"),
    "asset": x402.get("asset"), "payTo": x402.get("payTo"), "mode": x402.get("mode"),
    "resource_count": len(x402.get("resources", [])),
  },
  "packages": {
    "pypi_csoai_gspc": {"source": "https://pypi.org/project/csoai-gspc/", "version": (pypi.get("info") or {}).get("version")},
    "npm_csoai_gspc_mcp": {"source": "https://www.npmjs.com/package/csoai-gspc-mcp", "version": (npm.get("dist-tags") or {}).get("latest")},
  },
  "dois": {
    "methodology": {"doi": "10.5281/zenodo.21991104", "resolves_to": "https://zenodo.org/records/21991105",
                    "title": (zm.get("metadata") or {}).get("title"), "publication_date": (zm.get("metadata") or {}).get("publication_date")},
    "board_snapshot": {"doi": "10.5281/zenodo.22344048", "resolves_to": "https://zenodo.org/records/22344048",
                       "title": (zs.get("metadata") or {}).get("title"), "publication_date": (zs.get("metadata") or {}).get("publication_date")},
  },
  "repo": {
    "source": "https://github.com/CSOAI-ORG/councilof-ai",
    "license": (repo.get("license") or {}).get("spdx_id"), "created_at": repo.get("created_at"),
    "pushed_at": repo.get("pushed_at"), "default_branch": repo.get("default_branch"),
    "commits_last_90d": len(dates), "distinct_commit_days_last_90d": len(set(dates)),
    "gitcoin_oss_activity_note": "Gitcoin general eligibility asks for 3 of: first commit >90 days ago, a commit in the last 30 days, activity on >20 days in the last 90 days, permissive licence.",
  },
  "entity": {
    "name": "CSOAI LTD", "companies_house": "16939677",
    "source": "https://find-and-update.company-information.service.gov.uk/company/16939677",
    "registered_office": "3rd Floor 86-90 Paul Street, London EC2A 4NE",
    "contact": "nicholas@csoai.org",
  },
  "standards": {
    "ietf_draft": "https://datatracker.ietf.org/doc/draft-templeman-scitt-framing-space/",
    "a2a_issue": "https://github.com/a2aproject/A2A/issues/2150",
    "hf_org": "https://huggingface.co/csoai",
  },
}
print(json.dumps(out, indent=2))
PY
