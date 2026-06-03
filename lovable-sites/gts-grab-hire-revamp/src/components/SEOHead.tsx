import { useEffect } from "react";
import heroImage from "@/assets/hero-grab-lorry.jpg";
import gtsLogo from "@/assets/gts-logo.png";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  type?: "website" | "article";
  image?: string;
}

const SEOHead = ({ 
  title, 
  description, 
  keywords = "",
  canonical = "",
  type = "website",
  image = gtsLogo
}: SEOHeadProps) => {
  useEffect(() => {
    // Update title
    document.title = title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
    
    // Update keywords if provided
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    }
    
    // Update canonical URL if provided
    if (canonical) {
      let linkCanonical = document.querySelector('link[rel="canonical"]');
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.setAttribute('href', canonical);
    }
    
    // Enhanced Open Graph tags
    const ogTags = [
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: type },
      { property: 'og:image', content: image },
      { property: 'og:url', content: canonical || window.location.href },
      { property: 'og:site_name', content: 'GTS Grab Hire' },
      { property: 'og:locale', content: 'en_GB' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'GTS Grab Hire - Professional Grab Lorry Services' }
    ];

    ogTags.forEach(({ property, content }) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });
    
    // Enhanced Twitter Card tags
    const twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      { name: 'twitter:url', content: canonical || window.location.href },
      { name: 'twitter:site', content: '@gtsgrabhire' },
      { name: 'twitter:creator', content: '@gtsgrabhire' },
      { name: 'twitter:image:alt', content: 'GTS Grab Hire - Professional Grab Lorry Services' }
    ];

    twitterTags.forEach(({ name, content }) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });

    // LinkedIn and WhatsApp optimization (uses Open Graph)
    let ogImageSecure = document.querySelector('meta[property="og:image:secure_url"]');
    if (!ogImageSecure) {
      ogImageSecure = document.createElement('meta');
      ogImageSecure.setAttribute('property', 'og:image:secure_url');
      document.head.appendChild(ogImageSecure);
    }
    ogImageSecure.setAttribute('content', image);
    
    // Enhanced structured data for local business
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "GTS Grab Hire",
      "alternateName": "Gray Transport Solutions",
      "description": "Professional grab hire, tipper hire, muck away and waste management services across Kent, London & Essex",
      "telephone": "07958 710 548",
      "email": "contact@gtsgrabhire.co.uk",
      "url": "https://www.gtsgrabhire.co.uk",
      "logo": image,
      "image": image,
      "address": {
        "@type": "PostalAddress",
        "addressRegion": "Essex",
        "addressCountry": "GB"
      },
      "areaServed": [
        { "@type": "City", "name": "London" },
        { "@type": "State", "name": "Kent" },
        { "@type": "State", "name": "Essex" }
      ],
      "serviceType": ["Grab Hire", "Tipper Hire", "Waste Removal", "Muck Away", "Aggregates Supply"],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Grab Hire Services",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Grab Hire",
              "description": "Professional grab hire services 1-16 tons capacity"
            }
          },
          {
            "@type": "Offer", 
            "itemOffered": {
              "@type": "Service",
              "name": "Tipper Hire & Muck Away",
              "description": "Professional tipper hire and muck away services up to 20 tons"
            }
          }
        ]
      },
      "openingHours": "Mo-Su 00:00-23:59",
      "priceRange": "$$",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5",
        "bestRating": "5",
        "ratingCount": "50"
      }
    };
    
    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
    
  }, [title, description, keywords, canonical, type, image]);

  return null;
};

export default SEOHead;