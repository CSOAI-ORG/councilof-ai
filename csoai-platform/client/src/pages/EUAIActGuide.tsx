/**
 * EU AI Act Comprehensive Guide
 * The most detailed, authoritative resource for EU AI Act compliance
 */

import { motion } from "framer-motion";
import {
  Shield, AlertTriangle, CheckCircle2, Clock, Scale, FileText,
  BookOpen, ArrowRight, ExternalLink, Calendar, Euro, Building2,
  Users, Target, AlertCircle, ChevronDown, Gavel, Globe, Zap,
  GraduationCap, Award, BarChart3, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EUAIActGuide() {
  const riskCategories = [
    {
      level: "Unacceptable Risk",
      color: "red",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      textColor: "text-red-600 dark:text-red-400",
      icon: AlertTriangle,
      description: "AI systems that pose a clear threat to people's safety, livelihoods, and rights are banned outright.",
      examples: [
        "Social scoring systems by governments",
        "Real-time remote biometric identification in public spaces (with limited exceptions)",
        "Subliminal manipulation techniques causing harm",
        "Exploitation of vulnerabilities (age, disability, social situation)",
        "Emotion recognition in workplaces and educational institutions",
        "Untargeted scraping of facial images for facial recognition databases",
        "Predictive policing based solely on profiling"
      ],
      deadline: "February 2, 2025",
      status: "Prohibited"
    },
    {
      level: "High Risk",
      color: "orange",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      textColor: "text-orange-600 dark:text-orange-400",
      icon: Shield,
      description: "AI systems that significantly impact people's health, safety, or fundamental rights. Subject to strict requirements before market placement.",
      examples: [
        "Biometric identification and categorization",
        "Critical infrastructure management (water, gas, electricity)",
        "Education and vocational training (exam scoring, admissions)",
        "Employment, worker management, recruitment",
        "Access to essential services (credit scoring, insurance)",
        "Law enforcement applications",
        "Migration, asylum, and border control",
        "Administration of justice and democratic processes"
      ],
      deadline: "August 2, 2026",
      status: "Regulated"
    },
    {
      level: "Limited Risk",
      color: "yellow",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      textColor: "text-yellow-600 dark:text-yellow-500",
      icon: AlertCircle,
      description: "AI systems with specific transparency obligations to ensure users know they are interacting with AI.",
      examples: [
        "Chatbots and conversational AI",
        "Emotion recognition systems (where permitted)",
        "Biometric categorization systems",
        "AI-generated or manipulated content (deepfakes)",
        "AI systems that generate text for public information"
      ],
      deadline: "August 2, 2025",
      status: "Transparency Required"
    },
    {
      level: "Minimal Risk",
      color: "green",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      textColor: "text-green-600 dark:text-green-400",
      icon: CheckCircle2,
      description: "The vast majority of AI systems fall into this category with no specific obligations, though voluntary codes of conduct are encouraged.",
      examples: [
        "Spam filters",
        "AI-enabled video games",
        "Inventory management systems",
        "AI-powered spell checkers",
        "Recommendation algorithms (most)",
        "Manufacturing optimization AI"
      ],
      deadline: "N/A",
      status: "No Requirements"
    }
  ];

  const keyDates = [
    {
      date: "July 12, 2024",
      event: "EU AI Act Adopted",
      description: "European Parliament formally adopted the AI Act after years of negotiation.",
      status: "completed"
    },
    {
      date: "August 1, 2024",
      event: "Entry into Force",
      description: "The AI Act entered into force 20 days after publication in the Official Journal.",
      status: "completed"
    },
    {
      date: "February 2, 2025",
      event: "Prohibited AI Practices Ban",
      description: "All prohibited AI practices become illegal. Organizations must cease usage.",
      status: "imminent"
    },
    {
      date: "August 2, 2025",
      event: "GPAI Rules Apply",
      description: "General-Purpose AI (GPAI) model requirements take effect, including transparency and systemic risk obligations.",
      status: "upcoming"
    },
    {
      date: "August 2, 2026",
      event: "High-Risk AI Requirements",
      description: "Full compliance required for high-risk AI systems, including conformity assessments.",
      status: "upcoming"
    },
    {
      date: "August 2, 2027",
      event: "Additional High-Risk Categories",
      description: "Extended high-risk requirements for certain AI systems in Annex I products.",
      status: "upcoming"
    }
  ];

  const digitalOmnibus = {
    proposalDate: "November 26, 2025",
    description: "The European Commission proposed the Digital Omnibus to simplify and streamline reporting obligations under the AI Act and other digital regulations.",
    keyChanges: [
      {
        area: "Extended Deadlines",
        detail: "Potential 12-month extension for certain high-risk AI compliance requirements"
      },
      {
        area: "Simplified Reporting",
        detail: "Consolidation of reporting requirements across Digital Services Act, AI Act, and Data Act"
      },
      {
        area: "SME Relief",
        detail: "Reduced administrative burden for small and medium enterprises"
      },
      {
        area: "Harmonized Definitions",
        detail: "Alignment of terminology across EU digital regulations"
      }
    ],
    status: "Under negotiation - Final text expected Q2 2026"
  };

  const penalties = [
    {
      violation: "Prohibited AI Practices",
      maxFine: "35 million EUR",
      percentTurnover: "7%",
      description: "Deploying or placing on market AI systems with unacceptable risk"
    },
    {
      violation: "High-Risk Non-Compliance",
      maxFine: "15 million EUR",
      percentTurnover: "3%",
      description: "Failing to meet high-risk AI requirements"
    },
    {
      violation: "Incorrect Information",
      maxFine: "7.5 million EUR",
      percentTurnover: "1.5%",
      description: "Providing misleading information to authorities"
    }
  ];

  const highRiskRequirements = [
    {
      category: "Risk Management",
      icon: Shield,
      requirements: [
        "Establish and maintain a risk management system throughout AI lifecycle",
        "Identify and analyze known and foreseeable risks",
        "Implement risk mitigation measures",
        "Continuous iterative process of risk identification and mitigation"
      ]
    },
    {
      category: "Data Governance",
      icon: BarChart3,
      requirements: [
        "Training data must be relevant, representative, and error-free",
        "Examination for possible biases",
        "Appropriate data governance measures",
        "Clear data lineage documentation"
      ]
    },
    {
      category: "Technical Documentation",
      icon: FileText,
      requirements: [
        "Detailed system description and design specifications",
        "Information about training data and processes",
        "Validation and testing procedures and results",
        "Risk management system documentation"
      ]
    },
    {
      category: "Record Keeping",
      icon: Clock,
      requirements: [
        "Automatic logging of AI system operations",
        "Logs must enable traceability",
        "Retention for appropriate periods",
        "Access for competent authorities"
      ]
    },
    {
      category: "Transparency",
      icon: Users,
      requirements: [
        "Clear instructions for use provided to deployers",
        "Information about AI system capabilities and limitations",
        "Contact information of provider",
        "Expected level of accuracy and robustness"
      ]
    },
    {
      category: "Human Oversight",
      icon: Target,
      requirements: [
        "Design to enable human oversight during use",
        "Ability to fully understand AI system capabilities",
        "Ability to interpret outputs correctly",
        "Ability to decide not to use or override AI decisions"
      ]
    },
    {
      category: "Accuracy & Robustness",
      icon: CheckCircle2,
      requirements: [
        "Achieve appropriate level of accuracy",
        "Resilient to errors and inconsistencies",
        "Robust against attempts to alter use or performance",
        "Cybersecurity measures throughout lifecycle"
      ]
    }
  ];

  const csoaiFeatures = [
    {
      title: "AI System Registry",
      description: "Maintain a comprehensive inventory of all your AI systems with automatic risk classification against EU AI Act categories.",
      link: "/ai-systems"
    },
    {
      title: "Risk Assessment Tools",
      description: "Interactive risk classification tool that maps your AI systems to the appropriate EU AI Act risk category with detailed reasoning.",
      link: "/risk-assessment"
    },
    {
      title: "Compliance Tracking",
      description: "Real-time monitoring of your compliance status against all 113 EU AI Act requirements with gap analysis.",
      link: "/compliance"
    },
    {
      title: "Technical Documentation",
      description: "AI-assisted generation of required technical documentation including risk management systems and data governance policies.",
      link: "/workbench"
    },
    {
      title: "Training & Certification",
      description: "Comprehensive EU AI Act training courses with certification to demonstrate organizational competency.",
      link: "/courses"
    },
    {
      title: "PDCA Cycles",
      description: "Continuous improvement framework aligned with EU AI Act's emphasis on ongoing risk management throughout AI lifecycle.",
      link: "/pdca"
    }
  ];

  const faqs = [
    {
      question: "When does the EU AI Act apply to my organization?",
      answer: "The EU AI Act applies if you: (1) Place AI systems on the EU market, regardless of where you're established; (2) Put AI systems into service in the EU; (3) Use AI systems in the EU; (4) Place outputs from AI systems on the EU market. This means even non-EU companies must comply if their AI systems affect EU citizens or are used within the EU."
    },
    {
      question: "How do I determine if my AI system is 'high-risk'?",
      answer: "High-risk AI systems are defined in Annex III of the AI Act and include: biometric identification, critical infrastructure management, education and training systems, employment and worker management, access to essential services, law enforcement, migration and border control, and administration of justice. If your AI system falls into these categories AND makes or substantially influences decisions affecting natural persons, it's likely high-risk."
    },
    {
      question: "What are the penalties for non-compliance?",
      answer: "Penalties can be severe: up to 35 million EUR or 7% of global annual turnover for prohibited AI practices; up to 15 million EUR or 3% of turnover for other violations; and up to 7.5 million EUR or 1.5% of turnover for providing incorrect information. For SMEs, proportionality applies to ensure penalties are not unduly burdensome."
    },
    {
      question: "What is a 'General-Purpose AI' (GPAI) model?",
      answer: "GPAI models are AI models capable of competently performing a wide range of distinct tasks regardless of how they are placed on the market. This includes foundation models and large language models like GPT-4, Claude, Gemini, and others. GPAI providers have specific obligations including technical documentation, transparency about training data, and copyright compliance."
    },
    {
      question: "Does the AI Act apply to AI systems developed before it came into force?",
      answer: "Yes, with some transitional provisions. AI systems already on the market must comply with the full requirements by the relevant application dates. However, the Act provides a graduated timeline to allow organizations to adapt. For high-risk AI systems, you have until August 2026 to achieve full compliance."
    },
    {
      question: "What documentation is required for high-risk AI systems?",
      answer: "High-risk AI systems require extensive documentation including: technical documentation per Annex IV (system description, design specifications, training data information), instructions for use, risk management system documentation, data governance documentation, records of automatic logging, EU declaration of conformity, and CE marking affixation."
    },
    {
      question: "How does the AI Act interact with GDPR?",
      answer: "The AI Act complements GDPR and doesn't replace it. If your AI system processes personal data, you must comply with both. The AI Act adds AI-specific requirements around transparency, human oversight, and risk management that go beyond GDPR's data protection focus. Data Protection Impact Assessments under GDPR may need to be combined with AI Act risk assessments."
    },
    {
      question: "What is the role of the AI Office?",
      answer: "The AI Office, established within the European Commission, oversees enforcement of GPAI model rules, coordinates with national authorities, develops guidance and standards, and manages the AI regulatory sandbox provisions. It serves as the central EU body for AI Act implementation and can directly enforce rules against GPAI providers."
    },
    {
      question: "Are there exemptions for AI used in research?",
      answer: "Yes, the AI Act provides exemptions for AI systems used exclusively for scientific research and development purposes, as well as for AI components in the research phase before market placement. However, once an AI system is placed on the market or put into service, all applicable requirements apply regardless of its research origins."
    },
    {
      question: "What is the Digital Omnibus and how might it affect AI Act compliance?",
      answer: "The Digital Omnibus, proposed in November 2025, aims to simplify reporting obligations across EU digital regulations. For the AI Act, it may extend certain compliance deadlines, reduce reporting burden for SMEs, and harmonize requirements with other frameworks like the Digital Services Act. Organizations should monitor negotiations but continue compliance efforts under current timelines."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-500/10 to-purple-500/10" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
        <div className="container max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="outline" className="text-sm px-4 py-2 bg-blue-500/10 border-blue-500/30">
                <Globe className="h-4 w-4 mr-2" />
                European Union Regulation 2024/1689
              </Badge>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              The Complete Guide to the
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> EU AI Act</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The world's first comprehensive AI regulation. Understand the risk-based framework,
              compliance requirements, key deadlines, and penalties. Everything you need to prepare
              your organization for full compliance.
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Link href="/courses">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Start EU AI Act Training
                </Button>
              </Link>
              <Link href="/compliance">
                <Button size="lg" variant="outline">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Check Your Compliance
                </Button>
              </Link>
              <Button size="lg" variant="ghost" asChild>
                <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Official Text
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="border-y bg-muted/30">
        <div className="container max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">Aug 2024</div>
              <div className="text-sm text-muted-foreground">Entry into Force</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">Feb 2025</div>
              <div className="text-sm text-muted-foreground">Prohibited AI Ban</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">Aug 2026</div>
              <div className="text-sm text-muted-foreground">High-Risk Deadline</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600">35M EUR</div>
              <div className="text-sm text-muted-foreground">Maximum Fine</div>
            </div>
          </div>
        </div>
      </section>

      {/* What is the EU AI Act */}
      <section className="py-20 px-6">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-6">
              <Badge variant="secondary" className="text-sm">Understanding the Regulation</Badge>
              <h2 className="text-4xl font-bold">What is the EU AI Act?</h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  The <strong className="text-foreground">EU Artificial Intelligence Act</strong> (Regulation 2024/1689) is the world's
                  first comprehensive legal framework for artificial intelligence. Adopted on July 12, 2024,
                  and entering into force on August 1, 2024, it establishes a risk-based approach to AI regulation.
                </p>
                <p>
                  The Act aims to ensure that AI systems placed on the EU market are safe, respect fundamental
                  rights, and uphold EU values while promoting innovation and investment in AI technologies.
                </p>
                <p>
                  Unlike sector-specific regulations, the AI Act applies horizontally across all sectors and
                  industries, with requirements varying based on the level of risk posed by specific AI applications.
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <Card className="flex-1 p-4 bg-blue-500/5 border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <Scale className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="font-semibold">Risk-Based</div>
                      <div className="text-sm text-muted-foreground">4 Risk Tiers</div>
                    </div>
                  </div>
                </Card>
                <Card className="flex-1 p-4 bg-green-500/5 border-green-500/20">
                  <div className="flex items-center gap-3">
                    <Globe className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="font-semibold">Global Reach</div>
                      <div className="text-sm text-muted-foreground">Extraterritorial</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            <div className="relative">
              <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-blue-600" />
                  Core Principles
                </h3>
                <ul className="space-y-4">
                  {[
                    "Human-centric approach to AI development and deployment",
                    "Protection of fundamental rights and EU values",
                    "Transparency and accountability in AI systems",
                    "Risk-proportionate regulatory requirements",
                    "Support for innovation through regulatory sandboxes",
                    "Harmonized rules across all EU member states"
                  ].map((principle, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{principle}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Risk Classification System */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="text-sm mb-4">The Heart of the AI Act</Badge>
            <h2 className="text-4xl font-bold mb-4">Risk Classification System</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The EU AI Act categorizes AI systems into four risk levels, each with different regulatory requirements.
              Higher risk means stricter obligations.
            </p>
          </motion.div>

          <div className="space-y-6">
            {riskCategories.map((category, idx) => (
              <motion.div
                key={category.level}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={`${category.bgColor} ${category.borderColor} border-2`}>
                  <CardHeader>
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-white dark:bg-gray-900 shadow-sm`}>
                          <category.icon className={`h-8 w-8 ${category.textColor}`} />
                        </div>
                        <div>
                          <CardTitle className="text-2xl">{category.level}</CardTitle>
                          <CardDescription className="text-base mt-1">{category.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`${category.textColor} ${category.borderColor}`}>
                          {category.status}
                        </Badge>
                        {category.deadline !== "N/A" && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {category.deadline}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                        Examples of {category.level} AI Systems:
                      </h4>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {category.examples.map((example, exIdx) => (
                          <div key={exIdx} className="flex items-center gap-2 text-sm">
                            <div className={`w-1.5 h-1.5 rounded-full ${category.textColor.replace('text-', 'bg-')}`} />
                            {example}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Dates Timeline */}
      <section className="py-20 px-6">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="text-sm mb-4">Implementation Timeline</Badge>
            <h2 className="text-4xl font-bold mb-4">Key Compliance Dates</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The EU AI Act follows a phased implementation approach. Mark these critical dates in your compliance calendar.
            </p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-green-500 via-blue-500 to-purple-500 hidden md:block" />
            <div className="space-y-8">
              {keyDates.map((item, idx) => (
                <motion.div
                  key={item.date}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex items-center gap-8 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  <div className={`flex-1 ${idx % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                    <Card className={`inline-block p-6 ${
                      item.status === 'completed' ? 'bg-green-500/5 border-green-500/20' :
                      item.status === 'imminent' ? 'bg-red-500/5 border-red-500/20' :
                      'bg-blue-500/5 border-blue-500/20'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={
                          item.status === 'completed' ? 'default' :
                          item.status === 'imminent' ? 'destructive' :
                          'secondary'
                        }>
                          {item.status === 'completed' ? 'Completed' :
                           item.status === 'imminent' ? 'Imminent' : 'Upcoming'}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold">{item.event}</h3>
                      <p className="text-2xl font-bold text-blue-600 my-2">{item.date}</p>
                      <p className="text-muted-foreground">{item.description}</p>
                    </Card>
                  </div>
                  <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-background border-4 border-blue-500 z-10">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Digital Omnibus Update */}
      <section className="py-20 px-6 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Card className="p-8 border-amber-500/30 bg-white/50 dark:bg-gray-950/50">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-xl bg-amber-500/20">
                  <Zap className="h-8 w-8 text-amber-600" />
                </div>
                <div>
                  <Badge variant="outline" className="mb-2 border-amber-500/30 text-amber-600">
                    Latest Update - November 2025
                  </Badge>
                  <h2 className="text-3xl font-bold">Digital Omnibus Proposal</h2>
                  <p className="text-muted-foreground mt-2">{digitalOmnibus.description}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {digitalOmnibus.keyChanges.map((change, idx) => (
                  <Card key={idx} className="p-4 bg-amber-500/5">
                    <h4 className="font-semibold text-amber-700 dark:text-amber-400">{change.area}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{change.detail}</p>
                  </Card>
                ))}
              </div>

              <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{digitalOmnibus.status}</span>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* High-Risk Requirements */}
      <section className="py-20 px-6">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="text-sm mb-4">Compliance Requirements</Badge>
            <h2 className="text-4xl font-bold mb-4">High-Risk AI Requirements</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              High-risk AI systems must meet stringent requirements across seven key areas before being placed on the market.
            </p>
          </motion.div>

          <Tabs defaultValue="risk-management" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 w-full mb-8 h-auto">
              {highRiskRequirements.map((req) => (
                <TabsTrigger
                  key={req.category.toLowerCase().replace(' ', '-')}
                  value={req.category.toLowerCase().replace(' ', '-')}
                  className="text-xs md:text-sm py-3"
                >
                  <req.icon className="h-4 w-4 mr-1 hidden sm:inline" />
                  {req.category}
                </TabsTrigger>
              ))}
            </TabsList>

            {highRiskRequirements.map((req) => (
              <TabsContent key={req.category.toLowerCase().replace(' ', '-')} value={req.category.toLowerCase().replace(' ', '-')}>
                <Card className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-blue-500/10">
                      <req.icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{req.category}</h3>
                      <p className="text-muted-foreground">Article {req.category === 'Risk Management' ? '9' : req.category === 'Data Governance' ? '10' : req.category === 'Technical Documentation' ? '11' : req.category === 'Record Keeping' ? '12' : req.category === 'Transparency' ? '13' : req.category === 'Human Oversight' ? '14' : '15'} of the EU AI Act</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {req.requirements.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Penalties */}
      <section className="py-20 px-6 bg-gradient-to-br from-red-500/10 via-red-500/5 to-orange-500/10">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="destructive" className="text-sm mb-4">Non-Compliance Consequences</Badge>
            <h2 className="text-4xl font-bold mb-4">Penalties & Fines</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The EU AI Act includes significant penalties to ensure compliance. Fines are calculated as the higher of a fixed amount or percentage of global turnover.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {penalties.map((penalty, idx) => (
              <motion.div
                key={penalty.violation}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full p-6 bg-white/50 dark:bg-gray-950/50 border-red-500/20">
                  <div className="text-center">
                    <div className="inline-flex p-4 rounded-full bg-red-500/10 mb-4">
                      <Euro className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{penalty.violation}</h3>
                    <div className="text-4xl font-bold text-red-600 mb-1">{penalty.maxFine}</div>
                    <div className="text-lg text-muted-foreground mb-4">or {penalty.percentTurnover} of turnover</div>
                    <p className="text-sm text-muted-foreground">{penalty.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="mt-8 p-6 bg-amber-500/10 border-amber-500/20">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-amber-700 dark:text-amber-400">SME Proportionality</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  For small and medium-sized enterprises, including startups, the maximum fines are capped to ensure
                  proportionality. However, organizations of all sizes should prioritize compliance to avoid both
                  financial penalties and reputational damage.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* How CSOAI Helps */}
      <section className="py-20 px-6">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="text-sm mb-4 bg-green-500/10 text-green-600 border-green-500/30">
              Your Compliance Partner
            </Badge>
            <h2 className="text-4xl font-bold mb-4">How CSOAI Helps You Comply</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform provides comprehensive tools and training to achieve and maintain EU AI Act compliance.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {csoaiFeatures.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link href={feature.link}>
                  <Card className="h-full p-6 hover:shadow-lg transition-all hover:border-green-500/30 cursor-pointer group">
                    <h3 className="text-lg font-bold mb-2 group-hover:text-green-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                    <div className="flex items-center text-green-600 text-sm font-medium">
                      Learn more
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Training CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-6"
          >
            <Badge variant="secondary" className="text-sm bg-white/20 text-white border-white/30">
              <Award className="h-4 w-4 mr-2" />
              Professional Certification
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Master EU AI Act Compliance
            </h2>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Our comprehensive training program covers all aspects of the EU AI Act, from risk classification
              to conformity assessment. Earn your certification and demonstrate compliance expertise.
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Link href="/courses">
                <Button size="lg" variant="secondary" className="bg-white text-green-700 hover:bg-green-50">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Browse Training Modules
                </Button>
              </Link>
              <Link href="/certification">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Award className="mr-2 h-5 w-5" />
                  View Certifications
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-8 pt-6 text-green-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>113 Requirements Covered</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Expert Instructors</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Practical Exercises</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6">
        <div className="container max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="text-sm mb-4">Got Questions?</Badge>
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">
              Common questions about the EU AI Act and compliance requirements.
            </p>
          </motion.div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Related Frameworks */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Related Frameworks</h2>
            <p className="text-muted-foreground">
              Explore how other AI governance frameworks complement the EU AI Act.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/guides/nist-ai-rmf">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold">NIST AI RMF</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  The US voluntary framework that aligns well with EU AI Act requirements.
                </p>
                <span className="text-blue-600 text-sm font-medium flex items-center">
                  Read Guide <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Card>
            </Link>
            <Link href="/guides/iso-42001">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-bold">ISO/IEC 42001</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  The certifiable AI management system standard supporting EU compliance.
                </p>
                <span className="text-purple-600 text-sm font-medium flex items-center">
                  Read Guide <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Card>
            </Link>
            <Link href="/guides/tc260">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Globe className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="font-bold">China TC260</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Understand how China's AI governance compares to the EU approach.
                </p>
                <span className="text-red-600 text-sm font-medium flex items-center">
                  Read Guide <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="container max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-bold">
              Ready to Start Your Compliance Journey?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of organizations preparing for EU AI Act compliance with CSOAI.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/enterprise">
                <Button size="lg" variant="outline">
                  Contact Enterprise Sales
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
