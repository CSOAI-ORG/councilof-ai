# Open and protected

What CSOAI (Council of AI) publishes, and what it keeps private.

Status: policy, lane `rights-gate-20260925`, 25 Sep 2026. It carries out the owner ruling of the
same day: "open outside, protected inside". **This is not legal advice.** Whether any item below
is a trade secret in law depends on the confidentiality measures actually kept up, and on
jurisdiction. A formal trade-secret policy (agreements, retention, incident handling) needs
counsel. Nothing here is a legal conclusion.

## The rule

1. Anything **open** is published under the licence for its artefact type (table below), with
   provenance, so anyone can reproduce or check it.
2. Anything **protected** stays out of this repository, out of every public dataset, package,
   Space and mirror, and out of issues, PR bodies, public job logs and chat transcripts. It lives
   only in the private store.
3. A mechanical check enforces rule 2. `scripts/policy/check_no_protected.py` fails any public
   tree that holds a path or content pattern named in `docs/policy/protected-manifest.json`.
4. Once something is published, it cannot be protected again. Anything already public (see
   "Already public" below) is treated as open.

## Open

| artefact | licence | examples |
|---|---|---|
| New code and new package versions | **Apache-2.0** | `csoai-gspc` (PyPI), `csoai-gspc-mcp` (npm); `councilof-mcp` 1.0.2 and `@csoai/layer0` 0.2.0 are staged in this lane |
| Data | **CC-BY-4.0** | GSPC board data, census records (`csoai/mcp-remote-census`), measurement datasets |
| Specifications | **CC0-1.0** | `/spec/claim-maintenance/` v0.1 |
| Schemas, verifiers, test fixtures | licence of the artefact they ship in | card schemas, `HOW-TO-VERIFY`, the census and rights-gate tests |
| Public negative controls | licence of the artefact they ship in | published controls are part of the method, and anyone may re-run them |
| Method code | licence of the artefact it ships in | `scripts/census/reach.py` (the ranking rule), `frame.py`, `rights_gate.py` |
| The signed, OTS-anchored record | CC-BY-4.0 | signed roots and records, and their OpenTimestamps proofs |

The licence depends on the artefact. The councilof-ai
repository itself is **MIT** today (its `LICENSE` file). Moving the repository to Apache-2.0 is
an open owner decision. Until the owner decides, call the repository MIT, and do not describe
"the code" as having one licence.

The moat is not secrecy about method. It is a history no one can fork: a signed, anchored
longitudinal record that cannot be backdated. Protected calibration comes second.

## Protected

| class | what | why it is protected | where it lives |
|---|---|---|---|
| `reach_calibration` | reach tables joined into the probe plan, the ranked plan rows, and any tuned routing or reach weights | a copy of the full ordering lets someone predict and game what gets measured first | `csoai/private-calibration` (HF, private) |
| `private_negative_controls` | *generators* of private negative controls | a target that can generate our controls can train against them | private store |
| `priority_heuristics` | what we probe first and why, beyond the published plan rule | as above | private store |
| `customer_data` | customer data and configurations | confidentiality owed to the customer | private store under the customer's terms |
| `keys_and_secrets` | witness and signing private keys, API tokens | a leaked key forges the record | **secret stores only** (Pages secrets, pod secret files). Never a dataset, not even the private one |

The manifest names every class by path globs, and keys and tokens also by content patterns.
Adding a protected item means adding it to the manifest in the same change.

## Already public, so not protectable

Checked against the bytes on 25 Sep 2026:

- `plan-top20.json`, the plan **configuration** (fraction 0.2, candidate counts, signal mix and
  ranking rule text), was published that morning. It went out in the signed `mcp-remote-census`
  record and the public dataset `csoai/mcp-remote-census` (sha256 `493c81c1…`). It stays open. The
  private store keeps a copy only as join context, marked `ALREADY_PUBLIC`.
- The ranking **rule** is public code (`reach.py`). It has **no tuned weights today**:
  `reach_pct` is non-parametric, and its only parameters (the fraction and the tier order) are
  published. Once there are fitted weights, they go in the private store and nowhere else.
- The reach tables come from **keyless public APIs**: npm downloads, pepy.tech and Docker Hub. The
  same calls on the same day give the same numbers. What stays private is the assembled join and
  when it was taken. The underlying data is available to anyone.

Do not overstate what is protected. Today it is a convenience and a head start, not a
data advantage.

## The private store

- `https://huggingface.co/datasets/csoai/private-calibration` is `private: true`. Created
  25 Sep 2026. First commit `daadf2d7`: the census reach join (npm / PyPI / Docker Hub reach
  tables, the ranked plan rows, and the plan config marked `ALREADY_PUBLIC`). A `MANIFEST.json`
  holds the sha256 of every file and the producer commit.
- On 25 Sep 2026 every anonymous request was refused with **401**: the dataset API, the dataset
  page, and `resolve/main/…` for `MANIFEST.json` and `reach/npm-weekly-downloads.json`.
  Authenticated reads return `private: true`.
- Read access is limited to members of the `csoai` Hugging Face organisation. On 25 Sep 2026 it
  had **one** member. Adding a member grants read access to everything in the store. Add members
  only on need-to-know, and record each addition in the dataset README.
- Tokens stay in secret files (`~/.secrets/hf_token`). Never print a token or pass it to a public
  job log.

## Confidentiality measures

Trade-secret protection lasts only while the secret is actually kept. These measures are in place:

1. A private store with one-member access, marked CONFIDENTIAL in its README.
2. A leak check (`check_no_protected.py`) that runs over a directory or a git commit's full tree,
   including files a sparse checkout never materialises.
3. This written policy and the manifest.

Still needed, with owner or counsel:

- Wire `check_no_protected.py` into the `gates` workflow and into every dataset publisher (HF
  spray, Kaggle, Zenodo). Each publisher runs it over its staging directory before upload. In
  this lane it is a script and tests only.
- Put confidentiality terms in contractor and agent-operator agreements. That is counsel's job.
- Keep an access log review for the private store, and a leak-response step: rotate, re-baseline,
  and record what was exposed.

## The check

```bash
python3 scripts/policy/check_no_protected.py --git-ref HEAD --repo .   # a commit's whole tree
python3 scripts/policy/check_no_protected.py --tree dist/client        # a build or staging dir
```

- **Path hit**: a path that matches a class glob.
- **Content hit**: a text blob that matches a key or token pattern. Blobs larger than
  `content_scan_max_bytes`, and binary blobs, are checked by path only.
- Exit codes: `0` clean, `1` hit, `2` manifest error. A manifest with no path rules exits 2
  instead of passing vacuously.
- `allow` in the manifest exempts exact paths only, and each exemption needs a written reason.
  The list is empty today.
- The tests build their fixture keys at run time, so the test file never matches its own rules.

Result on this lane's tree: see the lane commit message and `council-os/LANES.md`.

## Inbound: the rights gate

`scripts/census/rights_gate.py` is the mirror image of this policy. It records what we may do
with **other people's** artefacts found by the census (MEASURE_PUBLIC / REUSE_CODE / VENDOR /
TRAIN). UNKNOWN never counts as ALLOWED, and non-commercial licences restrict reuse, vendoring
and training.
