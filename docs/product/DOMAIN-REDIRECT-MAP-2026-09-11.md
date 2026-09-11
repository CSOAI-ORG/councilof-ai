# Domain redirect map — TUI-6 (2026-09-11)

Measurement, not certification. No partnership claims.

| Host | DNS now | Decision | Action |
|---|---|---|---|
| councilof.ai | Cloudflare Pages `councilof-ai` | Canonical app | keep |
| csoai.org | alias of the app | Twin of councilof.ai | TUI-1 owns root.json parity |
| proofof.ai | Cloudflare NS (`elliot`/`val`); currently **301 → councilof.ai/** | Receipt-generator brand | serve `/receipt` (free `/api/proof?sha=`). Do not leave it as a silent homepage mirror. |
| bodies.ai | AWS `32.132.72.226`, Route53 NS; HTTPS 404 / expired cert | 301 → `https://councilof.ai/assess` (RAS door; `/ras` already 308s there) | **Nick DNS:** point bodies.ai at Cloudflare or set an origin 301. This token cannot rewrite Route53. |
| ceasai.org | Registrar NS `dns1/2.registrar-servers.com`; A 104.18.x; TLS handshake fail | 301 → `https://councilof.ai/` | **Nick DNS:** zone must be on the same Cloudflare account as Pages, then attach or bulk-redirect. |
| koikeeper.co.uk | Live WordPress store | Keep store. RAS hook is a spec only | see `docs/product/KOI-LINEAGE-CERT-SPEC-2026-09-11.md` |
| cobolbridge.ai | Cloudflare Pages `cobolbridge` | Separate product | do not alias onto councilof.ai |

## proofof.ai landing

- UI: `https://councilof.ai/receipt`
- API: `GET /api/proof?sha=<64-hex>` (free). `GET /proof` remains the JSON 302 alias of that API (do not steal it for HTML).
- Distinct brand: when `Host: proofof.ai`, `/` renders the receipt UI.

## bodies / ceasai until DNS moves

Until NS/A records are on this Cloudflare account, those hosts stay dead from here. This map is the executed *decision*; the DNS click is owner-gated.
