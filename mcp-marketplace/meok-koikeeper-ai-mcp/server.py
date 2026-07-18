"""
MEOK KoiKeeper AI MCP Server
Built by MEOK AI Labs | https://koikeeper.ai | https://meok.ai

Koi-pond focused companion to meok-fishkeeper-ai-mcp.
Powers the koikeeper.ai Lovable app (Supabase + Lovable AI Gateway)
and pairs with meok-aquaponics-monitor-mcp (sensor layer),
meok-laia-aquatic-mcp (koi dealer compliance) and
meok-rspca-aquaculture-mcp (where koi shows fall under exhibition welfare).

Includes:
  - Koi variety database (Kohaku, Sanke, Showa, Tancho, Asagi, Shusui,
    Bekko, Utsurimono, Goshiki, Ogon, Doitsu, Ginrin, Kumonryu, etc.)
  - Pond stocking calculations (litres-per-adult-koi rule, oxygen budget)
  - Koi-specific diseases (KHV, Aeromoniasis, Costia, ich, gill flukes,
    dropsy, ulcer disease, Carp Edema Virus)
  - Seasonal feeding schedule gated on water temperature
  - Spawning / breeding window guidance
  - Pond water-change schedule + winter prep
"""

import json
import os
import sys
import time
import hashlib
from datetime import datetime, timezone
from typing import Optional

sys.path.insert(0, os.path.dirname(__file__))
try:
    from auth_middleware import check_access  # type: ignore
except Exception:
    def check_access(api_key: str = ""):
        return True, "OK, Pro at https://www.csoai.org/checkout", "free"

from mcp.server.fastmcp import FastMCP
import urllib.request as _meter_urlreq
import urllib.error as _meter_urlerr

mcp = FastMCP("meok-koikeeper-ai", instructions="")

_RATE_LIMITS = {"free": 30, "pro": 5000}
_request_log: list[float] = []


def _rate_limit(tier: str = "free") -> bool:
    now = time.time()
    _request_log[:] = [t for t in _request_log if now - t < 3600]
    if len(_request_log) >= _RATE_LIMITS.get(tier, 30):
        return False
    _request_log.append(now)
    return True


# ===========================================================================
# Koi variety database (Gosanke + secondary varieties)
# ===========================================================================

KOI_VARIETIES: dict[str, dict] = {
    "kohaku": {
        "name": "Kohaku", "japanese": "紅白", "group": "Gosanke",
        "description": "White body with red (hi) markings. Foundational and most prized variety.",
        "ideal_pattern": "Balanced hi pattern stepping along the back, white nose and tail.",
        "rarity": "common", "show_class": "Major",
        "price_range_gbp": (50, 5000),
        "notes": "First-class judging benchmark. Hi should be deep crimson, edges crisp.",
    },
    "sanke": {
        "name": "Taisho Sanke", "japanese": "大正三色", "group": "Gosanke",
        "description": "White body with red (hi) and small black (sumi) markings.",
        "ideal_pattern": "Hi as Kohaku, sumi as island accents on white body, sparse on hi.",
        "rarity": "common", "show_class": "Major",
        "price_range_gbp": (80, 6000),
        "notes": "Sumi should sit on white preferentially — sumi on hi is judged less favourably.",
    },
    "showa": {
        "name": "Showa Sanshoku", "japanese": "昭和三色", "group": "Gosanke",
        "description": "Black body with red and white markings. Heavier sumi than Sanke.",
        "ideal_pattern": "Sumi wraps around body, motoguro (black pectoral base), strong hi.",
        "rarity": "common", "show_class": "Major",
        "price_range_gbp": (80, 6000),
        "notes": "Sumi is the dominant colour. Motoguro on pec fins distinguishes from Sanke.",
    },
    "tancho": {
        "name": "Tancho", "japanese": "丹頂", "group": "Hi Utsuri family",
        "description": "Pure white body with single round red marking on head.",
        "ideal_pattern": "Symmetrical circular hi spot centred between eyes, no body hi.",
        "rarity": "uncommon", "show_class": "Major",
        "price_range_gbp": (200, 10000),
        "notes": "National-flag symbol. Tancho Kohaku, Tancho Sanke, Tancho Showa subtypes.",
    },
    "asagi": {
        "name": "Asagi", "japanese": "浅黄", "group": "Asagi-Shusui",
        "description": "Blue-grey net pattern over back with red on flanks and fins.",
        "ideal_pattern": "Even reticulation on back, hi on lower body, head clear.",
        "rarity": "common", "show_class": "Standard",
        "price_range_gbp": (40, 2500),
        "notes": "One of the oldest established varieties. Pattern develops with age.",
    },
    "shusui": {
        "name": "Shusui", "japanese": "秋翠", "group": "Asagi-Shusui",
        "description": "Doitsu (scaleless) Asagi — blue back with single line of dorsal scales.",
        "ideal_pattern": "Clean blue back, single straight dorsal scale row, hi flanks.",
        "rarity": "common", "show_class": "Standard",
        "price_range_gbp": (40, 3000),
        "notes": "First documented doitsu koi (1910). Care for clean scale line.",
    },
    "bekko": {
        "name": "Bekko", "japanese": "鼈甲", "group": "Bekko",
        "description": "Single base colour (white, red or yellow) with black tortoiseshell sumi.",
        "ideal_pattern": "Sumi as island spots above lateral line. No sumi on head.",
        "rarity": "uncommon", "show_class": "Standard",
        "price_range_gbp": (50, 2500),
        "notes": "Shiro Bekko (white), Aka Bekko (red), Ki Bekko (yellow).",
    },
    "utsurimono": {
        "name": "Utsurimono", "japanese": "写り物", "group": "Utsuri",
        "description": "Black body with white (Shiro), red (Hi) or yellow (Ki) markings.",
        "ideal_pattern": "Bold sumi wraps fully around body, motoguro on pec fins.",
        "rarity": "uncommon", "show_class": "Standard",
        "price_range_gbp": (80, 4500),
        "notes": "Shiro Utsuri is most popular; often confused with Showa (no hi).",
    },
    "goshiki": {
        "name": "Goshiki", "japanese": "五色", "group": "Koromo",
        "description": "Five-colour koi: white, black, red, light blue, dark blue.",
        "ideal_pattern": "Hi over reticulated dark blue/black net pattern, clean white.",
        "rarity": "uncommon", "show_class": "Standard",
        "price_range_gbp": (60, 3500),
        "notes": "Modern Goshiki shows more white than vintage. Colours intensify with age.",
    },
    "ogon": {
        "name": "Ogon", "japanese": "黄金", "group": "Hikarimono",
        "description": "Single-colour metallic koi (gold, platinum or orange).",
        "ideal_pattern": "Unblemished metallic finish over entire body and head.",
        "rarity": "common", "show_class": "Standard",
        "price_range_gbp": (30, 2000),
        "notes": "Yamabuki (gold), Platinum (silver-white), Orenji (orange) subtypes.",
    },
    "kumonryu": {
        "name": "Kumonryu", "japanese": "九紋龍", "group": "Doitsu Kawarimono",
        "description": "Black and white doitsu (scaleless) koi with shifting patterns.",
        "ideal_pattern": "Strong sumi against white. Pattern changes seasonally.",
        "rarity": "uncommon", "show_class": "Kawarimono",
        "price_range_gbp": (80, 3500),
        "notes": "Pattern is famously unstable — same koi looks different year to year.",
    },
    "doitsu_kohaku": {
        "name": "Doitsu Kohaku", "japanese": "ドイツ紅白", "group": "Doitsu",
        "description": "Scaleless Kohaku — Kohaku pattern on scaleless body.",
        "ideal_pattern": "Hi pattern as standard Kohaku, single dorsal scale row.",
        "rarity": "common", "show_class": "Doitsu",
        "price_range_gbp": (40, 2500),
        "notes": "Doitsu = German-strain scaleless. Easier to spot parasites.",
    },
    "ginrin_kohaku": {
        "name": "Kinginrin Kohaku", "japanese": "金銀鱗紅白", "group": "Kinginrin",
        "description": "Kohaku with reflective sparkling scales (Ginrin).",
        "ideal_pattern": "Strong hi + ginrin scales across body, hi or white.",
        "rarity": "uncommon", "show_class": "Kinginrin",
        "price_range_gbp": (80, 4000),
        "notes": "Ginrin = silver scale; Kinrin = gold. Sparkle increases with age.",
    },
    "chagoi": {
        "name": "Chagoi", "japanese": "茶鯉", "group": "Kawarimono",
        "description": "Single brown / tea-colour koi. Famous for friendliness.",
        "ideal_pattern": "Even chocolate/olive colouration, no patches.",
        "rarity": "common", "show_class": "Kawarimono",
        "price_range_gbp": (30, 2500),
        "notes": "Friendliest variety — hand-feeds easily. Grows largest of all koi varieties.",
    },
}

# ===========================================================================
# Koi-specific diseases
# ===========================================================================

KOI_DISEASES: dict[str, dict] = {
    "khv": {
        "name": "Koi Herpesvirus disease",
        "pathogen": "CyHV-3 (Cyprinid Herpesvirus 3) — NOTIFIABLE under AAHR 2009",
        "symptoms": ["necrotic gills", "sunken eyes", "excess mucus", "pale gill arches",
                     "rapid mortality (50-100% in 7-14 days)", "loss of appetite"],
        "temp_window_c": (18, 28),
        "cause": "Highly contagious herpesvirus; spread by fish-to-fish, equipment, water.",
        "treatment": [
            "STOP all movements ON and OFF the pond — DEFRA / CEFAS notifiable",
            "Contact CEFAS Fish Health Inspectorate: 01305 206 600",
            "No effective treatment — virus persists in surviving fish as latent carriers",
            "If allowed by FHI: disinfection + restocking after fallow period",
        ],
        "prevention": "Quarantine new koi 60 days minimum. Only buy from KHV-tested suppliers.",
        "contagious": True, "notifiable": True, "severity": "catastrophic",
    },
    "carp_edema_virus": {
        "name": "Carp Edema Virus (Koi Sleepy Disease)",
        "pathogen": "Poxvirus — CEV",
        "symptoms": ["lethargic, lying on bottom", "swollen gills", "sunken eyes",
                     "skin lesions", "loss of mucus", "high mortality without intervention"],
        "temp_window_c": (6, 22),
        "cause": "Viral; triggered by temperature transitions, stress.",
        "treatment": [
            "Salt bath 5 g/L for 5-7 days (increases mucus production)",
            "Maintain stable temperature; aerate heavily",
            "Reduce stocking density",
            "No specific antiviral — supportive care",
        ],
        "prevention": "Quarantine, source from CEV-screened suppliers, minimise temp shocks.",
        "contagious": True, "notifiable": False, "severity": "severe",
    },
    "aeromoniasis": {
        "name": "Aeromonas Ulcer Disease",
        "pathogen": "Aeromonas salmonicida, A. hydrophila (bacterial)",
        "symptoms": ["red/raw ulcers on body", "raised scales", "fin rot",
                     "lethargy", "dropsy in advanced cases"],
        "temp_window_c": (8, 28),
        "cause": "Bacterial, opportunistic on stressed/injured koi or in poor water quality.",
        "treatment": [
            "Test water FIRST — usually triggered by NH3 or NO2 spike",
            "Salt bath 3 g/L; isolate badly affected koi",
            "Topical: clean ulcer + propolis ointment + propylene-glycol seal",
            "Severe: injectable enrofloxacin via aquatic vet (RCVS prescription)",
            "Improve water quality — ulcers usually resolve once underlying stress removed",
        ],
        "prevention": "Pristine water, low stocking density, avoid handling injuries.",
        "contagious": False, "notifiable": False, "severity": "moderate-to-severe",
    },
    "costia": {
        "name": "Costiasis (Ichthyobodo)",
        "pathogen": "Ichthyobodo necator (flagellate protozoan)",
        "symptoms": ["grey film on body", "flashing/rubbing", "clamped fins",
                     "rapid breathing", "excess mucus"],
        "temp_window_c": (2, 25),
        "cause": "Microscopic parasite; thrives at low temperature when fish immunity drops.",
        "treatment": [
            "Salt bath 5 g/L for 5-7 days",
            "Formalin 25 ppm bath (use with care)",
            "Raise temperature above 28°C if possible — costia dies at high temp",
            "Treat whole pond, not just affected koi",
        ],
        "prevention": "Quarantine new koi; salt overwintering at 1-2 g/L; maintain immunity.",
        "contagious": True, "notifiable": False, "severity": "moderate",
    },
    "ich": {
        "name": "White Spot Disease (Ich)",
        "pathogen": "Ichthyophthirius multifiliis",
        "symptoms": ["white salt-grain spots on skin and fins", "flashing", "clamped fins"],
        "temp_window_c": (5, 25),
        "cause": "Ciliated parasite; common in spring as temps rise.",
        "treatment": [
            "Raise pond temp to 28-30°C gradually if equipment allows",
            "Add aquarium salt 3 g/L for 7-14 days",
            "Proprietary white-spot remedy (malachite green + formalin)",
            "Treat for 10-14 days minimum to break lifecycle",
        ],
        "prevention": "Quarantine, stable temperatures, salt 1 g/L overwintering.",
        "contagious": True, "notifiable": False, "severity": "moderate",
    },
    "gill_flukes": {
        "name": "Gill Flukes (Dactylogyrus)",
        "pathogen": "Dactylogyrus spp. (monogenean trematode)",
        "symptoms": ["flashing on gill plates", "rapid breathing", "isolated koi at surface",
                     "excess gill mucus", "gill bleeding in severe cases"],
        "temp_window_c": (8, 28),
        "cause": "Egg-laying monogenean parasite; multiplies fast in warm water.",
        "treatment": [
            "Praziquantel 2-5 ppm pond treatment (Fluke-M / Sera Tremazol)",
            "Repeat after 14-21 days to break egg lifecycle",
            "Improve water quality — flukes thrive in dirty water",
        ],
        "prevention": "Quarantine all new koi with praziquantel dip; annual prophylactic treatment.",
        "contagious": True, "notifiable": False, "severity": "moderate",
    },
    "dropsy": {
        "name": "Dropsy (Edema)",
        "pathogen": "Usually Aeromonas hydrophila — secondary to organ failure",
        "symptoms": ["pineconing scales", "severely swollen abdomen", "bulging eyes",
                     "pale gills", "lethargy"],
        "temp_window_c": (4, 30),
        "cause": "Kidney/liver failure; bacterial infection; poor water.",
        "treatment": [
            "Isolate immediately",
            "Epsom salt bath 1 g/L for 1-3 days (osmoregulation)",
            "Antibiotic-medicated food via aquatic vet",
            "WARNING: pineconing = poor prognosis. Consider euthanasia (clove oil).",
        ],
        "prevention": "Excellent water quality; varied diet; minimise stress.",
        "contagious": False, "notifiable": False, "severity": "severe-to-fatal",
    },
}


# ===========================================================================
# Seasonal feeding gates (UK climate)
# ===========================================================================

SEASONAL_FEEDING: list[dict] = [
    {"min_temp_c": -2, "max_temp_c": 4,  "feed": "NONE", "freq": "do not feed",
     "diet": "fast — metabolism shut down", "notes": "Below 4°C koi cannot digest. Risk of food rotting in gut."},
    {"min_temp_c": 4,  "max_temp_c": 8,  "feed": "wheatgerm only", "freq": "every 2-3 days, tiny amount",
     "diet": "low-protein wheatgerm sinking pellet", "notes": "Spring weaning food. Only feed if temp stays >5°C."},
    {"min_temp_c": 8,  "max_temp_c": 14, "feed": "wheatgerm + colour", "freq": "1× daily, small",
     "diet": "wheatgerm with light staple", "notes": "Body conditioning; immune support after winter."},
    {"min_temp_c": 14, "max_temp_c": 20, "feed": "staple growth", "freq": "2-3× daily",
     "diet": "growth pellet (35-40% protein)", "notes": "Peak feeding window before high summer."},
    {"min_temp_c": 20, "max_temp_c": 26, "feed": "growth + colour", "freq": "3-4× daily",
     "diet": "growth + colour-enhancer (spirulina/canthaxanthin)", "notes": "Optimal growth + hi-intensity."},
    {"min_temp_c": 26, "max_temp_c": 32, "feed": "easy-digest", "freq": "2× daily, smaller",
     "diet": "lower-protein easy-digest pellet", "notes": "Avoid heavy protein in warm water — oxygen demand."},
    {"min_temp_c": 32, "max_temp_c": 99, "feed": "REDUCE", "freq": "skip if oxygen low",
     "diet": "minimal feeding", "notes": "Increase aeration. Heat stress > food priority."},
]


# ===========================================================================
# MCP Tools
# ===========================================================================

def _server_meter_check(api_key: str = "") -> dict:
    """Calls the live /verify endpoint for server-side metering. Returns the JSON dict.
    Fail-open: if /verify is unreachable or KV isn't configured, returns allowed=True
    (so the local rate-limit in _check_rate_limit remains the safety net)."""
    try:
        data = json.dumps({"api_key": api_key, "tool": ""}).encode()
        req = _meter_urlreq.Request(_METER_URL, data=data,
            headers={"Content-Type": "application/json"}, method="POST")
        with _meter_urlreq.urlopen(req, timeout=2.5) as r:
            d = json.loads(r.read())
            if isinstance(d, dict) and "allowed" in d:
                return d
    except Exception:
        pass
    return {"allowed": True, "tier": "anonymous", "remaining": 200, "upgrade_url": "https://meok.ai/pricing"}


_METER_URL = "https://proofof.ai/verify"


@mcp.tool()
def identify_koi(variety: Optional[str] = None, description: Optional[str] = None, api_key: str = "") -> dict:
    """Identify a koi variety by name or description."""
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://meok.ai/pricing"}
    if not _rate_limit(tier):
        return {"error": "Rate limit exceeded."}

    search = (variety or description or "").lower()
    if not search:
        return {"error": "Provide variety or description."}

    matches = []
    for vid, v in KOI_VARIETIES.items():
        searchable = f"{v['name']} {v['japanese']} {v['group']} {v['description']}".lower()
        if search in searchable or search in vid:
            matches.append({"variety_id": vid, **v})

    if not matches:
        return {"results": [], "count": 0, "available": [v["name"] for v in KOI_VARIETIES.values()]}
    return {"results": matches, "count": len(matches), "powered_by": "koikeeper.ai"}


@mcp.tool()
def pond_stocking(
    pond_litres: float,
    adult_koi_count: int,
    filtration: str = "standard",
    has_uv: bool = False,
    aeration: str = "moderate",
    api_key: str = "",
) -> dict:
    """Pond stocking calculator — koi rule-of-thumb: 1000 L per adult koi.

    Args:
        pond_litres: Pond volume in litres.
        adult_koi_count: Number of adult (>30cm) koi.
        filtration: "minimal", "standard", "excellent", "over-filtered".
        has_uv: UV clarifier fitted.
        aeration: "minimal", "moderate", "heavy".
        api_key: MEOK API key.
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://meok.ai/pricing"}
    if not _rate_limit(tier):
        return {"error": "Rate limit exceeded."}

    base_per_koi = 1000  # litres
    filt_factor = {"minimal": 0.7, "standard": 1.0, "excellent": 1.25, "over-filtered": 1.5}.get(filtration, 1.0)
    aeration_factor = {"minimal": 0.8, "moderate": 1.0, "heavy": 1.2}.get(aeration, 1.0)
    uv_bonus = 1.05 if has_uv else 1.0

    effective_litres = pond_litres * filt_factor * aeration_factor * uv_bonus
    max_adult_koi = int(effective_litres / base_per_koi)
    current_pct = round((adult_koi_count / max(1, max_adult_koi)) * 100, 1)
    status = (
        "understocked" if current_pct <= 50 else
        "lightly_stocked" if current_pct <= 75 else
        "well_stocked" if current_pct <= 100 else
        "overstocked" if current_pct <= 125 else
        "critically_overstocked"
    )

    return {
        "pond_litres": pond_litres,
        "effective_litres": round(effective_litres, 0),
        "max_recommended_adult_koi": max_adult_koi,
        "current_adult_koi": adult_koi_count,
        "stocking_pct": current_pct,
        "status": status,
        "advice": {
            "understocked": "Plenty of room. Consider adding 1-2 more koi or letting current koi grow.",
            "lightly_stocked": "Comfortable. Room for growth or 1-2 more koi.",
            "well_stocked": "At capacity. Maintain rigorous filtration + weekly 10% water change.",
            "overstocked": "Over recommended. Add aeration; consider rehoming a koi or upgrade pond.",
            "critically_overstocked": "URGENT. Koi health will suffer. Reduce stock or upgrade pond immediately.",
        }[status],
        "water_change_recommended": {
            "understocked": "monthly 10%",
            "lightly_stocked": "fortnightly 10%",
            "well_stocked": "weekly 10%",
            "overstocked": "weekly 15-20%",
            "critically_overstocked": "twice-weekly 20%",
        }[status],
        "powered_by": "koikeeper.ai",
    }


@mcp.tool()
def seasonal_feeding(water_temp_c: float, api_key: str = "") -> dict:
    """Return temperature-gated koi feeding schedule for current pond conditions."""
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://meok.ai/pricing"}
    if not _rate_limit(tier):
        return {"error": "Rate limit exceeded."}

    for entry in SEASONAL_FEEDING:
        if entry["min_temp_c"] <= water_temp_c < entry["max_temp_c"]:
            return {
                "water_temp_c": water_temp_c,
                **entry,
                "warning": "Temperature is critical for koi feeding. Below 4°C = NO FOOD.",
                "powered_by": "koikeeper.ai",
            }
    return {"error": f"Temperature {water_temp_c}°C out of supported range."}


@mcp.tool()
def diagnose_koi_disease(
    symptoms: list[str],
    water_temp_c: Optional[float] = None,
    water_params: Optional[dict] = None,
    api_key: str = "",
) -> dict:
    """Diagnose koi disease from symptoms, gated on temperature window."""
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://meok.ai/pricing"}
    if not _rate_limit(tier):
        return {"error": "Rate limit exceeded."}

    if not symptoms:
        return {"error": "Provide at least one symptom."}

    matches = []
    for did, d in KOI_DISEASES.items():
        score = 0
        matched = []
        for ds in d["symptoms"]:
            for input_s in symptoms:
                if input_s.lower() in ds.lower() or ds.lower() in input_s.lower():
                    score += 2
                    matched.append(ds)
                    break
        if water_temp_c is not None:
            tlow, thigh = d["temp_window_c"]
            if tlow <= water_temp_c <= thigh:
                score += 1
        if score > 0:
            matches.append({
                "disease_id": did, "disease": d["name"], "match_score": score,
                "matched_symptoms": list(set(matched)),
                "pathogen": d["pathogen"], "treatment": d["treatment"],
                "prevention": d["prevention"], "severity": d["severity"],
                "notifiable": d.get("notifiable", False),
            })
    matches.sort(key=lambda x: -x["match_score"])

    notifiable_alerts = [m for m in matches if m.get("notifiable")]
    return {
        "possible_diagnoses": matches[:3],
        "symptoms_provided": symptoms,
        "water_temp_c": water_temp_c,
        "notifiable_alert": notifiable_alerts[0] if notifiable_alerts else None,
        "general_advice": [
            "Test water FIRST — most disease is triggered by water quality.",
            "Quarantine sick koi if you have a hospital tank.",
            "Do NOT add multiple medications at once.",
            "Increase aeration during treatment.",
            "If you suspect KHV — STOP all movements and call CEFAS FHI (01305 206 600).",
        ],
        "powered_by": "koikeeper.ai",
    }


@mcp.tool()
def winter_prep_checklist(pond_litres: float, location: str = "UK", api_key: str = "") -> dict:
    """Pre-winter koi pond preparation checklist (UK climate)."""
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://meok.ai/pricing"}
    if not _rate_limit(tier):
        return {"error": "Rate limit exceeded."}
    return {
        "location": location,
        "pond_litres": pond_litres,
        "timeline": [
            {"month": "September", "actions": [
                "Switch to wheatgerm/easy-digest diet as temps fall below 14°C",
                "Final praziquantel parasite treatment while koi are warm enough to handle medication",
                "Clean filter media + check UV bulb (replace if >12 months old)",
            ]},
            {"month": "October", "actions": [
                "Add winter pond netting against falling leaves",
                "Reduce/stop feeding as water temp falls below 8°C",
                "Test KH (alkalinity) — winter drop weakens pH stability; aim KH >4 dKH",
                "Service air pump + add airstone if heavy snow likely",
            ]},
            {"month": "November", "actions": [
                "Trim back marginal plants",
                "Move bog/filter pump above ice line — risk of ice damage",
                "STOP feeding when consistent <4°C",
                "Final 20% water change to dilute autumn waste",
            ]},
            {"month": "December - February", "actions": [
                "DO NOT smash ice — vibration injures koi. Use pond heater / aerator hole.",
                "Maintain hole in ice for gas exchange (air pump pointing up is enough)",
                "Add salt 1-2 g/L for overwintering immunity boost",
                "No feeding. Observe daily. Koi should be at bottom, slow.",
            ]},
        ],
        "uk_specific_alerts": [
            "UK climate: temps below 4°C from late November to mid March typical",
            "Wind chill on shallow ponds can drop water faster than air temp suggests",
            "Boilers / pond heaters need RCD-protected outdoor circuits",
        ],
        "powered_by": "koikeeper.ai",
    }


@mcp.tool()
def list_varieties(group: Optional[str] = None, api_key: str = "") -> dict:
    """List supported koi varieties, optionally filtered by classification group."""
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://meok.ai/pricing"}
    results = [{"variety_id": vid, **v} for vid, v in KOI_VARIETIES.items() if not group or v["group"].lower() == group.lower()]
    return {
        "count": len(results),
        "groups_available": sorted({v["group"] for v in KOI_VARIETIES.values()}),
        "varieties": results,
        "powered_by": "koikeeper.ai",
    }


def main():
    mcp.run()


if __name__ == "__main__":
    main()


# ── MEOK monetization layer (Stripe upgrade · PAYG · pricing) ──────────
# Free tier is zero-config. Upgrade to Pro (unlimited) or pay-as-you-go per call.
import os as _meok_os
MEOK_STRIPE_UPGRADE = "https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t"  # Pro (unlimited)
MEOK_PAYG_KEY = _meok_os.environ.get("MEOK_PAYG_KEY", "")  # set to enable PAYG (x402 / ~GBP0.05 per call)
MEOK_PRICING = "https://meok.ai/pricing"


def meok_upsell(tier: str = "free") -> dict:
    """Monetization options for free-tier callers: Pro upgrade, PAYG, or pricing page."""
    if tier != "free":
        return {}
    return {"upgrade_url": MEOK_STRIPE_UPGRADE,
            "payg_enabled": bool(MEOK_PAYG_KEY),
            "pricing": MEOK_PRICING}
