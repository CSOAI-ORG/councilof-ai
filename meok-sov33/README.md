# meok-sov33

The **sovereign AI client** — talk to a governed, care-floored, Ed25519-signed AI substrate from Python.

Every call routes through the public MEOK sovereign endpoints (`os.meok.ai/api`): **care-floor 0.95**,
signed, honest about its OWEM tiers. **SOV3 is free** (no key); premium models route when a key is set.

```bash
pip install meok-sov33
```

```python
import meok_sov33 as sov

sov.talk("what is a sovereign AI, in one line?")     # -> a governed, care-floored answer
sov.govern("a bank")                                 # -> real frameworks (EU AI Act, GDPR, DORA, …)

# signed, portable memory bonded to you
m = sov.remember("my daughter is allergic to peanuts", owner="did:csoai:nick")

# Ed25519 sign → verify (tamper-evident)
s = sov.sign({"amount": 100})
sov.verify(s["canonical"], s["signature"], s["publicKey"])   # -> True
sov.verify('{"amount":9999}', s["signature"], s["publicKey"]) # -> False (forgery rejected)

# the OWEM model (four scopes + tier routing) and current emergence level
sov.owem(); sov.emergence()
```

## OWEM tiers
`tier` picks the model size for routing — **not** the four OWEM scopes:

| tier | routes to | job |
|---|---|---|
| `small` | ~8B | reflex / draft |
| `medium` (default) | ~70B | tools / everyday |
| `large` | ~120B | deep / verify |

The **four OWEM scopes** (person=character · tools · governance=SOV33 · identity) are sized by *reach*,
not parameters — see `sov.owem()`. This library never claims a "trillion-parameter" model.

## Honest scope
This is a **client to a live governed API** — not a local model, not a capability benchmark. The
governance number is reproducible and published *with its caveats* (see the links below); the capability
number is measured separately on GPU.

- Governance methodology: <https://os.meok.ai/governance.html>
- SOV33small3 topology (measured): <https://os.meok.ai/topology.html>
- Everywhere the same character runs: <https://os.meok.ai/integrations.html>

MIT · MEOK AI Labs · governed under the Sovereign Charter + CSOAI AI Governance.
