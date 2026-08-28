/**
 * CSOAI Government & Regulator Dashboard
 *
 * Real-time AI compliance monitoring for government bodies and regulators
 * Aligned with EU AI Act, NIST AI RMF, ISO 42001, and TC260 frameworks
 */

import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Building2,
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText,
  Scale,
  Globe2,
  Activity,
  BarChart3,
  PieChart,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Users,
  Bot,
  Zap,
  Bell,
  Filter,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  MapPin,
  Target,
  Layers,
  Gavel,
  FileSearch,
  Network,
  Handshake,
  HelpCircle,
  Mail,
  Phone,
  ArrowRight,
  Radio,
  CircleAlert,
  BookOpen,
  Database,
  Lock,
  RefreshCw,
  Landmark
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Mock data for government dashboard
const complianceFrameworks = [
  {
    id: "eu-ai-act",
    name: "EU AI Act",
    articles: 113,
    requirements: 113,
    compliantCount: 1089,
    totalSystems: 1247,
    complianceRate: 87.3,
    lastUpdated: "2026-01-13",
    region: "European Union",
    icon: Scale,
    color: "blue",
    keyAreas: ["Risk Classification", "Transparency", "Human Oversight", "Data Governance"],
  },
  {
    id: "nist-ai-rmf",
    name: "NIST AI RMF",
    articles: 72,
    requirements: 72,
    compliantCount: 1156,
    totalSystems: 1247,
    complianceRate: 92.7,
    lastUpdated: "2026-01-13",
    region: "United States",
    icon: Shield,
    color: "emerald",
    keyAreas: ["Govern", "Map", "Measure", "Manage"],
  },
  {
    id: "iso-42001",
    name: "ISO 42001",
    articles: 56,
    requirements: 56,
    compliantCount: 1198,
    totalSystems: 1247,
    complianceRate: 96.1,
    lastUpdated: "2026-01-12",
    region: "International",
    icon: Globe2,
    color: "violet",
    keyAreas: ["AI Management System", "Risk Assessment", "Documentation", "Continual Improvement"],
  },
  {
    id: "tc260",
    name: "TC260 AI Safety",
    articles: 48,
    requirements: 48,
    compliantCount: 987,
    totalSystems: 1247,
    complianceRate: 79.1,
    lastUpdated: "2026-01-13",
    region: "China",
    icon: Building2,
    color: "amber",
    keyAreas: ["Safety Assessment", "Algorithm Filing", "Data Security", "Content Review"],
  },
];

// Regional panels: no live national registry feeds exist yet, so figures are
// withheld ("\u2014") rather than invented. Structure stays so panels render.
const regionalData = [
  {
    id: "europe",
    name: "Europe",
    totalSystems: null,
    compliantSystems: null,
    complianceRate: null,
    activeIncidents: null,
    pendingInvestigations: null,
    enforcementActions: null,
    primaryFramework: "EU AI Act",
    countries: ["Germany", "France", "Netherlands", "Italy", "Spain"],
  },
  {
    id: "north-america",
    name: "North America",
    totalSystems: null,
    compliantSystems: null,
    complianceRate: null,
    activeIncidents: null,
    pendingInvestigations: null,
    enforcementActions: null,
    primaryFramework: "NIST AI RMF",
    countries: ["United States", "Canada", "Mexico"],
  },
  {
    id: "asia-pacific",
    name: "Asia-Pacific",
    totalSystems: null,
    compliantSystems: null,
    complianceRate: null,
    activeIncidents: null,
    pendingInvestigations: null,
    enforcementActions: null,
    primaryFramework: "TC260 / ISO 42001",
    countries: ["China", "Japan", "South Korea", "Australia", "Singapore"],
  },
  {
    id: "global",
    name: "Global Overview",
    totalSystems: null,
    compliantSystems: null,
    complianceRate: null,
    activeIncidents: null,
    pendingInvestigations: null,
    enforcementActions: null,
    primaryFramework: "Multi-Framework",
    countries: ["All Jurisdictions"],
  },
];

// DEMONSTRATION DATA \u2014 illustrative only. Not real systems, companies, fines,
// investigations, or regulator activities. Covered by the Preview notice strip
// at the top of this page. [Register purge 2026-08-02]
const activeIncidents = {
  pendingInvestigations: [
    {
      id: "INV-2026-0127",
      system: "Demo Scoring Model",
      company: "Demo Vendor A",
      type: "Unacceptable Risk",
      priority: "Critical",
      daysOpen: 3,
      assignedTo: "Demo regulator workspace",
      nextAction: "Council Review Scheduled",
    },
    {
      id: "INV-2026-0124",
      system: "Demo Credit Model",
      company: "Demo Vendor B",
      