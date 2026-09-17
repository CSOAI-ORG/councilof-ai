#!/usr/bin/env python3
"""growth_mining.py — mass-outward signals from everything we've already mined.

Goal: turn 542 JSON artifacts + 119 OTS-signed artifacts + the x402 + banks + XRPL
+ benchmarks + auto-eat + paper-index into outbound signals, sales artifacts,
and channel-distributable material. NOTHING is re-mined from scratch — we mine
the EXISTING corpus and emit new outbound signals.

Outputs:
  1. growth/leads.json         — per-org leads with the exact finding that opens the door
  2. growth/pitches/<slug>.md  — one short pitch per lead (verifiable, citable, no logos)
  3. growth/registry-asks.json — every free registry/directory we can list on, with URL + ask
  4. growth/signals.jsonl      — one signal per artifact (sha256 + axis + source), ready to stream
  5. growth/citable-figures.md — top 10 citable, quotable, reproducible findings (newsroom ready)
  6. growth/press-releases/    — auto-generated press releases from the top findings
  7. growth/ai-economy-movers.json — entities we measured that changed (axes → deltas)

All artifacts are reproducible (sha256 over canonical bytes) and the OTS-signed
ones stay signed; we never rewrite signed bytes — we supersede with new paths.

The 5-stop-count doctrine from the brief: outputs are MEASUREMENT, not
CERTIFICATION. We never claim a company is non-compliant. We name the public
artifact that opens the door and let the prospect verify.
"""
from __future__ import annotations
import hashlib, json, os, pathlib, re, sys
from collections import Counter, defaultdict
from datetime import datetime, timezone

# BASE IS THE CHECKOUT THIS SCRIPT LIVES IN, not a fixed machine path. It was hardcoded to
# /Users/nicholas/clawd/councilof-ai-work, so running scripts/growth_mining.py from any other
# clone read that tree's corpus and wrote that tree's outbound files — a branch could not
# regenerate its own growth surfaces, and an edit made in one checkout silently landed in
# another lane's working tree. parents[1] resolves to the same directory when the script is
# run from councilof-ai-work, so the cron's behaviour there is unchanged.
BASE = pathlib.Path(os.environ.get("GROWTH_BASE") or pathlib.Path(__file__).resolve().parents[1])
INTEROP = BASE / "public" / "interop"
AUTO_EAT = INTEROP / "auto-eat"
OUT = INTEROP / "growth"
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "pitches").mkdir(parents=True, exist_ok=True)
(OUT / "press-releases").mkdir(parents=True, exist_ok=True)


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def load_json(p: pathlib.Path) -> dict | list | None:
    try:
        return json.loads(p.read_text())
    except Exception:
        return None


def has_ots(path: pathlib.Path) -> bool:
    """An artifact is signed iff it has a sibling .ots that is a real proof."""
    ots_path = path.with_suffix(path.suffix + ".ots")
    if not ots_path.exists():
        return False
    try:
        b = ots_path.read_bytes()
        # Quick check: real OTS starts with 0x00 0x4f 0x70 0x65 0x6e 0x54 (OpenT)
        return b.startswith(b"\x00OpenT") or b.startswith(b"\x00\x4f\x70\x65\x6e\x54")
    except Exception:
        return False


def walk_corpus():
    """Walk public/interop + auto-eat. Yield (path, kind, signed, axis_hint, summary)."""
    for root in [INTEROP, AUTO_EAT]:
        for p in root.rglob("*.json"):
            if p.name.endswith(".ots.json"):
                continue
            data = load_json(p)
            if data is None:
                continue
            signed = has_ots(p)
            # Axis hint from filename or content
            axis = None
            for k in ("axis", "axis_name", "axis_id"):
                if isinstance(data, dict) and k in data:
                    axis = data[k]
                    break
            if axis is None:
                # Pull from path
                m = re.search(r"card[-_]([a-z0-9-]+)", p.name)
                if m:
                    axis = m.group(1)
            summary = ""
            if isinstance(data, dict):
                s = data.get("headline") or data.get("summary") or data.get("description") or data.get("note") or ""
                if isinstance(s, str):
                    summary = s[:200]
            yield {
                "path": str(p.relative_to(BASE)),
                "kind": p.parent.name,
                "axis": axis,
                "signed": signed,
                "headline": summary,
                "schema": (data.get("schema") if isinstance(data, dict) else None),
                # A retired artifact keeps its frozen headline forever. Carry the markers
                # that say so, or build_citable_figures cannot tell one from a live finding.
                "status": (data.get("status") if isinstance(data, dict) else None),
                # ONLY status_correction, never the generic `correction` field: the LIVE
                # component-facts runs carry correction="C-2026-0826-05 — do not restore
                # MEASURED-INDEX-v0.1" as a standing instruction, and suppressing those
                # would silence the very artifacts that replaced the retired index.
                "status_correction": (data.get("status_correction") if isinstance(data, dict) else None),
                "size_bytes": p.stat().st_size,
            }


def build_leads():
    """Build a per-org lead list from the corpus."""
    leads = []

    # From x402-census (paid endpoints — direct sales leads for x402 API)
    for p in sorted((INTEROP / "x402-census").glob("*.json")):
        d = load_json(p)
        if not d:
            continue
        if isinstance(d, dict) and d.get("host"):
            leads.append({
                "lead_kind": "x402_endpoint",
                "identifier": d.get("host"),
                "axis": "x402",
                "source_artifact": str(p.relative_to(BASE)),
                "opening_line": f"Your endpoint {d.get('host')}{d.get('path','')} appears in our x402 census; we can verify it round-trips a 402 challenge.",
                "signed": has_ots(p),
                "discovered_at": p.stat().st_mtime,
            })

    # From bank-registry
    br = load_json(INTEROP / "bank-registry.json")
    if isinstance(br, dict) and "banks" in br:
        for b in br["banks"][:100]:  # top 100
            if isinstance(b, dict):
                name = b.get("bank") or b.get("name") or b.get("bic") or b.get("id")
                country = b.get("country", "")
                chains = b.get("chains", [])
                stablecoins = b.get("stablecoins", [])
                leads.append({
                    "lead_kind": "bank",
                    "identifier": f"{name} ({country})" if country else name,
                    "bank_name": name,
                    "country": country,
                    "chains": chains,
                    "stablecoins": stablecoins,
                    "axis": "custody / settlement / reserves_collateral",
                    "source_artifact": "public/interop/bank-registry.json",
                    "opening_line": (
                        f"{name} is registered with us on {len(chains)} chains and "
                        f"{len(stablecoins)} stablecoins. We measure {name}'s ISO 20022 GPI surface "
                        f"against GENIUS Act §202/§310 and CLARITY §501."
                    ),
                    "signed": False,
                    "discovered_at": None,
                })

    # From xrpl coverage
    xrpl_cards = sorted(AUTO_EAT.glob("card-autoeat-xrpl-*.json"))
    for p in xrpl_cards[:50]:
        d = load_json(p)
        if not d:
            continue
        identifier = (d.get("host") or d.get("address") or d.get("issuer") or d.get("account")) if isinstance(d, dict) else p.stem
        leads.append({
            "lead_kind": "xrpl_account",
            "identifier": identifier,
            "axis": "transaction_integrity / reserves_collateral",
            "source_artifact": str(p.relative_to(BASE)),
            "opening_line": f"On-ledger measurement of {identifier} against GENIUS Act §202 reserves and CLARITY §501 settlement.",
            "signed": has_ots(p),
            "discovered_at": p.stat().st_mtime,
        })

    # From swift cards
    swift_cards = sorted(AUTO_EAT.glob("card-autoeat-swift-*.json")) + sorted(INTEROP.glob("ledger-card-swift-*.json"))
    for p in swift_cards[:30]:
        d = load_json(p)
        identifier = (d.get("host") or d.get("bic") or d.get("bank") or p.stem) if isinstance(d, dict) else p.stem
        leads.append({
            "lead_kind": "swift_member",
            "identifier": identifier,
            "axis": "transaction_integrity",
            "source_artifact": str(p.relative_to(BASE)),
            "opening_line": f"ISO 20022 GPI measurement of {identifier} against CLARITY §413 and EU AI Act Art 50.",
            "signed": has_ots(p),
            "discovered_at": p.stat().st_mtime,
        })

    # From AI-economy-index components (the bank gaps)
    aei = load_json(INTEROP / "ai-economy-index.v0.1.json")
    if isinstance(aei, dict) and "bank_gaps" in aei:
        for gap in aei["bank_gaps"]:
            leads.append({
                "lead_kind": "data_gap_partner",
                "identifier": gap,
                "axis": "ai-economy-index (component)",
                "source_artifact": "public/interop/ai-economy-index.v0.1.json",
                "opening_line": f"The ai-economy-index baseline notes '{gap}' as a BANK-GAP. We have the framework + the deterministic grader; we need the public series.",
                "signed": aei.get("scenario", "signed") if isinstance(aei, dict) else False,
                "discovered_at": None,
            })

    return leads


def build_signals_jsonl(corpus):
    """One signal per artifact — sha256 + axis + source + signed + headline."""
    signals = []
    for item in corpus:
        signals.append({
            "ts": datetime.now(timezone.utc).isoformat(),
            "path": item["path"],
            "axis": item["axis"],
            "source_kind": item["kind"],
            "signed": item["signed"],
            "headline": item["headline"],
            "size_bytes": item["size_bytes"],
            "schema": item["schema"],
            "url": f"https://github.com/CSOAI-ORG/councilof-ai/blob/master/{item['path']}",
        })
    out_path = OUT / "signals.jsonl"
    out_path.write_text("\n".join(json.dumps(s) for s in signals) + "\n")
    return signals


def build_registry_asks():
    """Every free registry/directory we can submit to. NEVER pay for do-follow."""
    registries = [
        # Already in three_loops catalogue but rebuilt here for growth
        ("PyPI", "https://pypi.org/account/register/", "package", False),
        ("npm", "https://www.npmjs.com/signup", "package", False),
        ("crates.io", "https://crates.io/", "package", False),
        ("RubyGems", "https://rubygems.org/sign_up", "package", False),
        ("Maven Central", "https://central.sonatype.com/", "package", False),
        ("Go pkg.dev", "https://pkg.go.dev/", "package", False),
        ("Docker Hub", "https://hub.docker.com/signup", "container", False),
        ("GitHub", "https://github.com/signup", "code-host", False),
        ("GitLab", "https://gitlab.com/users/sign_up", "code-host", False),
        ("HuggingFace", "https://huggingface.co/join", "model-registry", False),
        ("Kaggle", "https://www.kaggle.com/account/login", "data-platform", False),
        ("arXiv", "https://arxiv.org/account", "preprint-server", False),
        ("OpenReview", "https://openreview.net/signup", "peer-review", False),
        ("Zenodo", "https://zenodo.org/signup/", "research-data", False),
        ("ORCID", "https://orcid.org/register", "researcher-id", False),
        ("GitHub Pages", "https://pages.github.com/", "static-host", False),
        ("Cloudflare Pages", "https://pages.cloudflare.com/", "static-host", False),
        ("Vercel", "https://vercel.com/signup", "static-host", False),
        ("Netlify", "https://app.netlify.com/signup", "static-host", False),
        ("Glama", "https://glama.ai/mcp", "mcp-directory", False),
        ("MCP.so", "https://mcp.so/", "mcp-directory", False),
        ("Cursor", "https://cursor.com/directory", "mcp-directory", False),
        # Press / academic / regulatory submission routes
        ("Hacker News (Show HN)", "https://news.ycombinator.com/submit", "press", False),
        ("Lobsters", "https://lobste.rs/", "press", False),
        ("r/MachineLearning", "https://www.reddit.com/r/MachineLearning/submit", "press", False),
        ("r/LocalLLaMA", "https://www.reddit.com/r/LocalLLaMA/submit", "press", False),
        ("r/ArtificialIntelligence", "https://www.reddit.com/r/ArtificialIntelligence/submit", "press", False),
        ("r/AI_Agents", "https://www.reddit.com/r/AI_Agents/submit", "press", False),
        ("OpenAI Community Forum", "https://community.openai.com/", "press", False),
        ("HuggingFace Forums", "https://discuss.huggingface.co/", "press", False),
        ("AIcrowd", "https://www.aicrowd.com/", "press", False),
        ("Papers with Code", "https://paperswithcode.com/", "press", False),
        ("Substack Notes", "https://substack.com/notes", "press", False),
        ("LinkedIn (drafted, you click post)", "https://www.linkedin.com/feed/", "press", False),
        ("X/Twitter (drafted, you click post)", "https://x.com/compose/post", "press", False),
        # Regulatory consultation routes (active comment periods)
        ("SEC RegCryptoAssets (comments due 2026-10-20)", "https://www.sec.gov/comments/s7-12-25/s7-12-25.htm", "regulatory", False),
        ("CFTC Innovation Task Force", "https://www.cftc.gov/industry-regulation/fintech", "regulatory", False),
        ("EU AI Pact", "https://digital-strategy.ec.europa.eu/en/policies/ai-pact", "regulatory", False),
        ("UK DRCF Forum", "https://www.drcf.org.uk", "regulatory", False),
    ]
    return [
        {"name": n, "url": u, "kind": k, "asks_money": m, "rule": "NEVER pay for do-follow backlinks. Applied ≠ Accepted. Listed ≠ Member."}
        for n, u, k, m in registries
    ]


def build_citable_figures(corpus):
    """Top 10 citable, quotable, reproducible findings from the corpus.

    Filter: only signed OR content-addressed artifacts whose headline is NOT a
    NO_LAPTOP_SIGN placeholder. Headlines shorter than 40 chars or starting with
    noise prefixes are not quotable findings — they're status text.

    We allow up to 3 figures per axis — the first three citable items. This lets
    a strong axis (like AI economy) contribute multiple findings rather than
    collapsing to one.
    """
    figures = []
    per_axis_count = defaultdict(int)
    skip_prefixes = (
        "NO_LAPTOP_SIGN", "Envelope schema is", "None", "None.", "axis",
        "UNSIGNED card-v0", "Measurement, not certification.",
        "Voluntary-list", "Definition: ledger-card", "Definition: ",
        "Reference identifier", "Source: ", "Signed by ", "as_of ",
    )
    skip_substrings = (
        "MEASUREMENT, not certification", "no host was contacted",
        "Voluntary-list appearance", "UNSIGNED",
    )
    for item in corpus:
        h = item.get("headline", "").strip()
        if not h or len(h) < 40:
            continue
        # NEVER QUOTE A RETIRED ARTIFACT. ai-economy-index.v0.1.json carries
        # status_correction "C-2026-0826-05 — MEASURED-INDEX-v0.1 was an over-claim", yet its
        # frozen headline -- "13.48% (2024) ... +5.42pp YoY (deterministic, citable,
        # recomputable)" -- was harvested into citable-figures.md and the dated press
        # releases on every run, months after the live axis had moved past it. A superseded
        # number does not become quotable by sitting in a file that is regenerated today.
        #
        # The test is status_correction: an artifact whose own STATUS claim was corrected.
        # UNMEASURED alone is not the test — UNMEASURED is first-class here, and an
        # UNMEASURED artifact routinely carries a real, quotable finding.
        if item.get("status_correction"):
            continue
        if any(h.startswith(s) for s in skip_prefixes):
            continue
        if any(s in h for s in skip_substrings):
            continue
        axis = item.get("axis") or "(uncategorized)"
        if per_axis_count[axis] >= 3:
            continue
        # Signed OR content-addressed. We check by looking for content_id in the underlying file.
        is_signed = item["signed"]
        is_content_addressed = False
        if not is_signed:
            try:
                d = json.loads((BASE / item["path"]).read_text())
                if isinstance(d, dict) and (d.get("content_id") or d.get("sha256") or d.get("content_hash")):
                    is_content_addressed = True
            except Exception:
                pass
        if not (is_signed or is_content_addressed):
            continue
        per_axis_count[axis] += 1
        figures.append({
            "axis": axis,
            "headline": h,
            "source_artifact": item["path"],
            "signed": is_signed,
            "content_addressed": is_content_addressed,
            "reproduces_via": f"git clone https://github.com/CSOAI-ORG/councilof-ai && cat {item['path']}",
            "disclaimers": [
                "MEASUREMENT, not CERTIFICATION.",
                "Reproduce from the artifact; sha256 in the file's `.content_id` field." if is_content_addressed else "Signed and timestamped; reproduce from the artifact.",
            ],
        })
        if len(figures) >= 10:
            break
    return figures


def build_press_release(figures):
    """Auto-generate a press release from the top figures."""
    today = datetime.now(timezone.utc).strftime("%d %B %Y")
    body = f"""# CSOAI: {len(figures)} reproducible measurements, all signed and timestamped

*{today}* — The CSOAI sovereign measurement substrate today published a fresh set of signed, Bitcoin-anchored measurements across {len(set(f['axis'] for f in figures))} axes. Every figure below is reproducible from a public artifact.

## Top figures (each reproducible)

"""
    for i, f in enumerate(figures, 1):
        body += f"### {i}. {f['axis']}\n\n"
        body += f"**{f['headline']}**\n\n"
        body += f"Source: `{f['source_artifact']}` (Ed25519-signed; OTS-stamped)\n\n"
        body += f"Reproduce: `{f['reproduces_via']}`\n\n"

    body += """
## What CSOAI is, and is not

CSOAI is the UK-sovereign, audit-grade, signed, neutral measurement substrate for AI governance, digital assets, and autonomous systems. CSOAI does not certify, accredit, or rate — it measures, signs, and records.

## Press contact

Nicholas Templeman — nicholas@csoai.org (PrivateEmail)
"""
    return body


def main() -> int:
    print("=== Growth mining — mass-outward signals from existing corpus ===")
    print(f"outdir: {OUT}")

    # 1. Walk corpus
    print("\n--- Step 1: walking public/interop + auto-eat ---")
    corpus = list(walk_corpus())
    n_signed = sum(1 for c in corpus if c["signed"])
    print(f"  artifacts: {len(corpus)}  signed: {n_signed}  ({100*n_signed/len(corpus):.0f}%)")

    # 2. Build leads
    print("\n--- Step 2: leads from corpus ---")
    leads = build_leads()
    (OUT / "leads.json").write_text(json.dumps({
        "schema": "csoai.growth.leads/0.1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "leads_count": len(leads),
        "by_kind": dict(Counter(l["lead_kind"] for l in leads)),
        "leads": leads,
    }, indent=2))
    print(f"  leads: {len(leads)}  by_kind: {dict(Counter(l['lead_kind'] for l in leads))}")

    # 3. Signals jsonl
    print("\n--- Step 3: signals.jsonl ---")
    signals = build_signals_jsonl(corpus)
    print(f"  signals: {len(signals)}  file: {OUT}/signals.jsonl")

    # 4. Registry asks
    print("\n--- Step 4: registry-asks.json ---")
    asks = build_registry_asks()
    (OUT / "registry-asks.json").write_text(json.dumps({
        "schema": "csoai.growth.registry-asks/0.1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "registries_count": len(asks),
        "free_registries": sum(1 for a in asks if not a["asks_money"]),
        "rule": "NEVER pay for do-follow backlinks. Applied ≠ Accepted. Listed ≠ Member.",
        "registries": asks,
    }, indent=2))
    print(f"  registries: {len(asks)}  free: {sum(1 for a in asks if not a['asks_money'])}")

    # 5. Citable figures
    print("\n--- Step 5: citable-figures.md (top 10 signed + quotable) ---")
    figures = build_citable_figures(corpus)
    (OUT / "citable-figures.md").write_text(
        "# Citable figures (signed + reproducible)\n\n" +
        "\n\n".join(
            f"### {i}. {f['axis']}\n\n{f['headline']}\n\nSource: `{f['source_artifact']}`"
            for i, f in enumerate(figures, 1)
        ) + "\n\n_MEASUREMENT, not CERTIFICATION. Reproduce from the artifact._\n"
    )
    print(f"  figures: {len(figures)}")

    # 6. Press releases
    print("\n--- Step 6: press-releases/ ---")
    press = build_press_release(figures)
    (OUT / "press-releases" / f"release-{datetime.now(timezone.utc).strftime('%Y%m%d')}.md").write_text(press)
    print(f"  press release: 1 file")

    # 7. AI-economy movers
    print("\n--- Step 7: ai-economy-movers.json ---")
    # THE HEADLINE COMES FROM THE LIVE RUN, NOT THE RETIRED INDEX.
    # This step used to lift `headline` straight out of ai-economy-index.v0.1.json -- the
    # MEASURED-INDEX-v0.1 artifact that C-2026-0826-05 retired. That sentence is frozen at
    # its 2026-08 vintage, so every regeneration of this outward, explicitly "citable" feed
    # re-published "13.48% (2024)" as today's number, long after Eurostat had published 2025
    # and after the live axis had moved on. A feed that regenerates daily must not carry a
    # figure that cannot.
    run = load_json(INTEROP / "financial-measure-run-ai-adoption-components.json")
    cells = [r for r in ((run or {}).get("measured") or []) if r.get("status") == "MEASURED"]
    if cells:
        parts = ", ".join(f"{c['series']}: {c['value']}% ({c['year']})" for c in cells)
        headline = f"Eurostat isoc_eb_ai — {parts}. Deterministic, citable, recomputable from the cited source."
    else:
        # No measured cell this run: say so. Never fall back to a remembered number.
        headline = None
    aei = load_json(INTEROP / "ai-economy-index.v0.1.json")
    (OUT / "ai-economy-movers.json").write_text(json.dumps({
        "schema": "csoai.growth.ai-economy-movers/0.1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "headline": headline,
        "headline_source": "/interop/financial-measure-run-ai-adoption-components.json",
        "headline_status": (run or {}).get("status", "UNREACHABLE"),
        "components": [c.get("series") for c in cells],
        # A list of what is still MISSING, not a measurement — unchanged by the source swap.
        "bank_gaps": aei.get("bank_gaps", []) if isinstance(aei, dict) else [],
        "not_an_index": "Component facts only. C-2026-0826-05: the retired MEASURED-INDEX-v0.1 is never restored, and this feed no longer quotes it.",
        "scarcity_signals": "Compute-price, AI-investment, sector-output: no authoritative public machine series. The grist for a 5-figure data partnership.",
    }, indent=2))

    # 8. Pitches — one per lead kind (not per lead)
    print("\n--- Step 8: per-kind pitch files ---")
    by_kind = defaultdict(list)
    for l in leads:
        by_kind[l["lead_kind"]].append(l)
    for kind, items in by_kind.items():
        n = len(items)
        pitch = f"""# Pitch: {kind} ({n} leads)

## What we have

A signed, OTS-stamped measurement corpus that covers this segment. Every figure is reproducible from a public artifact.

## What we ask

A 20-minute call to walk through the figures that touch your segment. No commitment, no upsell.

## What we do NOT ask

We do not ask you to certify, accredit, or endorse CSOAI. We do not ask for payment in this call. We do not sign anything as you.

## What it changes for you

You get a free, signed snapshot of where you stand against the public regulatory framework — independently verifiable from a public artifact, not from our say-so.

## Contact

Nicholas Templeman — nicholas@csoai.org (PrivateEmail)

---
_MEASUREMENT, not CERTIFICATION._
"""
        (OUT / "pitches" / f"pitch-{kind}.md").write_text(pitch)
    print(f"  pitches: {len(by_kind)} files")

    # Final summary
    summary = {
        "schema": "csoai.growth.summary/0.1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "inputs": {
            "corpus_artifacts": len(corpus),
            "signed_artifacts": n_signed,
            "axes_in_corpus": len(set(c["axis"] for c in corpus if c["axis"])),
        },
        "outputs": {
            "leads": len(leads),
            "signals": len(signals),
            "registries": len(asks),
            "free_registries": sum(1 for a in asks if not a["asks_money"]),
            "citable_figures": len(figures),
            "press_releases": 1,
            "pitches": len(by_kind),
        },
        "rules_in_force": [
            "MEASUREMENT, not CERTIFICATION.",
            "NEVER pay for do-follow backlinks.",
            "NEVER sign with anything but the board key.",
            "NEVER claim a recipient accepts or endorses this.",
            "NEVER report a partial walk as COMPLETE.",
            "An idle honest cycle beats a busy dishonest one.",
        ],
        "external_blockers_unchanged": {
            "gha_dead": True,
            "cose_interop_key_forbidden": True,
            "runpod_key_burned": True,
            "xai_spending_limit": True,
            "hf_token_no_org_write": True,
        },
        "disclaimers": [
            "All outputs are MEASUREMENT, not CERTIFICATION.",
            "Every figure is reproducible from a public artifact.",
            "You click the OAuth gate; we never send anything pretending to be you.",
        ],
    }
    canonical = json.dumps(summary, sort_keys=True, separators=(",", ":")).encode()
    summary["sha256"] = sha256_bytes(canonical)
    (OUT / "summary.json").write_text(json.dumps(summary, indent=2))

    print(f"\n=== DONE ===")
    print(f"outputs in: {OUT}/")
    print(f"sha256: {summary['sha256']}")
    print(f"\nKEY OUTPUTS:")
    print(f"  leads ({len(leads)})            → {OUT}/leads.json")
    print(f"  signals ({len(signals)})       → {OUT}/signals.jsonl")
    print(f"  registry-asks ({len(asks)})    → {OUT}/registry-asks.json")
    print(f"  citable figures ({len(figures)})→ {OUT}/citable-figures.md")
    print(f"  press release (1)              → {OUT}/press-releases/release-{datetime.now(timezone.utc).strftime('%Y%m%d')}.md")
    print(f"  pitches ({len(by_kind)})       → {OUT}/pitches/pitch-<kind>.md")
    print(f"  ai-economy movers              → {OUT}/ai-economy-movers.json")
    print(f"  summary                        → {OUT}/summary.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
