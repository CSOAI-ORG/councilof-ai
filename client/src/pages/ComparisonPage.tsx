/*
 * CSOAI Comparison Page
 * Compare CSOAI against alternative approaches and platforms
 * Highlights unique value propositions and differentiators
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  CheckCircle2,
  X,
  Users,
  Shield,
  TrendingUp,
  BookOpen,
  Zap,
  Lock,
  Eye,
  DollarSign,
  Award,
  GitBranch,
  Briefcase,
  Heart,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Key differentiators
const differentiators = [
  {
    icon: Globe,
    title: "Global Coverage",
    csoai: "40+ Nations",
    competitors: "Single jurisdiction",
    description: "Regulate across EU AI Act, NIST RMF, ISO 42001, TC260 and more",
  },
  {
    icon: BookOpen,
    title: "Training + Certification",
    csoai: "Included",
    competitors: "Separate cost",
    description: "Free training tier plus professional certification programs",
  },
  {
    icon: DollarSign,
    title: "Pricing Model",
    csoai: "Free tier available",
    competitors: "Enterprise only",
    description: "Accessibility for teams of all sizes, no pricing walls",
  },
  {
    icon: GitBranch,
    title: "Governance",
    csoai: "Open standards",
    competitors: "Proprietary/closed",
    description: "Byzantine Council consensus, transparent decision-making",
  },
];

// Detailed feature comparison
const comparisonFeatures = [
  {
    category: "Coverage & Compliance",
    features: [
      {
        name: "Global Regulation Coverage",
        csoai: "✓",
        traditional: "Partial",
        aiTools: "Partial",
        consulting: "✓",
      },
      {
        name: "40+ Nations Support",
        csoai: "✓",
        traditional: "✗",
        aiTools: "✗",
        consulting: "Partial",
      },
      {
        name: "Multi-Framework Support",
        csoai: "✓",
        traditional: "✓",
        aiTools: "Partial",
        consulting: "✓",
      },
      {
        name: "EU AI Act",
        csoai: "✓",
        traditional: "✓",
        aiTools: "✓",
        consulting: "✓",
      },
      {
        name: "NIST AI RMF",
        csoai: "✓",
        traditional: "Partial",
        aiTools: "✓",
        consulting: "✓",
      },
      {
        name: "ISO 42001",
        csoai: "✓",
        traditional: "Partial",
        aiTools: "Partial",
        consulting: "✓",
      },
    ],
  },
  {
    category: "Training & Education",
    features: [
      {
        name: "Training & Certification",
        csoai: "✓",
        traditional: "✗",
        aiTools: "✗",
        consulting: "✓",
      },
      {
        name: "Free Training Tier",
        csoai: "✓",
        traditional: "✗",
        aiTools: "✗",
        consulting: "✗",
      },
      {
        name: "Professional Certification",
        csoai: "✓",
        traditional: "✗",
        aiTools: "✗",
        consulting: "✓",
      },
      {
        name: "Job Marketplace",
        csoai: "✓",
        traditional: "✗",
        aiTools: "✗",
        consulting: "✗",
      },
      {
        name: "Content Library",
        csoai: "✓",
        traditional: "Partial",
        aiTools: "Partial",
        consulting: "✓",
      },
    ],
  },
  {
    category: "Monitoring & Oversight",
    features: [
      {
        name: "Real-time Monitoring",
        csoai: "✓",
        traditional: "✗",
        aiTools: "Partial",
        consulting: "✗",
      },
      {
        name: "Byzantine Council (33-agent consensus)",
        csoai: "✓",
        traditional: "✗",
        aiTools: "✗",
        consulting: "✗",
      },
      {
        name: "AI Safety Watchdog",
        csoai: "✓",
        traditional: "✗",
        aiTools: "✗",
        consulting: "✗",
      },
      {
        name: "Crowdsourced Oversight",
        csoai: "✓",
        traditional: "✗",
        aiTools: "✗",
        consulting: "✗",
      },
      {
        name: "Incident Reporting",
        csoai: "✓",
        traditional: "Partial",
        aiTools: "Partial",
        consulting: "✓",
      },
    ],
  },
  {
    category: "Compliance Automation",
    features: [
      {
        name: "SOAI-PDCA Loop",
        csoai: "✓",
        traditional: "Partial",
        aiTools: "Partial",
        consulting: "✗",
      },
      {
        name: "Automated Assessment",
        csoai: "✓",
        traditional: "Partial",
        aiTools: "✓",
        consulting: "✗",
      },
      {
        name: "Real-time Recommendations",
        csoai: "✓",
        traditional: "Partial",
        aiTools: "✓",
        consulting: "✗",
      },
      {
        name: "Compliance Scoring",
        csoai: "✓",
        traditional: "✓",
        aiTools: "✓",
        consulting: "Partial",
      },
    ],
  },
  {
    category: "Economic Benefits",
    features: [
      {
        name: "Prosperity Fund Access",
        csoai: "✓",
        traditional: "✗",
        aiTools: "✗",
        consulting: "✗",
      },
      {
        name: "UBI/Economic Redistribution",
        csoai: "✓",
        traditional: "✗",
        aiTools: "✗",
        consulting: "✗",
      },
      {
        name: "Analyst Marketplace",
        csoai: "✓",
        traditional: "✗",
        aiTools: "Partial",
        consulting: "✗",
      },
    ],
  },
  {
    category: "Pricing & Accessibility",
    features: [
      {
        name: "Free Tier Available",
        csoai: "✓",
        traditional: "✗",
        aiTools: "Partial",
        consulting: "✗",
      },
      {
        name: "Enterprise Pricing",
        csoai: "✓",
        traditional: "✓",
        aiTools: "✓",
        consulting: "✓",
      },
      {
        name: "Pay-as-you-go",
        csoai: "Partial",
        traditional: "Partial",
        aiTools: "✓",
        consulting: "✗",
      },
    ],
  },
  {
    category: "Platform Architecture",
    features: [
      {
        name: "Open Standards",
        csoai: "✓",
        traditional: "✗",
        aiTools: "Partial",
        consulting: "✗",
      },
      {
        name: "Vendor-Independent",
        csoai: "✓",
        traditional: "✓",
        aiTools: "Partial",
        consulting: "✓",
      },
      {
        name: "API Access",
        csoai: "✓",
        traditional: "Partial",
        aiTools: "✓",
        consulting: "✗",
      },
      {
        name: "Integration Ecosystem",
        csoai: "✓",
        traditional: "✓",
        aiTools: "Partial",
        consulting: "✗",
      },
    ],
  },
];

// Why CSOAI is different
const uniqueAdvantages = [
  {
    icon: Heart,
    title: "The Maternal Covenant",
    description:
      "Care-based AI governance that prioritizes human flourishing over compliance checkbox. We believe AI should serve humanity with compassion and relationship-first thinking.",
  },
  {
    icon: Users,
    title: "Byzantine Council",
    description:
      "33-agent consensus mechanism ensures transparent, unbiased decision-making. Distributed governance prevents any single entity from controlling AI safety outcomes.",
  },
  {
    icon: DollarSign,
    title: "Prosperity Fund",
    description:
      "Economic redistribution model that ensures AI benefits reach everyone. Create jobs, enable UBI, and build sustainable prosperity alongside compliance.",
  },
  {
    icon: Eye,
    title: "Crowdsourced Watchdog",
    description:
      "Community-driven AI safety monitoring. Analysts worldwide contribute expertise to identify risks in real-time, creating a vigilant safety network.",
  },
  {
    icon: Globe,
    title: "Global-First Design",
    description:
      "Built from day one to serve 40+ nations with their unique regulatory requirements. Not retrofitted compliance, but native multi-jurisdiction support.",
  },
  {
    icon: Lightbulb,
    title: "Integration-Ready",
    description:
      "Works alongside existing tools. We complement your GRC platform, enhance your AI-specific tools, and reduce reliance on expensive consultants.",
  },
];

// Customer testimonials
const testimonials = [
  {
    name: "Sarah Chen",
    role: "Chief AI Officer",
    company: "TechCorp Global",
    quote:
      "CSOAI's multi-nation support saved us months of compliance work. One platform for all our regulatory needs.",
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Compliance Director",
    company: "FinanceSecure",
    quote:
      "The free training tier let us upskill our entire team without breaking budget. The Byzantine Council gives us confidence our decisions are unbiased.",
    avatar: "MJ",
  },
  {
    name: "Emma Rodriguez",
    role: "AI Safety Analyst",
    company: "Independent Researcher",
    quote:
      "The job marketplace connected me with organizations that need AI safety expertise. CSOAI is democratizing AI governance.",
    avatar: "ER",
  },
];

// Pricing comparison
const pricingComparison = [
  {
    name: "CSOAI",
    tiers: [
      { name: "Free Tier", price: "$0", features: "Up to 3 AI systems, basic training" },
      {
        name: "Professional",
        price: "$499/mo",
        features: "10 systems, certification, monitoring",
      },
      { name: "Enterprise", price: "Custom", features: "Unlimited, 24/7 support, custom integrations" },
    ],
  },
  {
    name: "Traditional GRC Software",
    tiers: [
      { name: "Starter", price: "$2,000/mo", features: "Basic compliance, limited frameworks" },
      {
        name: "Professional",
        price: "$5,000/mo",
        features: "Multiple frameworks, reporting",
      },
      { name: "Enterprise", price: "$10,000+/mo", features: "Custom, priority support" },
    ],
  },
  {
    name: "AI-Specific Tools",
    tiers: [
      { name: "Starter", price: "$1,500/mo", features: "Single framework, 5 systems" },
      {
        name: "Growth",
        price: "$4,000/mo",
        features: "Multiple frameworks, 20 systems",
      },
      { name: "Enterprise", price: "$8,000+/mo", features: "Unlimited systems, custom workflows" },
    ],
  },
  {
    name: "Consulting Firms",
    tiers: [
      { name: "Project-based", price: "$50,000+", features: "1-3 month engagement" },
      {
        name: "Retainer",
        price: "$10,000+/mo",
        features: "Ongoing advisory, limited implementations",
      },
      { name: "Full Service", price: "$100,000+", features: "Complete transformation program" },
    ],
  },
];

interface ExpandedSectionState {
  [key: string]: boolean;
}

export default function ComparisonPage() {
  const [expandedCategories, setExpandedCategories] = useState<ExpandedSectionState>({});
  const [selectedPricingCategory, setSelectedPricingCategory] = useState(0);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const renderComparisonCell = (value: string) => {
    if (value === "✓") {
      return (
        <div className="flex justify-center">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        </div>
      );
    }
    if (value === "✗") {
      return (
        <div className="flex justify-center">
          <X className="h-5 w-5 text-red-500" />
        </div>
      );
    }
    return (
      <div className="flex justify-center">
        <span className="text-sm text-amber-700 font-medium bg-amber-100 px-2 py-1 rounded">
          {value}
        </span>
      );
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">
              <Shield className="h-3 w-3 mr-1" />
              Comparison
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Why Organizations Choose CSOAI
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              More than just compliance software. A complete AI governance platform with training,
              certification, monitoring, and economic benefits—all designed for the global economy.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg">
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg">
                  Request Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Differentiators */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">Key Differentiators</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              What sets CSOAI apart from every other approach
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {differentiators.map((diff, index) => {
              const Icon = diff.icon;
              return (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="h-full border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base">{diff.title}</h3>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">CSOAI</p>
                          <p className="font-semibold text-emerald-700">{diff.csoai}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Others</p>
                          <p className="text-gray-600">{diff.competitors}</p>
                        </div>
                        <p className="text-sm text-muted-foreground border-t pt-3 mt-3">
                          {diff.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Detailed Feature Comparison Table */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">Detailed Feature Comparison</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              How CSOAI compares across all major capability areas
            </p>
          </motion.div>

          <div className="space-y-6 max-w-6xl mx-auto">
            {comparisonFeatures.map((category, categoryIndex) => (
              <motion.div
                key={categoryIndex}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleCategory(category.category)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{category.category}</CardTitle>
                      {expandedCategories[category.category] ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>

                  {expandedCategories[category.category] && (
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 px-4 font-semibold">Feature</th>
                              <th className="text-center py-3 px-4 font-semibold text-primary">
                                CSOAI
                              </th>
                              <th className="text-center py-3 px-4 font-semibold text-gray-600">
                                Traditional GRC
                              </th>
                              <th className="text-center py-3 px-4 font-semibold text-gray-600">
                                AI-Specific Tools
                              </th>
                              <th className="text-center py-3 px-4 font-semibold text-gray-600">
                                Consulting Firms
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {category.features.map((feature, featureIndex) => (
                              <tr
                                key={featureIndex}
                                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                              >
                                <td className="py-3 px-4 font-medium text-foreground">
                                  {feature.name}
                                </td>
                                <td className="py-3 px-4">
                                  {renderComparisonCell(feature.csoai)}
                                </td>
                                <td className="py-3 px-4">
                                  {renderComparisonCell(feature.traditional)}
                                </td>
                                <td className="py-3 px-4">{renderComparisonCell(feature.aiTools)}</td>
                                <td className="py-3 px-4">
                                  {renderComparisonCell(feature.consulting)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-lg max-w-6xl mx-auto">
            <p className="text-center text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Legend:</span> ✓ = Full support •
              Partial = Limited or partial functionality • ✗ = Not available
            </p>
          </div>
        </div>
      </section>

      {/* What Makes CSOAI Different */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">What Makes CSOAI Different</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Revolutionary approach to AI governance that goes beyond compliance
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {uniqueAdvantages.map((advantage, index) => {
              const Icon = advantage.icon;
              return (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-bold">{advantage.title}</h3>
                      </div>
                      <p className="text-muted-foreground">{advantage.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">Pricing Comparison</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See how CSOAI's transparent pricing compares to alternatives
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto">
            {/* Category Selector */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {pricingComparison.map((category, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPricingCategory(index)}
                  className={`p-4 rounded-lg font-semibold transition-all ${
                    selectedPricingCategory === index
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Pricing Tiers */}
            <motion.div
              className="grid md:grid-cols-3 gap-6"
              key={selectedPricingCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {pricingComparison[selectedPricingCategory].tiers.map((tier, index) => (
                <Card key={index} className={index === 1 ? "border-primary border-2" : ""}>
                  <CardHeader>
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                    <div className="mt-2">
                      <div className="text-3xl font-bold">{tier.price}</div>
                      {tier.price !== "Custom" && !tier.price.includes("+") && (
                        <p className="text-sm text-muted-foreground">per month</p>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{tier.features}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </div>

          <div className="max-w-2xl mx-auto mt-12 p-6 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex gap-3">
              <Zap className="h-5 w-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900 mb-1">CSOAI's Value Proposition</p>
                <p className="text-sm text-emerald-800">
                  Start free with 3 AI systems. Scale with transparent pricing. No hidden fees. Get
                  training, certification, and access to the Prosperity Fund—benefits competitors
                  don't offer at any price.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">Why Customers Choose CSOAI</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from organizations making the switch
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="font-semibold text-sm text-primary">
                          {testimonial.avatar}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground italic mb-3">"{testimonial.quote}"</p>
                    <p className="text-xs font-semibold text-primary">{testimonial.company}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Easy to Get Started */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">Easy to Get Started</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Switch from traditional tools to CSOAI in minutes, not months
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-4 gap-6 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-emerald-500 -z-10" />

            {[
              {
                number: "1",
                title: "Import Data",
                description: "Bring your AI systems and compliance data from existing tools",
              },
              {
                number: "2",
                title: "Map Frameworks",
                description: "Automatically map to EU AI Act, NIST RMF, and 40+ regulations",
              },
              {
                number: "3",
                title: "Activate Monitoring",
                description: "Start real-time Byzantine Council consensus immediately",
              },
              {
                number: "4",
                title: "Expand Globally",
                description: "Extend compliance coverage across all your operating regions",
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center relative z-10 bg-card">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                      {step.number}
                    </div>
                    <h3 className="font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-muted-foreground mb-6">
              Average migration time: <span className="font-semibold text-foreground">2-4 weeks</span>
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/migration-guide">
                <Button variant="outline">
                  <Briefcase className="h-4 w-4 mr-2" />
                  View Migration Guide
                </Button>
              </Link>
              <Link href="/contact">
                <Button>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Talk to Migration Team
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">Common Questions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Answers to help you decide if CSOAI is right for your organization
            </p>
          </motion.div>

          <motion.div
            className="max-w-3xl mx-auto space-y-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {[
              {
                q: "How does CSOAI integrate with existing GRC tools?",
                a: "CSOAI offers REST APIs and pre-built integrations with popular GRC platforms. We work alongside your existing stack rather than replacing it entirely.",
              },
              {
                q: "Can we start with the free tier?",
                a: "Yes! The free tier supports up to 3 AI systems and includes access to training materials and the community watchdog reports.",
              },
              {
                q: "What's included in the Prosperity Fund?",
                a: "The Prosperity Fund pools revenues to provide UBI-style payments to certified analysts, create job opportunities, and support research in AI safety.",
              },
              {
                q: "How is CSOAI different from hiring consultants?",
                a: "Consultants provide one-time advice. CSOAI provides continuous, real-time monitoring and compliance automation across all 40+ nations—at a fraction of consulting costs.",
              },
              {
                q: "Is the Byzantine Council approach proven?",
                a: "Yes, Byzantine consensus mechanisms are well-established in distributed systems. Our 33-agent council ensures decisions are secure and unbiased.",
              },
              {
                q: "What happens to our data if we leave?",
                a: "You can export all your data in standard formats. We maintain complete data portability and transparency about how your information is stored.",
              },
            ].map((item, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">{item.q}</h3>
                    <p className="text-sm text-muted-foreground">{item.a}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-emerald-500/10">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your AI Governance?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join organizations worldwide who've chosen CSOAI for its comprehensive, global, and
              care-based approach to AI safety.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="px-8">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="px-8">
                  Schedule a Demo
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="ghost" size="lg" className="px-8">
                  Contact Sales
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-8">
              No credit card required. Free tier includes training, certification path, and
              watchdog access.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              className="grid md:grid-cols-5 gap-6 text-center"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {[
                { label: "40+ Nations", icon: Globe },
                { label: "33-Agent Council", icon: Users },
                { label: "Open Standards", icon: GitBranch },
                { label: "Free Training", icon: BookOpen },
                { label: "Job Marketplace", icon: Award },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div key={index} variants={fadeInUp}>
                    <div className="p-4">
                      <Icon className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-sm font-semibold">{item.label}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
