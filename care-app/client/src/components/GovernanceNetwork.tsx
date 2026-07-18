/**
 * AI Safety Governance Network Visualization
 * Interactive network graph showing global AI safety initiatives and stakeholders
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Building2,
  Users,
  GraduationCap,
  Shield,
  Filter,
  X,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NetworkNode {
  id: string;
  name: string;
  category: "government" | "organization" | "academic" | "industry" | "framework";
  region: "global" | "europe" | "americas" | "asia" | "africa";
  description: string;
  link?: string;
}

const networkNodes: NetworkNode[] = [
  // Governments & Regulators
  { id: "eu-commission", name: "European Commission", category: "government", region: "europe", description: "EU AI Act regulatory authority" },
  { id: "uk-dsit", name: "UK DSIT", category: "government", region: "europe", description: "UK AI Safety Institute oversight" },
  { id: "us-nist", name: "US NIST", category: "government", region: "americas", description: "AI Risk Management Framework" },
  { id: "china-cac", name: "China CAC", category: "government", region: "asia", description: "Cyberspace Administration of China" },
  { id: "singapore-imda", name: "Singapore IMDA", category: "government", region: "asia", description: "AI Verify governance framework" },
  { id: "canada-aida", name: "Canada AIDA", category: "government", region: "americas", description: "Artificial Intelligence and Data Act" },
  { id: "japan-meti", name: "Japan METI", category: "government", region: "asia", description: "AI Governance Guidelines" },
  { id: "korea-msit", name: "South Korea MSIT", category: "government", region: "asia", description: "AI Framework Act 2026" },
  { id: "australia-dta", name: "Australia DTA", category: "government", region: "asia", description: "AI Ethics Framework" },
  { id: "brazil-anpd", name: "Brazil ANPD", category: "government", region: "americas", description: "AI Bill of Rights" },
  { id: "india-meity", name: "India MeitY", category: "government", region: "asia", description: "Responsible AI Framework" },
  { id: "uae-ai-office", name: "UAE AI Office", category: "government", region: "asia", description: "National AI Strategy" },

  // Organizations
  { id: "oecd", name: "OECD", category: "organization", region: "global", description: "AI Policy Observatory" },
  { id: "unesco", name: "UNESCO", category: "organization", region: "global", description: "AI Ethics Recommendation" },
  { id: "iso", name: "ISO/IEC", category: "organization", region: "global", description: "AI Standards Development" },
  { id: "ieee", name: "IEEE", category: "organization", region: "global", description: "Ethically Aligned Design" },
  { id: "partnership-ai", name: "Partnership on AI", category: "organization", region: "global", description: "Multi-stakeholder AI research" },
  { id: "world-economic-forum", name: "World Economic Forum", category: "organization", region: "global", description: "AI Governance Alliance" },
  { id: "un-ai-advisory", name: "UN AI Advisory Body", category: "organization", region: "global", description: "Global AI governance recommendations" },
  { id: "g7-hiroshima", name: "G7 AI Process", category: "organization", region: "global", description: "Hiroshima AI Process principles" },
  { id: "gpai", name: "GPAI", category: "organization", region: "global", description: "Global Partnership on AI" },
  { id: "ai-safety-institute-us", name: "US AI Safety Institute", category: "organization", region: "americas", description: "NIST AI safety testing" },

  // Academic Institutions
  { id: "mit-csail", name: "MIT CSAIL", category: "academic", region: "americas", description: "AI Safety Research" },
  { id: "stanford-hai", name: "Stanford HAI", category: "academic", region: "americas", description: "Human-Centered AI Institute" },
  { id: "oxford-fhi", name: "Oxford FHI", category: "academic", region: "europe", description: "Future of Humanity Institute" },
  { id: "cambridge-cser", name: "Cambridge CSER", category: "academic", region: "europe", description: "Centre for Study of Existential Risk" },
  { id: "tsinghua-ai", name: "Tsinghua AI Institute", category: "academic", region: "asia", description: "AI Research & Policy" },
  { id: "berkeley-cais", name: "Berkeley CHAI", category: "academic", region: "americas", description: "Center for Human-Compatible AI" },
  { id: "alan-turing", name: "Alan Turing Institute", category: "academic", region: "europe", description: "UK National AI Research" },
  { id: "mila", name: "Mila Quebec", category: "academic", region: "americas", description: "AI for Humanity research" },
  { id: "eth-zurich", name: "ETH Zürich AI Center", category: "academic", region: "europe", description: "Swiss AI Excellence" },
  { id: "kaist", name: "KAIST AI", category: "academic", region: "asia", description: "Korean AI Research Institute" },

  // Industry
  { id: "anthropic", name: "Anthropic", category: "industry", region: "americas", description: "Constitutional AI research" },
  { id: "deepmind", name: "Google DeepMind", category: "industry", region: "europe", description: "AI Safety research team" },
  { id: "openai", name: "OpenAI", category: "industry", region: "americas", description: "Superalignment team" },
  { id: "meta-ai", name: "Meta AI", category: "industry", region: "americas", description: "Responsible AI practices" },
  { id: "microsoft-rai", name: "Microsoft RAI", category: "industry", region: "americas", description: "Responsible AI program" },
  { id: "ibm-ethics", name: "IBM AI Ethics", category: "industry", region: "americas", description: "Trustworthy AI framework" },
  { id: "baidu-ai", name: "Baidu AI", category: "industry", region: "asia", description: "AI safety research China" },
  { id: "nvidia-trustworthy", name: "NVIDIA Trustworthy AI", category: "industry", region: "americas", description: "AI safety in hardware/software" },

  // Frameworks
  { id: "eu-ai-act", name: "EU AI Act", category: "framework", region: "europe", description: "Comprehensive AI regulation" },
  { id: "nist-rmf", name: "NIST AI RMF", category: "framework", region: "americas", description: "Risk Management Framework" },
  { id: "iso-42001", name: "ISO/IEC 42001", category: "framework", region: "global", description: "AI Management System" },
  { id: "tc260", name: "China TC260", category: "framework", region: "asia", description: "AI Security Standards" },
  { id: "uk-aisi-framework", name: "UK AI Safety Framework", category: "framework", region: "europe", description: "Frontier AI safety testing" },
  { id: "singapore-model-framework", name: "Singapore Model Framework", category: "framework", region: "asia", description: "AI Governance 2nd Edition" },
  { id: "ieee-7000", name: "IEEE 7000 Series", category: "framework", region: "global", description: "Ethical AI standards" },
  { id: "soai-pdca", name: "SOAI-PDCA", category: "framework", region: "global", description: "CSOAI's unified framework", link: "/soai-pdca" },
];

const categoryConfig = {
  government: { icon: Building2, color: "bg-blue-500", label: "Government" },
  organization: { icon: Globe, color: "bg-purple-500", label: "Organization" },
  academic: { icon: GraduationCap, color: "bg-amber-500", label: "Academic" },
  industry: { icon: Users, color: "bg-rose-500", label: "Industry" },
  framework: { icon: Shield, color: "bg-emerald-500", label: "Framework" },
};

const regionConfig = {
  global: { label: "Global", color: "text-gray-600" },
  europe: { label: "Europe", color: "text-blue-600" },
  americas: { label: "Americas", color: "text-red-600" },
  asia: { label: "Asia", color: "text-yellow-600" },
  africa: { label: "Africa", color: "text-green-600" },
};

export default function GovernanceNetwork() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  const filteredNodes = networkNodes.filter((node) => {
    if (selectedCategory && node.category !== selectedCategory) return false;
    if (selectedRegion && node.region !== selectedRegion) return false;
    return true;
  });

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedRegion(null);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium mb-4">
            <Globe className="h-4 w-4" />
            Global Ecosystem
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            AI Safety Governance Network
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Explore the global landscape of AI safety stakeholders, regulations, and frameworks.
            CSOAI integrates with all major initiatives to provide unified oversight.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-8"
        >
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Filter className="h-4 w-4" />
            <span>Filter by:</span>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === key
                    ? `${config.color} text-white`
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                <config.icon className="h-3.5 w-3.5" />
                {config.label}
              </button>
            ))}
          </div>

          <span className="text-gray-600">|</span>

          {/* Region Filters */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(regionConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedRegion(selectedRegion === key ? null : key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedRegion === key
                    ? "bg-white text-gray-900"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>

          {(selectedCategory || selectedRegion) && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </motion.div>

        {/* Network Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredNodes.map((node, index) => {
              const config = categoryConfig[node.category];
              const IconComponent = config.icon;

              return (
                <motion.div
                  key={node.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => setSelectedNode(node)}
                  className={`relative p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all group`}
                >
                  <div className={`inline-flex p-2 rounded-lg ${config.color} mb-3`}>
                    <IconComponent className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="text-white font-medium text-sm mb-1 group-hover:text-emerald-400 transition-colors">
                    {node.name}
                  </h4>
                  <p className="text-gray-500 text-xs">{regionConfig[node.region].label}</p>

                  {node.id === "soai-pdca" && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded">
                      CSOAI
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Selected Node Detail Modal */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedNode(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`inline-flex p-3 rounded-xl ${categoryConfig[selectedNode.category].color}`}>
                    {(() => {
                      const IconComponent = categoryConfig[selectedNode.category].icon;
                      return <IconComponent className="h-6 w-6 text-white" />;
                    })()}
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{selectedNode.name}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryConfig[selectedNode.category].color} text-white`}>
                    {categoryConfig[selectedNode.category].label}
                  </span>
                  <span className="text-gray-400 text-sm">{regionConfig[selectedNode.region].label}</span>
                </div>
                <p className="text-gray-300 mb-6">{selectedNode.description}</p>

                {selectedNode.link ? (
                  <a href={selectedNode.link}>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Learn More
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                ) : (
                  <Button variant="outline" className="w-full border-slate-600 text-gray-300 hover:bg-slate-700" onClick={() => setSelectedNode(null)}>
                    Close
                  </Button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { value: "8+", label: "Major Frameworks" },
            { value: "12+", label: "Governments" },
            { value: "45+", label: "Stakeholders" },
            { value: "1", label: "Unified Platform" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
