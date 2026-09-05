import { Download, ExternalLink, PlugZap, Puzzle } from "lucide-react";

export const EXTENSION_SOURCE_URL =
  "https://github.com/CSOAI-ORG/council-of-ai/tree/master/extensions/chrome-gspc-verify";

const cards = [
  {
    id: "web-app",
    icon: Download,
    title: "Council OS web app",
    state: "Browser-gated install",
    copy:
      "Use the account menu when your browser offers Install Council OS. If that option is absent, keep using the website; no native App Store package is published.",
    href: "/dashboard?tab=home",
    action: "Open Council OS",
    external: false,
  },
  {
    id: "mcp",
    icon: PlugZap,
    title: "AI platform connector",
    state: "Live MCP endpoint",
    copy:
      "Connect Claude, Cursor and other supported clients to the same public MCP endpoint. Capabilities are discovered with tools/list, not frozen in this page.",
    href: "/connect-gspc",
    action: "Choose your client",
    external: false,
  },
  {
    id: "browser-extension",
    icon: Puzzle,
    title: "GSPC browser verifier",
    state: "Source available · unpacked only",
    copy:
      "The Chrome MV3 source adds a badge on Hugging Face model pages and verifies pasted cards locally. It is not published in the Chrome Web Store and does not claim OpenRouter or Replicate support.",
    href: EXTENSION_SOURCE_URL,
    action: "Load-unpacked instructions",
    external: true,
  },
] as const;

export default function InstallSurfaceCards() {
  return (
    <section id="install-surfaces" aria-labelledby="install-surfaces-title">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
          Install and connect
        </p>
        <h2
          id="install-surfaces-title"
          className="mt-2 text-2xl font-semibold tracking-tight text-foreground"
        >
          One evidence service, three honest entry points.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The website, MCP connector and development extension all read the
          Council of AI evidence surfaces. Availability differs, so each door
          states its real release status.
        </p>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.id}
              data-install-surface={card.id}
              className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="rounded-full border border-border bg-muted/60 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  {card.state}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                {card.title}
              </h3>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                {card.copy}
              </p>
              <a
                href={card.href}
                target={card.external ? "_blank" : undefined}
                rel={card.external ? "noreferrer noopener" : undefined}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:underline"
              >
                {card.action}
                {card.external ? (
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                ) : null}
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
