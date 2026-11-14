# Read-only external Redfish evidence adapter for GSPC

Author: Nicholas Templeman / CSOAI LTD

Other contributors: None

Created: September 27, 2026

## Problem Description

Operators can read OpenBMC Redfish state, but evidence used outside the BMC is often
copied without a stable observation time, source hash, explicit missing-data state,
or a clear boundary between observation and certification. The proposal is a
read-only adapter that turns a small, bounded set of Redfish GET responses into a
portable evidence envelope. The goal is reproducible observation. The non-goals are
firmware mutation, remote management, compliance judgement, or replacing OpenBMC's
existing Redfish/D-Bus interfaces.

## Background and References

OpenBMC is modular: external interfaces are normally handled by components that
translate requests to internal D-Bus state. Redfish is already the appropriate
external interface for the information this adapter observes.

GSPC is an external measurement/evidence system. The candidate adapter does not ask
OpenBMC to adopt GSPC as an authority. It treats OpenBMC Redfish as the source and
records a digest, selected non-secret fields, observation time, and one of
MEASURED / UNMEASURED / UNCHECKABLE / UNREACHABLE.

Primary references:
- OpenBMC: https://github.com/openbmc/openbmc
- OpenBMC contribution guide:
  https://github.com/openbmc/docs/blob/master/CONTRIBUTING.md
- GSPC public verifier: https://councilof.ai/gspc-verify/

## Requirements

The adapter is for operators or test systems that need a portable record of a
small Redfish observation. It must be safe to run against a production BMC.

Requirements:
- GET only.
- HTTPS required except explicit loopback test mode.
- Credentials may come from environment variables but never from a URL or output.
- No recursive discovery.
- Individual responses are capped at 1 MiB.
- Raw response bytes are SHA-256 hashed but not copied into the emitted envelope.
- Only a small selected field set is emitted.
- HTTP 404 is UNMEASURED, format/auth errors are UNCHECKABLE, transport failure is
  UNREACHABLE.
- The adapter never changes accounts, power, firmware, networking, certificates,
  inventory, or D-Bus state.
- Installation in an OpenBMC image must be optional; no daemon is enabled by default.

Typical invocation rate is operator-initiated or CI-scale, not a continuous polling
daemon.

## Proposed Design

The implementation is a small Python CLI with no project-specific server. It performs
bounded HTTPS GETs to configured Redfish paths and emits one JSON envelope.

The candidate Yocto layer installs the CLI under the normal binary directory. It
does not install or enable a systemd unit.

Data flow:

    operator/CI
        |
        v
    gspc-openbmc-collector -- GET only --> bmcweb / Redfish
        |
        +--> selected fields
        +--> SHA-256 of response bytes
        +--> observation state/time
        |
        v
    portable evidence JSON

No D-Bus method is called directly and no write method is sent.

## Alternatives Considered

1. Add a new D-Bus daemon.
   Rejected for the initial proposal because Redfish already provides the external
   data interface and an extra resident service would increase firmware complexity.

2. Store raw Redfish responses.
   Rejected because evidence portability does not require copying potentially
   sensitive fields; hashing plus selected fields is a smaller disclosure surface.

3. Run the adapter only off-BMC.
   This remains a viable deployment mode. The optional Yocto recipe exists only so
   maintainers can evaluate whether a packaged CLI is useful. The design does not
   depend on on-BMC installation.

4. Treat unavailable data as failure or zero.
   Rejected because absence, inability to check, and a measured negative result are
   different claims.

## Impacts

API impact: none to Redfish or D-Bus.

Security impact: read-only network client; credentials are never emitted; response
size is bounded; raw bodies are not copied into output. A deployment still needs to
protect its environment variables and CA trust.

Documentation impact: installation and evidence-state semantics require docs.

Performance impact: bounded GETs only; no background service.

Developer impact: optional recipe/layer and tests.

Upgradability impact: field selection and schema are versioned independently of
OpenBMC Redfish API versions.

### Organizational

- New repository required: No for the candidate. It currently lives with GSPC.
- Initial maintainer: CSOAI LTD.
- OpenBMC repositories to modify: to be decided by OpenBMC maintainers after design
  discussion. No upstream repository is assumed in advance.

## Testing

Completed locally:
- 7 unit/security tests;
- Python compile;
- recipe/license/static checks;
- real temporary HTTP Redfish-like fixture exercising MEASURED and UNMEASURED
  records;
- confirmed no raw secret fixture fields in output;
- confirmed GET-only request method.

Still required upstream:
- applicable OpenBMC CLA;
- design/community review;
- BitBake build in a supported OpenBMC/Yocto environment;
- bmcweb fixture or hardware/lab integration test;
- maintainer decision on whether on-BMC packaging is desirable.
