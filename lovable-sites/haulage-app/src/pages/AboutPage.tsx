import { Link } from "react-router-dom";
import { Mail, Shield, Award, Users, Clock, Package, Server, Globe } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { proStripeUrl } from "@/data/mcps";

const AboutPage = () => {
  const stats = [
    { icon: Package, value: "4", label: "Trade Verticals" },
    { icon: Server, value: "9", label: "MCP Servers" },
    { icon: Globe, value: "PyPI", label: "Published" },
    { icon: Shield, value: "MIT", label: "Licensed" },
  ];

  const values = [
    {
      icon: Shield,
      title: "Compliance by default",
      description: "Every MCP returns a signed attestation through meok-attestation-api. Your audit trail is automatic.",
    },
    {
      icon: Award,
      title: "Open + extensible",
      description: "MIT-licensed servers on PyPI. Fork them, run them locally, embed them in your own SaaS.",
    },
    {
      icon: Users,
      title: "Built by an operator",
      description: "MEOK AI Labs is a solo founder shop in London. No agency markup, no sales engineers, no upsells.",
    },
    {
      icon: Clock,
      title: "EU AI Act ready",
      description: "Aligned with the EU AI Act + UK AI Bill draft. Risk classifiers and FRIA generators ship in the catalogue.",
    },
  ];

  return (
    <>
      <SEO
        title="About Haulage.app | MEOK AI Labs | UK Trade Compliance"
        description="Haulage.app is the umbrella for UK trade SaaS — plant hire, grab hire, muckaway — and 9 PyPI MCP servers. Built solo by MEOK AI Labs in London. MIT licensed, EU AI Act aligned."
        canonical="https://haulage.app/about"
      />

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20">
          <section className="py-16 md:py-24 bg-secondary relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="container mx-auto px-6 relative z-10">
              <div className="max-w-3xl">
                <span className="text-primary font-display uppercase tracking-wider text-sm">About Haulage.app</span>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6">
                  The Umbrella for <span className="text-gradient">UK Trade SaaS</span>
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl mb-8">
                  Four real UK trade markets — plant hire, grab hire, muckaway, skip hire — wrapped in one
                  platform with shared auth, shared billing, and shared compliance. Underneath it: nine
                  PyPI-published MCP servers, each focused on one regulator.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/mcps">Browse the 9 MCPs</Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/contact">Get in Touch</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="py-8 bg-primary">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, idx) => {
                  const IconComponent = stat.icon;
                  return (
                    <div key={idx} className="text-center">
                      <IconComponent className="w-8 h-8 mx-auto mb-2 text-primary-foreground/80" />
                      <p className="font-display text-2xl font-bold text-primary-foreground">{stat.value}</p>
                      <p className="text-primary-foreground/80 text-sm">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="py-16 md:py-24">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center mb-16">
                <span className="text-primary font-display uppercase tracking-wider text-sm">Why we built this</span>
                <h2 className="font-display text-3xl md:text-4xl font-bold mt-4 mb-6">
                  Compliance is a <span className="text-gradient">solved problem</span> — wired wrong
                </h2>
                <p className="text-muted-foreground text-lg">
                  Every UK trade business has the same compliance loop: DVSA roadside, tachograph audit,
                  CHAS prep, CPCS verification, ISO 19650 BIM, waste-carrier registration. None of it is
                  hard. All of it is buried in PDFs and £2k consultancy fees. Haulage.app turns each
                  regulator into a callable tool you can run from your terminal.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {values.map((value, idx) => {
                  const IconComponent = value.icon;
                  return (
                    <div key={idx} className="card-industrial p-6 text-center">
                      <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="font-display text-xl font-bold mb-3">{value.title}</h3>
                      <p className="text-muted-foreground text-sm">{value.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="py-16 md:py-24 bg-secondary">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                  The <span className="text-gradient">Four Trades</span>
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <a href="https://muckaway.ai" target="_blank" rel="noopener noreferrer" className="text-center group">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors">MuckAway.ai</h3>
                  <p className="text-muted-foreground text-sm">
                    AI spoil classification, weighbridge OCR, Stripe checkout. 60 pages, 116 components.
                  </p>
                </a>
                <a href="https://planthire.ai" target="_blank" rel="noopener noreferrer" className="text-center group">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors">PlantHire.ai</h3>
                  <p className="text-muted-foreground text-sm">
                    Equipment booking, ISO 19650, CHAS, CPCS, LOLER — all baked in.
                  </p>
                </a>
                <a href="https://grabhire.ai" target="_blank" rel="noopener noreferrer" className="text-center group">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors">GrabHire.ai</h3>
                  <p className="text-muted-foreground text-sm">
                    Instant quoting, DVSA roadside, waste-carrier checks. Direct WhatsApp + phone.
                  </p>
                </a>
              </div>
            </div>
          </section>

          <section className="py-16 md:py-24">
            <div className="container mx-auto px-6 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Want to <span className="text-gradient">try it</span>?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                Pro tier unlocks all 9 MCPs and access to the three trade SaaS apps for £79/mo. No contracts, cancel any time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href={proStripeUrl} target="_blank" rel="noopener noreferrer">
                    Subscribe Pro £79/mo
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="mailto:nicholas@meok.ai" className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Nick
                  </a>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AboutPage;
