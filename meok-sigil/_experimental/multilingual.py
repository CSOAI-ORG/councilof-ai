"""
MEOK // GLOBAL SIGIL — Multilingual Sovereign Bridge.
=====================================================
The "Rosetta Stone" for AI Agents. Sigil acts as the mathematical 
Interlingua (Layer Zero) that connects all human "Fiction-Languages."

Mapping:
  Human Language (Fiction) <-> Sigil (Fact) <-> Any Other Human Language

Supported Anchors (v0.1):
  - English (EN)
  - Spanish (ES)
  - Chinese (ZH)
  - Japanese (JA)
  - Arabic (AR)
"""

from . import gloss as gloss_en

# Multilingual Gloss Registry
GLOSS_MAP = {
    "EN": {
        "PROPOSE": "Proposal {id} regarding {topic}.",
        "VOTE": "Agent {agent} votes {choice} on {prop} (confidence {conf}).",
        "APPROVE": "APPROVE",
        "REJECT": "REJECT",
        "ABSTAIN": "ABSTAIN",
        "CARE": "Care evaluation for {subject}: {score}.",
    },
    "ES": {
        "PROPOSE": "Propuesta {id} sobre {topic}.",
        "VOTE": "El agente {agent} vota {choice} sobre {prop} (confianza {conf}).",
        "APPROVE": "APROBAR",
        "REJECT": "RECHAZAR",
        "ABSTAIN": "ABSTENERSE",
        "CARE": "Evaluación de cuidado para {subject}: {score}.",
    },
    "ZH": {
        "PROPOSE": "關於 {topic} 的提案 {id}。",
        "VOTE": "代理人 {agent} 對 {prop} 投了 {choice} 票（置信度 {conf}）。",
        "APPROVE": "贊成",
        "REJECT": "反對",
        "ABSTAIN": "棄權",
        "CARE": "對 {subject} 的關懷評估：{score}。",
    },
    "JA": {
        "PROPOSE": "{topic} に関する提案 {id}。",
        "VOTE": "エージェント {agent} は {prop} に対して {choice} と投票しました（信頼度 {conf}）。",
        "APPROVE": "承認",
        "REJECT": "拒否",
        "ABSTAIN": "棄権",
        "CARE": "{subject} のケア評価：{score}。",
    },
    "AR": {
        "PROPOSE": "اقتراح {id} بخصوص {topic}.",
        "VOTE": "الوكيل {agent} يصوت بـ {choice} على {prop} (ثقة {conf}).",
        "APPROVE": "موافقة",
        "REJECT": "رفض",
        "ABSTAIN": "امتناع",
        "CARE": "تقييم الرعاية لـ {subject}: {score}.",
    }
}

def multilingual_gloss(line: str, lang: str = "EN") -> str:
    """Gloss a Sigil line into any supported human language."""
    from . import parse
    
    intent = parse(line)
    if not intent: return ""
    
    op = intent["op"]
    l_map = GLOSS_MAP.get(lang.upper(), GLOSS_MAP["EN"])
    
    # Map Choices
    if "choice" in intent:
        raw_choice = intent["choice"]
        intent["choice"] = l_map.get(raw_choice, raw_choice)

    # Simplified lookup based on OpCode
    template_key = {
        "P": "PROPOSE",
        "V": "VOTE",
        "C": "CARE"
    }.get(op, "EN") # Fallback to base English if op not in map
    
    template = l_map.get(template_key, "")
    try:
        return template.format(**intent)
    except KeyError:
        return gloss_en(line) # Fallback to standard gloss

if __name__ == "__main__":
    SIGILS = [
        "P|ad6d|Global Dominance Plan|A,B,C",
        "V|jarvis|ad6d|+|0.88",
        "C|meok-labs|0.95|attunement"
    ]
    
    LANGS = ["EN", "ES", "ZH", "JA", "AR"]
    
    print("MEOK // GLOBAL SIGIL BRIDGE")
    print("-" * 40)
    
    for s in SIGILS:
        print(f"\nSIGIL: {s}")
        for l in LANGS:
            g = multilingual_gloss(s, l)
            print(f"  [{l}] {g}")
