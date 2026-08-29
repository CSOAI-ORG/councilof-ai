/** Auto-split for MCP size limits — SEARCH_INDEX for GlobalSearch */
import type React from 'react';
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

export type SearchCategory =
  | 'pages'
  | 'charter'
  | 'training'
  | 'frameworks'
  | 'faq'
  | 'actions'
  | 'recent';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: SearchCategory;
  href: string;
  icon?: React.ElementType;
  keywords?: string[];
  highlight?: boolean;
}

export const SEARCH_INDEX_A: SearchResult[] = [
  // ===== PAGES (68+ routes) =====
  // Main Pages
  { id: 'home', title: 'Home', description: 'Council of AI — independent, signed measurement of AI systems', category: 'pages', href: '/', icon: Home, keywords: ['main', 'landing', 'start'] },
  { id: 'council-os', title: 'Council OS', description: 'The product workspace — board, verify, space, assess, harness in one frame', category: 'pages', href: '/os', icon: Play, keywords: ['os', 'lobby', 'workspace', 'desktop', 'ag-ui'] },
  { id: 'os-play', title: 'Play gallery', description: 'Local play surfaces inside Council OS — quests you grade in-browser', category: 'pages', href: '/os?lobby=play', icon: Play, keywords: ['play', 'quests', 'gallery', 'arena'] },
  { id: 'gspc-quests', title: 'GSPC Quests', description: 'Six frozen axis-scoped quests with the same deterministic grader used on models', category: 'pages', href: '/gspc-quests.html', icon: Award, keywords: ['quests', 'grader', 'gspc', 'playable'] },
  { id: 'compliance-training', title: 'Compliance Training World', description: 'Industry quests graded in-browser — training attests completion, never certification', category: 'pages', href: '/compliance-training-world/catalog.html', icon: GraduationCap, keywords: ['compliance', 'training', 'art 50', 'quest'] },
  { id: 'dashboard', title: 'Dashboard', description: 'Your personal AI compliance dashboard', category: 'pages', href: '/dashboard', icon: BarChart3, keywords: ['overview', 'stats', 'progress'] },
  { id: 'login', title: 'Sign In', description: 'Access your CSOAI account', category: 'pages', href: '/login', icon: Users, keywords: ['login', 'account', 'signin'] },
  { id: 'signup', title: 'Get Started', description: 'Create a new CSOAI account', category: 'pages', href: '/signup', icon: Plus, keywords: ['register', 'create account', 'join'] },

  // Charter Pages
  { id: 'charter', title: 'Partnership Charter', description: '52 Articles defining AI safety governance framework', category: 'pages', href: '/charter', icon: FileText, keywords: ['articles', 'governance', 'constitution'], highlight: true },
  { id: 'maternal-covenant', title: 'The Maternal Covenant', description: 'Care-based AI safety paradigm - Article 1', category: 'pages', href: '/maternal-covenant', icon: Heart, keywords: ['hinton', 'care', 'mother', 'protection'] },
  { id: 'prosperity', title: 'Prosperity Fund', description: 'AI wealth redistribution & Universal Basic Income', category: 'pages', href: '/prosperity', icon: DollarSign, keywords: ['ubi', 'wealth', 'income', 'redistribution'] },
  { id: 'byzantine', title: 'Measurement Council', description: 'Multi-provider AI-to-AI cross-checking — designed; measured n_eff 1.21 of 3', category: 'pages', href: '/byzantine', icon: Shield, keywords: ['council', 'agents', 'monitoring', '33'] },
  { id: 'founding-members', title: 'Founding Members', description: 'Join the first 100 founding members', category: 'pages', href: '/founding-members', icon: Users, keywords: ['members', 'founders', 'join'] },

  // Training & Certification
  { id: 'training', title: 'Training Center', description: 'AI safety and compliance training programs', category: 'pages', href: '/training', icon: GraduationCap, keywords: ['learn', 'education', 'courses'] },
  { id: 'courses', title: 'Course Catalog', description: 'Browse all available AI compliance courses', category: 'pages', href: '/courses', icon: BookOpen, keywords: ['catalog', 'browse', 'all courses'] },
  { id: 'my-courses', title: 'My Courses', description: 'Your enrolled courses and progress', category: 'pages', href: '/my-courses', icon: BookOpen, keywords: ['enrolled', 'progress', 'learning'] },
  { id: 'certification', title: 'Get measured', description: 'Measure a system against the rules that govern it — not a certificate', category: 'pages', href: '/assess', icon: Award, keywords: ['exam', 'certificate', 'credential', 'measure'] },
  { id: 'certification-exam', title: 'Get a signed card', description: 'The assess function is a keyword classifier — not a certificate', category: 'pages', href: '/assess', icon: FileCheck, keywords: ['test', 'exam', 'assessment', 'measure'] },
  { id: 'certificates', title: 'My Certificates', description: 'View your earned certificates', category: 'pages', href: '/certificates', icon: Award, keywords: ['credentials', 'badges', 'achievements'] },
  { id: 'verify-certificate', title: 'Verify Certificate', description: 'Verify authenticity of a certificate', category: 'pages', href: '/verify-certificate', icon: Shield, keywords: ['validate', 'check', 'authentic'] },
  { id: 'student-progress', title: 'My Progress', description: 'Track your learning progress and achievements', category: 'pages', href: '/dashboard/progress', icon: BarChart3, keywords: ['stats', 'achievements', 'tracker'] },

  // SOAI-PDCA Framework
  { id: 'soai-pdca', title: 'SOAI-PDCA Framework', description: 'Plan-Do-Check-Act methodology for AI safety', category: 'pages', href: '/soai-pdca', icon: Scale, keywords: ['methodology', 'pdca', 'framework'] },
  { id: 'pdca-simulator', title: 'PDCA Simulator', description: 'Interactive PDCA walkthrough and simulation', category: 'pages', href: '/pdca-simulator', icon: Play, keywords: ['interactive', 'demo', 'practice'] },
  { id: 'agent-council', title: 'Measurement Council', description: 'Multi-provider scoring — architecture designed, cross-checking measured at n_eff 1.21 of 3', category: 'pages', href: '/agent-council', icon: Brain, keywords: ['agents', 'consensus', 'monitoring'] },
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
  { id: 'pricing', title: 'How the free rail works', description: 'Verify is free. A grade is never sold. No public prices.', category: 'pages', href: '/os?lobby=assess&task=pricing-overview', icon: DollarSign, keywords: ['plans', 'cost', 'subscription', 'pricing'] },
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
  { id: 'billing', title: 'How the free rail works', description: 'Verify is free. A grade is never sold. No public prices.', category: 'pages', href: '/os?lobby=assess&task=pricing-overview', icon: DollarSign, keywords: ['payment', 'subscription', 'invoice', 'pricing'] },
  { id: 'notifications', title: 'Notification Settings', description: 'Configure notification preferences', category: 'pages', href: '/settings/notifications', icon: Settings, keywords: ['alerts', 'email', 'notifications'] },

  // Feature Pages
  { id: 'feature-council', title: 'Measurement Council', description: 'Multi-provider oversight by design — see the Refutation Ledger for what is measured', category: 'pages', href: '/features/33-agent-council', icon: Shield, keywords: ['feature', 'council', 'byzantine'] },
  { id: 'feature-pdca', title: 'PDCA Framework Feature', description: 'Explore the SOAI-PDCA methodology', category: 'pages', href: '/features/pdca-framework', icon: Scale, keywords: ['feature', 'pdca', 'methodology'] },
  { id: 'feature-training', title: 'Academy training', description: 'Training produces a signed record, not a certificate', category: 'pages', href: '/academy', icon: GraduationCap, keywords: ['feature', 'training', 'certification', 'academy'] },
];
