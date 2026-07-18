#!/usr/bin/env python3
"""Shared utilities for the openpatent.ai hive.

Modules:
  metrics         — Prometheus instrumentation
  tracing         — W3C trace-context propagation
  sigil           — structured Ed25519 envelopes (this task)
  sigil_chain     — tamper-evident last-1000 sigil chain
"""
__all__ = ["metrics", "tracing", "sigil", "sigil_chain"]
