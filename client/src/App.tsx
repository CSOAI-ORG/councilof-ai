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
import { BottomEstateNav } from "./components/BottomEstateNav";
import WidgetLayout from "./components/widget/WidgetLayout";
import WidgetCourses from "./components/widget/WidgetCourses";
import WidgetCoursePlayer from "./components/widget/WidgetCoursePlayer";
import { SkipNavigation } from "./components/SkipNavigation";
const Landing = lazy(() => import("./pages/Landing"));
const CouncilConsole = lazy(() => import("./components/CouncilConsole"));
import CouncilLobby from "./components/lobby/CouncilLobby";
const PoweredBy = lazy(() => import("./pages/PoweredBy"));
const Payg = lazy(() => import("./pages/Payg"));
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <Switch>
          <Route path="/powered-by" component={PoweredBy} />
          <Route path="/white-label" component={PoweredBy} />
          <Route path="/payg" component={Payg} />
          <Route path="/" component={Landing} />
          <Route component={NotFound} />
        </Switch>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
