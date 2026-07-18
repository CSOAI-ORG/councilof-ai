#!/usr/bin/env python3
"""
HARVI Stimulus Protocol Controller — M4 Air
HARVI-ARCHITECTURE RIG SPECIFICATION v1.0

Controls the experimental protocol phases by sending mode commands to Arduino
via serial. Runs alongside harvi_lstm.py.

Protocol:
  Phase 1 (Week 1-2):  Baseline — no stimulus, collect sensor baselines
  Phase 2 (Week 3-4):  Random noise — null hypothesis control
  Phase 3 (Week 5-8):  Care-structured (Fibonacci + Schumann + HRV)
  Phase 4 (Week 9+):   Adaptive — LSTM feeds back into stimulus

Usage:
    python3 harvi_stimulus.py --phase 1         # set phase manually
    python3 harvi_stimulus.py --phase 3 --auto  # auto-advance after duration
    python3 harvi_stimulus.py --status           # show current phase
"""

import argparse
import json
import logging
import os
import time
from datetime import datetime, timedelta
from pathlib import Path

import serial
import serial.tools.list_ports

logger = logging.getLogger("harvi.stimulus")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

STATE_FILE = Path(__file__).parent / "harvi_state.json"

# Phase definitions
PHASES = {
    1: {
        "name": "Baseline",
        "arduino_cmd": b"B",
        "duration_days": 14,
        "description": "No stimulus. Establishing sensor baselines and natural fluctuations.",
        "training_label": 0,  # LSTM label: baseline
    },
    2: {
        "name": "Random Noise Control",
        "arduino_cmd": b"R",
        "duration_days": 14,
        "description": "Random stimulus patterns. Null hypothesis control.",
        "training_label": 1,  # LSTM label: random
    },
    3: {
        "name": "Care-Structured Stimulus",
        "arduino_cmd": b"C",
        "duration_days": 28,
        "description": "Fibonacci + HRV patterns on laser. Schumann resonance on acoustic.",
        "training_label": 2,  # LSTM label: care
    },
    4: {
        "name": "Adaptive Care",
        "arduino_cmd": b"C",
        "duration_days": None,  # open-ended
        "description": "LSTM coherence score feeds back into stimulus intensity.",
        "training_label": 2,
    },
}


def load_state() -> dict:
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {
        "current_phase": 1,
        "phase_start": datetime.utcnow().isoformat(),
        "total_samples": 0,
        "baseline_stats": {},
        "coherence_history": [],
    }


def save_state(state: dict):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2, default=str)


def find_port() -> str:
    ports = list(serial.tools.list_ports.comports())
    for p in ports:
        desc = (p.description or "").lower()
        if any(k in desc for k in ["arduino", "mega", "ch340", "cp210", "ftdi", "usb serial"]):
            return p.device
    if ports:
        return ports[0].device
    raise RuntimeError("No Arduino found")


def send_command(ser: serial.Serial, cmd: bytes, wait_ms: int = 100):
    ser.write(cmd + b"\n")
    time.sleep(wait_ms / 1000)
    response = ser.read_all().decode("ascii", errors="ignore").strip()
    if response:
        logger.debug(f"Arduino: {response}")


def set_phase(phase_num: int, ser: serial.Serial = None, state: dict = None):
    """Set the stimulus phase."""
    if phase_num not in PHASES:
        raise ValueError(f"Invalid phase {phase_num}. Must be 1-4.")

    phase = PHASES[phase_num]
    logger.info(f"Setting Phase {phase_num}: {phase['name']}")
    logger.info(f"  {phase['description']}")

    if ser:
        send_command(ser, phase["arduino_cmd"])
        logger.info(f"  Arduino command sent: {phase['arduino_cmd']}")

    if state is not None:
        state["current_phase"] = phase_num
        state["phase_start"] = datetime.utcnow().isoformat()
        save_state(state)


def get_status(state: dict):
    phase_num = state["current_phase"]
    phase = PHASES[phase_num]
    phase_start = datetime.fromisoformat(state["phase_start"])
    elapsed = datetime.utcnow() - phase_start
    elapsed_days = elapsed.total_seconds() / 86400

    print(f"\n{'='*60}")
    print(f"HARVI Stimulus Status — {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"{'='*60}")
    print(f"Current Phase : {phase_num} — {phase['name']}")
    print(f"Description   : {phase['description']}")
    print(f"Phase Started : {phase_start.strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"Elapsed       : {elapsed_days:.1f} days")
    if phase["duration_days"]:
        remaining = phase["duration_days"] - elapsed_days
        print(f"Remaining     : {max(0, remaining):.1f} days")
        if remaining <= 0:
            print(f"  *** PHASE COMPLETE — Ready to advance to Phase {phase_num + 1} ***")
    else:
        print(f"Duration      : Open-ended (adaptive)")
    print(f"Total Samples : {state.get('total_samples', 0):,}")

    history = state.get("coherence_history", [])
    if history:
        recent = history[-100:]
        avg_coherence = sum(h["coherence"] for h in recent) / len(recent)
        print(f"Avg Coherence : {avg_coherence:.3f} (last {len(recent)} windows)")
    print(f"{'='*60}\n")


def print_care_patterned_sequences():
    """Print the care stimulus patterns for reference and validation."""
    print("\n── Care Stimulus Patterns (Phase 3) ──────────────────────")

    # Fibonacci sequence used for laser PWM
    fibs = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 255, 233, 144]
    print(f"Laser Fibonacci PWM sequence (0-255):")
    print(f"  {fibs}")

    # HRV intervals (60-100 BPM range with natural variability)
    hrv = [857, 923, 889, 800, 941, 870, 800, 909]  # ms between beats
    hrv_bpm = [60000 / h for h in hrv]
    print(f"Laser HRV timing intervals (ms): {hrv}")
    print(f"Equivalent BPM: {[round(b, 1) for b in hrv_bpm]}")

    # Schumann resonance
    print(f"\nAcoustic Schumann resonance: 7.83 Hz")
    print(f"  Period: {1000/7.83:.1f} ms")
    print(f"  Arduino at 100Hz: toggle every {round(100/(2*7.83))} loops")

    # Golden ratio relationships
    phi = 1.6180339887
    print(f"\nGolden ratio (φ = {phi:.4f}) frequency relationships:")
    base = 432.0  # Hz
    harmonics = [base * phi**n for n in range(5)]
    print(f"  Base 432 Hz harmonics: {[round(h, 1) for h in harmonics]}")

    print("──────────────────────────────────────────────────────────\n")


def auto_advance_loop(ser: serial.Serial, state: dict):
    """Auto-advance phases based on elapsed time."""
    print_care_patterned_sequences()
    logger.info("Auto-advance mode enabled")

    while True:
        phase_num = state["current_phase"]
        phase = PHASES[phase_num]
        phase_start = datetime.fromisoformat(state["phase_start"])
        elapsed_days = (datetime.utcnow() - phase_start).total_seconds() / 86400

        if phase["duration_days"] and elapsed_days >= phase["duration_days"]:
            next_phase = phase_num + 1
            if next_phase in PHASES:
                logger.info(f"Phase {phase_num} complete ({elapsed_days:.1f} days). Advancing to Phase {next_phase}.")
                set_phase(next_phase, ser, state)
            else:
                logger.info("All phases complete. Running Phase 4 (adaptive) indefinitely.")

        get_status(state)
        time.sleep(3600)  # check every hour


def main():
    parser = argparse.ArgumentParser(description="HARVI Stimulus Protocol Controller")
    parser.add_argument("--phase", type=int, choices=[1, 2, 3, 4], help="Set phase manually")
    parser.add_argument("--auto", action="store_true", help="Auto-advance phases based on duration")
    parser.add_argument("--status", action="store_true", help="Show current phase status")
    parser.add_argument("--patterns", action="store_true", help="Print care stimulus patterns")
    parser.add_argument("--no-serial", action="store_true", help="Run without Arduino (dry run)")
    args = parser.parse_args()

    state = load_state()

    if args.patterns:
        print_care_patterned_sequences()
        return

    if args.status:
        get_status(state)
        return

    ser = None
    if not args.no_serial:
        try:
            port = find_port()
            ser = serial.Serial(port, 115200, timeout=1.0)
            time.sleep(2.0)
            logger.info(f"Connected to Arduino: {port}")
        except Exception as e:
            logger.error(f"Could not connect to Arduino: {e}")
            logger.info("Use --no-serial for dry run")
            return

    if args.phase:
        set_phase(args.phase, ser, state)
        get_status(state)

    if args.auto:
        auto_advance_loop(ser, state)
    elif not args.phase:
        get_status(state)


if __name__ == "__main__":
    main()
