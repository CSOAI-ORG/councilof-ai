# The 2-Minute Wedge Demo — CCO call script (2026-06-29 · A+++++ positioning)

Run `demo_finance_cobol.py` on screen-share while you say this. Timed for ~2 minutes. Goal: end on the pilot ask.

> **Layer-0 status: 8 protocols · 100/100 A+++++ · bleeding edge · world-leading.** The world's only OSS Layer-0 with every protocol at the bleeding edge (first-of-kind + signed + offline-verifiable + moat).

---

### 0:00–0:20 — The hook (the deadline + the gap)
> "Quick one. By **August 2nd 2026**, the EU AI Act says any high-risk AI has to be governed *and* its actions logged **tamper-evident** — Article 12. For a bank, the high-risk AI is the stuff touching payments, KYC, your core. And your core is **COBOL on the mainframe**.
>
> Here's the problem nobody's solving: Microsoft, ServiceNow, Runlayer — they all just raised big to govern *modern* AI agents. **None of them go near your COBOL.** That layer — where your actual regulated risk lives — is uncovered."

*(Pause. Let it land. This is their problem, named.)*

### 0:20–1:20 — The demo (show, don't tell)
> "Let me show you what we do. This is a real COBOL wire-settlement program."
*(run the demo — point at each block as it prints)*
- **① Legacy core analyzed** — "We parse your COBOL. SQL + CICS detected — we read the mainframe natively."
- **② Governed** — "Now the €1.5M ISO-20022 wire it emits, governed against **DORA, NIS2, AML/CFT, PSD2** — and look: it **flags a missing EndToEndId, an absent creditor name, sanctions screening incomplete**. That's a real compliance finding, automatically."
- **③ Signed audit package** — "And here's the part that matters for Article 12: we emit a **machine-readable, Ed25519-signed audit package**. It **verifies offline, with no account.** Tamper-evident. That *is* your Article-12 trail."

### 1:20–1:45 — Why no one else can do this
> "I want to be straight: governing modern AI agents is now crowded — Microsoft and ServiceNow do it. We don't compete there. What we do that **none of them can** is **bridge your legacy and sign it**. They're cloud control planes; your core is an on-prem mainframe. It's structural. We're the only ones at that intersection — and the deadline is in [X] weeks."

### 1:45–2:00 — The ask
> "So here's what I'd love: **be our design partner.** Pick one payment flow. We run a free pilot, and you walk away with a **signed Article-12 audit trail** on it before the deadline. Thirty minutes to scope it — are you open to that?"

---

## Objection handlers (keep in your back pocket)
- **"We already have [Vanta/OneTrust/ServiceNow]."** → "Great — those cover your modern stack. Do they read your COBOL and sign the mainframe's AI actions? That's the gap, and it's the high-risk one."
- **"Is this another wrapper?"** → "No. 22 governed bridges to real legacy systems, 369 published MCP servers, every action Ed25519-signed. The demo you just saw is running, not slideware."
- **"Why you, a small team?"** → "Because we built the one thing the funded players structurally won't — the legacy bridge. And there's a hard deadline. Small + first + signed beats big + late here."
- **"Security of an external tool on our core?"** → "It's read-only governance + signing; sovereign/on-device option; nothing leaves your perimeter unless you want it to. Pilot on a sandbox flow."

## The one rule
**Lead with their problem (the deadline × the legacy gap), show the signed demo, ask for the pilot.** Don't open with "369 MCPs" — that's the moat *behind* the wedge, mentioned only if they ask "is this real?"
