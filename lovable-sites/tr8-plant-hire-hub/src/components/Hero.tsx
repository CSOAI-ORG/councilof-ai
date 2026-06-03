import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/excavator-hero.jpg";

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="TR8 Plant Hire excavator at work"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <div className="inline-block mb-6 animate-fade-in">
            <span className="bg-primary/20 text-primary px-4 py-2 rounded-full font-display text-sm uppercase tracking-wider border border-primary/30">
              Professional Plant Hire Services
            </span>
          </div>
          
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-none animate-slide-up">
            <span className="text-foreground">DEMOLITION</span>
            <br />
            <span className="text-gradient">PLANT HIRE</span>
            <br />
            <span className="text-foreground">& SERVICES</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Professional plant hire and demolition services across the UK. 
            Quality equipment, reliable service, competitive rates.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" asChild>
              <a href="#contact">
                Get a Free Quote
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
            <Button variant="industrial" size="xl" asChild>
              <a href="tel:07746159640">
                <Phone className="w-5 h-5 mr-2" />
                07746 159 640
              </a>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap gap-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-primary">10+</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Projects Completed</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Support Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary/50 flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
