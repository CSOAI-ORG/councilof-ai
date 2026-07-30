import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  CheckCircle2,
  Shield,
  Globe,
  Zap,
  Mail,
  FileText,
  BarChart3,
  Bell,
  ArrowRight,
  Newspaper,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Competitor Radar",
    description: "Tracks 15+ direct competitors: Credo AI, Vanta, Drata, OneTrust, Holistic AI, and more.",
  },
  {
    icon: Globe,
    title: "Regulatory Alerts",
    description: "EU AI Act, NIST, UK AI Bill, TC260, AIDA — new guidance, enforcement, and fines.",
  },
  {
    icon: BarChart3,
    title: "Pricing Intelligence",
    description: "Price changes, new tiers, and discount campaigns across the AI governance market.",
  },
  {
    icon: Zap,
    title: "Product Tracker",
    description: "New features, integrations, partnerships, and funding rounds in real-time.",
  },
  {
    icon: Bell,
    title: "MCP Marketplace Moves",
    description: "New MCP servers, registry additions, verified badges, and marketplace shifts.",
  },
  {
    icon: FileText,
    title: "Domain Deep-Dives",
    description: "Monthly focus on one of 28 domains. Healthcare, finance, energy, space, and more.",
  },
];

const tiers = [
  {
    name: "Horus Brief",
    price: "£49",
    period: "/month",
    description: "Weekly intelligence brief for AI governance professionals.",
    features: [
      "Weekly email brief (Mon 08:00 UTC)",
      "Dashboard archive access",
      "Competitor radar",
      "Regulatory alerts",
      "Pricing intelligence",
    ],
    cta: "Subscribe",
    highlighted: false,
  },
  {
    name: "Horus Pro",
    price: "£199",
    period: "/month",
    description: "Everything in Brief + API access, custom alerts, and quarterly reports.",
    features: [
      "Everything in Brief",
      "REST API access",
      "Custom competitor alerts",
      "Quarterly deep-dive report",
      "Priority support",
    ],
    cta: "Subscribe",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "£999",
    period: "/month",
    description: "White-label briefs, dedicated analyst, and Slack integration.",
    features: [
      "Everything in Pro",
      "White-label briefs",
      "Dedicated analyst",
      "Slack integration",
      "Custom data sources",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const sampleSections = [
  {
    title: "The Week's Big Move",
    preview: "Credo AI raises $15M Series B — validates the market, but opens the door for CSOAI. Their pricing is enterprise-only (demo-gated). CSOAI's £3.5K self-serve is 5-10x cheaper.",
  },
  {
    title: "Pricing Intelligence",
    preview: "Vanta dropped their AI module from $12K/yr to $8K/yr (33% cut). Likely response to Drata's $6K/yr competitive pricing. CSOAI's positioning is still 2x cheaper.",
  },
  {
    title: "Regulatory Pulse",
    preview: "Italy's DPA issued a €5M preliminary fine to an AI recruitment platform. Key precedent: ANY HR tool using AI scoring qualifies as 'high-risk' under Annex III.",
  },
  {
    title: "The Number",
    preview: "73% — of enterprises using AI governance tools in 2026 will switch vendors within 18 months (Gartner). The market is fluid. First-mover trust matters.",
  },
];

export default function HorusIntel() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-950 py-24">
          <div className="container max-w-4xl space-y-4">
            <Skeleton className="h-8 w-32 bg-white/10" />
            <Skeleton className="h-16 w-full bg-white/10" />
          </div>
        </div>
        <div className="container py-20">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-950 text-gray-900 dark:text-white py-24">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-4 text-emerald-700 border-emerald-300 bg-emerald-50/50">
            <Newspaper className="w-3 h-3 mr-1" /> Weekly Intelligence
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Horus Intel Brief
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            What your competitors don't want you to know. Delivered weekly.
            <br />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              28 domains · 280 data sources · 5-minute read
            </span>
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
              <a href="https://proofof.ai/horus" target="_blank" rel="noopener noreferrer">
                Subscribe — £49/mo
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50" asChild>
              <Link href="/press">
                Read Latest Brief
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-16">

        {/* What It Is */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Competitive Intelligence as a Service
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Horus monitors the AI governance, compliance, and safety landscape across 28 industry domains.
            It uses CSOAI's ingestion engine (280 sources, $0 cost) to track competitor moves, regulatory changes,
            pricing shifts, and product launches — then distills it into a 5-minute readable brief.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((f) => (
              <Card
                key={f.title}
                className="p-6 text-left border border-emerald-100 hover:border-emerald-300 transition-colors"
              >
                <f.icon className="w-6 h-6 mb-3 text-emerald-600" />
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Sample Preview */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-emerald-500 rounded-full inline-block" />
            Sample Brief — June 21, 2026
          </h2>
          <div className="space-y-4">
            {sampleSections.map((section) => (
              <Card
                key={section.title}
                className="p-6 border border-gray-200 hover:border-emerald-300 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{section.title}</h3>
                <p className="text-gray-600 text-sm">{section.preview}</p>
              </Card>
            ))}
          </div>
          <div className="text-center mt-6">
            <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50" asChild>
              <a href="/horus/sample" target="_blank" rel="noopener noreferrer">
                Read Full Sample Brief
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={`p-6 ${
                  tier.highlighted
                    ? "border-2 border-emerald-500 shadow-lg"
                    : "border border-gray-200"
                }`}
              >
                {tier.highlighted && (
                  <Badge className="mb-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    Most Popular
                  </Badge>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-bold text-emerald-700">{tier.price}</span>
                  <span className="text-gray-500">{tier.period}</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{tier.description}</p>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    tier.highlighted
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  }`}
                  variant={tier.highlighted ? "default" : "outline"}
                  asChild
                >
                  <a href="https://proofof.ai/horus" target="_blank" rel="noopener noreferrer">
                    {tier.cta}
                  </a>
                </Button>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            Annual billing: 15% discount (£499/yr for Brief). Cancel anytime.
          </p>
        </div>

        /* Comparison */
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why Horus?
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-700">Product</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Price</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Focus</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Our Edge</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100">
                  <td className="p-3 text-gray-900">CB Insights</td>
                  <td className="p-3 text-gray-600">$30K+/yr</td>
                  <td className="p-3 text-gray-600">General tech</td>
                  <td className="p-3 text-emerald-700">Horus is AI governance only, 100x cheaper</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="p-3 text-gray-900">Gartner Research</td>
                  <td className="p-3 text-gray-600">$50K+/yr</td>
                  <td className="p-3 text-gray-600">Enterprise</td>
                  <td className="p-3 text-emerald-700">Real-time, weekly, actionable</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="p-3 text-gray-900">Crunchbase Pro</td>
                  <td className="p-3 text-gray-600">$99/mo</td>
                  <td className="p-3 text-gray-600">Funding</td>
                  <td className="p-3 text-emerald-700">Includes regulatory + product intel</td>
                </tr>
                <tr className="border-t border-gray-100 bg-emerald-50">
                  <td className="p-3 font-semibold text-emerald-900">Horus Intel Brief</td>
                  <td className="p-3 font-semibold text-emerald-900">£49/mo</td>
                  <td className="p-3 font-semibold text-emerald-900">AI governance</td>
                  <td className="p-3 font-semibold text-emerald-900">Only product in this niche</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            <Card className="p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-1">How is this different from a newsletter?</h3>
              <p className="text-sm text-gray-600">
                Newsletters report news. Horus analyzes competitive intelligence — what competitors are doing,
                why it matters, and what you should do about it. It's actionable intelligence, not reporting.
              </p>
            </Card>
            <Card className="p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-1">Where does the data come from?</h3>
              <p className="text-sm text-gray-600">
                CSOAI's 28-domain ingestion engine monitors 280 open data sources — regulatory databases,
                funding trackers, competitor websites, MCP registries, and more. All sources are free and publicly available.
              </p>
            </Card>
            <Card className="p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-1">Can I get a sample before subscribing?</h3>
              <p className="text-sm text-gray-600">
                Yes. The sample brief above is a real edition from June 21, 2026. We also offer a 7-day free trial
                for the Pro tier. No credit card required.
              </p>
            </Card>
            <Card className="p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-1">What's the cancellation policy?</h3>
              <p className="text-sm text-gray-600">
                Cancel anytime. No contracts, no penalties. Your access continues until the end of the current billing period.
              </p>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="p-8 border border-emerald-200 bg-emerald-50/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Start receiving intelligence this Monday
            </h2>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              Join 50+ beta subscribers getting weekly AI governance intelligence before the market moves.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                <a href="https://proofof.ai/horus" target="_blank" rel="noopener noreferrer">
                  <Mail className="w-4 h-4 mr-2" />
                  Subscribe — £49/mo
                </a>
              </Button>
              <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50" asChild>
                <a href="mailto:intel@meok.ai">
                  Contact Sales
                </a>
              </Button>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
