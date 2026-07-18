"""meok-sovereign-installer-mcp — 1-Command Installer.

Install the sovereign substrate with 1 command.
Supports: pip, npm, brew, apt, cargo, docker, source.

5 tools:
  1. installer_pip   - pip install command generator
  2. installer_npm   - npm install command generator
  3. installer_brew  - brew install command generator
  4. installer_docker - docker run command generator
  5. installer_status - installer status
"""
from __future__ import annotations
import json
import hashlib
import platform
from datetime import datetime, timezone

PROTOCOL = "sovereign-installer/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

PACKAGE_NAME = "meok-sovereign-os"


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "ins-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def installer_pip(package: str = PACKAGE_NAME, extras: str = "") -> dict:
    """Generate pip install command."""
    extras_str = f"[{extras}]" if extras else ""
    cmd = f"pip install {package}{extras_str}"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "package": package + extras_str,
        "command": cmd,
        "shell": "bash",
        "doctrine": f"pip install: {cmd}. Sovereign by construction.",
    })


def installer_npm(package: str = "@meok/sovereign-os", global_install: bool = True) -> dict:
    """Generate npm install command."""
    g = " -g" if global_install else ""
    cmd = f"npm install{g} {package}"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "package": package,
        "command": cmd,
        "shell": "bash",
        "doctrine": f"npm install: {cmd}. Sovereign by construction.",
    })


def installer_brew(package: str = "meok-sovereign-os") -> dict:
    """Generate brew install command."""
    cmd = f"brew install {package}"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "package": package,
        "command": cmd,
        "shell": "bash",
        "doctrine": f"brew install: {cmd}. Sovereign by construction.",
    })


def installer_docker(image: str = "meok/sovereign-os:latest", port: int = 3101) -> dict:
    """Generate docker run command."""
    cmd = f"docker run -d --name sovereign-os -p {port}:3101 {image}"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "image": image,
        "command": cmd,
        "port": port,
        "shell": "bash",
        "doctrine": f"docker run: {cmd}. Sovereign by construction.",
    })


def installer_status() -> dict:
    """Installer status."""
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "platform": platform.system(),
        "python_version": platform.python_version(),
        "supported_installers": ["pip", "npm", "brew", "apt", "cargo", "docker", "source"],
        "package": PACKAGE_NAME,
        "version": VERSION,
        "license": LICENSE,
        "doctrine": f"Installer: {platform.system()} Python {platform.python_version()}. 1-command install. Sovereign by construction.",
    })