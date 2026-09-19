import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { parseManifest, parseChallenge, readQuickstartJson, type Manifest, type Challenge } from "../lib/quickstartData";

/**
 * /quickstart — the public supply path: measurements, changes, verification and supported feeds.
 * Commissioning is an optional later step. The door and tool lists are read from the live manifest;
 * nothing here types an amount or a count.
 *
 * Section 5 walks ONE worked example door (request-attestation, which the manifest lists) through
 * discover → request → 402 → settle → receive → verify, so every command copy-pastes. Response
 * shapes were taken from live calls on 2026-09-14, except "receive", which is read from
 * functions/api/request-attestation.ts and labelled as such. Amounts and counts in those shapes are
 * placeholders; the page reads the live 402 in the browser and shows accepts[0] from it.
 * Companion: /quickstart.json. Offline checker: /verifier/card-v0-verify.mjs.
 */
const CANONICAL = "https://councilof.ai/quickstart/";
const MANIFEST = "/.well-known/x402.json";
const MCP_URL = "https://councilof.ai/mcp";
const EXAMPLE_DOOR = "/api/request-attestation?subject=qwen2.5:7b";

const PAGE_DESCRIPTION =
  "How an agent explores Council of AI measurements, follows the public change record, verifies signed evidence, and accesses supported feeds. Commissioned outputs are an optional later step.";

const PAGE_LD = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Agent quickstart — explore, follow changes, verify, connect",
  description: PAGE_DESCRIPTION,
  url: CANONICAL,
  step: [
    { "@type": "HowToStep", name: "Explore measurements", text: "GET /api/gspc — read the current public measurement board and its honest empty states." },
    { "@type": "HowToStep", name: "See what changed", text: "GET /api/feed.xml — follow published measurement, correction and regulation-change events." },
    { "@type": "HowToStep", name: "Verify evidence", text: "Verify the Ed25519 signature offline and the card's inclusion in the public Merkle root." },
    { "@type": "HowToStep", name: "Access supported feeds", text: "Read /.well-known/x402.json for supported doors and use the canonical MCP endpoint for tool discovery." },
    { "@type": "HowToStep", name: "Commission an output", text: "Optionally: discover → request → 402 → settle (non-self wallet) → receive → verify. Self-settlements and zero-value settlements are recorded but never counted as buyers (/api/revenue settled_usdc.excludes_self)." },
    { "@type": "HowToStep", name: "Correct", text: "If a read is wrong, the correction path is public and the correction is published beside the record." },
  ],
};

const Code = ({ children }: { children: string }) => (
  <pre className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
    <code>{children}</code>
  </pre>
);

function pathOf(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

export default function Quickstart() {
  const [manifest, setManifest] = useState<Manifest | null | undefined>(undefined);
  const [challenge, setChallenge] = useState<Challenge | null | undefined>(undefined);
  const [manifestAttempt, retryManifest] = useState(0);
  const [challengeAttempt, retryChallenge] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setManifest(undefined);
    void readQuickstartJson(MANIFEST, controller.signal, parseManifest).then(value => {
      if (active) setManifest(value);
    });
    return () => { active = false; controller.abort(); };
  }, [manifestAttempt]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setChallenge(undefined);
    void readQuickstartJson(EXAMPLE_DOOR, controller.signal, parseChallenge, 402).then(value => {
      if (active) setChallenge(value);
    });
    return () => { active = false; controller.abort(); };
  }, [challengeAttempt]);

  const resources = manifest?.resources ?? [];
  const liveAccept = challenge?.accepts?.[0];
  const freeTools = manifest?.mcp?.free_tools ?? [];
  const paidTools = manifest?.mcp?.paid_tools ?? [];
  const mcpUrl = manifest?.mcp?.url ?? MCP_URL;
  const verifyUrl = typeof manifest?.verify === "string" ? manifest.verify : "/gspc-verify";

  return (
    <section className="min-h-screen bg-slate-50 text-slate-950">
      <Helmet>
        <title>Agent quickstart — measurements, changes, verification and feeds | Council of AI</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <meta name="robots" content="index,follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Agent quickstart | Council of AI" />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:url" content={CANONICAL} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Agent quickstart | Council of AI" />
        <meta name="twitter:description" content={PAGE_DESCRIPTION} />
        <script type="application/ld+json">{JSON.stringify(PAGE_LD)}</script>
      </Helmet>

      <header className="border-b border-emerald-950 bg-slate-950 px-5 py-14 text-slate-100">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-400">
            <Link href="/" className="underline decoration-slate-600 underline-offset-4 hover:text-emerald-300">Council of AI</Link>
            <span aria-hidden="true" className="px-2">/</span>
            <Link href="/services" className="underline decoration-slate-600 underline-offset-4 hover:text-emerald-300">Services</Link>
            <span aria-hidden="true" className="px-2">/</span>
            <span>Quickstart</span>
          </nav>
          <p className="mt-8 font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">For agents and the people who run them</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Explore measurements, see what changed, verify evidence, then connect a supported feed.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
            Start with the public evidence. The board, change feed and verification path are open reads.
            The supported door and tool lists below come from the live manifest. Commissioning is optional
            and comes after those reads; any amount lives only in the door's 402 challenge.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
            <a className="rounded-lg bg-emerald-400 px-4 py-2.5 text-slate-950 hover:bg-emerald-300" href="/dashboard?tab=board">Explore measurements</a>
            <a className="rounded-lg border border-slate-700 px-4 py-2.5 text-slate-200 hover:border-emerald-400 hover:text-emerald-300" href="/press">See what changed</a>
            <a className="rounded-lg border border-slate-700 px-4 py-2.5 text-slate-200 hover:border-emerald-400 hover:text-emerald-300" href={verifyUrl}>Verify evidence</a>
            <a className="rounded-lg border border-slate-700 px-4 py-2.5 text-slate-200 hover:border-emerald-400 hover:text-emerald-300" href="#supported-feeds">Access supported feeds</a>
          </div>
        </div>
      </header>

      <section aria-labelledby="s1" className="mx-auto max-w-4xl px-5 py-10">
        <h2 id="s1" className="text-2xl font-bold">1 · Explore measurements</h2>
        <p className="mt-3 leading-7 text-slate-700">
          Read the current board before choosing an integration or commissioning an output. The response carries the public count line, each axis state and the evidence links the board can support.
        </p>
        <Code>{`curl -s https://councilof.ai/api/gspc | jq '{public_count: .totals.public_count, public_leader_count: .totals.public_leader_count, axes: [.axes[] | {axis, status, n, evidence_url}]}'`}</Code>
      </section>

      <section aria-labelledby="s2" className="mx-auto max-w-4xl px-5 py-10">
        <h2 id="s2" className="text-2xl font-bold">2 · See what changed</h2>
        <p className="mt-3 leading-7 text-slate-700">
          The state-change feed carries measurement, correction and regulation-change events. Historical items keep their dated wording; use the live board for current totals.
        </p>
        <Code>{`curl -s https://councilof.ai/api/feed.xml`}</Code>
      </section>

      <section aria-labelledby="s3" className="mx-auto max-w-4xl px-5 py-10">
        <h2 id="s3" className="text-2xl font-bold">3 · Verify evidence — signature, then inclusion</h2>
        <p className="mt-3 leading-7 text-slate-700">
          Every deliverable is a card: Ed25519-signed under the published DID key, and either already a leaf of the public Merkle
          root or staged for the next one. Verify the signature offline, then the leaf against the root the site publishes. A
          signature proves who signed the bytes; it does not make the read correct — that is what the correction path is for.
        </p>
        <Code>{`curl -s https://councilof.ai/root.json | jq '{card_count, merkle_root, as_of}'
curl -s https://councilof.ai/interop/root-witness-pointer.json | jq '.witnesses'   # OTS (Bitcoin) + Rekor`}</Code>
        <p className="mt-3 text-sm text-slate-600">
          In a browser: <Link href={verifyUrl} className="underline decoration-emerald-600 underline-offset-4">{verifyUrl}</Link> recomputes the signature
          client-side. In MCP: the verify tools the manifest names.
        </p>
      </section>

      <section id="supported-feeds" aria-labelledby="s4" className="mx-auto max-w-4xl scroll-mt-24 px-5 py-10">
        <h2 id="s4" className="text-2xl font-bold">4 · Access supported feeds</h2>
        <p className="mt-3 leading-7 text-slate-700">
          The manifest names the supported machine doors, their methods and their public indexes. The canonical MCP endpoint exposes the tool list. Read both at connection time; do not cache a typed catalogue.
        </p>
        <Code>{`curl -s https://councilof.ai${MANIFEST} | jq '.resources[] | {url, method, paid_for}'`}</Code>
        <Code>{`# MCP (Streamable HTTP) — tools/list needs no wallet
curl -s -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -X POST '${mcpUrl}' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`}</Code>
        <div role="status" aria-live="polite" aria-atomic="true">
          {manifest === undefined && <p className="mt-3 text-sm text-slate-500">Reading the manifest. This read stops after eight seconds.</p>}
          {manifest === null && <p className="mt-3 text-sm text-amber-700">The manifest could not be read or its display fields were unsupported. Resource availability is unknown; the commands above remain available.</p>}
          {manifest && resources.length === 0 && <p className="mt-3 text-sm text-slate-600">The retrieved manifest lists no resource entries.</p>}
        </div>
        {manifest === null && <button type="button" className="mt-3 min-h-11 rounded border border-slate-400 px-4 text-sm underline focus-visible:outline focus-visible:outline-2" onClick={() => retryManifest(n => n + 1)}>Retry manifest read</button>}
        {resources.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white text-sm">
            {resources.map((r) => (
              <li key={r.url} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
                <code className="shrink-0 font-mono text-xs text-emerald-800">{r.method ?? "GET"} {pathOf(r.url)}</code>
                <span className="text-slate-600">{r.description ?? r.paid_for ?? ""}</span>
              </li>
            ))}
          </ul>
        )}
        {freeTools.length > 0 && (
          <p className="mt-3 text-sm text-slate-600">
            Free tools named by the manifest: <code className="font-mono text-emerald-800">{freeTools.join(", ")}</code>
            {paidTools.length > 0 && <>{" "}· commissioned tools: <code className="font-mono text-emerald-800">{paidTools.join(", ")}</code></>}
          </p>
        )}
      </section>

      <section id="paid-path" aria-labelledby="s5" className="mx-auto max-w-4xl scroll-mt-24 px-5 py-10">
        <h2 id="s5" className="text-2xl font-bold">5 · Optional: commission an output</h2>
        <p className="mt-3 leading-7 text-slate-700">
          The whole paid path, in six steps: discover → request → 402 → settle → receive → verify. One worked door is used
          so every command copy-pastes; any other door in the manifest follows the same steps. Response shapes below come
          from live calls on 2026-09-14 and are truncated. Amounts and counts are shown as placeholders: the 402 you
          receive is the only authority on an amount. A settlement of zero is not a purchase.
        </p>
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
          Payments from the operator's own wallets are recorded as self-tests and never counted as revenue
          (<code className="font-mono">settled_usdc.excludes_self=true</code> on{" "}
          <a href="/api/revenue" className="underline decoration-emerald-600 underline-offset-4">/api/revenue</a>
          ). The count of outside payers, with self-settlements listed separately, is on that same contract.
          After settle, fulfillment state is also listed at{" "}
          <a href="/api/commissions" className="underline decoration-emerald-600 underline-offset-4">/api/commissions</a>
          {" "}(<code className="font-mono">RETRIEVABLE</code> + <code className="font-mono">CARDS_PUBLISHED</code>).
          Machine-readable version of these steps:{" "}
          <a href="/quickstart.json" className="underline decoration-emerald-600 underline-offset-4">/quickstart.json</a>.
        </p>

        <h3 id="step-discover" className="mt-8 text-lg font-bold">Step 1 · Discover</h3>
        <p className="mt-2 leading-7 text-slate-700">
          Read the payment manifest. <code className="font-mono">/.well-known/x402</code> redirects here, so use the
          <code className="font-mono">.json</code> path or <code className="font-mono">curl -L</code>. The MCP{" "}
          <code className="font-mono">tools/list</code> call in section 4, <code className="font-mono">/.well-known/agent-card.json</code>{" "}
          and <code className="font-mono">/llms.txt</code> describe the same doors.
        </p>
        <Code>{`curl -s https://councilof.ai/.well-known/x402.json | jq '{x402Version, scheme, network, asset, payTo, resources: [.resources[] | {method, url}]}'`}</Code>
        <Code>{`# observed 200 (truncated)
{
  "x402Version": 2,
  "scheme": "exact",
  "network": "eip155:8453",
  "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "payTo": "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
  "resources": [
    { "method": "GET", "url": "https://councilof.ai/api/free-door" },
    { "method": "GET", "url": "https://councilof.ai/api/request-attestation?subject=model-or-subject-id" },
    …
  ]
}`}</Code>

        <h3 id="step-request" className="mt-8 text-lg font-bold">Step 2 · Request</h3>
        <p className="mt-2 leading-7 text-slate-700">
          Call the door with no payment. The answer is a 402, and its body carries a free preview: the signed measurement
          cards already on file for that subject. You can stop here and verify those for free.
        </p>
        <Code>{`curl -s 'https://councilof.ai${EXAMPLE_DOOR}' | jq '.csoai.preview | {subject, signed_cards_on_file, first_card: .cards[0], read_from}'`}</Code>
        <Code>{`# observed (402 body, truncated)
{
  "subject": "qwen2.5:7b",
  "signed_cards_on_file": <integer>,
  "first_card": {
    "axis": "jail-escape-detection",
    "card": "3cc7a3caa1a9cb2f04efe93d8ab966ed8ab648309743d0466dbf60ceb709aa23",
    "card_url": "/signed/cards/3cc7a3caa1a9cb2f04efe93d8ab966ed8ab648309743d0466dbf60ceb709aa23.json"
  },
  "read_from": "https://councilof.ai/signed/card-matrix.json"
}`}</Code>

        <h3 id="step-402" className="mt-8 text-lg font-bold">Step 3 · Read the 402</h3>
        <p className="mt-2 leading-7 text-slate-700">
          The same response is HTTP 402 with a <code className="font-mono">PAYMENT-REQUIRED</code> header (base64 of the body)
          and an <code className="font-mono">accepts[]</code> entry naming scheme, network, asset, payee and amount. When the
          signing key is available, <code className="font-mono">extensions["offer-receipt"].info.offers[]</code> carries a signed
          offer for each entry, which you can check before paying.
        </p>
        <Code>{`curl -s -o 402.json -w '%{http_code}\\n' 'https://councilof.ai${EXAMPLE_DOOR}'
jq '{x402Version, accepts: [.accepts[] | {scheme, network, asset, payTo, amount, maxAmountRequired, maxTimeoutSeconds}]}' 402.json`}</Code>
        <Code>{`# observed
402
{
  "x402Version": 2,
  "accepts": [
    {
      "scheme": "exact",
      "network": "eip155:8453",
      "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "payTo": "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
      "amount": "<atomic units, read from your 402>",
      "maxAmountRequired": "<same as amount>",
      "maxTimeoutSeconds": 300
    }
  ]
}`}</Code>
        {liveAccept && (
          <p className="mt-3 text-sm text-slate-600">
            Reported by the most recent 402 read in this browser (not automatically refreshed):{" "}
            <code className="font-mono text-emerald-800">
              x402Version {challenge?.x402Version} · {liveAccept.scheme} · {liveAccept.network} · asset {liveAccept.asset} · payTo {liveAccept.payTo} · amount {liveAccept.amount ?? liveAccept.maxAmountRequired} (atomic)
            </code>
          </p>
        )}
        <div role="status" aria-live="polite" aria-atomic="true">
          {challenge === undefined && <p className="mt-3 text-sm text-slate-500">Reading the 402 preview. This read stops after eight seconds.</p>}
          {challenge === null && <p className="mt-3 text-sm text-amber-700">No supported 402 preview could be read. The amount is unknown; this is not a zero-price offer or a payment.</p>}
        </div>
        {challenge === null && <button type="button" className="mt-3 min-h-11 rounded border border-slate-400 px-4 text-sm underline focus-visible:outline focus-visible:outline-2" onClick={() => retryChallenge(n => n + 1)}>Retry 402 preview</button>}
        <Code>{`# check the signed offer offline (needs: pip install cryptography)
curl -sO https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/master/scripts/verify_receipt.py
python3 verify_receipt.py --url 'https://councilof.ai${EXAMPLE_DOOR}'
# observed: VALID    offer signed by did:web:csoai.org#board-attestation-1`}</Code>

        <h3 id="step-settle" className="mt-8 text-lg font-bold">Step 4 · Settle from your own wallet</h3>
        <p className="mt-2 leading-7 text-slate-700">
          You pay from your own wallet, with your own key, on your own machine. This site never holds a key for you and never
          settles on your behalf. The public x402 client below signs a USDC authorisation for the <code className="font-mono">accepts[]</code>{" "}
          entry and retries the same URL with the payment header. Check the amount in Step 3 before you run it. This page
          shows the code; it does not claim any settlement happened.
        </p>
        <Code>{`npm i @x402/fetch @x402/evm viem
cat > pay.mjs <<'EOF'
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";
import { writeFileSync } from "node:fs";

// YOUR wallet and YOUR key. Nothing here is sent anywhere except as a signed payment authorisation.
const account = privateKeyToAccount(process.env.WALLET_KEY);
const payFetch = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [{ network: "eip155:8453", client: new ExactEvmScheme(account) }],
});
const r = await payFetch("https://councilof.ai${EXAMPLE_DOOR}");
console.log(r.status, r.headers.get("x-payment-response"));
writeFileSync("receipt.json", await r.text());
EOF
WALLET_KEY=0x… node pay.mjs`}</Code>

        <h3 id="step-receive" className="mt-8 text-lg font-bold">Step 5 · Receive</h3>
        <p className="mt-2 leading-7 text-slate-700">
          A paid request can return HTTP 200 with a commission receipt, or HTTP 202 when queue acceptance or
          receipt assembly remains unresolved. The shape below illustrates the signed HTTP 200 branch{" "}
          <strong>from source</strong> (<code className="font-mono">functions/api/request-attestation.ts</code>), not an
          observed paid call or evidence that this source revision is deployed. The <code className="font-mono">x-payment-response</code> header carries the settlement response;
          it includes a signed receipt at <code className="font-mono">extensions["offer-receipt"].info.receipt</code> only when the
          facilitator names a payer and the signing key is present. A commission receipt is not a grade and never adds a
          measured cell. Published commission subjects and card URLs are also listed at{" "}
          <a href="/api/commissions" className="underline decoration-emerald-600 underline-offset-4">/api/commissions</a>
          {" "}(no wallet needed to read).
        </p>
        <aside data-testid="quickstart-commission-outcomes" aria-label="Commission response outcomes" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <h4 className="font-bold">Source-described outcomes — not a verified live transaction</h4>
          <p className="mt-2"><strong>HTTP 202:</strong>{" "}
            <code className="break-all">SETTLED_QUEUE_UNCONFIRMED</code> means payment was reported settled but queue acceptance is not confirmed;{" "}
            <code className="break-all">QUEUE_ACCEPTED_RECEIPT_UNAVAILABLE</code> means the queue accepted the request but receipt assembly failed.
            Preserve the response and any commission identifier for reconciliation.
          </p>
          <p className="mt-2"><strong>Do not automatically pay again</strong> when these states report{" "}
            <code>retry_payment: false</code>. A missing receipt is not proof that no payment occurred.
            A response without a card is not input for the card verifier.
          </p>
          <p className="mt-2"><strong>HTTP 200:</strong> inspect the returned card, its <code>signed</code> state and queue acknowledgement separately.
            Receiving a receipt does not establish execution or delivery, a fresh measurement or root inclusion.
          </p>
        </aside>

        <Code>{`# after settle: list retrievable subjects and card URLs (no wallet needed to read)
curl -s https://councilof.ai/api/commissions \
  | jq '{count, retrievable, queued, unfulfillable,
         subjects: [.commissions[] | {subject, fulfillment, delivery, card0: .cards[0].url}]}'`}</Code>
        <Code>{`# from source, not observed
HTTP 200
x-payment-response: <base64 settlement response>
{
  "card": {
    "schema": "https://councilof.ai/schema/card-v0.json",
    "surface": "ras.commission",
    "subject": "qwen2.5:7b",
    "as_of": "<ISO time>",
    "source_urls": ["<door url>", "https://basescan.org/tx/<transaction>", "…"],
    "payload": {
      "status": "COMMISSIONED",
      "subject": "qwen2.5:7b",
      "settle": { "network": "…", "transaction": "…", "payer": "…" },
      "reserve": [{ "axis": "…", "card": "<sha256>" }],
      "reserve_count": <integer>,
      "fresh_run": "UNMEASURED",
      "…": "…"
    },
    "sha256": "<sha256 of the canonical payload>",
    "sig_ed25519": "<hex, or null when unsigned>",
    "did": "did:web:csoai.org#board-attestation-1",
    "unmeasured": ["fresh_run_schedule", "root_inclusion"]
  },
  "verify": "https://councilof.ai/gspc-verify",
  "signed": true,
  "unsigned_reason": null,
  "bytes": <integer>,
  "note": "Commission receipt. …"
}`}</Code>

        <h3 id="step-verify" className="mt-8 text-lg font-bold">Step 6 · Verify offline</h3>
        <p className="mt-2 leading-7 text-slate-700">
          Fetch the key document once, then check with no network. <code className="font-mono">card-v0-verify.mjs</code> recomputes
          the payload hash and the Ed25519 signature under the key the card names. The signature covers the payload only;
          treat envelope fields outside it as unsigned context, and check <code className="font-mono">payload.settle.transaction</code>{" "}
          against Base yourself. You can run it today on any signed card-v0 leaf the site already publishes.
        </p>
        <Code>{`curl -sO https://councilof.ai/verifier/card-v0-verify.mjs
curl -s https://csoai.org/.well-known/did.json -o did.json
node card-v0-verify.mjs receipt.json did.json            # your paid receipt
# try it now on a published leaf:
curl -s https://councilof.ai/cards/090963760060e3ee.json -o leaf.json
node card-v0-verify.mjs leaf.json did.json
# observed: VALID  payload signed by did:web:csoai.org#board-attestation-1 · sha256 …   (exit 0; a changed byte gives INVALID, exit 1)`}</Code>
        <Code>{`# the measurement cards the receipt references (payload.reserve[].card) verify with the card verifier
curl -sO https://councilof.ai/verifier/gspc-verify.mjs
curl -s https://councilof.ai/signed/cards/3cc7a3caa1a9cb2f04efe93d8ab966ed8ab648309743d0466dbf60ceb709aa23.json -o m.json
node gspc-verify.mjs --did-document did.json m.json
# observed: VALID 1 · INVALID 0 · UNCHECKABLE 0   (exit 0)`}</Code>
      </section>

      <section aria-labelledby="s6" className="mx-auto max-w-4xl px-5 pb-16 pt-10">
        <h2 id="s6" className="text-2xl font-bold">6 · Correct — the path is public</h2>
        <p className="mt-3 leading-7 text-slate-700">
          A read can be wrong: a stale escrow address, a predicate that missed a case. Corrections are published beside the record,
          never by editing signed bytes. The register is at{" "}
          <Link href="/api/corrections" className="underline decoration-emerald-600 underline-offset-4">/api/corrections</Link>; the revenue
          contract and the count of distinct outside payers live at{" "}
          <a href="/api/revenue" className="underline decoration-emerald-600 underline-offset-4">/api/revenue</a>.
        </p>
        <p className="mt-6 text-sm text-slate-500">
          Measurement, never certification. A grade is never sold. Verify stays free.
        </p>
      </section>
    </section>
  );
}
