/**
 * ISO/IEC 42001 Comprehensive Guide
 * The definitive resource for understanding the world's first certifiable AI Management System standard
 */

import { motion } from "framer-motion";
import {
  Award, CheckCircle2, Shield, FileText, Building2, Globe,
  BookOpen, ArrowRight, ExternalLink, Layers, RefreshCw, Target,
  Users, Lock, AlertCircle, Cog, GraduationCap, BarChart3,
  ClipboardCheck, Workflow, Scale, TrendingUp, Star, Zap
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

export default function ISO42001Guide() {
  const aimsComponents = [
    {
      clause: "4",
      title: "Context of the Organization",
      icon: Building2,
      color: "blue",
      description: "Understanding the organization's context, stakeholder needs, and AIMS scope",
      requirements: [
        "Determine external and internal issues relevant to AI",
        "Identify interested parties and their requirements",
        "Determine the scope of the AIMS",
        "Establish, implement, maintain, and improve the AIMS"
      ]
    },
    {
      clause: "5",
      title: "Leadership",
      icon: Users,
      color: "purple",
      description: "Top management commitment, policy establishment, and role assignment",
      requirements: [
        "Demonstrate leadership and commitment",
        "Establish an AI policy aligned with organizational strategy",
        "Assign AIMS roles, responsibilities, and authorities",
        "Ensure integration with business processes"
      ]
    },
    {
      clause: "6",
      title: "Planning",
      icon: Target,
      color: "green",
      description: "Risk and opportunity assessment, objective setting, and change management",
      requirements: [
        "Address risks and opportunities for the AIMS",
        "Establish AI objectives and plan to achieve them",
        "Plan changes to the AIMS systematically",
        "Document AI impact assessment processes"
      ]
    },
    {
      clause: "7",
      title: "Support",
      icon: Cog,
      color: "orange",
      description: "Resources, competence, awareness, communication, and documentation",
      requirements: [
        "Determine and provide necessary resources",
        "Ensure personnel competence for AI activities",
        "Establish awareness of AI policy and AIMS",
        "Manage documented information effectively"
      ]
    },
    {
      clause: "8",
      title: "Operation",
      icon: Workflow,
      color: "red",
      description: "Operational planning, AI system impact assessment, and lifecycle management",
      requirements: [
        "Plan and control AI system development and deployment",
        "Conduct AI system impact assessments",
        "Manage AI system lifecycle processes",
        "Control outsourced AI processes"
      ]
    },
    {
      clause: "9",
      title: "Performance Evaluation",
      icon: BarChart3,
      color: "cyan",
      description: "Monitoring, measurement, internal audit, and management review",
      requirements: [
        "Monitor, measure, analyze, and evaluate AIMS",
        "Conduct internal audits at planned intervals",
        "Perform management reviews of the AIMS",
        "Document performance evaluation results"
      ]
    },
    {
      clause: "10",
      title: "Improvement",
      icon: TrendingUp,
      color: "emerald",
      description: "Nonconformity handling, corrective action, and continual improvement",
      requirements: [
        "Address nonconformities and take corrective actions",
        "Continually improve AIMS suitability and effectiveness",
        "Update AIMS based on evaluation results",
        "Implement lessons learned from AI incidents"
      ]
    }
  ];

  const certificationProcess = [
    {
      stage: 1,
      title: "Gap Analysis",
      duration: "2-4 weeks",
      description: "Assess current state against ISO 42001 requirements to identify gaps",
      activities: [
        "Review existing AI governance documentation",
        "Interview key stakeholders",
        "Assess current AI processes and controls",
        "Create gap analysis report with recommendations"
      ]
    },
    {
      stage: 2,
      title: "AIMS Implementation",
      duration: "3-6 months",
      description: "Design and implement the AI Management System based on gap analysis",
      activities: [
        "Develop AI policy and objectives",
        "Create required documentation and procedures",
        "Implement AI impact assessment processes",
        "Train personnel on AIMS requirements"
      ]
    },
    {
      stage: 3,
      title: "Internal Audit",
      duration: "2-4 weeks",
      description: "Conduct internal audit to verify AIMS implementation and readiness",
      activities: [
        "Plan and execute internal AIMS audit",
        "Identify nonconformities and observations",
        "Implement corrective actions",
        "Conduct management review"
      ]
    },
    {
      stage: 4,
      title: "Stage 1 Audit",
      duration: "1-2 days",
      description: "Certification body reviews documentation and readiness for Stage 2",
      activities: [
        "Document review by certification auditor",
        "Assessment of AIMS scope and boundaries",
        "Verification of readiness for Stage 2",
        "Identification of potential concerns"
      ]
    },
    {
      stage: 5,
      title: "Stage 2 Audit",
      duration: "2-5 days",
      description: "On-site audit to verify implementation effectiveness and conformity",
      activities: [
        "On-site verification of AIMS implementation",
        "Interviews with AI system stakeholders",
        "Review of AI impact assessments",
        "Evaluation of operational controls"
      ]
    },
    {
      stage: 6,
      title: "Certification",
      duration: "2-4 weeks",
      description: "Certificate issuance and ongoing surveillance planning",
      activities: [
        "Address any audit findings",
        "Certification decision by CB",
        "Certificate issuance (3-year validity)",
        "Plan annual surveillance audits"
      ]
    }
  ];

  const certificationBenefits = [
    {
      title: "Regulatory Compliance",
      description: "Demonstrates alignment with emerging AI regulations including EU AI Act and supports conformity assessment requirements.",
      icon: Shield
    },
    {
      title: "Competitive Advantage",
      description: "Differentiates your organization in the market by demonstrating commitment to responsible AI practices.",
      icon: Star
    },
    {
      title: "Risk Reduction",
      description: "Systematic approach to identifying and managing AI risks protects the organization and stakeholders.",
      icon: AlertCircle
    },
    {
      title: "Customer Confidence",
      description: "Third-party certification provides independent assurance of your AI governance capabilities.",
      icon: Users
    },
    {
      title: "Operational Excellence",
      description: "Structured processes improve AI development, deployment, and monitoring efficiency.",
      icon: Cog
    },
    {
      title: "Continuous Improvement",
      description: "Built-in PDCA cycle ensures ongoing enhancement of AI management practices.",
      icon: RefreshCw
    }
  ];

  const recentCertifications = [
    {
      organization: "Microsoft",
      date: "2024",
      scope: "Azure AI Services",
      certificationBody: "BSI",
      significance: "First major cloud provider certified"
    },
    {
      organization: "KPMG",
      date: "2024",
      scope: "AI Advisory Services",
      certificationBody: "LRQA",
      significance: "First Big Four firm certified"
    },
    {
      organization: "ServiceNow",
      date: "2024",
      scope: "Now Platform AI",
      certificationBody: "Schellman",
      significance: "First enterprise software platform"
    },
    {
      organization: "IBM",
      date: "2024",
      scope: "Watson AI Platform",
      certificationBody: "BSI",
      significance: "Enterprise AI platform certification"
    },
    {
      organization: "Salesforce",
      date: "2024",
      scope: "Einstein AI",
      certificationBody: "LRQA",
      significance: "CRM AI capabilities certified"
    },
    {
      organization: "SAP",
      date: "2025",
      scope: "SAP Business AI",
      certificationBody: "TUV",
      significance: "ERP AI integration certified"
    }
  ];

  const iso27001Integration = {
    description: "ISO 42001 is designed to integrate seamlessly with ISO/IEC 27001 (Information Security Management System), sharing the Annex SL high-level structure common to all ISO management system standards.",
    sharedElements: [
      {
        element: "High-Level Structure",
        detail: "Both follow Annex SL structure with identical clause numbering"
      },
      {
        element: "Risk-Based Approach",
        detail: "Similar risk assessment and treatment methodologies"
      },
      {
        element: "PDCA Cycle",
        detail: "Continuous improvement through Plan-Do-Check-Act"
      },
      {
        element: "Documented Information",
        detail: "Compatible documentation requirements"
      },
      {
        element: "Internal Audit",
        detail: "Combined audits possible for efficiency"
      },
      {
        element: "Management Review",
        detail: "Integrated management review processes"
      }
    ],
    integrationBenefits: [
      "Reduced duplication of documentation and processes",
      "Combined internal and external audits",
      "Unified management review meetings",
      "Consistent risk assessment approaches",
      "Streamlined training and awareness programs",
      "Single integrated management system possible"
    ]
  };

  const aimsAnnexes = [
    {
      annex: "A",
      title: "Reference Control Objectives and Controls",
      description: "Comprehensive set of AI-specific controls for organizations to consider",
      categories: [
        "AI system impact assessment",
        "AI system development",
        "Data for AI systems",
        "AI system operation",
        "Third-party and customer relationships"
      ]
    },
    {
      annex: "B",
      title: "Implementation Guidance",
      description: "Detailed guidance on implementing Annex A controls",
      categories: [
        "Control selection criteria",
        "Implementation considerations",
        "Documentation requirements",
        "Monitoring and measurement"
      ]
    },
    {
      annex: "C",
      title: "AI-Specific Objectives",
      description: "Potential organizational objectives for AI systems",
      categories: [
        "Ethical AI objectives",
        "Transparency objectives",
        "Accountability objectives",
        "Safety and security objectives"
      ]
    },
    {
      annex: "D",
      title: "Use of AIMS Across Domains",
      description: "Guidance for applying AIMS in different organizational contexts",
      categories: [
        "Enterprise-wide implementation",
        "Project-specific implementation",
        "Supply chain considerations",
        "Regulatory alignment"
      ]
    }
  ];

  const csoaiFeatures = [
    {
      title: "AIMS Documentation",
      description: "Pre-built templates and AI-assisted generation of all required ISO 42001 documentation including policies, procedures, and records.",
      link: "/workbench"
    },
    {
      title: "AI System Registry",
      description: "Comprehensive inventory aligned with ISO 42001 Clause 8 requirements for AI system lifecycle management.",
      link: "/ai-systems"
    },
    {
      title: "Impact Assessment",
      description: "Structured AI system impact assessment tools meeting ISO 42001 Annex A control requirements.",
      link: "/risk-assessment"
    },
    {
      title: "PDCA Framework",
      description: "Our PDCA cycles directly implement ISO 42001's continuous improvement requirements.",
      link: "/pdca"
    },
    {
      title: "Audit Support",
      description: "Evidence collection, audit trail maintenance, and compliance dashboards for internal and certification audits.",
      link: "/compliance"
    },
    {
      title: "Training Programs",
      description: "Comprehensive ISO 42001 training with practical exercises and professional certification preparation.",
      link: "/courses"
    }
  ];

  const faqs = [
    {
      question: "What is ISO/IEC 42001 and when was it published?",
      answer: "ISO/IEC 42001:2023 is the world's first international standard for AI Management Systems (AIMS). Published in December 2023, it specifies requirements for organizations to establish, implement, maintain, and continually improve an AI management system. It provides a framework for managing AI-related risks and opportunities within an organization's context."
    },
    {
      question: "Is ISO 42001 certification mandatory?",
      answer: "ISO 42001 certification is voluntary. However, it is increasingly becoming a market expectation and may support compliance with emerging regulations like the EU AI Act. Organizations may also face contractual requirements from customers or partners to achieve certification. The decision to certify depends on business drivers, regulatory environment, and stakeholder expectations."
    },
    {
      question: "How long does ISO 42001 certification take?",
      answer: "Typical certification timelines range from 6-12 months, depending on organizational size, complexity, and current AI governance maturity. This includes gap analysis (2-4 weeks), AIMS implementation (3-6 months), internal audit (2-4 weeks), and the certification audit process (4-6 weeks). Organizations with existing ISO management systems may achieve faster certification."
    },
    {
      question: "How does ISO 42001 relate to the EU AI Act?",
      answer: "ISO 42001 provides a management system framework that can support EU AI Act compliance. While the EU AI Act sets specific legal requirements for AI systems in the EU, ISO 42001 provides the organizational processes to meet those requirements systematically. Article 40 of the EU AI Act explicitly mentions harmonized standards, and ISO 42001 is expected to become a key supporting standard."
    },
    {
      question: "Can ISO 42001 be integrated with ISO 27001?",
      answer: "Yes, ISO 42001 and ISO 27001 share the Annex SL high-level structure common to all ISO management system standards. This enables seamless integration through combined documentation, unified risk assessment processes, integrated audits, and joint management reviews. Many organizations pursue certification to both standards simultaneously or add ISO 42001 to existing ISO 27001 systems."
    },
    {
      question: "What is an AI Management System (AIMS)?",
      answer: "An AI Management System (AIMS) is a set of interrelated elements that an organization uses to establish policies, objectives, and processes for managing AI-related activities. It includes organizational structure, roles and responsibilities, planning processes, documentation, operational controls, performance evaluation, and improvement mechanisms specific to AI."
    },
    {
      question: "Who should get ISO 42001 certified?",
      answer: "Organizations that should consider ISO 42001 certification include: AI providers developing or deploying AI systems, enterprises using AI in critical business processes, organizations subject to AI regulations, companies in regulated industries (healthcare, finance), government agencies deploying AI, and organizations wanting to demonstrate responsible AI commitment to stakeholders."
    },
    {
      question: "What are the Annex A controls in ISO 42001?",
      answer: "Annex A provides reference control objectives and controls across five domains: (1) AI system impact assessment controls, (2) AI system development controls, (3) Data for AI systems controls, (4) AI system operation controls, and (5) Third-party and customer relationship controls. Organizations select applicable controls based on their risk assessment and context."
    },
    {
      question: "How does ISO 42001 address AI ethics?",
      answer: "ISO 42001 addresses AI ethics through its policy requirements (Clause 5), AI impact assessment processes (Clause 8), and Annex C objectives covering ethical AI development and deployment. The standard requires organizations to consider societal, legal, and ethical implications of their AI systems and establish appropriate controls and monitoring."
    },
    {
      question: "What documentation is required for ISO 42001?",
      answer: "Required documentation includes: AIMS scope, AI policy, AI objectives, risk assessment and treatment, AI impact assessments, operational procedures, competence records, monitoring and measurement records, internal audit records, management review records, and nonconformity and corrective action records. The extent of documentation depends on organizational size and complexity."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-indigo-500/10 to-blue-500/10" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
        <div className="container max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="outline" className="text-sm px-4 py-2 bg-purple-500/10 border-purple-500/30">
                <Award className="h-4 w-4 mr-2" />
                ISO/IEC 42001:2023 | First Certifiable AI Standard
              </Badge>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              The Complete Guide to
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent"> ISO/IEC 42001</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The world's first certifiable international standard for AI Management Systems.
              Establish, implement, and maintain a comprehensive framework for responsible AI
              governance with third-party certification.
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Link href="/courses">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Start ISO 42001 Training
                </Button>
              </Link>
              <Link href="/compliance">
                <Button size="lg" variant="outline">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Check Your Readiness
                </Button>
              </Link>
              <Button size="lg" variant="ghost" asChild>
                <a href="https://www.iso.org/standard/81230.html" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Official ISO Page
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
              <div className="text-3xl font-bold text-purple-600">Dec 2023</div>
              <div className="text-sm text-muted-foreground">Publication Date</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-600">7</div>
              <div className="text-sm text-muted-foreground">Core Clauses</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">4</div>
              <div className="text-sm text-muted-foreground">Informative Annexes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">3 Years</div>
              <div className="text-sm text-muted-foreground">Certificate Validity</div>
            </div>
          </div>
        </div>
      </section>

      {/* What is ISO 42001 */}
      <section className="py-20 px-6">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-6">
              <Badge variant="secondary" className="text-sm">Understanding the Standard</Badge>
              <h2 className="text-4xl font-bold">What is ISO/IEC 42001?</h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  <strong className="text-foreground">ISO/IEC 42001:2023</strong> is the first international standard
                  specifying requirements for an AI Management System (AIMS). Published in December 2023, it provides
                  organizations with a framework to manage AI-related risks and opportunities systematically.
                </p>
                <p>
                  Unlike guidance documents or voluntary frameworks, ISO 42001 is a certifiable standard. Organizations
                  can undergo third-party audits to achieve certification, demonstrating to customers, regulators, and
                  stakeholders their commitment to responsible AI practices.
                </p>
                <p>
                  The standard follows the Annex SL high-level structure common to all ISO management system standards,
                  enabling seamless integration with ISO 27001 (Information Security), ISO 9001 (Quality), and other
                  management systems.
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <Card className="flex-1 p-4 bg-purple-500/5 border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <Award className="h-8 w-8 text-purple-600" />
                    <div>
                      <div className="font-semibold">Certifiable</div>
                      <div className="text-sm text-muted-foreground">Third-Party Verified</div>
                    </div>
                  </div>
                </Card>
                <Card className="flex-1 p-4 bg-indigo-500/5 border-indigo-500/20">
                  <div className="flex items-center gap-3">
                    <Layers className="h-8 w-8 text-indigo-600" />
                    <div>
                      <div className="font-semibold">Integratable</div>
                      <div className="text-sm text-muted-foreground">ISO Annex SL</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            <div className="relative">
              <Card className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-200 dark:border-purple-800">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-purple-600" />
                  Key Features
                </h3>
                <ul className="space-y-4">
                  {[
                    "Comprehensive AI lifecycle management framework",
                    "Risk-based approach to AI governance",
                    "AI-specific impact assessment requirements",
                    "Integration with existing management systems",
                    "Continuous improvement through PDCA cycle",
                    "Third-party certification available globally"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AIMS Components */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="text-sm mb-4">The Standard Structure</Badge>
            <h2 className="text-4xl font-bold mb-4">Key Components of AIMS</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              ISO 42001 follows the Annex SL high-level structure with seven main clauses (4-10) defining AIMS requirements.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {aimsComponents.map((component, idx) => {
              const colorClasses = {
                blue: "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40",
                purple: "bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40",
                green: "bg-green-500/10 border-green-500/20 hover:border-green-500/40",
                orange: "bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40",
                red: "bg-red-500/10 border-red-500/20 hover:border-red-500/40",
                cyan: "bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40",
                emerald: "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40"
              }[component.color];

              const iconColorClass = {
                blue: "text-blue-600",
                purple: "text-purple-600",
                green: "text-green-600",
                orange: "text-orange-600",
                red: "text-red-600",
                cyan: "text-cyan-600",
                emerald: "text-emerald-600"
              }[component.color];

              return (
                <motion.div
                  key={component.clause}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`h-full p-6 transition-all ${colorClasses}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-white dark:bg-gray-900 shadow-sm">
                        <component.icon className={`h-6 w-6 ${iconColorClass}`} />
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-1">Clause {component.clause}</Badge>
                        <h3 className="font-bold">{component.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{component.description}</p>
                    <div className="space-y-2">
                      {component.requirements.map((req, reqIdx) => (
                        <div key={reqIdx} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                          {req}
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Annexes */}
      <section className="py-20 px-6">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="text-sm mb-4">Supporting Guidance</Badge>
            <h2 className="text-4xl font-bold mb-4">Informative Annexes</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              ISO 42001 includes four informative annexes providing additional guidance for implementation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {aimsAnnexes.map((annex, idx) => (
              <motion.div
                key={annex.annex}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Badge className="text-lg px-3 py-1 bg-purple-500/20 text-purple-600 border-purple-500/30">
                      Annex {annex.annex}
                    </Badge>
                    <div>
                      <h3 className="text-xl font-bold">{annex.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{annex.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {annex.categories.map((category, catIdx) => (
                      <div key={catIdx} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        {category}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certification Process */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="text-sm mb-4">Path to Certification</Badge>
            <h2 className="text-4xl font-bold mb-4">Certification Process</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A typical ISO 42001 certification journey takes 6-12 months from start to certificate issuance.
            </p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-6 md:left-1/2 transform md:-translate-x-1/2 h-full w-1 bg-gradient-to-b from-purple-500 via-indigo-500 to-blue-500" />
            <div className="space-y-8">
              {certificationProcess.map((stage, idx) => (
                <motion.div
                  key={stage.stage}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex gap-8 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  <div className={`flex-1 ${idx % 2 === 0 ? 'md:text-right' : 'md:text-left'} pl-16 md:pl-0`}>
                    <Card className="inline-block p-6 max-w-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-purple-600 border-purple-500/30">
                          Stage {stage.stage}
                        </Badge>
                        <Badge variant="secondary">{stage.duration}</Badge>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{stage.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{stage.description}</p>
                      <div className="space-y-2">
                        {stage.activities.map((activity, actIdx) => (
                          <div key={actIdx} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            {activity}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                  <div className="absolute left-6 md:relative md:left-0 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold z-10 shadow-lg">
                    {stage.stage}
                  </div>
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Certification Benefits */}
      <section className="py-20 px-6">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="text-sm mb-4">Why Get Certified?</Badge>
            <h2 className="text-4xl font-bold mb-4">Benefits of ISO 42001 Certification</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Certification provides tangible benefits for your organization and stakeholders.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificationBenefits.map((benefit, idx) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="h-full p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-green-500/10">
                      <benefit.icon className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-bold">{benefit.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Certifications */}
      <section className="py-20 px-6 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="text-sm mb-4 bg-green-500/20 text-green-600 border-green-500/30">
              <Zap className="h-4 w-4 mr-2" />
              Industry Leaders
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Recent Certifications</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Leading organizations across industries have achieved ISO 42001 certification.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentCertifications.map((cert, idx) => (
              <motion.div
                key={cert.organization}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="h-full p-6 bg-white/50 dark:bg-gray-950/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold">{cert.organization}</h3>
                    <Badge variant="outline" className="text-green-600 border-green-500/30">
                      {cert.date}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Scope:</span>
                      <span className="font-medium">{cert.scope}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Certification Body:</span>
                      <span className="font-medium">{cert.certificationBody}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                    {cert.significance}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ISO 27001 Integration */}
      <section className="py-20 px-6">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Lock className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <Badge variant="outline" className="mb-2 border-blue-500/30 text-blue-600">
                    Integrated Management
                  </Badge>
                  <h2 className="text-3xl font-bold">Integration with ISO/IEC 27001</h2>
                  <p className="text-muted-foreground mt-2">{iso27001Integration.description}</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold mb-4 text-lg">Shared Elements</h3>
                  <div className="space-y-3">
                    {iso27001Integration.sharedElements.map((item, idx) => (
                      <Card key={idx} className="p-3 bg-white/50 dark:bg-gray-900/50">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-400">{item.element}</h4>
                        <p className="text-sm text-muted-foreground">{item.detail}</p>
                      </Card>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-4 text-lg">Integration Benefits</h3>
                  <div className="space-y-2">
                    {iso27001Integration.integrationBenefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* How CSOAI Helps */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="text-sm mb-4 bg-green-500/10 text-green-600 border-green-500/30">
              Your Certification Partner
            </Badge>
            <h2 className="text-4xl font-bold mb-4">How CSOAI Aligns with ISO 42001</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform provides comprehensive tools to implement and maintain your AIMS.
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
      <section className="py-20 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
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
              Prepare for ISO 42001 Certification
            </h2>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto">
              Our comprehensive training program covers all ISO 42001 requirements, from AIMS
              implementation to audit preparation. Earn your certification and lead AI governance.
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Link href="/courses">
                <Button size="lg" variant="secondary" className="bg-white text-purple-700 hover:bg-purple-50">
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
            <div className="flex items-center justify-center gap-8 pt-6 text-purple-100 flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>All 7 Clauses Covered</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Audit Preparation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Documentation Templates</span>
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
              Common questions about ISO 42001 and the certification process.
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
              Explore how other AI governance frameworks complement ISO 42001.
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
                  The binding regulation that ISO 42001 helps you comply with.
                </p>
                <span className="text-blue-600 text-sm font-medium flex items-center">
                  Read Guide <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Card>
            </Link>
            <Link href="/guides/nist-ai-rmf">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold">NIST AI RMF</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  The US framework that maps directly to ISO 42001 structure.
                </p>
                <span className="text-blue-600 text-sm font-medium flex items-center">
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
                  Compare international standards with China's AI governance.
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
              Ready for ISO 42001 Certification?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join the growing number of organizations achieving ISO 42001 certification with CSOAI.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
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
