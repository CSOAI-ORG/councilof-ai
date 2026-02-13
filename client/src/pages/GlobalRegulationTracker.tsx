/**
 * Global AI Regulation Tracker
 * Real-time tracking of AI governance frameworks across 40+ nations
 * A comprehensive, data-rich resource tracking enacted laws, proposed bills, and international standards
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Search,
  Filter,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Scale,
  FileText,
  Users,
  Building,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Zap,
  BarChart3,
  Award,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Regulation {
  id: string;
  country: string;
  flag: string;
  framework: string;
  status: "Enforced" | "Proposed" | "Voluntary" | "International";
  year: number;
  requirements: string[];
  sectorsAffected: string[];
  penalties?: string;
  csoaiGuideLink?: string;
  region: string;
  statusColor: string;
  enforcementDate?: string;
  implementationDate?: string;
  description: string;
}

export default function GlobalRegulationTracker() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const regions = ["All", "Europe", "Asia-Pacific", "Americas", "Middle East & Africa", "International"];
  const statuses = ["All", "Enforced", "Proposed", "Voluntary", "International"];

  const regulations: Regulation[] = [
    // ENFORCED/ENACTED
    {
      id: "eu-ai-act",
      country: "European Union",
      flag: "🇪🇺",
      framework: "EU AI Act",
      status: "Enforced",
      year: 2024,
      region: "Europe",
      statusColor: "bg-green-500/10 border-green-500/30",
      enforcementDate: "August 1, 2024",
      implementationDate: "Phased to August 2027",
      description: "World's first comprehensive AI regulation with risk-based framework",
      requirements: [
        "Risk-based classification (unacceptable, high, limited, minimal)",
        "High-risk systems require conformity assessment and documentation",
        "Prohibited AI practices banned immediately",
      ],
      sectorsAffected: ["All sectors", "Biometric identification", "Critical infrastructure", "Law enforcement"],
      penalties: "Up to €35M or 7% of global turnover",
      csoaiGuideLink: "/guides/eu-ai-act",
    },
    {
      id: "south-korea-basic",
      country: "South Korea",
      flag: "🇰🇷",
      framework: "AI Basic Act",
      status: "Enforced",
      year: 2026,
      region: "Asia-Pacific",
      statusColor: "bg-green-500/10 border-green-500/30",
      enforcementDate: "January 2026",
      implementationDate: "January 2026 onwards",
      description: "Comprehensive AI governance framework with rights protection focus",
      requirements: [
        "AI system transparency requirements",
        "Protection of fundamental rights in AI development",
        "Establishment of AI Ethics Board",
      ],
      sectorsAffected: ["Public sector AI", "High-risk domains", "Data-driven systems"],
      penalties: "KRW 50M+ fines and corrective orders",
    },
    {
      id: "vietnam-ai-law",
      country: "Vietnam",
      flag: "🇻🇳",
      framework: "Vietnam AI Law",
      status: "Enforced",
      year: 2026,
      region: "Asia-Pacific",
      statusColor: "bg-green-500/10 border-green-500/30",
      enforcementDate: "March 2026",
      implementationDate: "March 2026 onwards",
      description: "Southeast Asia's first dedicated AI law focusing on innovation and security",
      requirements: [
        "AI system documentation and risk assessment",
        "Transparency in AI decision-making",
        "Data security and privacy protection",
      ],
      sectorsAffected: ["Finance", "Healthcare", "Government", "E-commerce"],
      penalties: "VND 50-200M fines",
    },
    {
      id: "china-ai-regs",
      country: "China",
      flag: "🇨🇳",
      framework: "China AI Regulations",
      status: "Enforced",
      year: 2024,
      region: "Asia-Pacific",
      statusColor: "bg-green-500/10 border-green-500/30",
      enforcementDate: "August 2023 (Generative AI), Ongoing",
      implementationDate: "2024-2026",
      description: "Sector-specific AI governance with focus on content security and social management",
      requirements: [
        "Generative AI content security assessments",
        "Algorithm transparency and governance",
        "Data protection and cross-border flow restrictions",
      ],
      sectorsAffected: ["Generative AI", "Recommendation algorithms", "Public opinion analysis"],
      penalties: "CNY 50K+ fines and service suspension",
      csoaiGuideLink: "/guides/china-tc260",
    },
    {
      id: "japan-ai-promotion",
      country: "Japan",
      flag: "🇯🇵",
      framework: "AI Promotion Act",
      status: "Enforced",
      year: 2025,
      region: "Asia-Pacific",
      statusColor: "bg-green-500/10 border-green-500/30",
      enforcementDate: "May 2025",
      implementationDate: "May 2025 onwards",
      description: "Innovation-focused framework with safety and rights protection provisions",
      requirements: [
        "AI safety and security standards adoption",
        "Human rights impact assessments for high-risk AI",
        "Industry collaboration on governance",
      ],
      sectorsAffected: ["Manufacturing", "Healthcare", "Finance", "Public services"],
      penalties: "Administrative orders and corrective measures",
    },
    {
      id: "singapore-framework",
      country: "Singapore",
      flag: "🇸🇬",
      framework: "Model AI Governance Framework",
      status: "Enforced",
      year: 2024,
      region: "Asia-Pacific",
      statusColor: "bg-green-500/10 border-green-500/30",
      enforcementDate: "2019, Updated 2024",
      implementationDate: "Ongoing with 2024 updates",
      description: "Industry-centric framework focusing on accountability and transparency",
      requirements: [
        "AI governance structure in organizations",
        "Accountability for AI systems and outcomes",
        "Transparency in AI development and deployment",
      ],
      sectorsAffected: ["Finance", "Healthcare", "Government", "Manufacturing"],
      csoaiGuideLink: "/guides/singapore-framework",
    },
    {
      id: "saudi-sdaia",
      country: "Saudi Arabia",
      flag: "🇸🇦",
      framework: "SDAIA AI Framework",
      status: "Enforced",
      year: 2023,
      region: "Middle East & Africa",
      statusColor: "bg-green-500/10 border-green-500/30",
      enforcementDate: "2023",
      implementationDate: "2023 onwards",
      description: "Middle East's comprehensive AI governance framework",
      requirements: [
        "AI system governance and oversight",
        "Risk management for high-impact AI",
        "Ethical AI principles adoption",
      ],
      sectorsAffected: ["Government", "Healthcare", "Finance", "Energy"],
      penalties: "Administrative enforcement and corrective actions",
    },
    {
      id: "uae-strategy",
      country: "United Arab Emirates",
      flag: "🇦🇪",
      framework: "National AI Strategy 2031",
      status: "Enforced",
      year: 2024,
      region: "Middle East & Africa",
      statusColor: "bg-green-500/10 border-green-500/30",
      enforcementDate: "2024 rollout",
      implementationDate: "2024-2031",
      description: "Long-term vision for responsible AI development and adoption",
      requirements: [
        "AI ethics and governance principles",
        "Digital infrastructure modernization",
        "AI talent development and research",
      ],
      sectorsAffected: ["Government", "Healthcare", "Smart cities", "Finance"],
    },
    {
      id: "colorado-ai-act",
      country: "United States (Colorado)",
      flag: "🇺🇸",
      framework: "Colorado AI Act",
      status: "Enforced",
      year: 2026,
      region: "Americas",
      statusColor: "bg-green-500/10 border-green-500/30",
      enforcementDate: "June 2026",
      implementationDate: "June 2026 onwards",
      description: "First US state AI rights and transparency law",
      requirements: [
        "Transparency in algorithmic decision-making",
        "Consumer rights in AI systems",
        "Risk assessments for high-risk AI",
      ],
      sectorsAffected: ["Consumer protection", "Employment", "Credit decisions", "Insurance"],
      penalties: "Up to $10K per violation plus attorney fees",
    },
    {
      id: "illinois-3773",
      country: "United States (Illinois)",
      flag: "🇺🇸",
      framework: "Illinois HB 3773",
      status: "Enforced",
      year: 2026,
      region: "Americas",
      statusColor: "bg-green-500/10 border-green-500/30",
      enforcementDate: "2026",
      implementationDate: "2026 onwards",
      description: "Biometric privacy and AI transparency in decision-making",
      requirements: [
        "Disclosure of AI use in decisions",
        "Right to human review of AI decisions",
        "Biometric privacy protections",
      ],
      sectorsAffected: ["Employment", "Credit", "Insurance", "Housing"],
      penalties: "Civil penalties and private right of action",
    },
    {
      id: "russia-strategy",
      country: "Russia",
      flag: "🇷🇺",
      framework: "AI Strategy + Experimental Regime",
      status: "Enforced",
      year: 2024,
      region: "Europe",
      statusColor: "bg-green-500/10 border-green-500/30",
      enforcementDate: "2024",
      implementationDate: "2024 onwards",
      description: "Government-centric AI development with controlled experimentation",
      requirements: [
        "AI system registration and oversight",
        "Domestic technology prioritization",
        "Experimental zones for innovation",
      ],
      sectorsAffected: ["Government services", "Defense", "Public administration"],
      penalties: "Administrative fines and system suspension",
    },
    {
      id: "brazil-bill",
      country: "Brazil",
      flag: "🇧🇷",
      framework: "AI Bill No. 2338",
      status: "Enforced",
      year: 2024,
      region: "Americas",
      statusColor: "bg-green-500/10 border-green-500/30",
      enforcementDate: "Awaiting final approval/2024-2025",
      implementationDate: "2024-2025",
      description: "Risk-based AI governance with rights and transparency focus",
      requirements: [
        "Risk classification of AI systems",
        "Transparency in AI decision-making",
        "Human oversight of high-risk AI",
      ],
      sectorsAffected: ["Government", "Finance", "Employment", "Healthcare"],
      penalties: "Administrative fines up to BRL 50M",
    },

    // PROPOSED/IN PROGRESS
    {
      id: "uk-aisi",
      country: "United Kingdom",
      flag: "🇬🇧",
      framework: "UK AI Safety Institute",
      status: "Proposed",
      year: 2025,
      region: "Europe",
      statusColor: "bg-blue-500/10 border-blue-500/30",
      enforcementDate: "N/A",
      implementationDate: "Evolving 2025-2026",
      description: "Regulatory approach focusing on safety and innovation balance",
      requirements: [
        "AI safety and security research",
        "Principles-based regulation evolving",
        "Risk-based requirements for high-impact AI",
      ],
      sectorsAffected: ["All sectors", "Large language models", "Autonomous systems"],
    },
    {
      id: "canada-aida",
      country: "Canada",
      flag: "🇨🇦",
      framework: "AIDA (Bill C-27)",
      status: "Proposed",
      year: 2025,
      region: "Americas",
      statusColor: "bg-blue-500/10 border-blue-500/30",
      enforcementDate: "N/A - Stalled",
      implementationDate: "Voluntary interim code (2025+)",
      description: "Failed mandatory approach; transitioning to voluntary code of conduct",
      requirements: [
        "AI impact assessments (proposed)",
        "Transparency in AI systems",
        "Voluntary industry governance",
      ],
      sectorsAffected: ["All sectors"],
      penalties: "Proposed penalties in original bill",
    },
    {
      id: "mexico-ai-law",
      country: "Mexico",
      flag: "🇲🇽",
      framework: "General Law on AI",
      status: "Proposed",
      year: 2026,
      region: "Americas",
      statusColor: "bg-blue-500/10 border-blue-500/30",
      enforcementDate: "Expected 2026",
      implementationDate: "2026 onwards",
      description: "Comprehensive AI governance framework for Latin America",
      requirements: [
        "AI system registration and oversight",
        "Transparency and explainability requirements",
        "Protection of fundamental rights",
      ],
      sectorsAffected: ["Government", "Finance", "Healthcare", "All sectors"],
    },
    {
      id: "argentina-bill",
      country: "Argentina",
      flag: "🇦🇷",
      framework: "Argentina AI Bill",
      status: "Proposed",
      year: 2025,
      region: "Americas",
      statusColor: "bg-blue-500/10 border-blue-500/30",
      enforcementDate: "In development",
      implementationDate: "2025-2026",
      description: "South American AI governance framework under development",
      requirements: [
        "AI ethics principles",
        "Data protection integration",
        "Algorithmic transparency",
      ],
      sectorsAffected: ["All sectors", "Public administration"],
    },
    {
      id: "chile-bill",
      country: "Chile",
      flag: "🇨🇱",
      framework: "Chile AI Bill",
      status: "Proposed",
      year: 2025,
      region: "Americas",
      statusColor: "bg-blue-500/10 border-blue-500/30",
      enforcementDate: "October 2025 chamber approval",
      implementationDate: "2025-2026",
      description: "Comprehensive AI governance with innovation and safety balance",
      requirements: [
        "High-risk AI classification",
        "Transparency requirements",
        "Human oversight mandates",
      ],
      sectorsAffected: ["Government", "Finance", "Healthcare", "Education"],
    },
    {
      id: "colombia-bill",
      country: "Colombia",
      flag: "🇨🇴",
      framework: "AI Bill 274/2025",
      status: "Proposed",
      year: 2025,
      region: "Americas",
      statusColor: "bg-blue-500/10 border-blue-500/30",
      enforcementDate: "In legislative process",
      implementationDate: "2025-2026",
      description: "Colombian AI governance framework",
      requirements: [
        "AI system governance",
        "Risk assessment requirements",
        "Transparency in algorithms",
      ],
      sectorsAffected: ["All sectors"],
    },
    {
      id: "thailand-decree",
      country: "Thailand",
      flag: "🇹🇭",
      framework: "Royal Decree on AI",
      status: "Proposed",
      year: 2025,
      region: "Asia-Pacific",
      statusColor: "bg-blue-500/10 border-blue-500/30",
      enforcementDate: "In development",
      implementationDate: "2025-2026",
      description: "Southeast Asian AI governance framework",
      requirements: [
        "AI system registration",
        "Ethics board establishment",
        "Data security requirements",
      ],
      sectorsAffected: ["Government", "Finance", "Public services"],
    },
    {
      id: "philippines-bills",
      country: "Philippines",
      flag: "🇵🇭",
      framework: "Bills 10944/11262",
      status: "Proposed",
      year: 2025,
      region: "Asia-Pacific",
      statusColor: "bg-blue-500/10 border-blue-500/30",
      enforcementDate: "In legislative process",
      implementationDate: "2025-2026",
      description: "Philippine AI governance proposals",
      requirements: [
        "AI transparency requirements",
        "Consumer protection",
        "Data governance",
      ],
      sectorsAffected: ["All sectors"],
    },
    {
      id: "switzerland-proposal",
      country: "Switzerland",
      flag: "🇨🇭",
      framework: "AI Regulatory Proposal",
      status: "Proposed",
      year: 2025,
      region: "Europe",
      statusColor: "bg-blue-500/10 border-blue-500/30",
      enforcementDate: "In consultation",
      implementationDate: "2026+",
      description: "Swiss approach to AI governance",
      requirements: [
        "Risk-based regulation",
        "High-risk system oversight",
        "Transparency requirements",
      ],
      sectorsAffected: ["All sectors"],
    },
    {
      id: "taiwan-governance",
      country: "Taiwan",
      flag: "🇹🇼",
      framework: "AI Governance Framework",
      status: "Proposed",
      year: 2025,
      region: "Asia-Pacific",
      statusColor: "bg-blue-500/10 border-blue-500/30",
      enforcementDate: "In development",
      implementationDate: "2025-2026",
      description: "Taiwan's approach to AI regulation",
      requirements: [
        "AI system assessment",
        "Transparency measures",
        "Human rights protection",
      ],
      sectorsAffected: ["All sectors"],
    },
    {
      id: "turkey-bill",
      country: "Turkey",
      flag: "🇹🇷",
      framework: "Turkey AI Bill",
      status: "Proposed",
      year: 2025,
      region: "Europe",
      statusColor: "bg-blue-500/10 border-blue-500/30",
      enforcementDate: "In development",
      implementationDate: "2025-2026",
      description: "Turkish AI governance framework",
      requirements: [
        "AI ethics principles",
        "Data protection",
        "System oversight",
      ],
      sectorsAffected: ["All sectors"],
    },
    {
      id: "india-governance",
      country: "India",
      flag: "🇮🇳",
      framework: "AI Governance (Soft Law + Sector-Specific)",
      status: "Proposed",
      year: 2025,
      region: "Asia-Pacific",
      statusColor: "bg-blue-500/10 border-blue-500/30",
      enforcementDate: "Phased soft law",
      implementationDate: "2025+",
      description: "Flexible approach combining soft law with sector-specific rules",
      requirements: [
        "Voluntary AI governance guidelines",
        "Sector-specific compliance frameworks",
        "Data localization requirements",
      ],
      sectorsAffected: ["All sectors", "Finance", "Healthcare", "Government"],
    },

    // VOLUNTARY/GUIDANCE
    {
      id: "australia-ethics",
      country: "Australia",
      flag: "🇦🇺",
      framework: "AI Ethics Framework",
      status: "Voluntary",
      year: 2023,
      region: "Asia-Pacific",
      statusColor: "bg-amber-500/10 border-amber-500/30",
      enforcementDate: "N/A",
      implementationDate: "Ongoing guidance",
      description: "Voluntary AI ethics and governance framework",
      requirements: [
        "Transparency and explainability",
        "Fairness and accountability",
        "Human oversight principles",
      ],
      sectorsAffected: ["Government", "Public sector"],
    },
    {
      id: "newzealand-amendments",
      country: "New Zealand",
      flag: "🇳🇿",
      framework: "Sector Amendments & Guidance",
      status: "Voluntary",
      year: 2024,
      region: "Asia-Pacific",
      statusColor: "bg-amber-500/10 border-amber-500/30",
      enforcementDate: "N/A",
      implementationDate: "Ongoing",
      description: "Sector-specific AI guidance and legislative amendments",
      requirements: [
        "Algorithmic transparency",
        "Human rights assessments",
        "Public participation in algorithm governance",
      ],
      sectorsAffected: ["Government", "Public services", "Social impact systems"],
    },
    {
      id: "hongkong-principles",
      country: "Hong Kong",
      flag: "🇭🇰",
      framework: "12 Principles Framework",
      status: "Voluntary",
      year: 2024,
      region: "Asia-Pacific",
      statusColor: "bg-amber-500/10 border-amber-500/30",
      enforcementDate: "N/A",
      implementationDate: "Ongoing guidance",
      description: "Voluntary principles for responsible AI development",
      requirements: [
        "Data governance and privacy",
        "Transparency and accountability",
        "Fairness and anti-discrimination",
      ],
      sectorsAffected: ["All sectors"],
    },
    {
      id: "israel-sectoral",
      country: "Israel",
      flag: "🇮🇱",
      framework: "Sectoral Model",
      status: "Voluntary",
      year: 2023,
      region: "Middle East & Africa",
      statusColor: "bg-amber-500/10 border-amber-500/30",
      enforcementDate: "N/A",
      implementationDate: "Ongoing",
      description: "Sector-specific AI governance approach",
      requirements: [
        "Sector-specific oversight",
        "Risk-based accountability",
        "Innovation support",
      ],
      sectorsAffected: ["Finance", "Healthcare", "Government", "Security"],
    },
    {
      id: "malaysia-guidelines",
      country: "Malaysia",
      flag: "🇲🇾",
      framework: "AI Governance Guidelines",
      status: "Voluntary",
      year: 2024,
      region: "Asia-Pacific",
      statusColor: "bg-amber-500/10 border-amber-500/30",
      enforcementDate: "N/A",
      implementationDate: "Ongoing guidance",
      description: "Voluntary guidelines for responsible AI governance",
      requirements: [
        "Transparency requirements",
        "Data protection",
        "Human oversight",
      ],
      sectorsAffected: ["All sectors"],
    },
    {
      id: "indonesia-asean",
      country: "Indonesia",
      flag: "🇮🇩",
      framework: "ASEAN Rule-Taking",
      status: "Voluntary",
      year: 2024,
      region: "Asia-Pacific",
      statusColor: "bg-amber-500/10 border-amber-500/30",
      enforcementDate: "N/A",
      implementationDate: "ASEAN framework adoption",
      description: "Part of ASEAN regional AI governance initiatives",
      requirements: [
        "Regional AI principles alignment",
        "Cross-border data governance",
        "Skills and capacity building",
      ],
      sectorsAffected: ["All sectors"],
    },
    {
      id: "nigeria-strategy",
      country: "Nigeria",
      flag: "🇳🇬",
      framework: "AI Strategy & Policy",
      status: "Voluntary",
      year: 2024,
      region: "Middle East & Africa",
      statusColor: "bg-amber-500/10 border-amber-500/30",
      enforcementDate: "N/A",
      implementationDate: "Ongoing",
      description: "African leadership in AI governance",
      requirements: [
        "AI ethics principles",
        "Data governance",
        "Sector-specific oversight",
      ],
      sectorsAffected: ["All sectors", "Government", "Finance"],
    },
    {
      id: "egypt-strategy",
      country: "Egypt",
      flag: "🇪🇬",
      framework: "National AI Strategy",
      status: "Voluntary",
      year: 2023,
      region: "Middle East & Africa",
      statusColor: "bg-amber-500/10 border-amber-500/30",
      enforcementDate: "N/A",
      implementationDate: "Ongoing",
      description: "Egyptian AI development and governance strategy",
      requirements: [
        "Talent development",
        "Innovation support",
        "Data security guidelines",
      ],
      sectorsAffected: ["Government", "Healthcare", "Education"],
    },
    {
      id: "southafrica-framework",
      country: "South Africa",
      flag: "🇿🇦",
      framework: "Policy Framework",
      status: "Voluntary",
      year: 2024,
      region: "Middle East & Africa",
      statusColor: "bg-amber-500/10 border-amber-500/30",
      enforcementDate: "N/A",
      implementationDate: "Ongoing",
      description: "South African approach to AI governance",
      requirements: [
        "Human rights protection",
        "Data governance",
        "Innovation support",
      ],
      sectorsAffected: ["All sectors"],
    },

    // INTERNATIONAL STANDARDS
    {
      id: "oecd-principles",
      country: "OECD",
      flag: "🌍",
      framework: "OECD AI Principles",
      status: "International",
      year: 2019,
      region: "International",
      statusColor: "bg-purple-500/10 border-purple-500/30",
      enforcementDate: "N/A",
      implementationDate: "38+ countries adopting",
      description: "Global principles adopted by 38+ OECD and partner countries",
      requirements: [
        "Value alignment and fairness",
        "Transparency and accountability",
        "Robust human oversight",
      ],
      sectorsAffected: ["All sectors"],
    },
    {
      id: "g7-haip",
      country: "G7",
      flag: "🌍",
      framework: "Hiroshima AI Process (HAIP)",
      status: "International",
      year: 2024,
      region: "International",
      statusColor: "bg-purple-500/10 border-purple-500/30",
      enforcementDate: "N/A",
      implementationDate: "G7 + 42 countries participating",
      description: "G7 initiative for responsible AI governance globally",
      requirements: [
        "Generative AI governance",
        "Risk-based regulation",
        "International cooperation",
      ],
      sectorsAffected: ["All sectors", "Large language models"],
    },
    {
      id: "unesco-recommendation",
      country: "UNESCO",
      flag: "🌍",
      framework: "AI Ethics Recommendation",
      status: "International",
      year: 2023,
      region: "International",
      statusColor: "bg-purple-500/10 border-purple-500/30",
      enforcementDate: "N/A",
      implementationDate: "194 UNESCO member states",
      description: "UNESCO recommendation on AI ethics adopted by 194 states",
      requirements: [
        "Human rights protection",
        "Environmental sustainability",
        "Pluralism and diversity",
      ],
      sectorsAffected: ["All sectors"],
    },
    {
      id: "un-governing",
      country: "United Nations",
      flag: "🌍",
      framework: "Governing AI for Humanity",
      status: "International",
      year: 2024,
      region: "International",
      statusColor: "bg-purple-500/10 border-purple-500/30",
      enforcementDate: "N/A",
      implementationDate: "UN member states coordination",
      description: "UN initiative for global AI governance coordination",
      requirements: [
        "Human rights in AI",
        "Global participation",
        "Equity and inclusion",
      ],
      sectorsAffected: ["All sectors"],
    },
    {
      id: "iso-42001",
      country: "ISO/IEC",
      flag: "🌍",
      framework: "ISO/IEC 42001:2023",
      status: "International",
      year: 2023,
      region: "International",
      statusColor: "bg-purple-500/10 border-purple-500/30",
      enforcementDate: "N/A",
      implementationDate: "Certifiable standard",
      description: "International AI management system certification standard",
      requirements: [
        "AI governance system",
        "Risk management",
        "Resource planning",
      ],
      sectorsAffected: ["All sectors"],
      csoaiGuideLink: "/guides/iso-42001",
    },
    {
      id: "nist-rmf",
      country: "NIST (USA)",
      flag: "🇺🇸",
      framework: "NIST AI Risk Management Framework",
      status: "International",
      year: 2023,
      region: "International",
      statusColor: "bg-purple-500/10 border-purple-500/30",
      enforcementDate: "N/A",
      implementationDate: "Global voluntary adoption",
      description: "US voluntary AI risk management framework widely adopted globally",
      requirements: [
        "AI risk identification and mapping",
        "Risk measurement and monitoring",
        "AI risk management",
      ],
      sectorsAffected: ["All sectors"],
      csoaiGuideLink: "/guides/nist-ai-rmf",
    },
    {
      id: "asean-guide",
      country: "ASEAN",
      flag: "🌍",
      framework: "ASEAN Guide on AI Governance",
      status: "International",
      year: 2024,
      region: "Asia-Pacific",
      statusColor: "bg-purple-500/10 border-purple-500/30",
      enforcementDate: "N/A",
      implementationDate: "ASEAN member state adoption",
      description: "Regional AI governance guidance for Southeast Asia",
      requirements: [
        "Regional AI principles",
        "Cross-border cooperation",
        "Capacity building",
      ],
      sectorsAffected: ["All sectors"],
    },
    {
      id: "african-union",
      country: "African Union",
      flag: "🌍",
      framework: "Continental AI Strategy",
      status: "International",
      year: 2024,
      region: "Middle East & Africa",
      statusColor: "bg-purple-500/10 border-purple-500/30",
      enforcementDate: "N/A",
      implementationDate: "African member state coordination",
      description: "African Union continental AI development and governance strategy",
      requirements: [
        "Innovation and development",
        "Human rights protection",
        "Digital transformation",
      ],
      sectorsAffected: ["All sectors"],
    },
    {
      id: "santiago-declaration",
      country: "Latin America",
      flag: "🌍",
      framework: "Santiago Declaration on AI",
      status: "International",
      year: 2024,
      region: "Americas",
      statusColor: "bg-purple-500/10 border-purple-500/30",
      enforcementDate: "N/A",
      implementationDate: "Latin American coordination",
      description: "Regional AI governance principles for Latin America",
      requirements: [
        "Human rights focus",
        "Inclusive development",
        "Regional cooperation",
      ],
      sectorsAffected: ["All sectors"],
    },
    {
      id: "international-safety",
      country: "International Coalition",
      flag: "🌍",
      framework: "International AI Safety Report 2026",
      status: "International",
      year: 2026,
      region: "International",
      statusColor: "bg-purple-500/10 border-purple-500/30",
      enforcementDate: "N/A",
      implementationDate: "Ongoing coordination",
      description: "Coordinated international effort on AI safety and governance",
      requirements: [
        "AI safety research coordination",
        "Best practices sharing",
        "Risk mitigation strategies",
      ],
      sectorsAffected: ["All sectors"],
    },
  ];

  // Filter regulations based on search and selections
  const filteredRegulations = useMemo(() => {
    return regulations.filter((reg) => {
      const matchesSearch =
        reg.framework.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRegion = selectedRegion === "All" || reg.region === selectedRegion;
      const matchesStatus = selectedStatus === "All" || reg.status === selectedStatus;

      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [searchQuery, selectedRegion, selectedStatus]);

  const stats = [
    { label: "40+ Nations Tracked", value: "40+", color: "text-blue-600" },
    { label: "12 Enforced Laws", value: "12", color: "text-green-600" },
    { label: "15+ Proposed Bills", value: "15+", color: "text-yellow-600" },
    { label: "9 International Standards", value: "9", color: "text-purple-600" },
  ];

  const tabs = [
    { value: "all", label: "All Regulations", count: regulations.length },
    { value: "enforced", label: "Enforced", count: regulations.filter(r => r.status === "Enforced").length },
    { value: "proposed", label: "Proposed", count: regulations.filter(r => r.status === "Proposed").length },
    { value: "voluntary", label: "Voluntary", count: regulations.filter(r => r.status === "Voluntary").length },
    { value: "international", label: "International", count: regulations.filter(r => r.status === "International").length },
  ];

  const statusColors = {
    "Enforced": "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400",
    "Proposed": "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400",
    "Voluntary": "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
    "International": "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400",
  };

  const statusIcons = {
    "Enforced": CheckCircle,
    "Proposed": Clock,
    "Voluntary": FileText,
    "International": Globe,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-blue-500/10 to-cyan-500/10" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
        <div className="container max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="outline" className="text-sm px-4 py-2 bg-indigo-500/10 border-indigo-500/30">
                <Globe className="h-4 w-4 mr-2" />
                Global Coverage
              </Badge>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Global AI Regulation
              <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent"> Tracker</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Real-time tracking of AI governance frameworks across 40+ nations. Stay informed on enforced laws,
              proposed legislation, voluntary guidelines, and international standards shaping global AI regulation.
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Link href="/courses">
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Learn Global Compliance
                </Button>
              </Link>
              <Link href="/compliance">
                <Button size="lg" variant="outline">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Check Your Markets
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y bg-muted/30">
        <div className="container max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className={`text-3xl md:text-4xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-12 px-6 bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-7xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by country, framework, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-input bg-background hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filters */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Region
                </label>
                <div className="flex flex-wrap gap-2">
                  {regions.map((region) => (
                    <button
                      key={region}
                      onClick={() => setSelectedRegion(region)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        selectedRegion === region
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-input hover:bg-muted"
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        selectedStatus === status
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-input hover:bg-muted"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Results count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {filteredRegulations.length} of {regulations.length} regulations</span>
            {(searchQuery || selectedRegion !== "All" || selectedStatus !== "All") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedRegion("All");
                  setSelectedStatus("All");
                }}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Regulations Grid */}
      <section className="py-12 px-6">
        <div className="container max-w-7xl mx-auto">
          <div className="grid gap-6">
            {filteredRegulations.length > 0 ? (
              filteredRegulations.map((regulation, idx) => {
                const StatusIcon = statusIcons[regulation.status];
                return (
                  <motion.div
                    key={regulation.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                  >
                    <Card className={`border-2 ${regulation.statusColor} hover:shadow-lg transition-all group`}>
                      <CardHeader>
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div className="flex items-start gap-4">
                            <div className="text-4xl">{regulation.flag}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <CardTitle className="text-xl">{regulation.framework}</CardTitle>
                                <Badge variant="outline" className={`${statusColors[regulation.status]} border`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {regulation.status}
                                </Badge>
                              </div>
                              <CardDescription className="text-base">
                                {regulation.country} • {regulation.year}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="text-right">
                            {regulation.enforcementDate && (
                              <div className="text-sm text-muted-foreground mb-1">
                                <Calendar className="h-4 w-4 inline mr-1" />
                                {regulation.enforcementDate}
                              </div>
                            )}
                            {regulation.penalties && (
                              <div className="text-sm font-semibold text-red-600">
                                <AlertTriangle className="h-4 w-4 inline mr-1" />
                                {regulation.penalties}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">{regulation.description}</p>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                              Key Requirements
                            </h4>
                            <ul className="space-y-2">
                              {regulation.requirements.slice(0, 3).map((req, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <ChevronRight className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                              Sectors Affected
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {regulation.sectorsAffected.map((sector, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {sector}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-xs text-muted-foreground">
                            {regulation.status === "Enforced" && (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                Active & Enforced
                              </span>
                            )}
                            {regulation.status === "Proposed" && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <Clock className="h-4 w-4" />
                                Under Development
                              </span>
                            )}
                            {regulation.status === "Voluntary" && (
                              <span className="flex items-center gap-1 text-amber-600">
                                <FileText className="h-4 w-4" />
                                Guidance Available
                              </span>
                            )}
                            {regulation.status === "International" && (
                              <span className="flex items-center gap-1 text-purple-600">
                                <Globe className="h-4 w-4" />
                                Global Standard
                              </span>
                            )}
                          </div>
                          {regulation.csoaiGuideLink && (
                            <Link href={regulation.csoaiGuideLink}>
                              <Button variant="ghost" size="sm" className="group-hover:text-indigo-600">
                                Full Guide
                                <ExternalLink className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No regulations found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or filter criteria
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedRegion("All");
                    setSelectedStatus("All");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Regional Distribution */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Regional Distribution</h2>
            <p className="text-xl text-muted-foreground">
              AI regulation is developing rapidly across all global regions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions
              .filter((r) => r !== "All")
              .map((region, idx) => {
                const regionRegs = regulations.filter((r) => r.region === region);
                const enforced = regionRegs.filter((r) => r.status === "Enforced").length;
                const proposed = regionRegs.filter((r) => r.status === "Proposed").length;
                const voluntary = regionRegs.filter((r) => r.status === "Voluntary").length;

                return (
                  <motion.div
                    key={region}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="p-6 hover:shadow-lg transition-all cursor-pointer" onClick={() => setSelectedRegion(region)}>
                      <h3 className="text-lg font-bold mb-4">{region}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Enforced Laws</span>
                          <span className="text-2xl font-bold text-green-600">{enforced}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Proposed Bills</span>
                          <span className="text-2xl font-bold text-blue-600">{proposed}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Voluntary Guidelines</span>
                          <span className="text-2xl font-bold text-amber-600">{voluntary}</span>
                        </div>
                        <div className="pt-4 border-t">
                          <span className="text-xs text-muted-foreground">
                            Total: {regionRegs.length} frameworks
                          </span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </section>

      {/* Timeline of Implementation */}
      <section className="py-20 px-6">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="text-sm mb-4">Implementation Timeline</Badge>
            <h2 className="text-4xl font-bold mb-4">Key Enforcement Dates</h2>
            <p className="text-xl text-muted-foreground">
              Major AI regulation milestones in 2024-2027
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              { date: "2023-2024", label: "Early Adoptions", color: "bg-green-500", items: ["Saudi AI Framework", "China AI Regs", "Singapore Updated"] },
              { date: "2024-2025", label: "Peak Enforcement", color: "bg-blue-500", items: ["EU AI Act Phases", "Japan AI Act", "US Colorado & Illinois", "South Korea & Vietnam"] },
              { date: "2025-2026", label: "Global Wave", color: "bg-purple-500", items: ["Mexico Law Expected", "Canada Voluntary Code", "Multiple Proposed Bills"] },
              { date: "2026-2027", label: "Full Compliance", color: "bg-amber-500", items: ["EU AI Act Full Implementation", "International Standards Adoption"] },
            ].map((period, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`${period.color} p-3 rounded-lg text-white flex-shrink-0`}>
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{period.label}</h3>
                      <p className="text-muted-foreground text-sm mb-3">{period.date}</p>
                      <div className="flex flex-wrap gap-2">
                        {period.items.map((item, idx) => (
                          <Badge key={idx} variant="outline">{item}</Badge>
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
      <section className="py-20 px-6 bg-muted/30">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="text-sm mb-4 bg-indigo-500/10 text-indigo-600 border-indigo-500/30">
              Your Global Compliance Partner
            </Badge>
            <h2 className="text-4xl font-bold mb-4">How CSOAI Helps You Globally</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Navigate multi-jurisdiction AI compliance with comprehensive tools and expertise
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Global Regulation Database",
                description: "Real-time tracking of 40+ AI governance frameworks across all nations and regions",
                icon: Globe,
                link: "/tracker",
              },
              {
                title: "Multi-Market Compliance",
                description: "Manage compliance requirements across multiple jurisdictions from a single platform",
                icon: Building,
                link: "/compliance",
              },
              {
                title: "Jurisdiction Mapping",
                description: "Automated assessment of which regulations apply to your AI systems and operations",
                icon: MapPin,
                link: "/risk-assessment",
              },
              {
                title: "Regulatory Training",
                description: "Comprehensive training on global AI regulations covering all major frameworks",
                icon: GraduationCap,
                link: "/courses",
              },
              {
                title: "Compliance Intelligence",
                description: "AI-powered analysis of regulatory requirements and compliance implications",
                icon: TrendingUp,
                link: "/workbench",
              },
              {
                title: "Risk Prioritization",
                description: "Identify which regulations pose the highest compliance risk for your organization",
                icon: AlertTriangle,
                link: "/risk-assessment",
              },
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link href={feature.link}>
                  <Card className="h-full p-6 hover:shadow-lg transition-all hover:border-indigo-500/30 cursor-pointer group">
                    <div className="p-3 rounded-lg bg-indigo-500/10 w-fit mb-4 group-hover:bg-indigo-500/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                    <div className="flex items-center text-indigo-600 text-sm font-medium">
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

      {/* Key Insights */}
      <section className="py-20 px-6">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="text-sm mb-4">Market Intelligence</Badge>
            <h2 className="text-4xl font-bold mb-4">Global Regulation Trends</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 rounded-lg bg-green-500/20">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Enforcement Momentum</h3>
                    <p className="text-sm text-muted-foreground">12 laws now enforced globally</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                    EU AI Act leading with phased implementation through 2027
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                    Asia-Pacific accelerating with South Korea, Japan, Vietnam, China
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                    US taking state-level approach with Colorado, Illinois leading
                  </li>
                </ul>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-8 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 rounded-lg bg-blue-500/20">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Legislative Wave</h3>
                    <p className="text-sm text-muted-foreground">15+ proposed bills in progress</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    Latin America developing comprehensive frameworks (Mexico, Argentina, Chile)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    Europe continuing with UK, Switzerland, Turkey proposals
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    India adopting sector-specific soft law approach
                  </li>
                </ul>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="container max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <Badge variant="secondary" className="text-sm bg-white/20 text-white border-white/30">
              <Zap className="h-4 w-4 mr-2" />
              Global Coverage
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Master Global AI Compliance
            </h2>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
              Don't let regulatory complexity slow you down. CSOAI provides comprehensive tools
              and expertise to ensure compliance across all global AI governance frameworks.
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-6">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="bg-white text-indigo-700 hover:bg-indigo-50">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="py-12 px-6 border-t">
        <div className="container max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h4 className="font-bold mb-2">Tracker Updates</h4>
              <p className="text-sm text-muted-foreground">
                This tracker is updated monthly with the latest regulation changes and proposals
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-2">Not Legal Advice</h4>
              <p className="text-sm text-muted-foreground">
                This information is for awareness only. Consult legal experts for jurisdiction-specific guidance
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-2">Stay Informed</h4>
              <p className="text-sm text-muted-foreground">
                Subscribe to regulatory updates and analysis from CSOAI experts
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
