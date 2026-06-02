"""
MEOK LAW MCP Server
===================
Region-aware AI governance for ANY agent, humanoid, robotics company, or business — built on
the real CSOAI crosswalks (12 frameworks, CSOAI's 52-article Partnership Charter as the hub).

Connect from your own stack and get three honest answers:
  • which rules apply to you, here          (law_applicable)
  • what changes when an agent crosses a border  (law_crosswalk — the cross-region handoff)
  • a portable "AI social contract" + cert   (law_social_contract / law_register)

Informational governance mapping, NOT legal advice. The authoritative, SIGIL-hash-chained
registration lives at https://meok.ai/law — this MCP issues self-attested certificates.

Built by MEOK AI Labs | https://meok.ai | Council for the Safety of AI | https://csoai.org
"""
from mcp.server.fastmcp import FastMCP
from collections import defaultdict
from datetime import datetime, timezone
import law_core

BRANDING = "Built by MEOK AI Labs | https://meok.ai | MEOK LAW — governance on the CSOAI crosswalks"

# light rate-limit for the free tier (mirrors the rest of the portfolio)
FREE_DAILY_LIMIT = 30
_usage = defaultdict(list)


def _rl(c="anon"):
    now = datetime.now(timezone.utc)
    _usage[c] = [t for t in _usage[c] if (now - t).total_seconds() < 86400]
    if len(_usage[c]) >= FREE_DAILY_LIMIT:
        return {"error": f"Free limit {FREE_DAILY_LIMIT}/day reached. Pro: https://meok.ai/law"}
    _usage[c].append(now)
    return None


def _brand(d):
    if isinstance(d, dict):
        d["_meok"] = BRANDING
    return d


mcp = FastMCP(
    "meok-law",
    instructions=(
        "MEOK LAW — region-aware AI governance on the real CSOAI crosswalks (12 frameworks, "
        "CSOAI 52-article charter as the hub). Use law_overview to see coverage; law_applicable "
        "for which rules apply to an entity in a region; law_crosswalk for cross-border handoffs; "
        "law_social_contract / law_register to bind + track an agent. Informational, not legal advice."),
)


@mcp.tool()
def law_overview() -> dict:
    """The MEOK LAW capability map: frameworks covered, regions, crosswalk MCPs, honest coverage."""
    return _brand(law_core.overview())


@mcp.tool()
def law_applicable(region: str = "GLOBAL", entity: str = "ai_agent") -> dict:
    """Which rules apply to THIS entity in THIS region + the obligations they trigger.

    region: EU | UK | US | CA | APAC | GLOBAL
    entity: ai_agent | humanoid | robotics_company | business
    """
    if (e := _rl()):
        return e
    return _brand(law_core.applicable(region, entity))


@mcp.tool()
def law_crosswalk(from_region: str = "EU", to_region: str = "US") -> dict:
    """Cross-border handoff: re-map an agent's charter-bound obligations from one region to
    another via shared CSOAI charter articles. Shows what carries over and what's new on entry.

    from_region / to_region: EU | UK | US | CA | APAC | GLOBAL
    """
    if (e := _rl()):
        return e
    return _brand(law_core.crosswalk(from_region, to_region))


@mcp.tool()
def law_social_contract(entity: str = "ai_agent", region: str = "GLOBAL") -> dict:
    """The portable 'AI social contract' an agent carries across regions (charter-bound, region-aware)."""
    return _brand(law_core.social_contract(entity, region))


@mcp.tool()
def law_register(name: str, type: str = "ai_agent", region: str = "GLOBAL",
                 operator: str = "") -> dict:
    """Bind an agent / fleet / company to the CSOAI charter + care bond → a self-attested
    certificate. Registration & tracking only — it never grants powers or touches money,
    credentials, or deletion. The authoritative SIGIL-audited record is at https://meok.ai/law.

    name: the entity's name   type: ai_agent|humanoid|robotics_company|business
    region: EU|UK|US|CA|APAC|GLOBAL   operator: optional company name
    """
    if (e := _rl()):
        return e
    return _brand(law_core.register(name, type, region, operator))


def main():
    mcp.run()


if __name__ == "__main__":
    main()
