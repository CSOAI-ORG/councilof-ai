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
