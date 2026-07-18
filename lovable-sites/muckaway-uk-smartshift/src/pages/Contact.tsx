import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGlobal } from "@/components/GlobalProvider";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { InternationalSEO } from "@/components/InternationalSEO";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email"),
  company: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000)
});

const Contact = () => {
  const { toast } = useToast();
  const { region } = useGlobal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('submit-contact', {
        body: {
          name: formData.name,
          email: formData.email,
          company: formData.company || undefined,
          phone: formData.phone || undefined,
          message: formData.message,
          source_page: '/contact'
        }
      });

      if (error) {
        throw error;
      }

      setIsSubmitted(true);
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours.",
      });
      
      setFormData({ name: "", email: "", company: "", phone: "", message: "" });
    } catch (error: any) {
      console.error('Contact form error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = {
    UK: {
      email: "support@muckaway.ai",
      phone: "+44 20 7123 4567",
      address: "123 Construction Way, London EC1A 1BB",
      hours: "Mon-Fri: 8am-6pm GMT"
    },
    US: {
      email: "support@muckaway.ai",
      phone: "+1 (555) 123-4567",
      address: "456 Builder Street, New York, NY 10001",
      hours: "Mon-Fri: 8am-6pm EST"
    },
    DEFAULT: {
      email: "support@muckaway.ai",
      phone: "+44 20 7123 4567",
      address: "Global Support Center",
      hours: "24/7 Support Available"
    }
  };

  const info = contactInfo[region?.country?.toUpperCase() as keyof typeof contactInfo] || contactInfo.DEFAULT;

  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact MuckAway.ai",
    "description": "Get in touch with MuckAway.ai for muck away quotes, spoil removal services, and waste management support.",
    "url": "https://muckaway.ai/contact",
    "mainEntity": {
      "@type": "Organization",
      "name": "MuckAway.ai",
      "telephone": "+44 20 7123 4567",
      "email": "support@muckaway.ai",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "123 Construction Way",
        "addressLocality": "London",
        "postalCode": "EC1A 1BB",
        "addressCountry": "GB"
      }
    }
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "MuckAway.ai",
    "image": "https://muckaway.ai/favicon.png",
    "telephone": "+44 20 7123 4567",
    "email": "support@muckaway.ai",
    "url": "https://muckaway.ai",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Construction Way",
      "addressLocality": "London",
      "postalCode": "EC1A 1BB",
      "addressCountry": "GB"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "18:00"
      }
    ],
    "priceRange": "££",
    "areaServed": {
      "@type": "Country",
      "name": "United Kingdom"
    }
  };

  const breadcrumbSchema = {
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
        "name": "Contact",
        "item": "https://muckaway.ai/contact"
      }
    ]
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Message Sent | Contact MuckAway.ai</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Message Sent!</h1>
            <p className="text-muted-foreground mb-8">
              Thank you for contacting us. We've received your message and will respond within 24 hours.
              A confirmation email has been sent to your inbox.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => setIsSubmitted(false)}>Send Another Message</Button>
              <Button variant="outline" asChild>
                <a href="/ai-tools">Try AI Assistant</a>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        {/* Primary Meta Tags */}
        <title>Contact MuckAway.ai | Get a Quote | Muck Away Support UK</title>
        <meta name="title" content="Contact MuckAway.ai | Get a Quote | Muck Away Support UK" />
        <meta name="description" content="Contact MuckAway.ai for instant muck away quotes, spoil removal services, and waste management support. 24-hour response. Call +44 20 7123 4567 or email support@muckaway.ai." />
        <meta name="keywords" content="contact muckaway, muck away quote, spoil removal enquiry, waste management support, grab hire quote, construction waste contact" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://muckaway.ai/contact" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://muckaway.ai/contact" />
        <meta property="og:title" content="Contact MuckAway.ai | Get a Quote | Muck Away Support" />
        <meta property="og:description" content="Contact MuckAway.ai for instant muck away quotes and support. 24-hour response guaranteed." />
        <meta property="og:image" content="https://muckaway.ai/og-image.png" />
        <meta property="og:site_name" content="MuckAway.ai" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact MuckAway.ai | Get a Quote" />
        <meta name="twitter:description" content="Contact MuckAway.ai for instant muck away quotes and support." />
        <meta name="twitter:image" content="https://muckaway.ai/og-image.png" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(contactPageSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>
      
      <InternationalSEO path="/contact" />
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <MessageSquare className="w-4 h-4 mr-2" />
              Get in Touch
            </Badge>
            <h1 className="text-4xl font-bold text-foreground mb-4">Contact Us</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions about MuckAway.ai? Our team is here to help you get started with AI-powered waste management.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Send us a Message</CardTitle>
                  <CardDescription>Fill out the form and we'll respond within 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="John Smith"
                          className={errors.name ? "border-destructive" : ""}
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="john@company.com"
                          className={errors.email ? "border-destructive" : ""}
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company Name</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          placeholder="Your Company Ltd"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+44 7700 900123"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tell us about your waste management needs..."
                        rows={5}
                        className={errors.message ? "border-destructive" : ""}
                      />
                      {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                    </div>

                    <Button type="submit" variant="action" size="lg" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? "Sending..." : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground">Email</h3>
                      <a href={`mailto:${info.email}`} className="text-muted-foreground hover:text-primary transition-colors">
                        {info.email}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground">Phone</h3>
                      <a href={`tel:${info.phone}`} className="text-muted-foreground hover:text-primary transition-colors">
                        {info.phone}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground">Address</h3>
                      <p className="text-muted-foreground">{info.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground">Business Hours</h3>
                      <p className="text-muted-foreground">{info.hours}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Need Immediate Help?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Our AI chatbot is available 24/7 to answer your questions about spoil removal, compliance, and pricing.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/ai-tools">Try AI Assistant</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
