# r/gamedev — Launch: 47-agent AI town, browser-based 3D simulation with BFT governance

**Title:** Built a live 3D town sim in the browser: 47 AI agents, districts, schedules, and a council that votes on policy

---

Hey r/gamedev. We shipped a browser 3D town this week and thought the simulation/dev side might be interesting even though it’s not strictly a game.

**Stack / what you can poke at:**
- 3D town: React Three Fiber + Next.js, runs in browser, no install.
- 47 agents with roles, daily schedules, district-based behaviour.
- 8 districts: governance, commerce, wellness, innovation, safety, legal, media, residential.
- Backend: multi-agent orchestration with a Byzantine-fault-tolerant council for policy votes.
- Every vote is sigil-signed and auditable.

**Simulation honesty:**
- This is an IN-SIMULATION governance prototype, not a released game.
- Some outputs are stubs / pending (e.g., Policy Lab `TREATMENT_WINS`, 2 Bitcoin anchors). All labelled as such.
- Real attested data: 486 King-hive rounds, 20 governed-vs-ungoverned verdicts, King 12 / Queen 8.

**Links:**
- Try it: https://try.meok.ai/town-3d
- Blog: https://csoai.org/blog/launch-47-agent-town
- Code: https://github.com/CSOAI-ORG/meok-ai
- Sigil proofs: https://github.com/CSOAI-ORG/sigil-proofs

**Question for the room:** For those of you building persistent AI NPC worlds, how are you handling authoritative decision-making across agents? We went with BFT councils, but curious what trade-offs you’ve considered.

#gamedev #indiedev #AI #simulation #ReactThreeFiber
