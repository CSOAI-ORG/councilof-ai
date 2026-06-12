import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { SkipNavigation } from "./components/SkipNavigation";
// Home removed - using NewHomeV2 instead
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import AISystems from "./pages/AISystems";
import RiskAssessment from "./pages/RiskAssessment";
import Compliance from "./pages/Compliance";
import AgentCouncil from "./pages/AgentCouncil";
import Watchdog from "./pages/Watchdog";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import WatchdogSignup from "./pages/WatchdogSignup";
// Training removed - using Training-v2 instead
import TrainingV2 from "./pages/Training-v2";
import Courses from "./pages/Courses";
import MyCourses from "./pages/MyCourses";
import CoursePlayer from "./pages/CoursePlayer";
import Certification from "./pages/Certification";
import CertificationV2 from "./pages/Certification-v2";
import CertificationExam from "./pages/CertificationExam";
import CertificationResults from "./pages/CertificationResults";
import MyCertificates from "./pages/MyCertificates";
import ExamReview from "./pages/ExamReview";
import Workbench from "./pages/Workbench";
import PublicHome from "./pages/PublicHome";
import Admin from "./pages/Admin";
import ApiDocs from "./pages/ApiDocs";
import ApiKeys from "./pages/ApiKeys";
import PDCACycles from "./pages/PDCACycles";
import Billing from "./pages/Billing";
import PublicDashboard from "./pages/PublicDashboard";
import ComplianceScorecard from "./pages/ComplianceScorecard";
import KnowledgeBase from "./pages/KnowledgeBase";
import EnterpriseOnboarding from "./pages/EnterpriseOnboarding";
import Pricing from "./pages/Pricing";
import WatchdogLeaderboard from "./pages/WatchdogLeaderboard";
import RegulatorDashboard from "./pages/RegulatorDashboard";
import Blog from "./pages/Blog";
import Recommendations from "./pages/Recommendations";
import MarketingHome from "./pages/MarketingHome";
import Standards from "./pages/Standards";
import Resources from "./pages/Resources";
import About from "./pages/About";
import Careers from "./pages/Careers";
import NewHomeV2 from "./pages/NewHome-v2";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ComplianceMonitoring from "./pages/ComplianceMonitoring";
import BulkAISystemImport from "./pages/BulkAISystemImport";
import Jobs from "./pages/Jobs";
import NotificationSettings from "./pages/NotificationSettings";
import MyApplications from "./pages/MyApplications";
import VerifyCertificate from "./pages/VerifyCertificate";
import AgentCouncilFeature from "./pages/features/AgentCouncilFeature";
import PDCAFrameworkFeature from "./pages/features/PDCAFrameworkFeature";
import TrainingCertificationFeature from "./pages/features/TrainingCertificationFeature";
import WatchdogJobsFeature from "./pages/features/WatchdogJobsFeature";
import StudentProgress from "./pages/StudentProgress";
import Accreditation from "./pages/Accreditation";
import SOAIPDCAFramework from "./pages/SOAIPDCAFramework";
import PDCASimulator from "./pages/PDCASimulator";
import CertificateVerification from "./pages/CertificateVerification";
import EnterpriseDashboard from "./pages/EnterpriseDashboard";
import Enterprise from "./pages/Enterprise";
// New pages for CSOAI briefing requirements
import ProsperityFund from "./pages/ProsperityFund";
import Charter from "./pages/Charter";
import FoundingMembers from "./pages/FoundingMembers";
import PublicWatchdog from "./pages/PublicWatchdog";
import GovernmentDashboard from "./pages/GovernmentDashboard";
import MaternalCovenant from "./pages/MaternalCovenant";
import EUAIActGuide from "./pages/EUAIActGuide";
import NISTAIRMFGuide from "./pages/NISTAIRMFGuide";
import ISO42001Guide from "./pages/ISO42001Guide";
import TC260Guide from "./pages/TC260Guide";
import WhyCSOAI from "./pages/WhyCSOAI";
// Legal Pages
import MembershipAgreement from "./pages/legal/MembershipAgreement";
import FoundingCouncilAgreement from "./pages/legal/FoundingCouncilAgreement";
import LicensingAgreement from "./pages/legal/LicensingAgreement";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import Disclaimers from "./pages/legal/Disclaimers";
import DataProcessingAgreement from "./pages/legal/DataProcessingAgreement";
import CookiePolicy from "./pages/legal/CookiePolicy";
import ServiceLevelAgreement from "./pages/legal/ServiceLevelAgreement";
import Council from "./pages/Council";
import { AnalyticsProvider } from "./components/Analytics";

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
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

function App() {
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
                <RouteAnnouncer />
                <Header />
                <main
                  id="main-content"
                  className="flex-1"
                  role="main"
                  aria-label="Main content"
                  tabIndex={-1}
                >
                  <Switch>
                  {/* Main routes */}
                  <Route path="/" component={NewHomeV2} />
                  <Route path="/login" component={Login} />
                  <Route path="/signup" component={Signup} />
                  <Route path="/marketing" component={MarketingHome} />
                  <Route path="/standards" component={Standards} />
                  <Route path="/resources" component={Resources} />
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
                  <Route path="/prosperity" component={ProsperityFund} />
                  <Route path="/prosperity-fund" component={ProsperityFund} />
                  <Route path="/founding-members" component={FoundingMembers} />
                  <Route path="/byzantine" component={AgentCouncil} />
                  <Route path="/council" component={Council} />
                  <Route path="/public-watchdog" component={PublicWatchdog} />
                  <Route path="/government" component={GovernmentDashboard} />
                  <Route path="/government-dashboard" component={GovernmentDashboard} />
                  {/* old-home route removed - was using broken Home component */}
                  <Route path="/landing" component={Landing} />
                  <Route path="/dashboard" component={Dashboard} />
                  <Route path="/ai-systems" component={AISystems} />
                  <Route path="/risk-assessment" component={RiskAssessment} />
                  <Route path="/compliance" component={Compliance} />
                  <Route path="/agent-council" component={AgentCouncil} />
                  <Route path="/watchdog" component={Watchdog} />
                  <Route path="/reports" component={Reports} />
                  <Route path="/settings" component={Settings} />
                  <Route path="/settings/billing" component={Billing} />
                  <Route path="/settings/notifications" component={NotificationSettings} />
                  <Route path="/watchdog-signup" component={WatchdogSignup} />
                  <Route path="/training" component={TrainingV2} />
                  <Route path="/courses" component={Courses} />
                  <Route path="/my-courses" component={MyCourses} />
                  <Route path="/dashboard/progress" component={StudentProgress} />
                  <Route path="/courses/:id/learn" component={CoursePlayer} />
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
                  <Route path="/scorecard/:systemId" component={ComplianceScorecard} />
                  <Route path="/knowledge-base" component={KnowledgeBase} />
                  <Route path="/enterprise-onboarding" component={EnterpriseOnboarding} />
                  <Route path="/pricing" component={Pricing} />
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
                  <Route path="/404" component={NotFound} />
                  {/* Final fallback route */}
                  <Route component={NotFound} />
                  </Switch>
                </main>
                <Footer />
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
