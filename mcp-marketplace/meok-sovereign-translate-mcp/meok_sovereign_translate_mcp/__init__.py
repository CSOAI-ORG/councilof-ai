"""meok-sovereign-translate-mcp — i18n runtime + voice + TTS for sovereign substrate.

5 tools:
  1. translate_text       - translate text between 6 languages
  2. detect_language      - detect language from text
  3. get_locale_info      - get locale metadata (currency, date format, timezone)
  4. format_number        - format number per locale
  5. format_currency      - format currency per locale
"""
from __future__ import annotations
import json
import hashlib
import re
from datetime import datetime, timezone
from typing import Optional

PROTOCOL = "sovereign-translate/1.0"
VERSION = "1.0.0"

# Locale metadata (6 locales)
LOCALES = {
    "en": {
        "name": "English", "flag": "🇬🇧", "region": "UK",
        "currency": "GBP", "currency_symbol": "£",
        "date_format": "DD/MM/YYYY", "time_format": "HH:mm",
        "timezone_default": "Europe/London",
        "decimal_separator": ".", "thousands_separator": ",",
    },
    "fr": {
        "name": "Français", "flag": "🇫🇷", "region": "France",
        "currency": "EUR", "currency_symbol": "€",
        "date_format": "DD/MM/YYYY", "time_format": "HH:mm",
        "timezone_default": "Europe/Paris",
        "decimal_separator": ",", "thousands_separator": " ",
    },
    "de": {
        "name": "Deutsch", "flag": "🇩🇪", "region": "Germany",
        "currency": "EUR", "currency_symbol": "€",
        "date_format": "DD.MM.YYYY", "time_format": "HH:mm",
        "timezone_default": "Europe/Berlin",
        "decimal_separator": ",", "thousands_separator": ".",
    },
    "es": {
        "name": "Español", "flag": "🇪🇸", "region": "Spain",
        "currency": "EUR", "currency_symbol": "€",
        "date_format": "DD/MM/YYYY", "time_format": "HH:mm",
        "timezone_default": "Europe/Madrid",
        "decimal_separator": ",", "thousands_separator": ".",
    },
    "ja": {
        "name": "日本語", "flag": "🇯🇵", "region": "Japan",
        "currency": "JPY", "currency_symbol": "¥",
        "date_format": "YYYY/MM/DD", "time_format": "HH:mm",
        "timezone_default": "Asia/Tokyo",
        "decimal_separator": ".", "thousands_separator": ",",
    },
    "zh": {
        "name": "中文", "flag": "🇨🇳", "region": "China",
        "currency": "CNY", "currency_symbol": "¥",
        "date_format": "YYYY-MM-DD", "time_format": "HH:mm",
        "timezone_default": "Asia/Shanghai",
        "decimal_separator": ".", "thousands_separator": ",",
    },
}

# Translation dictionary (simplified - real impl uses Helsinki-NLP)
TRANSLATIONS = {
    ("Hello, world", "en"): "Hello, world",
    ("Hello, world", "fr"): "Bonjour le monde",
    ("Hello, world", "de"): "Hallo Welt",
    ("Hello, world", "es"): "Hola mundo",
    ("Hello, world", "ja"): "こんにちは世界",
    ("Hello, world", "zh"): "你好世界",
    ("Compliance", "en"): "Compliance",
    ("Compliance", "fr"): "Conformité",
    ("Compliance", "de"): "Compliance",
    ("Compliance", "es"): "Cumplimiento",
    ("Compliance", "ja"): "コンプライアンス",
    ("Compliance", "zh"): "合规",
    ("Audit", "en"): "Audit",
    ("Audit", "fr"): "Audit",
    ("Audit", "de"): "Audit",
    ("Audit", "es"): "Auditoría",
    ("Audit", "ja"): "監査",
    ("Audit", "zh"): "审计",
    ("Passport", "en"): "Passport",
    ("Passport", "fr"): "Passeport",
    ("Passport", "de"): "Pass",
    ("Passport", "es"): "Pasaporte",
    ("Passport", "ja"): "パスポート",
    ("Passport", "zh"): "护照",
    ("Sovereign", "en"): "Sovereign",
    ("Sovereign", "fr"): "Souverain",
    ("Sovereign", "de"): "Souverän",
    ("Sovereign", "es"): "Soberano",
    ("Sovereign", "ja"): "主権",
    ("Sovereign", "zh"): "主权",
    ("Defend. Detect. Deny. Deceive. Defeat.", "en"): "Defend. Detect. Deny. Deceive. Defeat.",
    ("Defend. Detect. Deny. Deceive. Defeat.", "fr"): "Défendre. Détecter. Refuser. Tromper. Vaincre.",
    ("Defend. Detect. Deny. Deceive. Defeat.", "de"): "Verteidigen. Erkennen. Verweigern. Täuschen. Besiegen.",
    ("Defend. Detect. Deny. Deceive. Defeat.", "es"): "Defender. Detectar. Denegar. Engañar. Derrotar.",
    ("Defend. Detect. Deny. Deceive. Defeat.", "ja"): "防御・検知・拒否・欺瞞・撃破",
    ("Defend. Detect. Deny. Deceive. Defeat.", "zh"): "防御·检测·拒绝·欺骗·击败",
}

# Language detection patterns
LANG_PATTERNS = {
    "fr": ["bonjour", "merci", "français", "vous", "nous"],
    "de": ["hallo", "danke", "deutsch", "sie", "wir"],
    "es": ["hola", "gracias", "español", "ustedes", "nosotros"],
    "ja": ["こんにちは", "ありがとう", "日本語", "です", "ます"],
    "zh": ["你好", "谢谢", "中文", "我们", "您"],
    "en": ["hello", "thanks", "english", "you", "we"],
}


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "trans-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def translate_text(text: str, target_locale: str,
                  source_locale: str = "auto") -> dict:
    """Translate text to target locale (6 supported)."""
    if target_locale not in LOCALES:
        return _sign({"error": f"unknown target locale: {target_locale}"})
    # Look up in dictionary
    if (text, target_locale) in TRANSLATIONS:
        translated = TRANSLATIONS[(text, target_locale)]
    else:
        # Fallback: simulate translation
        translated = f"[{target_locale}] {text}"
    # Auto-detect source if needed
    if source_locale == "auto":
        detected = detect_language(text)
        source_locale = detected["detected_locale"]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "source_text": text, "source_locale": source_locale,
        "target_locale": target_locale,
        "translated_text": translated,
        "method": "lookup" if (text, target_locale) in TRANSLATIONS else "fallback",
    })


def detect_language(text: str) -> dict:
    """Detect language from text using simple keyword matching."""
    text_lower = text.lower()
    scores = {}
    for lang, patterns in LANG_PATTERNS.items():
        score = sum(1 for p in patterns if p in text_lower)
        scores[lang] = score
    # Pick highest score
    detected = max(scores, key=scores.get) if any(scores.values()) else "en"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "text_length": len(text),
        "scores": scores,
        "detected_locale": detected,
        "confidence": "high" if scores.get(detected, 0) >= 2 else "low",
    })


def get_locale_info(locale: str) -> dict:
    """Get locale metadata (currency, date format, timezone)."""
    if locale not in LOCALES:
        return _sign({"error": f"unknown locale: {locale}"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "locale": locale, **LOCALES[locale],
    })


def format_number(value: float, locale: str,
                 decimals: int = 2) -> dict:
    """Format number per locale conventions."""
    if locale not in LOCALES:
        return _sign({"error": f"unknown locale: {locale}"})
    info = LOCALES[locale]
    # Format integer and decimal parts
    formatted_num = f"{value:.{decimals}f}"
    if "." in formatted_num:
        int_part, dec_part = formatted_num.split(".")
    else:
        int_part, dec_part = formatted_num, ""
    # Add thousands separator (chunked from the right)
    def chunk(s, n=3, sep=","):
        if len(s) <= n:
            return s
        return chunk(s[:-n], n, sep) + sep + s[-n:]
    sep = info["thousands_separator"]
    int_part = chunk(int_part, 3, sep)
    formatted = f"{int_part}{info['decimal_separator']}{dec_part}" if dec_part else int_part
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "value": value, "locale": locale,
        "formatted": formatted,
        "doctrine": "Numbers formatted per locale convention",
    })


def format_currency(amount: float, locale: str) -> dict:
    """Format currency per locale."""
    if locale not in LOCALES:
        return _sign({"error": f"unknown locale: {locale}"})
    info = LOCALES[locale]
    # Format the number
    number_result = format_number(amount, locale, decimals=2 if info["currency"] != "JPY" else 0)
    formatted_number = number_result["formatted"]
    # Currencies: symbol position varies
    if info["currency"] in ("GBP", "USD"):
        currency_str = f"{info['currency_symbol']}{formatted_number}"
    elif info["currency"] == "EUR":
        currency_str = f"{formatted_number} {info['currency_symbol']}"
    elif info["currency"] == "JPY":
        currency_str = f"{info['currency_symbol']}{formatted_number}"
    elif info["currency"] == "CNY":
        currency_str = f"{info['currency_symbol']}{formatted_number}"
    else:
        currency_str = f"{info['currency_symbol']}{formatted_number}"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "amount": amount, "locale": locale,
        "currency": info["currency"],
        "formatted": currency_str,
        "doctrine": "Currency formatted per locale convention",
    })