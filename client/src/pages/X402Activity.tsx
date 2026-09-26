/**
 * /measurements/x402-activity — wash-adjusted x402 activity: who actually paid the doors the public x402 Bazaars list.
 *
 * Every figure on this page is read from client/src/data/measurements/x402-activity/record.json, which is byte-identical
 * to the published public/measurements/x402-activity/<day>/x402-activity-<day>.json (held equal by
 * scripts/measurements/measurement-pages.node-test.mjs). That record is board-signed (.signed.json beside it) and
 * OpenTimestamps-stamped. Producer: flywheel_x402_activity.py on the measuring host (daily, after the x402-daily
 * conformance job). Other parties' figures come from context.json (their words, with the bytes we read, also signed).
 * To change a number, re-run the producer and re-sign; never type a figure into this file.
 */
import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import PlainEmail from "@/components/PlainEmail";
import REC from "@/data/measurements/x402-activity/record.json";
import CTX from "@/data/measurements/x402-activity/context.json";

type Agg = { settlements: number; usdc_atomic: number; distinct_payers: number; distinct_payees: number };
type CtxItem = {
  id: string; who: string; title: string; url: string; published_as_printed: string; accessed_utc: string;
  response_sha256: string; quotes: string[]; derived: { what: string; formula?: string; value?: number; by: string; first?: string; last?: string } | null;
  note: string | null; observed_unchanged_in?: { wayback_captures: { capture: string; response_sha256: string }[] };
};

const H = REC.headline;
const BY = REC.by_class as unknown as Record<string, Agg>;
const DEFS = REC.method.classes_first_match as Record<string, string>;
const FLAGS = REC.flags;
const DAY = REC.day;
const BASE = `/measurements/x402-activity/${DAY}/x402-activity-${DAY}`;
const ITEMS = CTX.items as unknown as CtxItem[];
const NOT_MEASURED_ACCEPTS = REC.population.accepts_entries_not_measured as Record<string, number>;

const TITLE = "Wash-adjusted x402 activity | Council of AI";
const DESCRIPTION =
  "Of the USDC payments that reached x402 Bazaar-listed payees on Base in one UTC day, how many came from distinct outside wallets. Signed daily record.";

const n = (x: number) => x.toLocaleString("en-GB");
const usdc = (atomic: number) => `${(atomic / 1e6).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`;
const pct = (x: number | null) => (x === null ? "not defined (no settlements)" : `${(100 * x).toFixed(1)}%`);
const share = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(1)}%` : "not defined");

const H2 = ({ id, children }: { id: string; children: ReactNode }) => (
  <h2 id={id} className="mt-12 scroll-mt-20 text-2xl font-bold tracking-tight text-slate-900">
    {children}
  </h2>
);
const H3 = ({ children }: { children: ReactNode }) => <h3 className="mt-6 text-lg font-semibold text-slate-900">{children}</h3>;
const P = ({ children }: { children: ReactNode }) => <p className="mt-3 leading-relaxed text-slate-700">{children}</p>;
const UL = ({ children }: { children: ReactNode }) => <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-slate-700">{children}</ul>;
const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a className="underline underline-offset-4" href={href} rel="noopener noreferrer">
    {children}
  </a>
);
const Code = ({ children }: { children: ReactNode }) => <code className="break-all rounded bg-slate-100 px-1 text-[0.9em]">{children}</code>;
const Table = ({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) => (
  <div role="region" aria-label={caption} tabIndex={0} className="mt-4 overflow-x-auto rounded-lg border border-slate-200 focus:outline focus:outline-2 focus:outline-slate-500">
    <table className="w-full min-w-[520px] text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="bg-slate-50 text-slate-700">
        <tr>
          {head.map((h) => (
            <th key={h} scope="col" className="px-3 py-2 font-semibold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-slate-200 align-top">
            {r.map((c, j) => (
              <td key={j} className="px-3 py-2 text-slate-700">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TOC: [string, string][] = [
  ["summary", "Summary"],
  ["classes", "Every settlement, by class"],
  ["patterns", "Repeat payers and concentration"],
  ["cannot-see", "What we cannot see"],
  ["method", "Method"],
  ["context", "What others have measured"],
  ["ourselves", "Our own doors"],
  ["verify", "How to verify"],
  ["object", "Object, or ask for a re-check"],
];

export default function X402Activity() {
  useEffect(() => {
    document.title = TITLE;
    setMetaDescription(DESCRIPTION);
  }, []);
  const total = H.settlements;
  const totalUsdc = H.usdc_atomic;

  return (
    <article data-testid="x402-activity" className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <Link href="/">Home</Link> › <span>Measurements</span> › <span>x402 activity</span>
      </nav>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Who paid the x402 doors?</h1>
      <p className="mt-2 text-lg text-slate-700">Wash-adjusted x402 activity on Base, {DAY} (UTC).</p>
      <p className="mt-4 text-slate-700">
        Published by Council of AI (CSOAI Ltd, registered in England and Wales, no. 16939677). Record as of{" "}
        {REC.as_of.replace("T", " ").replace("Z", " UTC")}; signed with the board key and timestamped.
      </p>
      <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-800">
        <strong>Measurement, not endorsement or accusation.</strong> This page names no seller, payer or index, and scores
        none. Every class below is a structural fact about addresses and amounts, such as “the payer is the payee”. None says
        why anyone paid. Where public chain data cannot answer a question, we say UNCHECKABLE and give no number.
      </p>

      <nav aria-label="Contents" className="mt-8 rounded-lg border border-slate-200 p-4">
        <p className="font-semibold text-slate-900">Contents</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-700">
          {TOC.map(([id, label]) => (
            <li key={id}>
              <a className="underline underline-offset-4" href={`#${id}`}>
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <H2 id="summary">Summary</H2>
      <P>
        We asked one question. Of the USDC payments on Base that reached a payee listed in the two public x402 Bazaars on{" "}
        {DAY}, how many came from distinct outside wallets? The rest came from the payee itself, a sibling payee of the same
        seller, another listed payee, or an amount below any price the payee lists.
      </P>
      <div data-testid="x402-headline" className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          ["Settlements to listed payees", n(total)],
          ["Distinct payers", n(H.distinct_payers)],
          ["Settlements from outside wallets (EXTERNAL)", `${n(H.external_settlements)} (${pct(H.external_share_of_settlements)})`],
          ["Distinct outside payers", n(H.distinct_external_payers)],
          ["USDC settled, all classes", usdc(totalUsdc)],
          ["USDC from outside wallets", `${usdc(H.external_usdc_atomic)} (${pct(H.external_share_of_usdc)})`],
        ].map(([k, val]) => (
          <div key={k} className="rounded-lg border border-slate-200 p-3">
            <p className="text-sm text-slate-600">{k}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{val}</p>
          </div>
        ))}
      </div>
      <P>
        The payees come from {n(REC.population.listed_base_usdc_payees)} addresses that {n(REC.population.listed_hosts_with_base_usdc_payee)}{" "}
        listed hosts name for USDC on Base. {n(H.distinct_payees_paid)} of them received at least one settlement that day, and{" "}
        {n(H.distinct_payees_with_external_payment)} received one from an outside wallet.
      </P>
      <P>
        <strong>Read this with the next section.</strong> “Outside wallet” means only that the address is not linked to the payee
        in any way public data shows. Someone who pays themselves from a fresh address looks exactly like a customer. So the
        external share above is an upper bound on real outside demand. It is not an estimate of it.
      </P>

      <H2 id="classes">Every settlement, by class</H2>
      <P>Each settlement gets the first class that fits, in this order.</P>
      <Table
        caption="Settlements by class"
        head={["Class", "What it means", "Settlements", "Share", "USDC", "Distinct payers"]}
        rows={Object.keys(DEFS).map((c) => [
          <code className="whitespace-nowrap rounded bg-slate-100 px-1 text-xs">{c}</code>,
          DEFS[c],
          n(BY[c].settlements),
          share(BY[c].settlements, total),
          usdc(BY[c].usdc_atomic),
          n(BY[c].distinct_payers),
        ])}
      />
      <P>
        Also excluded before classing: {n(REC.inbound_not_eip3009.transfers)} inbound USDC transfers ({usdc(REC.inbound_not_eip3009.usdc_atomic)})
        to listed payees that did not come through EIP-3009 <Code>transferWithAuthorization</Code>. That is the path the x402
        “exact” scheme uses for USDC, so these transfers are not counted as x402 settlements.
      </P>

      <H2 id="patterns">Repeat payers and concentration</H2>
      <P>
        Paying the same seller again is normal. A buyer who comes back is the best sign a service is useful. So repeat payers are
        flagged, not excluded. What the flags show is how much of the activity comes from a few wallet-and-payee pairs.
      </P>
      <Table
        caption="Repeat and high-frequency payer-payee pairs"
        head={["Flag", "All classes: settlements", "Share of all", "EXTERNAL: settlements", "Share of EXTERNAL"]}
        rows={[
          [
            "Payer paid this payee 2 or more times that day",
            n(FLAGS.repeat_pair.all.settlements),
            share(FLAGS.repeat_pair.all.settlements, total),
            n(FLAGS.repeat_pair.external.settlements),
            share(FLAGS.repeat_pair.external.settlements, H.external_settlements),
          ],
          [
            `Payer paid this payee ${n(FLAGS.high_frequency_pair.threshold)} or more times that day`,
            n(FLAGS.high_frequency_pair.all.settlements),
            share(FLAGS.high_frequency_pair.all.settlements, total),
            n(FLAGS.high_frequency_pair.external.settlements),
            share(FLAGS.high_frequency_pair.external.settlements, H.external_settlements),
          ],
        ]}
      />
      <UL>
        <li>
          Outside payers who paid exactly once that day: {n(FLAGS.external_one_settlement_payers)} of {n(H.distinct_external_payers)}.
        </li>
        <li>
          The single largest outside payer sent {pct(REC.concentration.top1_share_of_external_usdc)} of the outside USDC. The ten
          largest sent {pct(REC.concentration.top10_share_of_external_usdc)}.
        </li>
        <li>
          Outside payers above a size floor. Our class rule has no fixed “test amount” cut-off. It compares each payment with the
          payee’s own smallest listed price. For readers who want a fixed floor, here are the counts:{" "}
          {Object.entries(REC.sensitivity)
            .map(([k, v]) => `${n(v as number)} paid at least ${k.replace("external_payers_paying_at_least_", "").replace("_usdc", "")} USDC in one settlement`)
            .join("; ")}
          .
        </li>
      </UL>

      <H2 id="cannot-see">What we cannot see</H2>
      <P>Public chain data cannot answer these questions. Each one is UNCHECKABLE, and none is estimated:</P>
      <UL>
        {REC.uncheckable.map((u) => (
          <li key={u}>{u}.</li>
        ))}
      </UL>
      <P>Not measured in this record:</P>
      <UL>
        {REC.not_measured.map((u) => (
          <li key={u}>{u}.</li>
        ))}
      </UL>
      <Table
        caption="Bazaar payment options outside this record's scope"
        head={["Network | asset | scheme", "Listings"]}
        rows={Object.entries(NOT_MEASURED_ACCEPTS)
          .slice(0, 8)
          .map(([k, v]) => [<Code>{k}</Code>, n(v)])}
      />

      <H2 id="method">Method</H2>
      <UL>
        <li>
          <strong>Payees.</strong> We walked both public x402 Bazaar discovery indexes (Coinbase CDP and PayAI) to their stated
          totals: {n(REC.population.bazaar_read.resources_read)} listings read, CDP complete:{" "}
          {String(REC.population.bazaar_read.cdp.complete)}, PayAI complete: {String(REC.population.bazaar_read.payai.complete)}.
          We kept every payment option with scheme “exact”, network Base mainnet and asset native USDC. Its payTo address is a
          listed payee, and the smallest amount any listing asks of that address is its smallest listed price.
        </li>
        <li>
          <strong>Window.</strong> Blocks {n(REC.window.first_block)} to {n(REC.window.last_block)} ({n(REC.window.blocks)}{" "}
          blocks). These are the first and last Base blocks of {DAY} UTC, checked at both boundaries.
        </li>
        <li>
          <strong>Unit.</strong> {REC.method.unit}.
        </li>
        <li>
          <strong>Classes.</strong> First match wins, in the order of the table above. CSOAI’s own wallets are listed in the
          record and classed ESTATE_SELF, so our own test payments never count as outside demand.
        </li>
        <li>
          <strong>Headline rule.</strong> {REC.method.headline_rule}.
        </li>
        <li>
          <strong>Reads.</strong> Public RPC (<Code>{REC.method.rpc.endpoints.join(", ")}</Code>), {n(REC.method.rpc.calls)} calls, in
          chunks of {n(REC.method.rpc.chunk_blocks)} blocks. A chunk that errors is split, never skipped. The run fails closed if
          either Bazaar read is short.
        </li>
        <li>
          <strong>Schedule.</strong> The record is produced every day after the x402 conformance read, for the previous full UTC
          day. This page shows the signed record for {DAY}.
        </li>
      </UL>

      <H2 id="context">What others have measured</H2>
      <P>
        Their findings, not ours. The methods, networks and windows differ, so these figures cannot be combined with each other
        or with ours. We quote each source word for word, from the bytes we read (sha256 given).
      </P>
      {ITEMS.map((it) => (
        <div key={it.id} className="mt-4 rounded-lg border border-slate-200 p-3">
          <p className="font-semibold text-slate-900">
            <A href={it.url}>{it.who}: {it.title}</A>
          </p>
          <p className="text-sm text-slate-600">
            {it.published_as_printed}. Read {it.accessed_utc.replace("T", " ").replace("Z", " UTC")}; sha256 <Code>{it.response_sha256.slice(0, 16)}…</Code>
          </p>
          <UL>
            {it.id === "x402-org-counter" ? (
              <li>Shown on the page: “{it.quotes.join(" · ")}”</li>
            ) : (
              it.quotes.map((q) => <li key={q}>“{q}”</li>)
            )}
          </UL>
          {it.derived ? (
            <p className="mt-2 text-sm text-slate-700">
              {it.derived.formula ? (
                <>
                  Derived by us: {it.derived.what} = <Code>{it.derived.formula}</Code> ={" "}
                  {typeof it.derived.value === "number" ? `${(100 * it.derived.value).toFixed(1)}%` : ""}. {it.derived.by}.
                </>
              ) : (
                <>
                  The same two figures appear in every capture we read, from {it.derived.first} to {it.derived.last}:{" "}
                  {(it.observed_unchanged_in?.wayback_captures ?? []).map((c, i) => (
                    <span key={c.capture}>
                      {i ? ", " : ""}
                      <A href={c.capture}>{c.capture.split("/web/")[1].slice(0, 8)}</A>
                    </span>
                  ))}
                  . {it.note}
                </>
              )}
            </p>
          ) : null}
        </div>
      ))}

      <H2 id="ourselves">Our own doors</H2>
      <P>
        CSOAI runs x402 doors too. Our own count of distinct outside payers, which excludes our own wallets and any settlement of
        zero, is served live at <A href="https://councilof.ai/api/revenue">/api/revenue</A> as <Code>one_number</Code>. It comes
        from our facilitator-confirmed settlement records, not from this chain read. We give the link rather than a copy, so the
        figure is never stale.
      </P>

      <H2 id="verify">How to verify</H2>
      <UL>
        <li>
          Record: <A href={`${BASE}.json`}>{`x402-activity-${DAY}.json`}</A>. Signature: <A href={`${BASE}.signed.json`}>.signed.json</A>.
          Timestamp: <A href={`${BASE}.json.ots`}>.json.ots</A> (an OpenTimestamps calendar commitment until Bitcoin confirms it).
        </li>
        <li>
          Every settlement is one line in <A href={`/measurements/x402-activity/${DAY}/${REC.rows_file.path}`}>{REC.rows_file.path}</A> (sha256{" "}
          <Code>{REC.rows_file.sha256}</Code>). Every payee is one line in{" "}
          <A href={`/measurements/x402-activity/${DAY}/${REC.population.payees_file.path}`}>{REC.population.payees_file.path}</A> (sha256{" "}
          <Code>{REC.population.payees_file.sha256}</Code>). Both hashes are in the record, so the signature covers them.
        </li>
        <li>
          Check the signature. Canonicalise the <Code>payload</Code> in the .signed.json: JSON, keys sorted, no whitespace,
          UTF-8. Its sha256 must equal <Code>signature.payload_sha256</Code>, and <Code>payload.artifact.sha256</Code> must equal
          the sha256 of the record file. Then verify <Code>sig_ed25519</Code> with the Ed25519 key{" "}
          <Code>#board-attestation-1</Code> in <A href="https://csoai.org/.well-known/did.json">csoai.org/.well-known/did.json</A>.
        </li>
        <li>
          Re-run it: the verify note in the record lists the steps. The code is the file named in <Code>method.code</Code>, with its
          sha256.
        </li>
        <li>
          Context sources: <A href="/measurements/x402-activity/context.json">context.json</A> (signed:{" "}
          <A href="/measurements/x402-activity/context.signed.json">context.signed.json</A>).
        </li>
      </UL>

      <H2 id="object">Object, or ask for a re-check</H2>
      <P>
        If a class is wrong for a payment you made or received, or a figure here is wrong, email{" "}
        <PlainEmail className="underline underline-offset-4" subject="x402 activity: re-check" />. You can also use the crawler
        page at <Link href="/census/" className="underline underline-offset-4">/census</Link>, which explains what we read and how
        to object or opt out, or <Link href="/dispute/" className="underline underline-offset-4">/dispute</Link>. Corrections are
        dated in our <Link href="/corrections/" className="underline underline-offset-4">corrections ledger</Link>.
      </P>
    </article>
  );
}
