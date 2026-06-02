#!/usr/bin/env python3
"""
build_law_bundle.py — distil the REAL CSOAI crosswalk-json into a compact bundle
that meok-one (zero-dep, stdlib) can serve as MEOK LAW.

Source of truth: meok-labs-engine/crosswalk-json/CSOAI-*-CROSSWALK.json
  Each file: {framework, total_mappings, topics_covered, mappings:[{csoai_article,
              target_framework, target_reference, equivalence, line_in_source}]}
  The CSOAI 52-article charter is the HUB; every framework maps charter articles
  <-> that framework's references. So CSOAI is the pivot for cross-region handoffs.

Output: meok_one/data/law_bundle.json   (committed; regenerate when crosswalks change)

Honesty: we map ONLY frameworks we actually have crosswalk files for. Region binding
status is curated from public fact (e.g. EU AI Act is binding law; US/UK have no
horizontal AI statute yet). Nothing here is legal advice.

Run:  python3 tools/build_law_bundle.py
"""
import json, os, glob

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(HERE, "..", "..", "meok-labs-engine", "crosswalk-json"))
OUT = os.path.normpath(os.path.join(HERE, "..", "meok_one", "law_bundle.json"))

# framework-file-id -> curated jurisdiction metadata (public fact, not legal advice)
#   region: where it primarily applies   kind: legal weight   binding: is it law?
FW_META = {
    "EU-AI-ACT": dict(name="EU AI Act", short="eu_ai_act", region="EU",
                      kind="binding-law", binding=True,
                      cite="Regulation (EU) 2024/1689",
                      note="Horizontal, risk-tiered AI law. Phased application 2025-2027."),
    "NIST-AI-RMF": dict(name="NIST AI RMF", short="nist_ai_rmf", region="US",
                        kind="regulator-guidance", binding=False,
                        cite="NIST AI 100-1 (Jan 2023)",
                        note="Voluntary US risk framework (GOVERN/MAP/MEASURE/MANAGE)."),
    "UK-AISI": dict(name="UK AI Safety guidance", short="uk_aisi", region="UK",
                    kind="regulator-guidance", binding=False,
                    cite="UK AISI evaluations + pro-innovation principles",
                    note="UK has no horizontal AI Act; existing regulators apply sector rules."),
    "SINGAPORE-AGENTIC-AI": dict(name="Singapore Agentic-AI guidance", short="sg_agentic",
                                 region="APAC", kind="regulator-guidance", binding=False,
                                 cite="IMDA / Model AI Governance Framework",
                                 note="Influential APAC reference for agentic systems."),
    "UNESCO-AI-ETHICS": dict(name="UNESCO AI Ethics", short="unesco", region="GLOBAL",
                             kind="intl-principles", binding=False,
                             cite="UNESCO Recommendation on the Ethics of AI (2021)",
                             note="Adopted by 190+ member states; principle-level."),
    "OECD-AI-PRINCIPLES": dict(name="OECD AI Principles", short="oecd", region="OECD",
                               kind="intl-principles", binding=False,
                               cite="OECD/LEGAL/0449 (rev. 2024)",
                               note="Baseline for 47 adhering countries + G20."),
    "G7-G20-AI-PRINCIPLES": dict(name="G7/G20 AI Principles", short="g7_g20", region="INTL",
                                 kind="intl-principles", binding=False,
                                 cite="Hiroshima AI Process (2023)",
                                 note="International code of conduct for advanced AI."),
    "MONTREAL-DECLARATION": dict(name="Montreal Declaration", short="montreal", region="CA",
                                 kind="intl-principles", binding=False,
                                 cite="Montreal Declaration for Responsible AI (2018)",
                                 note="Canadian civil/academic principle set."),
    "IEEE-ETHICALLY-ALIGNED-DESIGN": dict(name="IEEE Ethically Aligned Design", short="ieee",
                                          region="GLOBAL", kind="industry-standard", binding=False,
                                          cite="IEEE EAD / 7000-series",
                                          note="Engineering standards body guidance."),
    "ASILOMAR-AI-PRINCIPLES": dict(name="Asilomar AI Principles", short="asilomar",
                                   region="GLOBAL", kind="industry-voluntary", binding=False,
                                   cite="Future of Life Institute (2017)",
                                   note="Voluntary research/ethics principles."),
    "ANTHROPIC-CONSTITUTIONAL-AI": dict(name="Anthropic Constitutional AI", short="anthropic_cai",
                                        region="GLOBAL", kind="industry-voluntary", binding=False,
                                        cite="Anthropic (vendor practice)",
                                        note="Vendor alignment method; useful as control evidence."),
    "OPENAI-MODEL-SPEC": dict(name="OpenAI Model Spec", short="openai_spec", region="GLOBAL",
                              kind="industry-voluntary", binding=False,
                              cite="OpenAI Model Spec (vendor practice)",
                              note="Vendor behaviour spec; useful as control evidence."),
}

# Region -> which of OUR frameworks are binding vs advisory there (curated, honest).
# Empty 'binding' is itself informative (US/UK have no horizontal AI statute yet).
REGIONS = {
    "EU": dict(label="European Union", binding=["EU-AI-ACT"],
               advisory=["OECD-AI-PRINCIPLES", "UNESCO-AI-ETHICS", "IEEE-ETHICALLY-ALIGNED-DESIGN",
                         "G7-G20-AI-PRINCIPLES"],
               also="GDPR (2016/679), EU Machinery Regulation 2023/1230 + ISO 13482 for "
                    "physical/care robots (sector law — not yet crosswalked)."),
    "UK": dict(label="United Kingdom", binding=[],
               advisory=["UK-AISI", "OECD-AI-PRINCIPLES", "G7-G20-AI-PRINCIPLES", "UNESCO-AI-ETHICS"],
               also="No horizontal AI Act yet — pro-innovation, regulator-led (ICO/CMA/MHRA/HSE). "
                    "UK GDPR + DPA 2018 still bind."),
    "US": dict(label="United States", binding=[],
               advisory=["NIST-AI-RMF", "OECD-AI-PRINCIPLES", "G7-G20-AI-PRINCIPLES"],
               also="No federal AI statute — sectoral + a state patchwork (e.g. Colorado AI Act, "
                    "NYC Local Law 144). NIST RMF is the de-facto baseline."),
    "CA": dict(label="Canada", binding=[],
               advisory=["MONTREAL-DECLARATION", "OECD-AI-PRINCIPLES", "G7-G20-AI-PRINCIPLES"],
               also="AIDA (Bill C-27) proposed, not yet in force. PIPEDA binds for privacy."),
    "APAC": dict(label="APAC (Singapore-led)", binding=[],
                 advisory=["SINGAPORE-AGENTIC-AI", "OECD-AI-PRINCIPLES", "UNESCO-AI-ETHICS"],
                 also="Largely principles-based; Singapore IMDA framework is the regional anchor."),
    "GLOBAL": dict(label="Global / cross-border default", binding=[],
                   advisory=["UNESCO-AI-ETHICS", "OECD-AI-PRINCIPLES", "IEEE-ETHICALLY-ALIGNED-DESIGN",
                             "G7-G20-AI-PRINCIPLES", "ASILOMAR-AI-PRINCIPLES",
                             "ANTHROPIC-CONSTITUTIONAL-AI", "OPENAI-MODEL-SPEC"],
                   also="When an agent has no single home jurisdiction, govern to the union via the "
                        "CSOAI charter and crosswalk down to whichever region it enters."),
}

# topic -> a plain-English obligation (what you must actually DO). Generic + accurate;
# the per-framework topics_covered drive which of these surface. Not legal advice.
TOPIC_OBLIGATION = {
    "transparency": "Disclose to people when they are interacting with AI, and what it does.",
    "explainability": "Be able to explain, in proportion to risk, how a decision was reached.",
    "human oversight": "Keep a human able to understand, intervene in, and override the system.",
    "accountability": "Name a responsible owner and keep an auditable record of decisions.",
    "bias": "Test for, document, and mitigate discriminatory or unfair outcomes.",
    "fairness": "Ensure comparable treatment across groups; monitor for disparate impact.",
    "privacy": "Minimise personal data, establish a lawful basis, and honour data rights.",
    "safety": "Run a risk assessment, set guardrails, and report serious incidents.",
    "consent": "Obtain informed, revocable consent where the law or context requires it.",
    "governance": "Maintain a documented governance/management system (roles, policy, review).",
    "ethics": "Apply a published ethics policy and review high-impact uses against it.",
}


def load_frameworks():
    out = {}
    pivot = {}  # csoai_article -> {fw_id: [target_reference,...]}
    for path in sorted(glob.glob(os.path.join(SRC, "CSOAI-*-CROSSWALK.json"))):
        base = os.path.basename(path)
        fid = base.replace("CSOAI-", "").replace("-CROSSWALK.json", "")
        if fid == "MASTER-UNIFIED":
            continue  # union, not a target framework
        meta = FW_META.get(fid)
        if not meta:
            continue  # only frameworks we have curated jurisdiction facts for
        d = json.load(open(path))
        maps = d.get("mappings") or []
        samples = []
        for m in maps:
            art = (m.get("csoai_article") or "").strip()
            ref = (m.get("target_reference") or "").strip()
            if not art:
                continue
            ref = ref[:240]
            eq = (m.get("equivalence") or "partial").strip()
            samples.append({"article": art, "ref": ref, "equivalence": eq})
            pivot.setdefault(art, {}).setdefault(fid, []).append(ref)
        out[fid] = {
            "id": fid, "name": meta["name"], "short": meta["short"],
            "region": meta["region"], "kind": meta["kind"], "binding": meta["binding"],
            "cite": meta["cite"], "note": meta["note"],
            "topics": d.get("topics_covered") or [],
            "total_mappings": int(d.get("total_mappings") or len(maps)),
            "sample_mappings": samples,
        }
    return out, pivot


def main():
    fws, pivot = load_frameworks()
    # crosswalk MCPs we ship alongside the framework crosswalks (domain pairs)
    crosswalk_mcps = [
        {"id": "dora-nis2", "name": "DORA ↔ NIS2", "domain": "EU financial + cyber resilience"},
        {"id": "csoai-governance", "name": "CSOAI governance crosswalk", "domain": "charter ↔ control sets"},
        {"id": "drcf-agent", "name": "DRCF agent crosswalk", "domain": "UK digital regulators' agent guidance"},
        {"id": "asc-rspca", "name": "ASC ↔ RSPCA", "domain": "aquaculture/animal-welfare assurance"},
    ]
    bundle = {
        "meta": {
            "product": "MEOK LAW",
            "source": "CSOAI crosswalk-json (MEOK AI Labs)",
            "hub": "CSOAI 52-article Partnership Charter (the pivot for cross-region mapping)",
            "framework_crosswalks": len(fws),
            "crosswalk_mcps": len(crosswalk_mcps),
            "coverage_note": (
                f"{len(fws)} framework crosswalks + {len(crosswalk_mcps)} domain crosswalk MCPs "
                "wired today. This is informational governance mapping, NOT legal advice."),
            "generated_from": "tools/build_law_bundle.py",
        },
        "frameworks": fws,
        "regions": REGIONS,
        "topic_obligations": TOPIC_OBLIGATION,
        "pivot": pivot,
        "crosswalk_mcps": crosswalk_mcps,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(bundle, f, separators=(",", ":"))
    size = os.path.getsize(OUT)
    print(f"wrote {OUT}  ({size//1024} KB)")
    print(f"  frameworks: {len(fws)}  pivot-articles: {len(pivot)}  mcps: {len(crosswalk_mcps)}")
    print(f"  regions: {', '.join(REGIONS)}")
    # sanity: total real mappings represented
    print(f"  total_mappings (declared): {sum(f['total_mappings'] for f in fws.values())}")


if __name__ == "__main__":
    main()
