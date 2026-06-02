"""
MEOK products bridged into the DOME — the geospatial product constellation.

Each product is a real, reachable surface: either an internal MEOK ONE route (/os, /law,
…) or a live vertical site. The DOME renders them as clickable nodes on the world map AND
as orbiting "planets" in cosmos mode, so the whole MEOK system is one place you fly through
and drive by talking to your AI.

Honesty: only products that actually exist are listed. `external:true` = a separate site
(opens in a new tab); internal routes navigate within MEOK ONE. Geo anchors are
market-meaningful, not claims about where anything is hosted. Stdlib only.
"""

# kind: surface = a MEOK ONE OS surface · vertical = an industry product site ·
#       governance = the safety/law layer.   geo = [lng, lat] anchor for the map.
_PRODUCTS = [
    {"id": "os", "name": "MEOK OS", "emoji": "🪟", "kind": "surface", "href": "/os",
     "external": False, "color": "#7C3AED", "geo": [-0.13, 51.51],
     "blurb": "Your AI's home — hatch, switch and talk to the characters you own."},
    {"id": "law", "name": "MEOK LAW", "emoji": "⚖️", "kind": "governance", "href": "/law",
     "external": False, "color": "#fbbf24", "geo": [4.35, 50.85],
     "blurb": "Which rules apply to any agent, anywhere — with cross-border crosswalks."},
    {"id": "hud", "name": "MEOK HUD", "emoji": "🎮", "kind": "surface", "href": "/hud",
     "external": False, "color": "#38bdf8", "geo": [-122.42, 37.77],
     "blurb": "Game-style overlay: your AI sees your screen and acts — every step gated."},
    {"id": "hatch", "name": "Hatch", "emoji": "🥚", "kind": "surface", "href": "/hatch",
     "external": False, "color": "#34d399", "geo": [-0.10, 51.49],
     "blurb": "Hatch a brand-new AI character that's yours, forever."},
    {"id": "registry", "name": "Registry", "emoji": "📜", "kind": "governance", "href": "/registry",
     "external": False, "color": "#c9b8ff", "geo": [6.14, 46.20],
     "blurb": "The public registry of governed MEOK agents and their certificates."},
    {"id": "optimobile", "name": "Optimobile", "emoji": "👓", "kind": "vertical",
     "href": "https://optimobile.ai", "external": True, "color": "#8fd6ff", "geo": [-1.50, 52.50],
     "blurb": "AI built for optometry practices."},
    {"id": "cobolbridge", "name": "CobolBridge", "emoji": "🏦", "kind": "vertical",
     "href": "https://cobolbridge.ai", "external": True, "color": "#6b7280", "geo": [-74.0, 40.71],
     "blurb": "Migrate legacy COBOL to modern stacks, safely."},
    {"id": "haulage", "name": "Haulage.app", "emoji": "🚛", "kind": "vertical",
     "href": "https://haulage.app", "external": True, "color": "#f59e0b", "geo": [-1.90, 52.48],
     "blurb": "Compliance and ops for UK trade & logistics."},
    {"id": "aquaponics", "name": "Aquaponics.app", "emoji": "🐟", "kind": "vertical",
     "href": "https://aquaponics.app", "external": True, "color": "#22d3ee", "geo": [-4.20, 56.50],
     "blurb": "Robotics + compliance for UK aquaculture."},
    {"id": "csoai", "name": "CSOAI", "emoji": "🛡️", "kind": "governance",
     "href": "https://csoai.org", "external": True, "color": "#ef4444", "geo": [6.14, 46.21],
     "blurb": "Council for the Safety of AI — the 52-article charter behind it all."},
]


def products() -> dict:
    return {
        "products": _PRODUCTS,
        "count": len(_PRODUCTS),
        "kinds": {
            "surface": "A MEOK ONE OS surface you can open here.",
            "vertical": "An industry product (separate site).",
            "governance": "The safety / law / registry layer.",
        },
        "note": ("Bridged into the DOME: click a node on the map or a planet in cosmos mode. "
                 "Or just tell your AI to open one."),
    }
