import { CheckCircle2 } from "lucide-react";
import tr8Logo from "@/assets/tr8-logo-main.jpg";

const features = [
  "Fully insured and licensed operators",
  "Competitive daily and weekly rates",
  "Delivery and collection service",
  "24/7 emergency availability",
  "Modern, well-maintained equipment",
  "Free quotes and site assessments",
];

const About = () => {
  return (
    <section id="about" className="py-24 bg-tr8-charcoal">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image Side */}
          <div className="relative">
            <div className="aspect-square rounded-lg overflow-hidden card-industrial">
              <div className="w-full h-full bg-background flex items-center justify-center p-12">
                <img
                  src={tr8Logo}
                  alt="TR8 Plant Hire Logo"
                  className="w-full max-w-md object-contain"
                />
              </div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/20 rounded-lg -z-10" />
            <div className="absolute -top-6 -left-6 w-32 h-32 border-2 border-primary/30 rounded-lg -z-10" />
          </div>

          {/* Content Side */}
          <div>
            <span className="text-primary font-display uppercase tracking-wider text-sm">About TR8</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 mb-6">
              Your Local <span className="text-gradient">Plant Hire</span> Specialists
            </h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              TR8 Plant Hire & Services provides professional plant hire, demolition, and specialist services 
              to contractors and homeowners across the region. With years of experience in the industry, 
              we pride ourselves on reliability, quality equipment, and exceptional customer service.
            </p>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Whether you need a mini excavator for a weekend project or a complete demolition service, 
              we have the equipment and expertise to get the job done right.
            </p>

            {/* Features List */}
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
