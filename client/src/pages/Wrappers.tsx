import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

const CANONICAL = "https://councilof.ai/wrappers/";
const LEDGER = "/interop/wrapped-asset-parity-latest.json";
const ROOT_KINDS = "/interop/root-kinds.json";
const HF_DATASET = "https://huggingface.co/datasets/csoai/wrapped-asset-parity";
const DOOR = "/api/wrapper?id=";
const KIND = "csoai.wrapper.parity/0.1";

const PAGE_DESCRIPTION =
  "Wrapped and bridged stablecoin pairs read from public RPC at pinned finalized blocks: wrapped supply against the origin-chain escrow where one exists. A read is not a measurement; native issuance and custodial wrappers are indexed, with no claim about backing either way.";

const PAGE_LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Wrapped-asset parity ledger",
  description: PAGE_DESCRIPTION,
  url: CANONICAL,
  mainEntity: {
    "@type": "Dataset",
    name: "Council of AI wrapped-asset parity ledger",
    description:
      "One row per bridged or custodial wrapper pair: wrapped totalSupply on its chain and, where an escrow exists, the canonical token's balance in the bridge escrow on the origin chain, both at pinned finalized blocks. States are never collapsed. Not a rate, not a grade, not a reserve attestation.",
    url: CANONICAL,
    isAccessibleForFree: true,
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai/" },
    distribution: [
      { "@type": "DataDownload", name: "Wrapped-asset parity ledger (JSON)", encodingFormat: "application/json", contentUrl: `https://councilof.ai${LEDGER}` },
      { "@type": "DataDownload", name: "Wrapped-asset parity ledger (Hugging Face dataset)", encodingFormat: "application/jsonl", contentUrl: HF_DATASET },
    ],
    variableMeasured: ["wrapped total supply", "escrow balance", "escrow over wrapped ratio", "parity state"],
  },
};

type Side = { chain: string; symbol: string; address: string; block?: { number?: number } | null };
type Read = { normalized?: string; atomic?: string };
type Rec = {
  id: string;
  wrapped: Side;
  canonical: Side;
  backing_model: string;
  escrow: string | null;
  escrow_name: string | null;
  state: string;
  escrow_over_wrapped: string | null;
  reads?: { wrapped_total_supply?: Read; escrow_balance?: Read };
  error?: string | null;
  note?: string | null;
  profile?: Profile | null;
};
type Source = { url: string; retrieved_at: string; kind: string; note?: string };
type Profile = { issuer: string; measurement_class: string; sources: Source[]; premise_flag?: string };
type DocRow = { id: string; name: string; operator: string; status_as_documented: string; on_chain_observable: string; attribution?: string | null; axes: Record<string, string>; sources: Source[] };
type Ledger = {
  as_of: string;
  counts: Record<string, number>;
  records: Rec[];
  attests?: string;
  documentary?: { class: string; definition: string; rows: DocRow[] };
};

const STATE_LABEL: Record<string, string> = {
  ESCROW_PARITY_READ: "Escrow parity read",
  UNCHECKABLE_NATIVE_ISSUANCE: "Native issuance — uncheckable",
  INDEXED_CUSTODIAL: "Custodial — indexed only",
  UNMEASURED: "Unmeasured",
};

async function readJson(url: string, signal: AbortSignal): Promise<unknown> {
  try {
    const r = await fetch(url, { signal, headers: { accept: "application/json" } });
    if (!r.ok) return null;
    const body = await r.text();
    if (!body.trim() || body.trimStart().startsWith("<")) return null;
    return JSON.parse(body);
  } catch {
    return null;
  }
}

const short = (a: string) => (a.startsWith("0x") && a.length === 42 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);
const fmt = (s?: string) => {
  if (!s) return "—";
  const [w, f] = s.split(".");
  return `${Number(w).toLocaleString()}${f ? "." + f.slice(0, 2) : ""}`;
};

export default function Wrappers() {
  const [ledger, setLedger] = useState<Ledger | null | undefined>(undefined);
  const [signed, setSigned] = useState<number | null>(null);

  useEffect(() => {
    const c = new AbortController();
    void (async () => {
      const l = (await readJson(LEDGER, c.signal)) as Ledger | null;
      setLedger(l && Array.isArray(l.records) ? l : null);
      const k = (await readJson(ROOT_KINDS, c.signal)) as { by_kind?: Record<string, number> } | null;
      setSigned(k && typeof k.by_kind?.[KIND] === "number" ? k.by_kind[KIND] : null);
    })();
    return () => c.abort();
  }, []);

  const counts = ledger?.counts ?? {};

  return (
    <section className="min-h-screen bg-slate-50 text-slate-950">
      <Helmet>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <meta name="robots" content="index,follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Wrapped-asset parity ledger | Council of AI" />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:url" content={CANONICAL} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Wrapped-asset parity ledger | Council of AI" />
        <meta name="twitter:description" content={PAGE_DESCRIPTION} />
        <script type="application/ld+json">{JSON.stringify(PAGE_LD)}</script>
      </Helmet>

      <header className="border-b border-emerald-950 bg-[#04120c] px-5 py-14 text-slate-100">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-400">
            <Link href="/" className="underline decoration-slate-600 underline-offset-4 hover:text-emerald-300">Council of AI</Link>
            <span aria-hidden="true" className="px-2">/</span>
            <Link href="/stablecoins" className="underline decoration-slate-600 underline-offset-4 hover:text-emerald-300">Stablecoins</Link>
            <span aria-hidden="true" className="px-2">/</span>
            <span>Wrappers</span>
          </nav>
          <p className="mt-8 font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Wrapper economy · read, not rated</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Wrapped supply against the escrow that backs it — at named blocks, from public RPC.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
            For each bridged stablecoin pair the ledger reads the wrapped token&apos;s total supply on its chain and, where a bridge escrow
            exists, the canonical token&apos;s balance in that escrow on the origin chain. Natively issued and custodial wrappers are
            read for supply and left indexed: nothing here asserts backing either way. A read is not a measurement.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
            Figures below are read from the published ledger when this page loads. Signed leaves for every pair sit under the one
            public root; the per-kind count comes from the root&apos;s own index. Not a rate, not a grade, not a reserve attestation, not investment advice.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
            <a className="rounded-lg bg-emerald-400 px-4 py-2.5 text-slate-950 hover:bg-emerald-300" href="#pairs">See the pairs</a>
            <a className="rounded-lg border border-slate-700 px-4 py-2.5 text-slate-200 hover:border-emerald-400 hover:text-emerald-300" href={LEDGER}>Ledger JSON</a>
            <a className="rounded-lg border border-slate-700 px-4 py-2.5 text-slate-200 hover:border-emerald-400 hover:text-emerald-300" href={HF_DATASET}>Hugging Face dataset</a>
          </div>
        </div>
      </header>

      <section aria-labelledby="states-heading" className="mx-auto max-w-7xl px-5 py-10">
        <h2 id="states-heading" className="text-2xl font-black">Four states, never collapsed</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {[
            ["ESCROW_PARITY_READ", "Both reads succeeded at the pinned heights; the ratio is what the two chains said."],
            ["UNCHECKABLE_NATIVE_ISSUANCE", "Minted natively on the destination chain (CCTP, Tether native). No escrow exists to read; supply read, no ratio claimed."],
            ["INDEXED_CUSTODIAL", "The reserve sits with a custodian off-chain or on another ledger (BTC, XRP, fund shares). Supply read; indexed until a reserve read exists."],
            ["UNMEASURED", "A read failed; the error is in the record; nothing is inferred."],
          ].map(([k, text]) => (
            <article key={k} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{STATE_LABEL[k]}</p>
              <p className="mt-1 font-mono text-3xl font-black tabular-nums">{ledger ? (counts[k] ?? 0) : "—"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Signed leaves of kind <code className="font-mono">{KIND}</code> under the current root:{" "}
          <strong className="tabular-nums">{signed === null ? "not published on this surface" : signed}</strong>
          {" "}· ledger as of <span className="font-mono">{ledger?.as_of ?? "—"}</span>
          {" "}· buy one signed card per pair at <code className="font-mono">GET {DOOR}&lt;pair&gt;</code> (free preview with <code className="font-mono">&amp;preview=1</code>; the amount is quoted only in the 402 challenge).
        </p>
      </section>

      <section id="pairs" aria-labelledby="pairs-heading" className="mx-auto max-w-7xl px-5 pb-16">
        <h2 id="pairs-heading" className="text-2xl font-black">Pairs</h2>
        {ledger === undefined && <p className="mt-4 text-sm text-slate-600">Reading the ledger…</p>}
        {ledger === null && (
          <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            The ledger could not be read from {LEDGER}. No totals are shown in its place.
          </p>
        )}
        {ledger && (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-3 py-2">Pair</th>
                  <th className="px-3 py-2">Wrapped supply</th>
                  <th className="px-3 py-2">Escrow balance</th>
                  <th className="px-3 py-2">Escrow ÷ wrapped</th>
                  <th className="px-3 py-2">State</th>
                  <th className="px-3 py-2">Blocks</th>
                  <th className="px-3 py-2">Card</th>
                </tr>
              </thead>
              <tbody>
                {ledger.records.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2">
                      <div className="font-semibold">{r.wrapped.symbol} <span className="text-slate-500">on {r.wrapped.chain}</span></div>
                      <div className="font-mono text-xs text-slate-500">{short(r.wrapped.address)}</div>
                      <div className="text-xs text-slate-600">{r.backing_model === "escrow" ? `vs ${r.escrow_name}` : r.backing_model === "native" ? "native issuance" : "custodial reserve"}</div>
                      {r.profile ? (
                        <details className="mt-1 max-w-xs text-xs text-slate-600">
                          <summary className="cursor-pointer text-emerald-700">Issuer-documented context ({r.profile.sources.length} sources)</summary>
                          <p className="mt-1">{r.profile.issuer}</p>
                          {r.profile.premise_flag ? <p className="mt-1 text-amber-800">{r.profile.premise_flag}</p> : null}
                          <ul className="mt-1 list-disc pl-4">
                            {r.profile.sources.map((s) => (
                              <li key={s.url}><a className="underline" href={s.url} rel="noopener noreferrer">{s.kind}</a> · retrieved {s.retrieved_at}{s.note ? ` · ${s.note}` : ""}</li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums">{fmt(r.reads?.wrapped_total_supply?.normalized)}</td>
                    <td className="px-3 py-2 font-mono tabular-nums">{fmt(r.reads?.escrow_balance?.normalized)}</td>
                    <td className="px-3 py-2 font-mono tabular-nums">{r.escrow_over_wrapped ?? "—"}</td>
                    <td className="px-3 py-2"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold">{STATE_LABEL[r.state] ?? r.state}</span>{r.note ? <div className="mt-1 max-w-xs text-xs text-slate-500">{r.note}</div> : null}{r.error ? <div className="mt-1 text-xs text-amber-800">{r.error}</div> : null}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-600">{r.wrapped.block?.number ?? "—"}{r.canonical?.block?.number ? ` / ${r.canonical.block.number}` : ""}</td>
                    <td className="px-3 py-2"><a className="text-emerald-700 underline underline-offset-4" href={`${DOOR}${encodeURIComponent(r.id)}&preview=1`}>preview</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {ledger?.documentary?.rows?.length ? (
          <div className="mt-10">
            <h2 id="documentary-heading" className="text-2xl font-black">Institutional token programmes — documentary</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{ledger.documentary.definition}</p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Programme</th>
                    <th className="px-3 py-2">Status as documented</th>
                    <th className="px-3 py-2">Readable from a public chain</th>
                    <th className="px-3 py-2">Axes</th>
                    <th className="px-3 py-2">Sources</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.documentary.rows.map((d) => (
                    <tr key={d.id} className="border-t border-slate-100 align-top">
                      <td className="px-3 py-2"><div className="font-semibold">{d.name}</div><div className="text-xs text-slate-500">{d.operator}</div></td>
                      <td className="max-w-md px-3 py-2 text-xs text-slate-700">{d.status_as_documented}{d.attribution ? <div className="mt-1 text-slate-500">Attribution: {d.attribution}</div> : null}</td>
                      <td className="max-w-xs px-3 py-2 text-xs text-slate-700">{d.on_chain_observable}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-600">{Object.values(d.axes).every((v) => v === "UNMEASURED") ? "all UNMEASURED" : Object.entries(d.axes).map(([k, v]) => `${k}: ${v}`).join(", ")}</td>
                      <td className="px-3 py-2 text-xs">
                        <ul className="list-disc pl-4">
                          {d.sources.map((s) => (
                            <li key={s.url}><a className="text-emerald-700 underline" href={s.url} rel="noopener noreferrer">{s.kind}</a> · {s.retrieved_at}{s.note ? ` · ${s.note}` : ""}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        <p className="mt-6 max-w-3xl text-sm leading-6 text-slate-600">
          A ratio above 1 means more sat in the escrow than the wrapped supply at those two heights; heights on two chains are never
          simultaneous, so every record names both blocks. The roster grows only with a wrapped contract, a canonical contract and a
          named, sourced escrow — or a native or custodial note. Corrections: <a className="underline" href="/api/corrections">/api/corrections</a>.
          Method: <a className="underline" href="https://huggingface.co/datasets/csoai/councilof-ai-source/blob/main/source/measurement/wrapped-asset-ledger-spec.md">wrapped-asset-ledger-spec.md</a>.
        </p>
      </section>
    </section>
  );
}
