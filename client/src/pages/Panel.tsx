/**
 * /panel/ — the embeddable GSPC evidence panel, live against three real subjects, with the embed
 * code. The page loads the PUBLISHED bundle (/panel/gspc-panel.js, built by packages/gspc-panel),
 * so what a reader sees here is byte for byte what a host embeds.
 *
 * Doctrine: white-label the frame, never the evidence. Every panel carries its state, its signature
 * state and "Evidence by GSPC · Council of AI" with a verify link. No verdict, no ranking, no price.
 */
import { createElement, useEffect, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

const TITLE = "GSPC evidence panel: embed signed evidence | Council of AI";
const DESCRIPTION =
  "An embeddable panel that shows what Council of AI has measured about an MCP server, agent card, model or claim, with its signature checked in the browser.";

const SUBJECTS: { label: string; subject: string; why: string }[] = [
  { label: "Our own MCP server", subject: "https://councilof.ai/mcp", why: "Measured exactly like every other row." },
  {
    label: "A third-party MCP server",
    subject: "https://tandem.ac/mcp",
    why: "One of the servers in the effect-binding probe; its published capsule is read live.",
  },
  {
    label: "A signed model card",
    subject: "94b8831311c24df5e7d93e1f1dc989d24639bbe64abc4034a51d78a0306508e1",
    why: "llama3.2:3b on the governance axis. The signature is verified in your browser; the board's comparison on this axis is a tie.",
  },
];

const EMBED = `<script type="module" src="https://councilof.ai/panel/gspc-panel.js"></script>
<gspc-evidence-panel subject="https://example.com/mcp"></gspc-evidence-panel>`;

const THEME = `gspc-evidence-panel {
  --gspc-font: inherit;          /* frame only: font, colours, border, radius */
  --gspc-accent: #0066cc;
  --gspc-bg: #ffffff;
  --gspc-border: #d2d2d2;
  --gspc-radius: 4px;
}`;

const REACT = `import { GspcEvidencePanelReact } from "@csoai/gspc-panel/react";

<GspcEvidencePanelReact
  subject="https://example.com/mcp"
  theme={{ "--gspc-accent": "#0066cc" }}
  onModel={(m) => console.log(m.state)}
/>`;

const ACME = {
  assistantName: "Acme Assistant",
  theme: { "--gspc-accent": "#6d28d9", "--gspc-radius": "2px", "--gspc-font": "Georgia, serif" },
  connectors: { projectId: "demo-project", mcpServers: ["https://tandem.ac/mcp", "https://councilof.ai/mcp"], readOnly: true },
};

const WHITE_LABEL = `const panel = document.querySelector("gspc-evidence-panel");
panel.config = {
  assistantName: "Acme Assistant",                 // names the Ask box and its answers
  logoUrl: "https://acme.example/logo.svg",        // https only
  theme: { "--gspc-accent": "#6d28d9" },           // --gspc-* frame variables only
  locale: "en",
  hostContext: { product: "Acme Console" },        // never sent to councilof.ai
  connectors: {                                    // the customer's own, read-only by default
    projectId: "proj-42",
    mcpServers: ["https://mcp.acme.example/mcp"],
    agents: ["https://agents.acme.example/.well-known/agent-card.json"],
  },
};
// Any key that tries to hide, rename, restyle or relink the attribution
// (attribution, hideAttribution, poweredBy, verifyUrl, footer, --gspc-attribution-*)
// rejects the whole config; the panel says so and keeps its defaults.`;

const TRANSPORTS = `// Render from an AG-UI run on councilof.ai (POST /api/agui/run):
<gspc-evidence-panel subject="https://example.com/mcp" transport="agui"></gspc-evidence-panel>

// Emit the current panel as A2UI v0.9.1 (JSONL, basic catalog):
const messages = document.querySelector("gspc-evidence-panel").a2ui;

// Draw from an A2UI v0.9.1 description (only surfaces that carry GSPC evidence are accepted):
panel.renderA2ui(jsonlText);`;

function Code({ id, children }: { id: string; children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3">
      <pre id={id} className="overflow-x-auto rounded-md border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900">
        <code>{children}</code>
      </pre>
      <button
        type="button"
        aria-controls={id}
        onClick={() => {
          void navigator.clipboard?.writeText(children).then(() => setCopied(true), () => setCopied(false));
        }}
        className="mt-2 rounded-md border border-slate-700 px-3 py-1 text-sm font-semibold text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function Panel() {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    document.title = TITLE;
    setMetaDescription(DESCRIPTION);
    import(/* @vite-ignore */ "/panel/gspc-panel.js").then(
      () => setReady(true),
      () => setFailed(true),
    );
  }, []);

  return (
    <div data-testid="panel-page" className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <Link href="/" className="underline underline-offset-4">Home</Link> / Evidence panel
      </nav>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">GSPC evidence panel</h1>
      <p className="mt-4 text-slate-700">
        One small web component that shows what Council of AI has measured about a subject: an MCP server URL, an agent
        card URL, a model id, a signed card id or a claim-maintenance registry id. It reads councilof.ai and nothing else,
        checks signatures in the browser where the record allows it, and works under a strict Content Security Policy.
      </p>
      <p data-testid="doctrine" className="mt-4 rounded-md border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800">
        <strong className="font-semibold">White-label the frame, never the evidence.</strong> A host can restyle the
        panel and rename its assistant to match its console. It cannot remove the state, the signature state, or the line
        "Evidence by GSPC · Council of AI" with its verify link: a configuration that tries is rejected whole. An
        unmeasured subject shows no number. Measurement, not certification.
      </p>

      <section aria-labelledby="live-heading" className="mt-10">
        <h2 id="live-heading" className="text-xl font-bold text-slate-900">Live, against three real subjects</h2>
        {failed ? <p className="mt-3 text-slate-800">The panel bundle could not be loaded.</p> : null}
        <div className="mt-4 grid gap-8">
          {SUBJECTS.map((s) => (
            <div key={s.subject}>
              <h3 className="text-base font-semibold text-slate-900">{s.label}</h3>
              <p className="mt-1 text-sm text-slate-700">{s.why}</p>
              <div className="mt-3">{ready ? createElement("gspc-evidence-panel", { subject: s.subject }) : <p className="text-sm text-slate-600">Loading the panel…</p>}</div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="wl-heading" className="mt-12">
        <h2 id="wl-heading" className="text-xl font-bold text-slate-900">White-label example: Acme Assistant</h2>
        <p className="mt-2 text-slate-700">
          The same panel as a partner would ship it: renamed assistant, partner colours and font, and the customer's own
          servers listed read-only. The evidence, its signature state and the attribution are unchanged. Ask it something:
          "explain this evidence", "is this MCP server safe to use?", "connect GSPC to my project" or "watch it monthly".
          Answers come only from signed records and cite them; a request to watch a subject waits for your confirmation;
          every step the assistant takes inside the panel is listed, with Stop, Undo and Take over.
        </p>
        <div className="mt-4">
          {ready
            ? createElement("gspc-evidence-panel", {
                subject: "https://tandem.ac/mcp",
                ref: (el: (HTMLElement & { config?: unknown }) | null) => {
                  if (el && !el.getAttribute("data-configured")) {
                    el.config = ACME;
                    el.setAttribute("data-configured", "1");
                  }
                },
              })
            : <p className="text-sm text-slate-600">Loading the panel…</p>}
        </div>
        <Code id="embed-white-label">{WHITE_LABEL}</Code>
      </section>

      <section aria-labelledby="embed-heading" className="mt-12">
        <h2 id="embed-heading" className="text-xl font-bold text-slate-900">Embed it</h2>
        <p className="mt-2 text-slate-700">
          Two lines. The bundle is about 20 KB gzipped, has no dependencies, uses no eval and no inline script, and sends
          requests only to councilof.ai. Its SHA-256 is published beside it at{" "}
          <a className="underline underline-offset-4" href="/panel/gspc-panel.js.sha256">/panel/gspc-panel.js.sha256</a>.
        </p>
        <Code id="embed-html">{EMBED}</Code>
        <p className="mt-6 text-slate-700">
          If your page sends a Content Security Policy, allow <code>https://councilof.ai</code> in <code>script-src</code>{" "}
          and <code>connect-src</code>. Styles are applied through a constructed stylesheet, so no{" "}
          <code>unsafe-inline</code> is needed.
        </p>
        <h3 className="mt-8 text-base font-semibold text-slate-900">Theme the frame</h3>
        <Code id="embed-theme">{THEME}</Code>
        <h3 className="mt-8 text-base font-semibold text-slate-900">React</h3>
        <Code id="embed-react">{REACT}</Code>
        <h3 className="mt-8 text-base font-semibold text-slate-900">AG-UI and A2UI</h3>
        <p className="mt-2 text-slate-700">
          The panel renders from the AG-UI event stream councilof.ai already serves, and it emits and accepts A2UI v0.9.1,
          the version a2ui.org lists as the current release. A relayed A2UI panel says on its signature line that it was
          not re-checked by the page showing it.
        </p>
        <Code id="embed-transports">{TRANSPORTS}</Code>
      </section>

      <section aria-labelledby="what-heading" className="mt-12">
        <h2 id="what-heading" className="text-xl font-bold text-slate-900">What each panel shows</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
          <li>The subject's state: Measured, Unmeasured, Uncheckable, or Measured · tie. A tie stays a tie.</li>
          <li>When it was last measured and when it is next re-checked, or that no date is published.</li>
          <li>What the subject declares against what was observed.</li>
          <li>The signature state and where it was checked: in your browser, or by the councilof.ai verifier.</li>
          <li>Any correction that names the subject, and a citation you can copy.</li>
          <li>An Ask box: questions go to the same grounded assistant as Council OS; it acts only inside the panel, never on the page around it. A host console's own assistant can call GSPC as a tool through the MCP server at https://councilof.ai/mcp/free.</li>
        </ul>
        <p className="mt-4 text-slate-700">
          Wrappers for three host consoles are built and tested locally. None is published in any marketplace, and none
          implies a partnership. Source:{" "}
          <code>packages/gspc-panel</code> and <code>integrations/</code> in the councilof-ai repository (Apache-2.0).
          Check any record yourself at <Link href="/gspc-verify" className="underline underline-offset-4">/gspc-verify</Link>{" "}
          and <Link href="/verify-server" className="underline underline-offset-4">/verify-server</Link>.
        </p>
      </section>
    </div>
  );
}
