import { lazy, Suspense, useEffect } from "react";
import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { CouncilOsProvider } from "./contexts/CouncilOsContext";
import { OsChrome } from "./components/os/OsChrome";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { CouncilLobbyGate } from "./components/lobby/CouncilLobbyGate";
import { LoadingScreen } from "./components/LoadingScreen";
import { usePageMeta } from "./hooks/usePageMeta";
import { routes } from "./routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

function AppRoutes() {
  usePageMeta();
  return (
    <Switch>
      {routes.map(({ path, component: Component }) => (
        <Route key={path} path={path}>
          <Suspense fallback={<LoadingScreen />}>
            <Component />
          </Suspense>
        </Route>
      ))}
    </Switch>
  );
}

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add("coai-app");
    return () => document.documentElement.classList.remove("coai-app");
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <CouncilOsProvider>
              <TooltipProvider>
                <div className="flex min-h-screen flex-col bg-background text-foreground">
                  <SiteHeader />
                  <OsChrome />
                  <main id="main-content" className="flex-1">
                    <AppRoutes />
                  </main>
                  <SiteFooter />
                  <CouncilLobbyGate />
                </div>
                <Toaster />
              </TooltipProvider>
            </CouncilOsProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
