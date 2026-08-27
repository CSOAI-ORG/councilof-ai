import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  AlertTriangle,
  Shield,
  CheckCircle,
  ArrowRight,
  FileText,
  Gavel,
  Euro,
  ChevronDown,
} from "lucide-react";

const checklistItems = [
  {
    title: "AI system inventory and risk classification",
    description:
      "Map every AI system in your organization and classify each under the EU AI Act's four-tier risk framework: prohibited, high-risk, limited risk, or minimal risk.",
    link: "/compliance",
  },
  {
    title: "Conformity assessment procedures",
    description:
      "Establish internal or third-party processes to verify that high-risk AI systems meet all essential requirements before deployment or market entry.",
    link: "/conformity-assessment",
  },
  {
    title: "Technical documentation",
    description:
      "Compile system architecture, training data provenance, performance benchmarks, risk mitigation measures, and intended-use declarations.",
    link: "/docs",
  },
  {
    title: "Post-market monitoring system",
    description:
      "Set up continuous logging, incident detection, and feedback loops to catch drift, bias, or safety issues after your AI goes live.",
    link: "/compliance-monitoring",
  },
  {
    title: "Human oversight mechanisms",
    description:
      "Design meaningful human-in-the-loop checkpoints so operators can understand, intervene in, and override high-risk AI decisions.",
    link: "/how-it-works",
  },
  {
    title: "Measurement Credential (CSOAI specific)",
    description:
      "Complete the 20-week measurement credential program to earn an externally recognized measurement attestation of your team's EU AI Act competence.",
    link: "/certification",
  },
];

const highRiskSystems = [
  "Employment & worker management",
  "Education & vocational training",
  "Credit scoring & insurance",
  "Critical infrastructure (transport, water, gas, electricity)",
  "Law enforcement & border control",
  "Migration, asylum & border management",
  "Administration of justice & democratic processes",
];

const comparisonRows = [
  {
    approach: "DIY Internal",
    time: "6-12 months",
    cost: "£50K-£200K",
    risk: "High",
    result: "Uncertain",
    highlight: false,
  },
  {
    approach: "Big 4 Consultant",
    time: "3-6 months",
    cost: "£200K-£1M",
    risk: "Medium",
    result: "Report only",
    highlight: false,
  },
  {
    approach: "CSOAI measurement credential",
    time: "20 weeks",
    cost: "£3.5K-£7.5K",
    risk: "Low",
    result: "Signed measurement",
    highlight: true,
  },
];

const faqs = [
  {
    question: "What happens if I'm not compliant by August 2?",
    answer:
      "Regulators can impose fines of up to €35 million or 7% of global annual turnover—whichever is higher. They may also issue corrective orders, ban specific AI systems, or mandate recalls. Early compliance builds defensible documentation that reduces enforcement risk.",
  },
  {
    question: "How long does the measurement credential take?",
    answer:
      "The standard measurement credential program runs 20 weeks: 8 weeks of structured coursework, 8 weeks of guided implementation, and 4 weeks of final assessment and Council review. Accelerated tracks are available for teams with existing compliance infrastructure.",
  },
  {
    question: "Does the measurement credential cover EU AI Act specifically?",
    answer:
      "Yes. The measurement credential curriculum is explicitly mapped to every high-risk requirement in the EU AI Act, including risk classification, conformity assessment, technical documentation, post-market monitoring, human oversight, and quality management.",
  },
  {
    question: "Can I start if my AI is still in development?",
    answer:
      "Absolutely. The measurement credential applies to your organization's compliance processes and governance framework, not just deployed systems. Starting during development ensures you build compliance in from the start—cheaper and faster than retrofitting later.",
  },
  {
    question: "What's the difference between compliance software and a signed measurement?",
    answer:
      "Compliance software tracks metrics and generates reports. Council of AI publishes signed, independently verifiable measurements of your people, processes, and systems against published frameworks. Any compliance determination or certification remains with regulators and accredited conformity-assessment bodies—we measure; we never certify.",
  },
];

const schemaFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function EUAIActUrgency() {
  const [daysLeft, setDaysLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    const deadline = new Date("2027-12-02T00:00:00");
    const update = () => {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();
      setDaysLeft(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
    };
    update();
    const timer = setInterval(update, 1000 * 60 * 60); // Update hourly
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-950">
        <div className="container max-w-6xl mx-auto px-4 py-24 space-y-8">
          <Skeleton className="h-10 w-48 bg-emerald-200/50 dark:bg-emerald-900/50" />
          <Skeleton className="h-24 w-full bg-emerald-200/50 dark:bg-emerald-900/50" />
          <Skeleton className="h-24 w-5/6 bg-emerald-200/50 dark:bg-emerald-900/50" />
          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <Skeleton className="h-64 w-full bg-emerald-200/50 dark:bg-emerald-900/50" />
            <Skeleton className="h-64 w-full bg-emerald-200/50 dark:bg-emerald-900/50" />
            <Skeleton className="h-64 w-full bg-emerald-200/50 dark:bg-emerald-900/50" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-950">
        {/* Hero Section — URGENCY FIRST */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-red-500/5 dark:bg-red-900/10 animate-pulse pointer-events-none" />
          <div className="container max-w-6xl mx-auto px-4 py-20 md:py-28 relative">
            <div className="text-center max-w-4xl mx-auto">
              <Badge
                variant="outline"
                className="mb-6 border-red-300 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950 text-sm px-3 py-1"
              >
                <Clock className="h-3.5 w-3.5 mr-1" />
                Enforcement Deadline Approaching
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                <span className="text-red-600 dark:text-red-500">
                  {daysLeft}
                </span>{" "}
                Days Until EU AI Act High-Risk Enforcement
              </h1>

              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
                Transparency duties and the full penalty regime have applied since{" "}
                <strong>August 2, 2026</strong>. High-risk obligations begin{" "}
                <strong>December 2, 2027</strong> (Annex III; product-embedded Annex I:
                August 2, 2028), as amended by the Digital Omnibus (Reg (EU) 2026/1744).
                Is your organization ready?
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/certification">
                  <Button
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8 py-6"
                  >
                    Start the training
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 text-lg px-8 py-6"
                  >
                    Book Urgent Consultation
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* The Penalty Box */}
        <section className="container max-w-6xl mx-auto px-4 pb-20">
          <Card className="border-2 border-amber-400 dark:border-amber-600 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-amber-700 dark:text-amber-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  The Penalty Box
                </h2>
              </div>

              <p className="text-3xl md:text-4xl font-extrabold text-red-700 dark:text-red-400 mb-6">
                Up to €35 million OR 7% of global annual turnover — whichever is{" "}
                <span className="underline decoration-red-500 decoration-4 underline-offset-4">
                  HIGHER
                </span>
              </p>

              <div className="grid md:grid-cols-2 gap-8 items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                    High-Risk AI Systems Include
                  </h3>
                  <ul className="space-y-2">
                    {highRiskSystems.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-amber-600 dark:text-amber-400 mt-1">
                          •
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/60 dark:bg-gray-900/40 p-6 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Euro className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Fine Structure
                    </span>
                  </div>
                  <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex justify-between border-b border-amber-200 dark:border-amber-800 pb-2">
                      <span>Prohibited AI practices</span>
                      <span className="font-bold text-red-700 dark:text-red-400">
                        €35M or 7%
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-amber-200 dark:border-amber-800 pb-2">
                      <span>High-risk violations</span>
                      <span className="font-bold text-red-700 dark:text-red-400">
                        €15M or 3%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Misleading authorities</span>
                      <span className="font-bold text-red-700 dark:text-red-400">
                        €7.5M or 1.5%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* "What You Need by August 2" Checklist */}
        <section className="container max-w-6xl mx-auto px-4 pb-20">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-200">
              <FileText className="h-3.5 w-3.5 mr-1" />
              Compliance Checklist
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What You Need by August 2
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Enterprises deploying high-risk AI in the EU must have these six
              pillars in place. Each is mandatory under the Act.
            </p>
          </div>

          <div className="space-y-6">
            {checklistItems.map((item, idx) => (
              <Card
                key={idx}
                className="border border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {idx + 1}. {item.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700"
                        >
                          Required
                        </Badge>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {item.description}
                      </p>
                      <Progress
                        value={((idx + 1) / checklistItems.length) * 100}
                        className="h-2 mb-3"
                        indicatorClassName="bg-emerald-600"
                      />
                      <Link href={item.link}>
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1">
                          Learn More
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* "Why CSOAI Is Your Fastest Path to Compliance" Section */}
        <section className="container max-w-6xl mx-auto px-4 pb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why CSOAI Is Your Fastest Path to Compliance
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We combine structured training, autonomous oversight, and legal
              recognition into a single certification program.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors h-full">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-5">
                  <Clock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  20-Week Measurement Credential Program
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  A structured, proven curriculum that takes you from gap
                  analysis to certified compliance in under five months. No
                  wasted time, no ambiguous deliverables.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors h-full">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-5">
                  <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  33-agent Council of AI
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  After certification, your AI systems receive continuous
                  oversight from a designed council of 33 independent
                  agents. Bias-resistant, manipulation-proof, always on.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors h-full">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-5">
                  <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  UK-Registered Measurement Body
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  CSOAI operates under CSOAI Ltd, UK Companies House
                  16939677 — an independent legal entity that measures and attests
                  system behaviour against dated law. It is not an accredited
                  certification body and does not declare conformity.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Comparison: DIY vs CSOAI vs Consultant */}
        <section className="container max-w-6xl mx-auto px-4 pb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Compare Your Options
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Not all paths to compliance are equal. Here is the honest
              breakdown.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-emerald-200 dark:border-emerald-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
                    <TableHead className="text-emerald-900 dark:text-emerald-200 font-bold">
                      Approach
                    </TableHead>
                    <TableHead className="text-emerald-900 dark:text-emerald-200 font-bold">
                      Time
                    </TableHead>
                    <TableHead className="text-emerald-900 dark:text-emerald-200 font-bold">
                      Cost
                    </TableHead>
                    <TableHead className="text-emerald-900 dark:text-emerald-200 font-bold">
                      Risk
                    </TableHead>
                    <TableHead className="text-emerald-900 dark:text-emerald-200 font-bold">
                      Result
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonRows.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className={
                        row.highlight
                          ? "bg-emerald-50/60 dark:bg-emerald-950/30 font-semibold"
                          : ""
                      }
                    >
                      <TableCell className="text-gray-900 dark:text-white">
                        {row.approach}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {row.time}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {row.cost}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            row.risk === "High"
                              ? "border-red-300 text-red-700 dark:text-red-400"
                              : row.risk === "Medium"
                              ? "border-amber-300 text-amber-700 dark:text-amber-400"
                              : "border-emerald-300 text-emerald-700 dark:text-emerald-400"
                          }
                        >
                          {row.risk}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-white">
                        {row.highlight ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle className="h-4 w-4" />
                            {row.result}
                          </span>
                        ) : (
                          row.result
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>

        {/* Social Proof / Trust Signals */}
        <section className="container max-w-6xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "UK Companies House",
                value: "16939677",
                icon: FileText,
              },
              {
                value: "Strategic Alliance",
                icon: Shield,
              },
              {
                label: "MEOKCLAW Mesh Network",
                value: "365-Model Coverage",
                icon: CheckCircle,
              },
              {
                label: "Constitutional Framework",
                value: "52-Article Charter",
                icon: Gavel,
              },
            ].map((signal, idx) => {
              const Icon = signal.icon;
              return (
                <Card
                  key={idx}
                  className="border border-emerald-200 dark:border-emerald-800 text-center hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-3">
                      <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {signal.label}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {signal.value}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container max-w-4xl mx-auto px-4 pb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Quick answers to the questions compliance officers ask most.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Card
                key={idx}
                className="border border-emerald-200 dark:border-emerald-800 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === idx ? null : idx)
                  }
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 transition-transform ${
                      expandedFaq === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedFaq === idx && (
                  <div className="px-6 pb-6 border-t border-emerald-100 dark:border-emerald-900">
                    <p className="text-gray-700 dark:text-gray-300 pt-4 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-800 dark:to-emerald-900" />
          <div className="container max-w-4xl mx-auto px-4 py-20 relative text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Don't wait for the regulator to knock.
            </h2>
            <p className="text-xl text-emerald-100 mb-8">
              <span className="font-bold text-white">{daysLeft} days</span> left.
              Start your certification today.
            </p>
            <Link href="/certification">
              <Button
                size="lg"
                className="bg-white text-emerald-700 hover:bg-emerald-50 text-lg px-10 py-6 shadow-lg"
              >
                Begin Certification
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
