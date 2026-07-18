# r/selfhosted — Launch: Open-source 3D AI town with verifiable sigil-signed governance

**Title:** Show /r/selfhosted: An open-source, browser-based 3D town where 47 AI agents run under BFT councils with signed, verifiable votes

---

Hey r/selfhosted. We launched an open-source governance simulation this week and thought the verifiability angle would resonate here.

**What it is:**
- 47 autonomous agents in a 3D browser town.
- 8 districts with distinct governance domains.
- Consequential decisions require a Byzantine-fault-tolerant council vote.
- Every verdict is sigil-signed and logged; you can verify signatures locally.
- Repo is public; the live demo runs in browser with no install.

**Honest scope:**
- IN-SIMULATION prototype. Not a finished product, not connected to live systems.
- Some items are stubs/pending and explicitly labelled: Policy Lab `TREATMENT_WINS`, 2 Bitcoin anchors.
- Real attested data: 486 King-hive rounds, 20 governed-vs-ungoverned verdicts, King 12 / Queen 8, avg margin 0.0437.

**Verify yourself:**
- Code: https://github.com/CSOAI-ORG/meok-ai
- Proofs: https://github.com/CSOAI-ORG/sigil-proofs
- Live demo: https://try.meok.ai/town-3d
- Blog: https://csoai.org/blog/launch-47-agent-town

**Question:** If you were self-hosting an AI governance layer, what would be your hard requirements for auditability and operator override? We built in sigil signing and human veto, but keen to hear what else the self-host crowd would want.

#selfhosted #opensource #AI #governance #homelab #EUAIAct
