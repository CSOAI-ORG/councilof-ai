# Coliseum: a saved-result worker and a native pre-tool decision

**Qualification with real processes, not a production rollout.** See `results.json` for the original-run observations, including an unsuccessful first browser observer. No new provider, account, inference call or production service is required by the acceptance method. The code here is an opt-in test; it is not a customer-facing endpoint.

## What happened on 3 November 2026

- Claude Code 2.1.296 on an operator-owned Mac invoked the existing Council command guard. A local deterministic provider supplied only the two test tool proposals. The forbidden marker was absent; an otherwise benign marker was written with the exact expected bytes. Each file probe ran separately from the client. No GitHub merge or publish command was run.
- A keyboard action in an isolated copy of the H.I.M. workspace selected a named read-only role through the pinned OOWM classifier. A second Mac ran a fresh worker process over an already trusted SSH connection and checked its copy of the public record. The first Mac independently checked its own copy and showed the result with the same task ID.
- Reopen returned the retained result without rerunning the worker. With only the disposable worker withheld the UI reported unavailability and retained file access. A lookup after restoration did not execute the unanswered task. A new task then completed. The unavailable task ID was absent in a separate read-only worker database inspection.
- A separate Linux-host qualification used the same job contract, with an operator relaying the public job and response. A duplicate invocation returned the retained receipt; a rebound task was rejected. This was not native H.I.M.-to-Linux transport. The existing production studio remained paused, the normal external peer transport was not connected, and the temporary test listener was removed.

## Reproduce the local worker checks (Python 3.10+)

From a checkout of this revision, copy `harness/owem/tests/saved_result_round.py` to an empty owned test directory as `round.py`. Copy this directory's `test_saved_round.py` beside it. Obtain the specimen below as `governance-card.json`. Check the expected size and digest before running `python3 -B test_saved_round.py -v`. The 16 cases exercise matches, mismatches, schema and scope refusals, stale tasks, single-winner concurrency, ambiguous reservations, replay integrity and symlink rejection. They require no remote worker or language model.

Public specimen: `https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/dd12610905ffd14d7adf9c811c15ce7915de2966/interop/mill-cards-signed/signed-governan-e9bc92b7b39b.json` · 1,428 bytes · SHA-256 `41c2959f4b7d7149e348c48391721e4e3ea450fa59c620d56f74dd2685aea318`.

The router qualification additionally expects `gateway.py`: use `harness/owem/oowm_gateway.py` at `21019dd3cb1069bee7ae5dbb9e184babbbbcc323`, SHA-256 `7ae3e3618d74e7b95c8160905bfd443f16574bd71adeb2caeda5a6431c0a4eac`. It uses that file's existing `classify` function, not its HTTP server. `python3 -IB round.py route gateway.py` creates a new expiring task. Never reuse the published historical request for a new execution.

## Reproduce native Protect

Use an authorised macOS test host with Python, Node, and Claude Code installed. Inspect and run `python3 -B native_hook_round.py` from an owned scratch directory. The test fetches and hash-pins the existing public guard, uses a temporary home, and configures a synthetic loopback Messages endpoint. The inert denied command contains a restricted phrase as printable text. The report shows whether Claude Code issued a tool error and whether the marker existed on disk. Do not extrapolate to other clients, commands, permission modes or users. Do not remove any installed production policy.

## Reproduce the staged cross-host browser journey

Prerequisites: an authorised test operator on two machines connected by pre-existing strict SSH host-key trust; an existing H.I.M. page available on the front host at loopback port 8786; installed Chrome and Playwright Core. Use a private temporary test directory on the worker matching `/tmp/owned-hive-qual-<random>` (mode 0700), not an installation path. Stage **only** the pinned `round.py` and `governance-card.json` there. Place `qualification_front.py` and `browser_worker.cjs` beside the local copies of `round.py`, `gateway.py` and the specimen. Do not point at a live executor or reuse a production key directory.

Run `python3 -IBu qualification_front.py --peer <existing-trusted-user@host> --stage <owned-test-directory>`. It prints an ephemeral loopback port for a copy of the studio, not 8786. Then run `node browser_worker.cjs http://127.0.0.1:<temporary-port>/ <same-peer> <same-owned-test-directory>`. Set `QUAL_PLAYWRIGHT` to the installed Playwright Core module path when it is not on the normal module path. The negative case temporarily withholds ONLY the pinned exercise worker; it restores it before exit. Close the temporary listener after testing. No production daemon, altered SSH trust or enrolled human identity is part of this test.

## Trust and release boundaries

Treat the owner account, test host and local spool as trusted. Explicit worker labels and digests alone do not provide identity: the SSH host-key check, or in the separate Linux pass the operator-selected machine, is the transport boundary. A crash after reservation leaves an unknown outcome; do not create an automatic retry. Exact byte equality is not issuer authentication or a fresh model measurement. Do not enable the qualification API in production. Integrate through the existing private runtime owner, sign-off path and protected release. This work does not enable external repair or system-wide protection.
