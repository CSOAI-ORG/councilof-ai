# CSOAI estate — fleet connection + working agreement

**Paste block for agents (DSH, Cursor, Grok, Claude).**  
Endpoints verified at time of writing. RunPod SSH ports **move** when a pod restarts — re-resolve via API; never assume the pod is dead.

Full ops crosswalk: `docs/ESTATE_CROSSWALK.md` · ownership register: `docs/NEXT_300_MOVES.md` · Council OS harmony: `docs/COUNCIL_OS_HARMONY.md`

---

## HF Hub

- `HF_TOKEN` in `~/.env` is **DEAD** — use `hf auth login` (org `csoai`)
- Pre-upload verify (no token): `npm run verify:staged-hf`
- Local dev smoke: `npm run smoke:dev-honesty` (indices / RWA / MCP registry + JSON-RPC)
- Upload when auth works: `npm run hf:upload-staged` — see `docs/HF_UPLOAD_RUNBOOK.md`
