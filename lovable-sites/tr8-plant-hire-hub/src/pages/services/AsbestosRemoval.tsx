import { Link } from "react-router-dom";
import { Phone, Check, Shield, AlertTriangle, FileCheck } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getServiceById } from "@/data/services";

const AsbestosRemoval = () => {
  const service = getServiceById("asbestos-removal");

  const process = [
    { step: "1", title: "Survey", description: "We conduct a thorough survey to identify asbestos-containing materials." },
    { step: "2", title: "Plan", description: "A detailed removal plan is created following all regulations." },
    { step: "3", title: "Remove", description: "Licensed contractors safely remove all asbestos materials." },
    { step: "4", title: "Dispose", description: "Proper disposal at licensed facilities with full certification." },
  ];

  return (
    <>
      <SEO
        title="Asbestos Removal Services | Licensed & Certified | TR8 Plant Hire | 07746 159 640"
        description="Licensed asbestos removal & disposal services. Full surveys, safe removal, air clearance certification. Residential & commercial properties. Call 07746 159 640 for a quote."
        canonical="https://tr8planthire.com/services/asbestos-removal"
      />

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="py-24 md:py-32 bg-secondary relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="container mx-auto px-6 relative z-10">
              <div className="max-w-2xl">
                <Link 
                  to="/services" 
                  className="text-primary font-display uppercase tracking-wider text-sm hover:underline inline-flex items-center gap-2 mb-4"
                >
                  ← Back to Services
                </Link>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                  <Shield className="w-5 h-5" />
                  <span className="font-display text-sm uppercase tracking-wider">Licensed Contractors</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                  Asbestos <span className="text-gradient">Removal</span>
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
                    <Link to="/contact">Request Survey</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Warning Banner */}
          <section className="py-8 bg-primary">
            <div className="container mx-auto px-6">
              <div className="flex items-center justify-center gap-4 text-primary-foreground">
                <AlertTriangle className="w-6 h-6" />
                <p className="font-display text-lg">
                  Asbestos is dangerous. Always use licensed professionals for removal.
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                    Safe & <span className="text-gradient">Compliant</span> Removal
                  </h2>
                  <p className="text-muted-foreground text-lg mb-8">
                    Asbestos removal must be carried out by licensed contractors to protect health and ensure legal compliance. Our team is fully trained, licensed, and insured to handle all types of asbestos-containing materials.
                  </p>
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
                <div className="card-industrial p-8">
                  <FileCheck className="w-12 h-12 text-primary mb-4" />
                  <h3 className="font-display text-2xl font-bold mb-4">Full Certification</h3>
                  <p className="text-muted-foreground mb-6">
                    Every job comes with complete documentation including surveys, removal certificates, and disposal records. You'll have full peace of mind that the work has been done safely and legally.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span>Pre-removal survey report</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span>Method statement</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span>Waste disposal certificate</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span>Air clearance certificate</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Process */}
          <section className="py-16 md:py-24 bg-secondary">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  Our <span className="text-gradient">Process</span>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  A structured approach ensures safe and compliant removal every time.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {process.map((item, idx) => (
                  <div key={idx} className="card-industrial p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-tr8 flex items-center justify-center mx-auto mb-4">
                      <span className="font-display text-xl font-bold text-primary-foreground">{item.step}</span>
                    </div>
                    <h3 className="font-display text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-6 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Suspect <span className="text-gradient">Asbestos</span>?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                Don't take risks. Contact us for a professional survey and safe removal.
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

export default AsbestosRemoval;
