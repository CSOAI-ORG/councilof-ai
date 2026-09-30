/**
 * /connect — the one page a developer lands on to wire an agent or a client to Council of AI.
 *
 * WHY IT EXISTS (audit 2026-09-30 #1). /connect/ was the MCP/A2A setup journey and it rendered
 * "This legacy page is temporarily withdrawn." under a "Reference / archive" banner, while the
 * working guides (/connect/claude/, /connect-gspc/) were reachable only by their own URLs.
 *
 * WHAT IT MAY SAY. Only what the served surfaces do today:
 *   - the free door's tool list is read from functions/mcp/gspc-tools.json, the same file
 *     tools/list serves (via ConnectClaude's TOOLS), so no count or name is typed here;
 *   - the A2A endpoint and protocol version are the ones /.well-known/agent.json declares;
 *   - paid tools are described as returning an x402 challenge, never as "buying" a result.
 *   - the per-platform setup blocks come from distribution/connect/connect-matrix.json, rendered by
 *     scripts/harness-x/render.mjs from council-os/distribution.json; every block names only the two doors,
 *     and scripts/harness-x/connect-live.mjs checks each one against them (connect-live-check.json).
 * No price, no certification claim, no ranking.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { CLAUDE_CODE_CMD, CURSOR_JSON, FREE_DOOR, ONE_LINE, TOOLS } from "./ConnectClaude";
import { setMetaDescription } from "@/lib/utils";
import CONNECT_MATRIX from "../../../distribution/connect/connect-matrix.json";

type ConnectClient = {
  id: string;
  platform: string;
  group: string;
  door: "free" | "full";
  where: string;
  kind: string;
  snippet: string;
  docs: string;
  url: string;
};
export const PLATFORMS = (CONNECT_MATRIX as { clients: ConnectClient[] }).clients;
const GROUPS = [...new Set(PLATFORMS.map((c) => c.group))];

export const FULL_DOOR = "https://councilof.ai/mcp";
export const AGENT_CARD = "https://councilof.ai/.well-known/agent.json";
export const A2A_ENDPOINT = "https://councilof.ai/api/a2a";
export const VERIFY_OFFLINE = "curl -O https://councilof.ai/signed/verify-card.mjs && node verify-card.mjs --all";

function Code({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <button
          type="button"
          className="min-h-9 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:border-emerald-600/50"
          onClick={() => {
            void navigator.clipboard?.writeText(text).then(
              () => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1800);
              },
              () => setCopied(false),
            );
          }}
          aria-label={`Copy: ${label}`}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        tabIndex={0}
        className="mt-2 overflow-x-auto rounded-xl border border-[var(--ink-border)] bg-[var(--ink)] px-4 py-3 font-mono text-[13px] leading-6 text-[var(--ink-foreground)]"
      >
        <code>{text}</code>
      </pre>
      <span className="sr-only" aria-live="polite">
        {copied ? `${label} copied to the clipboard` : ""}
      </span>
    </div>
  );
}

function Door({
  id,
  kicker,
  title,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="card-quiet p-5 sm:p-7">
      <p className="t-kicker text-emerald-700">{kicker}</p>
      <h2 id={id} className="mt-2 text-xl font-black tracking-tight text-foreground sm:text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} className="font-semibold text-emerald-800 underline underline-offset-2 hover:decoration-2">
    {children}
  </a>
);

export default function ConnectHub() {
  useEffect(() => {
    document.title = "Connect an agent | Council of AI";
    setMetaDescription(
      "Connect Claude, ChatGPT, Cursor, VS Code, Copilot Studio, Gemini and other MCP or A2A clients to GSPC: copy-paste setup, the free read-only door, the full endpoint, the A2A agent card and an offline verifier.",
    );
  }, []);

  return (
    <div data-testid="connect-hub">
      <header className="surface-ink relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(90% 70% at 15% 0%, rgba(16,185,129,.20) 0%, transparent 60%)" }}
        />
        <div className="section-shell relative py-10 sm:py-16">
          <p className="t-kicker ink-kicker">Connect · MCP · A2A · HTTP</p>
          <h1 className="t-band mt-3 max-w-3xl text-white">Connect an agent or a client.</h1>
          <p className="t-lede mt-4 max-w-2xl ink-muted">
            Every door below reads the same published records the site shows: the live board, the signed
            cards, the corrections ledger. The free door needs no account and no key, and verification
            stays free.
          </p>
          <ul className="mt-6 flex list-none flex-wrap gap-2 p-0 text-sm font-semibold">
            {[
              ["#free", "Free MCP door"],
              ["#platforms", "GSPC in your platform"],
              ["#full", "Full MCP endpoint"],
              ["#a2a", "A2A agent card"],
              ["#http", "Plain HTTP"],
              ["#offline", "Verify offline"],
            ].map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  className="inline-flex min-h-10 items-center rounded-full border border-[var(--ink-border)] px-4 text-[var(--ink-foreground)] transition hover:border-[var(--ink-border-hover)] hover:bg-white/5"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="section-shell grid grid-cols-[minmax(0,1fr)] gap-5 py-10 sm:gap-6 sm:py-14">
        <div id="free" className="scroll-mt-24">
          <Door id="free-h" kicker="Start here" title="The free MCP door">
            <p className="t-body mt-3 max-w-3xl text-muted-foreground">
              A Streamable HTTP MCP server at <code className="font-mono text-foreground">{FREE_DOOR}</code>. Read-only
              tools, no sign-in, no key. It serves these {TOOLS.length} tools, read from the same file its{" "}
              <code className="font-mono">tools/list</code> answers from:
            </p>
            <ul className="mt-4 grid list-none gap-2 p-0 sm:grid-cols-2">
              {TOOLS.map((t) => (
                <li key={t.name} className="rounded-xl border border-border bg-background px-3.5 py-2.5">
                  <code className="font-mono text-[13px] font-bold text-emerald-800">{t.name}</code>
                  {ONE_LINE[t.name] ? <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{ONE_LINE[t.name]}</p> : null}
                </li>
              ))}
            </ul>
            <Code label="Claude Code" text={CLAUDE_CODE_CMD} />
            <Code label="Cursor (~/.cursor/mcp.json)" text={CURSOR_JSON} />
            <p className="t-body mt-4 text-muted-foreground">
              Claude Desktop, claude.ai and troubleshooting, step by step:{" "}
              <Link href="/connect/claude/" className="font-semibold text-emerald-800 underline underline-offset-2" data-testid="connect-hub-claude">
                the Claude and Cursor guide →
              </Link>
            </p>
          </Door>
        </div>

        <div id="platforms" className="scroll-mt-24">
          <Door id="platforms-h" kicker="Paste one address" title="GSPC in your platform">
            <p className="t-body mt-3 max-w-3xl text-muted-foreground">
              {PLATFORMS.length} clients take a pasted MCP address. Each block below is the exact text to paste; it names
              only <code className="font-mono text-foreground">{FREE_DOOR}</code> (read-only, no key) or{" "}
              <code className="font-mono text-foreground">{FULL_DOOR}</code> (the same tools plus metered evidence
              tools). Every address in these blocks was checked against the live server; the menus named in each
              block follow the vendor&apos;s own documentation, linked below it.
            </p>
            {GROUPS.map((group) => (
              <div key={group} className="mt-6">
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">{group}</h3>
                <div className="mt-2 grid grid-cols-[minmax(0,1fr)] gap-2">
                  {PLATFORMS.filter((c) => c.group === group).map((c) => (
                    <details
                      key={c.id}
                      id={`connect-${c.id}`}
                      className="group min-w-0 rounded-xl border border-border bg-background px-3.5 py-2.5"
                      data-testid={`connect-platform-${c.id}`}
                    >
                      <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-3 font-semibold text-foreground">
                        <span className="min-w-0">GSPC for {c.platform}</span>
                        <span className="shrink-0 text-xs font-medium text-muted-foreground">
                          {c.door === "free" ? "free door" : "full door"}
                        </span>
                      </summary>
                      <p className="mt-2 text-[13px] leading-snug text-muted-foreground [overflow-wrap:anywhere]">{c.where}</p>
                      <Code label={c.platform} text={c.snippet} />
                      <p className="mt-2 text-[13px] leading-snug text-muted-foreground">
                        Vendor documentation: <A href={c.docs}>{new URL(c.docs).host}</A>
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </Door>
        </div>

        <div id="full" className="scroll-mt-24">
          <Door id="full-h" kicker="Everything" title="The full MCP endpoint">
            <p className="t-body mt-3 max-w-3xl text-muted-foreground">
              <code className="font-mono text-foreground">{FULL_DOOR}</code> serves the same free tools plus metered ones.
              A metered tool called without payment answers with an x402 payment challenge that names its free
              equivalent; a challenge is not a charge, and nothing is paid unless your own wallet signs it. The
              doors and their free previews are listed in <A href="/.well-known/x402.json">/.well-known/x402.json</A>.
            </p>
            <p className="t-body mt-3 text-muted-foreground">
              Prefer a local stdio server? The npm package and its setup are on{" "}
              <Link href="/connect-gspc/" className="font-semibold text-emerald-800 underline underline-offset-2">
                the package page →
              </Link>
            </p>
          </Door>
        </div>

        <div id="a2a" className="scroll-mt-24">
          <Door id="a2a-h" kicker="Agent to agent" title="The A2A agent card">
            <p className="t-body mt-3 max-w-3xl text-muted-foreground">
              The agent card at <A href="/.well-known/agent.json">/.well-known/agent.json</A> declares a JSON-RPC
              interface at <code className="font-mono text-foreground">{A2A_ENDPOINT}</code> (A2A protocol 1.0) and lists
              the skills it answers. Send the <code className="font-mono">A2A-Version</code> header and address a
              skill the card lists; a request the card does not describe gets a JSON-RPC error, not a guess.
            </p>
          </Door>
        </div>

        <div id="http" className="scroll-mt-24">
          <Door id="http-h" kicker="No client needed" title="Plain HTTP reads">
            <ul className="mt-3 grid list-none gap-2 p-0 text-[15px] sm:grid-cols-2">
              {[
                ["/api/gspc", "The live board: every axis, its state and its run."],
                ["/signed/card_index.json", "The signed card index, one row per card."],
                ["/api/corrections", "The corrections ledger: what was wrong and what changed."],
                ["/llms.txt", "A plain-language description of the site for language models."],
              ].map(([href, what]) => (
                <li key={href} className="rounded-xl border border-border bg-background px-3.5 py-2.5">
                  <A href={href}>GET {href}</A>
                  <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{what}</p>
                </li>
              ))}
            </ul>
          </Door>
        </div>

        <div id="offline" className="scroll-mt-24">
          <Door id="offline-h" kicker="Trust nobody, including us" title="Verify every card offline">
            <p className="t-body mt-3 max-w-3xl text-muted-foreground">
              One file, no dependencies. It fetches the signed card index and checks every card&apos;s Ed25519
              signature on your machine, against the key pinned in the file, which is the key our{" "}
              <A href="/.well-known/did.json">DID document</A> publishes.
            </p>
            <Code label="Node 19 or later" text={VERIFY_OFFLINE} />
            <p className="t-body mt-4 text-muted-foreground">
              Or paste a single card into{" "}
              <Link href="/gspc-verify" className="font-semibold text-emerald-800 underline underline-offset-2">
                the in-browser verifier →
              </Link>
            </p>
          </Door>
        </div>

        <p className="text-[13px] leading-relaxed text-muted-foreground">
          We measure; we do not certify. A VALID signature says a record is ours and unaltered, not that what it
          measured is good. Questions: <A href="mailto:contact@csoai.org">contact@csoai.org</A>.
        </p>
      </div>
    </div>
  );
}
