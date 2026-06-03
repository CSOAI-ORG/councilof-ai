import { CheckCircle2 } from "lucide-react";

const features = [
  "MIT-licensed open source",
  "PyPI-published, signed attestations",
  "EU AI Act + UK AI Bill aligned",
  "Built solo by MEOK AI Labs",
  "Vite + React + TypeScript + shadcn-ui",
  "Stripe-powered, Supabase-backed",
];

const About = () => {
  return (
    <section id="about" className="py-24 bg-tr8-charcoal">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="aspect-square rounded-lg overflow-hidden card-industrial">
              <div className="w-full h-full bg-background flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="font-display text-7xl md:text-8xl font-bold text-gradient mb-4">
                    HAULAGE
                  </div>
                  <div className="font-display text-3xl text-primary">.app</div>
                  <div className="mt-6 text-sm text-muted-foreground uppercase tracking-wider">
                    by MEOK AI Labs
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/20 rounded-lg -z-10" />
            <div className="absolute -top-6 -left-6 w-32 h-32 border-2 border-primary/30 rounded-lg -z-10" />
          </div>

          <div>
            <span className="text-primary font-display uppercase tracking-wider text-sm">About Haulage.app</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 mb-6">
              The <span className="text-gradient">Umbrella</span> for UK Trade SaaS
            </h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              Haulage.app pulls four real UK trade markets — plant hire, grab hire, muckaway, skip hire — into one
              platform with shared auth, shared billing, and shared compliance. Each operator runs their own
              tenant on their own subdomain.
            </p>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Underneath: nine PyPI-published MCP servers, each focused on one compliance regime (DVSA,
              NRSWA, CHAS, CPCS, CPA, ISO 19650, waste-carrier, BIM, LOLER). Together they ship over forty
              callable tools — every one of them returns a signed attestation you can stash in your audit trail.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
