# DEFONEOS → TAK Server · signed CoT relay (architecture)

**Goal:** push DEFONEOS tracks into the tactical Common Operating Picture (ATAK/WinTAK) as native Cursor-on-Target — but *governed and signed*. CoT is the de-facto tactical standard; TAK Server routes CoT over **TLS with client-certificate auth**. That last fact is why this is a **node capability, not a browser feature**.

## Honest scope (read first)
- **Browsers cannot open a mutual-TLS (client-cert) socket to a TAK Server, and CORS blocks raw TCP.** So the dome does **export only** (`.cot` file / copy / the CoT tray). It never claims to talk to TAK directly.
- The **live push runs on the sovereign node** (SOV3 / a small relay service you control, inside your perimeter). The dome hands the relay *signed* CoT; the relay does the TLS+cert push. Nothing foreign in the path.
- This doc is the **design + a reference sketch**, not a shipped relay. Stand it up on the node when a design partner has a TAK Server to point at.

## The arrow
```
DEFONEOS dome (browser)                     Sovereign node (your perimeter)          TAK Server
  contacts → CoT XML  ──HTTPS (your API)──▶  defoneos-tak-relay                ──mTLS──▶  ATAK / WinTAK
  each track Ed25519-signed                   1. verify signature (offline)              (COP)
  (SIGIL receipt)                             2. CARE-FLOOR GATE  ◀── the point
                                              3. rate-govern + dedupe
                                              4. TLS + client-cert push
                                              5. SIGIL: "relayed N tracks → <server>"
```
The **care-floor gate** is the whole reason to be on the CoT bus: the relay **refuses** anything that would task a kinetic/surveillance action (a Layer-0 hard stop) *before* it reaches a shooter's screen — and signs both the relay and any refusal. Nobody else sells governance on the CoT bus.

## Minimal reference relay (node, sketch — do not ship as-is)
```js
// defoneos-tak-relay (node) — receives signed CoT from the dome, gates it, pushes to TAK Server over mTLS.
const tls = require('tls'), fs = require('fs'), http = require('http');
const { verifyReceipt } = require('../defoneos-sign-mcp/server.js');   // reuse the offline verifier

const TAK = { host: process.env.TAK_HOST, port: +process.env.TAK_PORT || 8089,
  cert: fs.readFileSync(process.env.TAK_CLIENT_CERT), key: fs.readFileSync(process.env.TAK_CLIENT_KEY),
  ca: fs.readFileSync(process.env.TAK_CA) };

// Layer-0 hard stops — refuse before relay, sign the refusal
const HARD_STOP = /a-h-.*task|fire|engage|strike|weapon|kinetic/i;

function pushCoT(xml) {                       // one mTLS socket per burst (pool in production)
  return new Promise((res, rej) => {
    const s = tls.connect({ host: TAK.host, port: TAK.port, cert: TAK.cert, key: TAK.key, ca: TAK.ca, rejectUnauthorized: true },
      () => { s.write(xml); s.end(); });
    s.on('close', res); s.on('error', rej);
  });
}

http.createServer((req, res) => {             // POST /relay  { receipt, cot }  (bind to localhost / your VPN only)
  if (req.method !== 'POST') { res.writeHead(405).end(); return; }
  let b = ''; req.on('data', d => b += d); req.on('end', async () => {
    try {
      const { receipt, cot } = JSON.parse(b);
      if (!verifyReceipt(receipt).valid) { res.writeHead(401).end('unsigned/invalid'); return; }   // only signed tracks
      if (HARD_STOP.test(cot)) { /* sign refusal to ledger */ res.writeHead(403).end('care-floor refused (kinetic/surveillance)'); return; }
      await pushCoT(cot);
      res.writeHead(200).end('relayed');       // then sign "relayed → TAK" to the SIGIL ledger
    } catch (e) { res.writeHead(400).end(String(e.message)); }
  });
}).listen(process.env.RELAY_PORT || 8790, '127.0.0.1');
```
Production hardening (not in the sketch): connection pooling / keep-alive to TAK Server, CoT `stale` handling, backpressure, an allow-list of affiliations, mutual auth on the *relay's own* HTTP endpoint (bind to VPN/localhost, never public), and full SIGIL logging of every relay + refusal.

## Config (env on the node)
`TAK_HOST` `TAK_PORT` (usually 8089 TLS) `TAK_CLIENT_CERT` `TAK_CLIENT_KEY` `TAK_CA` `RELAY_PORT`.
Client cert + CA come from the TAK Server admin (data-package enrollment). Keep keys 0600, on the node only.

## Why this wins (verified)
- CoT/TAK = the tactical standard (ATAK/WinTAK/iTAK, hundreds of apps). Interop is table-stakes; **signed + care-floored** interop is the moat.
- Competitors render or route CoT; none **sign** it or **refuse** on it. The relay is where DEFONEOS's "assurance layer on top" becomes a physical gate on the kill-chain's data bus — governance you can point at.

## Status
- ✅ Dome: signed CoT + `.cot` export (shipped).
- ✅ Offline verifier reused for relay-side signature checks (`defoneos-sign-mcp`).
- ⛔ Relay service: **design only** — stand up on the node against a real TAK Server with a design partner. Owner-gated (needs TAK certs + a perimeter to run in).
