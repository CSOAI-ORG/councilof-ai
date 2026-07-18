/**
 * Global Search Component - Command Palette Style (Cmd+K / Ctrl+K)
 *
 * Features:
 * - Fuzzy search across pages, charter articles, training, frameworks, FAQ
 * - Keyboard navigation (up/down arrows, enter to select, escape to close)
 * - Recent searches history with localStorage persistence
 * - Quick actions for common tasks
 * - Categorized results with icons
 * - Framer Motion animations
 * - CSOAI brand styling (white/emerald-green)
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  FileText,
  BookOpen,
  GraduationCap,
  Shield,
  HelpCircle,
  Zap,
  Clock,
  ArrowRight,
  Command,
  CornerDownLeft,
  ChevronUp,
  ChevronDown,
  Home,
  Users,
  Building2,
  Settings,
  Award,
  BarChart3,
  Globe2,
  Heart,
  Scale,
  Brain,
  DollarSign,
  Gavel,
  AlertTriangle,
  Play,
  Plus,
  Eye,
  FileCheck,
  Briefcase,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Types
interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: SearchCategory;
  href: string;
  icon?: React.ElementType;
  keywords?: string[];
  highlight?: boolean;
}

type SearchCategory =
  | 'pages'
  | 'charter'
  | 'training'
  | 'frameworks'
  | 'faq'
  | 'actions'
  | 'recent';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
}

// Search Index Data
const SEARCH_INDEX: SearchResult[] = [
  // ===== PAGES (68+ routes) =====
  // Main Pages
  { id: 'home', title: 'Home', description: 'CSOAI homepage - AI safety partnership platform', category: 'pages', href: '/', icon: Home, keywords: ['main', 'landing', 'start'] },
  { id: 'dashboard', title: 'Dashboard', description: 'Your personal AI compliance dashboard', category: 'pages', href: '/dashboard', icon: BarChart3, keywords: ['overview', 'stats', 'progress'] },
  { id: 'login', title: 'Sign In', description: 'Access your CSOAI account', category: 'pages', href: '/login', icon: Users, keywords: ['login', 'account', 'signin'] },
  { id: 'signup', title: 'Get Started', description: 'Create a new CSOAI account', category: 'pages', href: '/signup', icon: Plus, keywords: ['register', 'create account', 'join'] },

  // Charter Pages
  { id: 'charter', title: 'Partnership Charter', description: '52 Articles defining AI safety governance framework', category: 'pages', href: '/charter', icon: FileText, keywords: ['articles', 'governance', 'constitution'], highlight: true },
  { id: 'maternal-covenant', title: 'The Maternal Covenant', description: 'Care-based AI safety paradigm - Article 1', category: 'pages', href: '/maternal-covenant', icon: Heart, keywords: ['hinton', 'care', 'mother', 'protection'] },
  { id: 'prosperity', title: 'Prosperity Fund', description: 'AI wealth redistribution & Universal Basic Income', category: 'pages', href: '/prosperity', icon: DollarSign, keywords: ['ubi', 'wealth', 'income', 'redistribution'] },
  { id: 'byzantine', title: 'Byzantine Council', description: '33-agent AI-to-AI monitoring system', category: 'pages', href: '/byzantine', icon: Shield, keywords: ['council', 'agents', 'monitoring', '33'] },
  { id: 'founding-members', title: 'Founding Members', description: 'Join the first 100 founding members', category: 'pages', href: '/founding-members', icon: Users, keywords: ['members', 'founders', 'join'] },

  // Training & Certification
  { id: 'training', title: 'Training Center', description: 'AI safety and compliance training programs', category: 'pages', href: '/training', icon: GraduationCap, keywords: ['learn', 'education', 'courses'] },
  { id: 'courses', title: 'Course Catalog', description: 'Browse all available AI compliance courses', category: 'pages', href: '/courses', icon: BookOpen, keywords: ['catalog', 'browse', 'all courses'] },
  { id: 'my-courses', title: 'My Courses', description: 'Your enrolled courses and progress', category: 'pages', href: '/my-courses', icon: BookOpen, keywords: ['enrolled', 'progress', 'learning'] },
  { id: 'certification', title: 'Certification', description: 'CEASAI professional certification program', category: 'pages', href: '/certification', icon: Award, keywords: ['exam', 'certificate', 'credential'] },
  { id: 'certification-exam', title: 'Take Certification Exam', description: 'Start your CEASAI certification exam', category: 'pages', href: '/certification/exam', icon: FileCheck, keywords: ['test', 'exam', 'assessment'] },
  { id: 'certificates', title: 'My Certificates', description: 'View your earned certificates', category: 'pages', href: '/certificates', icon: Award, keywords: ['credentials', 'badges', 'achievements'] },
  { id: 'verify-certificate', title: 'Verify Certificate', description: 'Verify authenticity of a certificate', category: 'pages', href: '/verify-certificate', icon: Shield, keywords: ['validate', 'check', 'authentic'] },
  { id: 'student-progress', title: 'My Progress', description: 'Track your learning progress and achievements', category: 'pages', href: '/dashboard/progress', icon: BarChart3, keywords: ['stats', 'achievements', 'tracker'] },

  // SOAI-PDCA Framework
  { id: 'soai-pdca', title: 'SOAI-PDCA Framework', description: 'Plan-Do-Check-Act methodology for AI safety', category: 'pages', href: '/soai-pdca', icon: Scale, keywords: ['methodology', 'pdca', 'framework'] },
  { id: 'pdca-simulator', title: 'PDCA Simulator', description: 'Interactive PDCA walkthrough and simulation', category: 'pages', href: '/pdca-simulator', icon: Play, keywords: ['interactive', 'demo', 'practice'] },
  { id: 'agent-council', title: '33-Agent Council', description: 'Byzantine consensus AI monitoring system', category: 'pages', href: '/agent-council', icon: Brain, keywords: ['agents', 'consensus', 'monitoring'] },
  { id: 'pdca-cycles', title: 'PDCA Cycles', description: 'Manage your PDCA improvement cycles', category: 'pages', href: '/pdca', icon: Scale, keywords: ['cycles', 'improvement', 'management'] },

  // Watchdog & Jobs
  { id: 'public-watchdog', title: 'Public Watchdog', description: 'Crowdsourced AI incident monitoring', category: 'pages', href: '/public-watchdog', icon: Eye, keywords: ['incidents', 'monitoring', 'crowdsourced'] },
  { id: 'watchdog', title: 'Report Incident', description: 'Submit an AI safety incident report', category: 'pages', href: '/watchdog', icon: AlertTriangle, keywords: ['report', 'incident', 'safety'] },
  { id: 'jobs', title: 'Analyst Jobs', description: 'Browse AI safety analyst job opportunities', category: 'pages', href: '/jobs', icon: Briefcase, keywords: ['careers', 'work', 'opportunities'] },
  { id: 'my-applications', title: 'My Applications', description: 'Track your job applications', category: 'pages', href: '/my-applications', icon: FileText, keywords: ['applications', 'status', 'tracking'] },
  { id: 'leaderboard', title: 'Watchdog Leaderboard', description: 'Top performing AI safety analysts', category: 'pages', href: '/leaderboard', icon: Award, keywords: ['ranking', 'top', 'performers'] },

  // Enterprise
  { id: 'enterprise', title: 'Enterprise Solutions', description: 'AI compliance solutions for organizations', category: 'pages', href: '/enterprise', icon: Building2, keywords: ['business', 'organization', 'corporate'] },
  { id: 'enterprise-dashboard', title: 'Enterprise Dashboard', description: 'CISO compliance hub for enterprises', category: 'pages', href: '/enterprise-dashboard', icon: BarChart3, keywords: ['ciso', 'compliance', 'hub'] },
  { id: 'pricing', title: 'Pricing', description: 'Plans and pricing for CSOAI services', category: 'pages', href: '/pricing', icon: DollarSign, keywords: ['plans', 'cost', 'subscription'] },
  { id: 'enterprise-onboarding', title: 'Enterprise Onboarding', description: 'Get started with enterprise features', category: 'pages', href: '/enterprise-onboarding', icon: Zap, keywords: ['setup', 'onboard', 'start'] },

  // Government & Regulator
  { id: 'government', title: 'Government Dashboard', description: 'Real-time AI compliance monitoring for regulators', category: 'pages', href: '/government', icon: Gavel, keywords: ['regulator', 'compliance', 'monitoring'] },
  { id: 'regulator', title: 'Regulator Dashboard', description: 'AI oversight tools for government agencies', category: 'pages', href: '/regulator', icon: Building2, keywords: ['agency', 'oversight', 'tools'] },
  { id: 'transparency', title: 'Transparency Portal', description: 'Public transparency and accountability data', category: 'pages', href: '/transparency', icon: Eye, keywords: ['public', 'data', 'accountability'] },

  // AI Systems & Compliance
  { id: 'ai-systems', title: 'AI Systems Registry', description: 'Register and manage your AI systems', category: 'pages', href: '/ai-systems', icon: Brain, keywords: ['register', 'inventory', 'manage'] },
  { id: 'risk-assessment', title: 'Risk Assessment', description: 'Assess AI system risk levels', category: 'pages', href: '/risk-assessment', icon: AlertTriangle, keywords: ['evaluate', 'risk', 'assessment'] },
  { id: 'compliance', title: 'Compliance Dashboard', description: 'Monitor AI compliance status', category: 'pages', href: '/compliance', icon: Shield, keywords: ['status', 'compliance', 'monitor'] },
  { id: 'compliance-monitoring', title: 'Compliance Monitoring', description: 'Real-time compliance tracking', category: 'pages', href: '/compliance-monitoring', icon: Eye, keywords: ['realtime', 'tracking', 'alerts'] },
  { id: 'bulk-import', title: 'Bulk AI System Import', description: 'Import multiple AI systems at once', category: 'pages', href: '/bulk-import', icon: Plus, keywords: ['import', 'batch', 'multiple'] },
  { id: 'recommendations', title: 'Recommendations', description: 'AI-powered compliance recommendations', category: 'pages', href: '/recommendations', icon: Zap, keywords: ['suggestions', 'guidance', 'advice'] },

  // Resources & Documentation
  { id: 'about', title: 'About CSOAI', description: 'Our mission, vision, and story', category: 'pages', href: '/about', icon: FileText, keywords: ['mission', 'about us', 'story'] },
  { id: 'accreditation', title: 'Accreditation', description: 'Official recognition and accreditation', category: 'pages', href: '/accreditation', icon: Award, keywords: ['official', 'recognition', 'certified'] },
  { id: 'standards', title: 'Standards', description: 'AI safety standards and frameworks we support', category: 'pages', href: '/standards', icon: FileText, keywords: ['frameworks', 'regulations', 'standards'] },
  { id: 'resources', title: 'Resources', description: 'Documentation, guides, and resources', category: 'pages', href: '/resources', icon: BookOpen, keywords: ['docs', 'guides', 'help'] },
  { id: 'knowledge-base', title: 'Knowledge Base', description: 'RLMAI learning system and documentation', category: 'pages', href: '/knowledge-base', icon: Brain, keywords: ['wiki', 'learn', 'documentation'] },
  { id: 'blog', title: 'Blog', description: 'News, insights, and updates', category: 'pages', href: '/blog', icon: FileText, keywords: ['news', 'articles', 'updates'] },
  { id: 'api-docs', title: 'API Documentation', description: 'Developer API reference and guides', category: 'pages', href: '/api-docs', icon: FileText, keywords: ['api', 'developer', 'reference'] },
  { id: 'api-keys', title: 'API Keys', description: 'Manage your API keys', category: 'pages', href: '/api-keys', icon: Settings, keywords: ['keys', 'tokens', 'api'] },

  // Settings & Account
  { id: 'settings', title: 'Settings', description: 'Account and application settings', category: 'pages', href: '/settings', icon: Settings, keywords: ['preferences', 'account', 'config'] },
  { id: 'billing', title: 'Billing', description: 'Manage subscription and payments', category: 'pages', href: '/settings/billing', icon: DollarSign, keywords: ['payment', 'subscription', 'invoice'] },
  { id: 'notifications', title: 'Notification Settings', description: 'Configure notification preferences', category: 'pages', href: '/settings/notifications', icon: Settings, keywords: ['alerts', 'email', 'notifications'] },

  // Feature Pages
  { id: 'feature-council', title: '33-Agent Council Feature', description: 'Learn about the Byzantine consensus system', category: 'pages', href: '/features/33-agent-council', icon: Shield, keywords: ['feature', 'council', 'byzantine'] },
  { id: 'feature-pdca', title: 'PDCA Framework Feature', description: 'Explore the SOAI-PDCA methodology', category: 'pages', href: '/features/pdca-framework', icon: Scale, keywords: ['feature', 'pdca', 'methodology'] },
  { id: 'feature-training', title: 'Training & Certification Feature', description: 'Discover our training programs', category: 'pages', href: '/features/training-certification', icon: GraduationCap, keywords: ['feature', 'training', 'certification'] },
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
  { id: 'art-3', title: 'Article 3: Byzantine Council Oversight', description: '33-agent AI-to-AI monitoring architecture', category: 'charter', href: '/charter#part-i', icon: Users, keywords: ['byzantine', 'council', 'oversight', '33 agents'] },
  { id: 'art-4', title: 'Article 4: Value Uncertainty Principles', description: 'Handling moral and ethical uncertainty in AI', category: 'charter', href: '/charter#part-i', icon: Scale, keywords: ['value', 'uncertainty', 'ethics', 'moral'] },
  { id: 'art-5', title: 'Article 5: Constitutional AI Principles', description: 'Core values embedded in AI systems', category: 'charter', href: '/charter#part-i', icon: FileText, keywords: ['constitutional', 'principles', 'values'] },
  { id: 'art-6', title: 'Article 6: Consciousness Preparedness', description: 'Protocols for potential AI consciousness', category: 'charter', href: '/charter#part-i', icon: Brain, keywords: ['consciousness', 'sentience', 'awareness'] },
  { id: 'art-7', title: 'Article 7: Cooperative AI Framework', description: 'Multi-agent coordination principles', category: 'charter', href: '/charter#part-i', icon: Users, keywords: ['cooperative', 'multi-agent', 'coordination'] },
  { id: 'art-8', title: 'Article 8: The Prosperity Covenant', description: 'Economic redistribution and UBI framework', category: 'charter', href: '/charter#part-i', icon: DollarSign, keywords: ['prosperity', 'ubi', 'redistribution'], highlight: true },

  // Part II: Governance Structure (Articles 9-18)
  { id: 'art-9', title: 'Article 9: Founding Principles & Definitions', description: 'Core terminology and interpretive principles', category: 'charter', href: '/charter#part-ii', icon: FileText, keywords: ['definitions', 'founding', 'terminology'] },
  { id: 'art-10', title: 'Article 10: Licensing Framework', description: 'Tiered licensing system and requirements', category: 'charter', href: '/charter#part-ii', icon: Award, keywords: ['licensing', 'tiers', 'requirements'] },
  { id: 'art-11', title: 'Article 11: Byzantine Council Specifications', description: 'Technical architecture of AI oversight', category: 'charter', href: '/charter#part-ii', icon: Shield, keywords: ['byzantine', 'specifications', 'technical'] },
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
  { id: 'art-51', title: 'Article 51: Legacy & Archives', description: 'Historical documentation', category: 'charter', href: '/charter#part-vi', icon: BookOpen, keywords: ['legacy', 'archives', 'history'] },
  { id: 'art-52', title: 'Article 52: Effective Date & Implementation', description: 'January 15, 2026, 09:00 GMT', category: 'charter', href: '/charter#part-vi', icon: FileText, keywords: ['effective', 'date', 'implementation'], highlight: true },

  // ===== TRAINING MODULES (24+ modules) =====
  { id: 'train-eu-fund', title: 'EU AI Act Fundamentals', description: 'Introduction to European AI regulation', category: 'training', href: '/courses?framework=eu', icon: GraduationCap, keywords: ['eu', 'european', 'fundamentals'] },
  { id: 'train-eu-adv', title: 'EU AI Act Advanced', description: 'Deep dive into EU AI Act compliance', category: 'training', href: '/courses?framework=eu&level=advanced', icon: GraduationCap, keywords: ['eu', 'advanced', 'compliance'] },
  { id: 'train-eu-spec', title: 'EU AI Act Specialist', description: 'Expert-level EU AI Act certification', category: 'training', href: '/courses?framework=eu&level=specialist', icon: Award, keywords: ['eu', 'specialist', 'expert'] },
  { id: 'train-nist-fund', title: 'NIST AI RMF Fundamentals', description: 'Introduction to US AI Risk Management', category: 'training', href: '/courses?framework=nist', icon: GraduationCap, keywords: ['nist', 'us', 'risk'] },
  { id: 'train-nist-adv', title: 'NIST AI RMF Advanced', description: 'Advanced NIST framework implementation', category: 'training', href: '/courses?framework=nist&level=advanced', icon: GraduationCap, keywords: ['nist', 'advanced', 'implementation'] },
  { id: 'train-nist-spec', title: 'NIST AI RMF Specialist', description: 'Expert NIST certification track', category: 'training', href: '/courses?framework=nist&level=specialist', icon: Award, keywords: ['nist', 'specialist', 'certification'] },
  { id: 'train-iso-fund', title: 'ISO 42001 Fundamentals', description: 'Introduction to AI Management Systems', category: 'training', href: '/courses?framework=iso', icon: GraduationCap, keywords: ['iso', '42001', 'management'] },
  { id: 'train-iso-adv', title: 'ISO 42001 Advanced', description: 'Advanced AI management system implementation', category: 'training', href: '/courses?framework=iso&level=advanced', icon: GraduationCap, keywords: ['iso', 'advanced', 'isms'] },
  { id: 'train-iso-spec', title: 'ISO 42001 Lead Implementer', description: 'Lead implementer certification', category: 'training', href: '/courses?framework=iso&level=specialist', icon: Award, keywords: ['iso', 'lead', 'implementer'] },
  { id: 'train-tc260', title: 'TC260 Chinese Standards', description: 'Chinese AI safety standards training', category: 'training', href: '/courses?framework=tc260', icon: GraduationCap, keywords: ['tc260', 'china', 'chinese'] },
  { id: 'train-pdca', title: 'SOAI-PDCA Methodology', description: 'Master the Plan-Do-Check-Act framework', category: 'training', href: '/courses?framework=pdca', icon: Scale, keywords: ['pdca', 'methodology', 'soai'] },
  { id: 'train-byzantine', title: 'Byzantine Council Training', description: 'Understanding multi-agent AI monitoring', category: 'training', href: '/courses?framework=byzantine', icon: Shield, keywords: ['byzantine', 'council', 'monitoring'] },
  { id: 'train-risk', title: 'AI Risk Assessment', description: 'Learn to assess AI system risks', category: 'training', href: '/courses?framework=risk', icon: AlertTriangle, keywords: ['risk', 'assessment', 'evaluation'] },
  { id: 'train-ethics', title: 'AI Ethics & Governance', description: 'Ethical considerations in AI development', category: 'training', href: '/courses?framework=ethics', icon: Scale, keywords: ['ethics', 'governance', 'moral'] },
  { id: 'train-healthcare', title: 'Healthcare AI Compliance', description: 'Medical AI regulatory requirements', category: 'training', href: '/courses?sector=healthcare', icon: Heart, keywords: ['healthcare', 'medical', 'compliance'] },
  { id: 'train-finance', title: 'Financial AI Compliance', description: 'Banking and fintech AI regulations', category: 'training', href: '/courses?sector=finance', icon: DollarSign, keywords: ['finance', 'banking', 'fintech'] },
  { id: 'train-transport', title: 'Transportation AI Standards', description: 'Autonomous vehicle compliance', category: 'training', href: '/courses?sector=transport', icon: Globe2, keywords: ['transport', 'autonomous', 'vehicle'] },
  { id: 'train-watchdog', title: 'Watchdog Analyst Training', description: 'Become an AI safety analyst', category: 'training', href: '/courses?framework=watchdog', icon: Eye, keywords: ['watchdog', 'analyst', 'safety'] },
  { id: 'train-ceasai-1', title: 'CEASAI Level 1', description: 'Foundation certification in AI safety', category: 'training', href: '/certification', icon: Award, keywords: ['ceasai', 'certification', 'level 1'] },
  { id: 'train-ceasai-2', title: 'CEASAI Level 2', description: 'Advanced practitioner certification', category: 'training', href: '/certification', icon: Award, keywords: ['ceasai', 'certification', 'level 2'] },
  { id: 'train-ceasai-3', title: 'CEASAI Level 3', description: 'Expert certification in AI safety', category: 'training', href: '/certification', icon: Award, keywords: ['ceasai', 'certification', 'level 3'] },
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
  { id: 'faq-1', title: 'What is CSOAI?', description: 'CSOAI is the Council for Safe, Open AI - a partnership framework for AI safety', category: 'faq', href: '/about', icon: HelpCircle, keywords: ['what', 'csoai', 'council'] },
  { id: 'faq-2', title: 'How do I get certified?', description: 'Complete training courses and pass the CEASAI certification exam', category: 'faq', href: '/certification', icon: HelpCircle, keywords: ['certification', 'how', 'exam'] },
  { id: 'faq-3', title: 'What is the Maternal Covenant?', description: 'A care-based paradigm for AI safety inspired by Geoffrey Hinton', category: 'faq', href: '/maternal-covenant', icon: HelpCircle, keywords: ['maternal', 'covenant', 'what'] },
  { id: 'faq-4', title: 'How does the Prosperity Fund work?', description: 'AI companies contribute 1-3% revenue to fund UBI for all', category: 'faq', href: '/prosperity', icon: HelpCircle, keywords: ['prosperity', 'fund', 'ubi'] },
  { id: 'faq-5', title: 'What is the 33-Agent Byzantine Council?', description: 'An AI-to-AI monitoring system for continuous safety oversight', category: 'faq', href: '/byzantine', icon: HelpCircle, keywords: ['byzantine', '33', 'council'] },
  { id: 'faq-6', title: 'How do I register my AI system?', description: 'Use the AI Systems Registry to register and classify your AI', category: 'faq', href: '/ai-systems', icon: HelpCircle, keywords: ['register', 'ai system', 'how'] },
  { id: 'faq-7', title: 'What are the pricing plans?', description: 'Individual, Team, and Enterprise plans available', category: 'faq', href: '/pricing', icon: HelpCircle, keywords: ['pricing', 'plans', 'cost'] },
  { id: 'faq-8', title: 'How do I become a Watchdog analyst?', description: 'Complete Watchdog training and apply for analyst positions', category: 'faq', href: '/watchdog-signup', icon: HelpCircle, keywords: ['watchdog', 'analyst', 'become'] },
  { id: 'faq-9', title: 'When does the Charter take effect?', description: 'The Partnership Charter launches January 15, 2026 at 09:00 GMT', category: 'faq', href: '/charter', icon: HelpCircle, keywords: ['charter', 'effective', 'date'] },
  { id: 'faq-10', title: 'How do I join as a Founding Member?', description: 'Apply to be one of the first 100 founding members', category: 'faq', href: '/founding-members', icon: HelpCircle, keywords: ['founding', 'member', 'join'] },
];

// Quick Actions
const QUICK_ACTIONS: QuickAction[] = [
  { id: 'action-start-training', title: 'Start Training', description: 'Begin your AI safety certification journey', href: '/courses', icon: GraduationCap, color: 'bg-emerald-500' },
  { id: 'action-register-ai', title: 'Register AI System', description: 'Add a new AI system to the registry', href: '/ai-systems', icon: Plus, color: 'bg-blue-500' },
  { id: 'action-take-exam', title: 'Take Certification Exam', description: 'Start your CEASAI certification exam', href: '/certification/exam', icon: FileCheck, color: 'bg-purple-500' },
  { id: 'action-report-incident', title: 'Report AI Incident', description: 'Submit a safety incident report', href: '/watchdog', icon: AlertTriangle, color: 'bg-red-500' },
  { id: 'action-apply-job', title: 'Browse Analyst Jobs', description: 'Find Watchdog analyst opportunities', href: '/jobs', icon: Briefcase, color: 'bg-amber-500' },
  { id: 'action-view-charter', title: 'View Partnership Charter', description: 'Read the 52 Articles', href: '/charter', icon: FileText, color: 'bg-slate-700' },
];

// Category configuration
const CATEGORY_CONFIG: Record<SearchCategory, { label: string; icon: React.ElementType; color: string }> = {
  pages: { label: 'Pages', icon: FileText, color: 'text-blue-600 bg-blue-100' },
  charter: { label: 'Charter Articles', icon: FileText, color: 'text-rose-600 bg-rose-100' },
  training: { label: 'Training', icon: GraduationCap, color: 'text-emerald-600 bg-emerald-100' },
  frameworks: { label: 'Frameworks', icon: Shield, color: 'text-purple-600 bg-purple-100' },
  faq: { label: 'FAQ', icon: HelpCircle, color: 'text-amber-600 bg-amber-100' },
  actions: { label: 'Quick Actions', icon: Zap, color: 'text-green-600 bg-green-100' },
  recent: { label: 'Recent', icon: Clock, color: 'text-gray-600 bg-gray-100' },
};

// Fuzzy search function
function fuzzyMatch(text: string, query: string): boolean {
  const searchText = text.toLowerCase();
  const searchQuery = query.toLowerCase();

  // Direct substring match
  if (searchText.includes(searchQuery)) return true;

  // Fuzzy match - all characters must appear in order
  let queryIndex = 0;
  for (let i = 0; i < searchText.length && queryIndex < searchQuery.length; i++) {
    if (searchText[i] === searchQuery[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === searchQuery.length;
}

// Score results for ranking
function scoreResult(result: SearchResult, query: string): number {
  const q = query.toLowerCase();
  const title = result.title.toLowerCase();
  const desc = result.description.toLowerCase();

  let score = 0;

  // Exact title match
  if (title === q) score += 100;
  // Title starts with query
  else if (title.startsWith(q)) score += 80;
  // Title contains query as word
  else if (title.includes(q)) score += 60;
  // Description contains query
  else if (desc.includes(q)) score += 40;
  // Keywords match
  if (result.keywords?.some(k => k.toLowerCase().includes(q))) score += 30;
  // Highlighted items get bonus
  if (result.highlight) score += 20;

  return score;
}

// Recent searches storage key
const RECENT_SEARCHES_KEY = 'csoai-recent-searches';
const MAX_RECENT_SEARCHES = 5;

interface GlobalSearchProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GlobalSearch({ open: controlledOpen, onOpenChange }: GlobalSearchProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Use controlled or internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Load recent searches on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== searchQuery.toLowerCase());
      const updated = [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save recent searches', e);
      }
      return updated;
    });
  }, []);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filtered and scored results
  const results = useMemo(() => {
    if (!query.trim()) {
      // Show quick actions and recent searches when no query
      const recentResults: SearchResult[] = recentSearches.map((search, idx) => ({
        id: `recent-${idx}`,
        title: search,
        description: 'Recent search',
        category: 'recent' as const,
        href: '#',
        icon: Clock,
      }));

      const actionResults: SearchResult[] = QUICK_ACTIONS.map(action => ({
        id: action.id,
        title: action.title,
        description: action.description,
        category: 'actions' as const,
        href: action.href,
        icon: action.icon,
      }));

      return [...recentResults, ...actionResults];
    }

    // Filter and score results
    const matched = SEARCH_INDEX.filter(result => {
      const searchableText = `${result.title} ${result.description} ${result.keywords?.join(' ') || ''}`;
      return fuzzyMatch(searchableText, query);
    });

    // Sort by score
    return matched
      .map(result => ({ ...result, score: scoreResult(result, query) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }, [query, recentSearches]);

  // Group results by category
  const groupedResults = useMemo(() => {
    const groups: Record<SearchCategory, SearchResult[]> = {
      recent: [],
      actions: [],
      pages: [],
      charter: [],
      training: [],
      frameworks: [],
      faq: [],
    };

    results.forEach(result => {
      groups[result.category].push(result);
    });

    return Object.entries(groups)
      .filter(([, items]) => items.length > 0) as [SearchCategory, SearchResult[]][];
  }, [results]);

  // Flat list for keyboard navigation
  const flatResults = useMemo(() => results, [results]);

  // Handle selection
  const handleSelect = useCallback((result: SearchResult) => {
    if (result.category === 'recent') {
      // Use recent search as new query
      setQuery(result.title);
      return;
    }

    saveRecentSearch(query);
    setOpen(false);
    setLocation(result.href);
  }, [query, saveRecentSearch, setOpen, setLocation]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatResults[selectedIndex]) {
          handleSelect(flatResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  }, [flatResults, selectedIndex, handleSelect, setOpen]);

  // Scroll selected item into view
  useEffect(() => {
    const container = resultsRef.current;
    if (!container) return;

    const selectedElement = container.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-2xl p-0 gap-0 overflow-hidden bg-white"
        aria-describedby="global-search-description"
      >
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <span id="global-search-description" className="sr-only">
          Search across pages, charter articles, training modules, and more
        </span>

        {/* Search Input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, articles, training, frameworks..."
            className="flex-1 text-base outline-none bg-transparent placeholder:text-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <div className="ml-3 flex items-center gap-1 text-xs text-gray-400 border-l pl-3">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">esc</kbd>
            <span>to close</span>
          </div>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto p-2">
          <AnimatePresence mode="wait">
            {flatResults.length === 0 && query ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="py-12 text-center"
              >
                <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No results found for "{query}"</p>
                <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {groupedResults.map(([category, items]) => {
                  const config = CATEGORY_CONFIG[category];
                  const CategoryIcon = config.icon;

                  return (
                    <div key={category} className="mb-4">
                      <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        <CategoryIcon className="h-3.5 w-3.5" />
                        {config.label}
                      </div>

                      {items.map((result) => {
                        const itemIndex = flatResults.findIndex(r => r.id === result.id);
                        const isSelected = itemIndex === selectedIndex;
                        const Icon = result.icon || config.icon;

                        return (
                          <motion.button
                            key={result.id}
                            data-index={itemIndex}
                            onClick={() => handleSelect(result)}
                            onMouseEnter={() => setSelectedIndex(itemIndex)}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15 }}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                              isSelected ? "bg-emerald-50 text-emerald-900" : "hover:bg-gray-50",
                              result.highlight && "border border-emerald-200"
                            )}
                          >
                            <div className={cn(
                              "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                              isSelected ? "bg-emerald-100 text-emerald-600" : config.color
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-medium truncate",
                                  result.highlight && "text-emerald-700"
                                )}>
                                  {result.title}
                                </span>
                                {result.highlight && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                                    Featured
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {result.description}
                              </p>
                            </div>

                            {isSelected && (
                              <div className="flex-shrink-0 flex items-center gap-1 text-emerald-600">
                                <CornerDownLeft className="h-4 w-4" />
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border rounded shadow-sm font-mono">
                <ChevronUp className="h-3 w-3" />
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white border rounded shadow-sm font-mono">
                <ChevronDown className="h-3 w-3" />
              </kbd>
              <span className="ml-1">Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border rounded shadow-sm font-mono">
                <CornerDownLeft className="h-3 w-3" />
              </kbd>
              <span className="ml-1">Select</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Powered by</span>
            <span className="font-medium text-emerald-600">CSOAI</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Search trigger button component for Header
export function GlobalSearchTrigger({ onClick }: { onClick?: () => void }) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toLowerCase().includes('mac'));
  }, []);

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 transition-colors"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-white rounded border text-xs text-gray-400 font-mono">
        {isMac ? <Command className="h-3 w-3" /> : 'Ctrl'}
        <span>K</span>
      </kbd>
    </button>
  );
}

export default GlobalSearch;
