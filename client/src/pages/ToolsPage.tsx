import { useEffect, useState } from "react";
import SignedAgentTravel from "@/components/SignedAgentTravel";
import TwoSpeed from "@/components/TwoSpeed";
import WatchlistPane from "@/components/WatchlistPane";
import InstallSurfaceCards from "@/components/InstallSurfaceCards";
import { setMetaDescription } from "@/lib/utils";

const MCP_URL = "https://councilof.ai/mcp";
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
  { name: "Grok", how: "Same URL, or grok plugin install CSOAI-ORG/council-of-ai-grok" },
] as const;

export default function ToolsPage() {
  const [copied, setCopied] = useState(false);
  const [cardCopied, setCardCopied] = useState(false);
  useEffect(() => {
    document.title = "Add gspc in your tool | councilof.ai";
    setMetaDescription(
      "Council OS for people already in Claude, Cursor, Kimi, or Grok. Eleven tools at https://councilof.ai/mcp: seven free readers and four x402-metered evidence tools. Measurement, never certification.",
    );
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16" data-testid="tools-mcp">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">
        Use this in Claude / Cursor / Kimi / Grok
      </h1>
      <p className="mt-3 text-slate-600">
        Ask: board totals. Paste a card to verify. HTTP <code>https://councilof.ai/mcp</code> lists
        eleven tools: seven free readers (board_totals · get_axis · verify_card · list_cards ·
        get_root · get_card · verify_inclusion) and four x402-metered evidence tools. Published npm{" "}
        <code>csoai-gspc-mcp@0.2.1</code> lists twelve: the same eleven plus <code>witness_hash</code>,
        which is quarantined on the HTTP door. A package listing is not proof that a paid route will
        settle or deliver. Teach the live list. No 23rd axis. <code>/plugin</code> 301s here.
      </p>
      <p className="mt-4 font-mono text-sm text-emerald-900">{MCP_URL}</p>
      <pre className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-[13px] text-emerald-100">
        <code>{MCP_SNIPPET}</code>
      </pre>
      <button
        type="button"
        data-testid="copy-mcp-snippet"
        className="mt-3 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(MCP_SNIPPET);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? "Copied" : "Copy the snippet"}
      </button>
      <p className="mt-6 text-slate-700">
        A third party verifying a card is the signal.{" "}
        <a className="font-semibold text-emerald-800 underline" href="/gspc-verify">
          /gspc-verify
        </a>{" "}
        — paste a signed card; the browser recomputes Ed25519. Free. Not a certificate.
      </p>
      <ol className="mt-8 space-y-4">
        {HOSTS.map((h) => (
          <li key={h.name} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="font-semibold text-slate-900">{h.name}</div>
            <code className="mt-1 block text-[13px] text-slate-600">{h.how}</code>
          </li>
        ))}
      </ol>
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
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
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
        <pre className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-[13px] text-emerald-100">
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
        , free.
      </p>
      <div className="mt-12 border-t border-slate-200 pt-10">
        <InstallSurfaceCards />
      </div>
      <SignedAgentTravel />
      <TwoSpeed />
      <WatchlistPane />
    </main>
  );
}
