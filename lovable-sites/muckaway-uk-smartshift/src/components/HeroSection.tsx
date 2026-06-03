import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-construction.jpg";
import { useGlobal } from "@/components/GlobalProvider";
import { useTranslation } from "react-i18next";
import { HardHat, FileCheck, Truck, Mountain, ScanSearch, Clock, FileText } from "lucide-react";
import { RegionalHeroOverlay } from "./RegionalHeroOverlay";

const REGIONAL_TAGLINES: Record<string, { badge: string; headline: string; subtext: string }> = {
  UK: {
    badge: "🇬🇧 UK's #1 AI Spoil Classification Platform",
    headline: "AI-Powered Spoil Removal.",
    subtext: "Instant Quotes. Zero Paperwork."
  },
  GB: {
    badge: "🇬🇧 UK's #1 AI Spoil Classification Platform",
    headline: "AI-Powered Spoil Removal.",
    subtext: "Instant Quotes. Zero Paperwork."
  },
  US: {
    badge: "🇺🇸 America's #1 AI Spoil Classification Platform",
    headline: "AI-Powered Spoil Removal.",
    subtext: "Instant Quotes. Zero Paperwork."
  },
  AU: {
    badge: "🇦🇺 Australia's #1 AI Spoil Classification Platform",
    headline: "AI-Powered Spoil Removal.",
    subtext: "Instant Quotes. Zero Paperwork."
  },
  CA: {
    badge: "🇨🇦 Canada's #1 AI Spoil Classification Platform",
    headline: "AI-Powered Spoil Removal.",
    subtext: "Instant Quotes. Zero Paperwork."
  },
  NZ: {
    badge: "🇳🇿 New Zealand's #1 AI Spoil Classification Platform",
    headline: "AI-Powered Spoil Removal.",
    subtext: "Instant Quotes. Zero Paperwork."
  },
  EU: {
    badge: "🇪🇺 Europe's #1 AI Spoil Classification Platform",
    headline: "AI-Powered Spoil Removal.",
    subtext: "Instant Quotes. Zero Paperwork."
  },
  CN: {
    badge: "🇨🇳 中国领先的AI土方分类平台",
    headline: "AI智能土方处理",
    subtext: "即时报价，零纸张办公"
  },
  MX: {
    badge: "🇲🇽 Plataforma #1 de Clasificación de Residuos con IA en México",
    headline: "Eliminación de Residuos con IA",
    subtext: "Cotizaciones Instantáneas. Cero Papeleo."
  },
  JP: {
    badge: "🇯🇵 日本No.1 AI建設残土分類プラットフォーム",
    headline: "AIによる残土処理",
    subtext: "即時見積もり。ペーパーレス。"
  },
  // Southeast Asia
  MY: {
    badge: "🇲🇾 Platform Pengelasan Sisa Pembinaan AI #1 di Malaysia",
    headline: "Pembuangan Sisa AI",
    subtext: "Sebut Harga Segera. Tanpa Kertas."
  },
  ID: {
    badge: "🇮🇩 Platform Klasifikasi Limbah AI #1 di Indonesia",
    headline: "Pembuangan Limbah Berbasis AI",
    subtext: "Penawaran Instan. Tanpa Kertas."
  },
  PH: {
    badge: "🇵🇭 Philippines' #1 AI Construction Waste Platform",
    headline: "AI-Powered Waste Removal.",
    subtext: "Instant Quotes. Zero Paperwork."
  },
  TH: {
    badge: "🇹🇭 แพลตฟอร์ม AI จัดการเศษก่อสร้างอันดับ 1 ของไทย",
    headline: "การกำจัดขยะด้วย AI",
    subtext: "ใบเสนอราคาทันที ไม่มีเอกสาร"
  },
  VN: {
    badge: "🇻🇳 Nền tảng phân loại chất thải AI số 1 Việt Nam",
    headline: "Thu gom chất thải AI",
    subtext: "Báo giá tức thì. Không giấy tờ."
  },
  // Saudi Arabia
  SA: {
    badge: "🇸🇦 منصة تصنيف نفايات البناء الأولى في السعودية",
    headline: "إزالة النفايات بالذكاء الاصطناعي",
    subtext: "عروض أسعار فورية. بدون أوراق."
  },
  DEFAULT: {
    badge: "🌍 World's #1 AI Spoil Classification Platform",
    headline: "AI-Powered Spoil Removal.",
    subtext: "Instant Quotes. Zero Paperwork."
  }
};

export const HeroSection = () => {
  const { region } = useGlobal();
  const { t } = useTranslation();
  
  const countryCode = region?.country?.toUpperCase() || 'DEFAULT';
  const tagline = REGIONAL_TAGLINES[countryCode] || REGIONAL_TAGLINES['DEFAULT'];
  
  const scrollToClassifier = () => {
    document.getElementById('ai-classifier')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Hero Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/95"></div>
      </div>
      
      <div className="relative container mx-auto px-4 text-center z-10">
        <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 text-sm px-4 py-2">
          {tagline.badge}
        </Badge>
        
        <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
          {tagline.headline}
        </h1>
        
        <p className="text-2xl lg:text-3xl font-semibold text-primary mb-4">
          {tagline.subtext}
        </p>
        
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t('hero.subtitle', 'Upload a photo of your spoil. Get instant EWC classification, compliance checks, and competitive quotes from verified carriers.')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button variant="action" size="lg" className="px-10 py-6 text-lg font-semibold" onClick={scrollToClassifier}>
            <ScanSearch className="mr-2 h-5 w-5" />
            {t('hero.classifyFree', 'Classify My Spoil Free')}
          </Button>
          <Button variant="outline" size="lg" className="px-8" asChild>
            <a href="/subscribe">{t('hero.seePricing', 'See Pricing')}</a>
          </Button>
          <Button variant="ghost" size="lg" className="px-8" asChild>
            <a href="/demo">{t('hero.watchDemo', '🎥 Watch 2-Min Demo')}</a>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="group bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-elegant border border-border/50 hover:shadow-glow transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-center mb-4 h-20 rounded-lg bg-primary/10">
              <ScanSearch className="h-12 w-12 text-primary" />
            </div>
            <div className="text-primary text-xl font-bold mb-2 flex items-center justify-center gap-2">
              <Mountain className="h-5 w-5" />
              {t('hero.aiClassification', 'AI Spoil Classification')}
            </div>
            <div className="text-muted-foreground text-sm">
              {t('hero.aiDescription', 'Upload a photo → Get instant EWC code, hazard assessment, and disposal recommendations')}
            </div>
          </div>
          
          <div className="group bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-elegant border border-border/50 hover:shadow-glow transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-center mb-4 h-20 rounded-lg bg-accent/10">
              <FileCheck className="h-12 w-12 text-accent" />
            </div>
            <div className="text-accent text-xl font-bold mb-2 flex items-center justify-center gap-2">
              <FileText className="h-5 w-5" />
              {t('hero.autoCompliance', 'Auto-Compliance Docs')}
            </div>
            <div className="text-muted-foreground text-sm">
              {t('hero.complianceDescription', 'Waste Transfer Notes, Hazardous Consignment Notes, DWT 2026 ready')}
            </div>
          </div>
          
          <div className="group bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-elegant border border-border/50 hover:shadow-glow transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-center mb-4 h-20 rounded-lg bg-primary/10">
              <Truck className="h-12 w-12 text-primary" />
            </div>
            <div className="text-primary text-xl font-bold mb-2 flex items-center justify-center gap-2">
              <Clock className="h-5 w-5" />
              {t('hero.instantQuotes', 'Instant Carrier Quotes')}
            </div>
            <div className="text-muted-foreground text-sm">
              {t('hero.pricingDescription', 'Compare verified carriers, see landfill tax breakdown, book in seconds')}
            </div>
          </div>
        </div>
      </div>
      
      {/* Regional Overlay */}
      <RegionalHeroOverlay />
    </section>
  );
};
