import type { SearchResult } from './globalSearchIndexA';
import {
  Award, BarChart3, BookOpen, Brain, Briefcase, Building2, DollarSign, Eye,
  FileCheck, FileText, Gavel, Globe2, GraduationCap, Heart, HelpCircle,
  Play, Plus, Scale, Settings, Shield, Users, Zap, AlertTriangle,
} from 'lucide-react';

export const SEARCH_INDEX_C: SearchResult[] = [
  { id: 'art-51', title: 'Article 51: Legacy & Archives', description: 'Historical documentation', category: 'charter', href: '/charter#part-vi', icon: BookOpen, keywords: ['legacy', 'archives', 'history'] },
  { id: 'art-52', title: 'Article 52: Effective Date & Implementation', description: 'January 15, 2026, 09:00 GMT', category: 'charter', href: '/charter#part-vi', icon: FileText, keywords: ['effective', 'date', 'implementation'], highlight: true },

  // ===== TRAINING MODULES (24+ modules) =====
  { id: 'train-eu-fund', title: 'EU AI Act Fundamentals', description: 'Introduction to European AI regulation', category: 'training', href: '/courses?framework=eu', icon: GraduationCap, keywords: ['eu', 'european', 'fundamentals'] },
  { id: 'train-eu-adv', title: 'EU AI Act Advanced', description: 'Deep dive into EU AI Act compliance', category: 'training', href: '/courses?framework=eu&level=advanced', icon: GraduationCap, keywords: ['eu', 'advanced', 'compliance'] },
  { id: 'train-eu-spec', title: 'EU AI Act Specialist', description: 'Academy track — signed record of training, not conformity', category: 'training', href: '/academy', icon: Award, keywords: ['eu', 'specialist', 'expert'] },
  { id: 'train-nist-fund', title: 'NIST AI RMF Fundamentals', description: 'Introduction to US AI Risk Management', category: 'training', href: '/courses?framework=nist', icon: GraduationCap, keywords: ['nist', 'us', 'risk'] },
  { id: 'train-nist-adv', title: 'NIST AI RMF Advanced', description: 'Advanced NIST framework implementation', category: 'training', href: '/courses?framework=nist&level=advanced', icon: GraduationCap, keywords: ['nist', 'advanced', 'implementation'] },
  { id: 'train-nist-spec', title: 'NIST AI RMF Specialist', description: 'Academy track — signed record of training, not conformity', category: 'training', href: '/academy', icon: Award, keywords: ['nist', 'specialist', 'certification'] },
  { id: 'train-iso-fund', title: 'ISO 42001 Fundamentals', description: 'Introduction to AI Management Systems', category: 'training', href: '/courses?framework=iso', icon: GraduationCap, keywords: ['iso', '42001', 'management'] },
  { id: 'train-iso-adv', title: 'ISO 42001 Advanced', description: 'Advanced AI management system implementation', category: 'training', href: '/courses?framework=iso&level=advanced', icon: GraduationCap, keywords: ['iso', 'advanced', 'isms'] },
  { id: 'train-iso-spec', title: 'ISO 42001 Lead Implementer', description: 'Academy track — signed record of training, not conformity', category: 'training', href: '/academy', icon: Award, keywords: ['iso', 'lead', 'implementer'] },
  { id: 'train-tc260', title: 'TC260 Chinese Standards', description: 'Chinese AI safety standards training', category: 'training', href: '/courses?framework=tc260', icon: GraduationCap, keywords: ['tc260', 'china', 'chinese'] },
  { id: 'train-pdca', title: 'SOAI-PDCA Methodology', description: 'Master the Plan-Do-Check-Act framework', category: 'training', href: '/courses?framework=pdca', icon: Scale, keywords: ['pdca', 'methodology', 'soai'] },
  { id: 'train-byzantine', title: 'Council Training', description: 'Understanding multi-agent AI monitoring', category: 'training', href: '/courses?framework=byzantine', icon: Shield, keywords: ['byzantine', 'council', 'monitoring'] },
  { id: 'train-risk', title: 'AI Risk Assessment', description: 'Learn to assess AI system risks', category: 'training', href: '/courses?framework=risk', icon: AlertTriangle, keywords: ['risk', 'assessment', 'evaluation'] },
  { id: 'train-ethics', title: 'AI Ethics & Governance', description: 'Ethical considerations in AI development', category: 'training', href: '/courses?framework=ethics', icon: Scale, keywords: ['ethics', 'governance', 'moral'] },
  { id: 'train-healthcare', title: 'Healthcare AI Compliance', description: 'Medical AI regulatory requirements', category: 'training', href: '/courses?sector=healthcare', icon: Heart, keywords: ['healthcare', 'medical', 'compliance'] },
  { id: 'train-finance', title: 'Financial AI Compliance', description: 'Banking and fintech AI regulations', category: 'training', href: '/courses?sector=finance', icon: DollarSign, keywords: ['finance', 'banking', 'fintech'] },
  { id: 'train-transport', title: 'Transportation AI Standards', description: 'Autonomous vehicle compliance', category: 'training', href: '/courses?sector=transport', icon: Globe2, keywords: ['transport', 'autonomous', 'vehicle'] },
  { id: 'train-watchdog', title: 'Watchdog Analyst Training', description: 'Become an AI safety analyst', category: 'training', href: '/courses?framework=watchdog', icon: Eye, keywords: ['watchdog', 'analyst', 'safety'] },
  { id: 'train-ceasai-1', title: 'Measurement Credential Level 1', description: 'Foundation credential in AI safety — course completion attests training, not conformity', category: 'training', href: '/academy', icon: Award, keywords: ['ceasai', 'credential', 'level 1'] },
  { id: 'train-ceasai-2', title: 'Measurement Credential Level 2', description: 'Advanced practitioner credential — attests training, not conformity', category: 'training', href: '/academy', icon: Award, keywords: ['ceasai', 'credential', 'level 2'] },
  { id: 'train-ceasai-3', title: 'Measurement Credential Level 3', description: 'Expert credential in AI safety — attests training, not conformity', category: 'training', href: '/academy', icon: Award, keywords: ['ceasai', 'credential', 'level 3'] },
  { id: 'train-maternal', title: 'Maternal Covenant Principles', description: 'Understanding care-based AI safety', category: 'training', href: '/courses?framework=maternal', icon: Heart, keywords: ['maternal', 'covenant', 'care'] },
  { id: 'train-prosperity', title: 'Prosperity Fund Mechanics', description: 'AI wealth redistribution training', category: 'training', href: '/courses?framework=prosperity', icon: DollarSign, keywords: ['prosperity', 'ubi', 'wealth'] },
  { id: 'train-compliance', title: 'Compliance Officer Bootcamp', description: 'Comprehensive compliance training', category: 'training', href: '/courses?framework=compliance', icon: Shield, keywords: ['compliance', 'officer', 'bootcamp'] },

  // ===== COMPLIANCE FRAMEWORKS =====
  { id: 'fw-eu', title: 'EU AI Act', description: 'European Union Artificial Intelligence Act - comprehensive AI regulation', category: 'frameworks', href: '/standards#eu-ai-act', icon: Globe2, keywords: ['eu', 'european', 'act', 'regulation'], highlight: true },
  { id: 'fw-nist', title: 'NIST AI RMF', description: 'US National Institute of Standards AI Risk Management Framework', category: 'frameworks', href: '/standards#nist', icon: Shield, keywords: ['nist', 'us', 'risk', 'framework'], highlight: true },
  { id: 'fw-iso', title: 'ISO/IEC 42001', description: 'International standard for AI Management Systems', category: 'frameworks', href: '/standards#iso', icon: FileText, keywords: ['iso', 'iec', '42001', 'international'], highlight: true },
  { id: 'fw-tc260', title: 'TC260 Standards', description: 'Chinese national AI safety standards by TC260 committee', category: 'frameworks', href: '/standards#tc260', icon: Globe2, keywords: ['tc260', 'china', 'chinese', 'national'] },
  { id: 'fw-gdpr', title: 'GDPR', description: 'General Data Protection Regulation for AI systems', category: 'frameworks', href: '/standards#gdpr', icon: Shield, keywords: ['gdpr', 'privacy', 'data', 'protection'] },
  { id: 'fw-hipaa', title: 'HIPAA', description: 'Healthcare AI compliance under HIPAA', category: 'frameworks', href: '/standards#hipaa', icon: Heart, keywords: ['hipaa', 'healthcare', 'medical'] },
  { id: 'fw-ccpa', title: 'CCPA', description: 'California Consumer Privacy Act for AI', category: 'frameworks', href: '/standards#ccpa', icon: Shield, keywords: ['ccpa', 'california', 'privacy'] },
  { id: 'fw-pdca', title: 'SOAI-PDCA', description: 'CSOAI Plan-Do-Check-Act Framework', category: 'frameworks', href: '/soai-pdca', icon: Scale, keywords: ['pdca', 'soai', 'plan', 'check'] },
  { id: 'fw-ieee', title: 'IEEE Standards', description: 'IEEE AI ethics and technical standards', category: 'frameworks', href: '/standards#ieee', icon: FileText, keywords: ['ieee', 'ethics', 'technical'] },
  { id: 'fw-oecd', title: 'OECD AI Principles', description: 'OECD recommendations on AI', category: 'frameworks', href: '/standards#oecd', icon: Globe2, keywords: ['oecd', 'principles', 'international'] },

  // ===== FAQ / COMMON QUESTIONS =====
  { id: 'faq-1', title: 'What is CSOAI?', description: 'Council of AI (CSOAI) is an independent measurement instrument: we measure AI systems against the rules that govern them, sign the result (Ed25519), and publish what we cannot yet measure. Not a certifier, not an enforcer, no accreditation chain.', category: 'faq', href: '/about', icon: HelpCircle, keywords: ['what', 'csoai', 'council'] },
  { id: 'faq-2', title: 'How do I get measured?', description: 'Describe the system at /assess. We measure and sign. We do not certify.', category: 'faq', href: '/assess', icon: HelpCircle, keywords: ['certification', 'how', 'exam', 'measure'] },
  { id: 'faq-3', title: 'What is the Maternal Covenant?', description: 'A care-based paradigm for AI safety inspired by Geoffrey Hinton', category: 'faq', href: '/maternal-covenant', icon: HelpCircle, keywords: ['maternal', 'covenant', 'what'] },
  { id: 'faq-4', title: 'How does the Prosperity Fund work?', description: 'AI companies contribute 1-3% revenue to fund UBI for all', category: 'faq', href: '/prosperity', icon: HelpCircle, keywords: ['prosperity', 'fund', 'ubi'] },
  { id: 'faq-5', title: 'What is the Council\'s designed multi-provider oversight?', description: 'A multi-provider oversight system for continuous safety oversight', category: 'faq', href: '/byzantine', icon: HelpCircle, keywords: ['byzantine', '33', 'council'] },
  { id: 'faq-6', title: 'How do I register my AI system?', description: 'Use the AI Systems Registry to register and classify your AI', category: 'faq', href: '/ai-systems', icon: HelpCircle, keywords: ['register', 'ai system', 'how'] },
  { id: 'faq-7', title: 'Is verify free?', description: 'Verify is free forever. A grade is never sold. No public prices.', category: 'faq', href: '/os?lobby=assess&task=pricing-overview', icon: HelpCircle, keywords: ['pricing', 'plans', 'cost'] },
  { id: 'faq-8', title: 'How do I become a Watchdog analyst?', description: 'Complete Watchdog training and apply for analyst positions', category: 'faq', href: '/watchdog-signup', icon: HelpCircle, keywords: ['watchdog', 'analyst', 'become'] },
  { id: 'faq-9', title: 'When does the Charter take effect?', description: 'The Partnership Charter launches January 15, 2026 at 09:00 GMT', category: 'faq', href: '/charter', icon: HelpCircle, keywords: ['charter', 'effective', 'date'] },
  { id: 'faq-10', title: 'How do I join as a Founding Member?', description: 'Apply to be one of the first 100 founding members', category: 'faq', href: '/founding-members', icon: HelpCircle, keywords: ['founding', 'member', 'join'] },

  // ===== NEW PAGES =====
  { id: 'new-tracker', title: 'Global AI Regulation Tracker', description: 'Track 40+ AI governance frameworks across all nations in real-time', category: 'frameworks', href: '/global-regulations', icon: Globe2, keywords: ['global', 'regulation', 'tracker', 'nations', '40', 'countries'], highlight: true },
  { id: 'new-faq', title: 'FAQ - Frequently Asked Questions', description: 'Comprehensive answers to all questions about CSOAI and AI governance', category: 'faq', href: '/faq', icon: HelpCircle, keywords: ['faq', 'questions', 'answers', 'help'] },
  { id: 'new-glossary', title: 'AI Governance Glossary', description: '60+ terms and definitions for AI governance, compliance, and risk', category: 'faq', href: '/glossary', icon: BookOpen, keywords: ['glossary', 'terms', 'definitions', 'dictionary'] },
  { id: 'new-assessment', title: 'AI Governance Readiness Assessment', description: 'Free 5-minute assessment to evaluate your AI governance maturity', category: 'faq', href: '/assess', icon: FileCheck, keywords: ['assessment', 'readiness', 'maturity', 'quiz', 'evaluation'] },
  { id: 'new-industries', title: 'Industry Solutions', description: 'AI governance solutions tailored for finance, healthcare, government, and more', category: 'frameworks', href: '/industry-solutions', icon: Building2, keywords: ['industry', 'solutions', 'finance', 'healthcare', 'government', 'sector'] },
  { id: 'new-partners', title: 'Partners & Advisory Services', description: 'Strategic partnerships, advisory services, and partner program', category: 'faq', href: '/partners', icon: Users, keywords: ['partners', 'advisory', 'consulting', 'services', 'ecosystem'] },
  { id: 'new-casestudies', title: 'Case Studies', description: 'Real-world AI governance implementation success stories', category: 'faq', href: '/case-studies', icon: BookOpen, keywords: ['case', 'studies', 'success', 'stories', 'implementations', 'results', 'ROI'] },
  { id: 'new-trustcenter', title: 'Trust Center', description: 'Security certifications, compliance, data protection, and infrastructure details', category: 'faq', href: '/trust-center', icon: Shield, keywords: ['trust', 'security', 'compliance', 'certifications', 'ISO', 'SOC', 'GDPR', 'encryption', 'privacy'] },
  { id: 'new-compare', title: 'Why Choose CSOAI', description: 'Compare CSOAI against traditional GRC tools, AI-specific platforms, and consulting firms', category: 'faq', href: '/compare', icon: BarChart3, keywords: ['compare', 'comparison', 'versus', 'vs', 'alternative', 'why', 'choose', 'better', 'difference'] },
  { id: 'new-roi', title: 'ROI Calculator', description: 'Calculate your return on investment for AI governance implementation', category: 'faq', href: '/roi-calculator', icon: BarChart3, keywords: ['roi', 'calculator', 'return', 'investment', 'cost', 'savings', 'money', 'budget', 'estimate'] },
  { id: 'new-technology', title: 'Technology & Architecture', description: 'How the Council\'s designed multi-provider oversight and CSOAI platform architecture works', category: 'faq', href: '/technology', icon: Shield, keywords: ['technology', 'architecture', 'byzantine', 'council', 'agents', 'infrastructure', 'platform', 'technical', 'how it works'] },
  { id: 'new-integrations', title: 'Integrations & Ecosystem', description: 'Enterprise integrations and the open-source governance ecosystem', category: 'faq', href: '/integrations', icon: Shield, keywords: ['integrations', 'ecosystem', 'api', 'connect', 'platforms', 'aws', 'azure', 'slack', 'sdk'] },

];
