#!/usr/bin/env python3
"""Tests for meek-4vf-data-transport-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_4vf_data_transport_mcp.server import (
    four_vf_data_rate,
    four_vf_modulation_scheme,
    four_vf_signal_attenuation,
    four_vf_sigil_encoding,
    four_vf_decoding_per_orb,
)


def test_4vf_data_rate():
    r = four_vf_data_rate(num_orbs=5005, carrier_freq_hz=500.0, modulation="OOK")
    assert r["per_orb_bitrate_bps"] == 500.0  # 1 bit per symbol * 500 Hz
    assert r["total_data_rate_mbps"] == 2.5025  # 5005 * 500 / 1e6
    print(f"✅ test_4vf_data_rate: {r['per_orb_bitrate_bps']} bps/orb, {r['total_data_rate_mbps']} Mbps total")


def test_4vf_modulation_scheme():
    r = four_vf_modulation_scheme(scheme="OOK", snr_db=40.0)
    assert r["viable"] is True
    assert r["bits_per_symbol"] == 1
    print(f"✅ test_4vf_modulation: {r['scheme']}, viable={r['viable']}")


def test_4vf_signal_attenuation():
    r = four_vf_signal_attenuation(capillary_length_m=1.5, carrier_freq_hz=500.0)
    assert r["total_attenuation_db"] < 1.0  # < 1 dB for 1.5m at 500Hz
    assert r["final_snr_db"] > 50  # still excellent SNR
    print(f"✅ test_4vf_attenuation: {r['total_attenuation_db']:.2f} dB loss, SNR={r['final_snr_db']:.0f} dB")


def test_4vf_sigil_encoding():
    r = four_vf_sigil_encoding(sigil_size_bytes=64, sigils_per_second=1)
    assert r["samples_per_sigil"] == 512  # 64 * 8
    assert r["pressure_amplitude_pa"] > 0
    print(f"✅ test_4vf_sigil: {r['samples_per_sigil']} samples/sigil, {r['per_orb_data_rate_bps']} bps")


def test_4vf_decoding_per_orb():
    r = four_vf_decoding_per_orb(carrier_freq_hz=500.0, sampling_rate_hz=10000.0, adc_bits=12)
    assert r["nyquist_ok"] is True
    assert r["dynamic_range_db"] > 70  # 12-bit ADC = 72 dB
    assert r["decoding_latency_ms"] == 1.0
    print(f"✅ test_4vf_decoding: nyquist={r['nyquist_ok']}, {r['dynamic_range_db']:.0f} dB, {r['decoding_latency_ms']}ms")


if __name__ == "__main__":
    test_4vf_data_rate()
    test_4vf_modulation_scheme()
    test_4vf_signal_attenuation()
    test_4vf_sigil_encoding()
    test_4vf_decoding_per_orb()
    print("\n🎉 ALL 5 TESTS PASSED — meek-4vf-data-transport-mcp v1.0.0 is sovereign. The orbs are alive.")