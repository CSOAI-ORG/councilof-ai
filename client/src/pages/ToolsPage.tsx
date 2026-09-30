import MomentumStrip from "@/components/momentum/MomentumStrip";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Copy, PlugZap, ShieldCheck, Terminal } from "lucide-react";
import SignedAgentTravel from "@/components/SignedAgentTravel";
import TwoSpeed from "@/components/TwoSpeed";
import WatchlistPane from "@/components/WatchlistPane";
import { ALL_TOOL_NAMES, FREE_TOOL_NAMES, PAID_TOOL_NAMES } from "@/lib/mcpTools";
import { setMetaDescription } from "@/lib/utils";
import EXTENSION_MANIFEST from "../../../extensions/chrome-gspc-verify/manifest.json";

// The free door is the default everywhere a config is offered (audit 2026-09-28 #10): the first
// snippet a developer copies should reach the tools that cost nothing. /mcp is still named below,
// with what it adds, and both parts of its count are read from the manifests it serves.
const MCP_URL = "https://councilof.ai/mcp/free";
const MCP_METERED_URL = "https://councilof.ai/mcp";
// The zip is rebuilt from extensions/chrome-gspc-verify/ by scripts/build-extension-zip.py; its name
// carries the manifest version, so the link is read from that manifest, never typed.
const EXTENSION_ZIP = `/downloads/gspc-verify-${EXTENSION_MANIFEST.version}.zip`;
const MCP_SNIPPET = `{
  "mcpServers": {
    "gspc": {
      "url": "${MCP_URL}"
    }
  }
}`;

// The three measurement states a model/agent card may carry (P0.5 / A5). A
// global-board badge is navigation, not a fourth subject state. There is no
// "GSPC certified" and there is no gold badge — measurement, not certification.
const BADGE_SPEC = [
  {
    badge: "GSPC unmeasured",
    colour: "#9ca3af",
    swatch: "bg-gray-400",
    word: "grey",
    when: "No admitted run exists for the exact subject and revision. A listing is DISCOVERED, not a score.",
  },
  {
    badge: "GSPC unsigned",
    colour: "#ca8a04",
    swatch: "bg-amber-600",
    word: "amber",
    when: "A run is claimed, but no VALID signed cell binds the subject, revision, axis, instrument, run and score.",
  },
  {
    badge: "GSPC measured",
    colour: "#0B1F33",
    swatch: "bg-[#0B1F33]",
    word: "navy",
    when: "A VALID card binds the exact subject and revision to the axis, instrument, run and score. The only state that may display that score.",
  },
] as const;

const MODEL_CARD_BLOCK = `[![GSPC board](https://councilof.ai/api/badge?label=GSPC%20board)](https://councilof.ai/gspc-scoreboard)
The badge above links to the global board. It does not measure this model.
This model is **UNMEASURED** unless a VALID signed card names its exact revision.
Verify a card: https://councilof.ai/gspc-verify
Live board: https://councilof.ai/api/gspc
Measurement, not certification.`;

const HOSTS = [
  { name: "Claude", how: "Add gspc → paste the JSON below, or the URL." },
  { name: "Cursor", how: "Paste the JSON into ~/.cursor/mcp.json" },
  { name: "Kimi", how: "MCP settings → same JSON / URL." },
  { name: "Grok", how: "Same URL, as a remote (Streamable HTTP) MCP server." },
] as const;

export default function ToolsPage() {
  const [copied, setCopied] = useState(false);
  const [cardCopied, setCardCopied] = useState(false);
  useEffect(() => {
    document.title = "Add the GSPC tools to your AI client | Council of AI";
    setMetaDescription(
      `Council OS for people already in Claude, Cursor, Kimi, or Grok. ${FREE_TOOL_NAMES.length} free tools at ${MCP_URL}; ${ALL_TOOL_NAMES.length} at ${MCP_METERED_URL} (${FREE_TOOL_NAMES.length} free + ${PAID_TOOL_NAMES.length} x402-metered evidence tools). Measurement, never certification.`,
    );
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16" data-testid="tools-mcp">
      <div className="overflow-hidden rounded-[2rem] border border-emerald-400/15 bg-[#06150f] text-white shadow-[0_28px_80px_rgba(3,17,11,0.18)]">
        <div className="grid gap-0 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="min-w-0 p-6 sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">
              <PlugZap className="h-3.5 w-3.5" />
              Agent tools · MCP endpoint
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
              Give your AI a verifiable evidence layer.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-100/72">
              Connect Council of AI to Claude, Cursor, Kimi, or Grok. Read the board, inspect evidence,
              and verify signed records without turning a directory listing into a trust claim.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              {/* Both counts are read from the manifests the /mcp door serves
                  (functions/mcp/gspc-tools.json + paid-tools.json), never typed. They are
                  two parts of one total, so the pills say so instead of standing side by
                  side as if they measured different things. */}
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-emerald-100">
                <Terminal className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                {ALL_TOOL_NAMES.length} tools in all
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-emerald-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                {FREE_TOOL_NAMES.length} free to read
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-emerald-100">
                <ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                {PAID_TOOL_NAMES.length} metered (x402)
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-emerald-100/75">
              Verification runs in your browser and is always free.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-testid="copy-mcp-snippet"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-[#03110b] transition hover:bg-emerald-300"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(MCP_SNIPPET);
                    setCopied(true);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied" : "Copy MCP config"}
              </button>
              <a
                href="/gspc-verify"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-emerald-50 transition hover:bg-white/10"
              >
                Verify a record <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/connect/claude/"
                data-testid="tools-connect-claude"
                className="inline-flex min-h-11 items-center gap-1 px-1 text-sm font-semibold text-emerald-200 underline decoration-emerald-300/50 underline-offset-4 hover:text-emerald-50"
              >
                Add to Claude or Cursor →
              </a>
            </div>
          </div>
          <div className="min-w-0 border-t border-white/10 bg-black/10 p-5 sm:p-7 lg:border-l lg:border-t-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300/70">Connection config</p>
            <p className="mt-2 break-all font-mono text-xs text-emerald-100/65">{MCP_URL}</p>
            <p className="mt-1 text-xs leading-5 text-emerald-100/65" data-testid="tools-door-split">
              {FREE_TOOL_NAMES.length} free tools, no payment. <span className="font-mono">{MCP_METERED_URL}</span> serves{" "}
              {ALL_TOOL_NAMES.length}: {FREE_TOOL_NAMES.length} free + {PAID_TOOL_NAMES.length} metered.
            </p>
            <pre tabIndex={0} className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-[#020a06] p-5 text-[13px] leading-6 text-emerald-100 shadow-inner">
              <code>{MCP_SNIPPET}</code>
            </pre>
            <p className="mt-4 text-xs leading-5 text-emerald-100/55">
              A package, registry listing, or successful connection proves discoverability only. It does not prove settlement,
              delivery, or the truth of an underlying claim.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {HOSTS.map((h, index) => (
          <div key={h.name} className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-[0_10px_32px_rgba(6,21,15,0.04)]">
            <div className="flex items-center justify-between gap-3">
              <div className="font-bold text-slate-950">{h.name}</div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">0{index + 1}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{h.how}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-sm leading-6 text-emerald-950">
        <strong>Trust boundary:</strong> a third party verifying a signed record is meaningful evidence. Connecting an MCP server is not.
        The browser verifier stays free and recomputes Ed25519 locally.
      </div>
      <section id="extension" aria-labelledby="extension-h" className="mt-8 rounded-2xl border border-slate-200 bg-white p-5" data-testid="tools-extension">
        <h2 id="extension-h" className="text-base font-bold text-slate-900">Browser extension (Chrome, load unpacked)</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Shows the live board, puts a signed-card state on Hugging Face model pages, and verifies a pasted card
          offline. It is not in the Chrome Web Store: download the zip, unzip it, open{" "}
          <code>chrome://extensions</code>, switch on Developer mode, choose <strong>Load unpacked</strong> and pick
          the unzipped folder.
        </p>
        <a
          href={EXTENSION_ZIP}
          download
          className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
        >
          Download GSPC Verify {EXTENSION_MANIFEST.version} (zip)
        </a>
      </section>
      <section aria-labelledby="badge-spec-h" className="mt-12">
        <h2 id="badge-spec-h" className="text-xl font-black tracking-tight text-slate-900">
          The three subject states — and the badge that is only a link
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          A model or agent card may wear exactly one of these three states. There is no{" "}
          <em>“GSPC certified”</em> and there is no gold badge — we measure, we never certify. The
          default badge image is the global board count from{" "}
          <a className="font-medium text-emerald-800 hover:underline" href="/api/gspc">GET /api/gspc</a>.
          It is navigation, not evidence about the model whose README contains it. Only a VALID,
          subject-bound signed cell may render that model’s score.
        </p>
        <div role="region" aria-label="GSPC badge states" tabIndex={0} className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[34rem] text-sm">
            <caption className="sr-only">
              The three permitted GSPC badge states and when each is allowed on a model or agent card.
            </caption>
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-700">
                <th scope="col" className="p-3">Badge</th>
                <th scope="col" className="p-3">Colour</th>
                <th scope="col" className="p-3">When allowed on a model/agent card</th>
              </tr>
            </thead>
            <tbody>
              {BADGE_SPEC.map((b) => (
                <tr key={b.badge} className="border-b last:border-0">
                  <td className="whitespace-nowrap p-3 font-semibold text-slate-900">{b.badge}</td>
                  <td className="whitespace-nowrap p-3">
                    {/* Colour is stated in words + hex, never colour alone (WCAG 1.4.1). */}
                    <span aria-hidden="true" className={`mr-2 inline-block h-3 w-3 rounded-full align-middle ${b.swatch}`} />
                    <span className="align-middle">{b.word}</span>{" "}
                    <code className="align-middle text-[11px] text-slate-500">{b.colour}</code>
                  </td>
                  <td className="p-3 text-slate-600">{b.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Board endpoint: <code>https://councilof.ai/api/badge?label=GSPC%20board</code> (global count,
          not a model score). Subject endpoint: <code>/api/badge?card=&lt;SIGNED_CARD_SHA256&gt;&amp;subject=&lt;URL_ENCODED_OWNER%2FMODEL%40COMMIT_SHA&gt;</code>.
          The card body must name the exact subject and revision, and the verifier must return VALID,
          before its score appears beside a model.
        </p>

        <h3 className="mt-8 text-base font-bold text-slate-900">
          Model-card block — copy-paste for maintainers who opt in
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          DISCOVERED means listed, not graded. Add this to your own README if you want a clearly
          labelled link to the global board; nobody is PR-bombed with it and it never grades the model.
        </p>
        <pre tabIndex={0} className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-[13px] text-emerald-100">
          <code>{MODEL_CARD_BLOCK}</code>
        </pre>
        <button
          type="button"
          data-testid="copy-model-card-block"
          className="mt-3 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(MODEL_CARD_BLOCK);
              setCardCopied(true);
            } catch {
              setCardCopied(false);
            }
          }}
        >
          {cardCopied ? "Copied" : "Copy the model-card block"}
        </button>
      </section>

      <p className="mt-6 text-sm text-slate-500">
        Consent first. MCP stays off until you trust it. Extra MCP catalogues are not this
        product. Strangers with a PDF and no plugin:{" "}
        <a href="/gspc-verify" className="font-medium text-emerald-800 hover:underline">
          verify here
        </a>
        , free. New here?{" "}
        <a href="/quickstart" className="font-medium text-emerald-800 hover:underline">
          quickstart
        </a>
        .
      </p>
      <MomentumStrip
        variant="panel"
        title="The tools, and how far they travel"
        ids={["mcp_tools", "x402_doors", "pypi_csoai_all_time", "hf_downloads_30d_other"]}
      />
      <SignedAgentTravel />
      <TwoSpeed />
      <WatchlistPane />
    </section>
  );
}
