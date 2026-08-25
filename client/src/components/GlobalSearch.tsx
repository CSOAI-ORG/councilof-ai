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
import { POSITIONING } from '@/lib/positioning';
import { openLobby } from '@/lib/lobbyLink';
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
import { chargeSovereign } from '@/lib/sovCharge';
import { askSovereign } from '@/lib/sovAsk';

const SOV_GW: string = ((import.meta as any).env?.VITE_KNOWLEDGE_BASE) || '/api';

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
  { id: 'home', title: 'Home', description: POSITIONING.tagline, category: 'pages', href: '/', icon: Home, keywords: ['main', 'landing', 'start', 'governance', 'harness'] },
  { id: 'council-os', title: 'Council OS', description: POSITIONING.os.blurb, category: 'pages', href: '/os', icon: Zap, keywords: ['os', 'workspace', 'dock', 'lobby', 'refinery', 'agui'], highlight: true },
  { id: 'dashboard', title: 'Dashboard', description: 'Your personal AI compliance dashboard', category: 'pages', href: '/dashboard', icon: BarChart3, keywords: ['overview', 'stats', 'progress'] },

  // Eunomia & Layer 0
  { id: 'engine-axis', title: 'Engine Axis', description: 'Bond, insurance, COBOL, east-west — financial axes 18–25', category: 'pages', href: '/engine-axis', icon: BarChart3, keywords: ['eunomia', 'finance', 'bond', 'engine', 'cobol'], highlight: true },
  { id: 'instruments', title: 'Eunomia Router', description: POSITIONING.router.blurb, category: 'pages', href: '/instruments', icon: Zap, keywords: ['mcp', 'router', 'instruments', 'eunomia', 'governance'], highlight: true },
  { id: 'venturi', title: 'Bond Venturi', description: 'COBOL batch → A2A stream — metabolic boundary (DESIGN)', category: 'pages', href: '/venturi', icon: DollarSign, keywords: ['venturi', 'cobol', 'a2a', 'bond'] },
  { id: 'legacy-bridge', title: 'Legacy Bridge', description: 'Wrap mainframe batch — do not replace', category: 'pages', href: '/legacy', icon: Building2, keywords: ['cobol', 'mainframe', 'legacy'] },
  { id: 'agent-runbook', title: 'Agent Runbook', description: 'curl-first — gspc, instruments, AG-UI, bond crossing', category: 'pages', href: '/agent-runbook', icon: Brain, keywords: ['agent', 'curl', 'api', 'runbook', 'agui'] },
  { id: 'receipt-spec', title: 'RECEIPT-SPEC-0.1', description: 'Measurement-card format — Ed25519, 3-path verify', category: 'pages', href: '/receipt-spec', icon: FileCheck, keywords: ['receipt', 'spec', 'attestation', 'schema'] },
  { id: 'ownership-plan', title: 'Ownership Plan', description: '100 moves — standards, domain, data, trust, distribution', category: 'pages', href: '/ownership', icon: FileText, keywords: ['ownership', 'strategy', 'moves'] },
  { id: 'arena-harness', title: 'Measurement Harness', description: POSITIONING.harness.blurb, category: 'pages', href: '/arena-harness', icon: Zap, keywords: ['stripe', 'openrouter', 'arena', 'harness', 'router', 'gspc'], highlight: true },
  { id: 'sov-signal', title: 'SOV Signal Index', description: 'Regulation × crosswalk × GSPC × arena sim — GET /api/signal', category: 'pages', href: '/api/signal', icon: BarChart3, keywords: ['signal', 'index', 'cross', 'divergence'] },
  { id: 'layer0', title: 'Layer 0', description: 'The signed trust layer the agent rail stands on', category: 'pages', href: '/layer0', icon: Shield, keywords: ['layer0', 'trust', 'agent economy', 'mcp'] },
  { id: 'gspc-scoreboard', title: 'GSPC Scoreboard', description: 'Live 14-slot measurement board — counts from GET /api/gspc', category: 'pages', href: '/gspc-scoreboard', icon: BarChart3, keywords: ['gspc', 'board', 'scoreboard', 'axes'] },

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
  { id: 'certification', title: 'Certification', description: 'Professional AI governance measurement credential', category: 'pages', href: '/certification', icon: Award, keywords: ['exam', 'certificate', 'credential'] },
  { id: 'certification-exam', title: 'Take Certification Exam', description: 'Start your measurement credential assessment', category: 'pages', href: '/certification/exam', icon: FileCheck, keywords: ['test', 'exam', 'assessment'] },
  { id: 'certificates', title: 'My Certificates', description: 'View your earned certificates', categPART01_PENDING_FULL_CONTENT
