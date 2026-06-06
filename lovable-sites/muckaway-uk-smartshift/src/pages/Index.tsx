import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { WhatIsMuckaway } from "@/components/WhatIsMuckaway";
import { ProcessFlow } from "@/components/ProcessFlow";
import { AdvancedSpoilClassifier } from "@/components/AdvancedSpoilClassifier";
import { RegionalTestimonials } from "@/components/RegionalTestimonials";
import { TrustBadges } from "@/components/TrustBadges";
import RegionalComplianceSection from "@/components/RegionalComplianceSection";
import { EnhancedPricingSection } from "@/components/EnhancedPricingSection";
import { Footer } from "@/components/Footer";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { StickyCTABar } from "@/components/StickyCTABar";
import { SocialProofToast } from "@/components/SocialProofToast";
import { EcosystemBanner } from "@/components/EcosystemBanner";
import { InternationalSEO } from "@/components/InternationalSEO";

const Index = () => {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MuckAway.ai",
    "alternateName": ["Muck Away AI", "MuckAwayAI"],
    "url": "https://muckaway.ai",
    "description": "AI-powered muck away and spoil removal platform. Get instant quotes, ensure compliance, and book licensed waste carriers across the UK.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://muckaway.ai/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MuckAway.ai",
    "legalName": "MuckAway AI Ltd",
    "url": "https://muckaway.ai",
    "logo": "https://muckaway.ai/favicon.png",
    "description": "The UK's leading AI-powered muck away and spoil removal platform for construction and groundworks.",
    "foundingDate": "2023",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "London",
      "addressCountry": "GB"
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+44-20-7123-4567",
        "contactType": "customer service",
        "availableLanguage": ["English"],
        "areaServed": "GB"
      },
      {
        "@type": "ContactPoint",
        "telephone": "+1-555-123-4567",
        "contactType": "customer service",
        "availableLanguage": ["English"],
        "areaServed": "US"
      }
    ],
    "sameAs": [
      "https://www.linkedin.com/company/muckaway-ai",
      "https://twitter.com/muckawayai",
      "https://www.facebook.com/muckawayai"
    ],
    "areaServed": [
      { "@type": "Country", "name": "United Kingdom" },
      { "@type": "Country", "name": "United States" },
      { "@type": "Country", "name": "Australia" },
      { "@type": "Country", "name": "Canada" },
      { "@type": "Country", "name": "New Zealand" },
      { "@type": "Country", "name": "Ireland" },
      { "@type": "Country", "name": "Germany" },
      { "@type": "Country", "name": "France" },
      { "@type": "Country", "name": "Netherlands" }
    ]
  };

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "MuckAway.ai",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "37",
      "priceCurrency": "GBP",
      "priceSpecification": {
        "@type": "PriceSpecification",
        "price": "37",
        "priceCurrency": "GBP",
        "billingDuration": "P1M"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "847",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "AI Spoil Classification",
      "Instant Quote Generation",
      "Digital Waste Transfer Notes",
      "Compliance Documentation",
      "Fleet Management",
      "Live GPS Tracking",
      "Environmental Reporting"
    ]
  };

  const aggregateRatingSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "MuckAway.ai Platform",
    "description": "AI-powered muck away and spoil removal management platform",
    "brand": {
      "@type": "Brand",
      "name": "MuckAway.ai"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "847",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        {/* Primary Meta Tags */}
        <title>MuckAway.ai | AI-Powered Muck Away & Spoil Removal | UK's #1 Platform</title>
        <meta name="title" content="MuckAway.ai | AI-Powered Muck Away & Spoil Removal | UK's #1 Platform" />
        <meta name="description" content="Get instant muck away quotes in 60 seconds. AI-powered spoil classification, compliant waste transfer notes, and licensed carriers. Save 30% on disposal costs. Trusted by 500+ construction companies." />
        <meta name="keywords" content="muck away, spoil removal, grab hire, grab lorry hire, waste transfer note, ewc codes, construction waste disposal, soil removal, excavation waste, tipper hire, muckaway near me, grab hire near me, same day muck away, licensed waste carrier" />
        <meta name="author" content="MuckAway.ai" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <link rel="canonical" href="https://muckaway.ai/" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://muckaway.ai/" />
        <meta property="og:title" content="MuckAway.ai | AI-Powered Muck Away & Spoil Removal" />
        <meta property="og:description" content="Get instant muck away quotes in 60 seconds. AI-powered spoil classification, compliant waste transfer notes, and licensed carriers. Save 30% on disposal costs." />
        <meta property="og:image" content="https://muckaway.ai/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="MuckAway.ai" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:locale:alternate" content="en_US" />
        <meta property="og:locale:alternate" content="en_AU" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@muckawayai" />
        <meta name="twitter:creator" content="@muckawayai" />
        <meta name="twitter:url" content="https://muckaway.ai/" />
        <meta name="twitter:title" content="MuckAway.ai | AI-Powered Muck Away & Spoil Removal" />
        <meta name="twitter:description" content="Get instant muck away quotes in 60 seconds. AI-powered spoil classification, compliant waste transfer notes, and licensed carriers." />
        <meta name="twitter:image" content="https://muckaway.ai/og-image.png" />
        
        {/* Additional SEO */}
        <meta name="geo.region" content="GB" />
        <meta name="geo.placename" content="London" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#F97316" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(softwareApplicationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(aggregateRatingSchema)}
        </script>
      </Helmet>
      
      <InternationalSEO path="/" />
      <EcosystemBanner />
      <Header />
      <HeroSection />
      <WhatIsMuckaway />
      <ProcessFlow />
      <AdvancedSpoilClassifier />
      <RegionalTestimonials />
      <TrustBadges />
      <RegionalComplianceSection />
      <EnhancedPricingSection />
      <Footer />
      
      {/* Conversion Optimization Components */}
      <ExitIntentPopup />
      <StickyCTABar />
      <SocialProofToast />
    </div>
  );
};

export default Index;
