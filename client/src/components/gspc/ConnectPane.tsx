/**
 * ConnectPane — Connect → Install, inside the workspace. It reuses the /connect data, never its own:
 *   - the free door, the one-line commands and the tool list come from pages/ConnectClaude
 *     (TOOLS is functions/mcp/gspc-tools.json, the file tools/list serves);
 *   - the per-platform snippets come from pages/ConnectHub PLATFORMS
 *     (distribution/connect/connect-matrix.json, rendered from council-os/distribution.json);
 *   - the A2A card and endpoint are ConnectHub's constants.
 * So the pane cannot name a tool or a door /connect does not. No price, no count typed.
 *
 * ONE claude.ai PATH (tools audit retest, 6 Oct 2026). The pane used to print its own
 * "Settings → Connectors" label above the matrix's "Customize → Connectors" row, so a reader saw two
 * paths. The claude.ai / Claude Desktop line now reads the matrix's claude-app row (the same
 * words /connect/claude gives, checked against Anthropic's help page), and that row is not
 * repeated in the list under it.
 */
import { useState } from "react";
import { Link } from "wouter";
import { CLAUDE_CODE_CMD, CURSOR_JSON, FREE_DOOR, ONE_LINE, TOOLS } from "@/pages/ConnectClaude";
import NextSteps from "./NextSteps";
import { A2A_ENDPOINT, AGENT_CARD, FULL_DOOR, PLATFORMS, VERIFY_OFFLINE } from "@/pages/ConnectHub";

/** The click path in plain size; a trailing "(… owners: …) — checked …" note in small print under it. */
function WhereLine({ where, testId }: { where: string; testId?: string }) {
  const m = where.match(/^(.*?)\s*(\(.*)$/);
  const path = m ? m[1] : where;
  const note = m ? m[2] : null;
  return (
    <p className="mt-0.5 break-words text-sm leading-snug text-foreground" data-testid={testId}>
      {path}
      {note ? <span className="mt-0.5 block text-xs text-muted-foreground">{note}</span> : null}
    </p>
  );
}

function CopyLine({ label, text, testId, where }: { label: string; text: string; testId?: string; where?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="min-w-0" data-testid={testId}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          {where ? <WhereLine where={where} testId={testId ? `${testId}-where` : undefined} /> : null}
        </div>
        <button
          type="button"
          aria-label={`Copy: ${label}`}
          className="min-h-9 shrink-0 whitespace-nowrap rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:border-emerald-600/50 motion-reduce:transition-none"
          onClick={() => {
            void navigator.clipboard?.writeText(text).then(
              () => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1800);
              },
              () => setCopied(false),
            );
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mt-2 overflow-x-auto rounded-xl bg-[#04120c] p-3 font-mono text-xs leading-relaxed text-emerald-50">
        <code>{text}</code>
      </pre>
    </div>
  );
}

const DOORS: { name: string; url: string; what: string }[] = [
  { name: "MCP, free door", url: FREE_DOOR, what: "Read-only tools, no sign-in, no key. The default install." },
  { name: "MCP, full door", url: FULL_DOOR, what: "The same free tools plus the paid tools, which answer with an x402 challenge until a wallet pays." },
  { name: "A2A agent card", url: AGENT_CARD, what: `Skills over A2A JSON-RPC at ${A2A_ENDPOINT}.` },
  { name: "AG-UI", url: "https://councilof.ai/api/agui/run", what: "POST a message; an event stream of tool calls, results and text. Paid tools need an explicit confirm." },
  { name: "A2UI", url: "https://councilof.ai/api/a2ui", what: "Board card and verify result as A2UI v0.9.1 surfaces (v1.0 Candidate on request)." },
];

/** The clients that already have their own copy line above; the list below does not repeat them. */
const CLAUDE_APP = PLATFORMS.find((p) => p.id === "claude-app");
const SHOWN_ABOVE = new Set(["claude-app", "claude-code", "cursor"]);
const OTHER_CLIENTS = PLATFORMS.filter((p) => !SHOWN_ABOVE.has(p.id));

export default function ConnectPane() {
  const [group, setGroup] = useState<string>("");
  const groups = [...new Set(OTHER_CLIENTS.map((p) => p.group))];
  const shown = group ? OTHER_CLIENTS.filter((p) => p.group === group) : OTHER_CLIENTS.slice(0, 6);
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-8" data-testid="connect-pane">
      <p className="t-kicker text-emerald-800">Connect · Install</p>
      <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">Add Council of AI to your AI assistant</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Your assistant can then look up what we have measured and check any result, using the same published records this
        workspace shows. Free, with no account and no key.
      </p>

      <div className="mt-6 grid gap-4 rounded-3xl border border-emerald-950/10 bg-card p-5 sm:p-6 lg:grid-cols-2">
        {CLAUDE_APP ? (
          <CopyLine label={CLAUDE_APP.platform} where={CLAUDE_APP.where} text={CLAUDE_APP.url} testId="connect-pane-connector" />
        ) : null}
        <CopyLine label="Claude Code" text={CLAUDE_CODE_CMD} testId="connect-pane-claude" />
        <CopyLine label="Cursor (~/.cursor/mcp.json)" text={CURSOR_JSON} testId="connect-pane-cursor" />
        <CopyLine label="Check every signed card offline" text={VERIFY_OFFLINE} />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Any other client</p>
          <label htmlFor="connect-group" className="sr-only">
            Choose a client group
          </label>
          <select
            id="connect-group"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          >
            <option value="">Six more clients</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <ul className="mt-2 list-none space-y-1 p-0 text-sm">
            {shown.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold">{p.platform}</span>
                <span className="text-xs text-muted-foreground">
                  {p.where} · {p.door} door
                </span>
              </li>
            ))}
          </ul>
          <Link href="/connect/" className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-emerald-800 underline underline-offset-4">
            Every client's exact snippet on /connect →
          </Link>
        </div>
      </div>

      <details className="group mt-8 rounded-2xl border border-border bg-card" data-testid="connect-developers">
        <summary className="flex min-h-12 cursor-pointer list-none items-center px-4 text-sm font-semibold text-foreground">
          For developers: every door and the tool list
        </summary>
        <div className="border-t border-border p-4">
      <h3 className="text-lg font-black tracking-tight text-foreground">The doors</h3>
      <ul className="mt-3 grid list-none gap-3 p-0 sm:grid-cols-2">
        {DOORS.map((d) => (
          <li key={d.name} className="min-w-0 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-bold text-foreground">{d.name}</p>
            <p className="mt-1 break-all font-mono text-xs text-emerald-900">{d.url}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d.what}</p>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-lg font-black tracking-tight text-foreground">
        The free tools <span className="font-normal text-muted-foreground">(read from the file tools/list serves)</span>
      </h3>
      <ul className="mt-3 grid list-none gap-2 p-0 sm:grid-cols-2" data-testid="connect-pane-tools">
        {TOOLS.map((t) => (
          <li key={t.name} className="min-w-0 rounded-xl border border-border bg-card px-3 py-2">
            <code className="font-mono text-xs font-bold text-emerald-900">{t.name}</code>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{ONE_LINE[t.name] ?? t.title ?? ""}</p>
          </li>
        ))}
      </ul>
        </div>
      </details>
      <NextSteps
        testId="connect-next"
        steps={[
          { href: "/agents/", title: "Read the agent guide", body: "Every door, tool, skill and paid door, rendered from the machine files." },
          { href: "/dashboard?tab=route", title: "Try GSPC Route", body: "Decide-only routing over the published measurements; TIE stays TIE." },
          { href: "/dashboard?tab=home", title: "Ask a first question", body: "“What does the board say?” The answer names the tool and the record." },
        ]}
      />
    </div>
  );
}
