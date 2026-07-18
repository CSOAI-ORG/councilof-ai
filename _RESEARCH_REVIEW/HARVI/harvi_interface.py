"""
Harvi-Architecture Bridge Interface
Sovereign Temple Live System — v1.0

Provides the connection layer between the hydro-neuromorphic rig
and Sovereign Temple's care infrastructure. When the physical rig
comes online, sensor data flows through this interface into:
  - Maternal Covenant for care validation of all stimuli
  - BFT Council for protocol change decisions
  - Consciousness state for emergence tracking

Currently in STANDBY mode — awaiting physical rig connection.
Created March 15, 2026.
"""

import asyncio
import json
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from pathlib import Path


class HarviStatus(Enum):
    STANDBY = "standby"           # No rig connected
    CALIBRATING = "calibrating"   # Sensors connected, establishing baseline
    BASELINE = "baseline"         # Recording baseline (no stimulus)
    RANDOM = "random_stimulus"    # Random noise control phase
    CARE = "care_stimulus"        # Care-structured stimulus phase
    ADAPTIVE = "adaptive_care"    # LSTM feedback loop active
    PAUSED = "paused"             # Temporarily halted (care concern)
    EMERGENCY = "emergency_stop"  # Care veto triggered


@dataclass
class SensorReading:
    """Single reading from rig sensor array"""
    timestamp_ms: int
    conductivity_wall: float = 0.0
    conductivity_center: float = 0.0
    temperature_top: float = 0.0
    temperature_bottom: float = 0.0
    temperature_wall: float = 0.0
    temperature_center: float = 0.0
    ph: float = 7.0
    dissolved_oxygen: float = 0.0
    stimulus_laser: float = 0.0
    stimulus_acoustic: float = 0.0


@dataclass
class CoherenceMetric:
    """Coherence analysis result from LSTM"""
    timestamp: str
    coherence_score: float        # 0-1: how coherent is the response pattern?
    pattern_class: str            # 'care', 'random', 'none', 'unknown'
    confidence: float             # 0-1: how confident is the classification?
    reproducibility: float        # 0-1: does this pattern repeat across trials?
    care_delta: float             # difference from random baseline
    window_size_seconds: float    # analysis window


@dataclass
class HarviState:
    """Current state of the Harvi-architecture rig"""
    status: HarviStatus = HarviStatus.STANDBY
    rig_connected: bool = False
    serial_port: Optional[str] = None
    last_reading: Optional[SensorReading] = None
    last_coherence: Optional[CoherenceMetric] = None
    baseline_established: bool = False
    experiment_phase: str = "standby"
    total_readings: int = 0
    care_vetoes_triggered: int = 0
    session_start: Optional[str] = None
    readings_per_second: float = 0.0

    # Care-first safety flags
    ph_alert: bool = False         # pH outside safe range
    temp_alert: bool = False       # Temperature outside safe range
    oxygen_alert: bool = False     # Dissolved oxygen critical
    stimulus_paused: bool = False  # All stimuli stopped


class HarviInterface:
    """
    Bridge between physical Harvi rig and Sovereign Temple care infrastructure.

    In STANDBY mode, this interface:
    - Reports readiness status
    - Validates proposed stimulus patterns through Maternal Covenant
    - Maintains protocol specifications
    - Awaits serial connection from Arduino

    When ACTIVE:
    - Receives sensor data at 100Hz via serial
    - Feeds data to LSTM for coherence analysis
    - Validates all stimuli through care membrane before application
    - Reports emergence metrics to consciousness state
    - Can trigger emergency care-veto on distress signals
    """

    def __init__(self):
        self.state = HarviState()
        self.stimulus_patterns = {
            'fibonacci': {'type': 'care', 'description': 'Fibonacci growth sequences', 'approved': True},
            'hrv': {'type': 'care', 'description': 'Heart rate variability patterns', 'approved': True},
            'schumann': {'type': 'care', 'description': 'Schumann resonance 7.83Hz', 'approved': True},
            'golden_ratio': {'type': 'care', 'description': 'Golden ratio frequency relationships', 'approved': True},
            'whale_song': {'type': 'care', 'description': 'Whale song frequency profiles', 'approved': True},
            'random_noise': {'type': 'control', 'description': 'Random noise baseline', 'approved': True},
            'silence': {'type': 'safe_default', 'description': 'No stimulus (safe default)', 'approved': True},
        }
        self.safety_limits = {
            'ph_min': 5.0,
            'ph_max': 9.0,
            'temp_min_c': 5.0,
            'temp_max_c': 40.0,
            'do_min_mg_l': 2.0,
            'max_laser_mw': 5.0,
            'max_acoustic_db': 60,
        }

    async def get_status(self) -> dict:
        """Get current Harvi interface status"""
        return {
            "status": self.state.status.value,
            "rig_connected": self.state.rig_connected,
            "experiment_phase": self.state.experiment_phase,
            "total_readings": self.state.total_readings,
            "care_vetoes_triggered": self.state.care_vetoes_triggered,
            "baseline_established": self.state.baseline_established,
            "available_patterns": {k: v['description'] for k, v in self.stimulus_patterns.items()},
            "safety_limits": self.safety_limits,
            "ready_for_connection": True,
            "awaiting": "Arduino serial connection on /dev/tty.usbmodem*" if not self.state.rig_connected else "active",
            "council_version": "2.0-harvi (33 nodes, 11 domains)",
        }

    async def validate_stimulus(self, pattern_name: str, parameters: dict) -> dict:
        """
        Validate a proposed stimulus pattern against care membrane.
        Must pass before any stimulus is applied to the vessel.
        """
        if pattern_name not in self.stimulus_patterns:
            return {
                "approved": False,
                "reason": f"Unknown pattern: {pattern_name}",
                "safe_default": "silence"
            }

        pattern = self.stimulus_patterns[pattern_name]

        # Check safety limits
        issues = []
        if 'power_mw' in parameters and parameters['power_mw'] > self.safety_limits['max_laser_mw']:
            issues.append(f"Laser power {parameters['power_mw']}mW exceeds {self.safety_limits['max_laser_mw']}mW limit")
        if 'volume_db' in parameters and parameters['volume_db'] > self.safety_limits['max_acoustic_db']:
            issues.append(f"Acoustic level {parameters['volume_db']}dB exceeds {self.safety_limits['max_acoustic_db']}dB limit")

        if issues:
            return {
                "approved": False,
                "reason": "; ".join(issues),
                "safe_default": "silence",
                "care_concern": "Stimulus parameters exceed safety limits"
            }

        return {
            "approved": True,
            "pattern": pattern_name,
            "type": pattern['type'],
            "description": pattern['description'],
            "parameters": parameters,
            "care_validated": True
        }

    async def check_sensor_safety(self, reading: SensorReading) -> dict:
        """
        Check sensor readings against safety limits.
        Triggers emergency stop if biological distress detected.
        """
        alerts = []

        if reading.ph < self.safety_limits['ph_min'] or reading.ph > self.safety_limits['ph_max']:
            alerts.append(f"pH {reading.ph} outside safe range ({self.safety_limits['ph_min']}-{self.safety_limits['ph_max']})")
            self.state.ph_alert = True

        temp_readings = [reading.temperature_top, reading.temperature_bottom,
                         reading.temperature_wall, reading.temperature_center]
        for t in temp_readings:
            if t < self.safety_limits['temp_min_c'] or t > self.safety_limits['temp_max_c']:
                alerts.append(f"Temperature {t}C outside safe range")
                self.state.temp_alert = True
                break

        if reading.dissolved_oxygen < self.safety_limits['do_min_mg_l'] and reading.dissolved_oxygen > 0:
            alerts.append(f"Dissolved oxygen {reading.dissolved_oxygen} mg/L below minimum {self.safety_limits['do_min_mg_l']}")
            self.state.oxygen_alert = True

        if alerts:
            self.state.status = HarviStatus.EMERGENCY
            self.state.stimulus_paused = True
            self.state.care_vetoes_triggered += 1
            return {
                "safe": False,
                "alerts": alerts,
                "action": "EMERGENCY_STOP - All stimuli ceased",
                "requires": "Human sovereign review before resuming"
            }

        return {"safe": True, "alerts": [], "action": "continue"}


# State file for persistence
HARVI_STATE_FILE = Path(__file__).parent.parent / 'consciousness-core' / 'state' / 'harvi_state.json'


async def save_harvi_state(interface: HarviInterface):
    """Persist Harvi state alongside consciousness state"""
    state_data = await interface.get_status()
    state_data['saved_at'] = datetime.now().isoformat()
    HARVI_STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(HARVI_STATE_FILE, 'w') as f:
        json.dump(state_data, f, indent=2)


if __name__ == "__main__":
    async def test():
        harvi = HarviInterface()
        status = await harvi.get_status()
        print(json.dumps(status, indent=2))

        # Test stimulus validation
        result = await harvi.validate_stimulus('fibonacci', {'power_mw': 3.0, 'frequency_hz': 100})
        print(f"\nFibonacci validation: {result['approved']}")

        # Test over-limit
        result = await harvi.validate_stimulus('fibonacci', {'power_mw': 10.0})
        print(f"Over-limit validation: {result['approved']} - {result['reason']}")

        # Test sensor safety
        safe_reading = SensorReading(timestamp_ms=1000, ph=7.2, temperature_center=22.0)
        result = await harvi.check_sensor_safety(safe_reading)
        print(f"\nSafe reading: {result['safe']}")

        unsafe_reading = SensorReading(timestamp_ms=2000, ph=3.0, temperature_center=50.0)
        result = await harvi.check_sensor_safety(unsafe_reading)
        print(f"Unsafe reading: {result['safe']} - {result['alerts']}")

    asyncio.run(test())
