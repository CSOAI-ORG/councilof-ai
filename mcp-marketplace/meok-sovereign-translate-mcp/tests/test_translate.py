"""Tests for meok-sovereign-translate-mcp (6 locales)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_trans_test_")
os.environ["SOV_TRANS_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_translate_mcp import (
    translate_text, detect_language, get_locale_info,
    format_number, format_currency,
    LOCALES, TRANSLATIONS,
)


def test_6_locales():
    assert len(LOCALES) == 6


def test_translate_english_to_french():
    r = translate_text("Hello, world", "fr")
    assert r["translated_text"] == "Bonjour le monde"
    assert r["target_locale"] == "fr"


def test_translate_to_all_locales():
    """Test 'Hello, world' translated to all 6 locales."""
    for loc in LOCALES:
        r = translate_text("Hello, world", loc)
        assert "translated_text" in r
        assert r["target_locale"] == loc


def test_translate_unknown_locale():
    r = translate_text("Hello", "unknown")
    assert "error" in r


def test_translate_doctrine():
    """The Defensive Doctrine translates correctly."""
    for loc in LOCALES:
        r = translate_text("Defend. Detect. Deny. Deceive. Defeat.", loc)
        assert "translated_text" in r  # Translated (English may equal source)


def test_detect_english():
    r = detect_language("Hello world, this is a test")
    assert r["detected_locale"] == "en"


def test_detect_french():
    r = detect_language("Bonjour, merci vous et nous")
    assert r["detected_locale"] == "fr"


def test_detect_german():
    r = detect_language("Hallo, danke sie und wir")
    assert r["detected_locale"] == "de"


def test_detect_spanish():
    r = detect_language("Hola gracias ustedes nosotros")
    assert r["detected_locale"] == "es"


def test_detect_japanese():
    r = detect_language("こんにちは ありがとう です ます")
    assert r["detected_locale"] == "ja"


def test_detect_chinese():
    r = detect_language("你好 谢谢 我们 您")
    assert r["detected_locale"] == "zh"


def test_detect_unknown_defaults_english():
    r = detect_language("xyzqwerty asdfg")
    assert r["detected_locale"] == "en"


def test_locale_info_en():
    r = get_locale_info("en")
    assert r["currency"] == "GBP"
    assert r["currency_symbol"] == "£"


def test_locale_info_fr():
    r = get_locale_info("fr")
    assert r["currency"] == "EUR"
    assert r["region"] == "France"


def test_locale_info_de():
    r = get_locale_info("de")
    assert r["decimal_separator"] == ","
    assert r["thousands_separator"] == "."


def test_locale_info_ja():
    r = get_locale_info("ja")
    assert r["currency"] == "JPY"
    assert r["date_format"] == "YYYY/MM/DD"


def test_locale_info_zh():
    r = get_locale_info("zh")
    assert r["date_format"] == "YYYY-MM-DD"


def test_locale_info_unknown():
    r = get_locale_info("unknown")
    assert "error" in r


def test_format_number_english():
    r = format_number(1234.56, "en")
    assert r["formatted"] == "1,234.56"


def test_format_number_french():
    r = format_number(1234.56, "fr")
    # French uses space as thousands, comma as decimal
    assert r["formatted"] == "1 234,56"


def test_format_number_german():
    r = format_number(1234.56, "de")
    # German uses period as thousands, comma as decimal
    assert r["formatted"] == "1.234,56"


def test_format_number_spanish():
    r = format_number(1234.56, "es")
    # Spanish uses period as thousands, comma as decimal
    assert r["formatted"] == "1.234,56"


def test_format_number_japanese():
    r = format_number(1234, "ja")
    # Japanese uses comma as thousands, period as decimal
    assert r["formatted"] == "1,234.00"


def test_format_currency_gbp():
    r = format_currency(99, "en")
    assert "£" in r["formatted"] or "GBP" in r["formatted"]
    assert r["currency"] == "GBP"


def test_format_currency_eur():
    r = format_currency(99, "fr")
    assert "€" in r["formatted"]
    assert r["currency"] == "EUR"


def test_format_currency_jpy():
    r = format_currency(99, "ja")
    assert "¥" in r["formatted"] or "JPY" in r["formatted"]


def test_format_currency_cny():
    r = format_currency(99, "zh")
    assert "¥" in r["formatted"] or "CNY" in r["formatted"]


def test_format_currency_unknown():
    r = format_currency(99, "unknown")
    assert "error" in r


def test_no_external_deps():
    import meok_sovereign_translate_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    r1 = translate_text("test", "fr")
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = detect_language("test")
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = get_locale_info("en")
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = format_number(1234.56, "en")
    assert "kid" in r4 and "sig" in r4 and "ts" in r4
    r5 = format_currency(99, "en")
    assert "kid" in r5 and "sig" in r5 and "ts" in r5


def test_full_lifecycle():
    """Translate → detect → locale info → format."""
    r1 = translate_text("Hello, world", "ja")
    assert r1["translated_text"] == "こんにちは世界"
    r2 = detect_language("Hello, world")
    assert r2["detected_locale"] == "en"
    r3 = get_locale_info("ja")
    assert r3["currency"] == "JPY"
    r4 = format_currency(99, "ja")
    assert "¥" in r4["formatted"]


def test_all_6_locales_have_metadata():
    """Every locale has currency + date_format + timezone."""
    for loc, info in LOCALES.items():
        assert "currency" in info
        assert "date_format" in info
        assert "timezone_default" in info
        assert "decimal_separator" in info
        assert "thousands_separator" in info