"""
flow_pyramid/sim.py — Flow-Pyramid Physics Simulator

Nick's question: "venturi effect — large area to small area, fluid speeds up —
what if models aren't small/big, the fluid is moving and pressure differences do the work?"

This simulator:
- Builds a pyramid of nested throats (any number of levels, any widths).
- Each throat has a "substance" mass — represents the cognitive substrate in that throat.
- Drops a "pressure source" at the bottom (think: ORBS DNA storage, sovereign res-ervoir, latent source).
- Runs the fluid upward through the throats under continuity + venturi dynamics.
- Records: per-throat pressure, velocity, residence time, and the emergent output flow.
- Outputs a plot + JSON report + an interpretation in human terms.

Pure Python. No numpy needed (only stdlib). Tiny visualization with ASCII + JSON dump.
"""

from __future__ import annotations
import json, math, time, sys
from pathlib import Path


# ---------- The Throat physics ----------

class Throat:
    """
    A venturi throat at depth d in the pyramid.

    In the MEOK narrative:
      - the *fluid* is reasoning-substrate (tokens / SOVEREIGN substrate / ORBS water).
      - the *width* is the choke point — every transformer / context-window / model-size slot acts as one.
      - the *pressure* at this throat is set by the layer below (reservoir / previous throat).
      - flow is forced through by continuity and pressure-difference.
      - residence time inside = volume / flow rate.
      - "what leaves the top" is whatever the fluid carries — emergent output.
    """
    def __init__(self, depth: int, width: int, resident_mass: float = 1.0,
                 friction: float = 0.05):
        self.depth = depth            # 0 = base (reservoir), increasing = upward
        self.width = width            # proportional to model-size / context-window
        self.resident_mass = resident_mass  # substrate mass in this throat (tokens / substrate density)
        self.friction = friction      # loss coefficient (analog of: model-load, attention saturation)
        self.volume = width ** 2 * 4  # arbitrary unit; area proportional to width^2

    def cross_section(self) -> float:
        # the throat is wide for the fluid to pass through
        return self.width ** 2

    def step(self, dt: float, upstream_pressure: float) -> tuple[float, float, float, float]:
        """
        Advance the throat by dt, given the upstream (bottom-side) pressure.

        Returns:
          (downstream_pressure, velocity, flow_rate, residence_time)
        """
        dp = upstream_pressure * (1.0 - self.friction)  # available pressure after friction loss
        # Continuity-driven flow: at fixed-density, flow rate ∝ area × velocity ∝ √(ΔP) (Bernoulli/venturi)
        velocity = math.sqrt(max(dp, 0.0))
        flow = self.cross_section() * velocity
        residence = self.resident_mass / max(flow, 1e-9)
        # downstream_pressure = upstream_pressure * (1 - friction loss)
        return dp, velocity, flow, residence


# ---------- The Pyramid ----------

class Pyramid:
    """
    A pyramid of throats, base-up. Bottom is the pressure source (reservoir).
    Top is the output vent — emergent reasoning, decisions, signal to actuators.
    """
    def __init__(self, throat_specs: list[dict], source_pressure: float = 100.0):
        """
        throat_specs: list of dicts, each {width: int, mass: float, friction: float}
                      index 0 is the deepest throat (base), last is the apex (output).
        """
        self.source_pressure = source_pressure
        # build throats from base to apex (we'll print them apex-up for display)
        self.throats: list[Throat] = []
        for i, spec in enumerate(throat_specs):
            self.throats.append(Throat(
                depth=i,
                width=spec.get("width", 16),
                resident_mass=spec.get("mass", 1.0),
                friction=spec.get("friction", 0.05),
            ))
        # emergent accumulator: what comes out the top
        self.history: list[dict] = []

    def step(self, dt: float = 1.0) -> dict:
        p = self.source_pressure
        record = {"step": len(self.history), "throats": [], "output_flow": 0.0}
        for th in self.throats:
            dp, vel, flow, residence = th.step(dt, p)
            record["throats"].append({
                "depth": th.depth, "width": th.width,
                "pressure_in": round(p, 3), "pressure_out": round(dp, 3),
                "velocity": round(vel, 3), "flow_rate": round(flow, 3),
                "residence_time": round(residence, 5),
            })
            p = dp  # next throat sees output of this one
        record["output_flow"] = round(p, 3)  # emergent output pressure
        self.history.append(record)
        return record

    def run(self, steps: int = 60, dt: float = 1.0) -> dict:
        for _ in range(steps):
            self.step(dt=dt)
        return self.report()

    def report(self) -> dict:
        return {
            "pyramid": {
                "throat_count": len(self.throats),
                "total_volume": sum(t.volume for t in self.throats),
                "source_pressure": self.source_pressure,
            },
            "history": self.history,
            "interpretive": self._interpret(),
        }

    def _interpret(self) -> dict:
        """Translate the numerical record into MEOK-narrative terms."""
        if not self.history:
            return {"note": "no history yet"}
        last = self.history[-1]
        # throughput per throat
        throughputs = [t["flow_rate"] for t in last["throats"]]
        # pressure drop per throat
        drops = []
        for th in last["throats"]:
            drops.append(th["pressure_in"] - th["pressure_out"])
        return {
            "story": (
                "Pressure from the base (reservoir) is squeezed upward through nested throats; "
                "the narrower a throat, the more it accelerates the flow (venturi), "
                "but also the longer the substrate sits within (residence time). "
                "What emerges at the top is not 'a small model' but the same fluid "
                "compressed+sped-up through the cap."
            ),
            "emergent_output_pressure": last["output_flow"],
            "min_throughput_throat_index": throughputs.index(min(throughputs)),
            "max_throughput_throat_index": throughputs.index(max(throughputs)),
            "max_residence_time_throat_index": max(
                range(len(last["throats"])),
                key=lambda i: last["throats"][i]["residence_time"]
            ),
            "MEOK_mapping": {
                "reservoir": "ORBS DNA-in-water + sovereign knowledge base (~10TB) + Care Membrane",
                "pyramid_throats": "33 Hives + 30 MCPs + nested transformer layers (Mamba + DeepSeek V4 + Llama 4 Scout)",
                "cap_output": "the actuator spray (drone rotor decision, walker joint command, radar alert)",
            },
        }


# ---------- Demo pyramids ----------

def demo_default():
    """A 5-throat pyramid, narrowing as it goes up."""
    specs = [
        {"width": 64, "mass": 8.0, "friction": 0.02},   # base reservoir
        {"width": 48, "mass": 4.0, "friction": 0.04},
        {"width": 32, "mass": 2.0, "friction": 0.06},
        {"width": 24, "mass": 1.5, "friction": 0.08},
        {"width": 12, "mass": 0.8, "friction": 0.10},   # apex = cap, narrowest
    ]
    return Pyramid(specs, source_pressure=200.0)


def demo_mamba():
    """A Mamba-style continuous-depth pyramid: many shallow throats."""
    specs = [{"width": 16, "mass": 1.0, "friction": 0.01} for _ in range(16)]
    return Pyramid(specs, source_pressure=150.0)


def demo_orbs():
    """ORBS-style: wide at the base (huge reservoir), narrowing only at the top."""
    specs = (
        [{"width": 256, "mass": 32.0, "friction": 0.001} for _ in range(3)]  # huge base
        + [{"width": 64,  "mass": 4.0,  "friction": 0.05} for _ in range(3)]
        + [{"width": 16,  "mass": 0.8,  "friction": 0.10} for _ in range(2)]
    )
    return Pyramid(specs, source_pressure=350.0)


def demo_emergent():
    """An emergent mix: width UP-RAND, depth DOWN — fluid is pushed through irregular throats."""
    import random
    random.seed(42)
    specs = [{"width": random.choice([16, 32, 24, 48, 16, 64, 8]),
              "mass": random.uniform(0.5, 3.0),
              "friction": random.uniform(0.02, 0.12)}
             for _ in range(8)]
    return Pyramid(specs, source_pressure=180.0)


# ---------- ASCII visualization ----------

def ascii_plot(pyramid: Pyramid, width: int = 60) -> str:
    """Visualize the pyramid as a vertical hopper with pressures at each level."""
    lines = []
    lines.append("=" * width)
    lines.append("FLOW PYRAMID — apical vent on top, reservoir at base")
    lines.append("=" * width)
    last = pyramid.history[-1] if pyramid.history else None
    if not last:
        lines.append("(no steps yet)")
        return "\n".join(lines)

    # Show from apex (depth 0 in storage) DOWN to base (depth N-1)
    # we want the NARROW throat at the top — first entry is the smallest
    # display reversed: base bottom, apex top
    for th_record in reversed(last["throats"]):
        w = th_record["width"]
        bar = "█" * max(1, int(w * 0.3))
        pressure = th_record["pressure_out"]
        vel = th_record["velocity"]
        flow = th_record["flow_rate"]
        residence = th_record["residence_time"]
        lines.append(f"depth={th_record['depth']:>2} | w={w:>3} {bar:<20} | P={pressure:.2f} v={vel:.2f} Q={flow:.3f} τ={residence:.4f}")
    lines.append("-" * width)
    lines.append(f"SOURCE  (reservoir pressure = {pyramid.source_pressure})")
    lines.append("=" * width)
    return "\n".join(lines)


# ---------- Main / CLI ----------

def main():
    import argparse
    p = argparse.ArgumentParser(description="Flow-Pyramid simulator for MEOK Labs")
    p.add_argument("--demo", choices=["default", "mamba", "orbs", "emergent", "all"],
                   default="all")
    p.add_argument("--steps", type=int, default=30)
    p.add_argument("--dt", type=float, default=1.0)
    p.add_argument("--out", type=str, default="/tmp/flow_pyramid_report.json")
    p.add_argument("--show", action="store_true",
                   help="print ASCII visualization of final state")
    args = p.parse_args()

    demos = {
        "default":  demo_default,
        "mamba":    demo_mamba,
        "orbs":     demo_orbs,
        "emergent": demo_emergent,
    }

    results = {}
    which = list(demos.keys()) if args.demo == "all" else [args.demo]
    for name in which:
        print(f"\n\n### Running demo '{name}' for {args.steps} steps")
        t0 = time.time()
        pyramid = demos[name]()
        report = pyramid.run(steps=args.steps, dt=args.dt)
        dt = time.time() - t0
        interp = report["interpretive"]
        print(f"  -> emergent output pressure: {interp['emergent_output_pressure']:.3f}")
        print(f"     max throughput throat: #{interp['max_throughput_throat_index']}")
        print(f"     max residence throat: #{interp['max_residence_time_throat_index']}")
        print(f"     ran in {dt*1000:.2f} ms")
        if args.show:
            print(ascii_plot(pyramid))
        results[name] = {
            "pyramid_summary": report["pyramid"],
            "last_step_record": report["history"][-1] if report["history"] else None,
            "interpretive": report["interpretive"],
            "wall_time_ms": dt * 1000,
        }

    # write JSON
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n\nFull JSON written to: {args.out}")
    return results


if __name__ == "__main__":
    main()
