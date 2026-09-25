# councilof-mcp 1.0.2 — licence change staged, NOT published

The owner ruling of 25 Sep 2026 moves new versions of `councilof-mcp` (PyPI) from MIT to
Apache-2.0. Earlier versions (1.0.0, 1.0.1) were released under MIT and remain MIT.

## Why this is a patch and not a package directory

The package's source is not in this repository, and its declared repository
`https://github.com/CSOAI-ORG/councilof-mcp` answered **404** to an anonymous API request on
2026-09-25 (private, renamed or deleted — the 404 does not say which). A stale 1.0.0 copy exists
in the Mac evacuation backup (`/evac-bulk/mac-evac/clawd_backup/mcp-marketplace/councilof-mcp`),
but the published bytes are the authority, so the patch is made against the **PyPI 1.0.1 sdist**:

    councilof_mcp-1.0.1.tar.gz
    sha256 2b29814eae1effc9af052bb644f78d8422f21ed21b54845462a9cf596550a8db

The package's code and README (DEFONEOS / MEOK product text) are deliberately not imported into
councilof-ai: this lane changes the licence, nothing else.

## What the patch changes

| file | change |
|---|---|
| `pyproject.toml` | version 1.0.2; `license = "Apache-2.0"` (PEP 639 expression) + `license-files = ["LICENSE", "NOTICE"]`; the `License :: OSI Approved :: MIT License` classifier removed (PEP 639 forbids both); `build-backend = "hatchling.build"` declared and `hatchling>=1.27` required |
| `LICENSE` | MIT text replaced by the Apache License 2.0 text (sha256 `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30`) |
| `NOTICE` | new: the copyright line carried over verbatim from the MIT LICENSE, and the version boundary |
| `CHANGELOG.md` | new: "Licence changed from MIT to Apache-2.0 from this version; earlier versions remain MIT." |
| `README.md` | licence badge and License section |
| `councilof_mcp/__init__.py` | `__version__` 1.0.0 → 1.0.2 (1.0.1 shipped reading 1.0.0) |

Build-backend note: 1.0.1 listed `hatchling` in `build-system.requires` but named no
`build-backend`, so frontends fell back to setuptools (the 1.0.1 sdist carries `setup.cfg` and an
`.egg-info`). 1.0.2 declares the backend its own `[tool.hatch]` table was written for.

## Apply and verify (owner or release lane)

```bash
curl -sO https://files.pythonhosted.org/packages/47/e7/ee0aea67b0c6ae8e07690ca2304f14c5be373900656c828f30a40252e47f/councilof_mcp-1.0.1.tar.gz
echo "2b29814eae1effc9af052bb644f78d8422f21ed21b54845462a9cf596550a8db  councilof_mcp-1.0.1.tar.gz" | sha256sum -c
tar -xzf councilof_mcp-1.0.1.tar.gz && cd councilof_mcp-1.0.1
rm -rf PKG-INFO setup.cfg councilof_mcp.egg-info      # build outputs, regenerated
patch -p1 < councilof-mcp-1.0.1-to-1.0.2.patch
python -m build                                        # needs hatchling>=1.27
```

Verified on oracle-micro-2, 2026-09-25 (hatchling 1.27+, `python -m build -n`): the patch applies
cleanly to the sdist tree; the built wheel's METADATA reads `Metadata-Version: 2.5`,
`Version: 1.0.2`, `License-Expression: Apache-2.0`, `License-File: LICENSE`, `License-File: NOTICE`,
and both files ship under `dist-info/licenses/`; the sdist carries LICENSE, NOTICE and CHANGELOG.md.
Nothing was uploaded to PyPI.

Publishing is an owner action (PyPI credentials). If the GitHub repository is restored, commit the
patched tree there first so the declared `Repository` URL resolves to the released bytes.

Not legal advice: relicensing is done by the copyright holder; if anyone other than the holder
contributed code under MIT, whether their consent is needed is a question for counsel.
