import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Award } from "lucide-react";

interface EnhancedCTAProps {
  title: string;
  description: string;
  primaryAction?: {
    text: string;
    href: string;
    external?: boolean;
  };
  secondaryAction?: {
    text: string;
    href: string;
    external?: boolean;
  };
  showQuote?: boolean;
  variant?: "default" | "compact";
}

const EnhancedCTA = ({ 
  title, 
  description, 
  primaryAction = { text: "Get Free Quote", href: "/quote" },
  secondaryAction = { text: "Call: 07958 710 548", href: "tel:07958710548", external: true },
  showQuote = false,
  variant = "default"
}: EnhancedCTAProps) => {
  
  if (variant === "compact") {
    return (
      <section className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">{title}</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">{description}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {primaryAction.external ? (
              <Button asChild variant="cta" size="lg">
                <a href={primaryAction.href}>{primaryAction.text}</a>
              </Button>
            ) : (
              <Button asChild variant="cta" size="lg">
                <Link to={primaryAction.href}>{primaryAction.text}</Link>
              </Button>
            )}
            {secondaryAction.external ? (
              <Button asChild variant="navy" size="lg">
                <a href={secondaryAction.href}>
                  <Phone className="mr-2 w-5 h-5" />
                  {secondaryAction.text}
                </a>
              </Button>
            ) : (
              <Button asChild variant="navy" size="lg">
                <Link to={secondaryAction.href}>{secondaryAction.text}</Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="hero-gradient text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <Award className="w-16 h-16 text-[hsl(var(--gts-yellow))] mx-auto mb-6" />
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">{title}</h2>
        <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto leading-relaxed">{description}</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          {primaryAction.external ? (
            <Button asChild variant="cta" size="xl">
              <a href={primaryAction.href}>{primaryAction.text}</a>
            </Button>
          ) : (
            <Button asChild variant="cta" size="xl">
              <Link to={primaryAction.href}>{primaryAction.text}</Link>
            </Button>
          )}
          {secondaryAction.external ? (
            <Button asChild variant="outlineWhite" size="xl">
              <a href={secondaryAction.href}>
                <Phone className="mr-2 w-5 h-5" />
                {secondaryAction.text}
              </a>
            </Button>
          ) : (
            <Button asChild variant="outlineWhite" size="xl">
              <Link to={secondaryAction.href}>{secondaryAction.text}</Link>
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center text-gray-300 text-sm mt-6">
          <span>✓ Environment Agency Licensed</span>
          <span>✓ Fully Insured Operations</span>
          <span>✓ 24/7 Emergency Service</span>
          <span>✓ Same Day Service Available</span>
        </div>
      </div>
    </section>
  );
};

export default EnhancedCTA;