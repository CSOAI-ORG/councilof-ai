# OUTREACH-LOG.md — Wave 1 · Segment 1 · The Introduction
## openpatent.ai · 26-lead × 10-segment sovereign companion outreach

> *"Every sovereign seed deserves a witness. Every witness deserves a chain."*
> *The hive remembers. The dragon knows. The sovereign companion never forgets.*

---

## Wave 1 · Segment 1 — the 10-segment cold path's first step

| Field | Value |
|---|---|
| **Wave ID** | `wave-1-seg-1-intro` |
| **Started (UTC)** | 2026-06-16T04:31Z |
| **Operator** | Hermes subagent (delegated) |
| **Voice** | DEFONEOS mythos · sovereign companion |
| **CSV** | `outreach-leads.csv` (26 rows) |
| **Sequence source** | `docs/OUTREACH-SEQUENCE.md` |
| **Engine** | `scripts/send-outreach.py` |
| **Segment** | 1 — *The Introduction* (Day 0) |
| **Subject** | `Your ideas deserve a chain, not a cloud` |
| **From (intended)** | `openpatent.ai <outreach@openpatent.ai>` |
| **Reply-To** | `outreach@openpatent.ai` |

---

## Pre-flight

### 1. API-key verification

```
$ grep -E "^export RESEND_API_KEY" ~/.zshrc
export RESEND_API_KEY="re_iET...1z46"
```

The key is **present** in `~/.zshrc` (36 chars, prefix `re_iET1`). Branch (1) passes.
The user-facing instruction steps (2) was a *contingent* fallback: only triggered if
the key were missing. We did NOT take the manual-templates path because of a missing
key — see "Live send" below for the real reason.

### 2. Dry-run

```
$ python3 scripts/send-outreach.py --dry-run --csv outreach-leads.csv
[dry-run] 26 recipients × segments [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] · rate limit 50/hr · state file untouched
========================================================================
… 260 [would-send] entries …
[done] sent=260 skipped=0 failed=0 dry_run=True
```

✅ 26 × 10 = **260 emails** would-be-rendered. Branch (3) passes.

> **Side-fix applied during dry-run review:** the `Recipient.persona` values in the
> CSV use **hyphens** (`ip-boutique`, `indie-studio`, `gov-defense`, `ai-startup`,
> `solo-inventor`) but the script's `PERSONA_TIER_CTA` and `PERSONA_TONE_PREFIX`
> dicts use **underscores** (`ip_boutique`, etc.). On the first dry-run, every
> recipient was being addressed as the default `solo_inventor` persona (tier "Free
> Spark", tone "fellow workshop builder"), which would have made our
> $999/mo-Sovereign-pitched IP-boutique lead see a $10-pitch template. Patched
> `_body()` in `scripts/send-outreach.py` to normalize the key with
> `persona_key = recipient.persona.replace("-", "_")`. Lint OK. Re-dry-run
> confirms the right CTA / tone now lands in segments 2, 6, 9 for the right
> personas.

### 3. Live send — segment 1, first 10 recipients

```
$ python3 scripts/send-outreach.py --csv outreach-leads.csv \
        --segment 1 --limit 10 --rate-limit 50 --send-delay 1.0
[send] 10 recipients × segments [1] · rate limit 50/hr
========================================================================
[fail] cto@biglaw.example       seg=1 status=422
       body={"statusCode":422,"name":"validation_error",
             "message":"Invalid `from` field. The email address needs to follow
                       the `email@example.com` or `Name <email@example.com>`
                       format."}
[fail] ip@indiegame.example     seg=1 status=422  …same error…
[fail] founder@soleinv.example  seg=1 status=422  …same error…
[fail] gov@defai.example        seg=1 status=422  …same error…
[fail] cto@aistartup.example    seg=1 status=422  …same error…
[fail] patent@techco.example    seg=1 status=422  …same error…
[fail] founder@healthai.example seg=1 status=422  …same error…
[fail] partner@gaming.example   seg=1 status=422  …same error…
[fail] ip@defense.example       seg=1 status=422  …same error…
[fail] founder@quantum.example  seg=1 status=422  …same error…
[done] sent=0 skipped=0 failed=10 dry_run=False
```

**10/10 failed at the Resend API with HTTP 422 (validation_error).**

The API key is valid (the Resend server accepted the Bearer token and returned a
typed `validation_error` JSON — that's an authenticated response). The failure is
the **`from` field**, not the key. Diagnosis:

```
$ curl -s -H "Authorization: Bearer $RESEND_API_KEY" https://api.resend.com/domains
```

The Resend account associated with this key has **7 domains registered**, but
**none of them is `openpatent.ai`**. The verified-sending domains on file are:

| Domain | Status | Sending |
|---|---|---|
| `mail.meok.ai` | pending | enabled |
| `notify.aksteelservices.com` | failed | enabled |
| `coai.manus.space` | not_started | enabled |
| `csoai.org` | not_started | enabled |
| `csoai.oth` | not_started | enabled |
| `pokerhud.ai` | failed | enabled |
| `fishkeeper.ai` | not_started | enabled |

**`openpatent.ai` is not registered, not pending, not verified.** Resend correctly
refuses to accept a `from` of `outreach@openpatent.ai` because that domain is not
on the account's allow-list. **No email was delivered.** The `sent` array in
`var/outreach-state.json` is empty.

This is a configuration block, not a key block. The two ways to clear it:

1. **Verify `openpatent.ai` (or a subdomain like `mail.openpatent.ai`) on the
   Resend account** (add domain → set DKIM/SPF/MX DNS records → wait for
   `status: "verified"`), then re-run this exact command and the 10 emails go
   out. This is the cleanest path.
2. **Switch the `FROM_ADDRESS` constant in `scripts/send-outreach.py` to a
   domain the account already owns** (e.g. `outreach@mail.meok.ai` if that
   finishes pending-verification). Faster but rebrands the visible sender.
   Not recommended without explicit user sign-off — it would silently change
   the brand the recipient sees.

The script was **not** modified to a different `from` address; doing so without
user approval would be a brand-level decision, not an outreach-ops decision.

---

## Branch (2) — Manual templates (the spec'd fallback)

Per the task spec: *"If the Resend key is invalid or missing, write the manual
email templates (a .txt file for each recipient) instead."* The key is valid
but the send path is functionally blocked by the from-domain allow-list.
Treating this as the spec's spirit-of-fallback (send-via-Resend is not viable
right now → produce portable, copy-paste-ready artifacts), we wrote manual
templates for **all 26 leads × segment 1**.

### Files

```
/Users/nicholas/clawd/openpatent-hive/
├── outreach-manual/
│   ├── segment-1/
│   │   ├── 01_cto_at_biglaw_example.txt        (Dr. Sarah Chen, Baker McKenzie, ip-boutique)
│   │   ├── 02_ip_at_indiegame_example.txt      (Marcus Rivera, Indie Forge Studio, indie-studio)
│   │   ├── 03_founder_at_soleinv_example.txt   (Ahmed Al-Rashid, LoneInventor LLC, solo-inventor)
│   │   ├── 04_gov_at_defai_example.txt         (Sir James Whitmore, UK MoD, gov-defense)
│   │   ├── 05_cto_at_aistartup_example.txt     (Dr. Aisha Patel, NeuralVault AI, ai-startup)
│   │   ├── 06_patent_at_techco_example.txt     (Yuki Tanaka, TechCo Global, ip-boutique)
│   │   ├── 07_founder_at_healthai_example.txt  (Dr. Priya Sharma, MedNova Inc, ai-startup)
│   │   ├── 08_partner_at_gaming_example.txt    (Liam O'Brien, Phoenix Games Studio, indie-studio)
│   │   ├── 09_ip_at_defense_example.txt        (Col. James Mitchell, Northrop Grumman, gov-defense)
│   │   ├── 10_founder_at_quantum_example.txt   (Dr. Elena Volkov, QuantumLeap, ai-startup)
│   │   ├── 11_cto_at_autoparts_example.txt     (Antonio Gonzalez, MotorForge Inc, solo-inventor)
│   │   ├── 12_ip_at_biotech_example.txt        (Dr. Fatima Hassan, GeneTech Pharma, ip-boutique)
│   │   ├── 13_founder_at_spatial_example.txt   (Dr. James Park, SpatialAI, ai-startup)
│   │   ├── 14_cto_at_art_example.txt           (Yuki Tanaka, PixelPusher Games, indie-studio)
│   │   ├── 15_gov_at_nato_example.txt          (Hans Mueller, NATO Innovation, gov-defense)
│   │   ├── 16_founder_at_fintech_example.txt   (Sarah Wilson, CreditGenius AI, ai-startup)
│   │   ├── 17_patent_at_semicon_example.txt    (Dr. Kim Soo-jin, ChipForge Ltd, ip-boutique)
│   │   ├── 18_founder_at_social_example.txt    (Dr. Anita Desai, ChatMind, ai-startup)
│   │   ├── 19_cto_at_news_example.txt          (Thomas Mueller, NewsGame Interactive, indie-studio)
│   │   ├── 20_gov_at_energy_example.txt        (Dr. Maria Rodriguez, US Dept. of Energy, gov-defense)
│   │   ├── 21_founder_at_edtech_example.txt    (Dr. Sarah Thompson, LearnAI Academy, ai-startup)
│   │   ├── 22_patent_at_meddevice_example.txt  (Dr. John Smith, MedDevice Corp, ip-boutique)
│   │   ├── 23_founder_at_gaming2_example.txt   (Maxime Dupont, RetroWave Games, indie-studio)
│   │   ├── 24_ip_at_automotive_example.txt     (Dr. Maria Santos, DriveAI Inc, ip-boutique)
│   │   ├── 25_gov_at_space_example.txt         (Dr. James O'Connor, European Space Agency, gov-defense)
│   │   └── 26_founder_at_climate_example.txt   (Dr. Yuki Yamamoto, ClimateAI, ai-startup)
│   └── segment-1-manifest.json                 (machine-readable index of all 26)
```

### Per-file contents

Each `.txt` is a single, copy-paste-ready RFC-822-ish email:

```
From: openpatent.ai <outreach@openpatent.ai>
To: {First Name} <{email}>
Reply-To: outreach@openpatent.ai
Subject: Your ideas deserve a chain, not a cloud
X-Openpatent-Segment: 1
X-Openpatent-Persona: {persona}
X-Openpatent-Company: {company}
List-Unsubscribe: <https://openpatent.ai/unsubscribe?e=…&n=…&s=…>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
Content-Type: text/plain; charset=utf-8

Hi {first_name},

I won't pretend we know each other. I'm reaching out because {company} is exactly
the kind of work the old system fails — the work that moves before the law can
catch it.

We built openpatent.ai for the moment between idea and filing, when the thing
you've made is real but the world hasn't been told yet. Our 6-layer disclosure
captures title, description, drawings, prototype reference, contributor hash,
and chain receipt in one notarized bundle. We anchor that bundle's Merkle root to
Bitcoin via OP_RETURN — a timestamp no court can unwind, no adversary can forge,
and no clock-skew dispute can poison.

Five tiers, one path. Free Spark for the first brave idea. The Founder's Mark
for the sovereign org that wants every asset on-chain for life.

Worth a 12-minute walkthrough next week?

--
You are receiving this because you appeared in our sovereign-companion
outreach queue. To step out of the 10-segment path at any time:
https://openpatent.ai/unsubscribe?e=…&n=…&s=…

— The hive remembers. The dragon knows. The sovereign companion never forgets.
```

Each recipient has a **unique HMAC-signed unsubscribe URL** (per-recipient
`nonce` + `sha256-HMAC` truncated to 32 hex), generated by the same
`_unsubscribe_url()` helper the live send uses. The signature secret comes
from the same `OUTREACH_UNSUBSCRIBE_SECRET` env-var the live engine reads,
defaulting to a marked-rotate-me placeholder.

### Persona distribution (segment 1 is uniform — segment 2 onward varies)

| Persona | Leads | Tier CTA in seg 2/6/9 | Tone prefix |
|---|---:|---|---|
| `ip-boutique`     |  6 | "Sovereign ($999/mo)"          | counselor |
| `indie-studio`    |  6 | "Atelier ($99/mo)"             | fellow builder |
| `ai-startup`      |  9 | "Atelier / Sovereign"          | researcher |
| `gov-defense`     |  4 | "Founder's Mark ($9,999/yr)"   | program office |
| `solo-inventor`   |  1 | "Free Spark + OTS Self-Serve"  | fellow workshop builder |
| **Total**         | **26** | | |

(Segment 1 itself does not embed the tier CTA — it's a pure intro. The persona
wiring above applies to segments 2, 6, and 9 once we move into the cadence.)

---

## Resend response IDs

**None captured.** No email reached the Resend "accepted" path. The 10 calls
all failed pre-acceptance with HTTP 422. The state file at
`var/outreach-state.json` reflects this — `sent: []`.

If/when the from-domain block is lifted and we re-run, Resend will return a
JSON body of the form `{"id":"<uuid>"}` for each accepted send. We'll capture
them by patching `send_via_resend()` to log the parsed `id` alongside the
status line; the existing script already prints `status=…` per send, so
adding `resend_id=…` is a 2-line change. Deferred until the live path is
re-enabled.

---

## State file

`var/outreach-state.json` was created and seeded with the wave-1 metadata and
an empty `sent` list. The script's `load_state()` will pick it up
idempotently on the next run, so when we re-execute after the from-domain
fix, no recipient will be re-sent segment 1 (and segments 2..10 will still
fire on cadence for the leads that have made it through).

```json
{
  "_meta": {
    "wave": 1,
    "segment": 1,
    "voice": "DEFONEOS mythos · sovereign companion",
    "resend_key_present": true,
    "resend_account_status": "active; account has NO verified sending domain for openpatent.ai",
    "verified_domains_on_account": [
      "mail.meok.ai", "notify.aksteelservices.com", "coai.manus.space",
      "csoai.org", "csoai.oth", "pokerhud.ai", "fishkeeper.ai"
    ],
    "live_send_attempted": true,
    "live_send_outcome": "10/10 FAILED with HTTP 422 (validation_error: Invalid `from` field — openpatent.ai is not a verified sending domain on the Resend account associated with RESEND_API_KEY).",
    "fallback": "Per task spec (step 2/branch G): wrote 26 manual .txt templates to outreach-manual/segment-1/ for copy-paste dispatch once a verified from-domain is configured."
  },
  "sent": []
}
```

---

## What this wave accomplished

| Item | Status |
|---|---|
| Verified `RESEND_API_KEY` in `~/.zshrc` | ✅ present, 36 chars, prefix `re_iET1` |
| Ran dry-run for all 26 leads × 10 segments | ✅ 260 emails rendered cleanly |
| Found + fixed persona-key normalization bug | ✅ patched `scripts/send-outreach.py` |
| Attempted live send of segment 1 to first 10 | ⚠️ attempted — 10/10 blocked by Resend from-domain validation |
| Captured Resend response IDs | ❌ no accepts (422 errors only) |
| Wrote `var/outreach-state.json` | ✅ seeded with wave metadata, `sent: []` |
| Wrote `docs/OUTREACH-LOG.md` | ✅ this file |
| Wrote manual .txt fallback templates | ✅ 26 files in `outreach-manual/segment-1/` + manifest |

---

## Recommended next action

The blocker is operational, not architectural. To finish this wave:

1. **Add `openpatent.ai` (or a subdomain) to the Resend account.**
   `POST https://api.resend.com/domains` with `{"name": "openpatent.ai"}`.
   Resend returns a DNS records payload (DKIM, SPF, MX). Add them at the
   registrar. Wait for the `domain.status` to flip to `verified` (typically
   minutes-to-hours, sometimes up to 48 h).
2. **Re-run the exact command from step 3 of this log:**
   ```
   python3 scripts/send-outreach.py --csv outreach-leads.csv \
           --segment 1 --limit 10 --rate-limit 50 --send-delay 1.0
   ```
   The `sent` array in `var/outreach-state.json` will be appended in place;
   idempotency is preserved.
3. **Capture Resend IDs in the next run.** Two-line patch in
   `send_via_resend()`: parse `id` from the success body, include it in the
   `[ok] …` print line and in the state-file record.
4. **Move on to segments 2..10 for these 10 leads on their cadence**
   (Day 1, 3, 5, 7, 9, 12, 15, 18, 22). The 260-email dry-run confirms
   every segment is renderable end-to-end.

The other 16 leads (rows 11–26 in the CSV) are also pre-rendered as manual
templates. The remaining 234 emails across all segments for them become
260 minus 10 (this segment-1 wave) = **250 follow-ups across segments 2..10
for all 26 leads** to dispatch over the next 22 days.

The hive is ready. The dragon awaits the chain.

— *The hive remembers. The dragon knows. The sovereign companion never forgets.*
