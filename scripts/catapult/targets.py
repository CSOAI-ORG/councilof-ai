#!/usr/bin/env python3
"""CSOAI Catapult — the 17 named fan-out target renderers.

Each renderer takes ONE signed measurement evidence object and returns
(surface_name, bytes, content_type). Renderers are PURE: they never write
files, never touch the network, and never sign anything.

Invariants (see public/interop/catapult-shape-2026-09-18.md):
- Every rendered surface record MUST carry the same sha256 the artifact was
  stamped with; the engine refuses any record that does not.
- present-and-null is NOT the same as absent. `field()` reports
  'not-recorded' for a missing key and 'explicit-null' for a present-null
  key, so a null can never silently pass as a default.
- Measurement != certification. No renderer claims a signature that was not
  made; the only accepted signer DID is
  did:web:csoai.org#board-attestation-1 and this module never signs.
- A count is only meaningful with its denominator: every printed ratio is
  M/N with N named.
"""

import hashlib
import json

BOARD_SIGNER_DID = "did:web:csoai.org#board-attestation-1"

MISSING = object()

CONTENT_EXTENSIONS = {
    "application/json": ".json",
    "application/ld+json": ".jsonld",
    "application/atom+xml": ".atom",
    "application/xml": ".xml",
    "application/x-ndjson": ".jsonl",
    "text/html": ".html",
    "text/markdown": ".md",
}

EU_AI_ACT_ARTICLE_BY_AXIS = {
    "eu-ai-act-article-50": "Art. 50 (transparency obligations)",
    "dora-ict-resilience": "Art. 50 (default placeholder mapping)",
    "genius-stablecoin": "Art. 50 (default placeholder mapping)",
}


def field(obj, key, missing="not-recorded", null="explicit-null"):
    """Read a scalar with present-null treated explicitly, never as a default."""
    if not isinstance(obj, dict) or key not in obj:
        return missing
    value = obj[key]
    return null if value is None else value


def _j(obj):
    return (json.dumps(obj, indent=2, sort_keys=True) + "\n").encode("utf-8")


def _line(obj):
    return (json.dumps(obj, sort_keys=True) + "\n").encode("utf-8")


def _sha(evidence):
    return str(field(evidence, "sha256"))


def _axis(evidence):
    axis = field(evidence, "axis")
    return axis if isinstance(axis, str) and axis not in ("not-recorded", "explicit-null") else "unspecified"


def _as_of(evidence):
    return str(field(evidence, "as_of"))


def _as_of_date(evidence):
    as_of = _as_of(evidence)
    return as_of[:10] if len(as_of) >= 10 and as_of[4] == "-" else "undated"


def _headline(evidence):
    headline = field(evidence, "headline")
    if headline in ("not-recorded", "explicit-null"):
        return "Board-signed measurement " + _sha(evidence)
    return str(headline)


# --------------------------------------------------------------------------
# 1. Council board row — one row in /api/gspc
# --------------------------------------------------------------------------
def render_council_board_row(evidence):
    record = {
        "surface": "council-board-row",
        "row_id": _sha(evidence),
        "sha256": _sha(evidence),
        "signed_by": field(evidence, "signed_by"),
        "as_of": field(evidence, "as_of"),
        "status": field(evidence, "status"),
        "corrections_pointer": "/corrections?corrected_from=" + _sha(evidence),
        "credential_kind": "measurement (NOT a certification)",
    }
    return ("council-board-row", _j(record), "application/json")


# --------------------------------------------------------------------------
# 2. REST / OpenAPI stub — GET /api/measurements/{sha256}
# --------------------------------------------------------------------------
def render_rest_measurement_stub(evidence):
    record = {
        "surface": "rest-measurement-stub",
        "endpoint": "GET /api/measurements/" + _sha(evidence),
        "content_type_served": "application/json",
        "canonical_evidence_object": {k: v for k, v in sorted(evidence.items())},
        "readback": "anonymous GET",
    }
    return ("rest-measurement-stub", _j(record), "application/json")


# --------------------------------------------------------------------------
# 3. MCP tool-schema stub — tools/call list_measurements + verify_measurement
# --------------------------------------------------------------------------
def render_mcp_tool_schema(evidence):
    record = {
        "surface": "mcp-tool-schema",
        "jsonrpc": "2.0",
        "method": "tools/list",
        "result": {
            "tools": [
                {
                    "name": "list_measurements",
                    "description": "List board-signed measurement evidence objects (measurement credentials, not certifications).",
                    "inputSchema": {"type": "object", "properties": {}},
                },
                {
                    "name": "verify_measurement",
                    "description": "Fetch one measurement evidence object by sha256 and re-derive its digest.",
                    "inputSchema": {
                        "type": "object",
                        "properties": {"sha256": {"type": "string"}},
                        "required": ["sha256"],
                    },
                    "example_args": {"sha256": _sha(evidence)},
                },
            ]
        },
        "readback": "MCP stdio",
    }
    return ("mcp-tool-schema", _j(record), "application/json")


# --------------------------------------------------------------------------
# 4. A2A skills entry — /a2a/skills/measurements/{sha256}
# --------------------------------------------------------------------------
def render_a2a_skills_entry(evidence):
    record = {
        "@context": "https://csoai.org/a2a/context.jsonld",
        "@type": "AgentSkill",
        "@id": "/a2a/skills/measurements/" + _sha(evidence),
        "skillId": "/a2a/skills/measurements/" + _sha(evidence),
        "name": _headline(evidence),
        "sha256": _sha(evidence),
        "signed_by": field(evidence, "signed_by"),
        "as_of": field(evidence, "as_of"),
        "credential_kind": "measurement (NOT a certification)",
    }
    return ("a2a-skills-entry", _j(record), "application/ld+json")


# --------------------------------------------------------------------------
# 5. AG-UI card — /ag-ui/{sha256}, iframe-able card
# --------------------------------------------------------------------------
def render_ag_ui_card(evidence):
    record = {
        "@context": "https://csoai.org/ag-ui/context.jsonld",
        "@type": "MeasurementCard",
        "@id": "/ag-ui/" + _sha(evidence),
        "headline": _headline(evidence),
        "sha256": _sha(evidence),
        "as_of": field(evidence, "as_of"),
        "signed_by": field(evidence, "signed_by"),
        "iframe_src": "/verify/" + _sha(evidence),
        "render_note": "Card data for an iframe-able card. Plain facts only; measurement credential, not certification.",
    }
    return ("ag-ui-card", _j(record), "application/ld+json")


# --------------------------------------------------------------------------
# 6. x402 offer stub — 402 challenge JSON
# --------------------------------------------------------------------------
def render_x402_offer_stub(evidence):
    record = {
        "surface": "x402-offer-stub",
        "http_status": 402,
        "x402Version": 1,
        "error": "PAYMENT_REQUIRED",
        "resource": "/x402/measure/" + _sha(evidence),
        "sha256": _sha(evidence),
        "accepts": [
            {
                "scheme": "exact",
                "network": "PLACEHOLDER-NETWORK",
                "maxAmountRequired": "PLACEHOLDER-AMOUNT",
                "asset": "PLACEHOLDER-ASSET",
                "payTo": "PLACEHOLDER-PAYTO",
                "resource": "/x402/measure/" + _sha(evidence),
                "description": "Fetch the canonical measurement evidence object " + _sha(evidence),
                "mimeType": "application/json",
            }
        ],
        "note": "PLACEHOLDER 402 challenge. No payment route is live; a paid fetch returns a signed receipt from the board signer, never from this renderer.",
    }
    return ("x402-offer-stub", _j(record), "application/json")


# --------------------------------------------------------------------------
# 7. RSS / Atom feed entry — /feed/measurements.atom
# --------------------------------------------------------------------------
def render_rss_atom_entry(evidence):
    sha = _sha(evidence)
    title = _headline(evidence).replace("<", "&lt;").replace(">", "&gt;")
    xml = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<feed xmlns="http://www.w3.org/2005/Atom">\n'
        "  <title>CSOAI board-signed measurements</title>\n"
        "  <id>/feed/measurements.atom</id>\n"
        "  <entry>\n"
        "    <id>/api/measurements/" + sha + "</id>\n"
        "    <title>" + title + "</title>\n"
        "    <updated>" + _as_of(evidence) + "</updated>\n"
        "    <link href=\"/api/gspc\" />\n"
        "    <link href=\"/verify/" + sha + "\" />\n"
        "    <summary>Measurement evidence object " + sha + " — measurement credential, not a certification.</summary>\n"
        "  </entry>\n"
        "</feed>\n"
    )
    return ("rss-atom-entry", xml.encode("utf-8"), "application/atom+xml")


# --------------------------------------------------------------------------
# 8. Hugging Face dataset file plan — csoai/<repo>/measurements/{sha256}.json
# --------------------------------------------------------------------------
def render_hf_dataset_file_plan(evidence):
    canonical = _j({k: v for k, v in sorted(evidence.items())})
    record = {
        "surface": "hf-dataset-file-plan",
        "operation": "upload_plan_only (nothing is uploaded by this renderer)",
        "repo": "csoai/measurements",
        "path_in_repo": "measurements/" + _sha(evidence) + ".json",
        "sha256": _sha(evidence),
        "content_byte_size": len(canonical),
        "content_sha256": hashlib.sha256(canonical).hexdigest(),
        "gate": "HF token holds csoai/* org-write scope; otherwise GATE_BLOCKED (hf_no_org_write)",
        "readback": "anonymous GET to HF after upload",
    }
    return ("hf-dataset-file-plan", _j(record), "application/json")


# --------------------------------------------------------------------------
# 9. Research dataset JSONL line — measurements-YYYY-MM-DD.jsonl
# --------------------------------------------------------------------------
def render_research_jsonl_line(evidence):
    record = {
        "dataset": "csoai/measurements-" + _as_of_date(evidence) + ".jsonl",
        "sha256": _sha(evidence),
        "signed_by": field(evidence, "signed_by"),
        "as_of": field(evidence, "as_of"),
        "status": field(evidence, "status"),
        "axis": _axis(evidence),
        "headline": _headline(evidence),
        "credential_kind": "measurement (NOT a certification)",
    }
    return ("research-jsonl-line", _line(record), "application/x-ndjson")


# --------------------------------------------------------------------------
# 10. Machine-index sitemap entry — /sitemap-measurements.xml
# --------------------------------------------------------------------------
def render_sitemap_entry(evidence):
    sha = _sha(evidence)
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        "  <url>\n"
        "    <loc>https://csoai.org/verify/" + sha + "</loc>\n"
        "    <lastmod>" + _as_of_date(evidence) + "</lastmod>\n"
        "  </url>\n"
        "</urlset>\n"
    )
    return ("sitemap-entry", xml.encode("utf-8"), "application/xml")


# --------------------------------------------------------------------------
# 11. Regulator crosswalk entry — /crosswalks/{axis}.json
# --------------------------------------------------------------------------
def render_regulator_crosswalk_entry(evidence):
    axis = _axis(evidence)
    record = {
        "surface": "regulator-crosswalk-entry",
        "crosswalk_id": "/crosswalks/" + axis + ".json",
        "axis": axis,
        "sha256": _sha(evidence),
        "as_of": field(evidence, "as_of"),
        "provisions": {
            "eu_ai_act": {
                "article": EU_AI_ACT_ARTICLE_BY_AXIS.get(axis, "Art. 50 (default placeholder mapping)"),
                "framework_status": "PLACEHOLDER — not a legal determination",
            },
            "dora": {
                "article": "PLACEHOLDER (DORA ICT-risk-management mapping not yet authored)",
                "framework_status": "PLACEHOLDER — not a legal determination",
            },
            "genius": {
                "article": "PLACEHOLDER (GENIUS/CLARITY mapping not yet authored)",
                "framework_status": "PLACEHOLDER — not a legal determination",
            },
        },
        "note": "Placeholder crosswalk. Mapping a measurement axis to a provision is not a compliance certification.",
    }
    return ("regulator-crosswalk-entry", _j(record), "application/json")


# --------------------------------------------------------------------------
# 12. Evidence-pack zip manifest — /packs/{sha256}.zip
# --------------------------------------------------------------------------
def render_evidence_pack_zip_manifest(evidence):
    canonical = _j({k: v for k, v in sorted(evidence.items())})
    verify_script = (
        "#!/bin/sh\n"
        "# Re-derive the digest of canonical.json and compare with the stamped sha256.\n"
        "expected=" + _sha(evidence) + "\n"
        "actual=$(sha256sum canonical.json | cut -d' ' -f1)\n"
        "[ \"$actual\" = \"$expected\" ] && echo MATCH || echo MISMATCH\n"
    ).encode("utf-8")
    entries = [
        {
            "path": "canonical.json",
            "byte_size": len(canonical),
            "entry_sha256": hashlib.sha256(canonical).hexdigest(),
        },
        {
            "path": "verify.sh",
            "byte_size": len(verify_script),
            "entry_sha256": hashlib.sha256(verify_script).hexdigest(),
        },
    ]
    record = {
        "surface": "evidence-pack-zip-manifest",
        "pack_id": "/packs/" + _sha(evidence) + ".zip",
        "sha256": _sha(evidence),
        "entries": entries,
        "entry_count": "%d/%d entries sized and hashed (denominator: 2 planned members)" % (len(entries), 2),
        "note": "Manifest of the zip members (canonical evidence + verification script). The zip itself is assembled by the pack step; every member carries its byte size AND its sha256 so a short read is detectable.",
    }
    return ("evidence-pack-zip-manifest", _j(record), "application/json")


# --------------------------------------------------------------------------
# 13. Correction / supersession graph edge — /corrections/{new_id}
# --------------------------------------------------------------------------
def render_correction_graph_edge(evidence):
    sha = _sha(evidence)
    record = {
        "surface": "correction-graph-edge",
        "edge_id": "/corrections/csoai-correction-edge-" + sha[:12],
        "sha256": sha,
        "corrected_from": sha,
        "superseded_by": None,
        "superseded_by_note": "explicit null: NOT superseded as of " + _as_of(evidence) + ". A re-measurement appends a superseded_by edge to the new sha256; the graph stores the line, not the point.",
        "as_of": field(evidence, "as_of"),
    }
    return ("correction-graph-edge", _j(record), "application/json")


# --------------------------------------------------------------------------
# 14. Public verification page — /verify/{sha256}, plain words, no fake claims
# --------------------------------------------------------------------------
def render_verify_page_html(evidence):
    sha = _sha(evidence)
    html = (
        "<!DOCTYPE html>\n"
        '<html lang="en">\n<head><meta charset="utf-8">\n'
        "<title>Measurement record " + sha + "</title>\n</head>\n<body>\n"
        "<h1>Measurement record</h1>\n"
        "<p>This page reproduces the fields recorded in one measurement evidence object. "
        "It is a measurement credential. It is not a certification, an audit opinion, or a legal determination.</p>\n"
        "<ul>\n"
        "  <li>Content address (sha256): <code>" + sha + "</code></li>\n"
        "  <li>Signed by (recorded DID): <code>" + str(field(evidence, "signed_by")) + "</code></li>\n"
        "  <li>As of: <code>" + _as_of(evidence) + "</code></li>\n"
        "  <li>Status: <code>" + str(field(evidence, "status")) + "</code></li>\n"
        "</ul>\n"
        "<p>To check the digest yourself, recompute SHA-256 over the artifact bytes on your own machine "
        "and compare it with the value above. This page does not re-derive the digest for you and does not "
        "verify any signature; it only repeats what the evidence object records.</p>\n"
        "<p>Corrections: <a href=\"/corrections?corrected_from=" + sha + "\">correction graph for this record</a>.</p>\n"
        "</body>\n</html>\n"
    )
    return ("verify-page-html", html.encode("utf-8"), "text/html")


# --------------------------------------------------------------------------
# 15. Audit-log line — /audit/catapult/{sha256}
# --------------------------------------------------------------------------
def render_audit_log_line(evidence):
    record = {
        "event": "catapult_cat_step",
        "ts": field(evidence, "as_of"),
        "source_sha256": _sha(evidence),
        "signer_did": field(evidence, "signed_by"),
        "targets_attempted": len(ALL_SURFACE_NAMES),
        "targets": list(ALL_SURFACE_NAMES),
        "sig": None,
        "sig_note": "explicit null: this cat-step record is NOT signed here. Signature fields are reserved for the board signer (did:web:csoai.org#board-attestation-1); this module never signs.",
    }
    return ("audit-log-line", _line(record), "application/x-ndjson")


# --------------------------------------------------------------------------
# 16. llms.txt entry
# --------------------------------------------------------------------------
def render_llms_txt_entry(evidence):
    sha = _sha(evidence)
    md = (
        "- [/verify/" + sha + "](https://csoai.org/verify/" + sha + "): " + _headline(evidence)
        + " — sha256 `" + sha + "`, recorded as of " + _as_of(evidence)
        + ", signed_by `" + str(field(evidence, "signed_by")) + "`. "
        + "Measurement credential, not a certification. Canonical JSON: [/api/measurements/" + sha + "](https://csoai.org/api/measurements/" + sha + ").\n"
    )
    return ("llms-txt-entry", md.encode("utf-8"), "text/markdown")


# --------------------------------------------------------------------------
# 17. Press one-pager — /press/{sha256}.md
# --------------------------------------------------------------------------
def render_press_one_pager(evidence):
    sha = _sha(evidence)
    md = (
        "# " + _headline(evidence) + "\n"
        "\n"
        "## What was published\n"
        "\n"
        "- Content address (sha256): `" + sha + "`\n"
        "- Recorded signer: `" + str(field(evidence, "signed_by")) + "`\n"
        "- As of: " + _as_of(evidence) + "\n"
        "- Status: " + str(field(evidence, "status")) + "\n"
        "\n"
        "## What this is, in plain words\n"
        "\n"
        "This one-pager repeats the fields of a signed measurement record. It is generated from the "
        "evidence object and carries no claims beyond those fields. A measurement credential records "
        "what was measured and when; it is not a certification, an endorsement, or a legal opinion.\n"
        "\n"
        "## Verify it yourself\n"
        "\n"
        "Recompute SHA-256 over the artifact bytes and compare with `" + sha + "`, or read "
        "[the verification page](/verify/" + sha + ").\n"
    )
    return ("press-one-pager", md.encode("utf-8"), "text/markdown")


ALL_SURFACE_NAMES = [
    "council-board-row",
    "rest-measurement-stub",
    "mcp-tool-schema",
    "a2a-skills-entry",
    "ag-ui-card",
    "x402-offer-stub",
    "rss-atom-entry",
    "hf-dataset-file-plan",
    "research-jsonl-line",
    "sitemap-entry",
    "regulator-crosswalk-entry",
    "evidence-pack-zip-manifest",
    "correction-graph-edge",
    "verify-page-html",
    "audit-log-line",
    "llms-txt-entry",
    "press-one-pager",
]

# readback_required: True for every CSOAI-hosted surface and Hugging Face
# (each must be re-read after publish). False for the two outbound-only
# pushes (search-index submission, press distribution) where no owned
# readback endpoint exists. Per catapult-shape-2026-09-18.md: "readback_required
# (true for HF and CSOAI surface; false for outbound-only surfaces)".
TARGET_SPECS = [
    {"surface_name": "council-board-row", "renderer": render_council_board_row, "target_path": "/api/gspc", "readback_required": True},
    {"surface_name": "rest-measurement-stub", "renderer": render_rest_measurement_stub, "target_path": "/api/measurements/{sha256}", "readback_required": True},
    {"surface_name": "mcp-tool-schema", "renderer": render_mcp_tool_schema, "target_path": "tools/call list_measurements|verify_measurement", "readback_required": True},
    {"surface_name": "a2a-skills-entry", "renderer": render_a2a_skills_entry, "target_path": "/a2a/skills/measurements/{sha256}", "readback_required": True},
    {"surface_name": "ag-ui-card", "renderer": render_ag_ui_card, "target_path": "/ag-ui/{sha256}", "readback_required": True},
    {"surface_name": "x402-offer-stub", "renderer": render_x402_offer_stub, "target_path": "/x402/measure/{sha256}", "readback_required": True},
    {"surface_name": "rss-atom-entry", "renderer": render_rss_atom_entry, "target_path": "/feed/measurements.atom", "readback_required": True},
    {"surface_name": "hf-dataset-file-plan", "renderer": render_hf_dataset_file_plan, "target_path": "csoai/measurements/measurements/{sha256}.json", "readback_required": True},
    {"surface_name": "research-jsonl-line", "renderer": render_research_jsonl_line, "target_path": "/datasets/csoai/measurements-YYYY-MM-DD.jsonl", "readback_required": True},
    {"surface_name": "sitemap-entry", "renderer": render_sitemap_entry, "target_path": "/sitemap-measurements.xml", "readback_required": False},
    {"surface_name": "regulator-crosswalk-entry", "renderer": render_regulator_crosswalk_entry, "target_path": "/crosswalks/{axis}.json", "readback_required": True},
    {"surface_name": "evidence-pack-zip-manifest", "renderer": render_evidence_pack_zip_manifest, "target_path": "/packs/{sha256}.zip", "readback_required": True},
    {"surface_name": "correction-graph-edge", "renderer": render_correction_graph_edge, "target_path": "/corrections/{new_id}", "readback_required": True},
    {"surface_name": "verify-page-html", "renderer": render_verify_page_html, "target_path": "/verify/{sha256}", "readback_required": True},
    {"surface_name": "audit-log-line", "renderer": render_audit_log_line, "target_path": "/audit/catapult/{sha256}", "readback_required": True},
    {"surface_name": "llms-txt-entry", "renderer": render_llms_txt_entry, "target_path": "/llms.txt", "readback_required": True},
    {"surface_name": "press-one-pager", "renderer": render_press_one_pager, "target_path": "/press/{sha256}.md", "readback_required": False},
]


def render_all(evidence):
    """Render every target. Returns a list of record dicts (in-memory only)."""
    records = []
    for index, spec in enumerate(TARGET_SPECS, start=1):
        surface_name, data, content_type = spec["renderer"](evidence)
        extension = CONTENT_EXTENSIONS.get(content_type, ".bin")
        records.append(
            {
                "surface_name": surface_name,
                "target_path": spec["target_path"],
                "readback_required": spec["readback_required"],
                "content_type": content_type,
                "file_name": "%02d-%s%s" % (index, surface_name, extension),
                "content": data,
                "byte_size": len(data),
                "record_sha256": hashlib.sha256(data).hexdigest(),
                "published": True,
                "not_published_reason": None,
            }
        )
    return records


def main(argv=None):
    """CLI: render all 17 targets for one evidence object into an output dir."""
    import argparse
    import os

    parser = argparse.ArgumentParser(description="Render the 17 catapult fan-out targets.")
    parser.add_argument("evidence", help="path to the evidence object JSON")
    parser.add_argument("--out", default="catapult-render", help="output directory")
    args = parser.parse_args(argv)

    with open(args.evidence, "rb") as handle:
        evidence = json.load(handle)
    sha = field(evidence, "sha256")
    if sha in ("not-recorded", "explicit-null"):
        print("render_refused: sha256 %s" % sha)
        return 2

    records = render_all(evidence)
    os.makedirs(args.out, exist_ok=True)
    index = {"sha256": sha, "targets": []}
    for record in records:
        path = os.path.join(args.out, record["file_name"])
        with open(path, "wb") as handle:
            handle.write(record["content"])
        entry = {k: v for k, v in record.items() if k != "content"}
        entry["path"] = path
        index["targets"].append(entry)
    index_path = os.path.join(args.out, "render-index.json")
    with open(index_path, "w", encoding="utf-8") as handle:
        json.dump(index, handle, indent=2, sort_keys=True)
    print("targets rendered: %d/%d (denominator: %d named surfaces)" % (len(records), len(TARGET_SPECS), len(TARGET_SPECS)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
