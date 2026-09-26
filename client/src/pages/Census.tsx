/**
 * /census — what the CSOAI-census crawler does, so an operator who finds our user agent in a log
 * can read it. The UA is `CSOAI-census/0.1 (+https://councilof.ai/census)`; until 2026-09-26 that
 * URL answered 404.
 *
 * Behaviour stated here is the behaviour of scripts/census/mcp-remote-probe.py and
 * scripts/census/frame.py in the census lane: public GETs plus MCP discovery (initialize,
 * tools/list), never a tool call; HostGate keeps one connection per host and >= 1.0 s between
 * request starts to a host; robots.txt is honoured for the product token CSOAI-census.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import PlainEmail from "@/components/PlainEmail";

const UA = "CSOAI-census/0.1 (+https://councilof.ai/census)";

const DATASETS: { id: string; what: string }[] = [
  { id: "csoai/mcp-remote-census", what: "remote MCP endpoints: did initialize answer, and what tools/list returned" },
  { id: "csoai/hf-mcp-spaces-census", what: "Hugging Face Spaces that declare an MCP server" },
  { id: "csoai/a2a-card-census", what: "published A2A agent cards, and whether their signatures verify" },
];

export default function Census() {
  useEffect(() => {
    document.title = "The CSOAI-census crawler | Council of AI";
    setMetaDescription(
      "What the CSOAI-census crawler does (public GETs and MCP discovery, never a tool call), the datasets it feeds, and how to ask for a re-check or opt out.",
    );
  }, []);

  return (
    <div data-testid="census-page" className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/">Home</Link> › <span>Census crawler</span>
      </nav>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">The CSOAI-census crawler</h1>
      <p className="mt-4 text-slate-700">
        If you found <code className="break-all">{UA}</code> in a log, it was us: Council of AI (CSOAI Ltd, UK Companies
        House 16939677).
      </p>

      <h2 className="mt-10 text-xl font-bold text-slate-900">What it does</h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-slate-700">
        <li>Public GET requests, and MCP discovery only: <code>initialize</code> and <code>tools/list</code>.</li>
        <li>It never calls a tool, never authenticates and never pays.</li>
        <li>At most one request per second to any host, over one connection per host.</li>
        <li>It reads robots.txt and obeys rules for the product token <code>CSOAI-census</code>.</li>
        <li>It backs off on 429 and 503, honouring Retry-After, and retries once at most.</li>
      </ul>

      <h2 className="mt-10 text-xl font-bold text-slate-900">What it feeds</h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-slate-700">
        {DATASETS.map((d) => (
          <li key={d.id}>
            <a className="underline underline-offset-4" href={`https://huggingface.co/datasets/${d.id}`} rel="noopener noreferrer">
              {d.id}
            </a>{" "}
            — {d.what}
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-xl font-bold text-slate-900">Contact</h2>
      <p className="mt-3 text-slate-700">
        Write to <PlainEmail className="underline underline-offset-4" subject="CSOAI-census" />.
      </p>
      {/* OWNER: no response-time promise is published here. Decide whether to state one, and only
          if it is measured. */}

      <h2 className="mt-10 text-xl font-bold text-slate-900">Ask for a re-check</h2>
      <p className="mt-3 text-slate-700">
        If a row about your endpoint is wrong or out of date, email the endpoint URL with "re-check" in the subject.
        The next run reads it again, and the dataset row is replaced by what that run observed.
      </p>

      <h2 className="mt-10 text-xl font-bold text-slate-900">Object or opt out</h2>
      <p className="mt-3 text-slate-700">
        Email the endpoint or host you want excluded. It goes on an exclusion list that the next run honours, and
        your objection is recorded. You can also disallow <code>CSOAI-census</code> in your robots.txt, which the
        crawler reads before it sends anything else.
      </p>
    </div>
  );
}
