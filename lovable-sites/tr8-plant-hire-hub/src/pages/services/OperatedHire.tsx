import { Link } from "react-router-dom";
import { Phone, Check, HardHat, Users } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getServiceById } from "@/data/services";
import excavatorAction from "@/assets/excavator-action.jpg";

const OperatedHire = () => {
  const service = getServiceById("operated-hire");

  const benefits = [
    { title: "CPCS Qualified", description: "All operators hold valid CPCS cards and relevant certifications." },
    { title: "Experienced", description: "Years of experience across excavation, demolition, and groundworks." },
    { title: "Insured", description: "Full public liability and employers liability insurance." },
    { title: "Flexible", description: "Available for single days, weeks, or longer-term contracts." },
  ];

  return (
    <>
      <SEO
        title="Operated Hire | CPCS Operators & Machinery | TR8 Plant Hire | 07746 159 640"
        description="Experienced CPCS qualified operators with excavators, diggers & plant machinery. Fully insured operated hire for excavation, demolition & groundworks. Call 07746 159 640."
        canonical="https://tr8planthire.com/services/operated-hire"
      />

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="relative py-24 md:py-32 overflow-hidden">
            <div className="absolute inset-0">
              <img 
                src={excavatorAction} 
                alt="Experienced CPCS operator with excavator on construction site" 
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
                  Operated <span className="text-gradient">Hire</span>
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl mb-8">
                  {service?.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="hero" size="lg" asChild>
                    <a href="tel:07746159640" className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Book Now
                    </a>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/contact">Get a Quote</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Why Operated Hire */}
          <section className="py-16 md:py-24 bg-secondary">
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                    <HardHat className="w-5 h-5" />
                    <span className="font-display text-sm uppercase tracking-wider">Professional Operators</span>
                  </div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                    Let Us Do the <span className="text-gradient">Heavy Lifting</span>
                  </h2>
                  <p className="text-muted-foreground text-lg mb-8">
                    Not everyone needs just the machine – sometimes you need the expertise too. Our operated hire service provides experienced, qualified operators along with well-maintained machinery to get your job done efficiently and safely.
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
                <div className="grid grid-cols-2 gap-4">
                  {benefits.map((benefit, idx) => (
                    <div key={idx} className="card-industrial p-6">
                      <h3 className="font-display text-lg font-bold mb-2 text-primary">{benefit.title}</h3>
                      <p className="text-muted-foreground text-sm">{benefit.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* What We Cover */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  What We <span className="text-gradient">Cover</span>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Our operators are skilled in a wide range of tasks and equipment.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="card-industrial p-6 text-center">
                  <Users className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-display text-xl font-bold mb-2">Excavation</h3>
                  <p className="text-muted-foreground text-sm">
                    Foundations, trenches, drainage, site clearance.
                  </p>
                </div>
                <div className="card-industrial p-6 text-center">
                  <Users className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-display text-xl font-bold mb-2">Demolition</h3>
                  <p className="text-muted-foreground text-sm">
                    Structural demolition, strip-outs, breaking.
                  </p>
                </div>
                <div className="card-industrial p-6 text-center">
                  <Users className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-display text-xl font-bold mb-2">Groundworks</h3>
                  <p className="text-muted-foreground text-sm">
                    Landscaping, driveways, general groundworks.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 md:py-24 bg-secondary">
            <div className="container mx-auto px-6 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Need an <span className="text-gradient">Operator</span>?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                Get in touch to discuss your project requirements.
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

export default OperatedHire;
