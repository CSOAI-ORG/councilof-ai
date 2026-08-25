import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLocation, Route, Switch } from "wouter";
import { useEffect, Suspense, lazy } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { SectionLoader } from "./components/PageLoader";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { BottomEstateNav } from "./components/BottomEstateNav";
import WidgetLayout from "./components/widget/WidgetLayout";
import WidgetCourses from "./components/widget/WidgetCourses";
import WidgetCoursePlayer from "./components/widget/WidgetCoursePlayer";
import { SkipNavigation } from "./components/SkipNavigation";
import CouncilLobby from "./components/lobby/CouncilLobby";
import { AppMainRoutes } from "./AppMainRoutes";

const SovOS = lazy(() => import("./pages/SovOS"));
const DemoOS = lazy(() => import("./pages/DemoOS"));
const CouncilConsole = lazy(() => import("./components/CouncilConsole"));

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location]);
  return null;
}

const ROUTE_TITLES: Record<string, string> = {
  "/": "Council of AI — governance router + measurement harness",
  "/indices": "Labour & AI-economy indices — UNMEASURED first | CSOAI",
  "/products": "Products catalog — scores never sold | CSOAI",
  "/powered-by": "Powered by Council OS — white-label attestation | CSOAI",
  "/engine-axis": "Engine Axis — financial extension + labour candidacy | CSOAI",
};

function RouteTitle() {
  const [location] = useLocation();
  useEffect(() => {
    const t = ROUTE_TITLES[location];
    if (t) document.title = t;
  }, [location]);
  return null;
}

function WidgetRouter() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <WidgetLayout>
            <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center bg-[#03110b]"><SectionLoader /></div>}>
              <Switch>
                <Route path="/widget" component={WidgetCourses} />
                <Route path="/widget/course/:courseId" component={WidgetCoursePlayer} />
                <Route>
                  <div className="text-center py-12">
                    <h2 className="text-xl font-bold">Widget page not found</h2>
                  </div>
                </Route>
              </Switch>
            </Suspense>
          </WidgetLayout>
          <Toaster position="top-right" />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function App() {
  const [location] = useLocation();

  if (location.startsWith("/widget")) return <WidgetRouter />;

  if (location === "/sov-os" || location === "/council-os") {
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

  if (location === "/demo" || location === "/os-demo") {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Suspense fallback={<div className="grid h-[100dvh] place-items-center bg-[#04070d]"><SectionLoader /></div>}>
              <DemoOS />
            </Suspense>
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
          <TooltipProvider>
            <div className="flex min-h-screen flex-col pb-12">
              <SkipNavigation />
              <ScrollToTop />
              <RouteTitle />
              <Header />
              <main id="main-content" className="flex-1" role="main" aria-label="Main content" tabIndex={-1}>
                <AppMainRoutes />
              </main>
              <Footer />
              <BottomEstateNav />
              <Suspense fallback={null}><CouncilConsole /></Suspense>
              <CouncilLobby />
            </div>
            <Toaster position="top-right" />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
