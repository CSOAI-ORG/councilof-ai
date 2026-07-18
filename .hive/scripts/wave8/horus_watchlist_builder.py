#!/usr/bin/env python3
"""horus_watchlist_builder.py — build a 100-competitor watchlist for Horus OSINT.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd")
OUT = ROOT / ".hive" / "tasks" / "wave8" / "horus_watchlist.json"

VERTICALS = {
    "AI governance / compliance": [
        "c3.ai", "holisticai.com", "fiddler.ai", "arthur.ai", "evidentlyai.com",
        "robustintelligence.com", "truera.com", "arize.com", "whylabs.com", "arize.com",
        "weightsandbiases.com", "mlflow.org", "snorkel.ai", "scale.com", "dataiku.com",
    ],
    "Data cloud / infra": [
        "snowflake.com", "databricks.com", "palantir.com", "mongodb.com", "confluent.io",
        "starburst.io", "dremio.com", "firebolt.io", "clickhouse.com", "tinybird.co",
        "materialize.com", "risingwave.com", "decodable.co", "estuary.dev", "airbyte.com",
    ],
    "Agent infra / frameworks": [
        "langchain.com", "crewai.com", "autogen.ai", "semantic-kernel.azure.net", " LlamaIndex.ai",
        "atomicwork.com", "moveworks.com", "adept.ai", "character.ai", "replika.com",
        "play.ht", "elevenlabs.io", "hume.ai", "voiceflow.com", "stack-ai.com",
    ],
    "MCP / discovery / identity": [
        "anthropic.com", "opik.dev", "glama.ai", "mcp.run", "modelcontextprotocol.io",
        "a2a-protocol.org", "fetch.ai", "oceanprotocol.com", " SingularityNET.io", "alethea.ai",
    ],
    "Construction tech": [
        "procore.com", "autodesk.com", "trimble.com", "builtrobotics.com", "dustyrobotics.com",
        "fieldwire.com", "plangrid.com", "bluebeam.com", "eSub.com", "jobNimbus.com",
    ],
    "Aquaculture tech": [
        "akvagroup.com", "xpertsea.com", "cermaq.com", "aquabyte.no", "trapview.com",
        "eFishery.com", "bioSort.no", "steinsvik.no", "akvasmart.com", "aquaai.com",
    ],
    "Logistics / waste": [
        "samsara.com", "verizonconnect.com", "keeptruckin.com", "convoy.com", "uberfreight.com",
        "project44.com", "fourkites.com", "shippeo.com", "veoci.com", "rubicon.com",
    ],
    "Gaming / RMG compliance": [
        "zeropark.com", "greentube.com", "evolution.com", "entain.com", "flutter.com",
        "bet365.com", "draftkings.com", "fanduel.com", "kindredgroup.com", "SkillOnNet.com",
    ],
    "Frontier labs": [
        "openai.com", "anthropic.com", "deepmind.com", "meta.ai", "mistral.ai",
        "cohere.com", "ai21.com", "stability.ai", "perplexity.ai", "you.com",
    ],
    "UK / EU AI safety": [
        "adalovelaceinstitute.org", "futureofhumanity.org", "aisafety.institute", "elliitoak.com", "far.ai",
        "alignmentforum.org", "lesswrong.com", "epochai.org", "schema.ai", "SaferAI.org",
    ],
}


def build() -> list[dict]:
    watchlist = []
    seen = set()
    for vertical, domains in VERTICALS.items():
        for domain in domains:
            domain = domain.strip().lower()
            if not domain or domain in seen:
                continue
            seen.add(domain)
            name = domain.split(".")[0].replace("-", " ").title()
            watchlist.append({
                "name": name,
                "domain": domain,
                "pages": ["/", "/blog", "/pricing", "/careers"],
                "vertical": vertical,
            })
    return watchlist[:100]


def main() -> None:
    watchlist = build()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(watchlist, indent=2), encoding="utf-8")
    print(f"Built Horus watchlist: {len(watchlist)} competitors → {OUT}")


if __name__ == "__main__":
    main()
