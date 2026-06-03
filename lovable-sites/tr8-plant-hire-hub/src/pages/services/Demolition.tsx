import { Link } from "react-router-dom";
import { Phone, Check, Hammer, AlertTriangle } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getServiceById } from "@/data/services";
import brokkDemolition from "@/assets/brokk-demolition.jpg";

const Demolition = () => {
  const service = getServiceById("demolition");

  const capabilities = [
    "Commercial building demolition",
    "Internal strip-outs",
    "Structural alterations",
    "Confined space work",
    "Heritage building work",
    "Industrial demolition",
  ];

  return (
    <>
      <SEO
        title="Demolition Services | Brokk Robot Demolition | TR8 Plant Hire | 07746 159 640"
        description="Specialist demolition services with Brokk robots for precision work. Internal strip-outs, structural demolition, confined spaces. Fully insured & certified. Call 07746 159 640."
        canonical="https://tr8planthire.com/services/demolition"
      />

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="relative py-24 md:py-32 overflow-hidden">
            <div className="absolute inset-0">
              <img 
                src={brokkDemolition} 
                alt="Brokk demolition robot in action for precision demolition work" 
                className="w-full h-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
            </div>
            <div className="container mx-auto px-6 relative z-10">
              <div className="max-w-2xl">
                <Link 
                  to="/services" 
                  className="text-primary font-display uppercase tracking-wider text-sm hover:underline inline-flex items-center gap-2 mb-4"
                >
                  ← Back to Services
                </Link>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                  Specialist <span className="text-gradient">Demolition</span>
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl mb-8">
                  {service?.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="hero" size="lg" asChild>
                    <a href="tel:07746159640" className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Get a Quote
                    </a>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/contact">Send Enquiry</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Brokk Feature */}
          <section className="py-16 md:py-24 bg-secondary">
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                    <Hammer className="w-5 h-5" />
                    <span className="font-display text-sm uppercase tracking-wider">Advanced Technology</span>
                  </div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                    Brokk <span className="text-gradient">Demolition Robots</span>
                  </h2>
                  <p className="text-muted-foreground text-lg mb-6">
                    Our Brokk demolition robots allow us to work in spaces and situations where traditional demolition methods aren't possible or safe. Remote-controlled and incredibly precise, they're the future of demolition.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary" />
                      <span>Remote-controlled for operator safety</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary" />
                      <span>Works in confined spaces</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary" />
                      <span>Precision demolition with minimal disruption</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary" />
                      <span>Reduced noise and vibration</span>
                    </li>
                  </ul>
                </div>
                <div className="card-industrial p-8">
                  <h3 className="font-display text-2xl font-bold mb-4">What We Offer</h3>
                  <div className="space-y-4">
                    {service?.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-foreground">{feature}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Capabilities */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  Our <span className="text-gradient">Capabilities</span>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  From small internal strip-outs to large-scale structural demolition, we have the equipment and expertise.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {capabilities.map((item, idx) => (
                  <div key={idx} className="card-industrial p-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Hammer className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-display font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Safety Notice */}
          <section className="py-16 md:py-24 bg-secondary">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto card-industrial p-8 border-l-4 border-primary">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-8 h-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-display text-xl font-bold mb-2">Safety Is Our Priority</h3>
                    <p className="text-muted-foreground">
                      All our demolition work is carried out by trained professionals with full insurance and certification. We follow strict health and safety protocols and ensure proper waste disposal for every project.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-6 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Need Demolition <span className="text-gradient">Expertise</span>?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                Contact us for a free site survey and quotation.
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="tel:07746159640" className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  07746 159 640
                </a>
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Demolition;
