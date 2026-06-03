import { Link } from "react-router-dom";
import { Phone, Truck, Check, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getServiceById } from "@/data/services";
import excavatorHero from "@/assets/excavator-hero.jpg";

const PlantHire = () => {
  const service = getServiceById("plant-hire");

  const equipment = [
    { name: "Mini Excavators", sizes: "0.8T - 3T", description: "Perfect for tight access and garden projects" },
    { name: "Midi Excavators", sizes: "3T - 8T", description: "Ideal for larger groundworks and construction" },
    { name: "Tracked Dumpers", sizes: "Various", description: "Efficient material transport on any terrain" },
    { name: "Cement Mixers", sizes: "Various", description: "Professional mixing for all concrete work" },
    { name: "Plate Compactors", sizes: "Various", description: "Essential for ground preparation" },
  ];

  return (
    <>
      <SEO
        title="Plant Hire | Mini Excavators, Dumpers & Equipment | TR8 Plant Hire | 07746 159 640"
        description="Quality plant hire including mini excavators (0.8T-8T), tracked dumpers & construction equipment. Competitive daily/weekly rates with delivery. Serving Hampshire & Surrey. Call 07746 159 640."
        canonical="https://tr8planthire.com/services/plant-hire"
      />

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="relative py-24 md:py-32 overflow-hidden">
            <div className="absolute inset-0">
              <img 
                src={excavatorHero} 
                alt="Mini excavator available for plant hire from TR8" 
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
                  Plant <span className="text-gradient">Hire</span>
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl mb-8">
                  {service?.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/equipment-hire">View Equipment</Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <a href="tel:07746159640" className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Get a Quote
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="py-16 md:py-24 bg-secondary">
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                    Why Choose Our <span className="text-gradient">Plant Hire</span>?
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
                  <Truck className="w-12 h-12 text-primary mb-4" />
                  <h3 className="font-display text-2xl font-bold mb-4">Delivery Included</h3>
                  <p className="text-muted-foreground mb-6">
                    All our plant hire includes delivery and collection within our service area. We'll get your equipment to site when you need it and collect it when you're done.
                  </p>
                  <Button variant="hero" asChild>
                    <Link to="/contact">Enquire Now</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Equipment List */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  Available <span className="text-gradient">Equipment</span>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Browse our range of quality plant and machinery available for hire.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {equipment.map((item, idx) => (
                  <div key={idx} className="card-industrial p-6">
                    <h3 className="font-display text-xl font-bold mb-1">{item.name}</h3>
                    <p className="text-primary text-sm font-medium mb-2">{item.sizes}</p>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/equipment-hire" className="flex items-center gap-2">
                    View Full Equipment List <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 md:py-24 bg-secondary">
            <div className="container mx-auto px-6 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Ready to <span className="text-gradient">Hire</span>?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                Call us today for competitive rates and fast delivery.
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

export default PlantHire;
