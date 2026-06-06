import muckawayLogo from "@/assets/muckaway-logo.png";
import { useGlobal } from "@/components/GlobalProvider";
import { getComplianceForRegion } from "@/config/regionalCompliance";
import { getLegalEntityForRegion, LOOPFACTORY_COMPANY } from "@/config/legalConfig";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import RegionSelector from "./RegionSelector";
import { LanguageSelector } from "./LanguageSelector";
import { NewsletterSignup } from "./NewsletterSignup";
import { ExternalLink, Globe, Database, TrendingDown, Mail, Phone } from "lucide-react";
import { PLATFORM_METRICS, METRICS_DISCLAIMER } from "@/config/platformMetrics";

const sisterCompanies = [
  {
    name: "GrabHire.ai",
    description: "Grab & Tipper Hire Platform",
    url: "https://grabhire.ai",
  },
  {
    name: "PlantHire.ai",
    description: "Plant & Equipment Hire",
    url: "https://planthire.ai",
  },
];

const ecosystemLinks = [
  { name: "CSOAI.org", url: "https://csoai.org", description: "AI Safety Organization" },
  { name: "LoopFactory.ai", url: "https://loopfactory.ai", description: "Parent Company" },
];

const globalRegulations = [
  { flag: "🇬🇧", code: "UK", body: "Environment Agency", url: "https://www.gov.uk/government/organisations/environment-agency" },
  { flag: "🇺🇸", code: "US", body: "EPA RCRA", url: "https://www.epa.gov/rcra" },
  { flag: "🇪🇺", code: "EU", body: "Waste Framework", url: "https://environment.ec.europa.eu/topics/waste-and-recycling_en" },
  { flag: "🇦🇺", code: "AU", body: "DCCEEW", url: "https://www.dcceew.gov.au/environment/protection/waste" },
  { flag: "🇨🇦", code: "CA", body: "CEPA", url: "https://www.canada.ca/en/environment-climate-change.html" },
  { flag: "🇳🇿", code: "NZ", body: "MfE", url: "https://environment.govt.nz/what-government-is-doing/areas-of-work/waste/" },
  { flag: "🇧🇷", code: "BR", body: "IBAMA", url: "https://www.gov.br/ibama/pt-br" },
  { flag: "🇮🇳", code: "IN", body: "CPCB", url: "https://cpcb.nic.in/" },
  { flag: "🇸🇬", code: "SG", body: "NEA", url: "https://www.nea.gov.sg/" },
  { flag: "🇦🇪", code: "AE", body: "MoCCaE", url: "https://www.moccae.gov.ae/en/home.aspx" },
  { flag: "🇿🇦", code: "ZA", body: "DFFE", url: "https://www.dffe.gov.za/" },
];

export const Footer = () => {
  const { region } = useGlobal();
  const { t } = useTranslation();
  const compliance = getComplianceForRegion(region?.country || 'UK');
  const legalEntity = getLegalEntityForRegion(region?.country || 'UK');

  return (
    <footer id="contact" className="bg-gradient-surface border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Data Intelligence Banner */}
        <div className="mb-12 p-6 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-lg">AI-Powered Waste Intelligence</h4>
                <p className="text-sm text-muted-foreground">
                  Built for global waste regulations across {PLATFORM_METRICS.regulatoryFrameworks} frameworks
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-center">
              <div>
                <div className="flex items-center justify-center gap-1">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-xl font-bold text-primary">{PLATFORM_METRICS.regulatoryFrameworks}</span>
                </div>
                <span className="text-xs text-muted-foreground">Frameworks</span>
              </div>
              <div>
                <div className="text-xl font-bold text-primary">{PLATFORM_METRICS.companies}</div>
                <span className="text-xs text-muted-foreground">Companies</span>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1">
                  <TrendingDown className="w-4 h-4 text-primary" />
                  <span className="text-xl font-bold text-primary">{PLATFORM_METRICS.costSavingsPotential}</span>
                </div>
                <span className="text-xs text-muted-foreground">Potential Savings*</span>
              </div>
            </div>
          </div>
        </div>

        {/* RLMAI Ecosystem */}
        <div className="mb-10 pb-8 border-b border-border/50">
          <div className="text-center mb-6">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Part of the RLMAI Ecosystem</span>
            <h4 className="text-lg font-bold mt-1">Integrated Construction & Waste Platforms</h4>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-background border border-primary/30">
              <img src={muckawayLogo} alt="MuckAway.ai" className="h-5 w-5 filter invert" />
              <div>
                <div className="font-semibold text-sm">
                  <span className="text-accent">Muck</span>
                  <span className="text-primary">Away.ai</span>
                </div>
                <div className="text-[10px] text-muted-foreground">Spoil Removal Platform</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">You are here</span>
            </div>
            {sisterCompanies.map((company, index) => (
              <a
                key={index}
                href={company.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-background border border-border/50 hover:border-primary/50 transition-all group"
              >
                <div className="p-1.5 rounded bg-muted">
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <div className="font-semibold text-sm group-hover:text-primary transition-colors">{company.name}</div>
                  <div className="text-[10px] text-muted-foreground">{company.description}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Global Compliance Badges */}
        <div className="mb-10 pb-8 border-b border-border/50">
          <div className="text-center mb-4">
            <h4 className="text-sm font-semibold mb-1">Global Regulatory Framework Support</h4>
            <p className="text-xs text-muted-foreground">Built for compliance across {PLATFORM_METRICS.regulatoryFrameworks} regulatory frameworks</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {globalRegulations.map((reg, index) => (
              <a
                key={index}
                href={reg.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-background border border-border/30 hover:border-primary/50 hover:bg-primary/5 transition-all text-xs group"
                title={`View ${reg.body} guidelines`}
              >
                <span>{reg.flag}</span>
                <span className="font-medium group-hover:text-primary transition-colors">{reg.code}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid md:grid-cols-6 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src={muckawayLogo} 
                alt="MuckAway.ai Logo" 
                className="h-6 w-6 filter invert"
              />
              <div className="text-lg font-bold">
                <span className="text-accent">Muck</span>
                <span className="text-primary">Away.ai</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              {compliance.flag} {t('footer.tagline', "AI-powered spoil removal platform. Shift it smart. Shift it legal.")}
            </p>
            <div className="flex items-center gap-2">
              <RegionSelector />
              <LanguageSelector />
            </div>
          </div>

          <div>
            <h4 className="text-foreground font-semibold mb-4">{t('footer.platform', 'Platform')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/ai-tools" className="hover:text-primary transition-colors">{t('footer.spoilClassifier', 'Spoil Classifier')}</Link></li>
              <li><Link to="/software" className="hover:text-primary transition-colors">{t('footer.complianceTools', 'Compliance Tools')}</Link></li>
              <li><Link to="/use-cases" className="hover:text-primary transition-colors">Use Cases</Link></li>
              <li><Link to="/global" className="hover:text-primary transition-colors">Global Coverage</Link></li>
              <li><Link to="/integration" className="hover:text-primary transition-colors">Integration</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-foreground font-semibold mb-4">{t('footer.resources', 'Resources')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/how-to-use" className="hover:text-primary transition-colors">How to Use</Link></li>
              <li><Link to="/waste-calculator" className="hover:text-primary transition-colors">Waste Calculator</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">{t('footer.complianceGuide', 'Compliance Guide')}</Link></li>
              <li><a href={compliance.regulatoryUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{compliance.regulatoryBody}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-foreground font-semibold mb-4">{t('footer.company', 'Company')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">{t('footer.aboutUs', 'About Us')}</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">{t('footer.contact', 'Contact')}</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">{t('footer.privacy', 'Privacy Policy')}</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">{t('footer.terms', 'Terms of Service')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-foreground font-semibold mb-4">{t('footer.legal', 'Legal')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/cookie-policy" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
              <li><Link to="/data-processing" className="hover:text-primary transition-colors">Data Processing</Link></li>
              <li><Link to="/data-request" className="hover:text-primary transition-colors">Data Request Form</Link></li>
              <li>
                <a href={`mailto:${legalEntity.dpo.email}`} className="hover:text-primary transition-colors">
                  Contact DPO
                </a>
              </li>
            </ul>
            
            {/* Ecosystem Links */}
            <h4 className="text-foreground font-semibold mb-2 mt-6">Ecosystem</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {ecosystemLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {link.name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Newsletter Signup Column */}
          <div>
            <NewsletterSignup variant="inline" source="footer" />
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-muted-foreground text-sm">
                © 2025 {LOOPFACTORY_COMPANY.name} (Company No: {LOOPFACTORY_COMPANY.companyNumber})
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Registered: {LOOPFACTORY_COMPANY.address}
                {LOOPFACTORY_COMPANY.vatNumber && ` | VAT: ${LOOPFACTORY_COMPANY.vatNumber}`}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <a href={`mailto:${LOOPFACTORY_COMPANY.email}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Mail className="w-3 h-3" />
                  {LOOPFACTORY_COMPANY.email}
                </a>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {LOOPFACTORY_COMPANY.phone}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-sm flex items-center justify-end gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Built for global waste regulations across {PLATFORM_METRICS.regulatoryFrameworks} frameworks
              </p>
              <p className="text-muted-foreground text-xs mt-1 italic">
                *{METRICS_DISCLAIMER}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
