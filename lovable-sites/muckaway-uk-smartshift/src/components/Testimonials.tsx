import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { PLATFORM_METRICS, TESTIMONIAL_DISCLAIMER } from "@/config/platformMetrics";

interface Testimonial {
  name: string;
  company: string;
  role: string;
  content: string;
  rating: number;
  project: string;
}

// Using fictional company names to avoid implying partnerships
const testimonials: Testimonial[] = [
  {
    name: "James M.",
    company: "Major Infrastructure Contractor",
    role: "Site Manager",
    content: "MuckAway.ai transformed our waste management process. The AI classification saved us thousands in misclassified disposal costs. The voice interface means our team can book removals without leaving the excavator.",
    rating: 5,
    project: "Rail Infrastructure Project",
  },
  {
    name: "Sarah T.",
    company: "Regional Construction Group",
    role: "Project Director",
    content: "Instant compliance documentation and hazardous waste tracking gave us complete peace of mind. The AI correctly identified contaminated soil that visual inspection missed. Absolutely essential for modern construction.",
    rating: 5,
    project: "Residential Development",
  },
  {
    name: "David C.",
    company: "Commercial Development Firm",
    role: "Operations Manager",
    content: "We process hundreds of tonnes weekly. MuckAway.ai's predictive analytics and automated scheduling significantly reduced our logistics costs. The real-time pricing is incredibly accurate compared to traditional quotes.",
    rating: 5,
    project: "Mixed-Use Development",
  },
  {
    name: "Emma R.",
    company: "National Building Contractor",
    role: "Sustainability Lead",
    content: "The environmental impact tracking and AI-powered route optimization align perfectly with our net-zero targets. Being able to prove compliance with detailed records has been invaluable for audits.",
    rating: 5,
    project: "Commercial Quarter Project",
  },
  {
    name: "Robert A.",
    company: "Civil Engineering Company",
    role: "Commercial Manager",
    content: "The subscription model is transparent and the ROI was immediate. We went from 48-hour quote turnaround to instant pricing. The integration with our existing systems was seamless.",
    rating: 5,
    project: "Infrastructure Upgrade",
  },
  {
    name: "Lisa P.",
    company: "Heavy Civil Contractor",
    role: "Health & Safety Officer",
    content: "Safety compliance features are outstanding. Automated hazardous material tracking, driver verification, and real-time alerts have significantly improved our site safety records. This is the future of waste management.",
    rating: 5,
    project: "Underground Works",
  },
];

export const Testimonials = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Trusted by Construction Professionals
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join construction professionals saving time and money with AI-powered waste management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-glow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                
                <div className="relative mb-4">
                  <Quote className="absolute -top-2 -left-2 w-8 h-8 text-primary/20" />
                  <p className="text-muted-foreground italic pl-6">
                    "{testimonial.content}"
                  </p>
                </div>

                <div className="border-t border-border/50 pt-4 mt-4">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  <p className="text-sm font-medium text-primary mt-1">{testimonial.company}</p>
                  <p className="text-xs text-muted-foreground mt-1">{testimonial.project}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-4 px-8 py-4 bg-muted/50 rounded-lg border border-border/50">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{PLATFORM_METRICS.companies}</p>
              <p className="text-sm text-muted-foreground">{PLATFORM_METRICS.companiesLabel}</p>
            </div>
            <div className="w-px h-12 bg-border/50"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{PLATFORM_METRICS.jobs}</p>
              <p className="text-sm text-muted-foreground">{PLATFORM_METRICS.jobsLabel}</p>
            </div>
            <div className="w-px h-12 bg-border/50"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{PLATFORM_METRICS.satisfaction}</p>
              <p className="text-sm text-muted-foreground">{PLATFORM_METRICS.satisfactionLabel}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">{TESTIMONIAL_DISCLAIMER}</p>
        </div>
      </div>
    </section>
  );
};
