# Running the REAL LLM Policy Lab + Judge Jury on a dedicated box (Option A)

The 15–17GB VM/Mac can't host extra concurrent inference (single small-model calls time out).
A cheap, on-demand GPU box runs both the real-LLM Policy Lab **and** the judge jury comfortably.
You only pay while it's running.

## What to spin up (any one)
- **RunPod** — RTX 3090 / 24GB, ~$0.20–0.34/hr on-demand (or serverless).
- **Vast.ai** — RTX 3060/3090, ~$0.08–0.20/hr spot.
- Pick an image with Ollama, or install it (`curl -fsSL https://ollama.com/install.sh | sh`).

## One-time setup on the box
```bash
ollama serve &                       # start daemon
ollama pull gemma3:4b                # Policy-Lab agent model (~3.3GB)
ollama pull falcon3:7b qwen2.5:3b    # judge-jury models (for the King-hive jury)
pip install opentimestamps-client    # for Bitcoin anchoring of results
# copy the code over:
scp ~/clawd/sprint/policy_lab_dora.py  <box>:~/policy-lab/
scp ~/clawd/sigil/sigil.py             <box>:~/policy-lab/
```

## Run the REAL Policy Lab (governed-vs-ungoverned, real LLM agents)
```bash
cd ~/policy-lab
PL_AGENTS=llm PL_N=20 PL_AGENT_MODEL=gemma3:4b PL_TIMEOUT=300 python3 policy_lab_dora.py
# -> verdict + per-town metrics + Merkle root + Ed25519 sigil, written to policy_lab_dora.jsonl
```
Then anchor + publish the result exactly like the King-hive proofs (Merkle root → OpenTimestamps → push to `CSOAI-ORG/sigil-proofs` via `~/publish_sigil_proofs.sh`, adapted to the Policy-Lab ledger).

## Run the judge JURY (King-hive upgrade) on the box
The jury (`king_jury.py`, validated, margin 0.41) just needs RAM. On the box:
```bash
# point King-hive's compete() at jury_judge OR run king_jury standalone;
# set KING_JURORS="falcon3:7b,qwen2.5:3b" and route OLLAMA_JUDGE to the box.
```
(See `king-hive-judge-attestable` memory for the wiring note.)

## What I need from you to automate it
- A **RunPod or Vast API key** stored in keystone (`pbpaste | keystone set RUNPOD_API_KEY`) → then I can script provisioning + teardown.
- Or just spin a box up yourself and paste the host; I'll scp + run.

## Cost reality (honest)
A full N=20–200 real run is minutes of GPU time = **a few cents to a couple dollars**. This is the cheapest unblock for *both* the decisive-judge jury and real governed-vs-ungoverned experiments — the one piece of infra that's been the ceiling.
