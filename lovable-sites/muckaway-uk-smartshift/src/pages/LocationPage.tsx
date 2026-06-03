import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, MapPin, Truck, Leaf, Shield, Phone, ArrowRight, Star, Clock, Award } from 'lucide-react';
import { getCityData } from '@/config/ukCities';
import { RelatedServices } from '@/components/RelatedServices';

const LocationPage = () => {
  const { city } = useParams<{ city: string }>();
  const cityData = getCityData(city || '');
  
  if (!cityData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Location Not Found</h1>
          <p className="text-muted-foreground mb-8">
            We couldn't find muck away services for this location.
          </p>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const { name, region, population, description, services, localInfo, coordinates, postcodePrefix, rating, faqs } = cityData;
  
  const canonicalUrl = `https://muckaway.ai/muck-away-${city}`;
  const currentYear = new Date().getFullYear();

  // Generate comprehensive schema markup
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      // LocalBusiness schema
      {
        "@type": "LocalBusiness",
        "@id": `${canonicalUrl}#business`,
        "name": `MuckAway.ai - ${name}`,
        "description": description,
        "url": canonicalUrl,
        "telephone": "+44-800-123-4567",
        "email": "hello@muckaway.ai",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": name,
          "addressRegion": region,
          "addressCountry": "GB",
          "postalCode": postcodePrefix
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": coordinates.latitude,
          "longitude": coordinates.longitude
        },
        "areaServed": {
          "@type": "City",
          "name": name,
          "containedInPlace": {
            "@type": "AdministrativeArea",
            "name": region
          }
        },
        "priceRange": "££",
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "07:00",
            "closes": "18:00"
          },
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": "Saturday",
            "opens": "08:00",
            "closes": "14:00"
          }
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": rating.average.toString(),
          "reviewCount": rating.count.toString(),
          "bestRating": "5",
          "worstRating": "1"
        },
        "image": "https://muckaway.ai/og-image.png",
        "sameAs": [
          "https://www.facebook.com/muckawayai",
          "https://twitter.com/muckawayai",
          "https://www.linkedin.com/company/muckaway-ai"
        ]
      },
      // Service schema
      {
        "@type": "Service",
        "@id": `${canonicalUrl}#service`,
        "name": `Muck Away Services in ${name}`,
        "description": `Professional muck away, grab hire, and spoil removal services in ${name}. AI-powered waste classification with instant quotes.`,
        "provider": {
          "@id": `${canonicalUrl}#business`
        },
        "areaServed": {
          "@type": "City",
          "name": name
        },
        "serviceType": "Waste Removal",
        "offers": services.map(service => ({
          "@type": "Offer",
          "name": service.name,
          "description": service.description,
          "priceSpecification": {
            "@type": "PriceSpecification",
            "price": service.startingPrice,
            "priceCurrency": "GBP",
            "minPrice": service.startingPrice
          }
        }))
      },
      // BreadcrumbList schema
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://muckaway.ai/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Locations",
            "item": "https://muckaway.ai/locations"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": `Muck Away ${name}`,
            "item": canonicalUrl
          }
        ]
      },
      // FAQPage schema
      {
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      },
      // SpeakableSpecification for voice search
      {
        "@type": "WebPage",
        "@id": canonicalUrl,
        "name": `Muck Away Services in ${name} | MuckAway.ai`,
        "description": description,
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": [".speakable-intro", ".speakable-services", ".speakable-cta"]
        },
        "breadcrumb": {
          "@id": `${canonicalUrl}#breadcrumb`
        },
        "mainEntity": {
          "@id": `${canonicalUrl}#service`
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Muck Away Services in {name} | Grab Hire & Spoil Removal | MuckAway.ai</title>
        <meta 
          name="description" 
          content={`Professional muck away & grab hire in ${name}. AI-powered waste classification, instant quotes from £30/tonne. ${rating.average}★ rated (${rating.count} reviews). Same-day service available.`} 
        />
        <meta name="keywords" content={`muck away ${name}, grab hire ${name}, spoil removal ${name}, waste disposal ${name}, excavation waste ${name}, grab lorry ${name}, tipper hire ${name}, ${region} muck away`} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={`Muck Away Services in ${name} | MuckAway.ai`} />
        <meta property="og:description" content={`Professional muck away & grab hire in ${name}. AI-powered waste classification, instant quotes from £30/tonne.`} />
        <meta property="og:image" content="https://muckaway.ai/og-image.png" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="MuckAway.ai" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={`Muck Away Services in ${name} | MuckAway.ai`} />
        <meta name="twitter:description" content={`Professional muck away & grab hire in ${name}. AI-powered waste classification, instant quotes from £30/tonne.`} />
        <meta name="twitter:image" content="https://muckaway.ai/og-image.png" />
        
        {/* Geo tags */}
        <meta name="geo.region" content="GB" />
        <meta name="geo.placename" content={name} />
        <meta name="geo.position" content={`${coordinates.latitude};${coordinates.longitude}`} />
        <meta name="ICBM" content={`${coordinates.latitude}, ${coordinates.longitude}`} />
        
        {/* Schema markup */}
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      </Helmet>

      <Header />

      <main>
        {/* Breadcrumb */}
        <nav className="container mx-auto px-4 py-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li>/</li>
            <li><span className="text-foreground font-medium">Muck Away {name}</span></li>
          </ol>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <Badge variant="outline">{region}</Badge>
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{rating.average}</span>
                <span className="text-muted-foreground">({rating.count} reviews)</span>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Award className="h-3 w-3" />
                Serving {name} since 2024
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 speakable-intro">
              Muck Away Services in {name}
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl speakable-intro">
              {description}
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/quote-workflow">
                <Button size="lg" className="gap-2">
                  Get Instant Quote <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="tel:08001234567">
                <Button size="lg" variant="outline" className="gap-2">
                  <Phone className="h-4 w-4" /> Call 0800 123 4567
                </Button>
              </a>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Same-day service available
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                EA Licensed Carriers
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-primary" />
                85% Recycling Rate
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">How Muck Away Works in {name}</h2>
          
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { step: 1, title: 'Get Quote', desc: 'Upload a photo or describe your waste. Our AI identifies the type instantly.' },
              { step: 2, title: 'Book Collection', desc: 'Choose your date and time. Same-day available in ' + name + '.' },
              { step: 3, title: 'We Collect', desc: 'Our EA-licensed grab lorries load directly from your site.' },
              { step: 4, title: 'Get Paperwork', desc: 'Receive digital waste transfer notes automatically.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 speakable-services">Our Services in {name}</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" />
                      {service.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{service.description}</p>
                    <p className="text-lg font-semibold text-primary">From £{service.startingPrice}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Why Choose MuckAway.ai in {name}?</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">AI-Powered Classification</h3>
                  <p className="text-sm text-muted-foreground">
                    Instant waste type identification with 95%+ accuracy
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Fully Compliant</h3>
                  <p className="text-sm text-muted-foreground">
                    EA registered carriers, duty of care guaranteed
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Leaf className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Eco-Friendly</h3>
                  <p className="text-sm text-muted-foreground">
                    85% recycling rate, carbon tracking included
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Local Coverage</h3>
                  <p className="text-sm text-muted-foreground">
                    Same-day service across {name} and surrounding areas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Local Info */}
        {localInfo && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-8">Muck Away Information for {name}</h2>
              
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground">{localInfo.overview}</p>
                
                {localInfo.keyAreas && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Areas We Cover in {name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {localInfo.keyAreas.map((area, idx) => (
                        <Badge key={idx} variant="secondary">{area}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions - Muck Away in {name}</h2>
            
            <Accordion type="single" collapsible className="max-w-3xl">
              {faqs.map((faq, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Related Services */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <RelatedServices currentSlug={`muck-away-${city}`} limit={6} />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground speakable-cta">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Book Muck Away in {name}?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Get an instant AI-powered quote in under 60 seconds
            </p>
            <Link to="/quote-workflow">
              <Button size="lg" variant="secondary" className="gap-2">
                Get Your Free Quote <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LocationPage;
