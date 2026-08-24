/**
 * CSOAI Homepage - Complete Professional Redesign
 * The most impressive AI safety platform homepage ever created
 * Brand: White and emerald green (csoai.org)
 */

import { Link } from "wouter";
import { openLobby } from "@/lib/lobbyLink";
import { POSITIONING } from "@/lib/positioning";
import EnterpriseTrust from "../components/EnterpriseTrust";
import RegionBanner from "../components/RegionBanner";
import ConsensusHero from "../components/ConsensusHero";
import HeroSlides from "../components/HeroSlides";
import { CANON, canonValue } from "../data/canonCounters";
import { motion } from "framer-motion";
import FaqBlock from "@/components/FaqBlock";
import SpotInfographic from "@/components/SpotInfographic";
import { LANE4 } from "@/data/lane4Content";

const L4 = LANE4["home"];
import {
  Shield,
  CheckCircle,
  ArrowRight,
  Users,
  Building2,
  Building,
  Globe2,
  Award,
  Eye,
  Heart,
  DollarSign,
  Sparkles,
  Crown,
  GraduationCap,
  FileText,
  Scale,
  Landmark,
  AlertTriangle,
  Target,
  Zap,
  ChevronDown,
  BadgeCheck,
  TrendingUp,
  Network,
  CircleDollarSign,
  Briefcase,
  UserCheck,
  BookOpen,
  Flag,
  Star,
  Quote,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { lazy, Suspense } from "react";
import AnimatedParticles from "@/components/AnimatedParticles";
import { SovereignConsole } from "@/components/SovereignConsole";
import CesiumPortalCard from "@/components/CesiumPortalCard";
// Below-the-fold sections — lazy-loaded to keep the initial landing bundle small (defers recharts + network viz off first paint).
const EcosystemDiagram = lazy(() => import("@/components/EcosystemDiagram"));
const CouncilVisualization = lazy(() => import("@/components/CouncilVisualization"));
const ComparisonTable = lazy(() => import("@/components/ComparisonTable"));
const GovernanceNetwork = lazy(() => import("@/components/GovernanceNetwork"));
const ZeroSafetySection = lazy(() => import("@/components/ZeroSafetySection"));
const Testimonials = lazy(() => import("@/components/Testimonials"));
