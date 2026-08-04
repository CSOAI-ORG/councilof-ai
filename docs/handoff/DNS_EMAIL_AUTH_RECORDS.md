# DNS email records — ready to paste (2026-08-04, CORRECTED)

> **CORRECTION.** An earlier version gave `v=spf1 -all` null-sender records for meok.ai on
> the assumption it was a non-sending domain. Wrong: meok.ai is the published `security.txt`
> Contact (`security@meok.ai`) and the founder's address (`nicholas@meok.ai`).

## THE ACTUAL EMAIL FAULT — meok.ai cannot RECEIVE mail

    domain          MX records
    csoai.org       mx1.privateemail.com, mx2.privateemail.com   OK
    meok.ai         NONE   <-- inbound mail fails
    proofof.ai      NONE
    councilof.ai    NONE

With no MX, RFC 5321 falls back to the A record — 104.21.66.220, which is Cloudflare and
does not run SMTP. Mail to nicholas@meok.ai or security@meok.ai never arrives.

`security@meok.ai` is the vulnerability-disclosure contact in security.txt on THREE domains.
A researcher reporting a flaw has never been able to reach it.

### Fix A — make meok.ai receive (uses the mailbox already paid for)

    MX   @   10   mx1.privateemail.com
    MX   @   10   mx2.privateemail.com
    TXT  @        v=spf1 include:spf.privateemail.com ~all

Then add meok.ai as a domain in the PrivateEmail control panel.

### Fix B — instant and free

Change the security.txt Contact on all three sites to an address on **csoai.org**, which has
working MX today.

### Outbound note

csoai.org sends via **Resend** (`include:spf.resend.com`) and receives via **PrivateEmail**.
If meok.ai ever sends, its SPF must include Resend or the mail is rejected — Google and
Yahoo hard-reject unauthenticated bulk mail since ~Nov 2025.

---

# Original null-sender guidance (correct only for genuinely non-sending domains)

MEASURED TODAY with `dig`:

    domain              MX      SPF     DMARC
    csoai.org           yes     yes     p=none      (monitoring only — no enforcement)
    councilof.ai        NONE    NONE    NONE        spoofable
    meok.ai             NONE    NONE    NONE        spoofable
    proofof.ai          NONE    NONE    NONE        spoofable
    safetyof.ai         NONE    NONE    NONE        spoofable
    cobolbridge.ai      NONE    NONE    NONE        spoofable

A domain with no SPF and no DMARC can be spoofed by anyone. For domains whose product is
trust attestation this is the cheapest, highest-severity gap open — free to fix, no outage
risk, no code change.

## For the five NON-SENDING domains (councilof.ai, meok.ai, proofof.ai, safetyof.ai, cobolbridge.ai)

If a domain never sends mail, publish a null-sender policy. This is strictly better than
leaving it empty and takes two TXT records each.

    TXT  @         v=spf1 -all
    TXT  _dmarc    v=DMARC1; p=reject; rua=mailto:security@meok.ai; aspf=s; adkim=s

`v=spf1 -all` says "no host is authorised to send as this domain". `p=reject` tells
receivers to drop anything that fails. Strict alignment (aspf=s, adkim=s) prevents
subdomain-relaxation abuse.

Optional but cheap, blocks null-MX spoofing attempts:

    MX   @         0 .

## For csoai.org (a SENDING domain — do NOT jump straight to reject)

It already has MX + SPF and `p=none`. Roll forward in stages, watching the rua reports:

    week 1-2   v=DMARC1; p=none;       rua=mailto:security@meok.ai; pct=100
    week 3-4   v=DMARC1; p=quarantine; rua=mailto:security@meok.ai; pct=25
    week 5-6   v=DMARC1; p=quarantine; rua=mailto:security@meok.ai; pct=100
    week 7+    v=DMARC1; p=reject;     rua=mailto:security@meok.ai; aspf=s; adkim=s

Do not skip the aggregate-report stage: `p=reject` on a sending domain without first reading
rua reports will silently drop legitimate mail from any service you forgot about.

Also confirm DKIM is signing at the provider (privateemail.com) and that the selector
resolves, otherwise DMARC alignment can only ever pass on SPF.

## Verify after applying

    dig +short TXT councilof.ai            # expect v=spf1 -all
    dig +short TXT _dmarc.councilof.ai     # expect v=DMARC1; p=reject; ...
    dig +short MX  councilof.ai            # expect 0 .

## Why this is ranked first among the free fixes

Google and Yahoo bulk-sender rules have been hard-enforced since ~Nov 2025 — unauthenticated
mail is rejected outright, not filed to spam. And a governance vendor whose domains can be
spoofed is a specific, demonstrable credibility problem, not a theoretical one.
