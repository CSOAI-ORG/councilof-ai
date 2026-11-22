# SAFE-Starter-Kit

A self-hosted starter kit for organizations that take part in the Shared AI Findings Exchange (SAFE). It supports the SAFE workflow for AI incidents and near misses: intake, deadline tracking, evidence preservation, review, controlled disclosure, and corrective actions.

> **Status: development in progress.** We do not yet recommend production use. Try it with the synthetic demo data. [CHANGELOG.md](CHANGELOG.md) lists what is built and what is not, and [ROADMAP.md](ROADMAP.md) describes the phases.

Documentation: https://theseus-guard.github.io/osaa-safe-starter-kit/

## Independence and SAFE baseline

- SAFE-Starter-Kit is an independent open-source project. It is not an official Alliance product.
- Theseus Guard, Inc. is a member of the Linux Foundation and of the Open Secure AI Alliance (OSAA).
- It is developed to conform to **SAFE v1.0** (dated 2026-10-21), published by the SAFE Working Group in the [wg-safe repository](https://github.com/OpenSecureAIAlliance/wg-safe), at commit `08c0d6a11163d10ac878a15dc9f53b5b322fd7cb`.
- The SAFE specification is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Its text is attributed to the Open Secure AI Alliance SAFE Working Group and wg-safe contributors. Any reuse keeps that attribution.
- This project is not yet endorsed, certified, or approved by the Open Secure AI Alliance or its committees.

Links: [Open Secure AI Alliance](https://secureaialliance.org/) · [wg-safe (official SAFE repository)](https://github.com/OpenSecureAIAlliance/wg-safe)

## How requirements change

- **SAFE requirements.** Our requirements follow SAFE v1.0. Structural or substantive changes to SAFE itself, and anything that is not a technical question about this project, must be raised as an issue in the [wg-safe repository](https://github.com/OpenSecureAIAlliance/wg-safe/issues), not here.
- **Changes to this project's SAFE baseline** are made only when the Working Group publishes a new SAFE version (for example, v1.1). We then update this project to that version.
- **Feature requests** opened in this repository do not change the SAFE baseline. We do not add capabilities in response to requests here.

## Repository layout

| Path | Contents |
|---|---|
| `backend/` | FastAPI API, worker, migrations (PostgreSQL), container CLI |
| `frontend/` | React + TypeScript single-page app (Vite, shadcn/ui, Tailwind CSS) |
| `gateway/` | nginx gateway that serves the app and proxies `/api` |
| `db/init/` | Database role setup (least privilege) |
| `schemas/` | Project-defined JSON schemas and examples (not official SAFE schemas) |
| `scripts/` | Local secrets, the development certificate, the demo script `demo.sh` and its egress check |
| `compose.yaml` | Docker Compose stack |

## Screenshot

The administrator's Overview, with synthetic demo data. The [user guide](docs/user-guide/index.md) describes every screen.

![Administrator Overview with synthetic demo data](docs/user-guide/images/admin-overview.png)

## Run it locally

Requirements: Docker with Compose v2.

```sh
./scripts/init-secrets.sh
sh scripts/make-dev-cert.sh
docker compose up -d --build --wait
```

A normal install runs in production mode, the default in `compose.yaml`. The demo is not started this way; see [Demo](#demo).

The gateway serves HTTPS only, at `https://127.0.0.1:8443`, with a development certificate. Your browser will warn until you trust the local CA. See [gateway/README-TLS.md](gateway/README-TLS.md).

The first admin is created once from the command line. The password is read from stdin and must be at least 12 characters:

```sh
printf '%s' '<choose a password>' | docker compose run --rm -T --no-deps api \
  python -m safe_kit.admin create-user --username <name> --role admin --email <address>
```

Log in, change the password when asked, then choose the system timezone. All times in the installation are shown in that timezone; stored times are always UTC.

Container CLI:

```sh
docker compose --profile cli run --rm cli health
```

## Demo

The demo runs on this machine only, with synthetic data. It is started with `scripts/demo.sh`, which uses its own Compose project, `safe-demo`, and the overlay `compose.demo.yaml`. The overlay switches `api` and `worker` to demo mode with the synthetic dataset; the default stack never runs in demo mode.

```sh
export SAFE_DEMO_DIR="$HOME/safe-demo"   # required: an absolute path outside this repository
scripts/demo.sh start --timeout 300      # build, start, seed once, and wait for readiness
scripts/demo.sh status                   # service states, readiness, and which credential files exist
scripts/demo.sh cli-show <CASE_ID>       # read one case with the CLI, as a demo role
```

To run other Compose commands against the demo stack, pass both files: `docker compose -p safe-demo -f compose.yaml -f compose.demo.yaml <command>`.

- The script creates `SAFE_DEMO_DIR` and a `credentials` directory in it. The seed writes one credential file per demo role there, with mode 0600. No credential is printed, logged, or put in a command line.
- Each demo role has its own credential. The login screen lists the demo roles when the server runs in demo mode, and a banner shows the demo mode.
- The demo application and worker have no route out. `scripts/demo-egress-check.sh` checks this from inside the API container.
- Only one stack can use `127.0.0.1:8443` and the fixed Docker networks at a time. Stop any other stack first.
- The start and `cli-show` steps were run on the owner's live stack on 2026-11-03. The browser sign-in step has not been recorded yet.

## Tests

```sh
cd backend && uv run pytest
cd frontend && npm install && npm run build
```

## Test coverage

Measured on 2026-11-05 with the commands below. Figures are statement coverage of owned code; generated and third-party code is excluded.

| Part | Command | Tests | Coverage |
|---|---|---|---|
| Backend, without database | `scripts/test-backend.sh` | 2300 passed, 734 skipped | 75% |
| Backend, with database | `scripts/test-backend.sh --db` | 3034 passed | 96% |
| Frontend | `cd frontend && npm run test:coverage` | 609 passed | 78% statements |

The backend `--db` mode starts a throwaway PostgreSQL container and removes it afterwards. Database-backed tests are skipped unless `SAFE_TEST_DATABASE=1` is set, which the script does for you.

## Security notes

- The application never deletes rows; deletion is a soft delete. Physical removal is a manual database action.
- Every table has `created_at`, `updated_at`, `deleted_at`, and `is_deleted`.
- Passwords are stored as Argon2id hashes. Login is rate limited in the gateway and in PostgreSQL, and the gateway also limits API request rates.
- Passwords expire after 180 days. A new password may not match any of the account's last three passwords, nor any temporary password issued to the account.
- Browser sessions use HttpOnly cookies that page scripts cannot read. A state-changing browser request must also send the CSRF header. Access tokens last 60 minutes. Refresh tokens are rotated on every use and also last 60 minutes, so a session ends after 60 minutes without activity. Whatever the activity, a session ends 12 hours after login. The browser renews the token pair before the access token expires.
- The application roles cannot change the schema. The bootstrap superuser password is random and not stored.
- Not yet implemented: a production certificate, OIDC/SSO, encryption at rest for the database volume, sending a disclosure or a notice from the application (a notice records a send that a person made), a Vault Transit key provider, and backup/restore procedures.

## Export formats

Two export documents are versioned JSON. Both use project-defined schemas in `schemas/`. They are not official SAFE schemas, and this project makes no claim that a SAFE schema or SAFE API defines them.

- Public catalog export: `GET /api/v1/catalog/export` and `safe-kit catalog export`. Schema `schemas/catalog-export.v0.json`, `catalog_export_schema_version` 0.1.0. It needs `catalog:read`. It holds no restricted reference, no digest of one, and no internal identifier. Each export is written to the audit log.
- Approved disclosure package version: `GET /api/v1/cases/{case_id}/disclosures/{version_id}/export` and `safe-kit case disclosure export`. Schema `schemas/disclosure-export.v0.json`, `disclosure_export_schema_version` 0.1.0. Only an approved version can be exported, and each export is written to the audit log.

Reading policy for these documents:

- An unknown field is refused. A reader never drops a field silently.
- A document with a schema version the reader does not know is refused before any other field is read. A breaking change gets a new schema version.
- A document that repeats an ID (a catalog entry, or a visible disclosure item) is refused as a duplicate.

The service does not import these documents yet. The case import file (`import_format_version` 1, `safe-kit case import`) is a different format, and it refuses these documents as files.

`schemas/weekly-update.v0.json` describes the weekly update document of a case (`GET /api/v1/cases/{case_id}/weekly-updates`). It is a project-defined format too, not an export.

## API conventions

- **Errors.** Every error response has the `detail` field and an `error` object with a stable `code`, a safe `message`, the `request_id`, and `retryable`. A validation error also lists `fields`, with the path and the problem, never the rejected value. Every response carries `X-Request-ID`.
- **Paging.** The paged list endpoints (cases, catalog entries, recommendations, users, case history and evidence) page by cursor: `limit` (1 to 200, default 50), an opaque `cursor`, and `next_cursor`, which is null on the last page. An invalid cursor is refused with 400 and `detail.status` `invalid_cursor`.
- **Concurrency.** The case title change, the review layer changes, the deadline task changes, the legal duty changes and the user account changes need `If-Match` with the revision that was read (sent as the `ETag`). A missing value is refused with `428`, a malformed one with `400` (`invalid_if_match`), and a stale one with `412`, which also returns the current revision (`current_revision`). Each record has its own revision. The case ETag is the case revision, and changes to a deadline task, a legal duty or a user do not raise it. So a deadline task ETag and a case ETag are different numbers. The user list and the case's deadline and legal duty lists carry each item's revision in the body, because a list has one ETag. Some changes to a deadline task raise its revision without `If-Match`: the recalculation of SAFE due dates, the weekly update task, and the restore route, which does not check `If-Match`. Other changes do not check a revision yet.
- **Idempotency.** Case writes that change state take an `Idempotency-Key` header.

## Versioning and SAFE compatibility

- Releases follow semantic versioning from v0.1.
- Each release is listed in [CHANGELOG.md](CHANGELOG.md) with the SAFE version and commit it was checked against.
- A new SAFE version (for example v1.1 or v1.2) does not make an existing release compatible with it. We state compatibility only for the baseline written in the release notes, and only after checking the release against that version.
- Neither a release nor this project is certified or declared compliant with SAFE.

## License

Apache License 2.0. See [LICENSE](LICENSE).
