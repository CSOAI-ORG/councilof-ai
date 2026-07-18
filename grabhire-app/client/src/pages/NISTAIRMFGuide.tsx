/**
 * NIST AI RMF Comprehensive Guide
 * The definitive resource for understanding and implementing the NIST AI Risk Management Framework
 */

import { motion } from "framer-motion";
import {
  Shield, CheckCircle2, Target, BarChart3, Cog, FileText,
  BookOpen, ArrowRight, ExternalLink, Layers, Network, Eye,
  Users, Scale, Lock, AlertCircle, Zap, Building2, Globe,
  GraduationCap, Award, RefreshCw, Workflow, Brain, Heart
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

export default function NISTAIRMFGuide() {
  const coreFunctions = [
    {
      name: "GOVERN",
      icon: Building2,
      color: "blue",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      textColor: "text-blue-600 dark:text-blue-400",
      tagline: "Cultivate a culture of AI risk management",
      description: "Establish and maintain a culture of AI risk management across the organization. This cross-cutting function informs and is integrated into all other functions.",
      categories: [
        {
          id: "GV-1",
          title: "Governance Policies",
          description: "Policies, processes, procedures, and practices across the organization establish transparent AI governance."
        },
        {
          id: "GV-2",
          title: "Accountability",
          description: "Accountability structures are in place to ensure that AI activities comply with applicable regulations."
        },
        {
          id: "GV-3",
          title: "Workforce",
          description: "Workforce diversity, equity, inclusion, and accessibility processes are prioritized in AI governance."
        },
        {
          id: "GV-4",
          title: "Organizational Context",
          description: "Organizational mission and goals are reflected in AI design, development, deployment, and use."
        },
        {
          id: "GV-5",
          title: "Risk Management Integration",
          description: "AI risk management processes are integrated with broader enterprise risk management."
        },
        {
          id: "GV-6",
          title: "Stakeholder Engagement",
          description: "Stakeholder feedback is incorporated into AI governance processes."
        }
      ]
    },
    {
      name: "MAP",
      icon: Network,
      color: "purple",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      textColor: "text-purple-600 dark:text-purple-400",
      tagline: "Contextualize AI risks",
      description: "Identify and understand the context in which the AI system operates, including stakeholders, requirements, and potential impacts.",
      categories: [
        {
          id: "MP-1",
          title: "Context Establishment",
          description: "Context is established and understood, including deployment setting and operational environment."
        },
        {
          id: "MP-2",
          title: "AI System Categorization",
          description: "AI systems are categorized based on their capabilities and potential negative impacts."
        },
        {
          id: "MP-3",
          title: "Benefits and Risks",
          description: "AI system benefits and potential risks are identified and documented."
        },
        {
          id: "MP-4",
          title: "Risk Tolerance",
          description: "Organizational risk tolerance for AI systems is established and understood."
        },
        {
          id: "MP-5",
          title: "Impact Assessment",
          description: "Impacts on individuals, groups, communities, and ecosystems are identified and documented."
        }
      ]
    },
    {
      name: "MEASURE",
      icon: BarChart3,
      color: "green",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      textColor: "text-green-600 dark:text-green-400",
      tagline: "Analyze and assess AI risks",
      description: "Employ analytical approaches to quantify, qualify, and track AI risks using appropriate metrics and methods.",
      categories: [
        {
          id: "MS-1",
          title: "Risk Identification",
          description: "Appropriate methods and metrics are identified and applied to assess AI risk and trustworthiness."
        },
        {
          id: "MS-2",
          title: "Testing and Evaluation",
          description: "AI systems are evaluated using testing methods throughout the AI lifecycle."
        },
        {
          id: "MS-3",
          title: "Risk Tracking",
          description: "Mechanisms are in place to track identified AI risks over time."
        },
        {
          id: "MS-4",
          title: "Feedback Integration",
          description: "Feedback about efficacy of measurement approaches is gathered and integrated."
        }
      ]
    },
    {
      name: "MANAGE",
      icon: Cog,
      color: "orange",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      textColor: "text-orange-600 dark:text-orange-400",
      tagline: "Prioritize and act on AI risks",
      description: "Allocate resources to mapped and measured risks, implement risk response strategies, and monitor effectiveness.",
      categories: [
        {
          id: "MG-1",
          title: "Risk Prioritization",
          description: "AI risks are prioritized based on impact assessments and organizational risk tolerance."
        },
        {
          id: "MG-2",
          title: "Risk Response",
          description: "Strategies to address AI risks are implemented and documented."
        },
        {
          id: "MG-3",
          title: "Risk Monitoring",
          description: "AI risk management activities are monitored and adjustments made as needed."
        },
        {
          id: "MG-4",
          title: "Incident Response",
          description: "Mechanisms are in place to respond to AI-related incidents and near-misses."
        }
      ]
    }
  ];

  const trustworthyCharacteristics = [
    {
      name: "Valid and Reliable",
      icon: CheckCircle2,
      description: "AI systems perform as intended for defined operating conditions and produce consistent results.",
      keyAspects: [
        "Consistent outputs under similar conditions",
        "Accuracy aligned with intended use",
        "Documented performance benchmarks",
        "Validated against ground truth"
      ]
    },
    {
      name: "Safe",
      icon: Shield,
      description: "AI systems do not cause physical, psychological, financial, or environmental harm to humans or resources.",
      keyAspects: [
        "Fail-safe mechanisms",
        "Bounded operating conditions",
        "Emergency shutdown procedures",
        "Harm prevention measures"
      ]
    },
    {
      name: "Secure and Resilient",
      icon: Lock,
      description: "AI systems maintain confidentiality, integrity, availability, and can withstand adversarial attacks.",
      keyAspects: [
        "Adversarial robustness",
        "Data protection",
        "System availability",
        "Recovery capabilities"
      ]
    },
    {
      name: "Accountable and Transparent",
      icon: Eye,
      description: "Organizations and individuals are answerable for AI system decisions with clear disclosure of capabilities.",
      keyAspects: [
        "Clear ownership and responsibility",
        "Disclosed capabilities and limitations",
        "Decision audit trails",
        "Stakeholder communication"
      ]
    },
    {
      name: "Explainable and Interpretable",
      icon: Brain,
      description: "AI system outputs can be understood and explained in terms meaningful to stakeholders.",
      keyAspects: [
        "Human-understandable explanations",
        "Model interpretability",
        "Decision reasoning",
        "Contextual explanations"
      ]
    },
    {
      name: "Privacy-Enhanced",
      icon: Users,
      description: "AI systems respect individual privacy rights and comply with applicable privacy regulations.",
      keyAspects: [
        "Data minimization",
        "Consent management",
        "Privacy by design",
        "Data subject rights"
      ]
    },
    {
      name: "Fair with Managed Bias",
      icon: Scale,
      description: "AI systems are designed and deployed to minimize harmful bias and promote equitable outcomes.",
      keyAspects: [
        "Bias detection and mitigation",
        "Equitable outcomes",
        "Representative data",
        "Inclusive design"
      ]
    }
  ];

  const cyberAIProfile = {
    releaseDate: "December 2025",
    description: "The NIST AI RMF Cyber AI Profile provides specific guidance for managing AI cybersecurity risks, bridging the AI RMF with the NIST Cybersecurity Framework.",
    keyFeatures: [
      {
        title: "Cross-Walk with CSF",
        description: "Maps AI RMF subcategories to NIST Cybersecurity Framework functions"
      },
      {
        title: "Threat Modeling",
        description: "AI-specific threat identification and attack surface analysis"
      },
      {
        title: "Supply Chain Security",
        description: "Guidance for AI model and data supply chain risks"
      },
      {
        title: "Incident Response",
        description: "AI-specific incident detection and response procedures"
      },
      {
        title: "Red Teaming",
        description: "Framework for adversarial testing of AI systems"
      },
      {
        title: "Secure Development",
        description: "Secure AI development lifecycle practices"
      }
    ]
  };

  const frameworkAlignment = [
    {
      framework: "EU AI Act",
      alignment: "High",
      alignmentColor: "text-green-600",
      description: "NIST AI RMF's risk-based approach closely mirrors the EU AI Act's risk classification. Organizations can use the AI RMF to build compliance programs that satisfy EU requirements.",
      keyMappings: [
        "GOVERN aligns with EU governance requirements",
        "MAP supports risk classification processes",
        "MEASURE enables conformity assessment",
        "MANAGE addresses ongoing compliance monitoring"
      ]
    },
    {
      framework: "ISO/IEC 42001",
      alignment: "Very High",
      alignmentColor: "text-green-600",
      description: "Both frameworks share foundational principles. ISO 42001's AIMS structure maps directly to AI RMF functions, enabling organizations to pursue certification while following AI RMF guidance.",
      keyMappings: [
        "Governance structures are equivalent",
        "Risk assessment methodologies align",
        "Continuous improvement cycles match",
        "Documentation requirements are compatible"
      ]
    },
    {
      framework: "OECD AI Principles",
      alignment: "Very High",
      alignmentColor: "text-green-600",
      description: "The AI RMF was developed in consultation with OECD and explicitly supports implementation of OECD AI Principles through its trustworthy characteristics.",
      keyMappings: [
        "Human-centered values aligned",
        "Transparency requirements match",
        "Accountability principles equivalent",
        "Robustness and security aligned"
      ]
    }
  ];

  const csoaiFeatures = [
    {
      title: "GOVERN Implementation",
      description: "Establish AI governance policies, accountability structures, and stakeholder engagement processes aligned with AI RMF guidance.",
      link: "/compliance"
    },
    {
      title: "MAP Your AI Systems",
      description: "Comprehensive AI system inventory with context mapping, stakeholder identification, and impact assessment tools.",
      link: "/ai-systems"
    },
    {
      title: "MEASURE with Analytics",
      description: "Built-in metrics and testing frameworks to quantify AI risks and track trustworthiness characteristics.",
      link: "/risk-assessment"
    },
    {
      title: "MANAGE through PDCA",
      description: "Our PDCA framework directly implements MANAGE function requirements for continuous risk management.",
      link: "/pdca"
    },
    {
      title: "33-Agent Council",
      description: "Byzantine consensus voting provides decentralized oversight aligned with AI RMF accountability principles.",
      link: "/features/agent-council"
    },
    {
      title: "Training & Certification",
      description: "Comprehensive NIST AI RMF training with practical exercises and professional certification.",
      link: "/courses"
    }
  ];

  const implementationSteps = [
    {
      step: 1,
      title: "Frame the AI RMF",
      description: "Understand your organization's context, values, and risk tolerance for AI systems.",
      activities: [
        "Identify organizational objectives for AI",
        "Establish risk tolerance levels",
        "Define stakeholder groups",
        "Document regulatory requirements"
      ]
    },
    {
      step: 2,
      title: "Scope Your AI Portfolio",
      description: "Inventory and categorize all AI systems based on their purpose, deployment context, and potential impacts.",
      activities: [
        "Create AI system inventory",
        "Categorize by risk level",
        "Identify critical AI systems",
        "Document use cases and contexts"
      ]
    },
    {
      step: 3,
      title: "Establish Governance",
      description: "Build the organizational structures, policies, and processes to manage AI risks effectively.",
      activities: [
        "Designate AI governance roles",
        "Develop AI policies and procedures",
        "Integrate with enterprise risk management",
        "Establish oversight mechanisms"
      ]
    },
    {
      step: 4,
      title: "Implement Functions",
      description: "Operationalize the MAP, MEASURE, and MANAGE functions across your AI portfolio.",
      activities: [
        "Deploy risk assessment processes",
        "Implement measurement frameworks",
        "Establish risk response procedures",
        "Configure monitoring systems"
      ]
    },
    {
      step: 5,
      title: "Continuous Improvement",
      description: "Monitor, evaluate, and refine your AI risk management practices over time.",
      activities: [
        "Track metrics and KPIs",
        "Conduct periodic reviews",
        "Incorporate lessons learned",
        "Update based on new guidance"
      ]
    }
  ];

  const faqs = [
    {
      question: "Is the NIST AI RMF mandatory or voluntary?",
      answer: "The NIST AI RMF is voluntary. It was developed to help organizations incorporate trustworthiness considerations into AI design, development, use, and evaluation. However, it is increasingly referenced by regulators and industry groups, and alignment with the framework may become a de facto standard for demonstrating responsible AI practices."
    },
    {
      question: "How does the AI RMF relate to the NIST Cybersecurity Framework (CSF)?",
      answer: "The AI RMF complements the CSF by addressing AI-specific risks not covered by traditional cybersecurity frameworks. The new Cyber AI Profile (December 2025) provides explicit mappings between the two frameworks, allowing organizations to integrate AI risk management with their existing cybersecurity programs."
    },
    {
      question: "Which organizations should use the NIST AI RMF?",
      answer: "The AI RMF is designed for any organization that designs, develops, deploys, evaluates, or uses AI systems. This includes technology companies, enterprises using AI, government agencies, academic institutions, and non-profits. The framework scales to organizations of all sizes and AI maturity levels."
    },
    {
      question: "What are the 7 characteristics of trustworthy AI?",
      answer: "The NIST AI RMF identifies seven characteristics: (1) Valid and Reliable, (2) Safe, (3) Secure and Resilient, (4) Accountable and Transparent, (5) Explainable and Interpretable, (6) Privacy-Enhanced, and (7) Fair with Managed Bias. These characteristics may overlap and can be in tension with each other, requiring careful balancing."
    },
    {
      question: "How does GOVERN differ from the other core functions?",
      answer: "GOVERN is a cross-cutting function that informs and is integrated with all other functions (MAP, MEASURE, MANAGE). While the other functions are more operational, GOVERN establishes the organizational culture, policies, and processes that enable effective AI risk management across all activities."
    },
    {
      question: "Can the AI RMF help with EU AI Act compliance?",
      answer: "Yes. While the AI RMF is a US voluntary framework and the EU AI Act is a binding regulation, they share common principles and approaches. Organizations using the AI RMF can leverage their practices to support EU AI Act compliance, particularly for risk assessment, documentation, and ongoing monitoring requirements."
    },
    {
      question: "How often should AI RMF practices be reviewed?",
      answer: "The AI RMF emphasizes continuous improvement. Reviews should occur: (1) Regularly as part of normal operations, (2) When AI systems are modified, (3) When new risks are identified, (4) When regulations or guidance change, and (5) After incidents or near-misses. Many organizations conduct formal reviews quarterly or annually."
    },
    {
      question: "What is the AI RMF Playbook?",
      answer: "The AI RMF Playbook is a companion resource that provides suggested actions, documentation templates, and implementation guidance for each subcategory of the framework. It helps organizations operationalize the framework with practical, actionable steps."
    },
    {
      question: "How does the AI RMF address AI bias?",
      answer: "The AI RMF addresses bias through its 'Fair with Managed Bias' trustworthy characteristic. It emphasizes that bias can emerge at any point in the AI lifecycle and requires proactive identification, measurement, and mitigation. The framework recognizes that eliminating all bias may not be possible but managing harmful bias is essential."
    },
    {
      question: "What resources does NIST provide for AI RMF implementation?",
      answer: "NIST provides several resources: (1) The AI RMF 1.0 document, (2) The AI RMF Playbook with suggested actions, (3) Crosswalks to other frameworks and standards, (4) The new Cyber AI Profile, (5) Use case studies and examples, and (6) Regular webinars and community engagement. All resources are freely available on the NIST AI RMF website."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-500/10 to-green-500/10" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
        <div className="container max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="outline" className="text-sm px-4 py-2 bg-blue-500/10 border-blue-500/30">
                <Building2 className="h-4 w-4 mr-2" />
                NIST AI 100-1 | Version 1.0 | January 2023
              </Badge>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              The Complete Guide to
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> NIST AI RMF</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The US National Institute of Standards and Technology's AI Risk Management Framework.
              A voluntary, comprehensive approach to managing AI risks throughout the AI lifecycle.
              Learn the four core functions, seven trustworthy characteristics, and practical implementation.
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Link href="/courses">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Start NIST AI RMF Training
                </Button>
              </Link>
              <Link href="/compliance">
                <Button size="lg" variant="outline">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Assess Your Alignment
                </Button>
              </Link>
              <Button size="lg" variant="ghost" asChild>
                <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Official NIST Site
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="border-y bg-muted/30">
        <div className="container max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">4</div>
              <div className="text-sm text-muted-foreground">Core Functions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">7</div>
              <div className="text-sm text-muted-foreground">Trustworthy Characteristics</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">19</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">72+</div>
              <div className="text-sm text-muted-foreground">Subcategories</div>
            </div>
          </div>
        </div>
      </section>

      {/* What is NIST AI RMF */}
      <section className="py-20 px-6">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-6">
              <Badge variant="secondary" className="text-sm">Understanding the Framework</Badge>
              <h2 className="text-4xl font-bold">What is NIST AI RMF?</h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  The <strong className="text-foreground">NIST AI Risk Management Framework (AI RMF)</strong> is a voluntary
                  framework published by the US National Institute of Standards and Technology in January 2023. It provides
                  organizations with guidance for managing risks associated with AI systems throughout their lifecycle.
                </p>
                <p>
                  Unlike regulatory requirements, the AI RMF is designed to be flexible and adaptable, allowing organizations
                  of all sizes and sectors to implement risk management practices appropriate to their context and risk tolerance.
                </p>
                <p>
                  The framework is built around four core functions (GOVERN, MAP, MEASURE, MANAGE) and seven characteristics
                  of trustworthy AI, providing a comprehensive approach to responsible AI development and deployment.
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <Card className="flex-1 p-4 bg-blue-500/5 border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <Workflow className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="font-semibold">Lifecycle-Based</div>
                      <div className="text-sm text-muted-foreground">End-to-End Coverage</div>
                    </div>
                  </div>
                </Card>
                <Card className="flex-1 p-4 bg-purple-500/5 border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <Layers className="h-8 w-8 text-purple-600" />
                    <div>
                      <div className="font-semibold">Flexible</div>
                      <div className="text-sm text-muted-foreground">Adapt to Your Context</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            <div className="relative">
              <Card className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Key Objectives
                </h3>
                <ul className="space-y-4">
                  {[
                    "Enable organizations to incorporate trustworthiness into AI systems",
                    "Provide flexible, scalable risk management guidance",
                    "Support ongoing improvement throughout AI lifecycle",
                    "Promote transparency and accountability in AI development",
                    "Address technical and sociotechnical AI risks",
                    "Complement existing organizational risk management practices"
                  ].map((objective, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Functions */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="text-sm mb-4">The Framework Structure</Badge>
            <h2 className="text-4xl font-bold mb-4">Four Core Functions</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The AI RMF organizes risk management activities into four interconnected functions.
              GOVERN is a cross-cutting function that informs all others.
            </p>
          </motion.div>

          <Tabs defaultValue="govern" className="w-full">
            <TabsList className="grid grid-cols-4 w-full mb-8">
              {coreFunctions.map((func) => (
                <TabsTrigger
                  key={func.name.toLowerCase()}
                  value={func.name.toLowerCase()}
                  className="text-sm md:text-base py-3"
                >
                  <func.icon className="h-4 w-4 mr-2 hidden sm:inline" />
                  {func.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {coreFunctions.map((func) => (
              <TabsContent key={func.name.toLowerCase()} value={func.name.toLowerCase()}>
                <Card className={`p-8 ${func.bgColor} ${func.borderColor} border-2`}>
                  <div className="flex items-start gap-6 mb-8">
                    <div className={`p-4 rounded-xl bg-white dark:bg-gray-900 shadow-sm`}>
                      <func.icon className={`h-10 w-10 ${func.textColor}`} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold">{func.name}</h3>
                      <p className={`text-lg ${func.textColor} font-medium mt-1`}>{func.tagline}</p>
                      <p className="text-muted-foreground mt-2 max-w-2xl">{func.description}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {func.categories.map((category) => (
                      <Card key={category.id} className="p-4 bg-white/50 dark:bg-gray-900/50">
                        <Badge variant="outline" className={`mb-2 ${func.textColor} ${func.borderColor}`}>
                          {category.id}
                        </Badge>
                        <h4 className="font-semibold mb-2">{category.title}</h4>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </Card>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Function Relationship Diagram */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <Card className="p-8 text-center">
              <h3 className="text-xl font-bold mb-6">Function Relationships</h3>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 text-lg px-4 py-2">GOVERN</Badge>
                  <span className="text-muted-foreground">(Cross-cutting)</span>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-muted-foreground" />
                  <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 px-3 py-1">MAP</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30 px-3 py-1">MEASURE</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30 px-3 py-1">MANAGE</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 max-w-2xl mx-auto">
                The functions are interconnected and iterative. GOVERN provides the foundation, while MAP, MEASURE, and MANAGE
                form a continuous cycle of risk identification, assessment, and treatment.
              </p>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Trustworthy Characteristics */}
      <section className="py-20 px-6">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="text-sm mb-4">Foundation of Trustworthy AI</Badge>
            <h2 className="text-4xl font-bold mb-4">7 Trustworthy AI Characteristics</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The AI RMF identifies seven characteristics that contribute to trustworthy AI.
              These characteristics may overlap and can sometimes be in tension with each other.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trustworthyCharacteristics.map((char, idx) => (
              <motion.div
                key={char.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="h-full p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-green-500/10">
                      <char.icon className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-bold">{char.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{char.description}</p>
                  <div className="space-y-2">
                    {char.keyAspects.map((aspect, aspectIdx) => (
                      <div key={aspectIdx} className="flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {aspect}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="mt-8 p-6 bg-amber-500/10 border-amber-500/20">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-amber-700 dark:text-amber-400">Managing Tradeoffs</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  These characteristics may require balancing tradeoffs. For example, increasing explainability might
                  reduce accuracy, or privacy protection might limit data availability. Organizations should prioritize
                  based on their context, stakeholder needs, and risk tolerance.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Cyber AI Profile */}
      <section className="py-20 px-6 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-yellow-500/10">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Card className="p-8 border-red-500/30 bg-white/50 dark:bg-gray-950/50">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-xl bg-red-500/20">
                  <Lock className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <Badge variant="outline" className="mb-2 border-red-500/30 text-red-600">
                    New Release - {cyberAIProfile.releaseDate}
                  </Badge>
                  <h2 className="text-3xl font-bold">NIST AI RMF Cyber AI Profile</h2>
                  <p className="text-muted-foreground mt-2">{cyberAIProfile.description}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cyberAIProfile.keyFeatures.map((feature, idx) => (
                  <Card key={idx} className="p-4 bg-red-500/5">
                    <h4 className="font-semibold text-red-700 dark:text-red-400">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                  </Card>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Framework Alignment */}
      <section className="py-20 px-6">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="text-sm mb-4">Cross-Framework Compatibility</Badge>
            <h2 className="text-4xl font-bold mb-4">Alignment with Other Frameworks</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The NIST AI RMF is designed to complement and align with other AI governance frameworks and standards.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {frameworkAlignment.map((item, idx) => (
              <motion.div
                key={item.framework}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">{item.framework}</h3>
                    <Badge variant="outline" className={item.alignmentColor}>
                      {item.alignment} Alignment
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key Mappings:</h4>
                    {item.keyMappings.map((mapping, mapIdx) => (
                      <div key={mapIdx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        {mapping}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Steps */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="text-sm mb-4">Getting Started</Badge>
            <h2 className="text-4xl font-bold mb-4">Implementation Roadmap</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A practical approach to implementing the NIST AI RMF in your organization.
            </p>
          </motion.div>

          <div className="space-y-6">
            {implementationSteps.map((step, idx) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      <div className="grid md:grid-cols-2 gap-2">
                        {step.activities.map((activity, actIdx) => (
                          <div key={actIdx} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            {activity}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
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
              Your Implementation Partner
            </Badge>
            <h2 className="text-4xl font-bold mb-4">How CSOAI Implements NIST AI RMF</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform provides comprehensive tools aligned with every NIST AI RMF function.
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
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-6"
          >
            <Badge variant="secondary" className="text-sm bg-white/20 text-white border-white/30">
              <Award className="h-4 w-4 mr-2" />
              Professional Development
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Master the NIST AI RMF
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Our comprehensive training program covers all aspects of the NIST AI RMF, from governance
              to implementation. Earn your certification and become an AI risk management expert.
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Link href="/courses">
                <Button size="lg" variant="secondary" className="bg-white text-blue-700 hover:bg-blue-50">
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
            <div className="flex items-center justify-center gap-8 pt-6 text-blue-100 flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>All 4 Core Functions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Practical Exercises</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Implementation Playbook</span>
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
              Common questions about the NIST AI RMF and its implementation.
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
              Explore how other AI governance frameworks work alongside NIST AI RMF.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/guides/eu-ai-act">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Globe className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold">EU AI Act</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  The binding EU regulation that aligns with NIST AI RMF principles.
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
                  The certifiable standard that maps directly to AI RMF functions.
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
                  Compare NIST's voluntary approach with China's governance framework.
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
              Ready to Implement AI Risk Management?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join organizations worldwide implementing the NIST AI RMF with CSOAI.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
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
