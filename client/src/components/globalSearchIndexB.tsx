import type { SearchResult } from './globalSearchIndexA';
import {
  Award, BarChart3, BookOpen, Brain, Briefcase, Building2, DollarSign, Eye,
  FileCheck, FileText, Gavel, Globe2, GraduationCap, Heart, HelpCircle,
  Play, Plus, Scale, Settings, Shield, Users, Zap, AlertTriangle,
} from 'lucide-react';

export const SEARCH_INDEX_B: SearchResult[] = [
  { id: 'feature-watchdog', title: 'Watchdog Jobs Feature', description: 'Learn about analyst opportunities', category: 'pages', href: '/features/watchdog-jobs', icon: Briefcase, keywords: ['feature', 'jobs', 'watchdog'] },

  // Compliance Framework Guides
  { id: 'eu-ai-act-guide', title: 'EU AI Act Guide', description: 'Complete guide to European AI regulation', category: 'pages', href: '/eu-ai-act', icon: Globe2, keywords: ['europe', 'regulation', 'eu'] },
  { id: 'nist-guide', title: 'NIST AI RMF Guide', description: 'US AI Risk Management Framework guide', category: 'pages', href: '/nist-ai-rmf', icon: Shield, keywords: ['us', 'risk', 'nist'] },
  { id: 'iso-guide', title: 'ISO 42001 Guide', description: 'International AI Management System standard', category: 'pages', href: '/iso-42001', icon: FileText, keywords: ['international', 'iso', 'management'] },
  { id: 'tc260-guide', title: 'TC260 Guide', description: 'Chinese AI safety standards guide', category: 'pages', href: '/tc260', icon: Globe2, keywords: ['china', 'tc260', 'chinese'] },

  // Miscellaneous Pages
  { id: 'reports', title: 'Reports', description: 'Generate and view compliance reports', category: 'pages', href: '/reports', icon: FileText, keywords: ['generate', 'export', 'pdf'] },
  { id: 'workbench', title: 'Workbench', description: 'AI compliance workbench and tools', category: 'pages', href: '/workbench', icon: Settings, keywords: ['tools', 'workspace', 'work'] },
  { id: 'admin', title: 'Admin Panel', description: 'Administrative dashboard', category: 'pages', href: '/admin', icon: Settings, keywords: ['admin', 'manage', 'control'] },

  // ===== CHARTER ARTICLES (52 articles) =====
  // Part I: Foundational Principles (Articles 1-8)
  { id: 'art-1', title: 'Article 1: The Maternal Covenant', description: 'Foundational relationship between humanity and AI based on care', category: 'charter', href: '/charter#part-i', icon: Heart, keywords: ['maternal', 'covenant', 'care', 'hinton'], highlight: true },
  { id: 'art-2', title: 'Article 2: Provable Safety Requirements', description: 'Mathematical and empirical safety standards for AI systems', category: 'charter', href: '/charter#part-i', icon: Shield, keywords: ['provable', 'safety', 'mathematical', 'proof'] },
  { id: 'art-3', title: 'Article 3: Council Oversight', description: 'multi-provider oversight architecture', category: 'charter', href: '/charter#part-i', icon: Users, keywords: ['council', 'oversight', 'measurement'] },
  { id: 'art-4', title: 'Article 4: Value Uncertainty Principles', description: 'Handling moral and ethical uncertainty in AI', category: 'charter', href: '/charter#part-i', icon: Scale, keywords: ['value', 'uncertainty', 'ethics', 'moral'] },
  { id: 'art-5', title: 'Article 5: Constitutional AI Principles', description: 'Core values embedded in AI systems', category: 'charter', href: '/charter#part-i', icon: FileText, keywords: ['constitutional', 'principles', 'values'] },
  { id: 'art-6', title: 'Charter Article 6', description: 'Forward-looking charter provision — not a measured capability', category: 'charter', href: '/charter#part-i', icon: Brain, keywords: ['consciousness', 'sentience', 'awareness'] },
  { id: 'art-7', title: 'Article 7: Cooperative AI Framework', description: 'Multi-agent coordination principles', category: 'charter', href: '/charter#part-i', icon: Users, keywords: ['cooperative', 'multi-agent', 'coordination'] },
  { id: 'art-8', title: 'Article 8: The Prosperity Covenant', description: 'Economic redistribution and UBI framework', category: 'charter', href: '/charter#part-i', icon: DollarSign, keywords: ['prosperity', 'ubi', 'redistribution'], highlight: true },

  // Part II: Governance Structure (Articles 9-18)
  { id: 'art-9', title: 'Article 9: Founding Principles & Definitions', description: 'Core terminology and interpretive principles', category: 'charter', href: '/charter#part-ii', icon: FileText, keywords: ['definitions', 'founding', 'terminology'] },
  { id: 'art-10', title: 'Article 10: Licensing Framework', description: 'Tiered licensing system and requirements', category: 'charter', href: '/charter#part-ii', icon: Award, keywords: ['licensing', 'tiers', 'requirements'] },
  { id: 'art-11', title: 'Article 11: Council Specifications', description: 'Technical architecture of AI oversight', category: 'charter', href: '/charter#part-ii', icon: Shield, keywords: ['byzantine', 'specifications', 'technical'] },
  { id: 'art-12', title: 'Article 12: Human Council', description: 'Human oversight body structure', category: 'charter', href: '/charter#part-ii', icon: Users, keywords: ['human', 'council', 'oversight'] },
  { id: 'art-13', title: 'Article 13: Public Watchdog', description: 'Transparency and public accountability', category: 'charter', href: '/charter#part-ii', icon: Eye, keywords: ['watchdog', 'public', 'transparency'] },
  { id: 'art-14', title: 'Article 14: Democratic Participation', description: 'Public input and governance participation', category: 'charter', href: '/charter#part-ii', icon: Users, keywords: ['democratic', 'participation', 'voting'] },
  { id: 'art-15', title: 'Article 15: Compliance Assessment', description: 'Audit and assessment procedures', category: 'charter', href: '/charter#part-ii', icon: FileCheck, keywords: ['compliance', 'audit', 'assessment'] },
  { id: 'art-16', title: 'Article 16: Embodied AI Standards', description: 'Robotics and physical AI requirements', category: 'charter', href: '/charter#part-ii', icon: Brain, keywords: ['robotics', 'embodied', 'physical'] },
  { id: 'art-17', title: 'Article 17: Enforcement Mechanisms', description: 'Sanctions and compliance enforcement', category: 'charter', href: '/charter#part-ii', icon: Gavel, keywords: ['enforcement', 'sanctions', 'penalties'] },
  { id: 'art-18', title: 'Article 18: Appeals & Dispute Resolution', description: 'Due process and appeals procedures', category: 'charter', href: '/charter#part-ii', icon: Scale, keywords: ['appeals', 'disputes', 'resolution'] },

  // Part III: Technical Standards (Articles 19-31)
  { id: 'art-19', title: 'Article 19: International Regulatory Integration', description: 'EU AI Act, NIST, ISO alignment', category: 'charter', href: '/charter#part-iii', icon: Globe2, keywords: ['international', 'eu', 'nist', 'iso'] },
  { id: 'art-20', title: 'Article 20: Technical Standards', description: 'Development and deployment specifications', category: 'charter', href: '/charter#part-iii', icon: FileText, keywords: ['technical', 'specifications', 'standards'] },
  { id: 'art-21', title: 'Article 21: Data Governance & Privacy', description: 'GDPR and data protection requirements', category: 'charter', href: '/charter#part-iii', icon: Shield, keywords: ['data', 'privacy', 'gdpr'] },
  { id: 'art-22', title: 'Article 22: Cybersecurity Requirements', description: 'Security standards and incident response', category: 'charter', href: '/charter#part-iii', icon: Shield, keywords: ['cybersecurity', 'security', 'incident'] },
  { id: 'art-23', title: 'Article 23: Model Development Standards', description: 'Training, validation, and deployment', category: 'charter', href: '/charter#part-iii', icon: Brain, keywords: ['model', 'development', 'training'] },
  { id: 'art-24', title: 'Article 24: Testing & Validation Protocols', description: 'Quality assurance requirements', category: 'charter', href: '/charter#part-iii', icon: FileCheck, keywords: ['testing', 'validation', 'qa'] },
  { id: 'art-25', title: 'Article 25: Documentation Requirements', description: 'Model cards and system documentation', category: 'charter', href: '/charter#part-iii', icon: FileText, keywords: ['documentation', 'model cards', 'docs'] },
  { id: 'art-26', title: 'Article 26: Interpretability & Explainability', description: 'AI transparency requirements', category: 'charter', href: '/charter#part-iii', icon: Eye, keywords: ['explainability', 'interpretability', 'xai'] },
  { id: 'art-27', title: 'Article 27: Performance Metrics & Benchmarks', description: 'Evaluation standards for AI systems', category: 'charter', href: '/charter#part-iii', icon: BarChart3, keywords: ['metrics', 'benchmarks', 'evaluation'] },
  { id: 'art-28', title: 'Article 28: Interoperability Standards', description: 'Cross-system compatibility', category: 'charter', href: '/charter#part-iii', icon: Settings, keywords: ['interoperability', 'compatibility', 'integration'] },
  { id: 'art-29', title: 'Article 29: Training & Education', description: 'Professional development requirements', category: 'charter', href: '/charter#part-iii', icon: GraduationCap, keywords: ['training', 'education', 'professional'] },
  { id: 'art-30', title: 'Article 30: Research & Development', description: 'Innovation and safety research', category: 'charter', href: '/charter#part-iii', icon: Brain, keywords: ['research', 'r&d', 'innovation'] },
  { id: 'art-31', title: 'Article 31: Environmental Sustainability', description: 'Green AI requirements', category: 'charter', href: '/charter#part-iii', icon: Globe2, keywords: ['environmental', 'green', 'sustainability'] },

  // Part IV: Sector-Specific Standards (Articles 32-36)
  { id: 'art-32', title: 'Article 32: Healthcare AI', description: 'Medical AI safety and compliance', category: 'charter', href: '/charter#part-iv', icon: Heart, keywords: ['healthcare', 'medical', 'health'] },
  { id: 'art-33', title: 'Article 33: Financial AI', description: 'Banking, trading, credit AI standards', category: 'charter', href: '/charter#part-iv', icon: DollarSign, keywords: ['financial', 'banking', 'trading'] },
  { id: 'art-34', title: 'Article 34: Transportation AI', description: 'Autonomous vehicles, aviation standards', category: 'charter', href: '/charter#part-iv', icon: Globe2, keywords: ['transportation', 'autonomous', 'vehicles'] },
  { id: 'art-35', title: 'Article 35: Education AI', description: 'Learning systems, academic integrity', category: 'charter', href: '/charter#part-iv', icon: GraduationCap, keywords: ['education', 'learning', 'academic'] },
  { id: 'art-36', title: 'Article 36: Military & Defense AI', description: 'Lethal autonomous weapons restrictions', category: 'charter', href: '/charter#part-iv', icon: Shield, keywords: ['military', 'defense', 'weapons'] },

  // Part V: Economic & Social Framework (Articles 37-44)
  { id: 'art-37', title: 'Article 37: Labor Transition', description: 'Worker displacement and retraining', category: 'charter', href: '/charter#part-v', icon: Users, keywords: ['labor', 'workers', 'jobs'] },
  { id: 'art-38', title: 'Article 38: Small Business Support', description: 'SME AI adoption assistance', category: 'charter', href: '/charter#part-v', icon: Building2, keywords: ['small business', 'sme', 'support'] },
  { id: 'art-39', title: 'Article 39: Nonprofit & Academic Provisions', description: 'Special licensing for research', category: 'charter', href: '/charter#part-v', icon: BookOpen, keywords: ['nonprofit', 'academic', 'research'] },
  { id: 'art-40', title: 'Article 40: Developing Nations Support', description: 'Global equity and access', category: 'charter', href: '/charter#part-v', icon: Globe2, keywords: ['developing', 'global', 'equity'] },
  { id: 'art-41', title: 'Article 41: Consumer Protection', description: 'End-user rights and safety', category: 'charter', href: '/charter#part-v', icon: Shield, keywords: ['consumer', 'protection', 'rights'] },
  { id: 'art-42', title: 'Article 42: Competition & Antitrust', description: 'Market concentration limits', category: 'charter', href: '/charter#part-v', icon: Scale, keywords: ['competition', 'antitrust', 'market'] },
  { id: 'art-43', title: 'Article 43: Intellectual Property', description: 'AI-generated content rights', category: 'charter', href: '/charter#part-v', icon: FileText, keywords: ['ip', 'intellectual property', 'copyright'] },
  { id: 'art-44', title: 'Article 44: Insurance & Liability', description: 'Risk coverage and responsibility', category: 'charter', href: '/charter#part-v', icon: Shield, keywords: ['insurance', 'liability', 'risk'] },

  // Part VI: Long-Term Governance (Articles 45-52)
  { id: 'art-45', title: 'Article 45: Existential Risk Prevention', description: 'AGI and catastrophic risk protocols', category: 'charter', href: '/charter#part-vi', icon: AlertTriangle, keywords: ['existential', 'risk', 'catastrophic'] },
  { id: 'art-46', title: 'Article 46: AGI/ASI Protocols', description: 'Advanced AI governance frameworks', category: 'charter', href: '/charter#part-vi', icon: Brain, keywords: ['agi', 'asi', 'superintelligence'] },
  { id: 'art-47', title: 'Article 47: International Treaties', description: 'Global coordination mechanisms', category: 'charter', href: '/charter#part-vi', icon: Globe2, keywords: ['treaties', 'international', 'coordination'] },
  { id: 'art-48', title: 'Article 48: Charter Amendment Process', description: 'Constitutional change procedures', category: 'charter', href: '/charter#part-vi', icon: FileText, keywords: ['amendment', 'change', 'update'] },
  { id: 'art-49', title: 'Article 49: Organizational Evolution', description: 'CSOAI adaptation mechanisms', category: 'charter', href: '/charter#part-vi', icon: Settings, keywords: ['evolution', 'adaptation', 'change'] },
  { id: 'art-50', title: 'Article 50: Succession Planning', description: 'Leadership continuity', category: 'charter', href: '/charter#part-vi', icon: Users, keywords: ['succession', 'leadership', 'continuity'] },
];
