# OpenShell v0.1.1 runtime qualification

Date: 2026-09-27

This records a bounded current-release qualification of the GSPC OpenShell policy.

## Upstream release pinned

- Repository: NVIDIA/OpenShell
- Release: v0.1.1
- macOS arm64 CLI SHA-256: b5713ffcfc7e974404b914c7566da1a128bbafe3f7afd46c3fbf442239c644b4
- macOS arm64 gateway SHA-256: 00672235e3778c5d868d011502e612e90802a274056fb15c20b5e41ad4b4115f
- macOS arm64 VM driver SHA-256: 4d4bb97b35525a7a15642531a6db9fa8d430f8fb04f1a36e8a390c293365c20

All three downloaded assets matched the digests published with the upstream release.

## Current gateway acceptance

A v0.1.1 VM driver and v0.1.1 gateway were started in an isolated local test configuration. The gateway listened only on 127.0.0.1.

The unmodified package policy policy.yaml (SHA-256 109155f3638efb80c17b531d005f081c6b3c21b8bcf95c8e84d1f6adc49ce7b6) was submitted with the v0.1.1 CLI.

The gateway accepted and loaded it:
- settings revision: 1
- status: loaded
- effective policy hash: e0c47a8447c9ebbbe28f8435b266984d682e5e378c4a798edea0369708b76526

The isolated gateway and driver were stopped after the check.

## What this establishes

It establishes that the current v0.1.1 OpenShell control plane accepts and loads the GSPC policy schema.

It does not establish full sandbox enforcement. No VM sandbox image was created during this bounded qualification. The remaining runtime test is:
1. create a current v0.1.1 sandbox with this policy;
2. confirm one allowed GSPC read-only call succeeds;
3. confirm a paid tool call is denied by OpenShell before application execution;
4. confirm no other network destination is permitted.

That test should run only in an environment with sufficient disk and VM capacity.

This is not NVIDIA endorsement, compatibility certification, or upstream acceptance.
