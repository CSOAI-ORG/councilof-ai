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
    question: "Can I use CSOAI for ISO 42001 certification?",
    answer: "No — we are not a certification body and we do not speak for any auditor. We measure ISO-aligned controls and issue signed evidence your auditor (or insurer) can recompute. Gap analysis and documentation support that work; the certificate comes from them, not us."
  },
  {
    question: "What if measurement shows gaps?",
    answer: "You get a signed card with per-axis results, sample sizes, and intervals — then you choose who fixes. Per the firewall charter we never operate the fixer. Re-attest after remediation; the delta card is append-only history."
  },
  {
    question: "How does ongoing monitoring work?",
    answer: "Corpus-watch and scheduled re-measure keep evidence current as law and models move. Subscription tiers buy re-attest cadence and portfolio workspace — not a conformity badge that quietly goes stale."
  },
  {
    question: "What do we receive?",
    answer: "Signed measurement cards, executive summaries, technical axis detail, risk heat from measured cells only, and API/JSON export. No framework 'compliance certificates' from CSOAI — that would be a lie about our register."
  },
  {
    question: "How do we register multiple AI systems?",
    answer: "Enterprise workspace supports CSV/JSON bulk import and API. Each system gets its own measurement profile; batch re-attest keeps the portfolio honest without fusing scores."
  }
];

export default function Enterprise() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-24">
          <div className="container max-w-6xl space-y-4">
            <Skeleton className="h-8 w-48 bg-white/10" />
            <Skeleton className="h-16 w-full bg-white/10" />
            <Skeleton className="h-24 w-3/4 bg-white/10" />
          </div>
        </div>
        <div className="container py-20 space-y-12">
          <Skeleton className="h-96 w-full" />
          <div className="grid md:grid-cols-3 gap-8">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to Load Content</h2>
      