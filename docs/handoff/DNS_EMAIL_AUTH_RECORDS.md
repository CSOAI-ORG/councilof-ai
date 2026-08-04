# DNS email-authentication records — ready to paste (2026-08-04)

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
