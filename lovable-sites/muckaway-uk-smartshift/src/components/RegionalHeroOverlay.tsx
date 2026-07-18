import { useGlobal } from "@/components/GlobalProvider";
import { Badge } from "@/components/ui/badge";
import { MapPin, Shield, Clock, Building2 } from "lucide-react";

interface RegionalContent {
  flag: string;
  country: string;
  localRegulation: string;
  regulatoryBody: string;
  localBenefit: string;
  featuredCity: string;
}

const REGIONAL_CONTENT: Record<string, RegionalContent> = {
  UK: {
    flag: "🇬🇧",
    country: "United Kingdom",
    localRegulation: "DWT 2026 Ready",
    regulatoryBody: "Environment Agency Compliant",
    localBenefit: "HMRC Landfill Tax Calculations",
    featuredCity: "London, Manchester, Birmingham"
  },
  GB: {
    flag: "🇬🇧",
    country: "United Kingdom",
    localRegulation: "DWT 2026 Ready",
    regulatoryBody: "Environment Agency Compliant",
    localBenefit: "HMRC Landfill Tax Calculations",
    featuredCity: "London, Manchester, Birmingham"
  },
  US: {
    flag: "🇺🇸",
    country: "United States",
    localRegulation: "RCRA Compliant",
    regulatoryBody: "EPA Approved Workflows",
    localBenefit: "State-by-State Tax Tracking",
    featuredCity: "New York, Los Angeles, Chicago"
  },
  AU: {
    flag: "🇦🇺",
    country: "Australia",
    localRegulation: "State EPA Licensed",
    regulatoryBody: "National Waste Policy Aligned",
    localBenefit: "NSW/VIC Waste Levy Tracking",
    featuredCity: "Sydney, Melbourne, Brisbane"
  },
  CA: {
    flag: "🇨🇦",
    country: "Canada",
    localRegulation: "CEPA Compliant",
    regulatoryBody: "Provincial Manifest Support",
    localBenefit: "Carbon Tax Reporting Ready",
    featuredCity: "Toronto, Vancouver, Calgary"
  },
  NZ: {
    flag: "🇳🇿",
    country: "New Zealand",
    localRegulation: "RMA Consent Support",
    regulatoryBody: "Ministry for Environment",
    localBenefit: "NZ ETS Calculations",
    featuredCity: "Auckland, Wellington, Christchurch"
  },
  EU: {
    flag: "🇪🇺",
    country: "European Union",
    localRegulation: "Waste Framework Directive",
    regulatoryBody: "EEA Standards Compliant",
    localBenefit: "Cross-Border Shipment Ready",
    featuredCity: "Berlin, Paris, Amsterdam"
  },
  CN: {
    flag: "🇨🇳",
    country: "中国",
    localRegulation: "固体废物法合规",
    regulatoryBody: "生态环境部标准",
    localBenefit: "省级处置费计算",
    featuredCity: "北京, 上海, 广州"
  },
  MX: {
    flag: "🇲🇽",
    country: "México",
    localRegulation: "LGPGIR Cumplimiento",
    regulatoryBody: "SEMARNAT Autorizado",
    localBenefit: "Cálculo de Tarifas Estatales",
    featuredCity: "Ciudad de México, Guadalajara, Monterrey"
  },
  JP: {
    flag: "🇯🇵",
    country: "日本",
    localRegulation: "廃棄物処理法対応",
    regulatoryBody: "環境省基準準拠",
    localBenefit: "マニフェスト7部複写対応",
    featuredCity: "東京, 大阪, 名古屋"
  },
  BR: {
    flag: "🇧🇷",
    country: "Brasil",
    localRegulation: "PNRS Compliant",
    regulatoryBody: "IBAMA Licensed",
    localBenefit: "State MTR Support",
    featuredCity: "São Paulo, Rio de Janeiro"
  },
  IN: {
    flag: "🇮🇳",
    country: "India",
    localRegulation: "C&D Waste Rules 2016",
    regulatoryBody: "CPCB Guidelines",
    localBenefit: "State PCB Compliance",
    featuredCity: "Mumbai, Delhi, Bangalore"
  },
  SG: {
    flag: "🇸🇬",
    country: "Singapore",
    localRegulation: "NEA Licensed",
    regulatoryBody: "Resource Sustainability Act",
    localBenefit: "Incineration Fee Tracking",
    featuredCity: "Singapore"
  },
  AE: {
    flag: "🇦🇪",
    country: "UAE",
    localRegulation: "Federal Law No. 24",
    regulatoryBody: "Tadweer Approved",
    localBenefit: "Emirate Fee Calculations",
    featuredCity: "Dubai, Abu Dhabi"
  },
  ZA: {
    flag: "🇿🇦",
    country: "South Africa",
    localRegulation: "NEM:WA Compliant",
    regulatoryBody: "DFFE Licensed",
    localBenefit: "Provincial Levy Tracking",
    featuredCity: "Johannesburg, Cape Town"
  },
  DEFAULT: {
    flag: "🌍",
    country: "Global",
    localRegulation: "International Standards",
    regulatoryBody: "Multi-Region Support",
    localBenefit: "Local Compliance Ready",
    featuredCity: "Worldwide Coverage"
  }
};

export const RegionalHeroOverlay = () => {
  const { region } = useGlobal();
  
  const countryCode = region?.country?.toUpperCase() || 'DEFAULT';
  const content = REGIONAL_CONTENT[countryCode] || REGIONAL_CONTENT['DEFAULT'];

  return (
    <div className="absolute bottom-4 left-4 right-4 lg:bottom-8 lg:left-8 lg:right-auto z-20">
      <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-elegant max-w-md">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{content.flag}</span>
          <span className="font-semibold text-foreground">{content.country}</span>
          <Badge variant="outline" className="ml-auto text-xs">
            Auto-Detected
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>{content.localRegulation}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4 text-accent" />
            <span>{content.regulatoryBody}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>{content.localBenefit}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 text-accent" />
            <span className="truncate">{content.featuredCity}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalHeroOverlay;