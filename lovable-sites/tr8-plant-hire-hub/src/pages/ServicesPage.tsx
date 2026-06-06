import { Link } from "react-router-dom";
import { ArrowRight, Phone } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { services } from "@/data/services";

const ServicesPage = () => {
  return (
    <>
      <SEO
        title="Plant Hire, Demolition & Asbestos Services | TR8 Plant Hire | 07746 159 640"
        description="Professional plant hire, demolition, asbestos removal & groundworks services. Experienced operators, quality equipment. Serving Hampshire, Surrey & beyond. Call 07746 159 640."
        canonical="https://tr8planthire.com/services"
      />

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="py-16 md:py-24 bg-secondary relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="container mx-auto px-6 relative z-10">
              <div className="max-w-3xl">
                <span className="text-primary font-display uppercase tracking-wider text-sm">What We Do</span>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6">
                  Professional <span className="text-gradient">Services</span>
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl max-w-2xl">
                  From plant hire to specialist demolition, we provide comprehensive solutions for all your construction and earthmoving needs.
                </p>
              </div>
            </div>
          </section>

          {/* Services Grid */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service) => {
                  const IconComponent = service.icon;
                  return (
                    <Link
                      key={service.id}
                      to={service.href}
                      className="card-industrial p-8 group hover:border-primary/50 transition-all duration-300"
                    >
                      <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="w-7 h-7 text-primary" />
                      </div>
                      <h2 className="font-display text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                        {service.title}
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        {service.shortDescription}
                      </p>
                      <ul className="space-y-2 mb-6">
                        {service.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="text-sm text-foreground/80 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center gap-2 text-primary font-display uppercase tracking-wider text-sm group-hover:gap-4 transition-all">
                        Learn More <ArrowRight className="w-4 h-4" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 md:py-24 bg-secondary">
            <div className="container mx-auto px-6 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Need Help With Your <span className="text-gradient">Project</span>?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                Get in touch today for a free, no-obligation quote. We're here to help with all your plant hire and construction needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="tel:07746159640" className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Call 07746 159 640
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/contact">Request a Quote</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ServicesPage;
