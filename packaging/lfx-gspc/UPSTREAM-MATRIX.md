# GSPC upstream production matrix

| Target | Package state | Verified now | Remaining upstream / production gate |
|---|---|---|---|
| NVIDIA OpenShell | candidate under integrations/openshell-gspc/ | live 28 Sep MCP list matched the narrowed policy: 9 read-only tools allowed, 4 paid tools denied; official v0.1.1 CLI/gateway/VM-driver digests; v0.1.1 gateway previously loaded the 27 Sep policy | current narrowed policy still needs a gateway load and sandbox positive/negative enforcement run; first-time contributor vouch; maintainer review |
| OpenBMC | candidate under integrations/openbmc-gspc/ | Python unit/security tests; compile/static recipe checks; temporary Redfish fixture | BitBake/OpenBMC image build; applicable OpenBMC CLA; design/community/Gerrit review |
| LFX Security / PCC | onboarding metadata + SBOM candidate | local metadata/hash checks; public Scorecard, Dependabot and CITATION verified | publish local SECURITY.md, CONTRIBUTING.md, .github/CODEOWNERS; authenticated PCC decision; LFX Security GitHub App authorization |
| OpenSSF Best Practices | repository prerequisites partly public | public Scorecard/Dependabot/CITATION; local Security/Contributing/CODEOWNERS candidate | publish missing repository prerequisites; complete actual BadgeApp self-assessment before any badge claim |
| Open Secure AI Alliance SAFE | reuse existing GSPC SAFE crosswalk | existing repo/crosswalk artifacts | Alliance review/acceptance; do not create a competing SAFE format |

None of these rows is a certification, upstream acceptance, or deployment claim.
