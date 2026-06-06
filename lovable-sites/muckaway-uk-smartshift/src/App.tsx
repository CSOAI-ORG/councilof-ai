import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GlobalProvider } from "./components/GlobalProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { InstallPrompt } from "./components/InstallPrompt";
import { EnhancedConsentBanner } from "./components/EnhancedConsentBanner";
import { AnalyticsListener } from "./components/AnalyticsListener";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initializeNativeApp } from "./lib/native";
import { FloatingCTA } from "./components/FloatingCTA";
import { NewsletterModal } from "./components/NewsletterModal";
import { useRTL } from "./hooks/useRTL";

// Eager load lightweight public pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthPage } from "./components/AuthPage";
import Terms from "./pages/Terms"; // Legal pages should load instantly
import Privacy from "./pages/Privacy";

// Lazy load heavy dashboard/feature pages
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const AITools = lazy(() => import("./pages/AITools"));
const Software = lazy(() => import("./pages/Software"));
const HowToUse = lazy(() => import("./pages/HowToUse"));
const FAQ = lazy(() => import("./pages/FAQ"));
const QuoteToJobWorkflow = lazy(() => import("./pages/QuoteToJobWorkflow"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const Install = lazy(() => import("./pages/Install"));
const Download = lazy(() => import("./pages/Download"));
const Integration = lazy(() => import("./pages/Integration"));
const SmartIntegrations = lazy(() => import("./pages/SmartIntegrations"));
const About = lazy(() => import("./pages/About"));
const UseCases = lazy(() => import("./pages/UseCases"));
const Global = lazy(() => import("./pages/Global"));
const Contact = lazy(() => import("./pages/Contact"));
// Privacy and Terms are eagerly loaded above for instant legal page access
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const DataProcessing = lazy(() => import("./pages/DataProcessing"));
const DataRequest = lazy(() => import("./pages/DataRequest"));
const Profile = lazy(() => import("./pages/Profile"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Subcontractors = lazy(() => import("./pages/Subcontractors"));
const LiveTracking = lazy(() => import("./pages/LiveTracking"));
const Environmental = lazy(() => import("./pages/Environmental"));
const Integrations = lazy(() => import("./pages/Integrations"));
const CreditManagement = lazy(() => import("./pages/CreditManagement"));
const Admin = lazy(() => import("./pages/Admin"));
const StockOverview = lazy(() => import("./pages/StockOverview"));
const DepotsManagement = lazy(() => import("./pages/DepotsManagement"));
const MaterialsCatalog = lazy(() => import("./pages/MaterialsCatalog"));
const StockMovements = lazy(() => import("./pages/StockMovements"));
const AggregateSales = lazy(() => import("./pages/AggregateSales"));
const PurchaseOrders = lazy(() => import("./pages/PurchaseOrders"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Reports = lazy(() => import("./pages/Reports"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Portal = lazy(() => import("./pages/Portal"));
const APIDocumentation = lazy(() => import("./pages/APIDocumentation"));
const GDPRCompliance = lazy(() => import("./pages/GDPRCompliance"));
const DataAnonymization = lazy(() => import("./pages/DataAnonymization"));
const Weather = lazy(() => import("./pages/Weather"));
const Demo = lazy(() => import("./pages/Demo").then(m => ({ default: m.Demo })));
const LocationPage = lazy(() => import("./pages/LocationPage"));
const SEOPage = lazy(() => import("./pages/seo/SEOPage"));
const PricingPage = lazy(() => import("./pages/Pricing").catch(err => {
  console.error('Failed to load Pricing page:', err);
  throw err;
}));
const WasteCalculator = lazy(() => import("./pages/WasteCalculator").catch(err => {
  console.error('Failed to load WasteCalculator page:', err);
  throw err;
}));
const IncidentRunbook = lazy(() => import("./pages/IncidentRunbook").catch(err => {
  console.error('Failed to load IncidentRunbook page:', err);
  throw err;
}));
const DriverPage = lazy(() => import("./pages/Driver"));

// Dedicated dashboard page components with DashboardLayout
const AIClassification = lazy(() => import("./pages/AIClassification"));
const AIInsights = lazy(() => import("./pages/AIInsights"));
const AIChatbotPage = lazy(() => import("./pages/AIChatbotPage"));
const MaintenanceAlerts = lazy(() => import("./pages/MaintenanceAlerts"));
const Fleet = lazy(() => import("./pages/Fleet"));
const Hazardous = lazy(() => import("./pages/Hazardous"));
const DriverChecksPage = lazy(() => import("./pages/DriverChecksPage"));
const WeighbridgePage = lazy(() => import("./pages/WeighbridgePage"));
const CustomerPortalPage = lazy(() => import("./pages/CustomerPortalPage"));
const queryClient = new QueryClient();

// Loading fallback for lazy-loaded components
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// RTL wrapper component to handle direction changes
const RTLWrapper = ({ children }: { children: React.ReactNode }) => {
  useRTL(); // This hook updates document.dir automatically
  return <>{children}</>;
};

const App = () => {
  // Initialize native app features on mount
  useEffect(() => {
    initializeNativeApp();
  }, []);

  return (
  <ErrorBoundary>
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <GlobalProvider>
          <RTLWrapper>
            <TooltipProvider>
              <InstallPrompt />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <EnhancedConsentBanner />
                <AnalyticsListener />
                <FloatingCTA />
                <NewsletterModal delay={30000} scrollPercentage={60} />
                <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/fleet" element={
              <ProtectedRoute requiredRole="operator_admin">
                <Fleet />
              </ProtectedRoute>
            } />
            <Route path="/hazardous" element={
              <ProtectedRoute>
                <Hazardous />
              </ProtectedRoute>
            } />
            <Route path="/driver-checks" element={
              <ProtectedRoute>
                <DriverChecksPage />
              </ProtectedRoute>
            } />
            <Route path="/weighbridge" element={
              <ProtectedRoute>
                <WeighbridgePage />
              </ProtectedRoute>
            } />
            <Route path="/customer-portal" element={
              <ProtectedRoute requiredRole="operator_admin">
                <CustomerPortalPage />
              </ProtectedRoute>
            } />
            <Route path="/ai-classification" element={
              <ProtectedRoute>
                <AIClassification />
              </ProtectedRoute>
            } />
            <Route path="/ai-insights" element={
              <ProtectedRoute requiredRole="operator_admin">
                <AIInsights />
              </ProtectedRoute>
            } />
            <Route path="/ai-chatbot" element={
              <ProtectedRoute>
                <AIChatbotPage />
              </ProtectedRoute>
            } />
            <Route path="/maintenance-alerts" element={
              <ProtectedRoute requiredRole="operator_admin">
                <MaintenanceAlerts />
              </ProtectedRoute>
            } />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/ai-tools" element={<AITools />} />
            <Route path="/software" element={<Software />} />
            <Route path="/how-to-use" element={<HowToUse />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/waste-calculator" element={<WasteCalculator />} />
            <Route path="/incident-runbook" element={<ProtectedRoute requiredRole="admin"><IncidentRunbook /></ProtectedRoute>} />
            <Route path="/install" element={<Install />} />
            <Route path="/download" element={<Download />} />
            <Route path="/integration" element={<Integration />} />
            <Route path="/smart-integrations" element={<SmartIntegrations />} />
            <Route path="/about" element={<About />} />
            <Route path="/use-cases" element={<UseCases />} />
            <Route path="/global" element={<Global />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/data-processing" element={<DataProcessing />} />
            <Route path="/data-request" element={<DataRequest />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
            <Route path="/subcontractors" element={<ProtectedRoute><Subcontractors /></ProtectedRoute>} />
            <Route path="/live-tracking" element={<ProtectedRoute><LiveTracking /></ProtectedRoute>} />
            <Route path="/environmental" element={<ProtectedRoute><Environmental /></ProtectedRoute>} />
            <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
            <Route path="/credit-management" element={<ProtectedRoute><CreditManagement /></ProtectedRoute>} />
            <Route path="/stock" element={<ProtectedRoute><StockOverview /></ProtectedRoute>} />
            <Route path="/stock/depots" element={<ProtectedRoute><DepotsManagement /></ProtectedRoute>} />
            <Route path="/stock/materials" element={<ProtectedRoute><MaterialsCatalog /></ProtectedRoute>} />
            <Route path="/stock/movements" element={<ProtectedRoute><StockMovements /></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute><AggregateSales /></ProtectedRoute>} />
            <Route path="/purchases" element={<ProtectedRoute><PurchaseOrders /></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/api-docs" element={<ProtectedRoute><APIDocumentation /></ProtectedRoute>} />
            <Route path="/portal" element={<Portal />} />
            <Route path="/gdpr-compliance" element={<ProtectedRoute requiredRole="admin"><GDPRCompliance /></ProtectedRoute>} />
            <Route path="/data-anonymization" element={<ProtectedRoute requiredRole="admin"><DataAnonymization /></ProtectedRoute>} />
            <Route path="/weather" element={<ProtectedRoute><Weather /></ProtectedRoute>} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/quote-workflow" element={<ProtectedRoute><QuoteToJobWorkflow /></ProtectedRoute>} />
            <Route path="/muck-away-:city" element={<LocationPage />} />
            <Route path="/driver" element={<ProtectedRoute><DriverPage /></ProtectedRoute>} />
            
            {/* SEO Landing Pages - 50 pages */}
            <Route path="/muck-away-services" element={<SEOPage />} />
            <Route path="/grab-lorry-hire" element={<SEOPage />} />
            <Route path="/grabber-lorry-hire" element={<SEOPage />} />
            <Route path="/tipper-lorry-hire" element={<SEOPage />} />
            <Route path="/muck-away-prices" element={<SEOPage />} />
            <Route path="/muck-away-cost" element={<SEOPage />} />
            <Route path="/spoil-removal" element={<SEOPage />} />
            <Route path="/excavation-waste-removal" element={<SEOPage />} />
            <Route path="/soil-removal-service" element={<SEOPage />} />
            <Route path="/construction-waste-disposal" element={<SEOPage />} />
            <Route path="/inert-waste-disposal" element={<SEOPage />} />
            <Route path="/hazardous-waste-disposal" element={<SEOPage />} />
            <Route path="/contaminated-soil-disposal" element={<SEOPage />} />
            <Route path="/rubble-removal" element={<SEOPage />} />
            <Route path="/same-day-muck-away" element={<SEOPage />} />
            <Route path="/eight-wheeler-grab-hire" element={<SEOPage />} />
            <Route path="/grab-wagon-hire" element={<SEOPage />} />
            <Route path="/muck-away-near-me" element={<SEOPage />} />
            <Route path="/grab-hire-near-me" element={<SEOPage />} />
            <Route path="/skip-alternative" element={<SEOPage />} />
            <Route path="/waste-transfer-note" element={<SEOPage />} />
            <Route path="/waste-transfer-note-template" element={<SEOPage />} />
            <Route path="/digital-waste-transfer-notes" element={<SEOPage />} />
            <Route path="/waste-carrier-licence" element={<SEOPage />} />
            <Route path="/duty-of-care-waste" element={<SEOPage />} />
            <Route path="/ewc-codes" element={<SEOPage />} />
            <Route path="/hazardous-waste-regulations" element={<SEOPage />} />
            <Route path="/landfill-tax-rates" element={<SEOPage />} />
            <Route path="/waste-exemptions" element={<SEOPage />} />
            <Route path="/environment-agency-waste" element={<SEOPage />} />
            <Route path="/waste-hierarchy" element={<SEOPage />} />
            <Route path="/construction-waste-regulations" element={<SEOPage />} />
            <Route path="/site-waste-management-plan" element={<SEOPage />} />
            <Route path="/waste-carrier-check" element={<SEOPage />} />
            <Route path="/consignment-note-hazardous" element={<SEOPage />} />
            <Route path="/how-to-dispose-of-soil" element={<SEOPage />} />
            <Route path="/how-to-get-waste-carrier-licence" element={<SEOPage />} />
            <Route path="/how-to-fill-waste-transfer-note" element={<SEOPage />} />
            <Route path="/how-to-classify-waste" element={<SEOPage />} />
            <Route path="/how-to-dispose-hazardous-waste" element={<SEOPage />} />
            <Route path="/how-to-calculate-muck-away-cost" element={<SEOPage />} />
            <Route path="/how-to-hire-grab-lorry" element={<SEOPage />} />
            <Route path="/how-to-check-carrier-licence" element={<SEOPage />} />
            <Route path="/how-to-reduce-landfill-tax" element={<SEOPage />} />
            <Route path="/how-long-keep-waste-transfer-notes" element={<SEOPage />} />
            <Route path="/muck-away-for-builders" element={<SEOPage />} />
            <Route path="/muck-away-for-groundworkers" element={<SEOPage />} />
            <Route path="/muck-away-for-developers" element={<SEOPage />} />
            <Route path="/muck-away-for-landscapers" element={<SEOPage />} />
            <Route path="/muck-away-for-homeowners" element={<SEOPage />} />
            
            {/* Phase 9 SEO Pages - 50 Additional High-Intent Pages */}
            {/* Near-Me Pages (10) */}
            <Route path="/soil-removal-near-me" element={<SEOPage />} />
            <Route path="/spoil-removal-near-me" element={<SEOPage />} />
            <Route path="/rubble-removal-near-me" element={<SEOPage />} />
            <Route path="/tipper-hire-near-me" element={<SEOPage />} />
            <Route path="/construction-waste-near-me" element={<SEOPage />} />
            <Route path="/same-day-waste-collection-near-me" element={<SEOPage />} />
            <Route path="/cheap-muck-away-near-me" element={<SEOPage />} />
            <Route path="/licensed-waste-carrier-near-me" element={<SEOPage />} />
            <Route path="/waste-recycling-near-me" element={<SEOPage />} />
            <Route path="/grab-lorry-near-me" element={<SEOPage />} />
            
            {/* Comparison Pages (5) */}
            <Route path="/skip-hire-vs-grab-hire" element={<SEOPage />} />
            <Route path="/grab-lorry-vs-tipper" element={<SEOPage />} />
            <Route path="/muck-away-vs-skip" element={<SEOPage />} />
            <Route path="/waste-disposal-companies-comparison" element={<SEOPage />} />
            <Route path="/licensed-vs-unlicensed-carriers" element={<SEOPage />} />
            
            {/* Seasonal Pages (5) */}
            <Route path="/winter-muck-away-services" element={<SEOPage />} />
            <Route path="/spring-garden-clearance" element={<SEOPage />} />
            <Route path="/summer-construction-waste" element={<SEOPage />} />
            <Route path="/autumn-landscaping-waste" element={<SEOPage />} />
            <Route path="/year-end-site-clearance" element={<SEOPage />} />
            
            {/* Material-Specific Pages (10) */}
            <Route path="/clay-disposal-services" element={<SEOPage />} />
            <Route path="/chalk-removal-services" element={<SEOPage />} />
            <Route path="/sand-disposal" element={<SEOPage />} />
            <Route path="/gravel-removal" element={<SEOPage />} />
            <Route path="/topsoil-removal" element={<SEOPage />} />
            <Route path="/subsoil-disposal" element={<SEOPage />} />
            <Route path="/mixed-waste-disposal" element={<SEOPage />} />
            <Route path="/green-waste-removal" element={<SEOPage />} />
            <Route path="/asbestos-contaminated-soil" element={<SEOPage />} />
            <Route path="/concrete-crushing-recycling" element={<SEOPage />} />
            
            {/* Problem/Solution Pages (10) */}
            <Route path="/emergency-waste-removal" element={<SEOPage />} />
            <Route path="/site-clearance-before-deadline" element={<SEOPage />} />
            <Route path="/reduce-waste-disposal-costs" element={<SEOPage />} />
            <Route path="/contaminated-land-remediation" element={<SEOPage />} />
            <Route path="/fly-tipping-cleanup" element={<SEOPage />} />
            <Route path="/bulk-waste-discount" element={<SEOPage />} />
            <Route path="/restricted-access-collection" element={<SEOPage />} />
            <Route path="/weekend-waste-collection" element={<SEOPage />} />
            <Route path="/late-notice-muck-away" element={<SEOPage />} />
            <Route path="/waste-compliance-audit-prep" element={<SEOPage />} />
            
            {/* Tool/Calculator Pages (10) */}
            <Route path="/volume-to-tonnage-calculator" element={<SEOPage />} />
            <Route path="/muck-away-cost-estimator" element={<SEOPage />} />
            <Route path="/landfill-tax-calculator" element={<SEOPage />} />
            <Route path="/carbon-footprint-calculator" element={<SEOPage />} />
            <Route path="/grab-lorry-load-calculator" element={<SEOPage />} />
            <Route path="/waste-classification-tool" element={<SEOPage />} />
            <Route path="/ewc-code-lookup" element={<SEOPage />} />
            <Route path="/site-waste-estimator" element={<SEOPage />} />
            <Route path="/recycling-rate-calculator" element={<SEOPage />} />
            <Route path="/disposal-route-optimizer" element={<SEOPage />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </RTLWrapper>
        </GlobalProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
  </ErrorBoundary>
  );
};

export default App;
