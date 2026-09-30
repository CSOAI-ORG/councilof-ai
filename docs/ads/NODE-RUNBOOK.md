# Our own ADS node: evaluation and runbook (not deployed)

Lane `lane/ads-evidence-20260930`, 30 Sep 2026. Nothing here was run against the public network.

## Finding: joining the public federation is not permissionless

Anyone can run an AGNTCY Directory node. Joining the production federation needs the operators' approval:

- The production trust domain is `spire.ads.outshift.io` (bundle endpoint `https://spire.ads.outshift.io`, profile `https_web`).
- A new node brings its own SPIRE trust domain. It forks `agntcy/dir-staging`, adds `onboarding/federation/<domain>.yaml`
  (`className: dir-spire`, `trustDomain`, `bundleEndpointURL`, `bundleEndpointProfile: {type: https_web}`), opens a pull
  request and waits for the merge. "Prod must add your bundle", and the production authorization policy must list the
  new trust domain. Source: dir.agntcy.org, *Federation setup* (read 30 Sep 2026).
- The node needs a Kubernetes cluster with Ingress, cert-manager with a Let's Encrypt issuer, and public DNS.

So the step that matters is an **owner step**: a pull request to `agntcy/dir-staging` from the clean GitHub account.
It is an application to join, and it may be refused. Until it is merged we are a standalone node, which is not a
listing and not adoption.

## What "verify through ADS" checks today

- **Integrity.** The CID is a SHA-256 digest, so any node can check that the content matches its identifier
  (draft-mp-agntcy-ads-02).
- **Signature and identity.** Records are signed with sigstore: OIDC through Fulcio and Rekor, cosign keys, or KMS.
  `dirctl verify` checks the signature against `--key` or `--oidc-issuer`/`--oidc-subject`, and checks the Rekor
  transparency log unless `--ignore-tlog` is given. Name verification requires a JWKS at `<domain>/.well-known/jwks.json`.
- **Not behaviour.** Verification does not look at what a record's server does. The separate reconciler scanners
  (MCP, Skill, A2A) mark a record "safe" when at least one scanner ran and none reported an issue. That is a static
  scan, not a behavioural measurement.

This gap is where our evidence goes. Our OASF records carry `core/evaluation` pointers to signed behavioural evidence
(`public/oasf/*.oasf.json`, rendered by Harness X), and GSPC Route reads ADS/ARD listings as discovery only.

## Standalone node (evaluation only; not run in this lane)

The lanes pod has no Docker, so no local node was started. The route tests use recorded live responses of the public
ARD gateway (`https://ai-catalog.outshift.io/v1/agents`) instead. On a host with Docker:

```sh
git clone https://github.com/agntcy/dir && cd dir/install/docker
docker compose up -d        # apiserver :8888 (gRPC), zot :5555 (OCI), postgres, reconciler
# or, single process: brew install agntcy/dir/dirctl && dirctl init && dirctl daemon start
#   (8888 gRPC, 8889 HTTP API, 8999 DHT, 5555 OCI; SQLite + local OCI under ~/.agntcy/dir/)
dirctl push public/oasf/ai.councilof.gspc.oasf.json          # -> CID
dirctl sign <CID> --key cosign.key                            # a local key: nothing reaches Rekor
dirctl verify <CID> --key cosign.pub
dirctl search --skill "ai_ml_engineering/model_evaluation/agent_evaluation"
```

Do not run `dirctl routing publish` against the public network. Do not use `--oidc-token` from a CI identity unless the
owner has agreed to put that identity in the public Rekor log.

## Owner steps (in order)

1. Pick the route into the directory: (a) the `agntcy/dir` import-records PR (one entry `{"search": "ai.councilof/"}`,
   prepared in the AGNTCY lane and HELD there), or (b) our own directory identity to push and sign.
2. To run our own federated node: a Kubernetes host, a public DNS name, and the `agntcy/dir-staging` federation PR.
3. After any listing: read it back through the public ARD gateway, and record the observation in the Layer 0 registry.
