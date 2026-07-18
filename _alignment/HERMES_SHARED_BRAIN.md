# Hermes / Sovereign shared brain — LIVE on the Oracle VM (off the Macs)

**What it is:** an always-on Sovereign inference service on the free `oracle-micro` VM. Cloud-routed
(Groq's free GPU via API), Ed25519-signed, localhost-bound. This is "Hermes on a GPU for all lanes"
done honestly — the GPU is Groq's (rented free via API), the always-on host is the free Oracle VM,
the Mac is never touched. **This is why it no longer crashes your Mac: the muscle left the brain.**

## Status (deployed 2026-07-15)
- systemd service `sovereign-hermes` — `active`, `enabled` (boot-persistent), `Restart=always`
- health: `{"ok":true,"signed":true}` · endpoint `POST /ask {"q":...}` on `127.0.0.1:8899`
- backends currently `["ollama"]` → becomes `["groq", ...]` the moment the key below is set

## THE ONE OWNER STEP — add your Groq key (I never handle keys)
```bash
ssh oracle-micro
sudo nano /etc/sovereign-hermes.env      # set GROQ_API_KEY=gsk_...  (optionally NVIDIA_API_KEY)
sudo systemctl restart sovereign-hermes
curl -s -X POST http://127.0.0.1:8899/ask -H 'Content-Type: application/json' -d '{"q":"Who do you serve?"}'
```
After that, `/ask` returns a real grounded + signed answer.

## How ANY lane uses it (no firewall change — SSH tunnel, same pattern as old Hermes)
On the Mac / M2 / any lane machine:
```bash
ssh -N -L 8899:127.0.0.1:8899 oracle-micro &     # tunnel: localhost:8899 -> VM
curl -s -X POST http://127.0.0.1:8899/ask -H 'Content-Type: application/json' -d '{"q":"..."}'
```
Point `sovereign_router` / apps at `http://127.0.0.1:8899/ask` and every lane shares one signed brain.

## Manage
```bash
sudo systemctl status sovereign-hermes      # health
journalctl -u sovereign-hermes -n 50        # logs
sudo systemctl restart sovereign-hermes     # after config/key change
```

## MLX local reflex on BOTH Macs (SOV3 offline home)
Independent of the VM, each Mac gets an offline local brain via `sovereign_mlx.py`:
- **M4 (16GB):** `pip install mlx-lm` → runs `mlx-community/Qwen2.5-3B-Instruct-4bit` (~2GB). Needs disk headroom first.
- **M2 (8GB):** same install; the 3B-4bit (~2GB) fits 8GB. Set a smaller model if tight:
  `export SOV_MLX_MODEL=mlx-community/Qwen2.5-1.5B-Instruct-4bit`
- `sov_trinity.py` auto-prefers MLX for SOV3 reflex, falling back Ollama → Groq. No code change needed.

**Topology now:** local reflex (MLX on M4+M2) · shared grounded brain (Oracle/Groq, always-on, signed) ·
heavy/training (free cloud GPU: Colab/Modal). The Macs are brain, never muscle.
