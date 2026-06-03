import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink } from "lucide-react";
import { services } from "@/data/services";

const Services = () => {
  return (
    <section id="trade-verticals" className="py-24 bg-tr8-charcoal">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-primary font-display uppercase tracking-wider text-sm">The Trade Stack</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 mb-6">
            Four <span className="text-gradient">Trade Verticals</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Each vertical is a standalone SaaS — but they share auth, billing, compliance, and the same nine MCP servers. Pick one. Bolt on the others when you're ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, index) => {
            const IconComponent = service.icon;

            const cardInner = (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="w-7 h-7 text-primary" />
                  </div>
                  {service.external && (
                    <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
                <h3 className="font-display text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {service.shortDescription}
                </p>
                <ul className="space-y-1.5 mb-6">
                  {service.features.slice(0, 4).map((feature) => (
                    <li key={feature} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">›</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <span className="inline-flex items-center gap-2 text-primary font-display text-sm uppercase tracking-wider group-hover:gap-3 transition-all">
                  {service.external ? "Visit Site" : "Browse MCPs"} <ArrowRight className="w-4 h-4" />
                </span>
              </>
            );

            return service.external ? (
              <a
                key={service.id}
                href={service.href}
                target="_blank"
                rel="noopener noreferrer"
                className="card-industrial p-8 group hover:border-primary transition-all duration-500 block"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {cardInner}
              </a>
            ) : (
              <Link
                key={service.id}
                to={service.href}
                className="card-industrial p-8 group hover:border-primary transition-all duration-500 block"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {cardInner}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
