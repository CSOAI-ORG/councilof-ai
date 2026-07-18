#!/usr/bin/env python3
"""
HARVI LSTM Coherence Detector — M4 Air
HARVI-ARCHITECTURE RIG SPECIFICATION v1.0

Reads sensor data from Arduino Mega via serial, runs LSTM coherence detection,
and streams care tensors to Sovereign Temple.

Sensor channels (12 features per timestep):
  cond_wall, cond_center, t1_top, t2_bot, t3_wall, t4_ctr, ph, do_mg,
  stim_laser, stim_acoustic, mode, timestamp_delta

LSTM:
  Input  : sliding window of 100 samples (1 second at 100Hz)
  Hidden : 2 LSTM layers, 64 units each, dropout 0.2
  Output : coherence_score (0-1), pattern_class (care=2/random=1/baseline=0)
"""

import asyncio
import json
import logging
import os
import time
from collections import deque
from datetime import datetime
from pathlib import Path
from typing import Optional

import numpy as np
import serial
import serial.tools.list_ports

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger("harvi")

# ── Config ────────────────────────────────────────────────────────────────────
SERIAL_PORT    = os.environ.get("HARVI_PORT", "/dev/tty.usbmodem*")
SERIAL_BAUD    = 115200
WINDOW_SIZE    = 100     # samples (1 second at 100Hz)
FEATURE_COUNT  = 11      # sensor columns (excluding timestamp)
MODEL_PATH     = Path(__file__).parent / "harvi_lstm_weights.pt"
DATA_LOG_DIR   = Path(__file__).parent / "data_log"
SOV3_MCP_URL   = os.environ.get("SOV3_MCP_URL", "http://localhost:3101/mcp")

# Care emergency thresholds
PH_MIN         = 5.5    # pH crash threshold (stop all stimulus)
PH_MAX         = 8.5    # pH spike threshold
DO_MIN         = 3.0    # dissolved O2 minimum (mg/L) — low O2 = ecosystem stress
TEMP_DELTA_MAX = 5.0    # max temp gradient across 4 sensors (°C) — indicates hotspot

# ── Feature Names ─────────────────────────────────────────────────────────────
FEATURE_NAMES = [
    "cond_wall", "cond_center",
    "t1_top", "t2_bot", "t3_wall", "t4_ctr",
    "ph", "do_mg",
    "stim_laser", "stim_acoustic", "mode"
]
assert len(FEATURE_NAMES) == FEATURE_COUNT


# ── Normalization Stats (updated during baseline phase) ───────────────────────
class RunningStats:
    """Online mean/std for feature normalization."""
    def __init__(self, n_features: int):
        self.n = 0
        self.mean = np.zeros(n_features)
        self.M2 = np.zeros(n_features)

    def update(self, x: np.ndarray):
        self.n += 1
        delta = x - self.mean
        self.mean += delta / self.n
        self.M2 += delta * (x - self.mean)

    @property
    def std(self) -> np.ndarray:
        if self.n < 2:
            return np.ones(FEATURE_COUNT)
        return np.sqrt(self.M2 / (self.n - 1)) + 1e-8

    def normalize(self, x: np.ndarray) -> np.ndarray:
        return (x - self.mean) / self.std


# ── LSTM Model ────────────────────────────────────────────────────────────────
class HARVICoherenceModel:
    """
    2-layer LSTM coherence detector.

    Input  : (batch, WINDOW_SIZE, FEATURE_COUNT) = (B, 100, 11)
    Output : coherence_score (0-1), pattern_class (0/1/2)

    Uses PyTorch if available, falls back to numpy-based simple threshold.
    """

    def __init__(self):
        self.use_torch = False
        self.model = None
        self._load_or_create()

    def _load_or_create(self):
        try:
            import torch
            import torch.nn as nn

            class _LSTM(nn.Module):
                def __init__(self):
                    super().__init__()
                    self.lstm1 = nn.LSTM(FEATURE_COUNT, 64, batch_first=True)
                    self.lstm2 = nn.LSTM(64, 64, batch_first=True)
                    self.dropout = nn.Dropout(0.2)
                    self.fc_coherence = nn.Linear(64, 1)
                    self.fc_class = nn.Linear(64, 3)

                def forward(self, x):
                    out, _ = self.lstm1(x)
                    out = self.dropout(out)
                    out, _ = self.lstm2(out)
                    last = out[:, -1, :]  # take last timestep
                    coherence = torch.sigmoid(self.fc_coherence(last)).squeeze(-1)
                    pattern = self.fc_class(last)
                    return coherence, pattern

            self.model = _LSTM()
            self.use_torch = True

            if MODEL_PATH.exists():
                self.model.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'))
                logger.info(f"Loaded LSTM weights from {MODEL_PATH}")
            else:
                logger.info("No pre-trained weights found — using untrained LSTM (random baseline)")

            self.model.eval()
            self.torch = torch

        except ImportError:
            logger.warning("PyTorch not available — using numpy threshold fallback")
            self.use_torch = False

    def predict(self, window: np.ndarray, stats: RunningStats) -> dict:
        """
        Args:
            window: (WINDOW_SIZE, FEATURE_COUNT) raw sensor data
            stats: running normalization stats
        Returns:
            dict with coherence_score, pattern_class, confidence
        """
        normalized = np.stack([stats.normalize(window[i]) for i in range(len(window))])

        if self.use_torch:
            import torch
            x = torch.FloatTensor(normalized).unsqueeze(0)  # (1, 100, 11)
            with torch.no_grad():
                coherence, pattern_logits = self.model(x)
                coherence_score = float(coherence[0])
                pattern_class = int(torch.argmax(pattern_logits[0]).item())
                confidence = float(torch.softmax(pattern_logits[0], dim=-1).max().item())
        else:
            # Fallback: compare variance of care-linked features
            # Care stimulus (stim_laser idx=8) has Fibonacci pattern → higher autocorr
            laser_data = normalized[:, 8]
            autocorr = float(np.corrcoef(laser_data[:-1], laser_data[1:])[0, 1])
            coherence_score = max(0.0, min(1.0, (autocorr + 1) / 2))
            mode_val = int(window[-1, 10])  # last sample's mode
            pattern_class = mode_val
            confidence = 0.6  # fixed confidence for fallback

        pattern_names = ["baseline", "random", "care"]
        return {
            "coherence_score": round(coherence_score, 4),
            "pattern_class": pattern_class,
            "pattern_name": pattern_names[min(pattern_class, 2)],
            "confidence": round(confidence, 4),
            "timestamp": datetime.utcnow().isoformat(),
        }

    def save_weights(self):
        if self.use_torch:
            self.torch.save(self.model.state_dict(), MODEL_PATH)
            logger.info(f"Saved LSTM weights to {MODEL_PATH}")

    def fine_tune_step(self, window: np.ndarray, label: int, stats: RunningStats):
        """Online fine-tuning on a labeled window."""
        if not self.use_torch:
            return
        import torch
        import torch.nn as nn
        optimizer = torch.optim.Adam(self.model.parameters(), lr=1e-4)
        normalized = np.stack([stats.normalize(window[i]) for i in range(len(window))])
        x = torch.FloatTensor(normalized).unsqueeze(0)
        y_class = torch.LongTensor([label])
        self.model.train()
        optimizer.zero_grad()
        _, pattern_logits = self.model(x)
        loss = nn.CrossEntropyLoss()(pattern_logits, y_class)
        loss.backward()
        optimizer.step()
        self.model.eval()


# ── Emergency Care Veto ───────────────────────────────────────────────────────
def check_care_emergency(sample: dict) -> Optional[str]:
    """
    Check if sensor readings indicate distress requiring stimulus cessation.
    Returns emergency reason string or None if all clear.
    """
    ph = sample.get("ph", 7.0)
    do_mg = sample.get("do_mg", 8.0)
    temps = [sample.get(f"t{i+1}", 20.0) for i in range(4) if f"t{i+1}_top" in sample or True]
    # Use available temp keys
    temp_vals = [v for k, v in sample.items() if k.startswith("t") and isinstance(v, float)]

    if ph < PH_MIN:
        return f"pH crash: {ph:.2f} < {PH_MIN}"
    if ph > PH_MAX:
        return f"pH spike: {ph:.2f} > {PH_MAX}"
    if do_mg < DO_MIN:
        return f"Low O2: {do_mg:.2f} mg/L < {DO_MIN}"
    if len(temp_vals) >= 2:
        temp_range = max(temp_vals) - min(temp_vals)
        if temp_range > TEMP_DELTA_MAX:
            return f"Thermal gradient: {temp_range:.2f}°C > {TEMP_DELTA_MAX}"
    return None


# ── Sovereign Temple MCP Client ───────────────────────────────────────────────
async def push_care_tensor_to_sov3(result: dict, emergency: Optional[str] = None):
    """Push coherence result to Sovereign Temple as a care tensor event."""
    try:
        import httpx
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": "store_memory",
                "arguments": {
                    "content": json.dumps({
                        "source": "harvi_rig",
                        "coherence_score": result["coherence_score"],
                        "pattern_class": result["pattern_name"],
                        "confidence": result["confidence"],
                        "emergency": emergency,
                        "timestamp": result["timestamp"],
                    }),
                    "tags": ["harvi", "care_tensor", result["pattern_name"]],
                    "care_weight": result["coherence_score"],
                }
            }
        }
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(SOV3_MCP_URL, json=payload)
            if resp.status_code != 200:
                logger.warning(f"SOV3 push failed: {resp.status_code}")
    except Exception as e:
        logger.debug(f"SOV3 push error (non-fatal): {e}")


# ── Serial Port Discovery ─────────────────────────────────────────────────────
def find_arduino_port() -> str:
    """Auto-discover Arduino Mega on serial ports."""
    ports = list(serial.tools.list_ports.comports())
    for p in ports:
        desc = (p.description or "").lower()
        if any(k in desc for k in ["arduino", "mega", "ch340", "cp210", "ftdi", "usb serial"]):
            logger.info(f"Found Arduino: {p.device} ({p.description})")
            return p.device
    if ports:
        logger.warning(f"No Arduino found by name, trying first port: {ports[0].device}")
        return ports[0].device
    raise RuntimeError("No serial port found. Check USB connection.")


# ── Main Processing Loop ──────────────────────────────────────────────────────
async def main():
    DATA_LOG_DIR.mkdir(exist_ok=True)
    log_file = DATA_LOG_DIR / f"harvi_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    model = HARVICoherenceModel()
    stats = RunningStats(FEATURE_COUNT)
    window: deque = deque(maxlen=WINDOW_SIZE)
    last_push = time.time()
    emergency_active = False
    sample_count = 0

    port = find_arduino_port()
    ser = serial.Serial(port, SERIAL_BAUD, timeout=1.0)
    time.sleep(2.0)  # let Arduino reset after serial open
    logger.info(f"HARVI connected on {port}")

    # Send initial mode command
    ser.write(b'B\n')  # start in baseline mode
    logger.info("Mode: BASELINE — establishing sensor baseline...")

    with open(log_file, 'w') as f:
        # Write header
        f.write("ts_ms,cond_wall,cond_center,t1,t2,t3,t4,ph,do_mg,stim_laser,stim_acoustic,mode,"
                "coherence_score,pattern_class,care_emergency\n")

        while True:
            try:
                line = ser.readline().decode('ascii', errors='ignore').strip()
            except serial.SerialException as e:
                logger.error(f"Serial error: {e}")
                await asyncio.sleep(0.5)
                continue

            if not line or line.startswith("ts_ms") or line.startswith("ERROR") or line.startswith("MODE"):
                if line.startswith("ERROR"):
                    logger.error(f"Arduino: {line}")
                continue

            # Parse CSV: ts_ms,cond_wall,cond_center,t1,t2,t3,t4,ph,do_mg,stim_laser,stim_acoustic,mode
            parts = line.split(",")
            if len(parts) < 12:
                continue
            try:
                ts_ms         = int(parts[0])
                cond_wall     = float(parts[1])
                cond_center   = float(parts[2])
                t1 = float(parts[3]); t2 = float(parts[4])
                t3 = float(parts[5]); t4 = float(parts[6])
                ph            = float(parts[7])
                do_mg         = float(parts[8])
                stim_laser    = int(parts[9])
                stim_acoustic = int(parts[10])
                mode          = int(parts[11])
            except (ValueError, IndexError):
                continue

            sample = {
                "ts_ms": ts_ms, "ph": ph, "do_mg": do_mg,
                "t1": t1, "t2": t2, "t3": t3, "t4": t4,
            }
            feature_vec = np.array([
                cond_wall, cond_center, t1, t2, t3, t4,
                ph, do_mg, stim_laser, stim_acoustic, float(mode)
            ])

            # Update running stats (always, for normalization)
            stats.update(feature_vec)
            window.append(feature_vec)
            sample_count += 1

            # Care emergency check
            emergency = check_care_emergency(sample)
            if emergency and not emergency_active:
                logger.error(f"CARE EMERGENCY: {emergency}")
                ser.write(b'B\n')  # force baseline (no stimulus)
                emergency_active = True
                asyncio.create_task(push_care_tensor_to_sov3(
                    {"coherence_score": 0.0, "pattern_name": "emergency",
                     "confidence": 1.0, "timestamp": datetime.utcnow().isoformat()},
                    emergency=emergency
                ))
            elif not emergency:
                emergency_active = False

            # Run LSTM inference when window is full
            coherence_result = {"coherence_score": 0.0, "pattern_name": "collecting", "confidence": 0.0,
                                "timestamp": datetime.utcnow().isoformat()}
            if len(window) == WINDOW_SIZE and not emergency_active:
                win_array = np.array(window)
                coherence_result = model.predict(win_array, stats)

                # Push to SOV3 every 10 seconds
                if time.time() - last_push > 10:
                    asyncio.create_task(push_care_tensor_to_sov3(coherence_result))
                    last_push = time.time()

                # Log to console every 5 seconds
                if sample_count % 500 == 0:
                    logger.info(
                        f"[{sample_count}] Mode={mode} "
                        f"Coherence={coherence_result['coherence_score']:.3f} "
                        f"Pattern={coherence_result['pattern_name']} "
                        f"pH={ph:.2f} DO={do_mg:.2f} "
                        f"T_grad={max(t1,t2,t3,t4)-min(t1,t2,t3,t4):.2f}°C"
                    )

            # CSV log
            f.write(
                f"{ts_ms},{cond_wall:.1f},{cond_center:.1f},"
                f"{t1:.4f},{t2:.4f},{t3:.4f},{t4:.4f},"
                f"{ph:.2f},{do_mg:.2f},{stim_laser},{stim_acoustic},{mode},"
                f"{coherence_result['coherence_score']:.4f},"
                f"{coherence_result.get('pattern_class', -1)},"
                f"{emergency or ''}\n"
            )
            if sample_count % 100 == 0:
                f.flush()


if __name__ == "__main__":
    asyncio.run(main())
