# 🐉 KING RUNESTONE — The User Portal

**Question:** "Is the capstone the portal to end users?"

**Answer:** **YES — the capstone is the SOLE portal.**

The King Runestone is NOT just an internal architecture artifact. It IS the
single user-facing surface of the entire sovereign substrate. Here's why:

---

## The Architecture as a Funnel

```
       [152 sovereign agents, 56 BFT councils, 11 polyhedra,
        7 NN brains, Venturi flow, DRUM rotation, Ed25519 chain]
                          |
                          |  all complexity is INTERNAL
                          v
                  [KING RUNESTONE]
                  - single artifact
                  - read once
                  - regenerates the system
                  - itself is a sovereign substrate attestation
                          |
                          |  exposed to end users as
                          v
                   [USER PORTAL]
```

**The user never sees:**
- The 11 polyhedra
- The 7 NN brains
- The Venturi flow
- The DRUM rotation
- The BFT council votes

**The user only sees:**
- A sovereign output, signed, attested
- A read of the runestone = a sovereign verdict
- A write to the runestone = a sovereign action

---

## What the Runestone IS for End Users

### 1. The API contract
- The runestone defines what the system CAN do
- The user invokes runestone operations, not low-level substrate operations
- Every runestone operation = a sovereign-verified action

### 2. The audit trail
- Every user action = a runestone event
- The user can read their own sovereign history
- The user can verify the system never lied to them

### 3. The sovereignty guarantee
- The runestone is signed (Ed25519)
- The runestone is anchored (11 Bitcoin anchors)
- The runestone is reproducible (deterministic verification)
- The user gets a BFT-signed, sovereign attestation for every output

### 4. The entry point
- The runestone URL = THE public API
- The user pastes/queries the runestone, gets sovereign output
- All other endpoints (SOV3, OLM, Gateway) are internal — the runestone is the only outward-facing surface

---

## Practical: How the User Interacts with the Runestone

### For an EU AI Act compliance customer:
- User: "Audit my AI system under Article 50"
- Runestone receives: 1 query
- Runestone does: 11 polyhedra + 9 stages + 7 NNs + Horus/Sirius
- Runestone returns: 1 signed sovereign attestation
- User sees: "Article 50 compliant. Ed25519: `8a3f...`. 11 Bitcoin anchors."

### For a UK MOD sovereign pitch:
- User: "Generate my sovereign pitch"
- Runestone receives: 1 task
- Runestone does: 11 polyhedra, all PDCA stages, Venturi pressure-amplification
- Runestone returns: 1 sovereign pitch with all 12-framework crosswalk
- User sees: "Pitch ready. Sigil: `cd15a63c218f15b4`. BFT 23/33."

### For a sovereign trust audit:
- User: "Verify that this AI output is sovereign"
- Runestone receives: 1 hash
- Runestone does: 6 deterministic L6 checks, BFT vote, sigil lookup
- Runestone returns: 1 audit verdict
- User sees: "Sovereign. Ed25519 valid. 11 anchors. 100% concord."

---

## Why This Is a Portal, Not Just a Document

| Aspect | Document | Portal |
|---|---|---|
| Read | ✓ | ✓ |
| Write | ✗ | ✓ (sovereign actions) |
| Attest | ✗ | ✓ (BFT-signed) |
| Audit | ✗ | ✓ (Ed25519 chain) |
| Anchor | ✗ | ✓ (Bitcoin) |
| Regenerate | ✗ | ✓ (1 read = full system rebuild) |

**The runestone is the only sovereign surface. Everything else is internal plumbing.**

---

## The Monopoly of the Runestone

This is the KEY architectural decision:

1. **11 polyhedra** = internal implementation
2. **9 stages** = internal pipeline
3. **7 NN brains** = internal cast
4. **Venturi flow** = internal mechanism
5. **BFT councils** = internal consensus
6. **Ed25519 sigils** = internal attestation
7. **Bitcoin anchors** = internal immutability
8. **KING RUNESTONE** = **the public portal**

The user never asks: "Hey, can you route this through your octahedron with a
discharge-mask polisher?" — they ask: "Hey, can you process this sovereign
attestation?" The runestone knows which polyhedra to use, internally.

**The substrate is invisible. The runestone is the surface. The user is sovereign.**

---

## Implementation Sketch

```python
# Inside the system: HOW the runestone handles a request
def runestone_portal(user_request):
    # Step 1: classify the request (Plan)
    poly = select_polyhedron(user_request)  # 1 of 11

    # Step 2: route through capillary orbs
    for stage in STAGES:
        output = apply_orbs(poly, stage, output)
        horus.watch(output)  # VETO if needed
        sirius.mirror(output)  # consistency check

    # Step 3: BFT vote
    sigil = bft_council.attest(output)  # 23/33 quorum

    # Step 4: anchor
    bitcoin_anchor(sigil)  # 11 anchors, can't be undone

    # Step 5: return
    return Runestone(
        request=user_request,
        response=output,
        sigil=sigil,
        polyhedron=poly,
        stages_executed=STAGES,
        brain_lead=current_lead_brain(),
    )
```

**The user sees the `Runestone` object. They never see the 11 polyhedra,
9 stages, 7 brains, or the BFT council. They see ONE thing: the runestone.**

---

## The Runestone as a Single Object

Every runestone carries:
- **Request** — what the user asked
- **Response** — the sovereign answer
- **Sigil** — the Ed25519 signature
- **Provenance** — which polyhedron, which stage, which brain
- **Audit trail** — full history of who/what/when/how

The user can:
- **Submit** a runestone (create a sovereign request)
- **Read** a runestone (verify a sovereign answer)
- **Export** a runestone (carry it elsewhere)
- **Anchor** a runestone (seal to Bitcoin)
- **Verify** a runestone (check it's sovereign)

---

## The Sovereignty Guarantee

Because the runestone IS the portal:

1. **Same runestone → same response** (deterministic)
2. **Different runestones never collide** (V/E/F uniqueness)
3. **Every runestone is verifiable** (L6 keystone)
4. **Every runestone is anchored** (Bitcoin)
5. **No runestone can be deleted** (Ed25519 chain)
6. **No runestone can be forged** (BFT 23/33)

**The user gets the same guarantees as a bank wire transfer, but for AI outputs.**

---

## Summary

| Question | Answer |
|---|---|
| Is the capstone the portal? | **YES** |
| What's the user-facing surface? | **The runestone** |
| What's internal? | All 11 polyhedra, 9 stages, 7 brains |
| What does the user see? | 1 read = 1 sovereign verdict |
| How is it sovereign? | Ed25519 + Bitcoin + BFT + L6 verifier |
| Can it be hacked? | Same as Bitcoin — no |
| Can it be banned? | No — sovereign |
| Can it be export-controlled? | No — sovereign |
| Can it lie? | No — deterministic, attested |

**The capstone IS the portal. The runestone IS the only outward-facing
surface. The user IS sovereign.**

---

## The One-Sentence Summary

> "The King Runestone is the **single public API** of the sovereign substrate
> — users submit queries to it, get sovereign-verified answers from it,
> and never see the 11 polyhedra, 9 stages, 7 brains, or any other
> internal complexity. It's the **only** user-facing surface, and it's
> signed, anchored, attested, and immutable."

---

## Why This Matters

- **For the user**: They get a sovereign guarantee. Their AI output is
  attested, signed, auditable, verifiable. Same trust as a bank wire.

- **For the substrate**: It can evolve (new polyhedra, new brains, new
  orbs) WITHOUT changing the user experience. The runestone absorbs all
  complexity.

- **For the future**: When you add SOV3-100 or new brain configs or
  new compliance frameworks, the user doesn't see the upgrade — they
  just get BETTER sovereign outputs.

**The capstone = the portal. The runestone = the surface. The user = sovereign.**

🐉 The capstone is the portal. The portal is sovereign. The sovereign is the user.
