/**
 * /agents/ — how an agent uses GSPC, in one human-readable page (lane gspc-product-ui, 30 Sep 2026).
 *
 * WHY IT IS GENERATED, NOT WRITTEN. The page renders the machine files themselves, so it cannot
 * drift from them:
 *   - the doors: every entry of /.well-known/ai-catalog.json (AI Catalog 1.0), in its own order;
 *   - the MCP tools: functions/mcp/gspc-tools.json, the file tools/list serves (via ConnectClaude);
 *   - the A2A skills and interfaces: /.well-known/agent-card.json;
 *   - the A2UI versions: GET /api/a2ui (the descriptor);
 *   - the paid doors: /.well-known/x402.json resources, by URL and description only. Amounts live
 *     only inside a 402 challenge and are never printed here.
 * Everything but the tool list is read at load; the prerender bakes that read into the HTML so a
 * crawler or a no-JS reader sees the same bytes. agents-page.test.ts holds the page to this: no
 * endpoint URL is typed in this file except the machine-file paths it reads.
 *
 * It replaced a 2026 archive page ("Everyone shipped one agent. We designed a Council.") that named
 * competitors, described an unbuilt 33-seat council and wore the "Reference / archive" banner.
 */
import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { TOOLS, ONE_LINE } from "./ConnectClaude";
import { useLiveJson, type LiveRead } from "@/components/gspc/useLiveJson";
import { setMetaDescription } from "@/lib/utils";
import DocMeta from "@/components/docs/DocMeta";

type Json = Record<string, unknown>;

/** The machine files this page renders. The only URLs typed here. */
export const AGENT_MACHINE_FILES = {
  catalog: "/.well-known/ai-catalog.json",
  agentCard: "/.well-known/agent-card.json",
  a2ui: "/api/a2ui",
  x402: "/.well-known/x402.json",
  llms: "/llms.txt",
  did: "/.well-known/did.json",
  openapi: "/openapi.json",
} as const;

const rec = (v: unknown): Json | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/** ai-catalog entries → rows. Exported for the test. */
export function catalogRows(doc: unknown): { id: string; name: string; type: string; url: string; description: string | null; tags: string[] }[] {
  const entries = rec(doc)?.entries;
  if (!Array.isArray(entries)) return [];
  // An entry carries its target as `url`, or inline as `data` (AI Catalog 1.0); data.endpoint is then the door.
  const target = (e: Json) => str(e.url) ?? str(rec(e.data)?.endpoint);
  return entries
    .map((e) => rec(e))
    .filter((e): e is Json => Boolean(e && target(e)))
    .map((e) => {
      const data = rec(e.data);
      const method = str(data?.method);
      return {
        id: String(e.identifier ?? target(e)),
        name: str(e.displayName) ?? String(e.identifier ?? target(e)).split(":").slice(-2).join(" · "),
        type: method ? `${method} · ${str(e.type) ?? "application/json"}` : str(e.type) ?? "application/json",
        url: String(target(e)),
        description: str(e.description) ?? ([str(data?.output), str(data?.note)].filter(Boolean).join(" ") || null),
        tags: Array.isArray(e.tags) ? e.tags.map(String) : [],
      };
    });
}

/** agent-card skills → rows (id, name, first sentence). */
export function skillRows(card: unknown): { id: string; name: string; line: string }[] {
  const skills = rec(card)?.skills;
  if (!Array.isArray(skills)) return [];
  return skills
    .map((s) => rec(s))
    .filter((s): s is Json => Boolean(s && str(s.id)))
    .map((s) => {
      const d = str(s.description) ?? "";
      const first = d.split(/(?<=[.!?])\s/)[0] ?? "";
      return { id: String(s.id), name: str(s.name) ?? String(s.id), line: first.length > 220 ? `${first.slice(0, 217)}…` : first };
    });
}

/** x402.json resources → method, URL and first sentence. No amount is ever read out. */
export function paidDoorRows(doc: unknown): { method: string; url: string; line: string }[] {
  const res = rec(doc)?.resources;
  if (!Array.isArray(res)) return [];
  return res
    .map((r) => rec(r))
    .filter((r): r is Json => Boolean(r && str(r.url)))
    .map((r) => {
      const d = str(r.description) ?? "";
      const first = d.split(/(?<=[.!?])\s/)[0] ?? "";
      return { method: str(r.method) ?? "GET", url: String(r.url), line: first.length > 200 ? `${first.slice(0, 197)}…` : first };
    });
}

function Loading({ what }: { what: string }) {
  return (
    <p role="status" aria-live="polite" className="mt-4 text-sm text-muted-foreground">
      Reading {what}…
    </p>
  );
}

function Unread({ what, url, error }: { what: string; url: string; error: string | null }) {
  return (
    <p className="mt-4 rounded-2xl border border-amber-500/60 bg-amber-50 p-4 text-sm text-amber-950">
      {what} is unread right now{error ? ` (${error})` : ""}. Nothing is shown in its place.{" "}
      <a className="font-bold underline underline-offset-2" href={url}>
        Read {url} directly
      </a>
      .
    </p>
  );
}

function FromFile<T>({ read, what, url, children }: { read: LiveRead<T>; what: string; url: string; children: (d: T) => ReactNode }) {
  if (read.state === "loading") return <Loading what={what} />;
  if (read.state === "error") return <Unread what={what} url={url} error={read.error} />;
  return <>{children(read.data)}</>;
}

function Section({ id, kicker, title, source, children }: { id: string; kicker: string; title: string; source: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20 border-t border-border py-10 sm:py-12">
      <p className="t-kicker text-emerald-800">{kicker}</p>
      <h2 id={`${id}-h`} className="mt-2 text-2xl font-black tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Rendered from <a className="font-mono font-semibold text-emerald-800 underline underline-offset-2" href={source}>{source}</a>
      </p>
      {children}
    </section>
  );
}

const STEPS: { n: string; title: string; body: string; href: string }[] = [
  { n: "1", title: "Discover", body: "Read the AI catalog, or llms.txt. Every door below is listed there.", href: AGENT_MACHINE_FILES.catalog },
  { n: "2", title: "Connect", body: "Add the free MCP door, or send A2A SendMessage, or POST to AG-UI.", href: "#doors" },
  { n: "3", title: "Ask", body: "board_totals, get_axis, server_evidence… Quote totals.public_count with its separation line.", href: "#mcp" },
  { n: "4", title: "Verify", body: "verify_card recomputes a card's hash and signature. Free forever.", href: "#mcp" },
  { n: "5", title: "Pay, only if you choose", body: "Paid tools answer with an x402 challenge. Nothing is paid without your wallet.", href: "#x402" },
];

export default function Agents() {
  useEffect(() => {
    document.title = "For agents: how an agent uses GSPC | Council of AI";
    setMetaDescription(
      "How an AI agent uses GSPC: the MCP doors and tools, the A2A agent card and skills, AG-UI and A2UI, and the x402 paid doors, rendered from the machine files themselves.",
    );
  }, []);
  const catalog = useLiveJson(AGENT_MACHINE_FILES.catalog);
  const card = useLiveJson(AGENT_MACHINE_FILES.agentCard);
  const a2ui = useLiveJson(AGENT_MACHINE_FILES.a2ui);
  const x402 = useLiveJson(AGENT_MACHINE_FILES.x402);

  return (
    <div className="bg-[var(--surface-canvas,#fafaf7)]" data-testid="agents-page">
      <section className="relative isolate overflow-hidden bg-[#04120c]" aria-labelledby="agents-h">
        <picture>
          <source media="(max-width: 1023.98px)" srcSet="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
          <source type="image/webp" srcSet="/images/home/plugin-800.webp 800w, /images/home/plugin-1100.webp 1100w" sizes="50vw" />
          <img
            src="/images/home/plugin-800.webp"
            alt=""
            aria-hidden="true"
            width={800}
            height={430}
            decoding="async"
            className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover opacity-70 lg:block"
          />
        </picture>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(90% 90% at 12% 0%, rgba(16,185,129,.22) 0%, transparent 60%), linear-gradient(90deg, rgba(4,18,12,1) 0%, rgba(4,18,12,.96) 50%, rgba(4,18,12,.55) 100%)" }}
        />
        <div className="section-shell relative z-10 py-12 sm:py-16">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">For agents · MCP · A2A · AG-UI · A2UI · x402</p>
          <h1 id="agents-h" className="mt-4 max-w-2xl font-black tracking-[-0.03em] text-white" style={{ fontSize: "clamp(1.9rem, 1rem + 3vw, 3.2rem)", lineHeight: 1.05 }}>
            How an agent uses GSPC
          </h1>
          <div className="max-w-3xl"><DocMeta updated="2026-09-30" slug="agents" /></div>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-emerald-50/90 sm:text-lg">
            The same answers people get, over the protocol your agent speaks. This page is rendered from the machine files, so it
            says exactly what they say.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href="#doors" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-400 px-6 text-base font-black text-[#03110b] transition hover:bg-emerald-300 motion-reduce:transition-none">
              See every door ↓
            </a>
            <Link href="/connect/" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-300/50 px-6 text-base font-bold text-emerald-50 transition hover:border-emerald-300 hover:bg-emerald-400/10 motion-reduce:transition-none">
              Install in a client
            </Link>
          </div>
        </div>
      </section>

      <div className="section-shell">
        <ol className="grid list-none gap-3 p-0 py-10 sm:grid-cols-2 lg:grid-cols-5" aria-label="How an agent uses GSPC, in five steps">
          {STEPS.map((s) => (
            <li key={s.n} className="min-w-0 rounded-2xl border border-emerald-950/10 bg-card p-4">
              <a href={s.href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
                <span className="font-mono text-xs font-bold text-emerald-800">{s.n}</span>
                <span className="mt-1 block text-base font-black text-foreground">{s.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{s.body}</span>
              </a>
            </li>
          ))}
        </ol>

        <Section id="doors" kicker="Discover" title="Every door, from the AI catalog" source={AGENT_MACHINE_FILES.catalog}>
          <FromFile read={catalog} what="The AI catalog" url={AGENT_MACHINE_FILES.catalog}>
            {(d) => {
              const rows = catalogRows(d);
              return rows.length ? (
                <ul className="mt-5 grid list-none gap-3 p-0 md:grid-cols-2" data-testid="agents-doors">
                  {rows.map((r) => (
                    <li key={r.id} className="min-w-0 rounded-2xl border border-border bg-card p-4">
                      <p className="text-sm font-bold text-foreground">{r.name}</p>
                      <a href={r.url} className="mt-1 block break-all font-mono text-xs text-emerald-900 underline underline-offset-2">
                        {r.url}
                      </a>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{r.type}</p>
                      {r.description ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.description}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <Unread what="The catalog's entries list" url={AGENT_MACHINE_FILES.catalog} error="no entries" />
              );
            }}
          </FromFile>
        </Section>

        <Section id="mcp" kicker="MCP" title={`The free tools (${TOOLS.length}), from the file tools/list serves`} source="/mcp/free">
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Streamable HTTP, no sign-in, no key. The full door <code className="font-mono">/mcp</code> serves the same tools plus the paid ones.
            Quote <code className="font-mono">totals.public_count</code> with its separation line, never a number from memory.
          </p>
          <ul className="mt-5 grid list-none gap-2 p-0 sm:grid-cols-2" data-testid="agents-tools">
            {TOOLS.map((t) => (
              <li key={t.name} className="min-w-0 rounded-xl border border-border bg-card px-3 py-2">
                <code className="font-mono text-xs font-bold text-emerald-900">{t.name}</code>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{ONE_LINE[t.name] ?? t.title ?? ""}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="a2a" kicker="A2A" title="The agent card and its skills" source={AGENT_MACHINE_FILES.agentCard}>
          <FromFile read={card} what="The agent card" url={AGENT_MACHINE_FILES.agentCard}>
            {(d) => {
              const skills = skillRows(d);
              const ifaces = Array.isArray(rec(d)?.supportedInterfaces) ? (rec(d)!.supportedInterfaces as Json[]) : [];
              return (
                <>
                  {ifaces.length ? (
                    <ul className="mt-4 list-none space-y-1 p-0 text-sm">
                      {ifaces.map((i, k) => (
                        <li key={k} className="break-all font-mono text-xs text-foreground">
                          {String(i.protocolBinding ?? i.transport ?? "binding")} · {String(i.url ?? "")}
                          {i.protocolVersion ? ` · A2A ${String(i.protocolVersion)}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <ul className="mt-4 grid list-none gap-2 p-0 sm:grid-cols-2" data-testid="agents-skills">
                    {skills.map((s) => (
                      <li key={s.id} className="min-w-0 rounded-xl border border-border bg-card px-3 py-2">
                        <p className="text-sm font-bold text-foreground">
                          {s.name} <code className="font-mono text-xs font-normal text-muted-foreground">{s.id}</code>
                        </p>
                        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{s.line}</p>
                      </li>
                    ))}
                  </ul>
                </>
              );
            }}
          </FromFile>
        </Section>

        <Section id="ag-ui" kicker="AG-UI · A2UI" title="Streams for a user interface" source={AGENT_MACHINE_FILES.a2ui}>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            POST a message to the AG-UI run endpoint listed above and read an event stream: tool call start, arguments, result, then
            the text. A paid tool is never called without an explicit confirm. For a board or verify result the stream also carries
            an A2UI surface (a CUSTOM event named <code className="font-mono">a2ui</code>).
          </p>
          <FromFile read={a2ui} what="The A2UI descriptor" url={AGENT_MACHINE_FILES.a2ui}>
            {(d) => {
              const versions = rec(rec(d)?.versions);
              const supported = Array.isArray(versions?.supported) ? (versions!.supported as Json[]) : [];
              const surfaces = rec(rec(d)?.surfaces) ?? {};
              return (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <ul className="list-none space-y-2 p-0">
                    {supported.map((v) => (
                      <li key={String(v.version)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
                        <span className="font-mono font-bold">A2UI {String(v.version)}</span> · {String(v.status)}{" "}
                        <a href={String(v.spec)} className="text-emerald-800 underline underline-offset-2">
                          spec
                        </a>
                      </li>
                    ))}
                  </ul>
                  <ul className="list-none space-y-1 p-0">
                    {Object.entries(surfaces).map(([k, v]) => (
                      <li key={k} className="break-all font-mono text-xs">
                        <span className="font-bold text-foreground">{k}</span> · {String(v)}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }}
          </FromFile>
        </Section>

        <Section id="x402" kicker="x402" title="Paid doors, and what stays free" source={AGENT_MACHINE_FILES.x402}>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Reading and verifying are free. A paid door answers with a 402 challenge; the amount lives only in that challenge, and a
            challenge is not a payment. Your wallet decides.
          </p>
          <FromFile read={x402} what="The x402 resource list" url={AGENT_MACHINE_FILES.x402}>
            {(d) => {
              const rows = paidDoorRows(d);
              return (
                <ul className="mt-4 list-none divide-y divide-border rounded-2xl border border-border bg-card p-0" data-testid="agents-x402">
                  {rows.slice(0, 12).map((r) => (
                    <li key={r.method + r.url} className="px-4 py-3">
                      <p className="break-all font-mono text-xs font-bold text-foreground">
                        {r.method} {r.url}
                      </p>
                      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{r.line}</p>
                    </li>
                  ))}
                  {rows.length > 12 ? (
                    <li className="px-4 py-3 text-xs text-muted-foreground">
                      and {rows.length - 12} more in{" "}
                      <a className="font-mono underline" href={AGENT_MACHINE_FILES.x402}>
                        {AGENT_MACHINE_FILES.x402}
                      </a>
                    </li>
                  ) : null}
                </ul>
              );
            }}
          </FromFile>
        </Section>

        <Section id="rules" kicker="Rules" title="What every answer means" source={AGENT_MACHINE_FILES.llms}>
          <ul className="mt-4 grid list-none gap-3 p-0 text-sm leading-relaxed text-muted-foreground md:grid-cols-2">
            <li className="rounded-2xl border border-border bg-card p-4">
              <span className="font-bold text-foreground">Measurement, not certification.</span> A result covers what was probed, when, and
              nothing wider. There is no mark or grade to buy.
            </li>
            <li className="rounded-2xl border border-border bg-card p-4">
              <span className="font-bold text-foreground">UNMEASURED is an answer.</span> An empty cell stays empty, a tie stays a tie, and an
              untested axis stays untested.
            </li>
            <li className="rounded-2xl border border-border bg-card p-4">
              <span className="font-bold text-foreground">Check it yourself.</span> Keys are in{" "}
              <a className="font-mono text-emerald-800 underline" href={AGENT_MACHINE_FILES.did}>
                did.json
              </a>
              ; <code className="font-mono">verify_card</code> is free forever.
            </li>
            <li className="rounded-2xl border border-border bg-card p-4">
              <span className="font-bold text-foreground">Mistakes are public.</span> Every correction is in the ledger at{" "}
              <Link className="text-emerald-800 underline" href="/corrections/">
                /corrections/
              </Link>
              .
            </li>
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            Machine files:{" "}
            {Object.values(AGENT_MACHINE_FILES).map((u, i) => (
              <span key={u}>
                {i ? " · " : ""}
                <a className="font-mono text-xs text-emerald-800 underline underline-offset-2" href={u}>
                  {u}
                </a>
              </span>
            ))}
          </p>
        </Section>
      </div>
    </div>
  );
}
