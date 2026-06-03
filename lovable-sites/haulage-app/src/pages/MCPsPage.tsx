import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Equipment from "@/components/Equipment";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Server, Shield } from "lucide-react";
import { proStripeUrl, proPriceAmount, proPricePeriod, enterprisePriceAmount, enterprisePricePeriod } from "@/data/mcps";

const MCPsPage = () => {
  return (
    <>
      <SEO
        title="9 Trade Compliance MCPs | Haulage.app"
        description="Nine PyPI-published MCP servers for UK trades. DVSA, NRSWA, CHAS, CPCS, CPA, ISO 19650, waste-carrier, LOLER. All MIT-licensed, all return signed compliance attestations."
        canonical="https://haulage.app/mcps"
      />

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-12">
          <div className="container mx-auto px-6">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" />
              Back to Haulage.app
            </Link>

            <div className="max-w-3xl mb-12">
              <span className="text-primary font-display uppercase tracking-wider text-sm">The MCP Catalogue</span>
              <h1 className="font-display text-5xl md:text-6xl font-bold mt-4 mb-6">
                Nine <span className="text-gradient">Compliance</span> MCPs
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Each server is single-purpose, MIT-licensed, and published to PyPI. Call any tool from
                Claude Desktop, an Agent SDK app, or curl. Every response can be signed by{" "}
                <a href="https://meok-attestation-api.vercel.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  meok-attestation-api
                </a>{" "}
                so you have an audit trail.
              </p>
            </div>

            {/* Pricing tiers */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              <div className="card-industrial p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <Server className="w-6 h-6 text-primary" />
                  <h3 className="font-display text-xl font-bold">Starter</h3>
                </div>
                <div className="font-display text-4xl font-bold mb-2">
                  £29<span className="text-base text-muted-foreground">/mo</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">One MCP. Signed attestations. Email support.</p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6 flex-grow">
                  <li>› Single MCP of your choice</li>
                  <li>› Signed compliance receipts</li>
                  <li>› 1,000 tool calls / month</li>
                </ul>
                <Button variant="outline" size="lg" className="w-full" asChild>
                  <a href="#mcps">
                    Pick an MCP below
                  </a>
                </Button>
              </div>

              <div className="card-industrial p-6 border-primary flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <Package className="w-6 h-6 text-primary" />
                  <h3 className="font-display text-xl font-bold">Pro</h3>
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">RECOMMENDED</span>
                </div>
                <div className="font-display text-4xl font-bold mb-2">
                  {proPriceAmount}
                  <span className="text-base text-muted-foreground">/{proPricePeriod}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">All nine MCPs + the SaaS umbrella access.</p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6 flex-grow">
                  <li>› All 9 MCPs unlocked</li>
                  <li>› muckaway.ai / planthire.ai / grabhire.ai access</li>
                  <li>› 50,000 tool calls / month</li>
                  <li>› Priority support</li>
                </ul>
                <Button variant="hero" size="lg" className="w-full" asChild>
                  <a href={proStripeUrl} target="_blank" rel="noopener noreferrer">
                    Subscribe £79/mo
                  </a>
                </Button>
              </div>

              <div className="card-industrial p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                  <h3 className="font-display text-xl font-bold">Enterprise</h3>
                </div>
                <div className="font-display text-4xl font-bold mb-2">
                  {enterprisePriceAmount}
                  <span className="text-base text-muted-foreground">/{enterprisePricePeriod}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">Volume tool calls, SLA, on-prem option.</p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6 flex-grow">
                  <li>› Unlimited tool calls</li>
                  <li>› 99.9% SLA</li>
                  <li>› SAML / SSO</li>
                  <li>› Self-hosted option</li>
                </ul>
                <Button variant="outline" size="lg" className="w-full" asChild>
                  <a href="mailto:nicholas@meok.ai?subject=Enterprise%20MCP%20inquiry&body=Hi%20Nick%2C%0A%0AWe%27re%20interested%20in%20the%20Enterprise%20tier.%20Volume%2Frequirements%3A%0A%0A">
                    Contact sales
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <Equipment />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default MCPsPage;
