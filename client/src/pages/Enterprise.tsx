/**
 * Enterprise Landing Page
 * Targeting CISOs and compliance teams with comprehensive AI compliance solutions
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Zap,
  Building2,
  ArrowRight,
  AlertCircle,
  ClipboardCheck,
  Eye,
  Award,
  Globe,
  Server,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lock,
  BarChart3,
  Upload,
  Repeat,
  HelpCircle,
  BookOpen,
  Users,
  Calendar
} from 'lucide-react';
import { Link } from 'wouter';
import CouncilOsInnerNav from '@/components/os/CouncilOsInnerNav';
import EnterpriseMeasureCta from '@/components/coliseum/EnterpriseMeasureCta';
import { openLobby } from '@/lib/lobbyLink';
import { POSITIONING } from '@/lib/positioning';

// FAQ Data — measurement body, not a certification shop
const faqData = [
  {
    question: "What frameworks does CSOAI cover?",
    answer: "Eunomia routes governance instruments across EU AI Act, NIST AI RMF, ISO 42001 control language, and TC260 — plus law, benchmarks, and compute. We measure and sign what happened; we do not issue ISO certificates or act as a notified body. Crosswalks show overlap so you reuse evidence, not rebuild it."
  },
  {
    question: "How does automated assessment work?",
    answer: "Scoped measurement runs against frozen, published instruments. Results land on a signed card (~3KB, Ed25519) you can re-check without an account. Live board counts stay on GET /api/gspc. Empty cells stay empty — we never invent a score to close a deal."
  },
  {
    question: "Is my data secure?",
    answer: "Enterprise engagements use encrypted transport and agreed residency. We do not train models on your systems. Measurement evidence is yours to hold; verify stays free."
  },
  {
    question: "Can I use CSOAI