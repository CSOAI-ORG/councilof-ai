import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Redirect } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { SectionLoader } from "./components/PageLoader";
import {
  SovOS,
  Landing,
  CouncilConsole,
  AgUiBridge,
  AgentRunbook,
  ReceiptSpec,
  ReceiptSpecLaunch,
  OwnershipPlan,
  ArenaHarness,
  InstrumentsCatalog,
  InstrumentDetail,
  EUActChecklist,
  GpaiObligations,
  Penalties,
  NistVsEuAct,
  Iso42001VsEuAct,
  SectorAct,
  SECDisclosure,
  PersonaRouter,
  Workbench,
  AltPage,
  EuActVsGdpr,
  ActTimeline,
  UsStateAct,
  HighRiskSystems,
  ActSummary,
  AiGovernanceHub,
  AiActFaq,
  ConformityAssessment,
  JurisdictionAct,
  Dashboard,
  DashboardMeasurement,
  AISystems,
  RiskAssessment,
  AssessTool,
  Compliance,
  AgentCouncil,
  Watchdog,
  Reports,
  Settings,
  WatchdogSignup,
  TrainingV2,
  TrainingHub,
  Courses,
  MyCourses,
  CoursePlayer,
  FreeCoursePlayer,
  Certification,
  CertificationV2,
  CertificationExam,
  CertificationResults,
  MyCertificates,
  ExamReview,
  PublicHome,
  Admin,
  ApiDocs,
  ApiKeys,
  PDCACycles,
  Billing,
  PublicDashboard,
  ComplianceScorecard,
  KnowledgeBase,
  EnterpriseOnboarding,
  Pricing,
  Payg,
  PoweredBy,
  WatchdogLeaderboard,
  RegulatorDashboard,
  Blog,
  Recommendations,
  MarketingHome,
  Standards,
  Resources,
  About,
  Careers,
  NewHomeV2,
  NewHomeV3,
  MotionLab,
  RemediationPartners,
  Login,
  Signup,
  Welcome,
  FrameworkHive,
  SystemCard,
  Sov3ModelCard,
  Sov3SystemCard,
  Sov3Whitepaper,
  ResearchTransparency,
  ProvenanceFinding,
  Article50Pack,
  AiTransparency,
  ABTesting,
  AboutCEASAI,
  Accessibility,
  AnalyticsDashboard,
  CEASAITraining,
  AustraliaAIGovernanceCompliance,
  CanadaAIActCompliance,
  EUAIActCompliance,
  NISTAIRMFCompliance,
  TC260Compliance,
  UKAIBillCompliance,
  ConformityRoute,
  Contact,
  CouncilDetail,
  CouncilLicensingLanding,
  CourseDetail,
  Documentation,
  EarlyAccessLanding,
  EI3,
  EUAIActClassifier,
  EUAIActUrgency,
  RegulationFeed,
  FrameworkDetail,
  AustraliaAIGovernance,
  CanadaAIAct,
  UKAIBill,
  GlobalAISafetyInitiative,
  GovBench,
  DriftProduct,
  GovernmentLinks,
  GovernmentPortal,
  HelpCenter,
  HorusIntel,
  CertificationHowItWorks,
  ComplianceHowItWorks,
  DashboardHowItWorks,
  EnterpriseHowItWorks,
  TrainingHowItWorks,
  Landscape,
  MCPRegistry,
  MCPDetail,
  Home,
  OpenGridWorks,
  Outreach,
  RegulationRadar,
  RegionSettings,
  RegionalAnalytics,
  RegulatoryAuthority,
  RegulatoryCompliance,
  Support,
  Status,
  PublicWatchdogHub,
  WatchdogHelpProtectHumanity,
  WatchdogIncidentReport,
  Benchmarks,
  BenchmarkIndex,
  BenchmarkQuality,
  Instrument,
  RefutationLedger,
  LiveLedger,
  GSPCGapMap,
  GSPCAnchors,
  GSPCVerify,
  Methodology,
  Library,
  Honesty,
  Dispute,
  FirewallCharter,
  GspcScoreboard,
  Insurers,
  Coliseum,
  OpenSourceFramework,
  VerifiableTrust,
  EvidenceRail,
  Metrology,
  AccountabilityLoop,
  WhereTheRecordLives,
  StatuteToPredicate,
  AiActBenchmark,
  ProvBench,
  Layer0,
  Ecosystem,
  Protect,
  Ontology,
  ComplianceMonitoring,
  BulkAISystemImport,
  Jobs,
  NotificationSettings,
  MyApplications,
  VerifyCertificate,
  AgentCouncilFeature,
  PDCAFrameworkFeature,
  TrainingCertificationFeature,
  WatchdogJobsFeature,
  StudentProgress,
  Accreditation,
  SOAIPDCAFramework,
  PDCASimulator,
  CertificateVerification,
  EnterpriseDashboard,
  Enterprise,
  ProsperityFund,
  Charter,
  FoundingMembers,
  PublicWatchdog,
  GovernmentDashboard,
  MaternalCovenant,
  EUAIActGuide,
  NISTAIRMFGuide,
  ISO42001Guide,
  TC260Guide,
  WhyCSOAI,
  MembershipAgreement,
  FoundingCouncilAgreement,
  LicensingAgreement,
  PrivacyPolicy,
  TermsOfService,
  Disclaimers,
  DataProcessingAgreement,
  CookiePolicy,
  ServiceLevelAgreement,
  Council,
  GlobalRegulationTracker,
  FAQ,
  Glossary,
  ReadinessAssessment,
  IndustrySolutions,
  IndustryTemplate,
  PartnersAdvisory,
  CaseStudies,
  TrustCenter,
  Traction,
  ComparisonPage,
  ROICalculator,
  Technology,
  Integrations,
  Crosswalks,
  CharterArticle,
  ContentPage,
  OscalStudio,
  EvidenceHub,
  ModelRegistry,
  FrameworkCatalog,
  Webhooks,
  ComplianceCommandCenter,
  PolicyGenerator,
  RiskHeatmap,
  OsLauncher,
  OsEnter,
  SovereignTour,
  SovereignAcademy,
  LiveTraining,
  EstateAudit,
  EastWest,
  SovereignRegistry,
  SovereignHives,
  GovernancePulse,
  LegacyBridge,
  BondVenturi,
  EngineAxis,
  SocialOS,
  SovereignMinds,
  TryCouncil,
  Lineage,
  RelevanceMap,
  Temples,
  Playbooks,
  Dragonfly,
  MeokLaw,
  HiveModel,
  Services,
  HowItWorks,
  SectorsAtlas,
  RegionsMap,
  RegistryAll,
  SocialConnect,
  SovereignHub,
  Pressroom,
  Compare,
  Fedramp,
  Readiness,
  Agents,
  Academy,
  WatchdogMap,
  IncidentReport,
  EuActClassifier,
  Crosswalk,
  AgentGovernance,
  AgentRegistry,
  GlobalAIRegulation,
  Cra,
  Nis2,
  VulnerabilityDisclosure,
  Intel,
  WorkspacePage,
  CouncilOsRefinery,
  AccountBrief,
  Article50,
  GovernanceLayer,
  Dora,
  DemoOS,
  PocShowcase,
  CouncilSpace,
  BadgesPage,
  RealWorldMap,
  PlansPage,
  OnboardOS,
  GovGraph,
  NetworkPage,
  RegulatorAtlas,
  CyberScan,
  Competitors,
  ToolCommons,
  OpenMedia,
  StatusPage,
  Distribution,
  McpFleet,
  Gone
} from "./AppLazy";
import { AppMainRoutes } from "./AppMainRoutes";

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location]);

  return null;
}

// Global SEO title fixer — gives proper titles to pages that don't set their own,
// so no route falls back to the generic default. Pages that set their own title
// aren't listed here and are left untouched.
const ROUTE_TITLES: Record<string, string> = {
  "/pricing": "Pricing — AI governance plans & MCP tiers | CSOAI",
  "/watchdog-signup": "Become an AI Safety Watchdog Analyst | CSOAI",
  "/trust-center": "Trust Center — security, compliance & Layer 0 | CSOAI",
  "/certification": "Measurement credential — how CSOAI attestation works | CSOAI",
  "/courses": "AI governance courses & training | CSOAI",
  "/api-docs": "API & MCP documentation | CSOAI",
  "/agent-runbook": "Agent runbook — curl-first estate guide | CSOAI",
  "/receipt-spec": "RECEIPT-SPEC-0.1 — measurement card format | CSOAI",
  "/ownership": "100-move ownership plan | CSOAI",
  "/academy": "Council Academy — AI governance training | CSOAI",
  "/live-training": "Live training — verified training-outcome records | CSOAI",
  "/estate": "Estate audit — crown jewels and gaps | CSOAI",
  "/east-west": "East-West — one signed measurement, four regimes mapped | CSOAI",
  "/webhooks": "Regulatory webhooks — live framework updates | CSOAI",
  "/models": "AI model registry & scoreboard | CSOAI",
  // Top public routes — "<Plain page name> | CSOAI"
  "/": "Council of AI — governance router + measurement harness",
  "/plans": "Plans | CSOAI",
  "/gspc-arena": "GSPC Arena | CSOAI",
  "/gspc-verify": "GSPC Verify | CSOAI",
  "/gspc-gap-map": "GSPC Gap Map | CSOAI",
  "/gspc-anchors": "GSPC Anchors | CSOAI",
  "/layer0": "Layer 0 | CSOAI",
  "/methodology": "Methodology | CSOAI",
  "/ai-act-benchmark": "AI Act Benchmark — measured, not claimed | CSOAI",
  "/provbench": "ProvBench — Does provenance survive the real world? | CSOAI",
  "/refutation-ledger": "Refutation Ledger | CSOAI",
  "/dispute": "Appeals & dispute resolution | Council of AI",
  "/live-ledger": "Live Ledger | CSOAI",
  "/coliseum": "The Coliseum of AI | Council of AI",
  "/open-source": "The open-source framework | Council of AI",
  "/verifiable-trust": "The science of verifiable trust | Council of AI",
  "/evidence-rail": "The independent evidence rail | Council of AI",
  "/metrology": "The metrology apparatus | Council of AI",
  "/accountability-loop": "The accountability loop — from a public report to a complaint a regulator can open | Council of AI",
  "/where-the-record-lives": "Where the record lives — mirrored, not indestructible | Council of AI",
  "/statute-to-predicate": "From statute to predicate — how a law becomes a test | Council of AI",
  "/instrument": "The Instrument | CSOAI",
  "/benchmarks": "Benchmarks | CSOAI",
  "/benchmark-index": "Meta-benchmark index — what other benchmarks report, beside what we measure | Council of AI",
  "/benchmark-quality": "Benchmark-quality register — deterministic predicates on third-party AI benchmarks | Council of AI",
  "/provenance-finding": "Provenance Finding | CSOAI",
  "/learn": "Learn | CSOAI",
  "/article-50": "Article 50 | CSOAI",
  "/packs/eu-article-50": "EU Article 50 evidence pack — signed C2PA durability | CSOAI",
  "/verify": "Verify a signed CSOAI measurement | CSOAI",
  "/governance-layer": "Council Governance Layer | CSOAI",
  "/article-50-kit": "Article 50 Kit | CSOAI",
  "/status": "System Status | CSOAI",
  "/contact": "Contact | CSOAI",
  "/about": "About | CSOAI",
  "/mcp": "MCP Hub | CSOAI",
  "/mcp-fleet": "MCP Fleet | CSOAI",
  "/tool-commons": "Tool Commons | CSOAI",
  "/globe": "Global Regulation Globe | CSOAI",
  "/tour": "Platform Tour | CSOAI",
  "/demo": "Demo | CSOAI",
  "/assess": "AI Act Assessment | CSOAI",
  "/enterprise": "Enterprise | CSOAI",
  "/government": "Government | CSOAI",
  "/regulators": "Regulators | CSOAI",
  "/blog": "Blog | CSOAI",
};
function RouteTitle() {
  const [location] = useLocation();
  useEffect(() => {
    const t = ROUTE_TITLES[location];
    if (t) document.title = t;
  }, [location]);
  return null;
}

/**
 * Announce route changes to screen readers
 */
function RouteAnnouncer() {
  const [location] = useLocation();

  useEffect(() => {
    // Get the page title or create one from the path
    const getPageTitle = () => {
      const title = document.title;
      if (title) return title;

      // Fallback: create title from path
      const path = location.replace(/^\//, '').replace(/-/g, ' ');
      return path ? path.charAt(0).toUpperCase() + path.slice(1) : 'Home';
    };

    // Announce the new page to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;

    document.body.appendChild(announcement);

    // Delay announcement slightly to ensure it's picked up
    const timeoutId = setTimeout(() => {
      announcement.textContent = `Navigated to ${getPageTitle()}`;
    }, 100);

    // Clean up
    const cleanupId = setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(cleanupId);
      if (announcement.parentNode) {
        document.body.removeChild(announcement);
      }
    };
  }, [location]);

  return null;
}

/**
 * Widget Router - renders widget pages without Header/Footer/Auth
 */
function WidgetRouter() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <WidgetLayout>
            <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center bg-[#03110b]"><SectionLoader /></div>}><Switch>
              <Route path="/widget" component={WidgetCourses} />
              <Route path="/widget/course/:courseId" component={WidgetCoursePlayer} />
              <Route>
                <div className="text-center py-12">
                  <h2 className="text-xl font-bold">Widget page not found</h2>
                </div>
              </Route>
            </Switch></Suspense>
          </WidgetLayout>
          <Toaster position="top-right" />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function App() {
  const [location] = useLocation();

  // Widget routes - no header/footer/auth
  if (location.startsWith('/widget')) {
    return <WidgetRouter />;
  }

  // Immersive full-bleed routes — the live demo takes over the whole screen (no header/footer).
  if (location === '/sov-os' || location === '/council-os') {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Suspense fallback={<div className="grid h-[100dvh] place-items-center bg-[#04070d]"><SectionLoader /></div>}>
              <SovOS />
            </Suspense>
            <Toaster position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  if (location === '/demo' || location === '/os-demo') {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <DemoOS />
            <Toaster position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <AnalyticsProvider>
            <TooltipProvider>
              <div className="flex min-h-screen flex-col pb-12">
                {/* Skip Navigation - must be first focusable element */}
                <SkipNavigation />
                <ScrollToTop />
                <RouteTitle />
                <RouteAnnouncer />
                <Header />
                <PageSchema />
                <ArchivedBanner />
                <main
                  id="main-content"
                  className="flex-1"
                  role="main"
                  aria-label="Main content"
                  tabIndex={-1}
                >
                  <AppMainRoutes />
                </main>
                <Footer />
                <BottomEstateNav />
                <Suspense fallback={null}><CouncilConsole /></Suspense>
                <CouncilLobby />
                <DemoTour />
                <CookieConsent />
              </div>
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  },
                }}
              />
            </TooltipProvider>
          </AnalyticsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
