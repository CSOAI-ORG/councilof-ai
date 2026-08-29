import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Redirect } from "wouter";
import RequireAuth from "./components/RequireAuth";
import { useEffect, lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { SectionLoader } from "./components/PageLoader";
const SovOS = lazy(() => import("./pages/SovOS"));
const Registers = lazy(() => import("./pages/Registers"));
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Header } from "./components/Header";
import OsLauncher from "./pages/OsLauncher";
import OsHeader from "./components/os/OsHeader";
import HomeVerify from "./pages/HomeVerify";
import { Footer } from "./components/Footer";
import WidgetLayout from "./components/widget/WidgetLayout";
import WidgetCourses from "./components/widget/WidgetCourses";
import WidgetCoursePlayer from "./components/widget/WidgetCoursePlayer";
import { SkipNavigation } from "./components/SkipNavigation";
const Landing = lazy(() => import("./pages/Landing"));
const CouncilLobby = lazy(() => import("./components/lobby/CouncilLobby"));
const AgUiBridge = lazy(() => import("./pages/AgUiBridge"));
const RankingsBridge = lazy(() => import("./pages/AgUiBridge").then((m) => ({ default: m.RankingsBridge })));
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
const Products = lazy(() => import("./pages/Products"));
const Payg = lazy(() => import("./pages/Payg"));
const WatchdogLeaderboard = lazy(() => import("./pages/WatchdogLeaderboard"));
const RegulatorDashboard = lazy(() => import("./pages/RegulatorDashboard"));
const Blog = lazy(() => import("./pages/Blog"));
const AnswersIndex = lazy(() => import("./pages/Answers"));
const AnswerPage = lazy(() => import("./pages/Answers").then((m) => ({ default: m.AnswerPage })));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const MarketingHome = lazy(() => import("./pages/MarketingHome"));
const Standards = lazy(() => import("./pages/Standards"));
const Resources = lazy(() => import("./pages/Resources"));
const About = lazy(() => import("./pages/About"));
const FirstFineWatch = lazy(() => import("./pages/FirstFineWatch"));
const EunomiaData = lazy(() => import("./pages/EunomiaData"));
const Eunomia = lazy(() => import("./pages/Eunomia"));
const EunomiaCatalog = lazy(() => import("./pages/EunomiaCatalog"));
const EunomiaCrosswalk = lazy(() => import("./pages/EunomiaCrosswalk"));
const EunomiaIndices = lazy(() => import("./pages/EunomiaIndices"));
const Careers = lazy(() => import("./pages/Careers"));
const NewHomeV2 = lazy(() => import("./pages/NewHome-v2"));
const NewHomeV3 = lazy(() => import("./pages/NewHome-v3"));
const MotionLab = lazy(() => import("./pages/MotionLab"));
const RemediationPartners = lazy(() => import("./pages/RemediationPartners"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Welcome = lazy(() => import("./pages/Welcome"));
const FrameworkHive = lazy(() => import("./pages/FrameworkHive"));
const SystemCard = lazy(() => import("./pages/SystemCard"));
const CouncilModelCard = lazy(() => import("./pages/Sov3ModelCard"));
const CouncilSystemCard = lazy(() => import("./pages/Sov3SystemCard"));
const CouncilWhitepaper = lazy(() => import("./pages/Sov3Whitepaper"));
const ResearchTransparency = lazy(() => import("./pages/ResearchTransparency"));
const ProvenanceFinding = lazy(() => import("./pages/ProvenanceFinding"));
const Article50Pack = lazy(() => import("./pages/Article50Pack"));
const GpaiEvidencePack = lazy(() => import("./pages/GpaiEvidencePack"));
const CraReadinessKit = lazy(() => import("./pages/CraReadinessKit"));
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
const BenchmarkIndex = lazy(() => import("./pages/BenchmarkIndex"));
const BenchmarkQuality = lazy(() => import("./pages/BenchmarkQuality"));
const Instrument = lazy(() => import("./pages/Instrument"));
const Harness = lazy(() => import("./pages/Harness"));
const RefutationLedger = lazy(() => import("./pages/RefutationLedger"));
const LiveLedger = lazy(() => import("./pages/LiveLedger"));
const XrplAttest = lazy(() => import("./pages/XrplAttest"));
const RatingTheRaters = lazy(() => import("./pages/RatingTheRaters"));
const ClaimsRegister = lazy(() => import("./pages/ClaimsRegister"));
const GSPCGapMap = lazy(() => import("./pages/GSPCGapMap"));
const GSPCAnchors = lazy(() => import("./pages/GSPCAnchors"));
const GSPCVerify = lazy(() => import("./pages/GSPCVerify"));
const Methodology = lazy(() => import("./pages/Methodology"));
const Library = lazy(() => import("./pages/Library"));
const Honesty = lazy(() => import("./pages/Honesty"));
const Dispute = lazy(() => import("./pages/Dispute"));
const FirewallCharter = lazy(() => import("./pages/FirewallCharter"));
const Doctrine = lazy(() => import("./pages/Doctrine"));
const TransparencyCop = lazy(() => import("./pages/TransparencyCop"));
const GspcScoreboard = lazy(() => import("./pages/GspcScoreboard"));
const MeasurementBoard = lazy(() => import("./pages/MeasurementBoard"));
const MeasuredModels = lazy(() => import("./pages/MeasuredModels"));
const FinancialAxes = lazy(() => import("./pages/FinancialAxes"));
const Insurers = lazy(() => import("./pages/Insurers"));
const Coliseum = lazy(() => import("./pages/Coliseum"));
const OpenSourceFramework = lazy(() => import("./pages/OpenSourceFramework"));
const VerifiableTrust = lazy(() => import("./pages/VerifiableTrust"));
const EvidenceRail = lazy(() => import("./pages/EvidenceRail"));
const Metrology = lazy(() => import("./pages/Metrology"));
const AccountabilityLoop = lazy(() => import("./pages/AccountabilityLoop"));
const WhereTheRecordLives = lazy(() => import("./pages/WhereTheRecordLives"));
const StatuteToPredicate = lazy(() => import("./pages/StatuteToPredicate"));
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
const GlobalRegulationTracker = lazy(() => import("./pages/GlobalRegulationTracker"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
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
const OsEnter = lazy(() => import("./pages/OsEnter"));
const SovereignTour = lazy(() => import("./pages/SovereignTour"));
const SovereignAcademy = lazy(() => import("./pages/SovereignAcademy"));
const SovereignRegistry = lazy(() => import("./pages/SovereignRegistry"));
const SovereignHives = lazy(() => import("./pages/SovereignHives"));
const GovernancePulse = lazy(() => import("./pages/GovernancePulse"));
const LegacyBridge = lazy(() => import("./pages/LegacyBridge"));
const CobolBridge = lazy(() => import("./pages/CobolBridge"));
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
const Signals = lazy(() => import("./pages/Signals"));
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
import ArchivedBanner from "./components/ArchivedBanner";
import PageSchema from "./components/PageSchema";
import DemoTour from "./components/DemoTour";
const WatchdogMap = lazy(() => import("./pages/WatchdogMap"));
const IncidentReport = lazy(() => import("./pages/IncidentReport"));
const EuActClassifier = lazy(() => import("./pages/EuActClassifier"));
const Crosswalk = lazy(() => import("./pages/Crosswalk"));
const EastWest = lazy(() => import("./pages/EastWest"));
const Challenge = lazy(() => import("./pages/Challenge"));
const AgentGovernance = lazy(() => import("./pages/AgentGovernance"));
const AgentRegistry = lazy(() => import("./pages/AgentRegistry"));
const GlobalAIRegulation = lazy(() => import("./pages/GlobalAIRegulation"));
const Cra = lazy(() => import("./pages/Cra"));
const Nis2 = lazy(() => import("./pages/Nis2"));
const VulnerabilityDisclosure = lazy(() => import("./pages/VulnerabilityDisclosure"));
const Intel = lazy(() => import("./pages/Intel"));
const AccountBrief = lazy(() => import("./pages/AccountBrief"));
const Article50 = lazy(() => import("./pages/Article50"));
const VerifyLeaderboard = lazy(() => import("./pages/VerifyLeaderboard"));
const GovernanceLayer = lazy(() => import("./pages/GovernanceLayer"));
const Dora = lazy(() => import("./pages/Dora"));
const DemoOS = lazy(() => import("./pages/DemoOS"));
const PocShowcase = lazy(() => import("./pages/PocShowcase"));
const CouncilSpace = lazy(() => import("./pages/CouncilSpace"));
const BadgesPage = lazy(() => import("./pages/BadgesPage"));
const EmbedPage = lazy(() => import("./pages/EmbedPage"));
const BadgeKit = lazy(() => import("./pages/BadgeKit"));
const RealWorldMap = lazy(() => import("./pages/RealWorldMap"));
const PlansPage = lazy(() => import("./pages/PlansPage"));
const OnboardOS = lazy(() => import("./pages/OnboardOS"));
const GovGraph = lazy(() => import("./pages/GovGraph"));
const NetworkPage = lazy(() => import("./pages/NetworkPage"));
const RegulatorAtlas = lazy(() => import("./pages/RegulatorAtlas"));
const CyberScan = lazy(() => import("./pages/CyberScan"));
const Competitors = lazy(() => import("./pages/Competitors"));
const ToolCommons = lazy(() => import("./pages/ToolCommons"));
const OpenMedia = lazy(() => import("./pages/OpenMedia"));
const StatusPage = lazy(() => import("./pages/StatusPage"));
const Distribution = lazy(() => import("./pages/Distribution"));
const DistributionIntegrity = lazy(() => import("./pages/DistributionIntegrity"));
const McpFleet = lazy(() => import("./pages/McpFleet"));
const Gone = lazy(() => import("./pages/Gone"));
const ArenaScoreboard = lazy(() => import("./pages/ArenaScoreboard"));import { frameworksdata } from "./data/frameworks-content";
const ChallengeDoor = lazy(() => import("./pages/ChallengeDoor"));
const RegulatorFindings = lazy(() => import("./pages/RegulatorFindings"));
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

const ROUTE_TITLES: Record<string, string> = {
  "/pricing": "Pricing — AI governance plans & MCP tiers | CSOAI",
  "/products": "Council OS — four SKUs, one workspace | Council of AI",
  "/badge": "White-label badge — Council of AI",
  "/licensing-agreement": "Measurement licence — evidence and data | Council of AI",
  "/council-model-card": "Council model card | Council of AI",
  "/council-system-card": "Council system card | Council of AI",
  "/watchdog-signup": "Become an AI Safety Watchdog Analyst | CSOAI",
  "/trust-center": "Trust Center — security, compliance & Layer 0 | CSOAI",
  "/certification": "Measurement credential — how CSOAI attestation works | CSOAI",
  "/courses": "AI governance courses & training | CSOAI",
  "/api-docs": "API & MCP documentation | CSOAI",
  "/academy": "Council Academy — AI governance training | CSOAI",
  "/webhooks": "Regulatory webhooks — live framework updates | CSOAI",
  "/models": "AI model registry & scoreboard | CSOAI",
  "/": "Council OS | Council of AI",
  "/plans": "Plans | CSOAI",
  "/gspc-arena": "GSPC Arena | CSOAI",
  "/arena-scoreboard": "Signed Per-Axis Leaderboard | CSOAI",
  "/gspc-verify": "GSPC Verify | CSOAI",
  "/embed": "Embed / white-label — Powered by Council of AI | CSOAI",
  "/challenge": "Challenge a Measurement | CSOAI",
  "/regulator-findings": "Regulator Findings — signed EU AI Act | CSOAI",
  "/gspc-gap-map": "GSPC Gap Map | CSOAI",
  // No count in this title. A static title cannot derive one, and ADR-001 forbids
  // typing it — every count on /board renders in the body from the artifact that owns it.
  "/board": "The measurement board — every set, what it measures, what it does not | Council of AI",
  "/board/models": "Measured models — the signed card set | Council of AI",
  // No count in this title: a static route title cannot derive one, and ADR-001
  // forbids typing it. The live counts render in the page body from /api/gspc.
  "/financial-axes": "Financial axis — the financial half of the GSPC board | Council of AI",
  "/badges": "Governance badges — wear your measured status | CSOAI",
  "/verify-certificate": "Verify a completion record | CSOAI",
  "/gspc-anchors": "GSPC Anchors | CSOAI",
  "/xrpl-attest": "XRPL DEVNET pointer — Payment memo + CredentialCreate; not a grade | Council of AI",
  "/claims-register": "Claims register — every public claim, its evidence, its status | CSOAI",
  "/distribution-integrity": "Distribution integrity — represented is not distributed | Council of AI",
  "/layer0": "Layer 0 | CSOAI",
  "/methodology": "Methodology | CSOAI",
  "/answers": "Answers — measurement explainers | Council of AI",
  "/doctrine": "Doctrine — measurement, not certification | Council of AI",
  "/transparency-cop": "Transparency Code — detection/verify tool, C2PA planned | Council of AI",
  "/ai-act-benchmark": "AI Act Benchmark — measured, not claimed | CSOAI",
  "/provbench": "ProvBench — Does provenance survive the real world? | CSOAI",
  "/refutation-ledger": "Refutation Ledger | CSOAI",
  "/dispute": "Appeals & dispute resolution | Council of AI",
  "/east-west": "East-West — one signed measurement, every regime mapped | Council of AI",
  "/challenge": "Challenge a measurement — East-West redress | Council of AI",
  "/crosswalk": "AI governance framework crosswalk | Council of AI",
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
  "/harness": "The measurement harness | Council of AI",
  "/benchmarks": "Benchmarks | CSOAI",
  "/benchmark-index": "Meta-benchmark index — what other benchmarks report, beside what we measure | Council of AI",
  "/benchmark-quality": "Benchmark-quality register — deterministic predicates on third-party AI benchmarks | Council of AI",
  "/provenance-finding": "Provenance Finding | CSOAI",
  "/learn": "Learn | CSOAI",
  "/article-50": "Article 50 | CSOAI",
  "/packs/eu-article-50": "EU Article 50 evidence pack — signed C2PA durability | CSOAI",
  "/gpai-evidence": "GPAI Evidence Pack — independent evidence for the AI Office | CSOAI",
  "/cra-readiness": "CRA Readiness Kit — the 24h/72h/14-day runbook, signed | CSOAI",
  "/cobolbridge": "CobolBridge — legacy system to signed evidence | CSOAI",
  "/verify": "Verify a signed CSOAI measurement | CSOAI",
  "/governance-layer": "Council Governance Layer | CSOAI",
  "/status": "System Status | CSOAI",
  "/contact": "Contact | CSOAI",
  "/about": "About | CSOAI",
  "/mcp": "MCP Hub | CSOAI",
  "/mcp-fleet": "MCP Fleet | CSOAI",
  "/tool-commons": "Tool Commons | CSOAI",
  "/globe": "Global Regulation Globe | CSOAI",
  "/tour": "Platform Tour | CSOAI",
  "/demo": "Demo | CSOAI",
  "/assess": "Get measured — free assessment | Council of AI",
  "/login": "Sign in | Council of AI",
  "/dashboard": "Council software | Council of AI",
  "/os": "Council OS | Council of AI",
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

function RouteAnnouncer() {
  const [location] = useLocation();
  useEffect(() => {
    const getPageTitle = () => {
      const title = document.title;
      if (title) return title;
      const path = location.replace(/^\//, '').replace(/-/g, ' ');
      return path ? path.charAt(0).toUpperCase() + path.slice(1) : 'Home';
    };
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.style.cssText = `\n      position: absolute;\n      width: 1px;\n      height: 1px;\n      padding: 0;\n      margin: -1px;\n      overflow: hidden;\n      clip: rect(0, 0, 0, 0);\n      white-space: nowrap;\n      border: 0;\n    `;
    document.body.appendChild(announcement);
    const timeoutId = setTimeout(() => {
      announcement.textContent = `Navigated to ${getPageTitle()}`;
    }, 100);
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

function WidgetRouter() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <WidgetLayout>
            <Suspense fallback={<div role="status" aria-label="Loading the page" className="flex min-h-[60vh] items-center justify-center bg-background"><SectionLoader /></div>}><Switch>
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

function normPath(p: string) {
  const s = p.replace(/\/$/, "");
  return s === "" ? "/" : s;
}

function App() {
  const [location] = useLocation();
  const path = normPath(location);
  if (location.startsWith('/widget')) {
    return <WidgetRouter />;
  }
  // /council-os is NOT handled here. public/_redirects sends it 308 -> /os (the
  // crawlable launcher) while this branch sent it to /?lobby=home (the overlay),
  // so the same URL resolved to two different destinations depending on whether
  // Cloudflare Pages or the SPA answered it — 308 in production, client redirect
  // on an in-app navigation. Production is the authority; the SPA now agrees by
  // not claiming the path at all, and wouter falls through to the /os route.
  // /console and /sov-os both 308 -> /?lobby=home, which is what this branch does.
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
  // AG-UI is not the homepage. `/` is verify for a stranger.
  // `/os` stays the internal OS host; hops /ag-ui /chat /console /sov-os follow it.
  if (path === '/os' || path === '/ag-ui' || path === '/chat' || path === '/console' || path === '/sov-os') {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            <AnalyticsProvider>
              <TooltipProvider>
                <div className="flex min-h-screen flex-col bg-white">
                  <ScrollToTop />
                  <RouteTitle />
                  <RouteAnnouncer />
                  <OsHeader />
                  <main id="main-content" className="flex-1" role="main" aria-label="Main content" tabIndex={-1}>
                    <OsLauncher />
                  </main>
                </div>
                <Toaster position="top-right" toastOptions={{ style: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' } }} />
              </TooltipProvider>
            </AnalyticsProvider>
          </AuthProvider>
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
                <SkipNavigation />
                <ScrollToTop />
                <RouteTitle />
                <RouteAnnouncer />
                <Header />
                <PageSchema />
                <ArchivedBanner />
                <main id="main-content" className="flex-1" role="main" aria-label="Main content" tabIndex={-1}>
                  <Suspense fallback={<div role="status" aria-label="Loading the page" className="flex min-h-[60vh] items-center justify-center bg-background"><SectionLoader /></div>}><Switch>
                  <Route path="/" component={HomeVerify} />
                  <Route path="/home-v2" component={NewHomeV2} />
                  <Route path="/home-v3" component={NewHomeV3} />
                  <Route path="/motion-lab" component={MotionLab} />
                  <Route path="/remediation-partners" component={RemediationPartners} />
                  <Route path="/login" component={Login} />
                  <Route path="/signup" component={Signup} />
                  <Route path="/welcome" component={Welcome} />
                  <Route path="/hive/:slug" component={FrameworkHive} />
                  <Route path="/hive" component={FrameworkHive} />
                  <Route path="/system-card" component={SystemCard} />
                  <Route path="/assurance" component={SystemCard} />
                  <Route path="/systemcard" component={SystemCard} />
                  <Route path="/council-model-card" component={CouncilModelCard} />
                  <Route path="/council-system-card" component={CouncilSystemCard} />
                  <Route path="/workbench-paper" component={CouncilWhitepaper} />
                  <Route path="/sov3-model-card">{() => <Redirect to="/council-model-card" />}</Route>
                  <Route path="/sov3-system-card">{() => <Redirect to="/council-system-card" />}</Route>
                  <Route path="/sov3-whitepaper">{() => <Redirect to="/workbench-paper" />}</Route>
                  <Route path="/research-transparency" component={ResearchTransparency} />
                  <Route path="/provenance-finding" component={ProvenanceFinding} />
                  <Route path="/ai-transparency" component={AiTransparency} />
                  <Route path="/ab-testing" component={ABTesting} />
                  <Route path="/about-credential" component={AboutCEASAI} />
                  <Route path="/about-ceasai">{() => <Redirect to="/about-credential" />}</Route>
                  <Route path="/accessibility" component={Accessibility} />
                  <Route path="/analytics" component={AnalyticsDashboard} />
                  <Route path="/byzantine-consensus">{() => <Redirect to="/council" />}</Route>
                  <Route path="/credential-training" component={CEASAITraining} />
                  <Route path="/ceasai-training">{() => <Redirect to="/credential-training" />}</Route>
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
                  <Route path="/sov-town-lab">{() => <Redirect to="/gspc-arena?view=towns" />}</Route>
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
                  <Route path="/benchmark-index" component={BenchmarkIndex} />
                  <Route path="/benchmark-quality" component={BenchmarkQuality} />
                  <Route path="/library" component={Library} />
                  <Route path="/library/:sector" component={Library} />
                  <Route path="/honesty" component={Honesty} />
                  <Route path="/dispute" component={Dispute} />
                  <Route path="/east-west" component={EastWest} />
                  <Route path="/challenge" component={Challenge} />
                  <Route path="/firewall-charter" component={FirewallCharter} />
                  <Route path="/doctrine" component={Doctrine} />
                  <Route path="/transparency-cop" component={TransparencyCop} />
                  <Route path="/board/models" component={MeasuredModels} />
                  <Route path="/board" component={MeasurementBoard} />
                  <Route path="/gspc-scoreboard" component={GspcScoreboard} />
                  <Route path="/financial-axes" component={FinancialAxes} />
                  <Route path="/gspc/:axis" component={GspcScoreboard} />
                  <Route path="/insurers" component={Insurers} />
                  <Route path="/instrument" component={Instrument} />
                  <Route path="/harness" component={Harness} />
                  <Route path="/refutation-ledger" component={RefutationLedger} />
                  <Route path="/live-ledger" component={LiveLedger} />
                  <Route path="/coliseum" component={Coliseum} />
                  <Route path="/open-source" component={OpenSourceFramework} />
                  <Route path="/verifiable-trust" component={VerifiableTrust} />
                  <Route path="/evidence-rail" component={EvidenceRail} />
                  <Route path="/metrology" component={Metrology} />
                  <Route path="/accountability-loop" component={AccountabilityLoop} />
                  <Route path="/where-the-record-lives" component={WhereTheRecordLives} />
                  <Route path="/statute-to-predicate" component={StatuteToPredicate} />
                  <Route path="/gspc-gap-map" component={GSPCGapMap} />
                  <Route path="/gspc-arena" component={CouncilSpace} />
                  <Route path="/gspc-anchors" component={GSPCAnchors} />
                  <Route path="/xrpl-attest" component={XrplAttest} />
                  <Route path="/rating-the-raters" component={RatingTheRaters} />
                  <Route path="/claims-register" component={ClaimsRegister} />
                  <Route path="/distribution-integrity" component={DistributionIntegrity} />
                  <Route path="/gspc-verify" component={GSPCVerify} />
                  <Route path="/embed" component={EmbedPage} />
                  <Route path="/white-label" component={EmbedPage} />
                  <Route path="/badge" component={BadgeKit} />
                  <Route path="/badges">{() => <Redirect to="/badge" />}</Route>
                  <Route path="/verify-certificate">{() => <Redirect to="/gspc-verify" />}</Route>
                  <Route path="/challenge" component={ChallengeDoor} />
                  <Route path="/regulator-findings" component={RegulatorFindings} />
                  <Route path="/arena-scoreboard" component={ArenaScoreboard} />
                  <Route path="/ag-ui" component={AgUiBridge} />
                  <Route path="/chat" component={AgUiBridge} />
                  <Route path="/rankings" component={RankingsBridge} />
                  <Route path="/methodology" component={Methodology} />
                  <Route path="/answers/:slug" component={AnswerPage} />
                  <Route path="/answers" component={AnswersIndex} />
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
                  <Route path="/sovereign-network">{() => <Redirect to="/network" />}</Route>
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
                  <Route path="/first-fine-watch" component={FirstFineWatch} />
                  <Route path="/eunomia-data" component={EunomiaData} />
                  <Route path="/eunomia" component={Eunomia} />
                  <Route path="/eunomia-catalog" component={EunomiaCatalog} />
                  <Route path="/eunomia-crosswalk" component={EunomiaCrosswalk} />
                  <Route path="/eunomia-indices" component={EunomiaIndices} />
                  <Route path="/careers" component={Careers} />
                  <Route path="/charter" component={Charter} />
                  <Route path="/maternal-covenant" component={MaternalCovenant} />
                  <Route path="/covenant" component={MaternalCovenant} />
                  <Route path="/why-csoai" component={WhyCSOAI} />
                  <Route path="/our-difference" component={WhyCSOAI} />
                  <Route path="/why" component={WhyCSOAI} />
                  <Route path="/eu-ai-act" component={EUAIActGuide} />
                  <Route path="/frameworks/eu-ai-act" component={EUAIActGuide} />
                  <Route path="/nist-ai-rmf" component={NISTAIRMFGuide} />
                  <Route path="/frameworks/nist" component={NISTAIRMFGuide} />
                  <Route path="/iso-42001" component={ISO42001Guide} />
                  <Route path="/frameworks/iso-42001" component={ISO42001Guide} />
                  <Route path="/tc260" component={TC260Guide} />
                  <Route path="/frameworks/tc260" component={TC260Guide} />
                  <Route path="/guides/eu-ai-act" component={EUAIActGuide} />
                  <Route path="/guides/nist-ai-rmf" component={NISTAIRMFGuide} />
                  <Route path="/guides/iso-42001" component={ISO42001Guide} />
                  <Route path="/guides/tc260" component={TC260Guide} />
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
                  {/* Same destination as the 308 in public/_redirects, so an in-app
                      navigation and a cold load of /council-os land in the same place. */}
                  <Route path="/council-os">{() => <Redirect to="/os" />}</Route>
                  <Route path="/sov3">{() => <Redirect to="/workbench" />}</Route>
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
                  <Route path="/csoai-law" component={MeokLaw} />
                  <Route path="/meok-law" component={MeokLaw} />
                  <Route path="/law" component={MeokLaw} />
                  <Route path="/hive-model" component={HiveModel} />
                  <Route path="/services" component={Services} />
                  <Route path="/how" component={HowItWorks} />
                  <Route path="/how-it-works" component={HowItWorks} />
                  <Route path="/sectors" component={SectorsAtlas} />
                  <Route path="/registers" component={Registers} />
                  <Route path="/signals" component={Signals} />
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
                  <Route path="/sovereign">{() => <Redirect to="/me" />}</Route>
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
                  <Route path="/cobolbridge" component={CobolBridge} />
                  <Route path="/risk-heatmap" component={RiskHeatmap} />
                  <Route path="/webhooks" component={Webhooks} />
                  <Route path="/evidence" component={EvidenceHub} />
                  <Route path="/oscal" component={OscalStudio} />
                  <Route path="/sovereign-town">{() => <Redirect to="/gspc-arena?view=towns" />}</Route>
                  <Route path="/prosperity" component={ProsperityFund} />
                  <Route path="/prosperity-fund" component={ProsperityFund} />
                  <Route path="/founding-members" component={FoundingMembers} />
                  <Route path="/byzantine">{() => <Redirect to="/council" />}</Route>
                  <Route path="/council" component={Council} />
                  <Route path="/public-watchdog" component={PublicWatchdog} />
                  <Route path="/government" component={GovernmentDashboard} />
                  <Route path="/government-dashboard" component={GovernmentDashboard} />
                  <Route path="/landing" component={Landing} />
                  <Route path="/dashboard" component={Dashboard} />
                  <Route path="/ai-systems" component={AISystems} />
                  <Route path="/risk-assessment" component={RiskAssessment} />
                  <Route path="/assess">{() => <RequireAuth><AssessTool /></RequireAuth>}</Route>
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
                  <Route path="/settings">{() => <RequireAuth><Settings /></RequireAuth>}</Route>
                  <Route path="/settings/billing">{() => <RequireAuth><Billing /></RequireAuth>}</Route>
                  <Route path="/settings/notifications">{() => <RequireAuth><NotificationSettings /></RequireAuth>}</Route>
                  <Route path="/watchdog-signup" component={WatchdogSignup} />
                  <Route path="/training-hub" component={TrainingHub} />
                  <Route path="/drift-product" component={DriftProduct} />
                  <Route path="/training" component={TrainingV2} />
                  <Route path="/courses" component={Courses} />
                  <Route path="/my-courses">{() => <RequireAuth><MyCourses /></RequireAuth>}</Route>
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
                  <Route path="/workbench">{() => <RequireAuth><Workbench /></RequireAuth>}</Route>
                  <Route path="/jobs" component={Jobs} />
                  <Route path="/my-applications">{() => <RequireAuth><MyApplications /></RequireAuth>}</Route>
                  <Route path="/public" component={PublicHome} />
                  <Route path="/admin">{() => <RequireAuth><Admin /></RequireAuth>}</Route>
                  <Route path="/api-docs" component={ApiDocs} />
                  <Route path="/api-keys">{() => <RequireAuth><ApiKeys /></RequireAuth>}</Route>
                  <Route path="/pdca" component={PDCACycles} />
                  <Route path="/transparency" component={PublicDashboard} />
                  <Route path="/public-dashboard">{() => <Redirect to="/transparency" />}</Route>
                  <Route path="/scorecard/:systemId" component={ComplianceScorecard} />
                  <Route path="/knowledge-base" component={KnowledgeBase} />
                  <Route path="/enterprise-onboarding" component={EnterpriseOnboarding} />
                  <Route path="/pricing" component={PlansPage} />
                  <Route path="/products" component={Products} />
                  <Route path="/catalog">{() => <Redirect to="/products" />}</Route>
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
                  <Route path="/global-regulations" component={GlobalRegulationTracker} />
                  <Route path="/regulation-tracker" component={GlobalRegulationTracker} />
                  <Route path="/faq" component={FaqPage} />
                  <Route path="/faqs"><Redirect to="/faq" /></Route>
                  <Route path="/frequently-asked-questions" component={FaqPage} />
                  <Route path="/glossary" component={Glossary} />
                  <Route path="/ai-glossary" component={Glossary} />
                  <Route path="/readiness-assessment">{() => <Redirect to="/assess" />}</Route>
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
                  <Route path="/verify-leaderboard" component={VerifyLeaderboard} />
                  <Route path="/packs/eu-article-50" component={Article50Pack} />
                  <Route path="/gpai-evidence" component={GpaiEvidencePack} />
                  <Route path="/cra-readiness" component={CraReadinessKit} />
                  <Route path="/governance-layer" component={GovernanceLayer} />
                  <Route path="/dora" component={Dora} />
                  <Route path="/framework-crosswalks" component={Crosswalks} />
                  <Route path="/charter/article/:id" component={CharterArticle} />
                  <Route path="/404" component={NotFound} />
                  <Route path="/gone-space" component={Gone} />
                  <Route path="/sov-space">{() => <Redirect to="/gone-space" />}</Route>
                  <Route path="/sovereign-space">{() => <Redirect to="/gone-space" />}</Route>
                  <Route path="/stripe-checkout.js" component={Gone} />
                  <Route path="/simulate">{() => <Redirect to="/gspc-arena" />}</Route>
                  <Route path="/badges" component={BadgesPage} />
                  <Route path="/authority" component={BadgesPage} />
                  <Route path="/world-3d" component={RealWorldMap} />
                  <Route path="/real-world" component={RealWorldMap} />
                  <Route path="/plans">{() => <Redirect to="/pricing" />}</Route>
                  <Route path="/sovereign-pricing">{() => <Redirect to="/pricing" />}</Route>
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
                  <Route path="/sovereign-twin">{() => <Redirect to="/me" />}</Route>
                  <Route component={NotFound} />
                  </Switch></Suspense>
                </main>
                <Footer />
                {/* 2026-08-26: CouncilConsole was still mounted here, and its own
                    docstring says it was retired from site chrome on 2026-08-21 and that
                    "App.tsx no longer mounts the floating bubble". It did. Both bubbles
                    render `fixed bottom-5 right-5 z-[70] h-12 w-12` — measured live, they
                    occupied the IDENTICAL rect (639,896)-(687,944). Which one a mouse hits
                    was decided only by paint order, and the retired one came FIRST in the
                    DOM, so keyboard and screen-reader users reached "Open the Council
                    Console" before the OS badge. One control, one workspace: the Council OS
                    badge is the launcher. The component stays on disk as the deterministic
                    SUMMON/escort implementation, exactly as its docstring intends — it is
                    simply not mounted as a second floating chat. */}
                <Suspense fallback={null}><CouncilLobby /></Suspense>
                <DemoTour />
                <CookieConsent />
              </div>
              <Toaster position="top-right" toastOptions={{ style: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' } }} />
            </TooltipProvider>
          </AnalyticsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
