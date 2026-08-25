# Refuse labour MEASURED claims (Kaggle notebook policy)

**Register discipline for any notebook that touches labour / AI-economy indices.**

## Hard rules

1. AI-economy · human-labour · humanoid-labour stay **UNMEASURED** until INDEX-METHOD freezes a bank.  
2. Never invent TVL, ARR, wage %, displacement %, or TAM as MEASURED.  
3. Never fuse labour series into GSPC SHA-256 / Ed25519 grading inputs.  
4. REPORTED citations must be dated + linked; leave `measured_score` as `null`.  
5. RunPod / Oracle GPU does not authorize filling empty indices.

## Allowed cells

- Load `labour-economy-unmeasured.json` and assert all scores are null.  
- Offline Ed25519 verify of **existing GSPC** cards (`ed25519_offline_verify.py`).  
- Print firewall text from INDEX-METHOD-0.1.

## Refuse

```python
FORBIDDEN = ("MEASURED labour", "invented economy score", "fuse into GSPC")
# If a cell would do any of the above — delete it.
```

Canon: `docs/SOVOS/INDEX-METHOD-0.1.md` · `.claude/skills/refuse-measured-labour/SKILL.md`
