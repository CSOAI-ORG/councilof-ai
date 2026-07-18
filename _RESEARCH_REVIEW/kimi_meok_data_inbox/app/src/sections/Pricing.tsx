import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Check, Minus, Zap, Building2, Users } from 'lucide-react';

const tiers = [
  {
    name: 'Free',
    price: 'GBP 0',
    period: '/month',
    description: 'Open datasets for developers and researchers',
    icon: Users,
    features: [
      { text: '100 API requests/day', included: true },
      { text: 'Monthly data updates', included: true },
      { text: '3 core datasets', included: true },
      { text: 'Public attestation verify', included: true },
      { text: 'Community support', included: true },
      { text: 'Real-time feeds', included: false },
      { text: 'Signed exports', included: false },
      { text: 'Custom pipelines', included: false },
    ],
    cta: 'Get Started',
    ctaVariant: 'outline' as const,
    popular: false
  },
  {
    name: 'Pro',
    price: 'GBP 79',
    period: '/month',
    description: 'Rich API access for SMEs and consultancies',
    icon: Zap,
    features: [
      { text: '10,000 API requests/day', included: true },
      { text: 'Real-time data feeds', included: true },
      { text: '10+ datasets', included: true },
      { text: 'Historical time-series', included: true },
      { text: 'Cross-domain queries', included: true },
      { text: 'HMAC-SHA256 signed exports', included: true },
      { text: 'Python & TypeScript SDKs', included: true },
      { text: 'Custom pipelines', included: false },
    ],
    cta: 'Upgrade to Pro',
    ctaVariant: 'default' as const,
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'GBP 1,499',
    period: '/month',
    description: 'Custom licensing for corporations and institutions',
    icon: Building2,
    features: [
      { text: 'Unlimited API requests', included: true },
      { text: 'Real-time + custom feeds', included: true },
      { text: '50+ datasets', included: true },
      { text: 'Custom data curation', included: true },
      { text: 'Dedicated data pipelines', included: true },
      { text: '99.9% SLA guarantee', included: true },
      { text: 'White-label licensing', included: true },
      { text: 'Quarterly strategy reviews', included: true },
    ],
    cta: 'Contact Sales',
    ctaVariant: 'outline' as const,
    popular: false
  }
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative py-24 bg-[#0f1923]">
      <div className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(0,188,168,0.03) 0%, transparent 50%)'
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs tracking-[0.2em] text-[#00bca8] uppercase">Pricing</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[#e2e8f0]">
            Three Tiers. <span className="gradient-text">Three Revenue Streams.</span>
          </h2>
          <p className="mt-4 text-[#8899aa] max-w-2xl mx-auto">
            Free tier drives adoption. Pro tier monetizes access. Enterprise creates B2B licensing revenue.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-lg border p-8 ${
                tier.popular
                  ? 'bg-[#1a2a3a] border-[#00bca8] glow-accent'
                  : 'bg-[#1a2a3a] border-[#00788820]'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#00bca8] text-[#0f1923] text-xs font-bold rounded-full">
                  Most Popular
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-md ${tier.popular ? 'bg-[#00bca820]' : 'bg-[#00788815]'}`}>
                  <tier.icon className={`h-5 w-5 ${tier.popular ? 'text-[#00bca8]' : 'text-[#007888]'}`} />
                </div>
                <h3 className="text-xl font-bold text-[#e2e8f0]">{tier.name}</h3>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold text-[#e2e8f0]">{tier.price}</span>
                <span className="text-[#718096]">{tier.period}</span>
              </div>

              <p className="text-sm text-[#8899aa] mb-6">{tier.description}</p>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3 text-sm">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-[#00bca8] flex-shrink-0" />
                    ) : (
                      <Minus className="h-4 w-4 text-[#4a5568] flex-shrink-0" />
                    )}
                    <span className={feature.included ? 'text-[#a0b0c0]' : 'text-[#4a5568]'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to="/login" className="block">
                <Button
                  className={`w-full ${
                    tier.popular
                      ? 'bg-[#00bca8] text-[#0f1923] hover:bg-[#00d4be]'
                      : 'border-[#00788860] text-[#a0b0c0] hover:text-[#00bca8]'
                  }`}
                  variant={tier.popular ? 'default' : 'outline'}
                >
                  {tier.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00788815] border border-[#00788830]">
            <Building2 className="h-4 w-4 text-[#00bca8]" />
            <span className="text-sm text-[#a0b0c0]">
              <strong className="text-[#00bca8]">B2B Licensing:</strong> Revenue share (15-25%) with regtech providers, consultancies, and research institutions
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
