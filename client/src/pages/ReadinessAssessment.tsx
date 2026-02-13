import { useState, useMemo } from "react";
import {
  Shield,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Award,
  BookOpen,
  Users,
  Building,
  Globe,
  Target,
  TrendingUp,
  FileText,
  ArrowRight,
  Download,
  Brain,
  Scale,
  Eye,
  Lock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

// Types
interface OrganizationProfile {
  size: string;
  industry: string;
  aiSystems: string;
  regions: string[];
}

interface GovernanceScores {
  formalPolicy: number;
  executiveOversight: number;
  riskAssessment: number;
  ethicsReview: number;
  systemInventory: number;
}

interface ComplianceScores {
  regulatoryAwareness: number;
  requirementsMapping: number;
  documentation: number;
  complianceMonitoring: number;
  staffTraining: number;
}

interface TechnicalScores {
  biasTesting: number;
  modelMonitoring: number;
  incidentResponse: number;
  explainability: number;
  dataGovernance: number;
}

interface AssessmentState {
  currentStep: number;
  organizationProfile: OrganizationProfile;
  governanceScores: GovernanceScores;
  complianceScores: ComplianceScores;
  technicalScores: TechnicalScores;
}

// Scoring options
const scoringOptions = [
  { label: "No", value: 0 },
  { label: "Informal / Occasionally", value: 1 },
  { label: "Documented / Sometimes", value: 2 },
  { label: "Implemented / Regularly", value: 3 },
  { label: "Optimized / Continuously", value: 4 },
];

const organizationSizes = ["1-50", "51-500", "501-5000", "5000+"];
const industries = [
  "Financial Services",
  "Healthcare",
  "Government",
  "Technology",
  "Education",
  "Manufacturing",
  "Retail",
  "Other",
];
const aiSystemRanges = ["0", "1-10", "11-50", "51-200", "200+"];
const regions = ["EU", "UK", "US", "Canada", "Asia-Pacific", "Middle East", "Africa", "Latin America"];

const regulationsByRegion: Record<string, string[]> = {
  EU: ["EU AI Act", "GDPR", "Directive 2019/1937"],
  UK: ["UK AI Bill", "UK GDPR", "FCA regulations"],
  US: ["NIST AI RMF", "FTC Guidelines", "Executive Order 14110", "CFPB Rules"],
  Canada: ["AIDA (Proposed)", "PIPEDA", "Provincial Privacy Laws"],
  "Asia-Pacific": ["Singapore PDPC Framework", "Japan AI Guidelines", "South Korea AI Ethics"],
  "Middle East": ["UAE AI Ethics Framework"],
  Africa: ["AU Digital Transformation Strategy"],
  "Latin America": ["LAC Responsible AI Framework"],
};

export default function ReadinessAssessment() {
  const [state, setState] = useState<AssessmentState>({
    currentStep: 0,
    organizationProfile: {
      size: "",
      industry: "",
      aiSystems: "",
      regions: [],
    },
    governanceScores: {
      formalPolicy: 0,
      executiveOversight: 0,
      riskAssessment: 0,
      ethicsReview: 0,
      systemInventory: 0,
    },
    complianceScores: {
      regulatoryAwareness: 0,
      requirementsMapping: 0,
      documentation: 0,
      complianceMonitoring: 0,
      staffTraining: 0,
    },
    technicalScores: {
      biasTesting: 0,
      modelMonitoring: 0,
      incidentResponse: 0,
      explainability: 0,
      dataGovernance: 0,
    },
  });

  const results = useMemo(() => {
    const governanceAvg =
      Object.values(state.governanceScores).reduce((a, b) => a + b, 0) / 5;
    const complianceAvg =
      Object.values(state.complianceScores).reduce((a, b) => a + b, 0) / 5;
    const technicalAvg =
      Object.values(state.technicalScores).reduce((a, b) => a + b, 0) / 5;

    const overallScore = Math.round(((governanceAvg + complianceAvg + technicalAvg) / 3) * 25);

    let maturityLevel = "Beginner";
    if (overallScore > 80) maturityLevel = "Leading";
    else if (overallScore > 60) maturityLevel = "Advanced";
    else if (overallScore > 40) maturityLevel = "Established";
    else if (overallScore > 20) maturityLevel = "Developing";

    const applicableRegulations = state.organizationProfile.regions.flatMap(
      (region) => regulationsByRegion[region] || []
    );
    const uniqueRegulations = [...new Set(applicableRegulations)];

    return {
      governanceScore: Math.round(governanceAvg * 25),
      complianceScore: Math.round(complianceAvg * 25),
      technicalScore: Math.round(technicalAvg * 25),
      overallScore,
      maturityLevel,
      applicableRegulations: uniqueRegulations,
    };
  }, [state]);

  const isStep1Complete =
    state.organizationProfile.size &&
    state.organizationProfile.industry &&
    state.organizationProfile.aiSystems &&
    state.organizationProfile.regions.length > 0;

  const isStep2Complete =
    Object.values(state.governanceScores).every((v) => v > 0);

  const isStep3Complete =
    Object.values(state.complianceScores).every((v) => v > 0);

  const isStep4Complete =
    Object.values(state.technicalScores).every((v) => v > 0);

  const handleNext = () => {
    if (state.currentStep < 5) {
      setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (state.currentStep > 0) {
      setState((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
      window.scrollTo(0, 0);
    }
  };

  const updateOrganizationProfile = (key: keyof OrganizationProfile, value: any) => {
    setState((prev) => ({
      ...prev,
      organizationProfile: { ...prev.organizationProfile, [key]: value },
    }));
  };

  const toggleRegion = (region: string) => {
    setState((prev) => {
      const newRegions = prev.organizationProfile.regions.includes(region)
        ? prev.organizationProfile.regions.filter((r) => r !== region)
        : [...prev.organizationProfile.regions, region];
      return {
        ...prev,
        organizationProfile: { ...prev.organizationProfile, regions: newRegions },
      };
    });
  };

  const updateScore = (category: "governance" | "compliance" | "technical", key: string, value: number) => {
    setState((prev) => {
      const categoryKey = `${category}Scores` as keyof AssessmentState;
      return {
        ...prev,
        [categoryKey]: { ...prev[categoryKey], [key]: value },
      };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Hero Section */}
      {state.currentStep === 0 && (
        <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          </div>

          <div className="relative max-w-2xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-8">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              AI Governance Readiness Assessment
            </h1>

            <p className="text-xl text-blue-200 mb-8">
              Evaluate your organization's AI governance maturity in 5 minutes. Get personalized
              recommendations and understand your compliance obligations.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-12">
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold text-blue-400 mb-2">5 min</div>
                <div className="text-sm text-blue-200">Quick Assessment</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold text-blue-400 mb-2">20</div>
                <div className="text-sm text-blue-200">Questions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold text-blue-400 mb-2">100%</div>
                <div className="text-sm text-blue-200">Free & Confidential</div>
              </div>
            </div>

            <Button
              onClick={handleNext}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg rounded-lg inline-flex items-center gap-2 transition-all"
            >
              Start Assessment <ArrowRight className="w-5 h-5" />
            </Button>

            <p className="text-sm text-blue-300/80 mt-8">
              No signup required. Your responses are completely confidential.
            </p>
          </div>
        </div>
      )}

      {/* Step 1: Organization Profile */}
      {state.currentStep === 1 && (
        <div className="min-h-screen py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Building className="w-5 h-5 text-blue-400" />
                <h2 className="text-3xl font-bold text-white">Organization Profile</h2>
              </div>
              <div className="h-2 bg-blue-500/20 rounded-full overflow-hidden">
                <div className="h-full w-1/5 bg-blue-500 rounded-full"></div>
              </div>
            </div>

            <div className="space-y-8 bg-white/5 backdrop-blur-md rounded-lg p-8 border border-white/10">
              {/* Organization Size */}
              <div>
                <label className="block text-white font-semibold mb-4">
                  What is your organization size?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {organizationSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => updateOrganizationProfile("size", size)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        state.organizationProfile.size === size
                          ? "border-blue-500 bg-blue-500/20 text-white"
                          : "border-white/20 bg-white/5 text-blue-200 hover:border-white/40"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-white font-semibold mb-4">
                  What is your primary industry?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {industries.map((industry) => (
                    <button
                      key={industry}
                      onClick={() => updateOrganizationProfile("industry", industry)}
                      className={`p-4 rounded-lg border-2 transition-all text-sm ${
                        state.organizationProfile.industry === industry
                          ? "border-blue-500 bg-blue-500/20 text-white"
                          : "border-white/20 bg-white/5 text-blue-200 hover:border-white/40"
                      }`}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Systems */}
              <div>
                <label className="block text-white font-semibold mb-4">
                  How many AI systems have you deployed?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {aiSystemRanges.map((range) => (
                    <button
                      key={range}
                      onClick={() => updateOrganizationProfile("aiSystems", range)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        state.organizationProfile.aiSystems === range
                          ? "border-blue-500 bg-blue-500/20 text-white"
                          : "border-white/20 bg-white/5 text-blue-200 hover:border-white/40"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* Regions */}
              <div>
                <label className="block text-white font-semibold mb-4">
                  Select your regions of operation (select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {regions.map((region) => (
                    <button
                      key={region}
                      onClick={() => toggleRegion(region)}
                      className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                        state.organizationProfile.regions.includes(region)
                          ? "border-blue-500 bg-blue-500/20 text-white"
                          : "border-white/20 bg-white/5 text-blue-200 hover:border-white/40"
                      }`}
                    >
                      {state.organizationProfile.regions.includes(region) && (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {region}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                onClick={handlePrev}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isStep1Complete}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:opacity-50"
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Governance Framework */}
      {state.currentStep === 2 && (
        <div className="min-h-screen py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-5 h-5 text-blue-400" />
                <h2 className="text-3xl font-bold text-white">Governance Framework</h2>
              </div>
              <div className="h-2 bg-blue-500/20 rounded-full overflow-hidden">
                <div className="h-full w-2/5 bg-blue-500 rounded-full"></div>
              </div>
            </div>

            <div className="space-y-6 bg-white/5 backdrop-blur-md rounded-lg p-8 border border-white/10">
              {[
                {
                  key: "formalPolicy",
                  label: "Do you have a formal AI governance policy?",
                  options: [
                    "No formal policy",
                    "Informal guidelines only",
                    "Documented policy",
                    "Implemented and monitored",
                    "Optimized and regularly reviewed",
                  ],
                },
                {
                  key: "executiveOversight",
                  label: "Is there executive oversight of AI initiatives?",
                  options: [
                    "No executive involvement",
                    "Ad-hoc oversight",
                    "Dedicated AI committee",
                    "Board-level oversight",
                    "Dedicated C-suite role",
                  ],
                },
                {
                  key: "riskAssessment",
                  label: "Do you conduct AI risk assessments?",
                  options: [
                    "Never assessed",
                    "Occasionally assessed",
                    "For high-risk systems only",
                    "Systematically assessed",
                    "Continuous monitoring",
                  ],
                },
                {
                  key: "ethicsReview",
                  label: "Is there an AI ethics review process?",
                  options: [
                    "No process in place",
                    "Informal reviews only",
                    "Documented process",
                    "Mandatory for all AI",
                    "Integrated into SDLC",
                  ],
                },
                {
                  key: "systemInventory",
                  label: "Do you maintain an AI system inventory?",
                  options: [
                    "No inventory",
                    "Partial inventory",
                    "Most systems tracked",
                    "All systems tracked",
                    "Real-time tracking system",
                  ],
                },
              ].map((question) => (
                <div key={question.key} className="pb-6 border-b border-white/10 last:border-b-0">
                  <label className="block text-white font-semibold mb-4">{question.label}</label>
                  <div className="space-y-2">
                    {question.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() =>
                          updateScore("governance", question.key as any, idx)
                        }
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          state.governanceScores[question.key as keyof GovernanceScores] === idx
                            ? "border-blue-500 bg-blue-500/20 text-white"
                            : "border-white/20 bg-white/5 text-blue-200 hover:border-white/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              state.governanceScores[question.key as keyof GovernanceScores] === idx
                                ? "border-blue-500 bg-blue-500"
                                : "border-white/40"
                            }`}
                          >
                            {state.governanceScores[question.key as keyof GovernanceScores] === idx && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                          </div>
                          {option}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                onClick={handlePrev}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isStep2Complete}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:opacity-50"
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Compliance & Standards */}
      {state.currentStep === 3 && (
        <div className="min-h-screen py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-400" />
                <h2 className="text-3xl font-bold text-white">Compliance & Standards</h2>
              </div>
              <div className="h-2 bg-blue-500/20 rounded-full overflow-hidden">
                <div className="h-full w-3/5 bg-blue-500 rounded-full"></div>
              </div>
            </div>

            <div className="space-y-6 bg-white/5 backdrop-blur-md rounded-lg p-8 border border-white/10">
              {[
                {
                  key: "regulatoryAwareness",
                  label: "Are you aware of applicable AI regulations?",
                  options: [
                    "Not at all",
                    "Somewhat aware",
                    "Good understanding",
                    "Expert knowledge",
                    "Actively monitoring changes",
                  ],
                },
                {
                  key: "requirementsMapping",
                  label: "Have you mapped regulatory requirements to your AI systems?",
                  options: [
                    "Not mapped",
                    "Started mapping",
                    "Partially mapped",
                    "Mostly mapped",
                    "Fully mapped and tracked",
                  ],
                },
                {
                  key: "documentation",
                  label: "Do you document AI systems for regulatory compliance?",
                  options: [
                    "No documentation",
                    "Minimal documentation",
                    "Basic documentation",
                    "Detailed documentation",
                    "Audit-ready documentation",
                  ],
                },
                {
                  key: "complianceMonitoring",
                  label: "Do you have a compliance monitoring process?",
                  options: [
                    "No monitoring",
                    "Manual periodic checks",
                    "Periodic reviews",
                    "Automated alerts",
                    "Continuous monitoring",
                  ],
                },
                {
                  key: "staffTraining",
                  label: "Are staff trained on AI governance?",
                  options: [
                    "No training",
                    "Some awareness sessions",
                    "Basic training",
                    "Comprehensive training",
                    "Certified and ongoing",
                  ],
                },
              ].map((question) => (
                <div key={question.key} className="pb-6 border-b border-white/10 last:border-b-0">
                  <label className="block text-white font-semibold mb-4">{question.label}</label>
                  <div className="space-y-2">
                    {question.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() =>
                          updateScore("compliance", question.key as any, idx)
                        }
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          state.complianceScores[question.key as keyof ComplianceScores] === idx
                            ? "border-blue-500 bg-blue-500/20 text-white"
                            : "border-white/20 bg-white/5 text-blue-200 hover:border-white/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              state.complianceScores[question.key as keyof ComplianceScores] === idx
                                ? "border-blue-500 bg-blue-500"
                                : "border-white/40"
                            }`}
                          >
                            {state.complianceScores[question.key as keyof ComplianceScores] === idx && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                          </div>
                          {option}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                onClick={handlePrev}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isStep3Complete}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:opacity-50"
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Technical Controls */}
      {state.currentStep === 4 && (
        <div className="min-h-screen py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-blue-400" />
                <h2 className="text-3xl font-bold text-white">Technical Controls</h2>
              </div>
              <div className="h-2 bg-blue-500/20 rounded-full overflow-hidden">
                <div className="h-full w-4/5 bg-blue-500 rounded-full"></div>
              </div>
            </div>

            <div className="space-y-6 bg-white/5 backdrop-blur-md rounded-lg p-8 border border-white/10">
              {[
                {
                  key: "biasTesting",
                  label: "Do you test AI systems for bias?",
                  options: [
                    "Never tested",
                    "Rarely tested",
                    "Sometimes tested",
                    "Regularly tested",
                    "Continuously monitored",
                  ],
                },
                {
                  key: "modelMonitoring",
                  label: "Is there model monitoring post-deployment?",
                  options: [
                    "No monitoring",
                    "Basic manual monitoring",
                    "Regular reviews",
                    "Automated monitoring",
                    "Real-time with alerts",
                  ],
                },
                {
                  key: "incidentResponse",
                  label: "Do you have AI incident response procedures?",
                  options: [
                    "No procedures",
                    "Informal procedures",
                    "Documented procedures",
                    "Tested procedures",
                    "Automated response",
                  ],
                },
                {
                  key: "explainability",
                  label: "Do you implement explainability for AI decisions?",
                  options: [
                    "No explainability",
                    "For some models",
                    "For most models",
                    "For all models",
                    "With full documentation",
                  ],
                },
                {
                  key: "dataGovernance",
                  label: "Is there data governance for AI training data?",
                  options: [
                    "No data governance",
                    "Basic governance",
                    "Documented governance",
                    "Enforced governance",
                    "Audited and certified",
                  ],
                },
              ].map((question) => (
                <div key={question.key} className="pb-6 border-b border-white/10 last:border-b-0">
                  <label className="block text-white font-semibold mb-4">{question.label}</label>
                  <div className="space-y-2">
                    {question.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() =>
                          updateScore("technical", question.key as any, idx)
                        }
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          state.technicalScores[question.key as keyof TechnicalScores] === idx
                            ? "border-blue-500 bg-blue-500/20 text-white"
                            : "border-white/20 bg-white/5 text-blue-200 hover:border-white/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              state.technicalScores[question.key as keyof TechnicalScores] === idx
                                ? "border-blue-500 bg-blue-500"
                                : "border-white/40"
                            }`}
                          >
                            {state.technicalScores[question.key as keyof TechnicalScores] === idx && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                          </div>
                          {option}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                onClick={handlePrev}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isStep4Complete}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:opacity-50"
              >
                View Results <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Results */}
      {state.currentStep === 5 && (
        <div className="min-h-screen py-20 px-4">
          <div className="max-w-5xl mx-auto">
            {/* Overall Score */}
            <div className="mb-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Score Gauge */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-48 h-48 mb-6">
                    <svg className="transform -rotate-90" viewBox="0 0 200 200">
                      <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="12"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="12"
                        strokeDasharray={`${(results.overallScore / 100) * 565} 565`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-5xl font-bold text-white">{results.overallScore}</div>
                      <div className="text-sm text-blue-300">/ 100</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">{results.maturityLevel}</div>
                    <div className="text-blue-300">Maturity Level</div>
                  </div>
                </div>

                {/* Level Description */}
                <div className="flex flex-col justify-center">
                  <div className="space-y-4">
                    {results.maturityLevel === "Leading" && (
                      <>
                        <div className="flex items-start gap-3">
                          <Award className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold text-white mb-1">Industry Leader</h3>
                            <p className="text-blue-200">
                              Your organization is a leader in AI governance with comprehensive controls and
                              processes.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Target className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold text-white mb-1">Continuous Improvement</h3>
                            <p className="text-blue-200">
                              Focus on optimization, staying ahead of regulatory changes, and thought leadership.
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    {results.maturityLevel === "Advanced" && (
                      <>
                        <div className="flex items-start gap-3">
                          <TrendingUp className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold text-white mb-1">Well-Positioned</h3>
                            <p className="text-blue-200">
                              Your organization has mature AI governance practices in most areas.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Zap className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold text-white mb-1">Focus Areas</h3>
                            <p className="text-blue-200">
                              Consider strengthening compliance monitoring and staff training programs.
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    {results.maturityLevel === "Established" && (
                      <>
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold text-white mb-1">Foundation Built</h3>
                            <p className="text-blue-200">
                              You have foundational AI governance practices in place.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold text-white mb-1">Growth Opportunities</h3>
                            <p className="text-blue-200">
                              Prioritize scaling processes, implementing automation, and enhancing documentation.
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    {results.maturityLevel === "Developing" && (
                      <>
                        <div className="flex items-start gap-3">
                          <Brain className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold text-white mb-1">Building Capabilities</h3>
                            <p className="text-blue-200">
                              Your organization is developing AI governance capabilities.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold text-white mb-1">Action Items</h3>
                            <p className="text-blue-200">
                              Focus on establishing formal policies, executive oversight, and compliance frameworks.
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    {results.maturityLevel === "Beginner" && (
                      <>
                        <div className="flex items-start gap-3">
                          <BookOpen className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold text-white mb-1">Starting Your Journey</h3>
                            <p className="text-blue-200">
                              Your organization is beginning its AI governance journey.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold text-white mb-1">Priority: Foundation</h3>
                            <p className="text-blue-200">
                              Begin with developing formal AI policies and establishing governance structure.
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-white mb-6">Category Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Governance Framework",
                    score: results.governanceScore,
                    icon: Scale,
                    color: "from-blue-500 to-blue-600",
                  },
                  {
                    title: "Compliance & Standards",
                    score: results.complianceScore,
                    icon: Shield,
                    color: "from-purple-500 to-purple-600",
                  },
                  {
                    title: "Technical Controls",
                    score: results.technicalScore,
                    icon: Zap,
                    color: "from-green-500 to-green-600",
                  },
                ].map((category, idx) => {
                  const Icon = category.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${category.color}`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-white">{category.score}</div>
                      </div>
                      <h4 className="text-white font-semibold mb-2">{category.title}</h4>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${category.color} rounded-full`}
                          style={{ width: `${category.score}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Applicable Regulations */}
            {results.applicableRegulations.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">Applicable Regulations</h3>
                <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {results.applicableRegulations.map((regulation, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                      >
                        <Eye className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        <span className="text-white text-sm font-medium">{regulation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-white mb-6">Personalized Recommendations</h3>
              <div className="space-y-4">
                {results.governanceScore < 60 && (
                  <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-6 flex gap-4">
                    <AlertTriangle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-white mb-2">Strengthen Governance Framework</h4>
                      <p className="text-blue-200">
                        Establish a formal AI governance policy with documented procedures. Consider appointing a
                        Chief AI Officer or dedicated governance committee.
                      </p>
                    </div>
                  </div>
                )}
                {results.complianceScore < 60 && (
                  <div className="bg-purple-500/20 border border-purple-400/50 rounded-lg p-6 flex gap-4">
                    <AlertTriangle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-white mb-2">Enhance Compliance Framework</h4>
                      <p className="text-purple-200">
                        Map regulatory requirements to your AI systems and establish a compliance monitoring process.
                        Conduct compliance training across your organization.
                      </p>
                    </div>
                  </div>
                )}
                {results.technicalScore < 60 && (
                  <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-6 flex gap-4">
                    <AlertTriangle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-white mb-2">Implement Technical Controls</h4>
                      <p className="text-green-200">
                        Establish processes for bias testing, model monitoring, and explainability. Document incident
                        response procedures for AI systems.
                      </p>
                    </div>
                  </div>
                )}
                {results.overallScore >= 80 && (
                  <div className="bg-amber-500/20 border border-amber-400/50 rounded-lg p-6 flex gap-4">
                    <Award className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-white mb-2">Maintain and Optimize</h4>
                      <p className="text-amber-200">
                        You're performing well! Focus on continuous improvement, staying ahead of regulatory changes,
                        and sharing best practices across your organization.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Training Courses */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-white mb-6">Recommended Training Courses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    title: "AI Governance Fundamentals",
                    duration: "4 hours",
                    level: "Beginner",
                    icon: BookOpen,
                  },
                  {
                    title: "Regulatory Compliance for AI",
                    duration: "6 hours",
                    level: "Intermediate",
                    icon: Scale,
                  },
                  {
                    title: "Ethics & Responsible AI",
                    duration: "5 hours",
                    level: "Intermediate",
                    icon: Brain,
                  },
                  {
                    title: "AI Risk Management",
                    duration: "7 hours",
                    level: "Advanced",
                    icon: Shield,
                  },
                ].map((course, idx) => {
                  const Icon = course.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <Icon className="w-8 h-8 text-blue-400" />
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                          {course.level}
                        </span>
                      </div>
                      <h4 className="text-white font-semibold mb-2">{course.title}</h4>
                      <p className="text-blue-300 text-sm mb-4">{course.duration}</p>
                      <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm">
                        View Course
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mb-12">
              <div className="max-w-3xl mx-auto text-center">
                <h3 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h3>
                <p className="text-blue-100 mb-8">
                  Get expert guidance to strengthen your AI governance practices.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg rounded-lg font-semibold">
                    <BookOpen className="w-5 h-5 mr-2" /> Start Free Training
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg rounded-lg font-semibold"
                  >
                    <Users className="w-5 h-5 mr-2" /> Talk to Advisory Team
                  </Button>
                </div>
              </div>
            </div>

            {/* Download Report */}
            <div className="text-center">
              <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-lg inline-flex items-center gap-2">
                <Download className="w-5 h-5" /> Download PDF Report
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex justify-center mt-12">
              <Button
                onClick={() =>
                  setState((prev) => ({ ...prev, currentStep: 0 }))
                }
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Start Over
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
