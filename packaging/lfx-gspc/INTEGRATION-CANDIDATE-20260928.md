# Open stack integration candidate — 28 September 2026

This package is a source-only connection between the existing Council of AI measurement surface and three open project interfaces. It is not an Open Secure AI Alliance, LFX, OpenBMC, NVIDIA, Cisco, CrowdStrike, Red Hat or Palantir deployment or endorsement.

## What is executable now

1. `integrations/openshell-gspc/verify-package.py` checks the OpenShell policy against the **live** public CSOAI MCP inventory. A later 28 September readback found 13 tools: nine allowed read-only names and four paid names denied by policy. Three previously advertised read-only names were absent, so the allowlist was narrowed and rechecked. This checks declarations and a free public endpoint; the current policy still needs a gateway load and a separate sandbox allow/deny enforcement test.
2. `integrations/openbmc-gspc/gspc-openbmc-collector` is a GET-only Redfish observation adapter. Its bounded records retain response hashes and explicit MEASURED / UNMEASURED / UNCHECKABLE / UNREACHABLE states. This candidate rejects base paths, queries and fragments and never follows redirects, preventing an origin switch during credentialed collection. Nine tests pass. No real BMC has been contacted for this candidate.
3. `measurement/crosswalk/sources/osaia-safe.json` is included by exact digest. It retains the existing SAFE RFC vocabulary; this package invents no competing SAFE format or incident authority.
4. `packaging/lfx-gspc/verify-local.py` checks the exact-byte manifest and the pinned SAFE crosswalk. A tampered file fails verification. LFX onboarding is a separate authenticated project action.

## The operational boundary

OpenShell is the agent's least-privilege tool boundary. OpenBMC is an optional operator-authorized evidence **source**. GSPC/evidence intake classify observations; they do not turn Redfish fields or a blocked tool call into a model score. SAFE's proposed controls give the review vocabulary; confidential incident reports must not be sent to public GSPC. LFX's project services are onboarding and visibility tools, not a shared live data bus. Where a member's platform requires credentials or tenant permission, only a customer-authorized adapter can connect it.

The five organisations named in the business brief appear among announced Alliance partners, but the available charter and public Alliance materials do not identify them as the five current steering-seat holders. Treat their open projects as independent interfaces and do not claim committee sponsorship.

## Release gates

- Run an actual current OpenShell sandbox: allowed free `board_totals` succeeds and a paid tool call is denied **before** reaching the application. Retain policy hash, event trace and redacted receipts.
- Run the OpenBMC collector against a consenting test BMC, with TLS and credentials, checking redirects, 404, transport failure and no secret leakage. An OpenBMC image/Yocto build and upstream design/Gerrit/CLA are separate gates.
- Join the resulting evidence through existing intake with source digest, observation time, method, uncertainty and correction pointer. Admit only reviewed measurements. Sign/anchor only the admitted exact bytes through the established single-writer ceremony.
- Release through the guarded Cloudflare-first publisher and verify anonymous bytes. LFX PCC and any vendor tenancy need their own authorization; no automatic cross-company monitoring exists from Alliance membership.

## Local checks

`python3 packaging/lfx-gspc/verify-local.py`

`python3 -m unittest discover -s integrations/openbmc-gspc/tests -v`

`python3 integrations/openshell-gspc/verify-package.py` (requires access to the public CSOAI MCP URL)
