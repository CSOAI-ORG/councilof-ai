/**
 * HomeWaysIn — Ask, Connect, Verify, and a line for each of the five readers who arrive here.
 *
 * Moved out of the hero on 30 Sep 2026 so the first screen says one thing. Each door is a real,
 * working surface today: the chat on /dashboard, the connector hub at /connect/ (free MCP door,
 * full MCP, A2A card) and the in-browser verifier. No capability is named that its page does
 * not deliver. The data-testids are the ones the first screen used, pinned by ConnectHub.test.
 */
import { Link } from "wouter";

export const WAYS_IN: { testid: string; href: string; verb: string; title: string; body: string }[] = [
  {
    testid: "hero-cta-ask",
    href: "/dashboard",
    verb: "Ask",
    title: "Ask in plain words",
    body: "Each answer names the tool that produced it, the record it cites and the state it returned.",
  },
  {
    testid: "hero-cta-connect",
    href: "/connect/",
    verb: "Connect",
    title: "Connect your AI",
    body: "Add the free MCP server to Claude, Cursor or any MCP client, or read the A2A agent card. Your assistant can then read the board and check a card itself.",
  },
  {
    testid: "hero-cta-verify",
    href: "/gspc-verify",
    verb: "Verify",
    title: "Check a record yourself",
    body: "Paste a signed card and your own browser checks the signature. No account, free forever.",
  },
];

export const READERS: { who: string; line: string; href: string; cta: string; external?: boolean }[] = [
  {
    who: "Buying or deploying AI",
    line: "Compare dated results on the same frozen questions. Each record shows its attestation state; a tie does not establish a winner.",
    href: "/board/models",
    cta: "Models, axis by axis",
  },
  {
    who: "Publishing AI-generated content",
    line: "Check an image, video, audio file or PDF for a machine-readable mark. Open the evidence and its limits in the free preview.",
    href: "/dashboard/?tab=art50",
    cta: "Check an output for a mark",
  },
  {
    who: "Building with AI",
    line: "Call the board, fetch and verify cards from your own code or agent. Open source, no key for the free tools.",
    href: "/connect/",
    cta: "Developer doors",
  },
  {
    who: "Regulating or auditing",
    line: "Inspect the test, measurement date, source and attestation state behind a result. Gaps and corrections stay visible.",
    href: "/regulators",
    cta: "For regulators",
  },
  {
    who: "An AI agent",
    line: "Plain-language description at /llms.txt; agent card at /.well-known/agent.json; tools at POST /mcp.",
    href: "/llms.txt",
    cta: "Read llms.txt",
    external: true,
  },
];

export default function HomeWaysIn() {
  return (
    <section aria-labelledby="home-ways-h" className="surface-base section-y border-t border-border" data-testid="home-ways-in">
      <div className="section-shell">
        <p className="t-kicker text-emerald-800 dark:text-emerald-300">Start here</p>
        <h2 id="home-ways-h" className="t-band mt-3 max-w-3xl text-foreground">
          Ask it, connect it, or check it.
        </h2>
        <ul className="mt-9 grid list-none gap-4 p-0 md:grid-cols-3">
          {WAYS_IN.map((w, i) => (
            <li key={w.testid}>
              <Link
                href={w.href}
                data-testid={w.testid}
                className={
                  "group flex h-full flex-col rounded-2xl border p-5 transition sm:p-6 " +
                  (i === 0
                    ? "border-emerald-700 bg-emerald-800 text-white hover:bg-emerald-900"
                    : "border-border bg-card text-foreground hover:border-emerald-600/50 hover:shadow-[0_18px_40px_-34px_rgba(4,18,12,.5)]")
                }
              >
                <span className={"font-mono text-xs font-bold uppercase tracking-[0.16em] " + (i === 0 ? "text-emerald-100" : "text-emerald-800 dark:text-emerald-300")}>
                  {w.verb}
                </span>
                <span className="mt-1.5 text-lg font-black leading-snug">
                  {w.title} <span aria-hidden="true" className="inline-block transition group-hover:translate-x-0.5">→</span>
                </span>
                <span className={"mt-2 text-sm leading-relaxed " + (i === 0 ? "text-emerald-50" : "text-muted-foreground")}>{w.body}</span>
              </Link>
            </li>
          ))}
        </ul>

        <h3 className="mt-14 text-lg font-black tracking-tight text-foreground">Who it is for</h3>
        <ul className="mt-4 grid list-none gap-x-8 gap-y-6 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" data-testid="home-readers">
          {READERS.map((r) => (
            <li key={r.who} className="border-t border-border pt-4">
              <p className="text-[15px] font-bold text-foreground">{r.who}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.line}</p>
              {r.external ? (
                <a href={r.href} className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-emerald-800 underline underline-offset-4 dark:text-emerald-300">
                  {r.cta} →
                </a>
              ) : (
                <Link href={r.href} className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-emerald-800 underline underline-offset-4 dark:text-emerald-300">
                  {r.cta} →
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
