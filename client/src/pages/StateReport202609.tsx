/**
 * /state/2026-09 — "State of the Agent Internet: September 2026".
 *
 * Every figure on this page is read from client/src/data/state/2026-09-numbers.json, which is
 * byte-identical to the published public/state/2026-09/numbers.json (held equal by
 * scripts/state-report/state-report.node-test.mjs). That file is board-signed
 * (numbers.signed.json) and names, for each number, the record it was recomputed from and that
 * record's sha256. Producer: scripts/state-report/derive.py (read-only, on the measuring host)
 * then scripts/state-report/build_numbers.py. To change a number, re-run the producer and
 * re-sign; never edit a figure in this file.
 *
 * Owner rulings for this edition (26 Sep 2026): the "library default" reading of the 1.27.0
 * pattern is a hypothesis only; asset and ledger names may appear in the evidence-ladder table,
 * negative issuer findings stay as classes; our own self-parity inconsistencies are reported.
 */
import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import PlainEmail from "@/components/PlainEmail";
import DOC from "@/data/state/2026-09-numbers.json";
import { stateReportDatasetLd } from "@/lib/stateDatasetLd";

type Num = { value: number | string; what: string; source: string; recompute: string };
type Src = { what: string; path: string; sha256: string; public_copy: string | null; board_signature?: string; signed_at?: string };
const NUMS = DOC.numbers as unknown as Record<string, Num>;
const SRCS = DOC.sources as unknown as Record<string, Src>;
const LEDGERS = DOC.ledgers_by_evidence_level as Record<string, string[]>;
const IDX = DOC.measurement_index;

const TITLE = "State of the Agent Internet: September 2026 | Council of AI";
const DESCRIPTION =
  "What public agent catalogues, cards, payment doors and ledgers let a third party check, measured by CSOAI on 26 Sep 2026. Aggregate figures, each one signed.";

function v(id: string): number | string {
  const n = NUMS[id];
  if (!n) throw new Error(`state report: no number ${id}`);
  return n.value;
}
/** A number as prose: thousands separators, no rounding. */
function N({ id }: { id: string }) {
  const x = v(id);
  return <>{typeof x === "number" ? x.toLocaleString("en-GB") : x}</>;
}
function pct(a: string, b: string): string {
  return ((100 * Number(v(a))) / Number(v(b))).toFixed(1);
}

const H2 = ({ id, children }: { id: string; children: ReactNode }) => (
  <h2 id={id} className="mt-12 scroll-mt-20 text-2xl font-bold tracking-tight text-slate-900">
    {children}
  </h2>
);
const H3 = ({ children }: { children: ReactNode }) => <h3 className="mt-6 text-lg font-semibold text-slate-900">{children}</h3>;
const P = ({ children }: { children: ReactNode }) => <p className="mt-3 leading-relaxed text-slate-700">{children}</p>;
const UL = ({ children }: { children: ReactNode }) => <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-slate-700">{children}</ul>;
const Table = ({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) => (
  // A scrollable region must be reachable by keyboard (axe scrollable-region-focusable).
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
const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a className="underline underline-offset-4" href={href} rel="noopener noreferrer">
    {children}
  </a>
);
const Code = ({ children }: { children: ReactNode }) => <code className="break-all rounded bg-slate-100 px-1 text-[0.9em]">{children}</code>;

const LADDER: { level: string; meaning: string }[] = [
  { level: "STATE_PROOF_VERIFIED", meaning: "Supply read with a Merkle state proof, checked against a block header whose hash we recomputed. The header is not checked against validator signatures." },
  { level: "STATE_PROOF_RECORDED", meaning: "A proof was returned and kept, but the block header could not be recomputed, so it is not bound to the block." },
  { level: "OPERATOR_API", meaning: "The number comes from a node or API operator. No proof." },
  { level: "UNCHECKABLE", meaning: "The read failed, or the list could not be compared." },
];

const TOC: [string, string][] = [
  ["summary", "Summary"],
  ["discovery", "Discovery: what the catalogues contain"],
  ["parity", "Does the listing match the server?"],
  ["cards", "Signed agent cards"],
  ["onchain", "On-chain agent registrations"],
  ["payments", "Payment doors (x402)"],
  ["ledgers", "Tokenised assets across ledgers"],
  ["reproducibility", "The same model on two runtimes"],
  ["ourselves", "Ourselves first"],
  ["not-measured", "What we did not measure"],
  ["corrections", "Corrections"],
  ["verify", "How to verify"],
  ["appendix", "Appendix: every number and its source"],
];

export default function StateReport202609() {
  useEffect(() => {
    document.title = TITLE;
    setMetaDescription(DESCRIPTION);
  }, []);

  return (
    <article data-testid="state-report-2026-09" className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      {/* schema.org Dataset for Google Dataset Search; every field from numbers.json (lib/stateDatasetLd.ts). */}
      <script type="application/ld+json">{JSON.stringify(stateReportDatasetLd(DOC))}</script>
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <Link href="/">Home</Link> › <Link href="/state/">State of the Agent Internet</Link> › <span>September 2026</span>
      </nav>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">State of the Agent Internet: September 2026</h1>
      <p className="mt-4 text-slate-700">
        Published 26 September 2026 by Council of AI (CSOAI Ltd, registered in England and Wales, no. 16939677). Figures as of{" "}
        {DOC.as_of.replace("T", " ").replace("Z", " UTC")}.
      </p>
      <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-800">
        <strong>Measurement, not endorsement.</strong> This report gives aggregates only. It names no service, operator or
        issuer in a negative finding, and it scores, ranks or approves no company. An INCONSISTENT or FAILED result says that
        two public statements disagree, or that a check did not pass. It is not evidence of bad intent.
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
        An agent that finds a service through a public catalogue can trust very little about it without checking. Discovery is
        abundant. Verification is the exception.
      </P>
      <UL>
        <li>
          The official MCP registry held <N id="registry.entries" /> entries listing <N id="registry.endpoints" /> distinct remote
          endpoints. Of the <N id="census.population" /> endpoints in the two MCP catalogues we read in full, we observed{" "}
          <N id="census.observed" />, and <N id="census.RESPONDED" /> answered as MCP servers.
        </li>
        <li>
          <N id="cp.any" /> of <N id="cp.rows" /> responding MCP endpoints contradict themselves across their own public documents
          on at least one point. Most of these are version strings. <N id="cp.non_version" /> disagree on something with more
          substance: tools, authentication, protocol or payment.
        </li>
        <li>
          Of <N id="a2a.served" /> A2A agent cards served, <N id="a2a.signed" /> carry a signature and <N id="a2a.VERIFIED" />{" "}
          verify under the rules of the spec version the card declares.
        </li>
        <li>
          Of <N id="x402.hosts" /> x402 payment hosts, <N id="x402.answered_402" /> answered with HTTP 402 and{" "}
          <N id="x402.conformant" /> ({String(v("x402.conformant_pct"))}%) returned a fully conformant challenge.
        </li>
        <li>
          For tokenised assets, a third-party state proof of supply was possible on <N id="xl.STATE_PROOF_VERIFIED" /> of{" "}
          <N id="xl.deployments" /> issuer-listed deployments we read. The others rely on an operator's API, or could not be checked.
        </li>
        <li>
          Re-running signed model measurements on a second runtime, <N id="m2.rule_met" /> of <N id="m2.cards" /> cards reproduced
          item by item with the same counts, although <N id="m2.grade_equal_pct" />% of individual item grades matched.
        </li>
        <li>
          We measured ourselves first and found <N id="sp.INCONSISTENT" /> places where external indexes list us differently
          from what we publish. We published three corrections to our own figures on the day of this report.
        </li>
      </UL>

      <H2 id="discovery">Discovery: what the catalogues contain</H2>
      <P>On 26 September a census frame read five public catalogues, each paginated to its signalled end where it had one.</P>
      <Table
        caption="Catalogues read on 26 September 2026"
        head={["Catalogue", "Read state", "Entries", "Distinct endpoints"]}
        rows={[
          ["Official MCP registry (latest versions)", "EXHAUSTED", <N id="registry.entries" />, <N id="registry.endpoints" />],
          ["Hugging Face Spaces tagged mcp-server", "EXHAUSTED", <N id="hf.spaces_listed" />, <N id="hf.spaces_listed" />],
          ["A2A registry", "EXHAUSTED", <N id="a2a.listed" />, "(cards, below)"],
          ["Docker MCP catalogue", "EXHAUSTED", <N id="docker.entries" />, <N id="docker.endpoints" />],
          [
            "Smithery",
            "PARTIAL",
            <>
              <N id="smithery.distinct" /> of a declared <N id="smithery.declared" />
            </>,
            "none listed",
          ],
        ]}
      />
      <P>
        Smithery's anonymous interface stops after five pages and lists no endpoint URLs, so the read is PARTIAL and{" "}
        <strong>we give no combined population total</strong>. The registry grew from <N id="registry.entries_prev" /> entries
        in our read of the previous day.
      </P>
      <H3>Which MCP endpoints answer</H3>
      <P>
        The population is every remote endpoint listed by the MCP registry or the Docker catalogue: <N id="census.population" />.
        We sent only discovery requests, never a tool call, never a credential and never a payment, at most one request per
        second per host, and honoured robots.txt. <N id="census.rows_new" /> endpoints were contacted on 26 September; for{" "}
        <N id="census.rows_reused" /> the state observed on 25 September (under 48 hours old) is carried. <N id="census.not_attempted" />{" "}
        were not contacted, each with a recorded reason (<N id="census.na_robots" /> because of robots.txt,{" "}
        <N id="census.na_templated" /> because the listed URL was a template). The read state is therefore PARTIAL.
      </P>
      <Table
        caption="State of each remote MCP endpoint"
        head={["State", "Endpoints"]}
        rows={[
          ["Answered as an MCP server", <N id="census.RESPONDED" />],
          ["Asked for authentication", <N id="census.AUTH_REQUIRED" />],
          ["Answered, but not as MCP", <N id="census.NOT_MCP" />],
          ["Unreachable", <N id="census.UNREACHABLE" />],
          ["Timed out", <N id="census.TIMEOUT" />],
          ["Legacy SSE endpoint only", <N id="census.SSE_ENDPOINT_ONLY" />],
          ["MCP error", <N id="census.MCP_ERROR" />],
          ["Not contacted (reason recorded)", <N id="census.not_attempted" />],
        ]}
      />
      <P>
        Of the <N id="census.responded_new" /> endpoints that answered on 26 September, <N id="census.modern_protocol" /> answered
        the newest protocol request (2026-07-28); the rest answered only the earlier handshake.
      </P>
      <H3>Hugging Face Spaces</H3>
      <P>
        On 25 September we covered all <N id="hfsp.total" /> Spaces tagged mcp-server. We read each Space's runtime stage from
        the Hub first and contacted a Space only if it was running, so none was woken. <N id="hfsp.not_contacted" /> were not
        running: <N id="hfsp.RUNTIME_ERROR" /> in a runtime error, <N id="hfsp.SLEEPING" /> asleep, <N id="hfsp.PAUSED" /> paused and{" "}
        <N id="hfsp.BUILD_ERROR" /> with a build error, among other stages. Of the <N id="hfsp.contacted" /> contacted,{" "}
        <N id="hfsp.RESPONDED" /> answered MCP and <N id="hfsp.SSE" /> offered only legacy SSE. About one tagged Space in five was
        serving MCP at that moment. A tag is self-declared.
      </P>

      <H2 id="parity">Does the listing match the server?</H2>
      <P>
        The question is whether one MCP service tells a relying agent one current contract. We compared what each service says
        about itself across its public surfaces (its registry entry, <Code>/.well-known/mcp.json</Code>, its server card and any
        x402 manifest) with its live discovery answer. A dimension is judged only where two or more surfaces speak to it. The
        plan was <N id="cp.rows" /> endpoints, and every one was attempted (record v0.1.2).
      </P>
      <Table
        caption="Contract parity by dimension, record v0.1.2"
        head={["Dimension", "Compared", "Inconsistent", "Rate"]}
        rows={["VERSION", "TOOLS", "PROTOCOL", "PAYMENT", "AUTH"].map((d) => [
          d,
          <N id={`cp.${d}.compared`} />,
          <N id={`cp.${d}.inconsistent`} />,
          `${pct(`cp.${d}.inconsistent`, `cp.${d}.compared`)}%`,
        ])}
      />
      <UL>
        <li>
          Endpoints with at least one inconsistent dimension: <strong><N id="cp.any" /></strong> of <N id="cp.rows" /> (
          {pct("cp.any", "cp.rows")}%). The superseded records gave <N id="cp.any_v01" /> and then <N id="cp.any_v011" />; see{" "}
          <a className="underline underline-offset-4" href="#corrections">Corrections</a>.
        </li>
        <li>
          Inconsistent on VERSION only: <N id="cp.version_only" />. Inconsistent on another dimension: <N id="cp.non_version" />.
        </li>
        <li>
          <N id="cp.unread_surface" /> endpoints had a surface that did not answer, so this run is labelled PARTIAL.
        </li>
      </UL>
      <H3>The version dimension</H3>
      <P>
        <N id="cp.reg_vs_live" /> of the <N id="cp.VERSION.inconsistent" /> version contradictions compare the registry's{" "}
        <Code>server.version</Code> with the live <Code>serverInfo.version</Code>. The registry schema calls these the same field
        ("Equivalent of Implementation.version in MCP specification"), so we compare them. The most common live values among the
        contradictions are 1.0.0 (<N id="cp.live_1_0_0" />) and 0.1.0 (<N id="cp.live_0_1_0" />). A version contradiction is weak
        evidence that anything is wrong. It is strong evidence that a version string is not a reliable way for an agent to pin a
        contract.
      </P>
      <P>
        A pattern, cause not measured: <N id="cp.v127.rows" /> endpoints on <N id="cp.v127.hosts" /> hosts report the live version
        1.27.0, and <N id="cp.v127.inconsistent" /> of them contradict a registry that gives <N id="cp.v127.reg_versions" />{" "}
        different versions for them. Across live values from 1.24.x to 1.29.x, <N id="cp.v124_129.inconsistent" /> of{" "}
        <N id="cp.v124_129.rows" /> contradict the registry. One possible explanation is that a library fills in its own version
        when a server sets none. That is a hypothesis; we have not measured it.
      </P>
      <P>
        Timing: live answers and documents were read up to about 5.5 hours apart, so a deploy in between can show as
        INCONSISTENT. An inconsistent row says that two public statements disagree. It does not say which one is true.
      </P>

      <H2 id="cards">Signed agent cards</H2>
      <P>
        The A2A card census covered all <N id="a2a.census_listings" /> registry listings (25 September). <N id="a2a.served" />{" "}
        served a card, and <N id="a2a.signed" /> of those ({pct("a2a.signed", "a2a.served")}%) carry a signature. Each card is judged
        by the rules of the spec version it declares (record v0.1.1):
      </P>
      <Table
        caption="Signed agent cards by verification result"
        head={["Result", "Record v0.1.1", "Superseded v0.1"]}
        rows={[
          ["Verified", <N id="a2a.VERIFIED" />, <N id="a2a.v01_VERIFIED" />],
          ["Failed", <N id="a2a.FAILED" />, <N id="a2a.v01_FAILED" />],
          ["Uncheckable (no usable key)", <N id="a2a.UNCHECKABLE" />, <N id="a2a.v01_UNCHECKABLE" />],
        ]}
      />
      <P>
        Why the numbers moved: A2A spec section 8.4.3 (step 3) says to remove properties that hold default values before
        verifying. Our first prober did not. Of the <N id="a2a.1x_cards" /> signed cards that declare 1.x, <N id="a2a.1x_VERIFIED" />{" "}
        verify under the spec's procedure, <N id="a2a.1x_FAILED" /> fail and <N id="a2a.1x_UNCHECKABLE" /> are uncheckable.{" "}
        <N id="a2a.failed_verify_served" /> of the failures verify over the card as served, with defaults left in: the signing
        tools skipped the step the spec requires. <N id="a2a.0x_differ_under_1x" /> cards that declare 0.x verify under 0.x rules,
        which define no canonicalisation, but would get another result under 1.x rules. <N id="a2a.no_key" /> of the uncheckable
        cards point to no key at all.
      </P>
      <P>
        Our reading is that signing tools and the spec's verification procedure currently disagree. That is a finding about a
        canonicalisation gap, not about bad actors. A verified card proves only that the key it points to signed its bytes. It
        does not prove who the agent is.
      </P>

      <H2 id="onchain">On-chain agent registrations</H2>
      <P>
        The ERC-8004 identity registry lets anyone register an agent on-chain. We read every agent id on three chains with
        read-only calls: <N id="erc.agents" /> ids (<N id="erc.ethereum" /> on Ethereum, <N id="erc.base" /> on Base,{" "}
        <N id="erc.bsc" /> on BNB Smart Chain). An id is not an operator; one operator can hold many.
      </P>
      <UL>
        <li>
          <N id="erc.NO_URI" /> ids have no registration file at all.
        </li>
        <li>
          We fetched registration files for the top fifth by a published feedback signal (<N id="erc.plan" /> ids).{" "}
          <N id="erc.NOT_FETCHED" /> ids were outside that plan or refused, <N id="erc.URI_UNREACHABLE" /> files could not be read,
          and <N id="erc.NO_ENDPOINT" /> files declare no MCP, A2A or web endpoint.
        </li>
        <li>
          <N id="erc.DECLARES_ENDPOINT" /> ids declare an endpoint. Of <N id="erc.mcp_planned" /> distinct declared MCP endpoints,
          we contacted <N id="erc.mcp_attempted" />: <N id="erc.mcp_RESPONDED" /> answered as MCP, <N id="erc.mcp_NOT_MCP" /> answered
          but not as MCP and <N id="erc.mcp_UNREACHABLE" /> were unreachable.
        </li>
        <li>
          Of <N id="erc.a2a_attempted" /> declared A2A endpoints, <N id="erc.a2a_served" /> served a card and{" "}
          <N id="erc.a2a_not_found" /> had none at the well-known path. <N id="erc.a2a_signed" /> served cards carry a signature, and{" "}
          <N id="erc.a2a_verified" /> verify.
        </li>
      </UL>
      <P>This census is PARTIAL: registration files were fetched only for the plan, and within a fetch budget.</P>

      <H2 id="payments">Payment doors (x402)</H2>
      <P>
        Each day we read both public x402 Bazaar indexes to the end (<N id="x402.cdp" /> and <N id="x402.payai" /> resources) and
        send one GET to each distinct host. Nothing is paid. On 26 September there were <N id="x402.hosts" /> hosts:
      </P>
      <UL>
        <li>
          <N id="x402.answered_402" /> answered HTTP 402; <N id="x402.header" /> sent a <Code>PAYMENT-REQUIRED</Code> header;{" "}
          <N id="x402.v2" /> declared <Code>x402Version: 2</Code> in the body.
        </li>
        <li>
          <strong>
            <N id="x402.conformant" /> ({String(v("x402.conformant_pct"))}%)
          </strong>{" "}
          were fully conformant: a 402, the header, version 2 in the body and a Bazaar extension block.
        </li>
        <li>
          <N id="x402.header_only" /> pass on the header alone but not in the body. <N id="x402.unreachable" /> were unreachable.
        </li>
        <li>
          The day before there were <N id="x402.prev_hosts" /> hosts and <N id="x402.prev_conformant" /> conformant:{" "}
          <N id="x402.hosts_added" /> hosts were added, <N id="x402.hosts_dropped" /> dropped, <N id="x402.newly_conformant" /> became
          conformant and <N id="x402.lost_conformance" /> lost conformance.
        </li>
      </UL>
      <H3>Context from others (their findings, not ours)</H3>
      <P>
        We did not measure settlement volume or who pays whom. Two published on-chain analyses did. Visa and Artemis ("Agentic
        Payments from the Ground Up", July 2026) report that x402's raw totals of about 135.7 million US dollars settled across
        178.3 million transactions fall to about 15.0 million dollars across 109.6 million once activity resembling wash
        trading, testing or internal transfers is filtered: roughly 89% of the dollars and 39% of the transactions. TRM Labs (9
        September 2026) examined 52.7 million dollars settled across 198.9 million x402 transactions on Base, Solana and
        Polygon, found 25.62 million dollars likely to be commerce, and attributed 0.6% to 7.5% of that to AI agents. The two use different methods and
        windows, and their figures should not be combined.{" "}
        <A href="https://www.visa.com/en-us/thought-leadership/innovation/agentic-payments-from-the-ground-up">Visa and Artemis</A>
        {" · "}
        <A href="https://www.trmlabs.com/trm-tech-blog/whos-actually-paying-measuring-ai-agent-payments-onchain">TRM Labs</A>. Our
        own measurement says nothing about whether any door would deliver after payment.
      </P>

      <H2 id="ledgers">Tokenised assets across ledgers</H2>
      <P>
        The question: where an issuer publishes a list of where its asset lives, can a third party read each ledger, and with
        what strength of evidence? From <N id="xl.frame" /> tokenised-asset candidates in public value sources we took the top
        fifth (<N id="xl.k" />) to read first. Value decides only what we read first; it is not a measurement and not a ranking.{" "}
        <N id="xl.assets_wired" /> selected assets have an issuer-list reader wired; <N id="xl.unmeasured" /> do not and are
        UNMEASURED. We read <N id="xl.deployments" /> issuer-listed deployments on 26 September.
      </P>
      <Table
        caption="Evidence ladder: deployments read, by strength of evidence"
        head={["Evidence level", "Deployments", "What it means", "Ledgers"]}
        rows={LADDER.map((l) => [
          <Code>{l.level}</Code>,
          <N id={`xl.${l.level}`} />,
          l.meaning,
          (LEDGERS[l.level] || []).join(", "),
        ])}
      />
      <UL>
        <li>
          The level depends on the pair of reader and ledger, not only on the ledger: the same chain can appear at two levels
          for different assets.
        </li>
        <li>
          Issuer lists: <N id="xl.list_read" /> assets publish a readable deployment list. <N id="xl.list_permissioned" /> are
          bank deposit-token services on private, permissioned ledgers, with nothing a third party can read.{" "}
          <N id="xl.list_unavailable" /> has no public deployment list, and <N id="xl.list_uncheckable" /> list pages could not be
          read.
        </li>
        <li>
          Issuer claims against ledgers: <N id="xl.parity.CONSISTENT" /> assets consistent, <N id="xl.parity.INCONSISTENT" />{" "}
          inconsistent, <N id="xl.parity.UNCHECKABLE" /> uncheckable. The inconsistencies fall into two classes:{" "}
          <N id="xl.f.deprecated" /> deployments that an issuer lists as deprecated still show issued supply ("deprecated" is the
          issuer's word; we do not assess its meaning), and <N id="xl.f.unlisted" /> contract, on a ledger the issuer does not list
          and at an address it lists elsewhere, answers with the product's symbol. Whether that contract is the issuer's is not
          established.
        </li>
        <li>
          These reads measure issued supply only. They say nothing about reserves, backing, net asset value, ownership or
          redeemability, and there is no cross-asset total. Nothing here is investment advice.
        </li>
      </UL>

      <H2 id="reproducibility">The same model on two runtimes</H2>
      <P>
        A published score is only useful if it belongs to the model rather than to the machine it ran on. We re-ran signed
        measurement cards on a second runtime with the same model digest, the same instrument and the same item bank: the first
        runs were on an RTX 3090, the re-runs on Kaggle 2×T4 (ollama 0.33.0, temperature 0, seed 0).
      </P>
      <Table
        caption="Cross-runtime reproduction of signed measurement cards"
        head={["Measure", "Batch 1", "Batch 2"]}
        rows={[
          ["Scope", "1 model, 14 axes", <><N id="m2.models" /> models × <N id="m2.axes" /> axes</>],
          ["Cards re-run", <N id="m1.cards" />, <N id="m2.cards" />],
          ["Same grade on every item", <N id="m1.itemwise" />, <N id="m2.itemwise" />],
          ["Same score only (item grades differed)", <N id="m1.aggregate_only" />, <N id="m2.aggregate_only" />],
          ["Not reproduced", <N id="m1.not" />, <N id="m2.not" />],
          ["Items compared", <N id="m1.items" />, <N id="m2.items" />],
          [
            "Item grades that differed",
            <N id="m1.grade_differ" />,
            <>
              {(Number(v("m2.items")) - Number(v("m2.grade_equal"))).toLocaleString("en-GB")}
            </>,
          ],
        ]}
      />
      <P>
        In batch 2, <N id="m2.grade_equal" /> of <N id="m2.items" /> item grades matched ({String(v("m2.grade_equal_pct"))}%) and{" "}
        <N id="m2.raw_equal" /> raw outputs were byte-identical. Yet only <N id="m2.itemwise" /> cards had the same grade on every
        item, and <N id="m2.rule_met" /> of those also had the same counts. Two runs can reach the same score with different item
        grades, so we now admit a reproduction only at the item level: same instrument, model and bank, same counts, and the same
        grade on every item. The <N id="m2.rule_met_n30" /> cards that meet that rule with at least 30 graded items are released
        for quoting; the rest are not.
      </P>
      <P>
        The second runtime is not deterministic either: a repeat on the same T4s was not byte-identical for{" "}
        <N id="m2.repeat_not_identical" /> model-axis pairs. The 3090's GPU driver and its ollama version at run time were not
        recorded, and two runtimes cannot separate hardware effects from the software stack. A third runtime would be needed.
      </P>

      <H2 id="ourselves">Ourselves first</H2>
      <P>
        Before measuring anyone else, we measured how external indexes list us: <N id="sp.cells" /> cells, one for each of our
        offerings in each index that could list it.
      </P>
      <UL>
        <li>
          <N id="sp.CONSISTENT" /> consistent, <strong><N id="sp.INCONSISTENT" /> inconsistent</strong>, <N id="sp.NOT_LISTED" /> not
          listed (recorded only after a complete read of an open directory), <N id="sp.UNCHECKABLE" /> uncheckable and{" "}
          <N id="sp.NOT_DECLARED" /> not declared.
        </li>
        <li>
          The <N id="sp.INCONSISTENT" /> inconsistencies are ours to fix: <N id="sp.x402_url" /> x402 listings whose URL query string
          differs from our manifest, <N id="sp.tools" /> directory tool list that differs from
          what our MCP server serves, and <N id="sp.version" /> registry package version that lags the package index.
        </li>
        <li>
          <N id="own.endpoints" /> registry endpoints are listed under our own names, and <N id="own.unreachable" /> of them point
          at a host that does not resolve. They are counted as unreachable in the census above, like anyone else's.
        </li>
        <li>
          We also record <N id="ps.signals" /> public signals about ourselves each day (downloads, citations, index listings):{" "}
          <N id="ps.measured" /> were measured. <N id="ps.self" /> are our own activity, <N id="ps.external" /> come from outside and{" "}
          <N id="ps.mixed" /> cannot be separated, so download counts are context, not users.
        </li>
      </UL>

      <H2 id="not-measured">What we did not measure</H2>
      <UL>
        <li>Whether any service, agent, card or payment door is safe, correct, maintained, or does what it says.</li>
        <li>Anything behind authentication. We sent no credential, called no tool and paid for nothing.</li>
        <li>Smithery beyond the entries its anonymous interface serves; any combined population total.</li>
        <li>Reachability from any other network location, or at any other time.</li>
        <li>Which of two disagreeing public statements is true.</li>
        <li>Identity: a verified signature proves who holds a key, not who an agent is.</li>
        <li>Payment settlement, delivery after payment, price or volume.</li>
        <li>
          Reserves, backing, net asset value, holders or redeemability of any asset; the <N id="xl.unmeasured" /> selected assets
          with no reader wired; permissioned ledgers.
        </li>
        <li>A third runtime for the reproduction study, the 3090's driver, or its ollama version at run time.</li>
        <li>Traffic or ranking in any index that lists us.</li>
      </UL>

      <H2 id="corrections">Corrections</H2>
      <P>
        We published three corrections to our own published figures on 26 September 2026. Each superseded record stays
        published byte for byte beside its correction.
      </P>
      <ol className="mt-3 list-decimal space-y-2 pl-5 leading-relaxed text-slate-700">
        <li>
          <strong>Contract parity v0.1 to v0.1.1.</strong> Four misreads in the producer were fixed. Endpoints with any
          inconsistency went from <N id="cp.any_v01" /> to <N id="cp.any_v011" />.
        </li>
        <li>
          <strong>A2A card census v0.1 to v0.1.1.</strong> The spec's default-value removal (section 8.4.3) was not applied in
          v0.1. Verified cards went from <N id="a2a.v01_VERIFIED" /> to <N id="a2a.VERIFIED" />, failed from{" "}
          <N id="a2a.v01_FAILED" /> to <N id="a2a.FAILED" />.
        </li>
        <li>
          <strong>Contract parity v0.1.1 to v0.1.2.</strong> Three method defects were fixed: an asymmetric authentication rule, a
          tool list read as a contradiction when only part of it is public before authentication, and a surface that did not
          answer being counted as silence. Endpoints with any inconsistency went from <N id="cp.any_v011" /> to{" "}
          <N id="cp.any" />, and the run is now labelled PARTIAL.
        </li>
      </ol>
      <P>
        A fourth change corrected a label only: the MCP endpoint census v0.2 had said EXHAUSTED while{" "}
        <N id="census.not_attempted" /> endpoints were not contacted. Record v0.2.1 says PARTIAL. No count changed.
      </P>
      <P>
        <strong>Two notices were cancelled.</strong> We had prepared private notes to two service operators about findings in
        our data, one about an agent-card signature and one about an authentication declaration. The corrections above showed
        both findings were wrong, so neither was sent. No notice from that queue has been sent.
      </P>
      <P>
        Our full corrections ledger is at <Link href="/corrections/" className="underline underline-offset-4">/corrections</Link>.
      </P>

      <H2 id="verify">How to verify</H2>
      <H3>The numbers on this page</H3>
      <P>
        Every figure above is in <A href="/state/2026-09/numbers.json">numbers.json</A>, with the record it was recomputed from and
        that record's sha256. The file is signed in <A href="/state/2026-09/numbers.signed.json">numbers.signed.json</A> and
        timestamped in <A href="/state/2026-09/numbers.json.ots">numbers.json.ots</A>.
      </P>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 leading-relaxed text-slate-700">
        <li>
          Fetch the key: <Code>did:web:csoai.org#board-attestation-1</Code> in{" "}
          <A href="https://csoai.org/.well-known/did.json">csoai.org/.well-known/did.json</A> (Ed25519, <Code>x = k2fPWb6ctyu8l5at8FYgHsHFit_qoT-DssW3VNbCAXA</Code>).
        </li>
        <li>
          Canonicalise <Code>payload</Code> from the signed file as JSON with keys sorted, no whitespace, UTF-8. Its sha256 must
          equal <Code>signature.payload_sha256</Code>.
        </li>
        <li>
          <Code>payload.artifact.sha256</Code> must equal the sha256 of numbers.json as downloaded.
        </li>
        <li>
          Verify <Code>signature.sig_ed25519</Code> (hex) over the canonical payload bytes with the key.
        </li>
        <li>
          Timestamp: <Code>ots upgrade numbers.json.ots && ots verify numbers.json.ots</Code>. At publication the proof is a
          pending calendar commitment, not yet a Bitcoin attestation; upgrade it later to check.
        </li>
      </ol>
      <H3>The records behind them</H3>
      <P>
        Most source records are public on Hugging Face with the same sha256 (the appendix links each one), so every count can be
        recomputed from the published rows. The same signature check applies to each <Code>*.signed.json</Code> beside them. The
        cross-runtime, self-parity and public-signal records are not yet published; their sha256 is given so a later
        publication can be checked against it.
      </P>
      <H3>The measurement index</H3>
      <P>
        One index binds the day's measurement capsules together. Index sha256 <Code>{IDX.sha256}</Code>; index root{" "}
        <Code>{IDX.index_root}</Code>, an RFC 6962 Merkle tree hash over the sorted capsule ids of all{" "}
        <N id="index.batches" /> batches (<N id="index.capsules" /> capsules); root over the batch roots{" "}
        <Code>{IDX.root_over_batch_merkle_roots}</Code>. The index signature verifies under the same key; its timestamp is a
        pending calendar commitment. The index and its capsule batches are not yet published.
      </P>
      <H3>Ask for a re-check, or object</H3>
      <P>
        If a figure here is wrong, or a row about your service is out of date, email <PlainEmail className="underline underline-offset-4" subject="State report: re-check" />{" "}
        or use <Link href="/dispute/" className="underline underline-offset-4">/dispute</Link> to object to, dispute or request a
        correction of anything we publish. Corrections are dated in the ledger.
      </P>

      <H2 id="appendix">Appendix: every number and its source</H2>
      <P>
        Paths are relative to the measuring host's data volume. "Public copy" links go to a file with the same sha256.
      </P>
      <Table
        caption="Every number on this page with its source record"
        head={["Number", "Value", "Source", "Recompute"]}
        rows={Object.entries(NUMS).map(([id, n]) => [
          <span title={id}>{n.what}</span>,
          typeof n.value === "number" ? n.value.toLocaleString("en-GB") : n.value,
          <a className="underline underline-offset-4" href={`#src-${n.source}`}>
            {n.source}
          </a>,
          <span className="text-xs">{n.recompute}</span>,
        ])}
      />
      <Table
        caption="Source records with sha256"
        head={["Source", "Record", "sha256", "Board signature"]}
        rows={Object.entries(SRCS).map(([k, s]) => [
          <span id={`src-${k}`} className="scroll-mt-20">
            {k}
          </span>,
          <>
            {s.what}
            <br />
            <span className="text-xs">{s.path}</span>
            {s.public_copy ? (
              <>
                <br />
                <A href={s.public_copy}>public copy</A>
              </>
            ) : null}
          </>,
          <Code>{s.sha256}</Code>,
          s.board_signature ? `${s.board_signature} (${s.signed_at})` : "no signature of its own; sha256 given",
        ])}
      />
    </article>
  );
}
