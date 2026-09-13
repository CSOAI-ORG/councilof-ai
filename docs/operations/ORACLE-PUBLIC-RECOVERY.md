# Oracle public-root recovery mirror

`harness/arena/public-recovery-backup-oracle.sh` creates an additive, versioned
Oracle mirror of the public files needed to restore the currently admitted root.
It does not change or replace `harness/arena/arena-backup-oracle.sh`.

The generator refuses to emit a bundle unless the existing live root/witness
release gate passes against production. It records the exact Git commit and tree,
hashes of the deploy configuration, and SHA-256 plus byte length for every copied
file. The Oracle script uploads to a temporary directory, runs the same verifier
on Oracle, and changes `current` only after every remote hash and root/witness
binding passes.

Run from a checkout whose covered public and configuration files match `HEAD`:

```bash
bash harness/arena/public-recovery-backup-oracle.sh
```

The payload contains the signed `public/root.json`; its schema and DID document;
the current pointer, immutable sidecar, Rekor snapshot and OpenTimestamps proof;
the public verification guides and signed-card corpus boundary; and the root's
card wrappers and inclusion proofs. It contains no environment file, credential,
token, private key, database, repository bundle, or unrelated public asset.

For recovery, copy the version named by `current`, inspect
`recovery-manifest.json`, check out its exact `git.commit`, and run:

```bash
python3 scripts/public_recovery_manifest.py verify --bundle-dir /path/to/bundle --repo .
rsync -a --checksum /path/to/bundle/public/ public/
python3 scripts/root-witness-release-gate.py --phase candidate --public-dir public
python3 scripts/root-witness-release-gate.py --phase live --public-dir public
```

Do not serve the restored tree unless the fresh live gate passes. The admission
result in the manifest is a timestamped historical result, not continuing proof
that production is healthy. This subset also cannot recreate the application or
Git history on its own; retain the existing repository mirrors for that purpose.
