import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Redirect } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { SectionLoader } from "./components/PageLoader";
const SovOS = lazy(() => import("./pages/SovOS"));
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
// Widget imports
import WidgetLayout from "./components/widget/WidgetLayout";
import WidgetCourses from "./components/widget/WidgetCourses";
import WidgetCoursePlayer from "./components/widget/WidgetCoursePlayer";
import { SkipNavigation } from "./components/SkipNavigation";
// Home removed - using NewHomeV2 instead
const Landing = lazy(() => import("./pages/Landing"));
const EUActChecklist = lazy(() => import("./pages/EUActChecklist"));
const GpaiObligations = lazy(() => import("./pages/GpaiObligations"));
const Penalties = lazy(() => import("./pages/Penalties"));
const NistVsEuAct = lazy(() => import("./pages/NistVsEuAct"));
const Iso42001VsEuAct = lazy(() => import("./pages/Iso42001VsEuAct"));
const SectorAct = lazy(() => import("./pages/SectorAct"));
const SECDisclosure = lazy(() => import("./pages/SECDisclosure"));
const PersonaRouter = lazy(() => import("./pages/PersonaRouter"));
const Workbench = lazy(() => import("./pages/Workbench"));
const AltPage = lazy(() => import("./pages/AltPage"));
const EuActVsGdpr = lazy(() => import("./pages/EuActVsGdpr"));
const ActTimeline = lazy(() => import("./pages/ActTimeline"));
const UsStateAct = lazy(() => import("./pages/UsStateAct"));
const HighRiskSystems = lazy(() => import("./pages/HighRiskSystems"));
const ActSummary = lazy(() => import("./pages/ActSummary"));
const AiGovernanceHub = lazy(() => import("./pages/AiGovernanceHub"));
const AiActFaq = lazy(() => import("./pages/AiActFaq"));
const ConformityAssessment = lazy(() => import("./pages/ConformityAssessment"));
const JurisdictionAct = lazy(() => import("./pages/JurisdictionAct"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AISystems = lazy(() => import("./pages/AISystems"));
const RiskAssessment = lazy(() => import("./pages/RiskAssessment"));
const AssessTool = lazy(() => import("./pages/AssessTool"));
const Compliance = lazy(() => import("./pages/Compliance"));
const AgentCouncil = lazy(() => import("./pages/AgentCouncil"));
const Watchdog = lazy(() => import("./pages/Watchdog"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const WatchdogSignup = lazy(() => import("./pages/WatchdogSignup"));
// Training removed - using Training-v2 instead
const TrainingV2 = lazy(() => import("./pages/Training-v2"));
const TrainingHub = lazy(() => import("./pages/TrainingHub"));
const Courses = lazy(() => import("./pages/Courses"));
const MyCourses = lazy(() => import("./pages/MyCourses"));
const CoursePlayer = lazy(() => import("./pages/CoursePlayer"));
const FreeCoursePlayer = lazy(() => import("./pages/FreeCoursePlayer"));
const Certification = lazy(() => import("./pages/Certification"));
const CertificationV2 = lazy(() => import("./pages/Certification-v2"));
const CertificationExam = lazy(() => import("./pages/CertificationExam"));
const CertificationResults = lazy(() => import("./pages/CertificationResults"));
const MyCertificates = lazy(() => import("./pages/MyCertificates"));
const ExamReview = lazy(() => import("./pages/ExamReview"));
const PublicHome = lazy(() => import("./pages/PublicHome"));
const Admin = lazy(() => import("./pages/Admin"));
const ApiDocs = lazy(() => import("./pages/ApiDocs"));
const ApiKeys = lazy(() => import("./pages/ApiKeys"));
const PDCACycles = lazy(() => import("./pages/PDCACycles"));
const Billing = lazy(() => import("./pages/Billing"));
const PublicDashboard = lazy(() => import("./pages/PublicDashboard"));
const ComplianceScorecard = lazy(() => import("./pages/ComplianceScorecard"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const EnterpriseOnboarding = lazy(() => import("./pages/EnterpriseOnboarding"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Payg = lazy(() => import("./pages/Payg"));
const WatchdogLeaderboard = lazy(() => import("./pages/WatchdogLeaderboard"));
const RegulatorDashboard = lazy(() => import("./pages/RegulatorDashboard"));
const Blog = lazy(() => import("./pages/Blog"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const MarketingHome = lazy(() => import("./pages/MarketingHome"));
const Standards = lazy(() => import("./pages/Standards"));
const Resources = lazy(() => import("./pages/Resources"));
const About = lazy(() => import("./pages/About"));
const Careers = lazy(() => import("./pages/Careers"));
const NewHomeV2 = lazy(() => import("./pages/NewHome-v2"));
const NewHomeV3 = lazy(() => import("./pages/NewHome-v3"));
const RemediationPartners = lazy(() => import("./pages/RemediationPartners"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Welcome = lazy(() => import("./pages/Welcome"));
const FrameworkHive = lazy(() => import("./pages/FrameworkHive"));
const SystemCard = lazy(() => import("./pages/SystemCard"));
const Sov3ModelCard = lazy(() => import("./pages/Sov3ModelCard"));
const Sov3SystemCard = lazy(() => import("./pages/Sov3SystemCard"));
const Sov3Whitepaper = lazy(() => import("./pages/Sov3Whitepaper"));
const ResearchTransparency = lazy(() => import("./pages/ResearchTransparency"));
const ProvenanceFinding = lazy(() => import("./pages/ProvenanceFinding"));
const Article50Pack = lazy(() => import("./pages/Article50Pack"));
const AiTransparency = lazy(() => import("./pages/AiTransparency"));
const ABTesting = lazy(() => import("./pages/ABTesting"));
const AboutCEASAI = lazy(() => import("./pages/AboutCEASAI"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const CEASAITraining = lazy(() => import("./pages/CEASAITraining"));
const AustraliaAIGovernanceCompliance = lazy(() => import("./pages/AustraliaAIGovernanceCompliance"));
const CanadaAIActCompliance = lazy(() => import("./pages/CanadaAIActCompliance"));
const EUAIActCompliance = lazy(() => import("./pages/EUAIActCompliance"));
const NISTAIRMFCompliance = lazy(() => import("./pages/NISTAIRMFCompliance"));
const TC260Compliance = lazy(() => import("./pages/TC260Compliance"));
const UKAIBillCompliance = lazy(() => import("./pages/UKAIBillCompliance"));
const ConformityRoute = lazy(() => import("./pages/ConformityRoute"));
const Contact = lazy(() => import("./pages/Contact"));
const CouncilDetail = lazy(() => import("./pages/CouncilDetail"));
const CouncilLicensingLanding = lazy(() => import("./pages/CouncilLicensingLanding"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Documentation = lazy(() => import("./pages/Documentation"));
const EarlyAccessLanding = lazy(() => import("./pages/EarlyAccessLanding"));
const EI3 = lazy(() => import("./pages/EI3"));
const EUAIActClassifier = lazy(() => import("./pages/EUAIActClassifier"));
const EUAIActUrgency = lazy(() => import("./pages/EUAIActUrgency"));
const RegulationFeed = lazy(() => import("./pages/RegulationFeed"));
const FrameworkDetail = lazy(() => import("./pages/FrameworkDetail"));
const AustraliaAIGovernance = lazy(() => import("./pages/AustraliaAIGovernance"));
const CanadaAIAct = lazy(() => import("./pages/CanadaAIAct"));
const UKAIBill = lazy(() => import("./pages/UKAIBill"));
const GlobalAISafetyInitiative = lazy(() => import("./pages/GlobalAISafetyInitiative"));
const GovBench = lazy(() => import("./pages/GovBench"));
const DriftProduct = lazy(() => import("./pages/DriftProduct"));
const SovTownLab = lazy(() => import("./pages/SovTownLab"));
const GovernmentLinks = lazy(() => import("./pages/GovernmentLinks"));
const GovernmentPortal = lazy(() => import("./pages/GovernmentPortal"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const HorusIntel = lazy(() => import("./pages/HorusIntel"));
const CertificationHowItWorks = lazy(() => import("./pages/CertificationHowItWorks"));
const ComplianceHowItWorks = lazy(() => import("./pages/ComplianceHowItWorks"));
const DashboardHowItWorks = lazy(() => import("./pages/DashboardHowItWorks"));
const EnterpriseHowItWorks = lazy(() => import("./pages/EnterpriseHowItWorks"));
const TrainingHowItWorks = lazy(() => import("./pages/TrainingHowItWorks"));
const Landscape = lazy(() => import("./pages/Landscape"));
const MCPRegistry = lazy(() => import("./pages/MCPRegistry"));
const MCPDetail = lazy(() => import("./pages/MCPDetail"));
const Home = lazy(() => import("./pages/Home"));
const OpenGridWorks = lazy(() => import("./pages/OpenGridWorks"));
const Outreach = lazy(() => import("./pages/Outreach"));
const RegulationRadar = lazy(() => import("./pages/RegulationRadar"));
const RegionSettings = lazy(() => import("./pages/RegionSettings"));
const RegionalAnalytics = lazy(() => import("./pages/RegionalAnalytics"));
const RegulatoryAuthority = lazy(() => import("./pages/RegulatoryAuthority"));
const RegulatoryCompliance = lazy(() => import("./pages/RegulatoryCompliance"));
const Support = lazy(() => import("./pages/Support"));
const Status = lazy(() => import("./pages/Status"));
const PublicWatchdogHub = lazy(() => import("./pages/PublicWatchdogHub"));
const WatchdogHelpProtectHumanity = lazy(() => import("./pages/WatchdogHelpProtectHumanity"));
const WatchdogIncidentReport = lazy(() => import("./pages/WatchdogIncidentReport"));
const Benchmarks = lazy(() => import("./pages/Benchmarks"));
const Instrument = lazy(() => import("./pages/Instrument"));
const RefutationLedger = lazy(() => import("./pages/RefutationLedger"));
const LiveLedger = lazy(() => import("./pages/LiveLedger"));
const GSPCGapMap = lazy(() => import("./pages/GSPCGapMap"));
const GSPCAnchors = lazy(() => import("./pages/GSPCAnchors"));
const GSPCVerify = lazy(() => import("./pages/GSPCVerify"));
const Methodology = lazy(() => import("./pages/Methodology"));
const Library = lazy(() => import("./pages/Library"));
const Honesty = lazy(() => import("./pages/Honesty"));
const AiActBenchmark = lazy(() => import("./pages/AiActBenchmark"));
const ProvBench = lazy(() => import("./pages/ProvBench"));
const Layer0 = lazy(() => import("./pages/Layer0"));
const Ecosystem = lazy(() => import("./pages/Ecosystem"));
const Protect = lazy(() => import("./pages/Protect"));
const Ontology = lazy(() => import("./pages/Ontology"));
const ComplianceMonitoring = lazy(() => import("./pages/ComplianceMonitoring"));
const BulkAISystemImport = lazy(() => import("./pages/BulkAISystemImport"));
const Jobs = lazy(() => import("./pages/Jobs"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const MyApplications = lazy(() => import("./pages/MyApplications"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const AgentCouncilFeature = lazy(() => import("./pages/features/AgentCouncilFeature"));
const PDCAFrameworkFeature = lazy(() => import("./pages/features/PDCAFrameworkFeature"));
const TrainingCertificationFeature = lazy(() => import("./pages/features/TrainingCertificationFeature"));
const WatchdogJobsFeature = lazy(() => import("./pages/features/WatchdogJobsFeature"));
const StudentProgress = lazy(() => import("./pages/StudentProgress"));
const Accreditation = lazy(() => import("./pages/Accreditation"));
const SOAIPDCAFramework = lazy(() => import("./pages/SOAIPDCAFramework"));
const PDCASimulator = lazy(() => import("./pages/PDCASimulator"));
const CertificateVerification = lazy(() => import("./pages/CertificateVerification"));
const EnterpriseDashboard = lazy(() => import("./pages/EnterpriseDashboard"));
const Enterprise = lazy(() => import("./pages/Enterprise"));
// New pages for CSOAI briefing requirements
const ProsperityFund = lazy(() => import("./pages/ProsperityFund"));
const Charter = lazy(() => import("./pages/Charter"));
const FoundingMembers = lazy(() => import("./pages/FoundingMembers"));
const PublicWatchdog = lazy(() => import("./pages/PublicWatchdog"));
const GovernmentDashboard = lazy(() => import("./pages/GovernmentDashboard"));
const MaternalCovenant = lazy(() => import("./pages/MaternalCovenant"));
const EUAIActGuide = lazy(() => import("./pages/EUAIActGuide"));
const NISTAIRMFGuide = lazy(() => import("./pages/NISTAIRMFGuide"));
const ISO42001Guide = lazy(() => import("./pages/ISO42001Guide"));
const TC260Guide = lazy(() => import("./pages/TC260Guide"));
const WhyCSOAI = lazy(() => import("./pages/WhyCSOAI"));
// Legal Pages
const MembershipAgreement = lazy(() => import("./pages/legal/MembershipAgreement"));
const FoundingCouncilAgreement = lazy(() => import("./pages/legal/FoundingCouncilAgreement"));
const LicensingAgreement = lazy(() => import("./pages/legal/LicensingAgreement"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const Disclaimers = lazy(() => import("./pages/legal/Disclaimers"));
const DataProcessingAgreement = lazy(() => import("./pages/legal/DataProcessingAgreement"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));
const ServiceLevelAgreement = lazy(() => import("./pages/legal/ServiceLevelAgreement"));
const Council = lazy(() => import("./pages/Council"));
// New competitive improvement pages
const GlobalRegulationTracker = lazy(() => import("./pages/GlobalRegulationTracker"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Glossary = lazy(() => import("./pages/Glossary"));
const ReadinessAssessment = lazy(() => import("./pages/ReadinessAssessment"));
const IndustrySolutions = lazy(() => import("./pages/IndustrySolutions"));
const IndustryTemplate = lazy(() => import("./pages/IndustryTemplate"));
const PartnersAdvisory = lazy(() => import("./pages/PartnersAdvisory"));
const CaseStudies = lazy(() => import("./pages/CaseStudies"));
const TrustCenter = lazy(() => import("./pages/TrustCenter"));
const Traction = lazy(() => import("./pages/Traction"));
const ComparisonPage = lazy(() => import("./pages/ComparisonPage"));
const ROICalculator = lazy(() => import("./pages/ROICalculator"));
const Technology = lazy(() => import("./pages/Technology"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Crosswalks = lazy(() => import("./pages/Crosswalks"));
const CharterArticle = lazy(() => import("./pages/CharterArticle"));
const ContentPage = lazy(() => import("./pages/ContentPage"));
const OscalStudio = lazy(() => import("./pages/OscalStudio"));
const EvidenceHub = lazy(() => import("./pages/EvidenceHub"));
const ModelRegistry = lazy(() => import("./pages/ModelRegistry"));
const FrameworkCatalog = lazy(() => import("./pages/FrameworkCatalog"));
const Webhooks = lazy(() => import("./pages/Webhooks"));
const ComplianceCommandCenter = lazy(() => import("./pages/ComplianceCommandCenter"));
const PolicyGenerator = lazy(() => import("./pages/PolicyGenerator"));
const RiskHeatmap = lazy(() => import("./pages/RiskHeatmap"));
const OsLauncher = lazy(() => import("./pages/OsLauncher"));
const OsEnter = lazy(() => import("./pages/OsEnter"));
const SovereignTour = lazy(() => import("./pages/SovereignTour"));
const SovereignAcademy = lazy(() => import("./pages/SovereignAcademy"));
const SovereignRegistry = lazy(() => import("./pages/SovereignRegistry"));
const SovereignHives = lazy(() => import("./pages/SovereignHives"));
const GovernancePulse = lazy(() => import("./pages/GovernancePulse"));
const LegacyBridge = lazy(() => import("./pages/LegacyBridge"));
const SocialOS = lazy(() => import("./pages/SocialOS"));
const SovereignMinds = lazy(() => import("./pages/SovereignMinds"));
const TryCouncil = lazy(() => import("./pages/TryCouncil"));
const Lineage = lazy(() => import("./pages/Lineage"));
const RelevanceMap = lazy(() => import("./pages/RelevanceMap"));
const Temples = lazy(() => import("./pages/Temples"));
const Playbooks = lazy(() => import("./pages/Playbooks"));
const Dragonfly = lazy(() => import("./pages/Dragonfly"));
const MeokLaw = lazy(() => import("./pages/MeokLaw"));
const HiveModel = lazy(() => import("./pages/HiveModel"));
const Services = lazy(() => import("./pages/Services"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const SectorsAtlas = lazy(() => import("./pages/SectorsAtlas"));
const RegionsMap = lazy(() => import("./pages/RegionsMap"));
const RegistryAll = lazy(() => import("./pages/RegistryAll"));
const SocialConnect = lazy(() => import("./pages/SocialConnect"));
const SovereignHub = lazy(() => import("./pages/SovereignHub"));
const Pressroom = lazy(() => import("./pages/Pressroom"));
const Compare = lazy(() => import("./pages/Compare"));
const Fedramp = lazy(() => import("./pages/Fedramp"));
const Readiness = lazy(() => import("./pages/Readiness"));
const Agents = lazy(() => import("./pages/Agents"));
const Academy = lazy(() => import("./pages/Academy"));
import SovereignDock from "./components/SovereignDock";
import ArchivedBanner from "./components/ArchivedBanner";
import PageSchema from "./components/PageSchema";
import DemoTour from "./components/DemoTour";
const WatchdogMap = lazy(() => import("./pages/WatchdogMap"));
const IncidentReport = lazy(() => import("./pages/IncidentReport"));
const EuActClassifier = lazy(() => import("./pages/EuActClassifier"));
const Crosswalk = lazy(() => import("./pages/Crosswalk"));
const AgentGovernance = lazy(() => import("./pages/AgentGovernance"));
const AgentRegistry = lazy(() => import("./pages/AgentRegistry"));
const GlobalAIRegulation = lazy(() => import("./pages/GlobalAIRegulation"));
const Cra = lazy(() => import("./pages/Cra"));
const Nis2 = lazy(() => import("./pages/Nis2"));
const VulnerabilityDisclosure = lazy(() => import("./pages/VulnerabilityDisclosure"));
const Intel = lazy(() => import("./pages/Intel"));
const AccountBrief = lazy(() => import("./pages/AccountBrief"));
const Article50 = lazy(() => import("./pages/Article50"));
const GovernanceLayer = lazy(() => import("./pages/GovernanceLayer"));
const Dora = lazy(() => import("./pages/Dora"));
const DemoOS = lazy(() => import("./pages/DemoOS"));
const PocShowcase = lazy(() => import("./pages/PocShowcase"));
const CouncilSpace = lazy(() => import("./pages/CouncilSpace"));
const BadgesPage = lazy(() => import("./pages/BadgesPage"));
const RealWorldMap = lazy(() => import("./pages/RealWorldMap"));
const PlansPage = lazy(() => import("./pages/PlansPage"));
const OnboardOS = lazy(() => import("./pages/OnboardOS"));
const GovGraph = lazy(() => import("./pages/GovGraph"));
const NetworkPage = lazy(() => import("./pages/NetworkPage"));
const RegulatorAtlas = lazy(() => import("./pages/RegulatorAtlas"));
const CyberScan = lazy(() => import("./pages/CyberScan"));
const Competitors = lazy(() => import("./pages/Competitors"));
const SovereignTwin = lazy(() => import("./pages/SovereignTwin"));
const ToolCommons = lazy(() => import("./pages/ToolCommons"));
const OpenMedia = lazy(() => import("./pages/OpenMedia"));
const StatusPage = lazy(() => import("./pages/StatusPage"));
const Distribution = lazy(() => import("./pages/Distribution"));
const McpFleet = lazy(() => import("./pages/McpFleet"));
const Gone = lazy(() => import("./pages/Gone"));
import { frameworksdata } from "./data/frameworks-content";
import { sectorsdata } from "./data/sectors-content";
import { industriesdata } from "./data/industries-content";
import { blogdata } from "./data/blog-content";
import { AnalyticsProvider } from "./components/Analytics";
import CookieConsent from "./components/CookieConsent";

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
  "/academy": "Council Academy — AI governance training | CSOAI",
  "/webhooks": "Regulatory webhooks — live framework updates | CSOAI",
  "/models": "AI model registry & scoreboard | CSOAI",
  // Top public routes — "<Plain page name> | CSOAI"
  "/": "Council of AI — we measure, we sign, we re-attest",
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
  "/live-ledger": "Live Ledger | CSOAI",
  "/instrument": "The Instrument | CSOAI",
  "/benchmarks": "Benchmarks | CSOAI",
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
              <div className="flex flex-col min-h-screen">
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
                  <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center bg-[#03110b]"><SectionLoader /></div>}><Switch>
                  {/* Main routes */}
                  <Route path="/" component={NewHomeV3} />
                  <Route path="/home-v2" component={NewHomeV2} />
                  <Route path="/home-v3" component={NewHomeV3} />
                  <Route path="/remediation-partners" component={RemediationPartners} />
                  <Route path="/login" component={Login} />
                  <Route path="/signup" component={Signup} />
                  <Route path="/welcome" component={Welcome} />
                  <Route path="/hive/:slug" component={FrameworkHive} />
                  <Route path="/hive" component={FrameworkHive} />
                  <Route path="/system-card" component={SystemCard} />
                  <Route path="/assurance" component={SystemCard} />
                  <Route path="/systemcard" component={SystemCard} />
                  <Route path="/sov3-model-card" component={Sov3ModelCard} />
                  <Route path="/sov3-system-card" component={Sov3SystemCard} />
                  <Route path="/sov3-whitepaper" component={Sov3Whitepaper} />
                  <Route path="/research-transparency" component={ResearchTransparency} />
                  <Route path="/provenance-finding" component={ProvenanceFinding} />
                  <Route path="/ai-transparency" component={AiTransparency} />
                  <Route path="/ab-testing" component={ABTesting} />
                  <Route path="/about-ceasai" component={AboutCEASAI} />
                  <Route path="/accessibility" component={Accessibility} />
                  <Route path="/analytics" component={AnalyticsDashboard} />
                  {/* KILLED (audit §0.2 #12): asserted retracted Byzantine/fault-tolerance claim. */}
                  <Route path="/byzantine-consensus">{() => <Redirect to="/council" />}</Route>
                  <Route path="/ceasai-training" component={CEASAITraining} />
                  <Route path="/certificate-verification" component={CertificateVerification} />
                  <Route path="/compliance/australia-ai-governance" component={AustraliaAIGovernanceCompliance} />
                  <Route path="/compliance/canada-ai-act" component={CanadaAIActCompliance} />
                  <Route path="/compliance/eu-ai-act" component={EUAIActCompliance} />
                  <Route path="/compliance/nist-ai-rmf" component={NISTAIRMFCompliance} />
                  <Route path="/compliance/tc260" component={TC260Compliance} />
                  <Route path="/compliance/uk-ai-bill" component={UKAIBillCompliance} />
                  <Route path="/conformity-route" component={ConformityRoute} />
                  <Route path="/contact" component={Contact} />
                  <Route path="/council-detail" component={CouncilDetail} />
                  <Route path="/council-licensing" component={CouncilLicensingLanding} />
                  <Route path="/courses/:id" component={CourseDetail} />
                  <Route path="/docs" component={Documentation} />
                  <Route path="/early-access" component={EarlyAccessLanding} />
                  <Route path="/ei3" component={EI3} />
                  {/* REDIRECTED (audit §3.5 #2): one pricing page. Enterprise folds into /pricing. */}
                  <Route path="/enterprise-plans">{() => <Redirect to="/pricing" />}</Route>
                  <Route path="/eu-ai-act-classifier" component={EUAIActClassifier} />
                  <Route path="/eu-ai-act-urgency" component={EUAIActUrgency} />
                  <Route path="/feed" component={RegulationFeed} />
                  <Route path="/frameworks/australia-ai" component={AustraliaAIGovernance} />
                  <Route path="/frameworks/canada-ai-act" component={CanadaAIAct} />
                  <Route path="/frameworks/uk-ai-bill" component={UKAIBill} />
                  <Route path="/global-ai-safety-initiative" component={GlobalAISafetyInitiative} />
                  <Route path="/govbench" component={GovBench} />
                  <Route path="/drift-audit" component={DriftProduct} />
                  <Route path="/sov-town-lab" component={SovTownLab} />
                  <Route path="/government-links" component={GovernmentLinks} />
                  <Route path="/government-portal" component={GovernmentPortal} />
                  <Route path="/help" component={HelpCenter} />
                  <Route path="/help-center" component={HelpCenter} />
                  <Route path="/horus" component={HorusIntel} />
                  <Route path="/how-it-works/certification" component={CertificationHowItWorks} />
                  <Route path="/how-it-works/compliance" component={ComplianceHowItWorks} />
                  <Route path="/how-it-works/dashboard" component={DashboardHowItWorks} />
                  <Route path="/how-it-works/enterprise" component={EnterpriseHowItWorks} />
                  <Route path="/how-it-works/training" component={TrainingHowItWorks} />
                  <Route path="/landscape" component={Landscape} />
                  <Route path="/mcp" component={MCPRegistry} />
                  <Route path="/mcp/:slug" component={MCPDetail} />
                  <Route path="/mcps" component={MCPRegistry} />
                  <Route path="/old-home" component={Home} />
                  <Route path="/opengridworks" component={OpenGridWorks} />
                  <Route path="/outreach" component={Outreach} />
                  <Route path="/radar" component={RegulationRadar} />
                  <Route path="/region-settings" component={RegionSettings} />
                  <Route path="/regional-analytics" component={RegionalAnalytics} />
                  <Route path="/regulatory-authority" component={RegulatoryAuthority} />
                  <Route path="/regulatory-compliance" component={RegulatoryCompliance} />
                  <Route path="/soai-pdca/government" component={GovernmentPortal} />
                  <Route path="/support" component={Support} />
                  <Route path="/system-status" component={Status} />
                  <Route path="/verify/:certificateNumber" component={VerifyCertificate} />
                  <Route path="/watchdog-hub" component={PublicWatchdogHub} />
                  <Route path="/watchdog-leaderboard" component={WatchdogLeaderboard} />
                  <Route path="/watchdog/help-protect-humanity" component={WatchdogHelpProtectHumanity} />
                  <Route path="/watchdog/incident" component={WatchdogIncidentReport} />
                  <Route path="/watchdog/report" component={PublicWatchdogHub} />
                  <Route path="/benchmarks" component={Benchmarks} />
                  {/* Library IA — the "align, don't delete" archive hub + per-sector views */}
                  <Route path="/library" component={Library} />
                  <Route path="/library/:sector" component={Library} />
                  {/* The honesty gate — our own losses, published (owner GO 2026-08-18) */}
                  <Route path="/honesty" component={Honesty} />
                  <Route path="/instrument" component={Instrument} />
                  <Route path="/refutation-ledger" component={RefutationLedger} />
                  <Route path="/live-ledger" component={LiveLedger} />
                  <Route path="/gspc-gap-map" component={GSPCGapMap} />
                  {/* 17 Aug 2026: Council Space spectator lives at /gspc-arena. Do not bounce to /sov-space. */}
                  <Route path="/gspc-arena" component={CouncilSpace} />
                  <Route path="/gspc-anchors" component={GSPCAnchors} />
                  <Route path="/gspc-verify" component={GSPCVerify} />
                  <Route path="/methodology" component={Methodology} />
                  <Route path="/ai-act-benchmark" component={AiActBenchmark} />
                  <Route path="/provbench" component={ProvBench} />
                  <Route path="/layer0" component={Layer0} />
                  <Route path="/safe-space" component={Ecosystem} />
                  <Route path="/governance-commons" component={Ecosystem} />
                  <Route path="/protect" component={Protect} />
                  <Route path="/personal-protection" component={Protect} />
                  <Route path="/deepfake-protection" component={Protect} />
                  <Route path="/ontology" component={Ontology} />
          <Route path="/network" component={NetworkPage} />
          <Route path="/sovereign-network" component={NetworkPage} />
          <Route path="/agents-network" component={NetworkPage} />
          <Route path="/regulators" component={RegulatorAtlas} />
          <Route path="/regulator-atlas" component={RegulatorAtlas} />
          <Route path="/scan" component={CyberScan} />
          <Route path="/gods-eye" component={CyberScan} />
          <Route path="/cyber-scan" component={CyberScan} />
          <Route path="/usp" component={WhyCSOAI} />
          <Route path="/competitors" component={Competitors} />
          <Route path="/battlecards" component={Competitors} />
                  <Route path="/marketing" component={MarketingHome} />
                  <Route path="/standards" component={Standards} />
                  <Route path="/resources" component={Resources} />
                  <Route path="/payg" component={Payg} />
                  <Route path="/about" component={About} />
                  <Route path="/careers" component={Careers} />
                  {/* Key CSOAI pages */}
                  <Route path="/charter" component={Charter} />
                  <Route path="/maternal-covenant" component={MaternalCovenant} />
                  <Route path="/covenant" component={MaternalCovenant} />
                  <Route path="/why-csoai" component={WhyCSOAI} />
                  <Route path="/our-difference" component={WhyCSOAI} />
                  <Route path="/why" component={WhyCSOAI} />
                  {/* AI Framework Guides */}
                  <Route path="/eu-ai-act" component={EUAIActGuide} />
                  <Route path="/frameworks/eu-ai-act" component={EUAIActGuide} />
                  <Route path="/nist-ai-rmf" component={NISTAIRMFGuide} />
                  <Route path="/frameworks/nist" component={NISTAIRMFGuide} />
                  <Route path="/iso-42001" component={ISO42001Guide} />
                  <Route path="/frameworks/iso-42001" component={ISO42001Guide} />
                  <Route path="/tc260" component={TC260Guide} />
                  <Route path="/frameworks/tc260" component={TC260Guide} />
                  {/* Additional /guides/ routes for internal navigation */}
                  <Route path="/guides/eu-ai-act" component={EUAIActGuide} />
                  <Route path="/guides/nist-ai-rmf" component={NISTAIRMFGuide} />
                  <Route path="/guides/iso-42001" component={ISO42001Guide} />
                  <Route path="/guides/tc260" component={TC260Guide} />
                  {/* Absorbed data-driven content: per-framework / sector / industry / blog pages */}
                  <Route path="/frameworks/:slug">{(p: any) => <ContentPage dataset={frameworksdata} slug={p.slug} />}</Route>
                  <Route path="/sectors/:slug">{(p: any) => <ContentPage dataset={sectorsdata} slug={p.slug} />}</Route>
                  <Route path="/industries/:slug">{(p: any) => <IndustryTemplate slug={p.slug} />}</Route>
                  <Route path="/blog/:slug">{(p: any) => <ContentPage dataset={blogdata} slug={p.slug} />}</Route>
                  <Route path="/models" component={ModelRegistry} />
            <Route path="/framework-catalog" component={FrameworkCatalog} />
            <Route path="/command-center" component={ComplianceCommandCenter} />
            <Route path="/policy-generator" component={PolicyGenerator} />
            <Route path="/mcp-fleet" component={McpFleet} />
            <Route path="/os" component={OsLauncher} />
            <Route path="/workbench" component={Workbench} />
            <Route path="/sov3" component={Workbench} />
            <Route path="/demo" component={DemoOS} />
            <Route path="/os-demo" component={DemoOS} />
          <Route path="/enter" component={OsEnter} />
          <Route path="/tour" component={SovereignTour} />
          <Route path="/academy" component={SovereignAcademy} />
          <Route path="/register" component={SovereignRegistry} />
          <Route path="/hives" component={SovereignHives} />
          <Route path="/pulse" component={GovernancePulse} />
          <Route path="/join" component={SovereignRegistry} />
          <Route path="/distribution" component={Distribution} />
          <Route path="/legacy" component={LegacyBridge} />
          <Route path="/social" component={SocialOS} />
          {/* KILLED (audit §0.2 #22): internal strategy page ("goldmines/black swans") was public. */}
          <Route path="/jewels">{() => <Redirect to="/" />}</Route>
          {/* 2026-08-01 unification: the towns live INSIDE Sov Space as a layer */}
          <Route path="/towns">{() => <Redirect to="/gspc-arena?view=towns" />}</Route>
          <Route path="/minds" component={SovereignMinds} />
          <Route path="/try" component={TryCouncil} />
          <Route path="/lineage" component={Lineage} />
          <Route path="/map" component={RelevanceMap} />
          <Route path="/temples" component={Temples} />
          <Route path="/playbooks" component={Playbooks} />
          <Route path="/dragonfly" component={Dragonfly} />
          <Route path="/meok-law" component={MeokLaw} />
          <Route path="/law" component={MeokLaw} />
          <Route path="/hive-model" component={HiveModel} />
          <Route path="/services" component={Services} />
          <Route path="/how" component={HowItWorks} />
          <Route path="/how-it-works" component={HowItWorks} />
          <Route path="/sectors" component={SectorsAtlas} />
          <Route path="/regions" component={RegionsMap} />
          {/* 2026-08-01 unification: the globe lives INSIDE Sov Space as a layer */}
          <Route path="/globe">{() => <Redirect to="/gspc-arena?view=globe" />}</Route>
          <Route path="/registry" component={RegistryAll} />
          <Route path="/eu-ai-act-checklist" component={EUActChecklist} />
          <Route path="/checklist" component={EUActChecklist} />
          <Route path="/gpai" component={GpaiObligations} />
          <Route path="/foundation-models" component={GpaiObligations} />
          <Route path="/penalties" component={Penalties} />
          <Route path="/uk-ai-regulation">{() => <JurisdictionAct jx="uk" />}</Route>
          <Route path="/canada-aida">{() => <JurisdictionAct jx="canada" />}</Route>
          <Route path="/china-ai-law">{() => <JurisdictionAct jx="china" />}</Route>
          <Route path="/singapore-ai-governance">{() => <JurisdictionAct jx="singapore" />}</Route>
          <Route path="/south-korea-ai-act">{() => <JurisdictionAct jx="korea" />}</Route>
          <Route path="/us-ai-regulation">{() => <JurisdictionAct jx="usfederal" />}</Route>
          <Route path="/sec-disclosure">{() => <SECDisclosure />}</Route>
          <Route path="/sec-ai-disclosure">{() => <SECDisclosure />}</Route>
          <Route path="/for/:persona">{(params: any) => <PersonaRouter persona={params.persona} />}</Route>
          <Route path="/ai-act-faq" component={AiActFaq} />
          <Route path="/eu-ai-act-faq" component={AiActFaq} />
          <Route path="/conformity-assessment" component={ConformityAssessment} />
          <Route path="/ai-governance" component={AiGovernanceHub} />
          <Route path="/ai-governance-guide" component={AiGovernanceHub} />
          <Route path="/high-risk-ai-systems" component={HighRiskSystems} />
          <Route path="/classifier" component={EuActClassifier} />
          <Route path="/report" component={IncidentReport} />
          <Route path="/high-risk-ai" component={HighRiskSystems} />
          <Route path="/ai-act-summary" component={ActSummary} />
          <Route path="/eu-ai-act-explained" component={ActSummary} />
          <Route path="/colorado-ai-act">{() => <UsStateAct state="colorado" />}</Route>
          <Route path="/texas-ai-act">{() => <UsStateAct state="texas" />}</Route>
          <Route path="/california-ai-law">{() => <UsStateAct state="california" />}</Route>
          <Route path="/connect" component={SocialConnect} />
          <Route path="/sovereign" component={SovereignHub} />
          <Route path="/me" component={SovereignHub} />
          <Route path="/nist-vs-eu-ai-act" component={NistVsEuAct} />
          <Route path="/nist-eu" component={NistVsEuAct} />
          <Route path="/iso-42001-vs-eu-ai-act" component={Iso42001VsEuAct} />
          <Route path="/healthcare-ai-act">{() => <SectorAct sector="healthcare" />}</Route>
          <Route path="/finance-ai-act">{() => <SectorAct sector="finance" />}</Route>
          <Route path="/hr-ai-act">{() => <SectorAct sector="hr" />}</Route>
          <Route path="/energy-ai-act">{() => <SectorAct sector="energy" />}</Route>
          <Route path="/pharma-ai-act">{() => <SectorAct sector="pharma" />}</Route>
          <Route path="/defence-ai-act">{() => <SectorAct sector="defence" />}</Route>
          <Route path="/vanta-alternative">{() => <AltPage comp="vanta" />}</Route>
          <Route path="/onetrust-alternative">{() => <AltPage comp="onetrust" />}</Route>
          <Route path="/credo-ai-alternative">{() => <AltPage comp="credo" />}</Route>
          <Route path="/eu-ai-act-vs-gdpr" component={EuActVsGdpr} />
          <Route path="/ai-act-vs-gdpr" component={EuActVsGdpr} />
          <Route path="/eu-ai-act-timeline" component={ActTimeline} />
          <Route path="/ai-act-timeline" component={ActTimeline} />
          <Route path="/iso-eu" component={Iso42001VsEuAct} />
          <Route path="/fines" component={Penalties} />
          <Route path="/all" component={RegistryAll} />
          {/* REDIRECTED (audit §0.2 #14): "BFT setup" pages assert the retracted fault-tolerance claim. */}
          <Route path="/bft">{() => <Redirect to="/council" />}</Route>
          <Route path="/consensus">{() => <Redirect to="/council" />}</Route>
          <Route path="/world">{() => <Redirect to="/gspc-arena?view=globe" />}</Route>
          <Route path="/map-regions" component={RegionsMap} />
          <Route path="/compare" component={Compare} />
          <Route path="/vs" component={Compare} />
          <Route path="/vs/:slug">{(p: any) => <Compare focus={p.slug} />}</Route>
          <Route path="/vs-competitors" component={Compare} />
          <Route path="/rfc-0024" component={Fedramp} />
          <Route path="/aug-2026" component={Readiness} />
          <Route path="/governance-council" component={Agents} />
          <Route path="/council-vs-agents" component={Agents} />
          <Route path="/fedramp" component={Fedramp} />
          <Route path="/oscal-readiness" component={Fedramp} />
          <Route path="/readiness" component={Readiness} />
          <Route path="/agents" component={Agents} />
          <Route path="/press" component={Pressroom} />
          <Route path="/pressroom" component={Pressroom} />
          <Route path="/sector-atlas" component={SectorsAtlas} />
          <Route path="/learn" component={Academy} />
          <Route path="/tracks" component={Academy} />
          <Route path="/four-wings" component={Dragonfly} />
          <Route path="/industry-playbooks" component={Playbooks} />
          <Route path="/framework-temples" component={Temples} />
          <Route path="/relevance-map" component={RelevanceMap} />
          <Route path="/rediscovered" component={Lineage} />
          <Route path="/voice" component={SovereignMinds} />
          <Route path="/sov-towns">{() => <Redirect to="/gspc-arena?view=towns" />}</Route>
          {/* KILLED (audit §0.2 #22): internal strategy page ("goldmines/black swans") was public. */}
          <Route path="/crown-jewels">{() => <Redirect to="/" />}</Route>
          <Route path="/cobol" component={LegacyBridge} />
            <Route path="/risk-heatmap" component={RiskHeatmap} />
            <Route path="/webhooks" component={Webhooks} />
            <Route path="/evidence" component={EvidenceHub} />
            <Route path="/oscal" component={OscalStudio} />
            <Route path="/sovereign-town">{() => <Redirect to="/gspc-arena?view=towns" />}</Route>
                  <Route path="/prosperity" component={ProsperityFund} />
                  <Route path="/prosperity-fund" component={ProsperityFund} />
                  <Route path="/founding-members" component={FoundingMembers} />
                  {/* KILLED (audit §0.2 #13): "33-agent Byzantine consensus" page — retracted claim. */}
                  <Route path="/byzantine">{() => <Redirect to="/council" />}</Route>
                  <Route path="/council" component={Council} />
                  <Route path="/public-watchdog" component={PublicWatchdog} />
                  <Route path="/government" component={GovernmentDashboard} />
                  <Route path="/government-dashboard" component={GovernmentDashboard} />
                  {/* old-home route removed - was using broken Home component */}
                  <Route path="/landing" component={Landing} />
                  <Route path="/dashboard" component={Dashboard} />
                  <Route path="/ai-systems" component={AISystems} />
                  <Route path="/risk-assessment" component={RiskAssessment} />
                  <Route path="/assess" component={AssessTool} />
                  <Route path="/compliance" component={Compliance} />
                  <Route path="/agent-council" component={AgentCouncil} />
                  <Route path="/watchdog" component={Watchdog} />
                  <Route path="/watchdog-map" component={WatchdogMap} />
                  <Route path="/heatmap" component={WatchdogMap} />
                  <Route path="/watchdog-heatmap" component={WatchdogMap} />
                  <Route path="/poc" component={PocShowcase} />
                  <Route path="/humanoids-poc" component={PocShowcase} />
                  <Route path="/one-os" component={PocShowcase} />
                  <Route path="/reports" component={Reports} />
                  <Route path="/settings" component={Settings} />
                  <Route path="/settings/billing" component={Billing} />
                  <Route path="/settings/notifications" component={NotificationSettings} />
                  <Route path="/watchdog-signup" component={WatchdogSignup} />
                  <Route path="/training-hub" component={TrainingHub} />
                  <Route path="/drift-product" component={DriftProduct} />
                  <Route path="/training" component={TrainingV2} />
                  <Route path="/courses" component={Courses} />
                  <Route path="/my-courses" component={MyCourses} />
                  <Route path="/dashboard/progress" component={StudentProgress} />
                  <Route path="/courses/:id/learn" component={CoursePlayer} />
                  <Route path="/free-course/:courseId" component={FreeCoursePlayer} />
                  <Route path="/verify-certificate/:id" component={VerifyCertificate} />
                  <Route path="/features/33-agent-council" component={AgentCouncilFeature} />
                  <Route path="/features/pdca-framework" component={PDCAFrameworkFeature} />
                  <Route path="/features/training-certification" component={TrainingCertificationFeature} />
                  <Route path="/features/watchdog-jobs" component={WatchdogJobsFeature} />
                  <Route path="/certification" component={CertificationV2} />
                  <Route path="/certification/exam" component={CertificationExam} />
                  <Route path="/certification/results" component={CertificationResults} />
                  <Route path="/certificates" component={MyCertificates} />
                  <Route path="/certification/review" component={ExamReview} />
                  <Route path="/workbench" component={Workbench} />
                  <Route path="/jobs" component={Jobs} />
                  <Route path="/my-applications" component={MyApplications} />
                  <Route path="/public" component={PublicHome} />
                  <Route path="/admin" component={Admin} />
                  <Route path="/api-docs" component={ApiDocs} />
                  <Route path="/api-keys" component={ApiKeys} />
                  <Route path="/pdca" component={PDCACycles} />
                  <Route path="/transparency" component={PublicDashboard} />
                  <Route path="/public-dashboard">{() => <Redirect to="/transparency" />}</Route>
                  <Route path="/scorecard/:systemId" component={ComplianceScorecard} />
                  <Route path="/knowledge-base" component={KnowledgeBase} />
                  <Route path="/enterprise-onboarding" component={EnterpriseOnboarding} />
                  <Route path="/pricing" component={PlansPage} />
                  <Route path="/pricing-legacy" component={Pricing} />
                  <Route path="/leaderboard" component={WatchdogLeaderboard} />
                  <Route path="/regulator" component={RegulatorDashboard} />
                  <Route path="/blog" component={Blog} />
                  <Route path="/recommendations" component={Recommendations} />
                  <Route path="/accreditation" component={Accreditation} />
                  <Route path="/soai-pdca" component={SOAIPDCAFramework} />
                  <Route path="/pdca-simulator" component={PDCASimulator} />
                  <Route path="/verify-certificate" component={CertificateVerification} />
                  <Route path="/enterprise" component={Enterprise} />
                  <Route path="/enterprise-dashboard" component={EnterpriseDashboard} />
                  <Route path="/compliance-monitoring" component={ComplianceMonitoring} />
                  <Route path="/bulk-import" component={BulkAISystemImport} />
                  {/* Legal Pages */}
                  <Route path="/membership-agreement" component={MembershipAgreement} />
                  <Route path="/legal/membership" component={MembershipAgreement} />
                  <Route path="/founding-council-agreement" component={FoundingCouncilAgreement} />
                  <Route path="/legal/founding-council" component={FoundingCouncilAgreement} />
                  <Route path="/licensing-agreement" component={LicensingAgreement} />
                  <Route path="/legal/licensing" component={LicensingAgreement} />
                  <Route path="/privacy-policy" component={PrivacyPolicy} />
                  <Route path="/privacy" component={PrivacyPolicy} />
                  <Route path="/legal/privacy" component={PrivacyPolicy} />
                  <Route path="/terms-of-service" component={TermsOfService} />
                  <Route path="/terms" component={TermsOfService} />
                  <Route path="/legal/terms" component={TermsOfService} />
                  <Route path="/disclaimers" component={Disclaimers} />
                  <Route path="/legal/disclaimers" component={Disclaimers} />
                  <Route path="/dpa" component={DataProcessingAgreement} />
                  <Route path="/data-processing-agreement" component={DataProcessingAgreement} />
                  <Route path="/legal/dpa" component={DataProcessingAgreement} />
                  <Route path="/cookies" component={CookiePolicy} />
                  <Route path="/cookie-policy" component={CookiePolicy} />
                  <Route path="/legal/cookies" component={CookiePolicy} />
                  <Route path="/sla" component={ServiceLevelAgreement} />
                  <Route path="/service-level-agreement" component={ServiceLevelAgreement} />
                  <Route path="/legal/sla" component={ServiceLevelAgreement} />
                  {/* New Competitive Improvement Pages */}
                  <Route path="/global-regulations" component={GlobalRegulationTracker} />
                  <Route path="/regulation-tracker" component={GlobalRegulationTracker} />
                  <Route path="/faq" component={FAQ} />
                  <Route path="/frequently-asked-questions" component={FAQ} />
                  <Route path="/glossary" component={Glossary} />
                  <Route path="/ai-glossary" component={Glossary} />
                  <Route path="/readiness-assessment" component={ReadinessAssessment} />
                  <Route path="/assessment" component={ReadinessAssessment} />
                  <Route path="/industry-solutions" component={IndustrySolutions} />
                  <Route path="/industries" component={IndustrySolutions} />
                  <Route path="/partners" component={PartnersAdvisory} />
                  <Route path="/advisory" component={PartnersAdvisory} />
                  <Route path="/case-studies" component={CaseStudies} />
                  <Route path="/trust-center" component={TrustCenter} />
                  <Route path="/security" component={TrustCenter} />
                  <Route path="/traction" component={Traction} />
                  <Route path="/comparison" component={ComparisonPage} />
                  <Route path="/roi-calculator" component={ROICalculator} />
                  <Route path="/roi" component={ROICalculator} />
                  <Route path="/technology" component={Technology} />
                  <Route path="/architecture" component={Technology} />
                  <Route path="/integrations" component={Integrations} />
                  <Route path="/ecosystem" component={Integrations} />
                  {/* Framework Crosswalks */}
                  <Route path="/crosswalks" component={Crosswalks} />
                  <Route path="/crosswalk" component={Crosswalk} />
                  <Route path="/agent-governance" component={AgentGovernance} />
                  <Route path="/agent-registry" component={AgentRegistry} />
                  <Route path="/global-ai-regulation" component={GlobalAIRegulation} />
                  <Route path="/cra" component={Cra} />
                  <Route path="/nis2" component={Nis2} />
                  <Route path="/vulnerability-disclosure" component={VulnerabilityDisclosure} />
                  <Route path="/intel" component={Intel} />
                  <Route path="/brief" component={AccountBrief} />
                  <Route path="/article-50" component={Article50} />
                  <Route path="/packs/eu-article-50" component={Article50Pack} />
                  <Route path="/verify" component={Article50Pack} />
                  <Route path="/governance-layer" component={GovernanceLayer} />
                  <Route path="/dora" component={Dora} />
                  <Route path="/framework-crosswalks" component={Crosswalks} />
                  {/* Individual Charter Articles */}
                  <Route path="/charter/article/:id" component={CharterArticle} />
                  <Route path="/404" component={NotFound} />
                  {/* 410 Gone — retired routes, do not redirect. */}
                  <Route path="/sov-space" component={Gone} />
                  <Route path="/sovereign-space" component={Gone} />
                  <Route path="/stripe-checkout.js" component={Gone} />
                  <Route path="/simulate">{() => <Redirect to="/gspc-arena" />}</Route>
                  <Route path="/badges" component={BadgesPage} />
                  <Route path="/authority" component={BadgesPage} />
                  <Route path="/world-3d" component={RealWorldMap} />
                  <Route path="/real-world" component={RealWorldMap} />
                  {/* REDIRECTED (audit §3.5 #2): /plans was a byte-identical duplicate of /pricing. */}
                  <Route path="/plans">{() => <Redirect to="/pricing" />}</Route>
                  <Route path="/sovereign-pricing" component={PlansPage} />
                  <Route path="/start" component={OnboardOS} />
                  <Route path="/onboard" component={OnboardOS} />
                  <Route path="/open-media" component={OpenMedia} />
                  <Route path="/commons" component={OpenMedia} />
                  <Route path="/status" component={StatusPage} />
                  <Route path="/system" component={StatusPage} />
                  <Route path="/graph" component={GovGraph} />
                  <Route path="/governance-graph" component={GovGraph} />
                  <Route path="/world-data" component={GovGraph} />
                  <Route path="/tools" component={ToolCommons} />
                  <Route path="/tool-commons" component={ToolCommons} />
                  <Route path="/mcp-tools" component={ToolCommons} />
                  <Route path="/sovereign-twin" component={SovereignTwin} />
                  <Route component={NotFound} />
                  </Switch></Suspense>
                </main>
                <Footer />
                <SovereignDock />
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
