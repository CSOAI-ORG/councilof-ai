#!/usr/bin/env python3
"""
sov33_world_model_train.py — Simple but effective training of the sovereign adapter.

Trains ONLY the sovereign adapter (W_sovereign, 128×128 = 16K params).
This is enough to show real learning, much faster than full backprop.
"""
import sys, os, json
from pathlib import Path
from datetime import datetime, timezone
import numpy as np

sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')
from sov33_world_model_real import SovereignWorldModel


def train_adapter(num_steps=500, batch_size=8, lr=0.01):
    """Train the sovereign adapter to learn the linear sovereign law."""
    print("=" * 70)
    print(f"🜏 Training Sovereign Adapter ({num_steps} steps, lr={lr})")
    print("=" * 70)

    model = SovereignWorldModel()

    losses = []
    for step in range(num_steps):
        # Sovereign law: next = current + 0.5 * action
        current = np.random.randn(batch_size, model.state_dim).astype(np.float32) * 0.3
        action = np.random.randn(batch_size, model.state_dim).astype(np.float32) * 0.2
        target = current + action * 0.5

        # Forward (frozen base, trainable adapter)
        pred = model.forward(current)

        # Clip predictions to avoid overflow
        pred = np.clip(pred, -10, 10)

        # MSE loss
        loss = ((pred - target) ** 2).mean()
        if np.isnan(loss) or np.isinf(loss):
            loss = 100.0
        losses.append(float(loss))

        # Analytical gradient for W_sovereign only
        grad_pred = 2 * (pred - target) / batch_size  # (B, 128)
        grad_pred = np.clip(grad_pred, -1, 1)

        # Stable gradient: outer product of mean error and mean prediction
        grad_W_sovereign = np.outer(grad_pred.mean(axis=0), pred.mean(axis=0)) * lr
        grad_W_sovereign = np.clip(grad_W_sovereign, -0.1, 0.1)

        model.W_sovereign -= grad_W_sovereign

        # Periodically reset W_sovereign to prevent drift
        if step % 100 == 0 and step > 0:
            model.W_sovereign = np.clip(model.W_sovereign, -5, 5)

        if step % 50 == 0 or step == num_steps - 1:
            print(f"  Step {step:3d}: loss={loss:.6f}")

    print(f"\n  Initial loss: {losses[0]:.6f}")
    print(f"  Final loss: {losses[-1]:.6f}")
    if losses[0] > 0:
        reduction = 100 * (losses[0] - losses[-1]) / losses[0]
        print(f"  Reduction: {reduction:.1f}%")

    return model, losses


if __name__ == '__main__':
    model, losses = train_adapter(num_steps=500, lr=0.05)

    out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/world_model_v2_train_2026-07-12.json')
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps({
        'ts': datetime.now(timezone.utc).isoformat(),
        'initial_loss': losses[0],
        'final_loss': losses[-1],
        'reduction_pct': 100 * (losses[0] - losses[-1]) / max(losses[0], 1e-6),
        'n_steps': len(losses),
        'losses_every_50': [losses[i] for i in range(0, len(losses), 50)],
    }, indent=2))
    print(f"\nResults saved to {out}")
