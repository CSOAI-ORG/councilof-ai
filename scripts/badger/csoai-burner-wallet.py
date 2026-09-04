#!/usr/bin/env python3
"""Retired unsafe burner-wallet generator.

The former implementation printed a secret and then wrote the same secret to a
tracked queue path. Terminal/session capture and repository history therefore
made the generated wallet unsafe before it could be funded. Wallet creation now
belongs in an approved wallet or secret-management system outside this repo.
"""
from __future__ import annotations

import sys


def main():
    print("BLOCKED: this generator was retired because it persisted wallet secrets.")
    print("Create a test wallet in an approved wallet/secret manager, never in this repo.")
    print("Pass its secret at runtime through the approved environment binding only.")
    return 2


if __name__ == "__main__":
    sys.exit(main())
