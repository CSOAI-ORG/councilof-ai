#!/usr/bin/env python3
"""Send the 3 verified outbound messages via smtplib (single-From — fixes the multi-From bounce defect).
Receipts logged to _alignment/SEND-RECEIPTS-2026-10-07.md"""
import smtplib, subprocess, os
from email.message import EmailMessage
from email.utils import formatdate, make_msgid

PW = subprocess.check_output(["/Users/nicholas/scripts-eapw.sh"], text=True) if False else None
PW = subprocess.check_output(["bash", "/Users/nicholas/.hermes/scripts/email-pw.sh"], text=True).strip()
FROM = "Nicholas Templeman <nicholas@csoai.org>"
SMTP_HOST, SMTP_PORT = "mail.privateemail.com", 587
RECEIPTS = []

def send(to, cc, subject, body):
    m = EmailMessage()
    m["From"] = FROM            # exactly ONE From (the 550 defect fix)
    m["To"] = to
    if cc:
        m["Cc"] = cc
    m["Subject"] = subject
    m["Date"] = formatdate(localtime=True)
    m["Message-ID"] = make_msgid(domain="csoai.org")
    m.set_content(body)
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=60) as s:
        s.starttls()
        s.login("nicholas@csoai.org", PW)
        s.send_message(m)
    RECEIPTS.append((to, subject))
    print("SENT ->", to, "|", subject[:60])

# ── 1) SCITT FREEZE ANSWER (threaded, deadline Sat 10 Oct) ──────────────────
scitt_cc = ("hello@vaara.io, e.dogru@conarium.dev, kontakt@b7n0de.com, founder@phionyx.ai, "
            "wdhawkins46@gmail.com, anton.sokolov@tyche.institute, playplay2736@gmail.com, "
            "wangguigui@correctover.com, 234114134@coze.email, tiago@donttrustverify.pt, "
            "mmsebenzi@gmail.com, vernon@sigilcore.com, team@emiliaprotocol.ai, "
            "bluedognull@gmail.com, Todd.Gibson@t-mobile.com, nenadvasic@protonmail.com, "
            "standards@certisyn.com")
scitt_body = """Joel, Henri, all,

Both files checked here and both digests match exactly:

    SCITT-Interop-Report-2026-10-05-rev7.md
    ae7baf7a13a019c2da31da8794f9a647ba4b61b686a9f0051cebd510f0f33743
    Interop-rows-2026-10-05-rev7.txt
    93d5f8aa6fa431f2888cdfc180d6aaf0e8c67152d7aab21c4f626a58f044927c

One answer, as asked.

CONFIRMATION
- The sentences carrying my name are accurate as carried. Rows 1-3 (Vaara
  SEP-2828 reproduction; Cedulon at bdddc4cb reproduction; EMILIA
  vectors.reference.json independent-implementation) are mine and correct,
  including the 5 September correction as carried.
- The NC5 non-comparable pair stands as quoted: "Keep it on its own row. Do
  not collapse it into mine. Same pin, different platform, different
  verifier." The editorial ruling as carried is fine by me.
- Item 10 (live GSPC endpoint check) is correct as carried: every figure is a
  reading at its stated date and none is a current value. My request that the
  22/15/7 wording and the seven UNMEASURED financial rows be struck is on
  record at my instruction, and I confirm my reason for declining a kind as
  quoted.
- The early e681e24d run stays a separate historical run.
- Author list at 6.4: confirmed.

THE FOURTH CONSENT (terms)
Terms for my own material: CC BY 4.0. Please carry that verbatim.

THE CORRECTION (one, and it changes both files)
The archive link carried for my two Cedulon findings is wrong, as the report
already records: it resolves to my bdddc4cb reproduction of 26 August
04:41:24 UTC, which carries neither finding. The intended source is my list
message of 25 August 2026, 17:31 UTC. In checking my own sent record for the
archived copy you asked for, I find I cannot retrieve a message at that exact
timestamp (my sent record for 25 August runs 04:55, 11:48 and 13:36 UTC and
then resumes 26 August 04:41 UTC). Rather than guess a link, here is the
content that message carried, restated so it has a real archived source -
this reply:

The two findings were:
  (i)  reconciliation against a separate settlement array, and
 (ii)  trusting the key supplied inside the extract.

If you hold the original in the thread you reconstructed, landing its true
link is still the better outcome and I would rather it were used; if not,
please cite this reply as the archived copy for the findings and keep the
wrong-link record exactly where it is. Either way, one correction, once, as
you asked - and since it changes both files, please send the new digests and
I will give final sign-off on those bytes.

Best,
Nicholas Templeman
Council of AI (csoai.org)"""

# ── 2) B3 SelectHub (Mitch Tomlin, inbound 1 Oct - owed reply) ──────────────
b3_body = """Mitch -

Happy to take the intro call. Context so you know what you are looking at:

Product: GSPC - open AI measurement board at https://councilof.ai
- Independent measurement body (CSOAI LTD, UK 16939677). Measurement, not
  certification - we never sell a grade, rank, or certificate.
- Free public board + free verification forever: https://councilof.ai/gspc-verify
- Machine-readable catalog for agents: https://councilof.ai/api/x402 and /.well-known/x402.json
- MCP server: https://councilof.ai/mcp

What a SelectHub listing would represent: discovery / directory presence
only. We will not claim SelectHub adoption, and we will not restate any
third-party grade as a CSOAI product.

Category fit: AI governance / model evaluation / compliance evidence tooling
- for buyers who need signed, re-verifiable measurement artefacts (evidence
packs, attestation commissions, proof bundles), not a scorecard.

Pricing model (public): free board + free verify; metered paid artefacts via
x402 (USDC on Base) or GBP invoice for scoped work. Amounts appear only in
payment challenges - https://councilof.ai/pricing

I can do the calendar at https://calendar.app.google/pC67mFyNXCopxV6u6 if you
want 20 minutes this week or next.

- Nicholas Templeman
CSOAI LTD - https://councilof.ai
Measurement, not certification."""

# ── 3) B2 Circle (Julie McKenna) - scope reply ──────────────────────────────
b2_body = open("/Users/nicholas/clawd/_alignment/docs/outreach/drafts/CLOSE-B2-CIRCLE-scope-reply-2026-10-03.md").read()
# strip the internal header + send-checklist (never send internal notes)
lines = b2_body.splitlines()
keep = [l for l in lines if not l.startswith("#")]
txt = "\n".join(keep)
txt = txt.split("---\n## Send checklist")[0].split("## Send checklist")[0]
txt = txt.replace("**To:** julie.mckenna@circle.com\n**Subject:** Re: Partnering with Circle — measurement evidence on Circle rails\n", "")
txt = txt.replace("**To:** julie.mckenna@circle.com\n**Subject:** Re: Partnering with Circle - measurement evidence on Circle rails\n", "")
b2_body = txt.strip() + "\n"

send("jhillier@certisyn.com", scitt_cc,
     "Re: Both files, both digests, closing Saturday 10 October", scitt_body)
send("mitch@selecthub.com", None,
     "Re: SelectHub — CSOAI GSPC (AI measurement) listing", b3_body)
send("julie.mckenna@circle.com", None,
     "Re: Partnering with Circle — measurement evidence on Circle rails", b2_body)

# receipts
with open("/Users/nicholas/clawd/_alignment/SEND-RECEIPTS-2026-10-07.md", "w") as f:
    f.write("# SEND RECEIPTS 2026-10-07 (single-From, smtplib, owner-ordered 'do all of them')\n")
    for to, subj in RECEIPTS:
        f.write(f"- SENT {to} | {subj}\n")
    f.write("\nG-debt close: B2 Circle scope reply (was drafted Oct 3) · B3 SelectHub (inbound Oct 1, owed) · SCITT freeze answer (deadline Sat 10 Oct, digests matched, fourth consent CC-BY-4.0, correction restated in-thread).\n")
print("ALL SENT:", len(RECEIPTS))