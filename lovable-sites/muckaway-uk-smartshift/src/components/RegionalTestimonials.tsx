import { Star, Quote } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useGlobal } from "@/components/GlobalProvider";
import { getTestimonialsForRegion } from "@/config/regionalTestimonials";
import { PLATFORM_METRICS, TESTIMONIAL_DISCLAIMER } from "@/config/platformMetrics";

export const RegionalTestimonials = () => {
  const { region } = useGlobal();
  const testimonials = getTestimonialsForRegion(region?.countryCode || 'GB');
  const currencySymbol = region?.currencySymbol || '£';

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Trusted by Construction Professionals
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See what industry leaders are saying about MuckAway.ai
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <Card key={index} className="relative group hover:shadow-elegant transition-all duration-300">
              <div className="absolute top-4 right-4 text-primary/20">
                <Quote className="h-12 w-12" />
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed relative z-10">
                  "{testimonial.content}"
                </p>
              </CardHeader>
              
              <CardContent>
                <div className="border-t border-border pt-4">
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  <div className="text-sm text-primary">{testimonial.company}</div>
                  <div className="mt-2 text-xs text-muted-foreground italic">
                    Project: {testimonial.project}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Bar - using consistent platform metrics */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary mb-2">{PLATFORM_METRICS.companies}</div>
            <div className="text-muted-foreground">{PLATFORM_METRICS.companiesLabel}</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent mb-2">{PLATFORM_METRICS.satisfaction}</div>
            <div className="text-muted-foreground">{PLATFORM_METRICS.satisfactionLabel}</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">{PLATFORM_METRICS.jobs}</div>
            <div className="text-muted-foreground">{PLATFORM_METRICS.jobsLabel}</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent mb-2">{PLATFORM_METRICS.getProcessedValue(currencySymbol)}</div>
            <div className="text-muted-foreground">{PLATFORM_METRICS.processedLabel}</div>
          </div>
        </div>
        
        <p className="text-center text-xs text-muted-foreground mt-6 italic">{TESTIMONIAL_DISCLAIMER}</p>
      </div>
    </section>
  );
};
