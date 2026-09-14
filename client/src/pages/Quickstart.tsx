import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

/**
 * /quickstart — the public supply path: measurements, changes, verification and supported feeds.
 * Commissioning is an optional later step. Every door and tool list is read from the live manifest;
 * nothing here types a door, an amount, or a count.
 */
const CANONICAL = "https://councilof.ai/quickstart/";
const MANIFEST = "/.well-known/x402.json";
const MCP_URL = "https://councilof.ai/mcp";

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
    { "@type": "HowToStep", name: "Commission an output", text: "Optional path: discover a door → request without payment → read the 402 → settle with a non-self wallet → receive the deliverable → verify signature/inclusion. Self-settlements and zero-value settlements are recorded but never counted as buyers (/api/revenue excludes_self)." },
    { "@type": "HowToStep", name: "Correct", text: "If a read is wrong, the correction path is public and the correction is published beside the record." },
  ],
};

type Resource = { url: string; method?: string; description?: string; paid_for?: string; indexed_in?: string[] | string; note?: string };
type Manifest = {
  resources?: Resource[];
  mcp?: { url?: string; transport?: string; free_tools?: string[]; paid_tools?: string[] };
  verify?: string | Record<string, unknown>;
  explainer?: string;
  one_line?: string;
  network?: string;
  asset?: string;
  scheme?: string;
  x402Version?: number;
};

async function readJson(url: string, signal: AbortSignal): Promise<unknown | null> {
  try {
    const r = await fetch(url, { signal, headers: { accept: "application/json" } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

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

  useEffect(() => {
    const c = new AbortController();
    void (async () => {
      const m = (await readJson(MANIFEST, c.signal)) as Manifest | null;
      setManifest(m && Array.isArray(m.resources) ? m : null);
    })();
    return () => c.abort();
  }, []);

  const resources = manifest?.resources ?? [];
  const firstDoor = resources.find((r) => /\/api\/wrapper\?/.test(r.url)) ?? resources[0];
  const doorPath = firstDoor ? pathOf(firstDoor.url) : "/api/<door>";
  const freeTools = manifest?.mcp?.free_tools ?? [];
  const paidTools = manifest?.mcp?.paid_tools ?? [];
  const mcpUrl = manifest?.mcp?.url ?? MCP_URL;
  const verifyUrl = typeof manifest?.verify === "string" ? manifest.verify : "/gspc-verify";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
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
  -X POST ${mcpUrl} -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`}</Code>
        {manifest === undefined && <p className="mt-3 text-sm text-slate-500">Reading the live manifest…</p>}
        {manifest === null && <p className="mt-3 text-sm text-amber-700">The manifest did not load in this browser. The command above reads it directly.</p>}
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

      <section aria-labelledby="s5" className="mx-auto max-w-4xl px-5 py-10">
        <h2 id="s5" className="text-2xl font-bold">5 · Optional: commission an output</h2>
        <p className="mt-3 leading-7 text-slate-700">
          After reading and verifying the public evidence, the paid path is copy-pasteable end-to-end:
          <strong> discover → request → 402 → settle → receive → verify</strong>. Amounts live only in the door&apos;s
          <code className="font-mono"> accepts[]</code> challenge — never typed here. A settlement of zero is not a purchase.
          Estate/self wallets paying the estate are recorded as self-settlements and are never counted as buyers
          (<code className="font-mono">excludes_self=true</code> on{" "}
          <a href="/api/revenue" className="underline decoration-emerald-600 underline-offset-4">/api/revenue</a>.
        </p>
        <p className="mt-3 text-sm font-semibold text-slate-800">Discover (manifest already loaded above) → request without payment → read the 402</p>
        <Code>{`# concrete door example — substitute any resource.url from the manifest
curl -si 'https://councilof.ai/api/request-attestation?subject=llama3.2:3b' \
  | sed -n '1p;/^{/,$p' \
  | jq '{http_hint: "expect 402", accepts0: .accepts[0] | {scheme, network, asset, payTo, maxAmountRequired}}'`}</Code>
        <Code>{`# same shape for whichever door the manifest named first
curl -si 'https://councilof.ai${doorPath}' | sed -n '1p;/^{/,$p' | jq '.accepts[0] | {scheme, network, asset, payTo, maxAmountRequired}'`}</Code>
        <p className="mt-3 text-sm font-semibold text-slate-800">Settle → receive → verify</p>
        <p className="mt-2 leading-7 text-slate-700">
          Settle the challenge with any x402 client from a <em>non-self</em> wallet, retry with the payment header, then
          read what was published. For commission subjects, fulfillment and card URLs are listed at{" "}
          <a href="/api/commissions" className="underline decoration-emerald-600 underline-offset-4">/api/commissions</a>
          {" "}(<code className="font-mono">RETRIEVABLE</code> + <code className="font-mono">CARDS_PUBLISHED</code>).
          Verify each <code className="font-mono">cards[].url</code> offline (signature + optional root inclusion) — publication is not a certificate.
        </p>
        <Code>{`# after settle: list retrievable subjects and card URLs (no wallet needed to read)
curl -s https://councilof.ai/api/commissions \
  | jq '{count, retrievable, queued, unfulfillable,
         subjects: [.commissions[] | {subject, fulfillment, delivery, card0: .cards[0].url}]}'`}</Code>
        <Code>{`curl -s 'https://councilof.ai${doorPath}${doorPath.includes("?") ? "&" : "?"}preview=1' | jq '.card.payload'`}</Code>
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
    </main>
  );
}
