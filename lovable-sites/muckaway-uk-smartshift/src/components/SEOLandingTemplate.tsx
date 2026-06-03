import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  ArrowRight, 
  Phone, 
  Shield, 
  Zap, 
  Leaf,
  Clock,
  FileCheck,
  Truck,
  Calculator,
  Star,
  Users,
  TrendingUp
} from 'lucide-react';
import { SEOPageConfig } from '@/config/seoKeywords';
import { RelatedServices } from '@/components/RelatedServices';
import { LeadCaptureForm } from '@/components/LeadCaptureForm';
import { SocialProofSection } from '@/components/SocialProofSection';
import { ExitIntentPopup } from '@/components/ExitIntentPopup';

interface SEOLandingTemplateProps {
  pageConfig: SEOPageConfig;
}

// Schema generators
const generateServiceSchema = (config: SEOPageConfig) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "name": config.title,
  "description": config.metaDescription,
  "provider": {
    "@type": "Organization",
    "name": "MuckAway.ai",
    "url": "https://muckaway.ai"
  },
  "areaServed": {
    "@type": "Country",
    "name": "United Kingdom"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": config.title,
    "itemListElement": [{
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": config.title
      }
    }]
  }
});

const generateFAQSchema = (config: SEOPageConfig) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": config.faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

const generateHowToSchema = (config: SEOPageConfig) => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": config.h1,
  "description": config.content.intro,
  "step": config.content.howItWorks.map(step => ({
    "@type": "HowToStep",
    "position": step.step,
    "name": step.title,
    "text": step.description
  }))
});

const generateArticleSchema = (config: SEOPageConfig) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": config.h1,
  "description": config.metaDescription,
  "author": {
    "@type": "Organization",
    "name": "MuckAway.ai"
  },
  "publisher": {
    "@type": "Organization",
    "name": "MuckAway.ai",
    "url": "https://muckaway.ai"
  },
  "datePublished": "2024-01-01",
  "dateModified": new Date().toISOString().split('T')[0]
});

const generateBreadcrumbSchema = (config: SEOPageConfig) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://muckaway.ai"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": config.category.charAt(0).toUpperCase() + config.category.slice(1),
      "item": `https://muckaway.ai/${config.category}`
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": config.title,
      "item": `https://muckaway.ai/${config.slug}`
    }
  ]
});

const generateSpeakableSchema = (config: SEOPageConfig) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": config.title,
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".speakable-intro", ".speakable-faq"]
  }
});

const generateAggregateRatingSchema = () => ({
  "@context": "https://schema.org",
  "@type": "AggregateRating",
  "ratingValue": "4.9",
  "reviewCount": "2847",
  "bestRating": "5",
  "worstRating": "1"
});

// Icon mapping for benefits
const benefitIcons = [
  CheckCircle,
  Shield,
  Zap,
  Leaf,
  Clock,
  FileCheck
];

// Step icons
const stepIcons = [
  Calculator,
  FileCheck,
  Truck,
  CheckCircle
];

// Social proof stats for hero
const quickStats = [
  { icon: Users, value: '5,000+', label: 'Happy Customers' },
  { icon: Star, value: '4.9★', label: 'Avg Rating' },
  { icon: TrendingUp, value: '250K+', label: 'Tonnes Moved' }
];

export const SEOLandingTemplate = ({ pageConfig }: SEOLandingTemplateProps) => {
  const categoryColors: Record<string, string> = {
    service: 'bg-primary/10 text-primary',
    compliance: 'bg-blue-500/10 text-blue-500',
    guide: 'bg-green-500/10 text-green-500',
    industry: 'bg-purple-500/10 text-purple-500',
    location: 'bg-orange-500/10 text-orange-500'
  };

  // Generate all relevant schemas
  const schemas = [];
  
  if (pageConfig.schema.type === 'Service') {
    schemas.push(generateServiceSchema(pageConfig));
  }
  if (pageConfig.schema.type === 'HowTo' || pageConfig.schema.additionalTypes?.includes('HowTo')) {
    schemas.push(generateHowToSchema(pageConfig));
  }
  if (pageConfig.schema.type === 'Article') {
    schemas.push(generateArticleSchema(pageConfig));
  }
  if (pageConfig.faqs.length > 0) {
    schemas.push(generateFAQSchema(pageConfig));
  }
  schemas.push(generateBreadcrumbSchema(pageConfig));
  schemas.push(generateSpeakableSchema(pageConfig));
  schemas.push(generateAggregateRatingSchema());

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageConfig.metaTitle}</title>
        <meta name="description" content={pageConfig.metaDescription} />
        <meta name="keywords" content={pageConfig.keywords.join(', ')} />
        <link rel="canonical" href={`https://muckaway.ai/${pageConfig.slug}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageConfig.metaTitle} />
        <meta property="og:description" content={pageConfig.metaDescription} />
        <meta property="og:url" content={`https://muckaway.ai/${pageConfig.slug}`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://muckaway.ai/og-image.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageConfig.metaTitle} />
        <meta name="twitter:description" content={pageConfig.metaDescription} />
        
        {/* Schema.org */}
        {schemas.map((schema, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </Helmet>

      <Header />

      <main>
        {/* Hero Section with Lead Capture */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-5 gap-12 items-start">
              {/* Left Content - 3 cols */}
              <div className="lg:col-span-3">
                {/* Breadcrumb */}
                <nav className="text-sm mb-6" aria-label="Breadcrumb">
                  <ol className="flex items-center gap-2 text-muted-foreground">
                    <li><Link to="/" className="hover:text-primary">Home</Link></li>
                    <li>/</li>
                    <li className="capitalize">{pageConfig.category}</li>
                    <li>/</li>
                    <li className="text-foreground">{pageConfig.title}</li>
                  </ol>
                </nav>

                <Badge className={categoryColors[pageConfig.category]} variant="outline">
                  {pageConfig.category.charAt(0).toUpperCase() + pageConfig.category.slice(1)}
                </Badge>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6">
                  {pageConfig.h1}
                </h1>
                
                <p className="speakable-intro text-xl text-muted-foreground mb-8 max-w-3xl">
                  {pageConfig.content.intro}
                </p>
                
                {/* Quick Stats - Social Proof */}
                <div className="flex flex-wrap gap-6 mb-8">
                  {quickStats.map((stat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <stat.icon className="h-5 w-5 text-primary" />
                      <span className="font-bold text-foreground">{stat.value}</span>
                      <span className="text-muted-foreground text-sm">{stat.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link to="/auth">
                    <Button size="lg" className="gap-2 text-lg px-8">
                      {pageConfig.content.ctaText} <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <a href="tel:08001234567">
                    <Button size="lg" variant="outline" className="gap-2">
                      <Phone className="h-5 w-5" /> 0800 123 4567
                    </Button>
                  </a>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap gap-6 mt-8 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    EA Registered Carriers
                  </span>
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Full Compliance Guaranteed
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Same-Day Available
                  </span>
                </div>
              </div>

              {/* Right Side - Lead Capture Form - 2 cols */}
              <div className="lg:col-span-2">
                <LeadCaptureForm 
                  variant="card"
                  title={`Get Your ${pageConfig.title} Quote`}
                  description="Enter your details for an instant AI-powered quote. No obligation."
                  ctaText="Get Free Quote"
                  leadType="quote"
                  showPhone
                />
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Why Choose MuckAway.ai for {pageConfig.title}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pageConfig.content.benefits.map((benefit, idx) => {
              const IconComponent = benefitIcons[idx % benefitIcons.length];
              return (
                <div key={idx} className="flex items-start gap-4 p-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{benefit}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">
              How It Works
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {pageConfig.content.howItWorks.map((step, idx) => {
                const IconComponent = stepIcons[idx % stepIcons.length];
                return (
                  <div key={idx} className="text-center">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center">
                        <IconComponent className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <span className="absolute -top-2 -right-2 w-8 h-8 bg-background border-2 border-primary rounded-full flex items-center justify-center font-bold text-primary">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-16 container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Trusted by UK Contractors
          </h2>
          <SocialProofSection variant="full" />
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-muted/30 speakable-faq">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Frequently Asked Questions
            </h2>
            
            <div className="max-w-3xl mx-auto space-y-6">
              {pageConfig.faqs.map((faq, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Inline Lead Capture */}
        <section className="py-16 container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Get Your Free Quote Now
            </h2>
            <p className="text-muted-foreground mb-8">
              Join 5,000+ contractors who trust MuckAway.ai for compliant waste disposal
            </p>
            <LeadCaptureForm 
              variant="inline"
              ctaText="Get Instant Quote"
              leadType="quote"
              className="max-w-md mx-auto"
            />
          </div>
        </section>

        {/* Related Services */}
        {pageConfig.relatedPages.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-8 text-center">
                Related Services
              </h2>
              <RelatedServices slugs={pageConfig.relatedPages} />
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Get an instant AI-powered quote for {pageConfig.title.toLowerCase()} in under 60 seconds
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="gap-2 text-lg px-8">
                  {pageConfig.content.ctaText} <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="tel:08001234567">
                <Button size="lg" variant="outline" className="gap-2 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  <Phone className="h-5 w-5" /> Call Now
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Exit Intent Popup */}
      <ExitIntentPopup />
    </div>
  );
};

export default SEOLandingTemplate;
