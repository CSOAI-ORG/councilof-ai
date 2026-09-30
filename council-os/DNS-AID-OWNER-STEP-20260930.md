# DNS-AID for councilof.ai: owner step (DNS changes are owner-only)

Status 2026-09-30: FAIL on Cloudflare's Agent Readiness scan (`checks.discoverability.dnsAid`: no records under
`_agents.councilof.ai`). Agents cannot write DNS here; these records are for the owner to add in the Cloudflare
dashboard for the `councilof.ai` zone (nameservers elliot/val.ns.cloudflare.com, read 2026-09-30).

Source of the record shape: the scanner's own instructions
(https://isitagentready.com/.well-known/agent-skills/dns-aid/SKILL.md): ServiceMode SVCB (or HTTPS) records under the
`_agents` namespace, with `alpn` and connection parameters, numeric `keyNNNNN` for any experimental parameter, and
DNSSEC on the zone. The scanner queries SVCB/HTTPS at `_index._agents`, `_a2a._agents`, `_mcp._agents` and TXT at
`_index._agents`. DNS-AID is an Internet-Draft, not a standard; the records claim nothing beyond where the doors are.

## Records (Cloudflare dashboard -> DNS -> Add record, type SVCB)

| Name | Type | Priority | Target | Value |
|---|---|---|---|---|
| `_a2a._agents` | SVCB | 1 | `councilof.ai.` | `alpn="a2a" port=443 mandatory=alpn,port` |
| `_mcp._agents` | SVCB | 1 | `councilof.ai.` | `alpn="mcp" port=443 mandatory=alpn,port` |
| `_index._agents` | TXT | - | - | `"a2a=https://councilof.ai/.well-known/agent-card.json" "mcp=https://councilof.ai/.well-known/mcp/server-card.json" "skills=https://councilof.ai/.well-known/agent-skills/index.json"` |

Zone-file form (TTL 3600):

```dns
_a2a._agents.councilof.ai.   3600 IN SVCB 1 councilof.ai. alpn="a2a" port=443 mandatory=alpn,port
_mcp._agents.councilof.ai.   3600 IN SVCB 1 councilof.ai. alpn="mcp" port=443 mandatory=alpn,port
_index._agents.councilof.ai. 3600 IN TXT "a2a=https://councilof.ai/.well-known/agent-card.json" "mcp=https://councilof.ai/.well-known/mcp/server-card.json" "skills=https://councilof.ai/.well-known/agent-skills/index.json"
```

## DNSSEC (also owner-only)

`councilof.ai` has no DS record at the parent (DoH read 2026-09-30: DS empty, AD false), so validating resolvers
cannot authenticate any of it. Enable DNSSEC in Cloudflare (DNS -> Settings -> DNSSEC), then add the DS record it
shows at the registrar (Namecheap). Without that step the records above resolve but are not authenticated; the
scanner reports `dnssecValidated: false`.

## Check after adding

```
curl -s 'https://cloudflare-dns.com/dns-query?name=_a2a._agents.councilof.ai&type=SVCB&do=1' -H 'accept: application/dns-json'
curl -s -X POST https://isitagentready.com/api/scan -H 'content-type: application/json' -d '{"url":"https://councilof.ai"}'
```

`checks.discoverability.dnsAid.status` should read `pass`.
