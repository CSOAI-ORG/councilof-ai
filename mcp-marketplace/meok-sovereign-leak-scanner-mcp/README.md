# 🔐 meok-sovereign-leak-scanner-mcp

**MEOK Sovereign Leak Scanner MCP** — Detects exposed secrets, `.env` files, API keys, and credential leaks in code repositories.

## Why This Exists

On **8 July 2026**, a confirmed 35GB breach at **Accenture** exposed source code, cloud secrets, `.env` files, database schemas, API gateway configs, encryption keys, and certificates. The leaked file tree showed exactly what a compromised enterprise microservices architecture looks like:

```
src/staging/api-gateway/
src/staging/order-service/
src/staging/identity-service/
src/staging/payment-service/
.env.staging
.env.prod
secrets.json
database/schema.sql
certs/gateway.key
```

**This MCP prevents that pattern.** It scans for the exact anti-patterns that caused the Accenture breach and enforces sovereign-secret hygiene.

## Tools (7)

| Tool | Purpose |
|---|---|
| `scan_repository` | Scan a local repo for exposed secrets |
| `scan_file` | Scan a single file for secrets |
| `check_env_files` | Check for `.env`, `.env.prod`, `.env.staging` patterns |
| `check_api_keys` | Detect AWS, GCP, Azure, OpenAI, Stripe, GitHub, GitLab keys |
| `check_private_keys` | Detect PEM, RSA, EC, OpenSSH private keys |
| `get_severity` | Classify finding severity (CRITICAL/HIGH/MEDIUM/LOW) |
| `leak_scanner_care_floor` | Get care-floor rules + enforcement status |

## Detection Patterns (50+)

### Environment Files
- `.env`, `.env.production`, `.env.staging`, `.env.development`, `.env.local`
- `env.local`, `env.production`, `env.staging`
- `docker.env`, `compose.env`, `kubernetes.env`

### Cloud Provider Keys
- AWS: `AKIA[0-9A-Z]{16}`, `aws_secret_access_key`
- GCP: `AIza[0-9A-Za-z-_]{35}`, `service_account.json`
- Azure: Client secrets, storage keys
- DigitalOcean, Linode, Heroku tokens

### API Tokens
- OpenAI: `sk-[A-Za-z0-9]{48}`
- Anthropic: `sk-ant-[A-Za-z0-9-]{32,}`
- Stripe: `sk_live_`, `pk_live_`, `rk_live_`
- GitHub: `ghp_`, `gho_`, `ghu_`, `ghs_`, `ghr_`
- GitLab: `glpat-`
- Slack: `xoxb-`, `xoxp-`
- HuggingFace: `hf_`

### Private Keys
- RSA: `-----BEGIN RSA PRIVATE KEY-----`
- EC: `-----BEGIN EC PRIVATE KEY-----`
- OpenSSH: `-----BEGIN OPENSSH PRIVATE KEY-----`
- PGP: `-----BEGIN PGP PRIVATE KEY BLOCK-----`
- Generic PEM: `-----BEGIN PRIVATE KEY-----`

### Database & Schema
- `database/schema.sql`, `schema.prisma`, `migrations/`
- `dump.sql`, `backup.sql`, `db_backup.tar.gz`

### Certificates
- `*.key` files outside certs/ or trusted/
- `*.pem`, `*.p12`, `*.pfx` in code paths

## Severity Classification

| Severity | Pattern | Action |
|---|---|---|
| **CRITICAL** | Active API keys (OpenAI, Stripe, GitHub) | Rotate IMMEDIATELY |
| **CRITICAL** | Private keys (RSA, EC, SSH) | Revoke + regenerate |
| **HIGH** | `.env.prod`, `.env.production` in repo | Move to secret manager |
| **HIGH** | Cloud keys (AWS, GCP, Azure) | Rotate + audit IAM |
| **MEDIUM** | `.env.staging`, `.env.development` | Restrict access |
| **MEDIUM** | Database dumps in repo | Encrypt + offsite |
| **LOW** | Certificate files | Audit cert lifecycle |

## Care Floor

- ❌ NO active exploitation of found secrets
- ❌ NO automated reporting to external parties without consent
- ❌ NO credential exfiltration from scanned repos
- ✅ Detection only
- ✅ Report findings to repo owner
- ✅ Suggest remediation steps
- ✅ SIGIL-signed scan receipts

## Installation

```bash
pip install meok-sovereign-leak-scanner-mcp
```

## License

MIT — MEOK AI Labs / CSOAI Ltd (UK 16939677)
