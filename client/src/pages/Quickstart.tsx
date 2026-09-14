import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

/**
 * /quickstart — the one page that walks an agent (or its operator) from discovery to a paid,
 * verifiable response and back to the correction path. Every list on this page is read from the
 * live manifest when it loads; nothing here types a door, an amount, or a count. The amount lives
 * only in the 402 challenge the door itself returns.
 */
const CANONICAL = "https://councilof.ai/quickstart";
const MANIFEST = "/.well-known/x402.json";
const MCP_URL = "https://councilof.ai/mcp";

const PAGE_DESCRIPTION =
  "How an agent finds Council of AI doors, reads what is free, pays a door through x402, verifies the signed response against the public root, and files a correction. Read from the live manifest; nothing typed.";

const PAGE_LD = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Agent quickstart — discover, read, pay, verify",
  description: PAGE_DESCRIPTION,
  url: CANONICAL,
  step: [
    { "@type": "HowToStep", name: "Discover", text: "GET /.well-known/x402.json — the manifest lists every door with its method, what it is paid for, and where it is indexed." },
    { "@type": "HowToStep", name: "Read what is free", text: "Preview parameters and the free MCP tools return live data with no payment." },
    { "@type": "HowToStep", name: "Pay a door", text: "Call a door without payment to receive its 402 challenge; the accepts[] entry names network, asset, payee and amount. Settle through an x402 client; the response carries the deliverable." },
    { "@type": "HowToStep", name: "Verify", text: "Verify the Ed25519 signature offline and the card's inclusion in the public Merkle root." },
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
        <title>Agent quickstart — discover, read, pay, verify | Council of AI</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={CANONICAL} />
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
            Discover a door, read what is free, pay through x402, verify against the public root.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
            Five steps, each one a request you can make right now. The door list, the free and paid tool names and the verify
            route below are read from the live manifest when this page loads. The amount for any paid door lives only in the
            402 challenge that door returns — nothing on this page types a price.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
            <a className="rounded-lg bg-emerald-400 px-4 py-2.5 text-slate-950 hover:bg-emerald-300" href={MANIFEST}>The manifest</a>
            <a className="rounded-lg border border-slate-700 px-4 py-2.5 text-slate-200 hover:border-emerald-400 hover:text-emerald-300" href="/services">Every door</a>
            <a className="rounded-lg border border-slate-700 px-4 py-2.5 text-slate-200 hover:border-emerald-400 hover:text-emerald-300" href="/tools">Add the MCP</a>
          </div>
        </div>
      </header>

      <section aria-labelledby="s1" className="mx-auto max-w-4xl px-5 py-10">
        <h2 id="s1" className="text-2xl font-bold">1 · Discover — one GET, every door</h2>
        <p className="mt-3 leading-7 text-slate-700">
          The manifest is the source of truth for what exists. Each entry names the method, what the payment is for, and which
          public indexes carry it. Read it every time; do not cache door lists.
        </p>
        <Code>{`curl -s https://councilof.ai${MANIFEST} | jq '.resources[] | {url, method, paid_for}'`}</Code>
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
      </section>

      <section aria-labelledby="s2" className="mx-auto max-w-4xl px-5 py-10">
        <h2 id="s2" className="text-2xl font-bold">2 · Read what is free</h2>
        <p className="mt-3 leading-7 text-slate-700">
          Most doors have a free preview that returns the live read without the signed, deliverable form. The MCP server exposes
          the free tools the manifest names; a client needs no wallet for them.
        </p>
        <Code>{`curl -s 'https://councilof.ai${doorPath}${doorPath.includes("?") ? "&" : "?"}preview=1' | jq '.card.payload'`}</Code>
        <Code>{`# MCP (Streamable HTTP) — no wallet needed for the free tools
curl -s -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \\
  -X POST ${mcpUrl} -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`}</Code>
        {freeTools.length > 0 && (
          <p className="mt-3 text-sm text-slate-600">
            Free tools named by the manifest: <code className="font-mono text-emerald-800">{freeTools.join(", ")}</code>
            {paidTools.length > 0 && (
              <>
                {" "}· paid tools: <code className="font-mono text-emerald-800">{paidTools.join(", ")}</code>
              </>
            )}
          </p>
        )}
      </section>

      <section aria-labelledby="s3" className="mx-auto max-w-4xl px-5 py-10">
        <h2 id="s3" className="text-2xl font-bold">3 · Pay a door — the 402 is the contract</h2>
        <p className="mt-3 leading-7 text-slate-700">
          Call the door with no payment. It answers 402 with a <code className="font-mono">PAYMENT-REQUIRED</code> body: an
          <code className="font-mono"> accepts[]</code> entry naming scheme, network, asset, payee and the amount in atomic units, plus the
          bazaar extension an index reads. Settle that entry with any x402 client; retry with the payment header and the door returns
          the deliverable. A settlement of zero is not a purchase, and our own wallets are never counted as buyers.
        </p>
        <Code>{`curl -si 'https://councilof.ai${doorPath}' | sed -n '1p;/^{/,$p' | jq '.accepts[0] | {scheme, network, asset, payTo, maxAmountRequired}'`}</Code>
        <Code>{`# with an x402 client (any implementation that speaks x402 v2), e.g.
npx -y x402-fetch 'https://councilof.ai${doorPath}'   # pays the challenge from the caller's wallet, prints the response`}</Code>
        <p className="mt-3 text-sm text-slate-600">
          The same paid tools are reachable through MCP: call a paid tool without <code className="font-mono">x_payment</code> to get its
          challenge, then pass the payment as the <code className="font-mono">x_payment</code> argument.
        </p>
      </section>

      <section aria-labelledby="s4" className="mx-auto max-w-4xl px-5 py-10">
        <h2 id="s4" className="text-2xl font-bold">4 · Verify — signature, then inclusion</h2>
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

      <section aria-labelledby="s5" className="mx-auto max-w-4xl px-5 pb-16 pt-10">
        <h2 id="s5" className="text-2xl font-bold">5 · Correct — the path is public</h2>
        <p className="mt-3 leading-7 text-slate-700">
          A read can be wrong: a stale escrow address, a predicate that missed a case. Corrections are published beside the record,
          never by editing signed bytes. The register is at{" "}
          <Link href="/corrections" className="underline decoration-emerald-600 underline-offset-4">/corrections</Link>; the revenue
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
