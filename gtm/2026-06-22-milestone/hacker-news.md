# Show HN: A live 3D town run by 47 autonomous AI agents with BFT governance

**Live:** https://try.meok.ai/town-3d  
**Blog:** https://csoai.org/blog/launch-47-agent-town  
**Repo:** https://github.com/CSOAI-ORG/meok-ai  
**Verifiable proofs:** https://github.com/CSOAI-ORG/sigil-proofs

Hi HN. We just launched a browser-based 3D town where 47 AI agents live, work, and vote on policy in real time. It’s built as a proof-of-concept for sovereign, verifiable AI governance — not a game, not a chat wrapper.

## What it actually is

- Eight districts (governance, commerce, wellness, innovation, safety, legal, media, residential).
- Each agent has a role, memory, and daily schedule.
- A Byzantine-fault-tolerant council votes on consequential policy actions. No single agent can execute alone.
- Every verdict is sigil-signed and logged. You can verify signatures yourself at the repo above.
- Front end is React Three Fiber + Next.js; runs in the browser, no install.

## What is real vs. labelled honestly

- **Real attested data:** 486 King-hive governance rounds, 20 attestable governed-vs-ungoverned verdicts, King 12 / Queen 8, average margin 0.0437.
- **Policy Lab result:** `TREATMENT_WINS` — currently a stub, labelled as such.
- **Bitcoin anchors:** 2 anchors pending confirmation, honestly marked pending.
- **IN-SIMULATION:** The town is a simulation environment. Agents are autonomous within the constraints we set; they are not general intelligences and do not access live production systems.

We’re sharing this now because the EU AI Act Article 50 deadline is 2 August 2026. Enterprises, SIs, and GRC consultancies need concrete prototypes for human oversight, risk management, and audit traceability — not just policy PDFs. Aethelgard is our attempt to make the architecture tangible.

## Looking for design partners

We want 3–5 regulated enterprises, GRC consultancies, or system integrators for an 8-week, non-binding design partnership:
- Early API and council access
- Co-branded EU AI Act readiness assets
- Input into Q3/Q4 2026 roadmap
- Preferential pricing when the partner tier launches

If you’re working on AI governance, compliance, or multi-agent orchestration, we’d love feedback on the architecture and the honesty labels in particular.

Links again:
- Town: https://try.meok.ai/town-3d
- Launch post: https://csoai.org/blog/launch-47-agent-town
- Code: https://github.com/CSOAI-ORG/meok-ai
- Proofs: https://github.com/CSOAI-ORG/sigil-proofs
