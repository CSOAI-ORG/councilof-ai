import { useEffect, useState } from "react";
import SignedAgentTravel from "@/components/SignedAgentTravel";
import TwoSpeed from "@/components/TwoSpeed";
import WatchlistPane from "@/components/WatchlistPane";
import { setMetaDescription } from "@/lib/utils";

const MCP_URL = "https://councilof.ai/mcp";
const MCP_SNIPPET = `{
  "mcpServers": {
    "gspc": {
      "url": "${MCP_URL}"
    }
  }
}`;

// The three badge states a model/agent card may carry (P0.5 / A5). There is no
// "GSPC certified" and there is no gold badge — measurement, not certification.
const BADGE_SPEC = [
  {
    badge: "GSPC listed",
    colour: "#9ca3af",
    swatch: "bg-gray-400",
    word: "grey",
    when: "The id is in the hub-queue / catalog census. DISCOVERED — listed, not graded.",
  },
  {
    badge: "GSPC unmeasured",
    colour: "#ca8a04",
    swatch: "bg-amber-600",
    word: "amber",
    when: "Named on the board or queue with no VALID card behind it. The gap stays visible.",
  },
  {
    badge: "GSPC measured",
    colour: "#0B1F33",
    swatch: "bg-[#0B1F33]",
    word: "navy",
    when: "A VALID card sha + a verify URL exist. The only state a measurement claim may wear.",
  },
] as const;

const MODEL_CARD_BLOCK = `[![GSPC](https://councilof.ai/badge/gspc.svg)](https://councilof.ai/gspc-scoreboard)
This model is **DISCOVERED** in the CSOAI hub census unless a verify link is present.
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
      "Council OS for people already in Claude, Cursor, Kimi, or Grok. Seven tools at https://councilof.ai/mcp (four GSPC + three public-root three-state). Measurement, never certification.",
    );
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16" data-testid="tools-mcp">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">
        Use this in Claude / Cursor / Kimi / Grok
      </h1>
      <p className="mt-3 text-slate-600">
        Ask: board totals. Paste a card to verify. Seven tools:
        board_totals · get_axis · verify_card · list_cards · get_root · get_card · verify_inclusion.
        HTTP <code>https://councilof.ai/mcp</code> lists and runs seven. Stdio source
        <code>mcp/gspc-server</code> wires the same seven. Published npm{" "}
        <code>csoai-gspc-mcp@0.1.0</code> is still four until owner <code>npm publish</code> 0.1.1.
        Teach the live list. No 23rd axis. <code>/plugin</code> 301s here.
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
          The three badges — and the two that do not exist
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          A model or agent card may wear exactly one of these three states. There is no{" "}
          <em>“GSPC certified”</em> and there is no gold badge — we measure, we never certify. The
          badge image is live from the board’s own arrays, so the count in it cannot drift from{" "}
          <a className="font-medium text-emerald-800 hover:underline" href="/api/gspc">GET /api/gspc</a>.
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
          Badge endpoints: <code>https://councilof.ai/badge/gspc.svg</code> (SVG, live board count) ·{" "}
          <code>/api/badge?format=shields</code> (shields.io endpoint JSON —{" "}
          <code>schemaVersion/label/message/color</code> — same derivation as the board, so a README
          badge can never freeze a count).
        </p>

        <h3 className="mt-8 text-base font-bold text-slate-900">
          Model-card block — copy-paste for maintainers who opt in
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          DISCOVERED means listed, not graded. Add this to your own README if you want the live
          badge; nobody is PR-bombed with it.
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
      <SignedAgentTravel />
      <TwoSpeed />
      <WatchlistPane />
    </main>
  );
}
