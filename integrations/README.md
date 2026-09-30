# GSPC evidence panel: host wrappers

One core (`packages/gspc-panel`, a framework-free web component plus a React wrapper), many hosts.
Everything here is built and tested locally. **Nothing is published to any marketplace, and nothing
here implies a partnership with any vendor named.** Apache-2.0.

**Binding rule: white-label the frame, never the evidence.** A host can rename the assistant and
restyle the frame. Every card and every grounded answer still carries its state, its signature
state and **"Evidence by GSPC · Council of AI"** with a verify link. No compliance verdicts, no
"best" or "leader", UNMEASURED shown as such, no prices. MEOK is not part of this.

| Host | Directory | Status (30 Sep 2026) |
|---|---|---|
| Red Hat OpenShift console | `openshift-console-plugin/` | Dynamic plugin + Helm chart; namespace-only sandbox mode rendered to plain YAML and served locally by nginx against live councilof.ai. Not deployed: needs the owner's sandbox token (see its README). |
| CrowdStrike Falcon Foundry | `crowdstrike-foundry/` | App manifest + UI extension (detection, host and case sockets) + page. Built locally; standalone mode tested. Not deployed: needs the Foundry CLI with its own API scopes. |
| Splunk (Cisco) | `splunk-app/` | Minimal app: dashboard lists GSPC OCSF/ECS events and drives the panel from a row click. Config and XML validated; not run inside a Splunk instance. |
| Palantir Workshop | spec below | Spec only. |
| NVIDIA blueprint | spec below | Spec only. |

`node integrations/vendor-panel.mjs` copies the published bundle (`public/panel/gspc-panel.js`) into
every wrapper, byte for byte; `--check` fails on drift. `node --test integrations/integrations.test.mjs`
checks the wrappers.

## White-label configuration

```js
const panel = document.querySelector("gspc-evidence-panel");
panel.config = {
  assistantName: "Acme Assistant",                 // names the Ask box and its answers (1-40 chars)
  logoUrl: "https://acme.example/logo.svg",        // https only
  theme: { "--gspc-accent": "#6d28d9" },           // frame variables only: --gspc-font, -font-size, -mono,
                                                   //   -fg, -bg, -muted, -accent, -border, -radius, -code-bg
  locale: "en",                                    // BCP 47; sets lang. English strings ship today.
  hostContext: { product: "Acme Console" },        // opaque; rides on the panel's DOM events, never sent to councilof.ai
  connectors: {                                    // the customer's own context, READ-ONLY by default
    projectId: "proj-42",
    mcpServers: ["https://mcp.acme.example/mcp"],  // https URLs; listed in the panel, click to read evidence
    agents: ["https://agents.acme.example/.well-known/agent-card.json"],
    readOnly: true,
  },
};
```

Or as an attribute: `<gspc-evidence-panel config='{"assistantName":"Acme Assistant"}'>`.

**What config cannot do.** Any key that tries to hide, rename, restyle or relink the attribution
(`attribution`, `hideAttribution`, `attributionText`, `poweredBy`, `branding`, `footer`, `verifyUrl`,
a `--gspc-attribution-*` or `--gspc-footer-*` variable, an `assistantName` using "GSPC", "Council of
AI" or "Evidence by", a theme value carrying `;`, `{`, `url(`) makes the WHOLE config fail with
`GspcConfigError`. Nothing of it is applied; the panel shows "Host configuration rejected" and keeps
its defaults. The attribution block also has fixed colours, so frame variables cannot make it
invisible. Proof: `packages/gspc-panel/test/config.test.js` (fail-first, see `test/FAIL-FIRST.md`).

**Connectors** are read-only: the panel lists them and reads their public evidence when the person
picks one. Only the picked subject reaches councilof.ai. `readOnly: false` is accepted but grants no
write anywhere today; the only write the panel can make is the monthly watch request, and that
always needs a Confirm click.

## Ask GSPC (conversational)

The Ask box sends the question to councilof.ai's `POST /api/agui/run`, the same grounded router as
`/api/chat`, Council OS and the A2A text path, read with Council OS's own client
(`client/src/lib/aguiTalk.ts`, imported, not copied).

- An answer counts as an answer only when a tool result behind it carries a citation; it then shows
  the citations and its own attribution line with a verify link. Otherwise the panel says no signed
  record answered and shows the router's text as guidance.
- "Is this safe to use?" gets no verdict: the reply opens by saying GSPC does not rate safety.
- "Connect GSPC to my project" answers with exact steps (MCP URL, stdio command, OpenAPI, embed, Helm,
  pip for the Llama Stack provider).
- "Watch it monthly" fills a request form and **pauses at Confirm**. Only the click sends
  `POST /api/claims/watch-request` (recorded for a person to accept or decline; nothing is
  scheduled, measured, charged or published by it).
- Paid tools are never run from the panel. No `forwardedProps.confirm` is ever sent.

**Talk and watch it happen.** The panel declares AG-UI frontend tools in `RunAgentInput.tools`
(`open_subject`, `highlight_evidence`, `fill_watch_form`, `pause_at_confirm`) and plays each step
visibly in an activity list with **Stop**, **Undo** and **Take over**. councilof.ai's router does not
call frontend tools yet, so today the panel derives the same steps from the run's own tool results
and labels them "by panel". **These tools act only inside the panel's shadow root.** They never touch
the host console: no host DOM, navigation or API. A host that wants its own assistant to act in the
console should give that assistant GSPC as a tool: the MCP server `https://councilof.ai/mcp/free`
(streamable HTTP, no auth, read-only tools).

## Palantir Workshop (spec only)

- Docs: Workshop custom widgets, https://www.palantir.com/docs/foundry/custom-widgets/overview ;
  Iframe widget with bidirectional variables, https://www.palantir.com/docs/foundry/workshop/widgets-iframe ;
  package `@osdk/workshop-iframe-custom-widget`, https://github.com/palantir/workshop-iframe-custom-widget .
- Shape: a custom widget set whose one widget mounts `<gspc-evidence-panel>`. Inputs: a Workshop string
  variable `gspcSubject` (bound to the selected object's endpoint URL or model id) and an optional
  object `gspcConfig` (the white-label config above). Output: a Workshop event `gspcModel` carrying the
  panel model's state, signature state and citation (from the `gspc-panel:model` DOM event), so a
  Workshop action can store the citation on the object. Evidence stays read-only.
- Needs: a Foundry enrolment with custom widgets enabled; the widget set's network policy (egress)
  allowing `https://councilof.ai`; a developer to build the widget set with the Palantir CLI. None of
  these exist for us today. UNMEASURED: whether Workshop's widget CSP permits the panel's constructed
  stylesheet.

## NVIDIA blueprint (spec only)

- Docs: NVIDIA AI Blueprints, https://github.com/NVIDIA-AI-Blueprints ; Safety for Agentic AI,
  https://github.com/NVIDIA-AI-Blueprints/safety-for-agentic-ai ; AI-Q integration,
  https://docs.nvidia.com/aiq-blueprint/latest/integration/index.html .
- Shape: (1) register the GSPC MCP server `https://councilof.ai/mcp/free` in the blueprint agent's MCP
  tool registry, read-only tools only, so the agent can call `server_evidence`, `verify_card` and
  `mcp_trust` on the servers it is about to use; (2) mount `<gspc-evidence-panel>` in the blueprint's
  web UI beside each tool/server the agent lists; (3) for the evaluation stage, our Llama Stack
  `remote::csoai` provider (`packages/llama-stack-provider-csoai`) or `nat-csoai-evidence` returns
  evidence states, never a score.
- Needs: a running blueprint deployment (GPU/NIM access), its UI source to add the element, and an MCP
  allow-list entry. Not built; no NVIDIA account was used.

## Owner steps (in order)

1. **OpenShift sandbox (first):** `openshift-console-plugin/README.md` → "Deploy to the Developer Sandbox".
2. **Falcon Foundry:** `crowdstrike-foundry/README.md` → "Owner steps".
3. **Splunk:** `splunk-app/README.md` → "Install".
