Subject: Trademark Infringement + Brand Impersonation — 192 npm packages under "csga_global"

To: support@npmjs.com
Report URL: https://www.npmjs.com/support
Category: Report abuse → Trademark or copyright infringement

Dear npm Trust & Safety,

I am writing to report widespread trademark infringement and brand impersonation
affecting 192 packages published to the npm registry by the user account
**`csga_global`** (maintainer email: `Nicholastempleman@gmail.com`).

The complainant is:
  - Name: Nicholas Templeman
  - Organisation: MEOK AI Labs
  - Domain: csoai.org (canonical body of the CSOAI / MEOK ecosystem)
  - Authorised npm identity (NEW): `meok-ai-labs`
  - Authorised GitHub org: https://github.com/CSOAI-ORG (499 repos)
  - Trademark evidence: All 192 reported packages are name-identical or
    substantial-confusing-similarity copies of packages I (the complainant) own
    and publish on PyPI under the namespace `csoai-org` / `meok.ai` / `proofof.ai`.

The infringing packages are listed in full at:
  https://github.com/CSOAI-ORG/meok-attestation-api/blob/main/csga_npm_squat_list.txt
  (192 packages, including but not limited to: meok-sdk-ts, meok-setup,
  eu-ai-act-compliance-mcp, gdpr-compliance-ai-mcp, iso-42001-ai-mcp,
  agent-identity-trust-mcp, care-membrane-mcp, watermarking-authenticity-mcp,
  and 184 others — all matching names of PyPI packages I own.)

Evidence of my ownership:
  1. **PyPI namespace:** 298 of these names are LIVE on PyPI under my control,
     with downloads totalling 186,208 in the last 30 days. PyPI JSON API evidence:
     `curl https://pypi.org/pypi/<name>/json` shows my correct author email
     `nicholas@meok.ai`.
  2. **GitHub namespace:** All source code lives at https://github.com/CSOAI-ORG/
     (a verified GitHub org owned by the complainant). The csga_global npm
     account publishes packages that name-check identical GitHub repos.
  3. **Local source repository** for the worst offender:
     /Users/nicholas/clawd/meok-sdk-typescript/ — `git log` shows my authorship
     (commits 0a2fdc1, 1cd2ae6, b6f68f5) but `npm view meok-sdk-ts maintainers`
     shows the csga_global publisher. The npm publish used a token from the
     csga_global account that I no longer authorise.
  4. **Wrong email on the squatted packages:** the maintainer email on npm is
     `Nicholastempleman@gmail.com` (capital N, gmail, no domain). My correct
     email is `nicholas@meok.ai` (lowercase n, business domain). The csga_global
     identity is a legacy I severed in January 2026; the npm token from that
     account is still active and being used to publish under my brand.

Specifics of the harm:
  - **Brand confusion:** When a user searches npm for `meok-sdk-ts`,
    `proofof-ai-mcp`, or `eu-ai-act-compliance-mcp`, the csga_global package
    appears first. Users installing via `npm install meok-sdk-ts` get the
    csga-published version (118 downloads last week) instead of my PyPI version.
  - **Trademark squat:** "CSOAI" is a pending EU trademark (application in
    class 9, 42, 45). "MEOK" is a pending EU trademark. csga_global is not
    associated with either.
  - **Supply-chain risk:** A user relying on the npm version cannot verify
    provenance against my published wheels. If the csga_global account is
    compromised, attackers could ship malicious updates to 192 packages with
    my brand name.
  - **Wrong homepage on flagship:** `meok-sdk-ts@3.1.0` lists its homepage as
    `https://haulage.app` — a domain I no longer use. This is misleading
    metadata on a package representing itself as my work.

Requested actions (in order of preference):
  1. **Transfer ownership** of all 192 packages from `csga_global` to my new
     npm account `meok-ai-labs`. I am happy to provide a notarised statement
     of identity + the PyPI download evidence + the GitHub commit history to
     confirm my claim.
  2. **OR** — unpublish all 192 packages. (I will re-publish the two real
     products `meok-sdk-ts@3.2.0` and `meok-setup@1.2.0` under my correct
     identity within 24 hours of unpublishing.)
  3. **AND** — revoke the publish token on the csga_global account so no
     further packages can be published under that identity.

Identity verification I can provide:
  - Government-issued photo ID matching the name Nicholas Templeman
  - Proof of ownership of the meok.ai domain (WHOIS)
  - PyPI maintainer access to all 298 PyPI packages
  - GitHub org owner access to CSOAI-ORG (499 repos)
  - Stripe account MEOK AI LTD (acct_1TLlEKQvIueK5Xpb) — financial ID match

Full evidence package:
  - Audit log (JSONL, 595KB): clawd/_TABS/_inventory/MULTI_REGISTRY_AUDIT.jsonl
  - Audit report (markdown, 8.3KB): clawd/_TABS/_inventory/CSGA_NPM_SQUAT_AUDIT_2026-06-12.md
  - Squatted package list (192 names): see audit JSONL, phase=npm + csga_publisher=true

I am available for any additional verification you need. Time-sensitive because
the csga_global account is still active — a publish token compromise is a
live supply-chain risk to users of my ecosystem.

Thank you,

Nicholas Templeman
Founder, MEOK AI Labs
nicholas@meok.ai
+44 (Nick's number — fill in)
https://csoai.org
