import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Users, TrendingUp, Shield, Award, CheckCircle } from 'lucide-react';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  rating: number;
}

interface SocialProofSectionProps {
  testimonials?: Testimonial[];
  showStats?: boolean;
  showTrustBadges?: boolean;
  variant?: 'full' | 'compact' | 'inline';
  className?: string;
}

const defaultTestimonials: Testimonial[] = [
  {
    quote: "MuckAway.ai saved us 40% on disposal costs. The AI classification identified materials we could recycle instead of landfill.",
    author: "James Wilson",
    role: "Site Manager",
    company: "BuildCo Construction",
    rating: 5
  },
  {
    quote: "Same-day grab hire with full compliance documentation. It's exactly what busy contractors need.",
    author: "Sarah Thompson",
    role: "Operations Director",
    company: "GroundWorks Ltd",
    rating: 5
  },
  {
    quote: "The digital waste transfer notes have streamlined our compliance. No more paper chasing.",
    author: "Michael Davies",
    role: "Owner",
    company: "Davies Demolition",
    rating: 5
  }
];

const stats = [
  { label: 'Tonnes Moved', value: '250K+', icon: TrendingUp },
  { label: 'Happy Customers', value: '5,000+', icon: Users },
  { label: 'Recycling Rate', value: '85%', icon: CheckCircle },
  { label: 'Avg Rating', value: '4.9★', icon: Star }
];

const trustBadges = [
  { label: 'EA Registered', icon: Shield },
  { label: 'ISO 14001', icon: Award },
  { label: 'CHAS Approved', icon: CheckCircle },
  { label: 'ICO Registered', icon: Shield }
];

export const SocialProofSection = ({
  testimonials = defaultTestimonials,
  showStats = true,
  showTrustBadges = true,
  variant = 'full',
  className = ''
}: SocialProofSectionProps) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-muted'}`} 
      />
    ));
  };

  if (variant === 'inline') {
    return (
      <div className={`flex flex-wrap items-center gap-4 text-sm text-muted-foreground ${className}`}>
        {stats.slice(0, 3).map((stat, idx) => (
          <span key={idx} className="flex items-center gap-1.5">
            <stat.icon className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">{stat.value}</span>
            <span>{stat.label}</span>
          </span>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Quick stats row */}
        <div className="flex flex-wrap gap-4 justify-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
              <stat.icon className="w-5 h-5 text-primary" />
              <div>
                <div className="font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Single testimonial */}
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex gap-1 mb-2">{renderStars(testimonials[0].rating)}</div>
            <p className="text-muted-foreground italic mb-3">"{testimonials[0].quote}"</p>
            <div className="text-sm">
              <span className="font-semibold">{testimonials[0].author}</span>
              <span className="text-muted-foreground"> · {testimonials[0].role}, {testimonials[0].company}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <section className={`space-y-12 ${className}`}>
      {/* Stats Bar */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center p-4 bg-muted/30 rounded-lg">
              <stat.icon className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Testimonials Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, idx) => (
          <Card key={idx} className="bg-card border-primary/10">
            <CardContent className="pt-6">
              <div className="flex gap-1 mb-3">{renderStars(testimonial.rating)}</div>
              <p className="text-muted-foreground italic mb-4">"{testimonial.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="font-bold text-primary">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trust Badges */}
      {showTrustBadges && (
        <div className="flex flex-wrap justify-center gap-3">
          {trustBadges.map((badge, idx) => (
            <Badge 
              key={idx} 
              variant="outline" 
              className="px-4 py-2 gap-2 text-sm"
            >
              <badge.icon className="w-4 h-4" />
              {badge.label}
            </Badge>
          ))}
        </div>
      )}
    </section>
  );
};
