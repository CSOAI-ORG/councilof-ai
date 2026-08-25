/**
 * NewHome-v3 — councilof.ai Homepage
 * Ownership restore: Indices declared UNMEASURED must stay on this surface.
 */
import { useEffect, useState, type ReactNode } from "react";
import EnterpriseTrust from "../components/EnterpriseTrust";
import RegionBanner from "../components/RegionBanner";
import {
  countOf, fetchAxes, hasInterval, publicCaption, quotable, wilson,
  type Axis, type InLaneAxis,
} from "../lib/gspcAxes";
import FaqBlock from "@/components/FaqBlock";
import StoryWorld from "@/components/home/StoryWorld";
import GovernanceStackStrip from "@/components/home/GovernanceStackStrip";
import { POSITIONING } from "@/lib/positioning";
import LivingStages from "@/components/home/LivingStages";
import { LAYER0_LINKS, LAYER0_INFRA, openLayer0InLobby } from "@/lib/layer0Links";
import {
  Shield, Users, Building2,
  Zap, ChevronRight, BarChart3, Gamepad2,
  Eye, FileCheck, RefreshCw, Ban, Landmark, Scale,
} from "lucide-react";

const FOUR_BUYERS = [
  { icon: Shield, who: "Insurers", tagline: "Price AI risk on measured evidence", cta: "Start measuring", href: "/insurers", desc: "Underwrite AI deployment policies with measurement cards. Empty cells stay empty. Verify at GET councilof.ai/api/gspc." },
  { icon: Building2, who: "Regulators", tagline: "Check behaviour against the law", cta: "Crosswalk your framework", href: "/regulators", desc: "Map any AI regulation to a deterministic instrument set — every provision traceable." },
  { icon: Users, who: "Enterprises", tagline: "Prove your AI before you ship", cta: "Get measured", href: "/enterprise", desc: "Sign, ship, re-attest. No model in the verdict path." },
  { icon: Zap, who: "Developers", tagline: "Measure per call on the agent rail", cta: "Verify a card", href: "/gspc-verify", desc: "Call the signed measurement tools from CI. Counts stay on GET /api/gspc." },
];

function Section({ id, title, subtitle, children, bg }: { id?: string; title?: string; subtitle?: string; children: ReactNode; bg?: string }) {
  return (
    <section id={id} className={`py-20 px-6 ${bg ?? ""}`}>
      <div className="mx-auto max-w-6xl">
        {title && <h2 className="text-3xl font-extrabold text-center text-gray-900 sm:text-4xl">{title}</h2>}
        {subtitle && <p className="mt-3 text-center text-lg text-gray-500 max-w-2xl mx-auto">{subtitle}</p>}
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

const USPS = [
  { icon: FileCheck, title: "Signed measurement card", body: "Ed25519-signed, 3KB. Verify stays free and loginless. A grade is never sold.", href: "/assess" },
  { icon: Eye, title: "Anyone can check", body: "The verify path is public. We do not put it behind an account or a fee.", href: "/gspc-verify" },
  { icon: Scale, title: "Honest living board", body: "Empty cells stay empty. Live counts: GET /api/gspc.", href: "/gspc-scoreboard" },
  { icon: Ban, title: "Indices declared UNMEASURED", body: "AI-economy · human-labour · humanoid-labour — named empty first. Contextual firewall, never fused into GSPC grades.", href: "/indices" },
  { icon: Gamepad2, title: "Council Space", body: "The live contest. Model versus model. Every round is evidence.", href: "/gspc-arena" },
  { icon: Landmark, title: "Council City", body: "The living layer. Districts emit the same signed atom.", href: "/gspc-arena?view=towns" },
  { icon: RefreshCw, title: "Re-attest, never edit", body: "A new signed record. History stays. Drift is visible.", href: "/methodology" },
  { icon: Shield, title: "Measurement credential", body: "Not a certification. We measure, sign, and keep the evidence.", href: "/gspc-verify" },
];

function UspGrid() {
  return (
    <Section id="usps" title="What you actually get" subtitle="Measure, sign, live contest, living layer. The scoreboard is how people cite it." bg="bg-gray-50">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {USPS.map(u => (
          <a key={u.title} href={u.href} className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-lg hover:border-emerald-200 transition-all">
            <u.icon className="w-8 h-8 text-emerald-500 mb-3" />
            <h3 className="text-base font-extrabold text-gray-900 group-hover:text-emerald-600">{u.title}</h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed flex-1">{u.body}</p>
          </a>
        ))}
      </div>
    </Section>
  );
}

function AxesGrid() {
  const [axes, setAxes] = useState<Axis[]>([]);
  const [subtitle, setSubtitle] = useState("GSPC slots — counts live on GET /api/gspc.");
  useEffect(() => {
    const ac = new AbortController();
    fetchAxes(ac.signal).then((r) => {
      const c = countOf(r.axes);
      setAxes(r.axes);
      setSubtitle(`${publicCaption(r.publicCount, c.measured, c.total)}. Empty cells stay empty.`);
    });
    return () => ac.abort();
  }, []);
  return (
    <Section title="The GSPC measurement slots" subtitle={subtitle} bg="bg-white">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {axes.map(a => {
          const q = quotable(a);
          const ci = hasInterval(a) ? wilson(a.accuracy, a.n) : null;
          const href = a.dataset ? `https://huggingface.co/datasets/${a.dataset}` : "/gspc-scoreboard";
          return (
            <a key={a.axis} href={href} className="group rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-lg hover:border-emerald-200 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-800">{a.bench}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${q ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{a.status}</span>
              </div>
              <h3 className="text-base font-extrabold text-gray-900 group-hover:text-emerald-600">{a.axis}</h3>
              {q && (
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-500">{(a.accuracy * 100).toFixed(0)}</span>
                  <span className="text-[11px] text-gray-400">n={a.n}{ci ? ` · [${(ci[0]*100).toFixed(0)}–${(ci[1]*100).toFixed(0)}%]` : ""}</span>
                </div>
              )}
              {!q && <div className="mt-3 text-xs text-gray-400 italic">no score on this stamp</div>}
            </a>
          );
        })}
      </div>
      <div className="mt-8 text-center">
        <a href="/gspc-scoreboard" className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:underline">
          <BarChart3 className="w-4 h-4" /> Open the live scoreboard — counts from GET /api/gspc
        </a>
      </div>
    </Section>
  );
}

function BuyerCards() {
  return (
    <Section title="Built for the people who get audited" subtitle="One instrument, four audiences." bg="bg-gray-50">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FOUR_BUYERS.map(b => (
          <a key={b.who} href={b.href} className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-lg hover:border-emerald-200 transition-all">
            <b.icon className="w-8 h-8 text-emerald-500 mb-3" />
            <h3 className="text-lg font-extrabold text-gray-900">{b.who}</h3>
            <p className="mt-1 text-sm font-semibold text-emerald-600">{b.tagline}</p>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed flex-1">{b.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-600">{b.cta} <ChevronRight className="w-3 h-3" /></span>
          </a>
        ))}
      </div>
    </Section>
  );
}

const HOME_FAQ = [
  { q: "What is Council of AI?", a: "An independent measurement body for AI behaviour. We run systems against frozen instruments, sign results with Ed25519, and publish empties as UNMEASURED." },
  { q: "Why is a slot ever left UNMEASURED?", a: "Because inventing a number is worse than an empty cell. UNMEASURED is disclosure about us, not a failing grade for the system." },
  { q: "What about labour / AI-economy indices?", a: "Indices declared UNMEASURED first — AI-economy · human-labour · humanoid-labour. Contextual firewall; never fused into GSPC. See /indices and GET /api/indices." },
];

export default function NewHomeV3() {
  return (
    <main>
      <StoryWorld />
      <GovernanceStackStrip />
      <div className="border-b border-gray-100" />
      <UspGrid />
      <div className="border-b border-gray-100" />
      <BuyerCards />
      <div className="border-b border-gray-100" />
      <AxesGrid />
      <LivingStages />
      <EnterpriseTrust />
      <RegionBanner />
      <FaqBlock title="Questions people ask" intro="Plain-English answers. UNMEASURED stays empty until INDEX-METHOD." items={HOME_FAQ} />
      <div className="mx-auto max-w-6xl px-6 pb-12 text-center text-sm text-gray-500">
        Layer0: {LAYER0_LINKS.map(l => l.label).join(" · ")} · {POSITIONING.subhead} · infra {LAYER0_INFRA.length} · openLayer0InLobby ready
      </div>
    </main>
  );
}
