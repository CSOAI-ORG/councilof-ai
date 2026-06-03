import { Link } from "react-router-dom";
import { Phone, Check, Shovel, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getServiceById } from "@/data/services";
import diggerGroundwork from "@/assets/digger-groundwork.jpg";

const Groundworks = () => {
  const service = getServiceById("groundworks");

  const services = [
    { title: "Site Clearance", description: "Removing vegetation, debris, and existing structures." },
    { title: "Excavation", description: "Precision excavation for foundations and basements." },
    { title: "Foundations", description: "Strip, trench, and raft foundations for all building types." },
    { title: "Drainage", description: "Foul and surface water drainage installation." },
    { title: "Hard Landscaping", description: "Patios, paths, retaining walls, and outdoor spaces." },
    { title: "Driveways", description: "Complete driveway construction from sub-base to finish." },
  ];

  return (
    <>
      <SEO
        title="Groundworks Services | Foundations, Drainage, Landscaping | TR8 Plant Hire | 07746 159 640"
        description="Complete groundworks services including site clearance, excavation, foundations, drainage & landscaping. Residential & commercial projects. Call 07746 159 640 for a quote."
        canonical="https://tr8planthire.com/services/groundworks"
      />

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="relative py-24 md:py-32 overflow-hidden">
            <div className="absolute inset-0">
              <img 
                src={diggerGroundwork} 
                alt="Digger performing groundworks excavation for foundations" 
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
                  Professional <span className="text-gradient">Groundworks</span>
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

          {/* Services Grid */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  Our Groundworks <span className="text-gradient">Services</span>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  From initial site clearance to finished landscaping, we handle every stage of your groundworks project.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {services.map((item, idx) => (
                  <div key={idx} className="card-industrial p-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Shovel className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-display text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="py-16 md:py-24 bg-secondary">
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
                <div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                    Why Choose <span className="text-gradient">TR8</span>?
                  </h2>
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
                  <h3 className="font-display text-2xl font-bold mb-4">Projects We Handle</h3>
                  <ul className="space-y-3 mb-6">
                    <li className="text-muted-foreground">• Residential extensions</li>
                    <li className="text-muted-foreground">• New build foundations</li>
                    <li className="text-muted-foreground">• Commercial developments</li>
                    <li className="text-muted-foreground">• Garden transformations</li>
                    <li className="text-muted-foreground">• Driveway construction</li>
                  </ul>
                  <Button variant="hero" asChild>
                    <Link to="/contact" className="flex items-center gap-2">
                      Discuss Your Project <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-6 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Start Your <span className="text-gradient">Project</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                Contact us for a free site visit and quotation.
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

export default Groundworks;
