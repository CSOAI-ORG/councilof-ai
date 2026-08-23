import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { usePageView } from "@/hooks/usePageView";
import { useOsChrome } from "@/hooks/useOsChrome";
import { useLobby } from "@/hooks/useLobby";
import CouncilLobby from "@/components/lobby/CouncilLobby";
import DashboardLayout from "@/components/DashboardLayout";
import GlobalSearch from "@/components/GlobalSearch";
import FooterSiteMap from "@/components/nav/FooterSiteMap";
import SiteHeader from "@/components/nav/SiteHeader";
import { lazyRoute } from "@/lib/lazyRoute";
import { ROUTES } from "@/routes";

const Home = lazyRoute(() => import("@/pages/Home"));
const NotFound = lazyRoute(() => import("@/pages/NotFound"));

/**
 * App shell — site header + main column + footer always visible.
 * Council OS opens as a right dock (LobbyOverlay); it never replaces the page.
 */
export default function App() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const lobby = useLobby();
  usePageView();
  useOsChrome(lobby.open);

  useEffect(() => {
    document.documentElement.dataset.route = location || "/";
  }, [location]);

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <SiteHeader onOpenOs={lobby.openLobby} osOpen={lobby.isOpen} />
      <GlobalSearch />
      <main id="main-content" className="coai-main" tabIndex={-1}>
        <Switch>
          <Route path="/" component={Home} />
          {ROUTES.map((r) => (
            <Route key={r.path} path={r.path} component={r.component} />
          ))}
          {isAuthenticated && (
            <Route path="/dashboard/:rest*">
              <DashboardLayout />
            </Route>
          )}
          <Route component={NotFound} />
        </Switch>
      </main>
      <FooterSiteMap />
      {lobby.isOpen && (
        <CouncilLobby onClose={lobby.closeLobby} intent={lobby.intent} />
      )}
    </>
  );
}
