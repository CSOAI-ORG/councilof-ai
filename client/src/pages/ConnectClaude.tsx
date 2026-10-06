import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import FREE_TOOLS from "../../../functions/mcp/gspc-tools.json";
import { CONTACT_MAILBOX } from "@/lib/buying";

// /connect/claude — the connector documentation page named in the Claude connector directory
// listing (Anthropic Software Directory Policy 3.C: purpose, setup and troubleshooting, public).
//
// The address it documents is /mcp/free: the free readers only, served by
// functions/mcp/[[path]].ts from the same definitions as /mcp, filtered. The tool list below is
// read from functions/mcp/gspc-tools.json, the file tools/list serves, so the page cannot name a
// tool the door does not serve or miss one it does (ConnectClaude.test.ts). No price, no count typed
// here, no certification claim. Every limit stated below is one the code enforces or a plain fact
// about what is published; nothing here is a service commitment.

export const FREE_DOOR = "https://councilof.ai/mcp/free";
export const CLAUDE_CODE_CMD = `claude mcp add --transport http council-of-ai ${FREE_DOOR}`;
// Cursor reads ~/.cursor/mcp.json (or .cursor/mcp.json in a project) and detects Streamable HTTP
// from a bare url (https://cursor.com/docs/context/mcp). The home hero and /tools link here as
// "Add to Claude or Cursor", so the Cursor line has to be on this page.
export const CURSOR_JSON = `{"mcpServers":{"council-of-ai":{"url":"${FREE_DOOR}"}}}`;
const SUPPORT = CONTACT_MAILBOX;

type ToolDef = { name: string; title?: string };
export const TOOLS = (FREE_TOOLS as { tools: ToolDef[] }).tools;

/** One line per tool, in plain words. Keyed by name; the test holds the keys to the served list. */
export const ONE_LINE: Record<string, string> = {
  board_totals: "How many axes the GSPC board carries and how many have a measurement behind them, with the board's dates.",
  get_axis: "One board axis: status, sample size, accuracy and interval where they exist, and a link to the run behind it.",
  verify_card: "Checks a signed measurement card against the published key: VALID, INVALID with the reason, or UNCHECKABLE.",
  list_cards: "Recent rows of the signed card index, optionally for one axis.",
  get_root: "The current public Merkle root and the number of leaves under it.",
  get_card: "One card leaf under the public root, looked up by its SHA-256.",
  verify_inclusion: "Whether a SHA-256 is a leaf of the live Merkle root.",
  x402_trust: "Counts from the latest census of public x402 endpoints: how many answered a correct challenge.",
  mcp_trust: "Counts from the latest census of public MCP servers: how many answered a correct handshake.",
  measurement_index: "The signed index of measurement capsules, its signature check and its anchor states.",
  verify_capsule: "Checks one measurement capsule's id, its inclusion in its batch and the index signature.",
  server_evidence: "Every published measurement capsule about one MCP or agent endpoint URL, or NOT_MEASURED.",
  evidence_bundle_preview: "The already-signed cards relevant to one obligation (Article 50, Article 53, DORA or CRA). Observations, never a determination.",
  route: "GSPC Route, decide-only: your policy applied to published measurements. TIE and UNTESTED stated; nothing executed.",
};

export const EXAMPLE_PROMPTS = [
  "What does the Council of AI measurement board show right now? How many axes are measured?",
  "Show me the Council of AI safety axis: sample size, accuracy and interval.",
  "Verify this Council of AI signed measurement card: https://councilof.ai/signed/cards/82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c.json",
  "Has Council of AI published any measurements about the MCP server at https://councilof.ai/mcp? What was checked?",
  "In Council of AI's latest census of public MCP servers, how many answered a correct handshake?",
];

const STATES: [string, string][] = [
  ["VALID", "The record was published by Council of AI and has not been altered since. It is not an endorsement, rating or compliance opinion about what was measured."],
  ["INVALID", "The record fails the published verification rule. The answer says which check failed."],
  ["UNCHECKABLE", "The check could not be completed, for the stated reason. Nothing was judged: this is not a finding that a record is forged."],
  ["UNMEASURED", "A board slot with no run behind it. It is published so the gap is visible, and it is never a zero."],
  ["NOT_MEASURED", "We hold no published measurement about that endpoint. It is not a clean result."],
  ["UNREACHABLE", "A public source file could not be fetched at that moment. No cached or remembered number is substituted."],
];

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} className="font-medium text-emerald-800 underline underline-offset-2 hover:decoration-2">
    {children}
  </a>
);

function Copy({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={() =>
        navigator.clipboard?.writeText(text).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 1400);
          },
          () => {},
        )
      }
      className="shrink-0 rounded border border-emerald-700 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

function Code({ text, label }: { text: string; label: string }) {
  return (
    <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2">
      <code className="min-w-0 flex-1 break-all font-mono text-sm text-slate-900">{text}</code>
      <Copy text={text} label={label} />
    </div>
  );
}

const Section = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <section id={id} aria-labelledby={`${id}-h`} className="mt-12">
    <h2 id={`${id}-h`} className="text-2xl font-bold tracking-tight text-slate-950">
      {title}
    </h2>
    <div className="mt-3 space-y-3 text-[15px] leading-7 text-slate-800">{children}</div>
  </section>
);

export default function ConnectClaude() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Use Council of AI in Claude",
    about: "Adding the Council of AI measurement-records connector to Claude",
    url: "https://councilof.ai/connect/claude/",
    isPartOf: { "@type": "WebSite", name: "Council of AI", url: "https://councilof.ai" },
    publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai" },
    description:
      "How to add the Council of AI connector to Claude, the tools it provides, example prompts, limits and support. Read-only and free. Measurement, not certification.",
  };

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Connector documentation</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Use Council of AI in Claude</h1>
        <p className="mt-5 text-lg leading-8 text-slate-800">
          Council of AI publishes independent measurements of AI systems and signs each record so that anyone can
          check it. This connector gives Claude read-only access to those public records. It needs no account and no
          key, and every tool on it is free.
        </p>

        <div className="mt-8 rounded-xl border border-emerald-700/40 bg-emerald-50/60 p-5">
          <p className="text-sm font-semibold text-slate-900">Connector URL</p>
          <Code text={FREE_DOOR} label="connector URL" />
          <p className="mt-3 text-sm leading-6 text-slate-800">
            Remote MCP server over Streamable HTTP. Authentication: none. Every tool is read-only.
          </p>
        </div>

        <Section id="add" title="Add it to Claude">
          <h3 className="text-lg font-semibold text-slate-950">Claude on the web and Claude Desktop</h3>
          <ol className="list-decimal space-y-2 pl-6">
            <li>
              Open <strong>Customize</strong>, then <strong>Connectors</strong>, and choose{" "}
              <strong>Add custom connector</strong>.
            </li>
            <li>
              Give it a name, for example <em>Council of AI</em>, and paste <code className="font-mono">{FREE_DOOR}</code>{" "}
              as the URL.
            </li>
            <li>Leave authentication off. There is nothing to sign in to.</li>
            <li>Start a new chat with the connector turned on, and ask one of the questions below.</li>
          </ol>
          <h3 className="pt-3 text-lg font-semibold text-slate-950">Claude Code</h3>
          <Code text={CLAUDE_CODE_CMD} label="Claude Code command" />
          <h3 className="pt-3 text-lg font-semibold text-slate-950">Cursor</h3>
          <p>
            Add this to <code className="font-mono">~/.cursor/mcp.json</code>, or to{" "}
            <code className="font-mono">.cursor/mcp.json</code> in a project, then reload Cursor.
          </p>
          <Code text={CURSOR_JSON} label="Cursor mcp.json" />
          <h3 className="pt-3 text-lg font-semibold text-slate-950">Any other MCP client</h3>
          <p>
            Add <code className="font-mono">{FREE_DOOR}</code> as a Streamable HTTP server with no authentication.
            Opening that address in a browser shows a short page describing it.
          </p>
        </Section>

        <Section id="tools" title={`The tools (${TOOLS.length})`}>
          <p>All of them read public records. None writes, pays, signs or sends anything on your behalf.</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">Tools served at {FREE_DOOR}</caption>
              <thead>
                <tr className="border-b border-slate-300 text-slate-700">
                  <th scope="col" className="py-2 pr-4 font-semibold">Tool</th>
                  <th scope="col" className="py-2 font-semibold">What it answers</th>
                </tr>
              </thead>
              <tbody>
                {TOOLS.map((t) => (
                  <tr key={t.name} className="border-b border-slate-200 align-top">
                    <th scope="row" className="py-2 pr-4 font-normal">
                      <code className="whitespace-nowrap font-mono text-emerald-900">{t.name}</code>
                    </th>
                    <td className="py-2 text-slate-800">{ONE_LINE[t.name] ?? t.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            <code className="font-mono">board_totals</code> returns a short summary by default. Ask Claude for the full
            detail, or pass <code className="font-mono">detail: "full"</code>, to get the long-form count grammar, the
            per-family counts and the board's full dates block.
          </p>
        </Section>

        <Section id="examples" title="Example prompts">
          <ol className="list-decimal space-y-2 pl-6">
            {EXAMPLE_PROMPTS.map((p) => (
              <li key={p} className="break-words">
                {p}
              </li>
            ))}
          </ol>
          <p>
            The numbers change as the board changes. Each answer carries its own date and a link to its source; quote
            those rather than a number remembered from an earlier chat.
          </p>
        </Section>

        <Section id="states" title="What an answer means">
          <dl className="space-y-3">
            {STATES.map(([k, v]) => (
              <div key={k}>
                <dt className="font-mono text-sm font-bold text-slate-950">{k}</dt>
                <dd className="text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
          <p>
            Measurement, not certification. The rule behind every verification is published at{" "}
            <A href="/signed/HOW-TO-VERIFY.md">HOW-TO-VERIFY.md</A>.
          </p>
        </Section>

        <Section id="limits" title="Limits">
          <ul className="list-disc space-y-2 pl-6">
            <li>Read-only. This address carries only the free tools; nothing on it takes or makes a payment.</li>
            <li>
              Answers are live reads of public files on councilof.ai. If a file cannot be fetched, the answer is
              UNREACHABLE rather than a stale number.
            </li>
            <li>
              <code className="font-mono">verify_card</code> fetches card URLs only from councilof.ai and csoai.org. For a
              card anywhere else, paste its JSON into the chat.
            </li>
            <li>
              <code className="font-mono">server_evidence</code> looks an endpoint up in our published records. It does
              not contact the endpoint you name.
            </li>
            <li>The server refuses request bodies over 28 MiB and drops a request body that takes more than 10 seconds to arrive.</li>
            <li>We publish no rate limit and no uptime commitment for this address.</li>
          </ul>
        </Section>

        <Section id="troubleshooting" title="Troubleshooting">
          <dl className="space-y-3">
            <div>
              <dt className="font-semibold text-slate-950">Claude says it couldn't reach the server</dt>
              <dd>
                Check that the URL is exactly <code className="font-mono">{FREE_DOOR}</code> and that authentication is
                off, then try again. If it keeps failing, write to us with the time it happened.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">An answer says UNREACHABLE</dt>
              <dd>A source file could not be fetched at that moment. Try again later; nothing cached was shown to you instead.</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">A tool is reported as not found</dt>
              <dd>This address serves only the tools listed above.</dd>
            </div>
          </dl>
        </Section>

        <Section id="privacy" title="Privacy">
          <p>
            A tool call sends us the tool name and the arguments Claude chose, such as an axis name, a card or an
            endpoint URL. We do not receive your conversation, and there is no account. What is processed and logged is
            set out in the <A href="/privacy-policy/#mcp">privacy notice</A>.
          </p>
        </Section>

        <Section id="support" title="Support">
          <p>
            Email <A href={`mailto:${SUPPORT}`}>{SUPPORT}</A> or use the <Link href="/contact" className="font-medium text-emerald-800 underline underline-offset-2">contact page</Link>.
            Security reports: <A href="/.well-known/security.txt">security.txt</A>. Terms:{" "}
            <A href="/terms-of-service/">terms of service</A>. Every other way to connect, including other AI clients:{" "}
            <Link href="/connect-gspc" className="font-medium text-emerald-800 underline underline-offset-2">Connect GSPC to your AI</Link>.
          </p>
        </Section>
      </div>
    </div>
  );
}
