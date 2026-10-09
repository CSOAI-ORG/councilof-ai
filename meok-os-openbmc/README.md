# MEOK × OpenBMC — Hardware Root of Trust for Sovereign Hives

OpenBMC is the Linux Foundation open-source Baseboard Management Controller
firmware (https://github.com/openbmc/openbmc). MEOK AI OS builds on top of it
to give every one of the **33 sovereign hives** a hardware-rooted identity,
measured boot chain, and SIGIL-signed attestation stream.

## What lives here

| File | Role |
|------|------|
| `bmc-firmware.yaml` | OpenBMC firmware spec for the 33 hives (build matrix, layers, signing) |
| `meok-bmc-daemon.c` | C daemon that runs inside OpenBMC userspace, emits SIGIL-signed hardware attestations over a Unix socket |
| `meok-redfish-api.py` | Minimal Redfish API server (REST) for the sovereign BMC, exposes `/redfish/v1/...` endpoints |
| `trust-anchor.yaml` | Hardware root-of-trust config: TPM 2.0 PCR policy, measured boot chain, key custody |

## Why this matters

A sovereign AI OS without a hardware root of trust is a politely-worded SLA.
MEOK's compliance operator refuses to admit a node whose BMC cannot:

1. Prove it booted a known-good image (measured boot + TPM PCR 0/2/4/7).
2. Sign an attestation with a key that is **not** extractable from the TPM.
3. Publish a fresh quote every 30 seconds with a monotonically-incrementing
   counter (PCR-tpm-eventlog style).

The Redfish API exposes everything the upper layers (MEOK agent, OpenShell
operator) need to verify a node before it joins a hive.

## Quick start (host)

```bash
# Cross-compile the BMC daemon (MIPS little-endian, OpenBMC default target)
$CC=mips-linux-gnu-gcc make -C meok-os-openbmc meok-bmc-daemon

# Drop it into the OpenBMC image
scp meok-bmc-daemon root@bmc:/usr/bin/

# Configure trust anchor
bmc> config trust-anchor load < trust-anchor.yaml

# Start the daemon
bmc> systemctl enable --now meok-bmc-daemon.service
```

## License

Apache-2.0 — MEOK AI OS.
