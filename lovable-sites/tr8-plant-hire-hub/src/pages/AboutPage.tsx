import { Link } from "react-router-dom";
import { Phone, Shield, Award, Users, Clock, Truck } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import excavatorWork from "@/assets/excavator-work.jpg";

const AboutPage = () => {
  const stats = [
    { icon: Clock, value: "24/7", label: "Emergency Callout" },
    { icon: Truck, value: "Fast", label: "Delivery Service" },
    { icon: Shield, value: "Fully", label: "Insured" },
    { icon: Award, value: "Quality", label: "Guaranteed" },
  ];

  const values = [
    {
      icon: Shield,
      title: "Safety First",
      description: "Every job we undertake prioritises the safety of our team, our clients, and the public. We are fully certified and insured."
    },
    {
      icon: Award,
      title: "Quality Equipment",
      description: "Our fleet is regularly maintained and upgraded to ensure reliable performance on every project."
    },
    {
      icon: Users,
      title: "Experienced Team",
      description: "Our operators and staff bring years of experience across plant hire, demolition, and groundworks."
    },
    {
      icon: Clock,
      title: "Reliable Service",
      description: "We turn up when we say we will and get the job done efficiently. Our reputation depends on it."
    },
  ];

  return (
    <>
      <SEO
        title="About TR8 Plant Hire | Local Plant Hire Experts | 07746 159 640"
        description="Learn about TR8 Plant Hire & Services - your trusted local partner for plant hire, demolition & asbestos removal. Experienced team, fully insured, quality guaranteed. Call 07746 159 640."
        canonical="https://tr8planthire.com/about"
      />

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="py-16 md:py-24 bg-secondary relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="container mx-auto px-6 relative z-10">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <span className="text-primary font-display uppercase tracking-wider text-sm">About TR8</span>
                  <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6">
                    Your Local <span className="text-gradient">Plant Hire</span> Experts
                  </h1>
                  <p className="text-muted-foreground text-lg md:text-xl mb-8">
                    TR8 Plant Hire & Services provides professional plant hire, demolition, and asbestos removal services. We pride ourselves on quality equipment, experienced operators, and reliable service.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="hero" size="lg" asChild>
                      <Link to="/contact">Get a Quote</Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                      <a href="tel:07746159640" className="flex items-center gap-2">
                        <Phone className="w-5 h-5" />
                        Call Us
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <img 
                    src={excavatorWork} 
                    alt="TR8 excavator at work on construction site" 
                    className="rounded-lg shadow-2xl"
                  />
                  <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-6 rounded-lg shadow-lg">
                    <p className="font-display text-2xl font-bold">Trusted</p>
                    <p className="text-sm opacity-90">Local Service</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Bar */}
          <section className="py-8 bg-primary">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, idx) => {
                  const IconComponent = stat.icon;
                  return (
                    <div key={idx} className="text-center">
                      <IconComponent className="w-8 h-8 mx-auto mb-2 text-primary-foreground/80" />
                      <p className="font-display text-2xl font-bold text-primary-foreground">{stat.value}</p>
                      <p className="text-primary-foreground/80 text-sm">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Our Story */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center mb-16">
                <span className="text-primary font-display uppercase tracking-wider text-sm">Our Story</span>
                <h2 className="font-display text-3xl md:text-4xl font-bold mt-4 mb-6">
                  Built on <span className="text-gradient">Experience</span>
                </h2>
                <p className="text-muted-foreground text-lg">
                  TR8 Plant Hire & Services was founded with a simple mission: to provide reliable, professional plant hire and construction services to the local community. We've grown from a single machine to a comprehensive fleet, but our commitment to quality and customer service remains unchanged.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {values.map((value, idx) => {
                  const IconComponent = value.icon;
                  return (
                    <div key={idx} className="card-industrial p-6 text-center">
                      <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="font-display text-xl font-bold mb-3">{value.title}</h3>
                      <p className="text-muted-foreground text-sm">{value.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* What We Offer */}
          <section className="py-16 md:py-24 bg-secondary">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                  What We <span className="text-gradient">Offer</span>
                </h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Truck className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">Plant Hire</h3>
                  <p className="text-muted-foreground text-sm">
                    Mini excavators, tracked dumpers, and specialist equipment for hire.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">Demolition</h3>
                  <p className="text-muted-foreground text-sm">
                    Specialist demolition with Brokk robots for precision and safety.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">Asbestos</h3>
                  <p className="text-muted-foreground text-sm">
                    Licensed asbestos removal with full certification and compliance.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-6 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Ready to Work <span className="text-gradient">Together</span>?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                Get in touch today for a free quote on any of our services.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="tel:07746159640" className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    07746 159 640
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/services">View Services</Link>
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

export default AboutPage;
