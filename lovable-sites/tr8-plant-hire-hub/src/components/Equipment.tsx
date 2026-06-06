import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import excavatorWork from "@/assets/excavator-work.jpg";
import brokkDemolition from "@/assets/brokk-demolition.jpg";
import plateCompactor from "@/assets/plate-compactor.jpg";
import cementMixer from "@/assets/cement-mixer.jpg";

const equipment = [
  {
    image: excavatorWork,
    title: "Mini Excavators",
    description: "1.5 - 3 tonne diggers perfect for domestic and commercial projects",
    href: "/equipment-hire",
  },
  {
    image: brokkDemolition,
    title: "Brokk Demolition Robot",
    description: "Remote-controlled demolition for confined spaces and precision work",
    href: "/services/demolition",
  },
  {
    image: plateCompactor,
    title: "Plate Compactors",
    description: "Professional grade compaction equipment for groundworks",
    href: "/equipment-hire",
  },
  {
    image: cementMixer,
    title: "Cement Mixers",
    description: "Reliable mixers with generators for any job site",
    href: "/equipment-hire",
  },
];

const Equipment = () => {
  return (
    <section id="equipment" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-primary font-display uppercase tracking-wider text-sm">Our Fleet</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 mb-6">
            Quality <span className="text-gradient">Equipment</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Well-maintained, modern equipment ready for delivery to your site.
          </p>
        </div>

        {/* Equipment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {equipment.map((item) => (
            <Link
              key={item.title}
              to={item.href}
              className="group relative overflow-hidden rounded-lg card-industrial block"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="font-display text-2xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground mb-3">
                  {item.description}
                </p>
                <span className="inline-flex items-center gap-2 text-primary font-display text-sm uppercase tracking-wider group-hover:gap-3 transition-all">
                  View Details <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-6">
            Need something specific? We have a wide range of equipment available.
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/equipment-hire">View Full Equipment List</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Equipment;
