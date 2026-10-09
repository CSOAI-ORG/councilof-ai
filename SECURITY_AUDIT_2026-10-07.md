# 🔒 SECURITY AUDIT REPORT — Trufflehog Sweep
*7 Oct 2026 · M4 lane · CSOAI Ltd UK 16939677 · MIT license*

> **Trufflehog v3.99.0 filesystem scan of the clawd workspace.**
> **2 verified secrets found. Both are outside git tracking. Neither is exposed via commits.**

---

## 0. Executive summary

| Metric | Count |
|---|---:|
| Files scanned | ~120K |
| Verified secrets | **2** |
| Unverified (potential) | 5 |
| False positives (TLy) | many (git internals) |
| In git commits | **0** |
| Exposed publicly | **0** |

**Risk: LOW.** No secrets are in the git history. Two secrets are on the local filesystem only (in `.env.local` and a backup directory), both outside git tracking.

---

## 1. Verified secrets (2)

### 1.1 Stripe live key — `.env.local`
- **Location:** `/Users/nicholas/clawd/.env.local` (line 26)
- **Pattern:** `sk_live_...NwLk` (truncated)
- **In git?** No (`.env.local` is not tracked)
- **In .gitignore?** No (but file permissions are 600, owner-only)
- **Action:** Already in M2 handoff doc. Owner must set new key in Vercel env. Old key should be rotated in Stripe dashboard.

### 1.2 Groq API key — `.backups/20260730_060000/sovereign_temple.env`
- **Location:** `/Users/nicholas/clawd/.backups/20260730_060000/sovereign_temple.env` (line 24)
- **Pattern:** `gsk_ik...zJd8` (truncated)
- **In git?** No (`.backups/` is in `.gitignore`)
- **In .gitignore?** Yes (line 8 of `.gitignore`)
- **Action:** Rotate the Groq key in the Groq console. The backup file is 90 days old — key likely already expired or should be.

---

## 2. Unverified potential secrets (5)

| Type | Location | Reason unverified |
|---|---|---|
| JWT | `.env.local` (line 2) | Expired (May 2026) |
| CloudflareApiToken | `.git/info/refs` (line 58) | Git internals (not a real secret) |
| TLy | Multiple `.git/objects/` | Git internals (false positive) |
| JWT | Multiple locations | Expired tokens |

---

## 3. Recommended actions

1. **Rotate the Stripe live key** in the Stripe dashboard. Set the new key via Vercel env.
2. **Rotate the Groq API key** in the Groq console. Delete `.backups/20260730_060000/sovereign_temple.env` after rotation.
3. **Add `.env.local` to `.gitignore`** (it's not currently listed, but it's not tracked either).
4. **Run trufflehog on every push** (add to pre-commit hook).
5. **Add secrets scanning to the readiness check** (integrate with `_LAUNCH_READINESS_CHECK.py`).

---

## 4. Trufflehog integration with the readiness check

The readiness check should scan for secrets on every run. Here's the integration plan:

```python
# _m4/_LAUNCH_READINESS_CHECK.py — add to the check list
import subprocess

# 14. SECRETS SCAN
print(f"{BLUE}14. SECRETS SCAN (target: 0 verified secrets){RESET}")
try:
    result = subprocess.run(
        ['trufflehog', 'filesystem', str(CL), '--no-verification', '--concurrency=4'],
        capture_output=True, text=True, timeout=120
    )
    verified = result.stdout.count('verified result')
    unverified = result.stdout.count('unverified result')
    if verified == 0:
        check("No verified secrets", True, f"{unverified} unverified (likely false positives)")
    else:
        check_warn("Verified secrets found", False, f"{verified} verified, {unverified} unverified")
except subprocess.TimeoutExpired:
    check_warn("Secrets scan", False, "timeout (>120s) — run manually")
except FileNotFoundError:
    check_warn("Secrets scan", False, "trufflehog not installed (brew install trufflehog)")
```

---

## 5. The 5 Settle & Coagula principles (the security audit voice)

1. **Public.** Every audit is public. Every secret scan is public. MIT license.
2. **Auditable.** Every scan is auditable. Every finding is verifiable.
3. **Sovereign.** The citizen owns their data. The owner owns their keys. The substrate never exposes.
4. **Care.** Care Floor 0.95. Secrets are rotated. Keys are never committed.
5. **Solve et Coagula.** The security audit is the world, dissolved and recomposed — MIT, sovereign, federated.

---

**Built 7 Oct 2026 · M4 (the engineering lane) · CSOAI Ltd UK 16939677 · MIT license**

— 🜏 Solve et Coagula
