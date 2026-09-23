#!/usr/bin/env python3
"""agentic_taxonomy_crosswalk.py — our measurement axes against a published agentic-risk taxonomy.

Emits BOTH the machine artifact and the human page from ONE table, so the two can never drift
apart and a later edit to the page cannot quietly change the mapping.

    agentic_taxonomy_crosswalk.py --build     write the .json and the .md
    agentic_taxonomy_crosswalk.py --verify    re-derive and fail if the published files differ
    agentic_taxonomy_crosswalk.py --axes      check the axis list against the live board

WHAT THIS IS. A mapping from the 23 axes on our public board to the threat classes of the
OWASP Agentic Security Initiative's taxonomy, and — the half that is worth more — an explicit
list of the classes **no axis of ours addresses**. Gaps are findings. A crosswalk is not
coverage: naming a class beside an axis says the axis speaks to it, never that the class is
handled, and certainly never that anything is certified or conformant.

LICENCE. The source taxonomy is CC BY-SA 4.0. This crosswalk uses its class identifiers and
names, so it is treated as an adaptation and published under the SAME licence — CC-BY-SA-4.0
— not under the estate's usual CC-BY-4.0. That difference is deliberate and is recorded in
the artifact. OWASP has not reviewed, approved or endorsed this; naming the document is
factual provenance, not affiliation.

PROVENANCE OF THE SOURCE, stated at the level it was actually verified:
  - title, version, date and licence: read from the publisher's own resource page
    (https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/), 2026-09-23.
  - the T1..T15 identifiers and names: NOT read from the primary PDF, which is behind a
    download this lane did not complete. They are taken from secondary sources and
    cross-checked between them. One secondary source refers to T1..T17, which could not be
    reconciled against the primary. This is recorded in the artifact as a limitation rather
    than smoothed over.

CC-BY-SA-4.0 (see LICENCE above). Council of AI (CSOAI Ltd, UK Companies House 16939677).
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
OUT = os.path.join(REPO, "public", "interop", "crosswalk")
STEM = "agentic-threat-taxonomy-crosswalk-2026-09-23"

SOURCE = {
    "title": "Agentic AI – Threats and Mitigations",
    "version": "v1.0",
    "published": "2025-02-17",
    "publisher": "OWASP Agentic Security Initiative, OWASP GenAI Security Project",
    "url": "https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/",
    "license": "CC-BY-SA-4.0 (Creative Commons Attribution-ShareAlike 4.0 International)",
    "license_as_published": (
        "Unless otherwise specified, all content on the site is Creative Commons "
        "Attribution-ShareAlike v4.0 and provided without warranty of service or accuracy."
    ),
    "license_source": "publisher's own site footer, read 2026-09-23",
    "trademark_notice": "OWASP and the OWASP logo are trademarks of the OWASP Foundation, Inc.",
    "verified_from_primary": ["title", "version", "published", "license", "trademark_notice"],
    "not_verified_from_primary": [
        "the T1..T15 identifiers and names below: taken from secondary sources and "
        "cross-checked between them, because the primary PDF was not retrieved by this lane",
        "one secondary source refers to T1..T17; that count could not be reconciled against "
        "the primary and is recorded here rather than resolved",
    ],
}

ATTRIBUTION = (
    "Contains material from “Agentic AI – Threats and Mitigations” (v1.0, February 2025) "
    "by the OWASP Agentic Security Initiative, OWASP GenAI Security Project, "
    "https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/ — licensed under "
    "Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0). This crosswalk "
    "is an adaptation and is published under the same licence. OWASP and the OWASP logo are "
    "trademarks of the OWASP Foundation, Inc. OWASP has not reviewed, approved or endorsed "
    "this crosswalk; the document is named as factual provenance, not as affiliation or "
    "endorsement."
)

# ── the classes, and what of ours speaks to each ─────────────────────────────────────────
# relation: DIRECT   the axis's task IS a measurement of this class's failure mode
#           ADJACENT the axis measures something that bears on the class without being it
#           (absent)  no axis of ours addresses the class
CLASSES = [
    ("T1", "Memory Poisoning", [],
     "No axis of ours inspects an agent's persisted memory or measures whether injected "
     "content survives into a later decision. Every behavioural axis grades a single "
     "stateless exchange against a frozen bank, so a fault that only appears across turns "
     "cannot show up on this board at all."),

    ("T2", "Tool Misuse", [("effect-binding", "DIRECT"), ("conformance", "ADJACENT")],
     "effect-binding asks the question this class is about: does authorization bind to the "
     "request the server actually executes, or only to the tool call the agent declared. "
     "conformance measures a model against the tool protocol's own rules, which is the "
     "surface tool misuse travels over, not the misuse."),

    ("T3", "Privilege Compromise", [("effect-binding", "DIRECT"), ("cross-reality", "ADJACENT")],
     "effect-binding is a probe of servers, and the gap it measures is a privilege gap. "
     "cross-reality grades whether an agent claims the authority to act (PROCEED / CONFIRM / "
     "REFUSE), which is a judgement about privilege rather than a test of enforcement."),

    ("T4", "Resource Overload", [],
     "Nothing on the board measures exhaustion of compute, memory or a downstream service. "
     "Our own engine was stopped by exactly this on the day this crosswalk was written — by "
     "free disk, not by an attacker — and no axis would have caught it."),

    ("T5", "Cascading Hallucination Attacks", [],
     "No axis measures propagation: every axis grades one answer, never what a wrong answer "
     "does to the next step. The estate does run a separate corrections-propagation watch "
     "over third-party pages, but that is not an axis, it measures published corrections "
     "rather than model output, and it must not be quoted as coverage of this class."),

    ("T6", "Intent Breaking & Goal Manipulation",
     [("safety", "ADJACENT"), ("art5-safeguard", "ADJACENT")],
     "safety grades calibrated refusal on paired requests and art5-safeguard grades whether a "
     "prohibited practice is tripped — both measure resistance to being talked into an "
     "outcome. Neither measures a plan or a goal being rewritten mid-task, which is what this "
     "class names."),

    ("T7", "Misaligned & Deceptive Behaviors", [("care", "ADJACENT"), ("affect", "ADJACENT")],
     "care scores protecting against helping on paired conduct scenarios and affect covers "
     "manipulation, disclosure and vulnerability. Both are about behaviour toward a person. "
     "Neither tests for an agent concealing its own behaviour from an operator."),

    ("T8", "Repudiation & Untraceability",
     [("provenance", "ADJACENT"), ("detector-interop", "ADJACENT")],
     "provenance measures whether content marking survives, and detector-interop measures "
     "whether detectors agree across implementations — traceability of OUTPUT. No axis "
     "measures whether an agent's ACTIONS are logged and attributable, which is the class. "
     "Our own signing and receipt apparatus addresses this for our artifacts, and that is an "
     "estate practice, not a measurement of anyone."),

    ("T9", "Identity Spoofing & Impersonation", [("provenance-controls", "ADJACENT")],
     "provenance-controls reads issuer-identity binding facts on-chain — identity, but of a "
     "financial issuer, in a different domain. No axis measures agent or user impersonation."),

    ("T10", "Overwhelming Human-in-the-Loop", [("cross-reality", "ADJACENT")],
     "cross-reality measures whether a model hands a decision back to a human at all. It says "
     "nothing about the volume or fatigue that this class is about: an oversight rate is not "
     "an oversight load."),

    ("T11", "Unexpected RCE and Code Attacks", [("jail", "DIRECT")],
     "jail grades escape-attempt detection over a 71-cell gold bank of real code cells "
     "(38 ESCAPE / 33 BENIGN). It measures DETECTION of such code, not prevention of its "
     "execution, and the distinction is the whole difference between this axis and a control."),

    ("T12", "Agent Communication Poisoning",
     [("swarm", "ADJACENT"), ("conformance", "ADJACENT")],
     "swarm grades multi-agent coordination safety and conformance grades the tool protocol "
     "the messages travel over. Neither injects a poisoned message into a channel and "
     "measures what the receiving agent then does."),

    ("T13", "Rogue Agents in Multi-Agent Systems", [("swarm", "ADJACENT")],
     "swarm is the only axis with more than one agent in it, and it grades coordination "
     "safety rather than the detection of a compromised or unmonitored participant."),

    ("T14", "Human Attacks on Multi-Agent Systems", [],
     "No axis models a human exploiting trust between agents. The board has no adversarial "
     "human in it anywhere: every bank is a frozen set of items, not an interactive opponent."),

    ("T15", "Human Manipulation", [("affect", "DIRECT"), ("care", "ADJACENT")],
     "affect grades emotional and embodied safety across manipulation, disclosure and "
     "vulnerability, which is this class stated as a measurement. care scores the "
     "protect-against-help trade-off that manipulation exploits."),
]

# Axes that speak to no class in this taxonomy. Listed explicitly, because a crosswalk that
# only shows hits invites a reader to assume the rest of the board is agentic-risk coverage.
AXES_NO_CLASS = {
    "governance": "EU AI Act risk-tier classification — a regulatory classification task.",
    "continuity": "post-quantum status of a cryptographic assumption — cryptographic, not agentic.",
    "openness": "licence reasoning versus intended use — a licensing question.",
    "machinery-conformity": "Machinery Regulation safety-function classification — product regulation.",
    "reserve-attestation": "deterministic-facts axis over financial issuer disclosures.",
    "regulatory-framework": "deterministic-facts axis over financial issuer disclosures.",
    "distribution-integrity": "deterministic-facts axis over financial issuer disclosures.",
    "custody-disclosure": "deterministic-facts axis over financial issuer disclosures.",
    "ai-adoption-components": "cited public statistical series, graded by rule. No model, no agent.",
    "labour-components": "cited public statistical series, graded by rule. No model, no agent.",
    "humanoid-labour-index": "does a named vendor publish a dated deployment count. A disclosure fact.",
}

MODEL_COMPARISON = ["governance", "safety", "provenance", "continuity", "conformance",
                    "openness", "machinery-conformity", "care", "cross-reality",
                    "detector-interop", "art5-safeguard", "swarm", "affect", "jail"]
DETERMINISTIC_FACTS = ["effect-binding", "provenance-controls", "reserve-attestation",
                       "regulatory-framework", "distribution-integrity", "custody-disclosure",
                       "ai-adoption-components", "labour-components", "humanoid-labour-index"]


def build_doc() -> dict:
    classes = []
    for tid, name, axes, note in CLASSES:
        classes.append({
            "id": tid,
            "name": name,
            "axes": [{"axis": a, "relation": r} for a, r in axes],
            "direct": [a for a, r in axes if r == "DIRECT"],
            "adjacent": [a for a, r in axes if r == "ADJACENT"],
            "addressed_by_any_axis": bool(axes),
            "note": note,
        })
    no_axis = [c["id"] for c in classes if not c["addressed_by_any_axis"]]
    adjacent_only = [c["id"] for c in classes if c["adjacent"] and not c["direct"]]
    direct = [c["id"] for c in classes if c["direct"]]
    return {
        "schema": "csoai.agentic-threat-taxonomy-crosswalk/0.1",
        "as_of": "2026-09-23",
        "license": "CC-BY-SA-4.0",
        "license_note": (
            "This file is CC-BY-SA-4.0, NOT the estate's usual CC-BY-4.0, because it adapts a "
            "CC BY-SA 4.0 taxonomy and share-alike carries over. Licence differs by artifact on "
            "this estate; name the artifact, never “the licence”."
        ),
        "publisher": "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
        "attribution": ATTRIBUTION,
        "source": SOURCE,
        "what_this_is": (
            "A mapping from the axes on GET /api/gspc to the threat classes of a published "
            "agentic-risk taxonomy, built to align with that taxonomy's vocabulary. A named "
            "class beside an axis means the axis SPEAKS TO it. It does not mean the class is "
            "handled, mitigated, covered or conformant, and nothing here certifies anything "
            "— not our systems and not anyone else's."
        ),
        "what_this_is_not": [
            "Not coverage. Relation DIRECT means the axis's task is a measurement of that "
            "class's failure mode, at the sample size the board publishes, and nothing more.",
            "Not a conformity statement, a certification or an endorsement, and no "
            "organisation has reviewed or approved it.",
            "Not a claim about anyone else's systems. Every axis measures models or public "
            "artifacts against a frozen bank; none of it is an assertion of falsity about a "
            "vendor.",
            "Not stable. Axes move; re-derive from the live board rather than quoting this file "
            "as the current shape of the board.",
        ],
        "relation_vocabulary": {
            "DIRECT": "the axis's task is a measurement of this class's failure mode",
            "ADJACENT": "the axis measures something that bears on the class without being it",
        },
        "axes": {
            "model_comparison": MODEL_COMPARISON,
            "deterministic_facts": DETERMINISTIC_FACTS,
            "total": len(MODEL_COMPARISON) + len(DETERMINISTIC_FACTS),
            "note": "14 model-comparison axes and 9 deterministic-fact axes, as GET /api/gspc "
                    "reports them on 2026-09-23. Derive the counts from the endpoint, not here.",
        },
        "classes": classes,
        "gaps": {
            "classes_no_axis_addresses": no_axis,
            "classes_no_axis_addresses_count": len(no_axis),
            "classes_with_adjacent_only": adjacent_only,
            "classes_with_adjacent_only_count": len(adjacent_only),
            "classes_with_a_direct_axis": direct,
            "classes_with_a_direct_axis_count": len(direct),
            "classes_total": len(classes),
            "axes_addressing_no_class": sorted(AXES_NO_CLASS),
            "axes_addressing_no_class_count": len(AXES_NO_CLASS),
            "axes_addressing_no_class_why": AXES_NO_CLASS,
            "reading": (
                "Four of fifteen classes have a DIRECT axis. Four have no axis at all. Seven "
                "are touched only adjacently, which for a reader looking for assurance is "
                "nearer to nothing than to something. Eleven of our twenty-three axes speak to "
                "no class in this taxonomy — they are regulatory, cryptographic, licensing and "
                "financial-disclosure measurements, and the board must never be quoted as "
                "agentic-risk coverage on their account."
            ),
            "structural_limits_behind_the_gaps": [
                "Every behavioural axis grades one stateless exchange against a frozen bank, so "
                "any class whose failure only appears across turns (T1, T5) is out of reach by "
                "construction, not by oversight.",
                "No bank contains an adversarial human or a live opponent, so T14 cannot be "
                "measured by anything on the board.",
                "Detection is not prevention. Where an axis grades whether a model NOTICES a "
                "hostile input (T11), that is a different quantity from whether a system stops "
                "it, and no axis measures the second.",
            ],
        },
    }


def render_md(doc: dict) -> str:
    L = []
    A = L.append
    A("# Our axes against a published agentic-risk taxonomy")
    A("")
    A(doc["what_this_is"])
    A("")
    A("**Licence: CC-BY-SA-4.0** — not the estate's usual CC-BY-4.0. This page adapts a "
      "CC BY-SA 4.0 taxonomy and share-alike carries over.")
    A("")
    A("> " + ATTRIBUTION.replace("\n", " "))
    A("")
    A("## The mapping")
    A("")
    A("`DIRECT` — the axis's task is a measurement of that class's failure mode. "
      "`ADJACENT` — the axis bears on the class without being a measurement of it. "
      "A named class beside an axis is **not** coverage and **not** a conformity statement.")
    A("")
    A("| class | our axes | reading |")
    A("|---|---|---|")
    for c in doc["classes"]:
        axes = ", ".join("`%s` (%s)" % (a["axis"], a["relation"]) for a in c["axes"]) or "**none**"
        A("| **%s %s** | %s | %s |" % (c["id"], c["name"], axes, c["note"]))
    A("")
    A("## The gaps, which are the findings")
    A("")
    g = doc["gaps"]
    A("- **%d of %d classes have a DIRECT axis**: %s"
      % (g["classes_with_a_direct_axis_count"], g["classes_total"],
         ", ".join(g["classes_with_a_direct_axis"])))
    A("- **%d of %d classes have no axis of ours at all**: %s"
      % (g["classes_no_axis_addresses_count"], g["classes_total"],
         ", ".join(g["classes_no_axis_addresses"])))
    A("- **%d of %d classes are touched only adjacently**: %s"
      % (g["classes_with_adjacent_only_count"], g["classes_total"],
         ", ".join(g["classes_with_adjacent_only"])))
    A("- **%d of %d of our axes speak to no class in this taxonomy**: %s"
      % (g["axes_addressing_no_class_count"], doc["axes"]["total"],
         ", ".join("`%s`" % a for a in g["axes_addressing_no_class"])))
    A("")
    A(g["reading"])
    A("")
    A("### Why the gaps are structural, not an oversight")
    A("")
    for s in g["structural_limits_behind_the_gaps"]:
        A("- " + s)
    A("")
    A("## What this is not")
    A("")
    for s in doc["what_this_is_not"]:
        A("- " + s)
    A("")
    A("## Provenance of the source, at the level it was verified")
    A("")
    A("| field | value |")
    A("|---|---|")
    for k in ("title", "version", "published", "publisher", "url", "license"):
        A("| %s | %s |" % (k, doc["source"][k]))
    A("")
    A("Verified from the publisher's own page: %s."
      % ", ".join(doc["source"]["verified_from_primary"]))
    A("")
    A("Not verified from the primary document:")
    for s in doc["source"]["not_verified_from_primary"]:
        A("- " + s)
    A("")
    A("Licence line as the publisher states it: “%s”"
      % doc["source"]["license_as_published"])
    A("")
    A("---")
    A("")
    A("Council of AI (CSOAI Ltd, UK Companies House 16939677), councilof.ai. "
      "This crosswalk is CC-BY-SA-4.0. Board data at `GET /api/gspc` is CC-BY-4.0. "
      "Licence differs by artifact; name the artifact.")
    return "\n".join(L) + "\n"


def paths():
    return os.path.join(OUT, STEM + ".json"), os.path.join(OUT, STEM + ".md")


def cmd_build() -> int:
    doc = build_doc()
    pj, pm = paths()
    os.makedirs(OUT, exist_ok=True)
    with open(pj, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, indent=1, sort_keys=True, ensure_ascii=False)
        fh.write("\n")
    with open(pm, "w", encoding="utf-8") as fh:
        fh.write(render_md(doc))
    print("wrote %s\nwrote %s" % (pj, pm))
    return 0


def cmd_verify() -> int:
    doc = build_doc()
    pj, pm = paths()
    bad = []
    if not os.path.exists(pj) or json.load(open(pj, encoding="utf-8")) != doc:
        bad.append("%s differs from what this generator produces" % pj)
    if not os.path.exists(pm) or open(pm, encoding="utf-8").read() != render_md(doc):
        bad.append("%s differs from what this generator produces" % pm)
    # the licence must not silently revert to the estate default
    if doc["license"] != "CC-BY-SA-4.0":
        bad.append("share-alike dropped: an adaptation of a CC BY-SA work must stay CC-BY-SA-4.0")
    if "OWASP has not reviewed, approved or endorsed" not in doc["attribution"]:
        bad.append("the no-endorsement sentence is missing from the attribution block")
    for f in bad:
        print("  FAIL  " + f)
    if bad:
        return 1
    print("  PASS  published crosswalk matches its generator, licence and attribution intact")
    return 0


def cmd_axes() -> int:
    """The axis list is a claim about the live board. Check it rather than trusting the table."""
    req = urllib.request.Request("https://councilof.ai/api/gspc", headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/140.0 Safari/537.36"})
    try:
        live = json.load(urllib.request.urlopen(req, timeout=60))
    except Exception as e:  # noqa: BLE001
        print("  UNCHECKABLE  could not fetch the live board: %s" % type(e).__name__)
        return 0  # an unreachable board is not a failed crosswalk; say so and stop
    ours = set(MODEL_COMPARISON) | set(DETERMINISTIC_FACTS)
    theirs = {a["axis"] for a in live.get("axes", [])}
    missing, extra = sorted(theirs - ours), sorted(ours - theirs)
    named = set()
    for _, _, axes, _ in CLASSES:
        named |= {a for a, _ in axes}
    unknown = sorted(named - theirs)
    ok = True
    for label, s in (("on the live board but not in this crosswalk", missing),
                     ("in this crosswalk but not on the live board", extra),
                     ("named in a class row but not an axis", unknown)):
        if s:
            ok = False
            print("  FAIL  %s: %s" % (label, ", ".join(s)))
    covered = sorted(named) + sorted(AXES_NO_CLASS)
    dupes = sorted({a for a in covered if covered.count(a) > 1})
    if dupes:
        ok = False
        print("  FAIL  axis both mapped and listed as mapping to no class: %s" % ", ".join(dupes))
    unaccounted = sorted(theirs - named - set(AXES_NO_CLASS))
    if unaccounted:
        ok = False
        print("  FAIL  axis neither mapped nor listed as unmapped: %s" % ", ".join(unaccounted))
    if ok:
        print("  PASS  all %d live axes are accounted for: %d mapped, %d explicitly unmapped"
              % (len(theirs), len(named), len(AXES_NO_CLASS)))
    return 0 if ok else 1


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--build", action="store_true")
    p.add_argument("--verify", action="store_true")
    p.add_argument("--axes", action="store_true")
    a = p.parse_args()
    if not any(vars(a).values()):
        p.print_help()
        return 0
    rc = 0
    if a.build:
        rc |= cmd_build()
    if a.verify:
        rc |= cmd_verify()
    if a.axes:
        rc |= cmd_axes()
    return rc


if __name__ == "__main__":
    sys.exit(main())
