/**
 * CSOAI Framework Crosswalks Page
 *
 * Shows how the CSOAI Charter maps to major international AI governance frameworks:
 * - EU AI Act
 * - NIST AI RMF
 * - ISO 42001
 * - TC260
 * - CMMC
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Globe2,
  MapPin,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Zap,
  Shield,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Type definitions
interface CrosswalkEntry {
  id: string;
  csoaiArticle: string;
  csoaiTitle: string;
  euAIAct: string;
  nistAIRMF: string;
  iso42001: string;
  tc260?: string;
  cmmc?: string;
  alignmentStrength: "Strong" | "Moderate" | "Partial";
  notes: string;
}

interface KeyInsight {
  title: string;
  description: string;
  frameworks: string[];
  icon: React.ReactNode;
  color: string;
}

// Comprehensive crosswalk data
const crosswalkData: CrosswalkEntry[] = [
  {
    id: "1",
    csoaiArticle: "Art. 1",
    csoaiTitle: "Maternal Covenant",
    euAIAct: "Art. 9 Risk Management",
    nistAIRMF: "GOVERN 1.1-1.7",
    iso42001: "5.2 AI Policy",
    alignmentStrength: "Strong",
    notes: "Core safety philosophy establishing care-based governance model",
  },
  {
    id: "2",
    csoaiArticle: "Art. 2",
    csoaiTitle: "Provable Safety",
    euAIAct: "Art. 9, Annex IV",
    nistAIRMF: "MAP 1.1-1.6, MEASURE",
    iso42001: "6.1.2 Risk Assessment",
    alignmentStrength: "Strong",
    notes: "Requires mathematical proof of safety; aligns with technical documentation requirements",
  },
  {
    id: "3",
    csoaiArticle: "Art. 3",
    csoaiTitle: "Byzantine Council",
    euAIAct: "Art. 9(4) Oversight",
    nistAIRMF: "GOVERN 5.1-5.2",
    iso42001: "5.1 Leadership",
    alignmentStrength: "Strong",
    notes: "33-node BFT consensus mirrors third-party conformity assessment requirements",
  },
  {
    id: "4",
    csoaiArticle: "Art. 4",
    csoaiTitle: "Value Uncertainty",
    euAIAct: "Recital 71",
    nistAIRMF: "GOVERN 2.1-2.3",
    iso42001: "4.1 Context",
    alignmentStrength: "Moderate",
    notes: "Addresses moral uncertainty in AI decision-making; foundational to responsible AI",
  },
  {
    id: "5",
    csoaiArticle: "Art. 5",
    csoaiTitle: "Constitutional AI",
    euAIAct: "Art. 13 Transparency",
    nistAIRMF: "GOVERN 3.1-3.3",
    iso42001: "5.3 AI Ethics",
    alignmentStrength: "Strong",
    notes: "Embedded values framework aligns with transparency and ethical AI principles",
  },
  {
    id: "6",
    csoaiArticle: "Art. 6",
    csoaiTitle: "Consciousness Preparedness",
    euAIAct: "Recital 110",
    nistAIRMF: "GOVERN 3",
    iso42001: "6.1 Risk",
    alignmentStrength: "Moderate",
    notes: "Unique long-term governance consideration; forward-looking risk management",
  },
  {
    id: "7",
    csoaiArticle: "Art. 7",
    csoaiTitle: "Cooperative AI",
    euAIAct: "Art. 12 Human Oversight",
    nistAIRMF: "GOVERN 5.1-5.3",
    iso42001: "7.4 Competence",
    alignmentStrength: "Strong",
    notes: "Multi-agent coordination aligns with human-AI collaboration requirements",
  },
  {
    id: "8",
    csoaiArticle: "Art. 8",
    csoaiTitle: "Prosperity Covenant",
    euAIAct: "Preamble, Recital 2",
    nistAIRMF: "GOVERN",
    iso42001: "4.2 Interested Parties",
    alignmentStrength: "Partial",
    notes: "Economic redistribution model unique to CSOAI; supports societal benefit principles",
  },
  {
    id: "9",
    csoaiArticle: "Art. 9",
    csoaiTitle: "Founding Principles",
    euAIAct: "Recital 1-3",
    nistAIRMF: "GOVERN",
    iso42001: "4.1-4.4 Context",
    alignmentStrength: "Strong",
    notes: "Foundational organizational alignment across all frameworks",
  },
  {
    id: "10",
    csoaiArticle: "Art. 10",
    csoaiTitle: "Licensing Framework",
    euAIAct: "Art. 55-73",
    nistAIRMF: "GOVERN 1.1",
    iso42001: "5.2 Authorization",
    alignmentStrength: "Strong",
    notes: "Tiered licensing mirrors conformity assessment and authorization mechanisms",
  },
  {
    id: "11",
    csoaiArticle: "Art. 11",
    csoaiTitle: "Byzantine Council Specs",
    euAIAct: "Art. 32-34 Notified Bodies",
    nistAIRMF: "GOVERN 5.1-5.2",
    iso42001: "5.1 Leadership",
    alignmentStrength: "Strong",
    notes: "Technical architecture implements distributed oversight principle",
  },
  {
    id: "12",
    csoaiArticle: "Art. 15",
    csoaiTitle: "Compliance Assessment",
    euAIAct: "Art. 43 Conformity",
    nistAIRMF: "MEASURE 2.1-2.13",
    iso42001: "9.1 Monitoring",
    alignmentStrength: "Strong",
    notes: "CASA certification framework equivalent to conformity assessment procedures",
  },
  {
    id: "13",
    csoaiArticle: "Art. 17",
    csoaiTitle: "Enforcement",
    euAIAct: "Art. 71-72 Penalties",
    nistAIRMF: "GOVERN 6.1-6.2",
    iso42001: "10.2 Nonconformity",
    alignmentStrength: "Strong",
    notes: "Graduated enforcement mirrors administrative penalties structure",
  },
  {
    id: "14",
    csoaiArticle: "Art. 19",
    csoaiTitle: "Intl Regulatory Integration",
    euAIAct: "Art. 2 Scope",
    nistAIRMF: "All functions",
    iso42001: "4.2 Interested Parties",
    alignmentStrength: "Strong",
    notes: "Multi-jurisdictional alignment across all major frameworks",
  },
  {
    id: "15",
    csoaiArticle: "Art. 20",
    csoaiTitle: "Technical Standards",
    euAIAct: "Annex I, Art. 40",
    nistAIRMF: "MAP, MEASURE",
    iso42001: "6.1, 8.2",
    alignmentStrength: "Strong",
    notes: "Standards alignment enables interoperability across regulatory regimes",
  },
  {
    id: "16",
    csoaiArticle: "Art. 21",
    csoaiTitle: "Data Governance",
    euAIAct: "Art. 10 Data Quality",
    nistAIRMF: "MAP 5.1-5.2",
    iso42001: "A.7 Data Management",
    alignmentStrength: "Strong",
    notes: "Privacy and data quality requirements align with GDPR and ISO standards",
  },
  {
    id: "17",
    csoaiArticle: "Art. 22",
    csoaiTitle: "Cybersecurity",
    euAIAct: "Art. 15 Cybersecurity",
    nistAIRMF: "GOVERN 1.7",
    iso42001: "A.6 Security",
    alignmentStrength: "Strong",
    notes: "Security requirements apply across all regulated AI systems",
  },
  {
    id: "18",
    csoaiArticle: "Art. 23",
    csoaiTitle: "Model Development",
    euAIAct: "Art. 10, 15",
    nistAIRMF: "MAP 3.1-3.5",
    iso42001: "8.2 AI Development",
    alignmentStrength: "Strong",
    notes: "Development lifecycle standards ensure consistent quality",
  },
  {
    id: "19",
    csoaiArticle: "Art. 24",
    csoaiTitle: "Testing & Validation",
    euAIAct: "Art. 9(5-8)",
    nistAIRMF: "MEASURE 1-4",
    iso42001: "8.4 Testing",
    alignmentStrength: "Strong",
    notes: "Validation protocols required for high-risk AI systems",
  },
  {
    id: "20",
    csoaiArticle: "Art. 25",
    csoaiTitle: "Documentation",
    euAIAct: "Art. 11, Annex IV",
    nistAIRMF: "GOVERN 4.1",
    iso42001: "7.5 Documentation",
    alignmentStrength: "Strong",
    notes: "Technical documentation requirements ensure traceability and accountability",
  },
  {
    id: "21",
    csoaiArticle: "Art. 26",
    csoaiTitle: "Interpretability",
    euAIAct: "Art. 13 Transparency",
    nistAIRMF: "MEASURE 2.6-2.11",
    iso42001: "A.8 Explainability",
    alignmentStrength: "Strong",
    notes: "Explainability requirements increase trust and accountability",
  },
  {
    id: "22",
    csoaiArticle: "Art. 32",
    csoaiTitle: "Healthcare AI",
    euAIAct: "Art. 6 High-Risk",
    nistAIRMF: "MANAGE",
    iso42001: "A.5 Sector-specific",
    alignmentStrength: "Strong",
    notes: "Sector-specific standards apply to medical AI systems",
  },
  {
    id: "23",
    csoaiArticle: "Art. 33",
    csoaiTitle: "Financial AI",
    euAIAct: "Art. 6 High-Risk",
    nistAIRMF: "MANAGE",
    iso42001: "A.5 Sector-specific",
    alignmentStrength: "Strong",
    notes: "Financial AI regulation aligns with SR 11-7 and banking standards",
  },
  {
    id: "24",
    csoaiArticle: "Art. 34",
    csoaiTitle: "Transportation AI",
    euAIAct: "Art. 6 High-Risk, Annex III",
    nistAIRMF: "MANAGE",
    iso42001: "A.5 Sector-specific",
    alignmentStrength: "Strong",
    notes: "Safety-critical systems require highest assurance levels",
  },
  {
    id: "25",
    csoaiArticle: "Art. 45",
    csoaiTitle: "Existential Risk",
    euAIAct: "Recital 110",
    nistAIRMF: "GOVERN 3",
    iso42001: "6.1 Risk",
    alignmentStrength: "Moderate",
    notes: "Long-term governance addressing AGI and existential considerations",
  },
  {
    id: "26",
    csoaiArticle: "Art. 48",
    csoaiTitle: "Amendment Process",
    euAIAct: "Art. 97 Evaluation",
    nistAIRMF: "GOVERN",
    iso42001: "10.1 Improvement",
    alignmentStrength: "Strong",
    notes: "Adaptive governance allows frameworks to evolve with technology",
  },
];

const keyInsights: KeyInsight[] = [
  {
    title: "Risk Management Leadership",
    description:
      "CSOAI's risk-first approach (Articles 1-3) directly maps to EU AI Act Article 9 and NIST GOVERN function, establishing care-based oversight that exceeds traditional compliance frameworks.",
    frameworks: ["EU AI Act", "NIST AI RMF", "ISO 42001"],
    icon: <Shield className="h-6 w-6" />,
    color: "from-emerald-500 to-green-600",
  },
  {
    title: "Comprehensive Lifecycle Coverage",
    description:
      "From development (Articles 23) through testing (Article 24) to monitoring (Articles 15, 17), CSOAI covers the entire AI system lifecycle aligned with NIST MAP and MEASURE functions.",
    frameworks: ["NIST AI RMF", "ISO 42001"],
    icon: <Zap className="h-6 w-6" />,
    color: "from-teal-500 to-cyan-600",
  },
  {
    title: "Sector-Specific Excellence",
    description:
      "Healthcare (Article 32), Finance (Article 33), and Transportation (Article 34) requirements align with high-risk classifications across EU AI Act and support regulatory integration.",
    frameworks: ["EU AI Act", "ISO 42001"],
    icon: <MapPin className="h-6 w-6" />,
    color: "from-blue-500 to-indigo-600",
  },
  {
    title: "Governance & Oversight",
    description:
      "The Byzantine Council (Article 3) and Human Council structures provide 24/7 distributed oversight exceeding notified body requirements while maintaining human control.",
    frameworks: ["All Frameworks"],
    icon: <Globe2 className="h-6 w-6" />,
    color: "from-violet-500 to-purple-600",
  },
];

type FrameworkFilter = "All" | "EU AI Act" | "NIST AI RMF" | "ISO 42001" | "TC260" | "CMMC";

const alignmentColorMap = {
  Strong: "bg-emerald-100 text-emerald-700 border-emerald-300",
  Moderate: "bg-amber-100 text-amber-700 border-amber-300",
  Partial: "bg-orange-100 text-orange-700 border-orange-300",
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function Crosswalks() {
  const [activeFramework, setActiveFramework] = useState<FrameworkFilter>("All");
  const [sortBy, setSortBy] = useState<"article" | "framework">("article");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filteredData = crosswalkData.filter((entry) => {
    if (activeFramework === "All") return true;
    if (activeFramework === "EU AI Act") return entry.euAIAct;
    if (activeFramework === "NIST AI RMF") return entry.nistAIRMF;
    if (activeFramework === "ISO 42001") return entry.iso42001;
    if (activeFramework === "TC260") return entry.tc260;
    if (activeFramework === "CMMC") return entry.cmmc;
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === "article") {
      return a.csoaiArticle.localeCompare(b.csoaiArticle);
    }
    return a.alignmentStrength.localeCompare(b.alignmentStrength);
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border-4 border-emerald-300 rounded-full" />
          <div className="absolute bottom-20 right-20 w-48 h-48 border-4 border-teal-300 rounded-full" />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 border-4 border-green-300 rounded-full" />
        </div>

        <div className="container max-w-6xl relative z-10">
          <div className="text-center">
            <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-base px-4 py-1">
              <Globe2 className="inline h-4 w-4 mr-2" />
              International Framework Alignment
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Framework Crosswalks
            </h1>
            <p className="text-2xl text-emerald-100 leading-relaxed mb-6 max-w-4xl mx-auto">
              How CSOAI Charter Maps to Global AI Governance Standards
            </p>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              Comprehensive alignment with EU AI Act, NIST AI Risk Management Framework, ISO 42001, TC260, and CMMC
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 font-semibold"
              >
                <Download className="mr-2 h-5 w-5" />
                Download Crosswalk Matrix (PDF)
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Framework Filter Tabs */}
      <section className="py-12 bg-gradient-to-b from-emerald-50 to-white border-b border-emerald-100">
        <div className="container max-w-6xl">
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Filter by Framework</h2>
              <p className="text-gray-600">Click to view mappings for specific regulatory frameworks</p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {(["All", "EU AI Act", "NIST AI RMF", "ISO 42001", "TC260", "CMMC"] as FrameworkFilter[]).map(
                (framework) => (
                  <button
                    key={framework}
                    onClick={() => setActiveFramework(framework)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                      activeFramework === framework
                        ? "bg-emerald-600 text-white shadow-lg"
                        : "bg-white text-gray-700 border-2 border-gray-200 hover:border-emerald-300"
                    }`}
                  >
                    {framework}
                  </button>
                )
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setSortBy("article")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  sortBy === "article"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                    : "bg-white text-gray-700 border border-gray-200"
                }`}
              >
                Sort by Article
              </button>
              <button
                onClick={() => setSortBy("framework")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  sortBy === "framework"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                    : "bg-white text-gray-700 border border-gray-200"
                }`}
              >
                Sort by Alignment
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Insights Section */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              Key Insights
            </Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Strongest Alignment Areas</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              CSOAI Charter demonstrates comprehensive coverage across all major AI governance frameworks
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {keyInsights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-2 border-gray-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`w-14 h-14 rounded-lg bg-gradient-to-br ${insight.color} flex items-center justify-center text-white flex-shrink-0`}
                      >
                        {insight.icon}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{insight.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">{insight.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {insight.frameworks.map((fw) => (
                        <Badge
                          key={fw}
                          className="bg-emerald-100 text-emerald-700 border-emerald-200"
                        >
                          {fw}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Crosswalk Table */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container max-w-7xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              Complete Mapping
            </Badge>
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Detailed Crosswalk Matrix</h2>
            <p className="text-lg text-gray-600">
              {sortedData.length} articles mapped across all major frameworks
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-sm">CSOAI Article</th>
                    <th className="px-6 py-4 text-left font-semibold text-sm">EU AI Act</th>
                    <th className="px-6 py-4 text-left font-semibold text-sm">NIST AI RMF</th>
                    <th className="px-6 py-4 text-left font-semibold text-sm">ISO 42001</th>
                    <th className="px-6 py-4 text-center font-semibold text-sm">Alignment</th>
                    <th className="px-6 py-4 text-center font-semibold text-sm">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedData.map((entry) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      viewport={{ once: true }}
                      className="hover:bg-emerald-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{entry.csoaiArticle}</div>
                          <div className="text-sm text-gray-600">{entry.csoaiTitle}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                          {entry.euAIAct}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                          {entry.nistAIRMF}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                          {entry.iso42001}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge
                          className={`border ${alignmentColorMap[entry.alignmentStrength]}`}
                        >
                          {entry.alignmentStrength}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleRowExpansion(entry.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors"
                        >
                          {expandedRows.has(entry.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Expanded Row Details */}
            {expandedRows.size > 0 && (
              <div className="bg-emerald-50 border-t border-emerald-200">
                {sortedData
                  .filter((entry) => expandedRows.has(entry.id))
                  .map((entry) => (
                    <div key={`expanded-${entry.id}`} className="px-6 py-4 border-b border-emerald-200">
                      <div className="flex items-start gap-4">
                        <AlertCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-grow">
                          <p className="font-semibold text-gray-900 mb-2">Notes & Context</p>
                          <p className="text-gray-700 leading-relaxed">{entry.notes}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 mb-2">About This Crosswalk</p>
                <p className="text-gray-700 mb-2">
                  This matrix demonstrates CSOAI Charter alignment with major international frameworks. The mapping
                  enables organizations to satisfy multiple regulatory requirements through a single, comprehensive
                  governance approach.
                </p>
                <p className="text-sm text-gray-600">
                  For detailed compliance guidance, consult the framework-specific guides or contact the CSOAI
                  Compliance Team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Framework Descriptions */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              Framework Overview
            </Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Understanding the Frameworks</h2>
          </div>

          <Tabs defaultValue="eu" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="eu">EU AI Act</TabsTrigger>
              <TabsTrigger value="nist">NIST RMF</TabsTrigger>
              <TabsTrigger value="iso">ISO 42001</TabsTrigger>
              <TabsTrigger value="tc260">TC260</TabsTrigger>
              <TabsTrigger value="cmmc">CMMC</TabsTrigger>
            </TabsList>

            <TabsContent value="eu" className="space-y-4">
              <Card className="border-2 border-emerald-200">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                  <CardTitle className="text-emerald-900">EU AI Act</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    The European Union's comprehensive AI regulation establishing risk-based requirements for AI
                    systems deployed in the EU market. Focus areas include risk classification, documentation,
                    transparency, and conformity assessment.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">Key Alignment Areas:</p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>✓ Risk management (Art. 9)</li>
                        <li>✓ Data quality (Art. 10)</li>
                        <li>✓ Transparency (Art. 13)</li>
                        <li>✓ Human oversight (Art. 12)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">CSOAI Coverage:</p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>✓ Articles 1-3, 9-17</li>
                        <li>✓ Articles 20-26</li>
                        <li>✓ Articles 32-34</li>
                        <li>✓ Articles 45-48</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="nist" className="space-y-4">
              <Card className="border-2 border-teal-200">
                <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                  <CardTitle className="text-teal-900">NIST AI Risk Management Framework</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    NIST RMF provides voluntary guidance for managing AI risks across organizations. Built on four
                    core functions: GOVERN, MAP, MEASURE, and MANAGE. Emphasizes ongoing monitoring and continuous
                    improvement.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">Core Functions:</p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>✓ GOVERN (1.1-6.2)</li>
                        <li>✓ MAP (1.1-5.2)</li>
                        <li>✓ MEASURE (1-4)</li>
                        <li>✓ MANAGE</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">CSOAI Alignment:</p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>✓ Complete GOVERN coverage</li>
                        <li>✓ Comprehensive MAP support</li>
                        <li>✓ Testing & validation</li>
                        <li>✓ Lifecycle management</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="iso" className="space-y-4">
              <Card className="border-2 border-blue-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-blue-900">ISO/IEC 42001</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    International standard for AI management systems. Based on ISO management system frameworks
                    (similar to ISO 27001, ISO 9001). Provides requirements for establishing, implementing, and
                    maintaining AI governance.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">Key Areas:</p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>✓ Risk management</li>
                        <li>✓ Data governance</li>
                        <li>✓ Development standards</li>
                        <li>✓ Monitoring & measurement</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">CSOAI Alignment:</p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>✓ Policy & leadership</li>
                        <li>✓ Lifecycle management</li>
                        <li>✓ Documentation</li>
                        <li>✓ Improvement cycles</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tc260" className="space-y-4">
              <Card className="border-2 border-purple-200">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="text-purple-900">TC260 (China)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    China's cybersecurity and AI governance standards from the Standardization Administration of China.
                    Emphasizes data security, system reliability, and national security considerations in AI systems.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">Focus Areas:</p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>✓ Data security</li>
                        <li>✓ System resilience</li>
                        <li>✓ National security</li>
                        <li>✓ Algorithm governance</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">CSOAI Alignment:</p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>✓ Data governance</li>
                        <li>✓ Cybersecurity</li>
                        <li>✓ Technical standards</li>
                        <li>✓ Compliance monitoring</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cmmc" className="space-y-4">
              <Card className="border-2 border-orange-200">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                  <CardTitle className="text-orange-900">CMMC (Cybersecurity)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    Cybersecurity Maturity Model Certification for defense contractors and supply chain security.
                    While not AI-specific, CMMC principles apply to AI systems handling sensitive or defense-related
                    data.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">Domains:</p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>✓ Access control</li>
                        <li>✓ Incident response</li>
                        <li>✓ Data protection</li>
                        <li>✓ Supply chain risk</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">CSOAI Alignment:</p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>✓ Cybersecurity (Art. 22)</li>
                        <li>✓ Access controls</li>
                        <li>✓ Incident response</li>
                        <li>✓ Data governance</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-900 to-teal-900 text-white">
        <div className="container max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Implement Multi-Framework Compliance?</h2>
          <p className="text-xl text-emerald-100 mb-10 leading-relaxed">
            CSOAI provides a unified governance framework that satisfies requirements across all major regulatory
            regimes. Get started with compliance assessment and training.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 font-semibold"
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              Start Compliance Assessment
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8"
            >
              View Training Programs
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
