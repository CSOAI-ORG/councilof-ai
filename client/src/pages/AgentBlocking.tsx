import { useEffect } from "react";
import { setMetaDescription } from "@/lib/utils";

/**
 * /agent-blocking — What changed when Cloudflare started blocking mixed-use AI crawlers.
 *
 * Factual explainer. Cloudflare's Bot Preference Sync (Aug 21, 2026) and the July 1, 2026
 * AI bot policy categories mean site owners can now block, allow, or disallow AI traffic
 * by category (Search, Agent, Training). Mixed-use crawlers that blend all three behind a
 * single user agent are blocked by default on ad-supported sites unless they meet
 * transparency requirements. This page explains what changed, what it means for agents,
 * and how signed identity helps.
 *
 * Sources cited: Cloudflare blog posts (CC BY-NC 4.0 where noted).
 * This is a CSOAI editorial page, not a Cloudflare endorsement.
 */

export default function AgentBlocking() {
  useEffect(() => {
    document.title = "Agent traffic and Cloudflare's blocking change | Council of AI";
    setMetaDescription(
      "Cloudflare now blocks mixed-use AI crawlers by default on ad-supported sites. " +
      "What changed, what it means for agents, and how signed identity helps. " +
      "Measurement, not certification."
    );
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-600">
        Council of AI — agent infrastructure
      </p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
        What changed when Cloudflare started blocking AI agents
      </h1>
      <p className="mt-4 text-slate-600">
        In 2026, Cloudflare introduced tools that let site owners control AI traffic by
        category — Search, Agent, and Training. Mixed-use crawlers that blend all three
        behind a single user agent are now blocked by default on ad-supported sites unless
        they meet transparency requirements. This page explains what happened and why
        signed agent identity matters.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">What changed</h2>
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900">July 1, 2026 — AI bot policy categories</h3>
            <p className="mt-2 text-sm text-slate-600">
              Cloudflare launched three separate controls for AI traffic: <strong>Search</strong> (crawlers
              that index content for search engines), <strong>Agent</strong> (crawlers that act on behalf of
              users), and <strong>Training</strong> (crawlers that collect content for model training). Site
              owners can allow, block, or disallow each category independently.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Source:{" "}
              <a className="text-emerald-700 underline" href="https://blog.cloudflare.com/bot-preference-sync/">
                Cloudflare blog, Aug 21, 2026
              </a>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900">August 21, 2026 — Bot Preference Sync</h3>
            <p className="mt-2 text-sm text-slate-600">
              A new feature that automatically syncs a site's robots.txt with the AI bot policies
              configured in the Cloudflare dashboard. For new customers, Bot Preference Sync is{" "}
              <strong>on by default</strong>. For ad-supported sites, Training defaults to Disallow.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Source:{" "}
              <a className="text-emerald-700 underline" href="https://blog.cloudflare.com/bot-preference-sync/">
                "Say it once: Introducing Bot Preference Sync"
              </a>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900">The transparency requirement</h3>
            <p className="mt-2 text-sm text-slate-600">
              Mixed-use crawlers that blend Search, Agent, and Training behind a single user agent
              must provide transparency to avoid being blocked. Specifically, they must:
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-600 space-y-1">
              <li>Respect a "no training" preference in robots.txt</li>
              <li>Give site owners a way to opt out of AI summaries</li>
              <li>Provide URL-level visibility into which pages were used for training vs search</li>
              <li>Show publicly that disallowing training does not hurt traditional search results</li>
            </ul>
            <p className="mt-2 text-sm text-slate-600">
              Crawlers that don't meet these requirements are <strong>blocked by default</strong> when
              a site owner sets "Disallow Training." Transparency is the price of admission.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">What it means for agents</h2>
        <p className="mt-3 text-slate-600">
          Agent traffic is being reclassified at the network layer. A legitimate agent that
          fetches data on behalf of a user looks identical to a training crawler unless it
          can prove its identity and purpose. The three categories (Search, Agent, Training)
          create a new classification layer, and agents that can't demonstrate which category
          they belong to get blocked with the training crawlers.
        </p>
        <p className="mt-3 text-slate-600">
          This is not a hypothetical. Cloudflare's{" "}
          <a className="text-emerald-700 underline" href="https://radar.cloudflare.com/ai-insights#ai-bot-transparency">
            AI Bot Transparency tracker
          </a>{" "}
          on Radar publicly shows which bots meet the transparency requirements and which don't.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">How signed identity helps</h2>
        <p className="mt-3 text-slate-600">
          An agent that carries a signed, verifiable identity card — whether through{" "}
          <a className="text-emerald-700 underline" href="https://councilof.ai/.well-known/agent.json">
            A2A agent cards
          </a>,{" "}
          <a className="text-emerald-700 underline" href="https://eips.ethereum.org/EIPS/eip-8004">
            ERC-8004 on-chain registration
          </a>, or{" "}
          <a className="text-emerald-700 underline" href="https://datatracker.ietf.org/doc/draft-templeman-scitt-framing-space/">
            SCITT-anchored logs
          </a>{" "}
          — can distinguish itself from anonymous crawlers. The identity card says who the agent
          is, what it does, and who signed the claim. A site owner or network layer can verify
          the signature without asking the agent's operator.
        </p>
        <p className="mt-3 text-slate-600">
          This is the same principle as the GSPC measurement board: a signed artifact that
          anyone can verify without asking us. The difference is that the artifact describes
          the agent itself, not a measurement result.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">The numbers</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-2xl font-black text-slate-900">566,916</div>
            <p className="mt-1 text-sm text-slate-500">
              agents registered on ERC-8004 across 24 chains (Sep 11, 2026). New-cohort median
              trust: "Elevated Risk" (Chainaware).
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Source: Chainaware, Sep 11, 2026
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-2xl font-black text-slate-900">3 categories</div>
            <p className="mt-1 text-sm text-slate-500">
              Search, Agent, Training — the new classification layer. Agents that can't
              demonstrate their category get blocked with training crawlers.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Source: Cloudflare, Jul 1, 2026
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-bold text-slate-900">Our position</h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          We measure agent behaviour, we don't certify agents. An agent that carries a signed
          measurement card has demonstrated something about its behaviour on a frozen instrument.
          That is evidence, not a certificate. Cloudflare's blocking change makes signed identity
          more valuable — not because we sell it, but because it's the mechanism that lets
          legitimate measured agents distinguish themselves from anonymous crawlers.
        </p>
        <p className="mt-3 text-xs text-slate-400">
          This page is a CSOAI editorial act. Cloudflare does not endorse this page.
          Sources: Cloudflare blog (blog.cloudflare.com), Cloudflare Radar (radar.cloudflare.com).
        </p>
      </section>
    </main>
  );
}
