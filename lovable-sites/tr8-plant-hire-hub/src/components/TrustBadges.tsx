import { Shield, Award, CheckCircle, FileCheck, HardHat } from "lucide-react";

const TrustBadges = () => {
  const badges = [
    {
      icon: HardHat,
      title: "CSCS",
      subtitle: "Registered",
      description: "All operatives hold valid CSCS cards",
    },
    {
      icon: Shield,
      title: "SafeContractor",
      subtitle: "Approved",
      description: "Health & safety accredited",
    },
    {
      icon: FileCheck,
      title: "Public Liability",
      subtitle: "£5M Cover",
      description: "Fully insured operations",
    },
    {
      icon: Award,
      title: "CPCS",
      subtitle: "Qualified",
      description: "Certified plant operators",
    },
    {
      icon: CheckCircle,
      title: "Waste Carrier",
      subtitle: "Licensed",
      description: "Legal waste disposal",
    },
  ];

  return (
    <section className="py-12 bg-background border-y border-border/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <span className="text-primary font-display uppercase tracking-wider text-sm">
            Trusted & Accredited
          </span>
          <h2 className="font-display text-2xl md:text-3xl font-bold mt-2">
            Professional <span className="text-gradient">Credentials</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {badges.map((badge, index) => {
            const IconComponent = badge.icon;
            return (
              <div
                key={index}
                className="group flex flex-col items-center text-center p-4 md:p-6 rounded-xl bg-secondary/50 border border-border/50 hover:border-primary/30 hover:bg-secondary transition-all duration-300"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-tr8 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
                </div>
                <h3 className="font-display font-bold text-sm md:text-base text-foreground">
                  {badge.title}
                </h3>
                <span className="text-primary text-xs md:text-sm font-medium">
                  {badge.subtitle}
                </span>
                <p className="text-muted-foreground text-xs mt-1 hidden md:block">
                  {badge.description}
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-center text-muted-foreground text-sm mt-8 max-w-2xl mx-auto">
          We take health, safety, and compliance seriously. All documentation available on request.
        </p>
      </div>
    </section>
  );
};

export default TrustBadges;
