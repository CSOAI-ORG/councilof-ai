import { Shield, Award, CheckCircle, Lock, FileCheck, Leaf, Globe, Database, TrendingDown, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PLATFORM_METRICS, METRICS_DISCLAIMER } from "@/config/platformMetrics";

const certifications = [
  {
    icon: Shield,
    title: "ISO 9001 Ready",
    description: "Quality management prepared",
  },
  {
    icon: FileCheck,
    title: "Multi-Region Ready",
    description: `${PLATFORM_METRICS.regulatoryFrameworks} frameworks supported`,
  },
  {
    icon: Award,
    title: "CHAS Prepared",
    description: "Health & safety ready",
  },
  {
    icon: Lock,
    title: "GDPR Compliant",
    description: "Data protection built-in",
  },
  {
    icon: CheckCircle,
    title: "SOC 2 Prepared",
    description: "Security architecture ready",
  },
  {
    icon: Leaf,
    title: "Carbon Neutral Goal",
    description: "Net-zero commitment",
  },
];

const globalCompliance = [
  { flag: "🇬🇧", country: "UK", body: "Environment Agency", regulation: "DWT 2026", url: "https://www.gov.uk/government/organisations/environment-agency" },
  { flag: "🇺🇸", country: "US", body: "EPA", regulation: "RCRA", url: "https://www.epa.gov/rcra" },
  { flag: "🇪🇺", country: "EU", body: "European Commission", regulation: "WFD", url: "https://environment.ec.europa.eu/topics/waste-and-recycling_en" },
  { flag: "🇦🇺", country: "AU", body: "DCCEEW", regulation: "NWP 2018", url: "https://www.dcceew.gov.au/environment/protection/waste" },
  { flag: "🇨🇦", country: "CA", body: "ECCC", regulation: "CEPA", url: "https://www.canada.ca/en/environment-climate-change.html" },
  { flag: "🇳🇿", country: "NZ", body: "MfE", regulation: "WMA 2008", url: "https://environment.govt.nz/what-government-is-doing/areas-of-work/waste/" },
  { flag: "🇧🇷", country: "BR", body: "IBAMA", regulation: "PNRS", url: "https://www.gov.br/ibama/pt-br" },
  { flag: "🇮🇳", country: "IN", body: "CPCB", regulation: "SWM 2016", url: "https://cpcb.nic.in/" },
  { flag: "🇸🇬", country: "SG", body: "NEA", regulation: "EPM Act", url: "https://www.nea.gov.sg/" },
  { flag: "🇦🇪", country: "AE", body: "MoCCaE", regulation: "Federal Law", url: "https://www.moccae.gov.ae/en/home.aspx" },
  { flag: "🇿🇦", country: "ZA", body: "DFFE", regulation: "NEMA", url: "https://www.dffe.gov.za/" },
];

export const TrustBadges = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Data Intelligence Value Proposition */}
        <div className="mb-12 p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
                <Database className="w-6 h-6 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wide">AI-Powered Waste Intelligence</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                Built for <span className="text-primary">Global Standards</span>
              </h3>
              <p className="text-muted-foreground max-w-2xl">
                Our platform is designed to support waste management operations across {PLATFORM_METRICS.regulatoryFrameworks} regulatory frameworks. 
                AI-powered pricing optimization, route efficiency, and compliance automation can help reduce 
                operating costs by {PLATFORM_METRICS.costSavingsPotential}.*
              </p>
              <p className="text-xs text-muted-foreground mt-2 italic">
                *{METRICS_DISCLAIMER}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="flex items-center justify-center mb-2">
                  <Globe className="w-8 h-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary">{PLATFORM_METRICS.regulatoryFrameworks}</div>
                <div className="text-xs text-muted-foreground">Frameworks</div>
              </div>
              <div>
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div className="text-xl font-bold text-primary">{PLATFORM_METRICS.companies}</div>
                <div className="text-xs text-muted-foreground">Companies</div>
              </div>
              <div>
                <div className="flex items-center justify-center mb-2">
                  <TrendingDown className="w-8 h-8 text-primary" />
                </div>
                <div className="text-xl font-bold text-primary">{PLATFORM_METRICS.costSavingsPotential}</div>
                <div className="text-xs text-muted-foreground">Potential Savings*</div>
              </div>
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-2">Compliance & Security Architecture</h3>
          <p className="text-muted-foreground">
            Built to meet industry standards across all supported regions
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {certifications.map((cert, index) => {
            const Icon = cert.icon;
            return (
              <Card
                key={index}
                className="border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-glow text-center"
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex justify-center mb-2">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-xs mb-1">{cert.title}</h4>
                  <p className="text-[10px] text-muted-foreground">{cert.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Global Regulatory Compliance */}
        <div className="text-center mb-6">
          <h4 className="text-lg font-semibold mb-2">Built for {PLATFORM_METRICS.regulatoryFrameworks} Regulatory Frameworks</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Click to view each regulatory body's official guidelines
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {globalCompliance.map((item, index) => (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
            >
              <span className="text-lg">{item.flag}</span>
              <div className="text-left">
                <div className="text-xs font-medium group-hover:text-primary transition-colors">{item.body}</div>
                <div className="text-[10px] text-muted-foreground">{item.regulation}</div>
              </div>
            </a>
          ))}
        </div>

        {/* Security Badges */}
        <div className="text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-6 px-6 py-4 bg-background rounded-lg border border-border/50">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">256-bit Encryption</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border/50"></div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">PCI DSS Ready</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border/50"></div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">SOC 2 Architecture</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border/50"></div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">Cyber Essentials Ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
