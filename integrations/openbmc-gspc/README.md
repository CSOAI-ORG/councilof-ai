# GSPC OpenBMC Redfish adapter

A read-only adapter that converts a bounded set of OpenBMC Redfish observations into a GSPC-compatible evidence envelope.

Properties:
- GET only;
- TLS required by default;
- credentials only via OPENBMC_USERNAME / OPENBMC_PASSWORD, never URL or output;
- 1 MiB response cap;
- no recursive crawl;
- origin-only base URL and no HTTP redirects, so an authorized Redfish read cannot be redirected to another service;
- 404 is UNMEASURED, auth/format failures are UNCHECKABLE, transport failure is UNREACHABLE;
- raw Redfish bodies are hashed but not copied into the evidence envelope;
- no firmware mutation, D-Bus writes, resets, updates, account changes, or certificate claims.

Example:

    export OPENBMC_USERNAME=...
    export OPENBMC_PASSWORD=...
    ./gspc-openbmc-collector --base-url https://bmc.example

This is a candidate package, not an accepted OpenBMC component. OpenBMC asks new functionality to be discussed before non-trivial implementation, uses Gerrit for most changes, expects tests, and requires the applicable OpenBMC CLA. CSOAI Linux Foundation membership does not by itself establish OpenBMC CLA completion.

The Yocto recipe under meta-gspc installs only the CLI; it does not enable a daemon by default.
