# GSPC on NVIDIA OpenShell

A least-privilege OpenShell profile for the public Council of AI GSPC MCP endpoint.

Security boundary:
- default-deny networking;
- only councilof.ai:443/mcp;
- MCP-aware inspection;
- only the current free/read-only GSPC tools are allowed;
- all four current x402/paid tools are explicitly denied;
- no credential provider is required;
- Landlock is a hard requirement;
- the included container runs as a non-root user.

This package does not claim OpenShell endorsement, compatibility certification, or upstream acceptance.

Run:

    docker build -t csoai/gspc-openshell-probe:local .
    openshell sandbox create --name gspc-readonly --from csoai/gspc-openshell-probe:local --policy ./policy.yaml --no-auto-providers

Before publishing:

    python3 verify-package.py
    node probe.mjs

The installed OpenShell CLI on the maintainer Mac may lag current upstream. Current upstream policy schema is the release authority.
