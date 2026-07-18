#!/usr/bin/env python3
"""Tests for meek-screen-reader-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_screen_reader_mcp.server import (
    capture_screen,
    read_text_ocr,
    find_image_in_screen,
    detect_color_in_region,
    click_at,
    type_text,
    press_key,
    read_window_title,
    monitor_screen_changes,
    screen_reader_status,
)


def test_capture_screen():
    r = capture_screen(width=1920, height=1080)
    assert r["capture_status"] == "SUCCESS"
    assert r["width"] == 1920
    assert r["height"] == 1080
    print(f"✅ test_capture: {r['width']}x{r['height']} = {r['size_mb']:.1f} MB")


def test_read_text_ocr():
    r = read_text_ocr(region="hp_bar", language="eng")
    assert r["ocr_status"] == "SUCCESS"
    assert r["confidence_pct"] > 90
    assert "HP:" in r["text_extracted"]
    print(f"✅ test_ocr: {r['text_extracted'][:50]}...")


def test_find_image_in_screen():
    r = find_image_in_screen(template="heal_button.png", threshold=0.9)
    assert r["search_status"] == "FOUND"
    assert r["x"] > 0 and r["y"] > 0
    print(f"✅ test_find_image: found at ({r['x']}, {r['y']}), conf={r['confidence']}")


def test_detect_color_in_region():
    r = detect_color_in_region(region="hp_bar", target_color="red")
    assert r["detection_status"] == "FOUND"
    assert r["target_rgb"] == (255, 0, 0)
    print(f"✅ test_color: {r['target_color']} = {r['target_rgb']}")


def test_click_at():
    r = click_at(x=850, y=720)
    assert r["click_status"] == "SUCCESS"
    print(f"✅ test_click: ({r['x']}, {r['y']}) {r['button']} click")


def test_type_text():
    r = type_text(text="Hello, world!", interval_ms=50)
    assert r["type_status"] == "SUCCESS"
    assert r["characters_typed"] == 13
    print(f"✅ test_type: {r['characters_typed']} characters typed")


def test_press_key():
    r = press_key(key="f1")
    assert r["press_status"] == "SUCCESS"
    print(f"✅ test_press: {r['key']} pressed")


def test_read_window_title():
    r = read_window_title()
    assert r["active_window_title"] == "World of Warcraft"
    print(f"✅ test_window: {r['active_window_title']}")


def test_monitor_screen_changes():
    r = monitor_screen_changes(region="hp_bar", duration_s=60)
    assert r["monitor_status"] == "ACTIVE"
    assert r["changes_detected"] > 0
    print(f"✅ test_monitor: {r['changes_detected']} changes in {r['duration_s']}s")


def test_screen_reader_status():
    r = screen_reader_status()
    assert r["total_cost_gbp"] == 0
    assert r["open_source"] is True
    assert r["uses_pixel_based_detection"] is True
    assert r["no_memory_injection"] is True
    print(f"✅ test_status: {r['verdict']}")


if __name__ == "__main__":
    test_capture_screen()
    test_read_text_ocr()
    test_find_image_in_screen()
    test_detect_color_in_region()
    test_click_at()
    test_type_text()
    test_press_key()
    test_read_window_title()
    test_monitor_screen_changes()
    test_screen_reader_status()
    print("\n🎉 ALL 10 TESTS PASSED — meek-screen-reader-mcp v1.0.0 is sovereign. The MEOK-SOV3 can now read any screen.")