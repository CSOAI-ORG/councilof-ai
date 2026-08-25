import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { SectionLoader } from "./components/PageLoader";
import NotFound from "@/pages/NotFound";

const IndicesHub = lazy(() => import("./pages/IndicesHub"));
const Products = lazy(() => import("./pages/Products"));
const PoweredBy = lazy(() => import("./pages/PoweredBy"));
const EngineAxis = lazy(() => import("./pages/EngineAxis"));
const NewHomeV3 = lazy(() => import("./pages/NewHome-v3"));
const GspcScoreboard = lazy(() => import("./pages/GspcScoreboard"));
const Competitors = lazy(() => import("./pages/Competitors"));
const Payg = lazy(() => import("./pages/Payg"));
const InstrumentsCatalog = lazy(() => import("./pages/InstrumentsCatalog"));
const EastWest = lazy(() => import("./pages/EastWest"));
const AgentRunbook = lazy(() => import("./pages/AgentRunbook"));
const ApiDocs = lazy(() => import("./pages/ApiDocs"));

/**
 * Critical estate routes including /indices /products /powered-by.
 * Full AppRoutesA/B catalog lands in follow-up commits when MCP payload allows.
 */
export function AppMainRoutes() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center bg-[#03110b]"><SectionLoader /></div>}>
      <Switch>
        <Route path="/" component={NewHomeV3} />
        <Route path="/indices/:slug" component={IndicesHub} />
        <Route path="/indices" component={IndicesHub} />
        <Route path="/products" component={Products} />
        <Route path="/powered-by" component={PoweredBy} />
        <Route path="/white-label" component={PoweredBy} />
        <Route path="/engine-axis" component={EngineAxis} />
        <Route path="/gspc-scoreboard" component={GspcScoreboard} />
        <Route path="/competitors" component={Competitors} />
        <Route path="/battlecards" component={Competitors} />
        <Route path="/payg" component={Payg} />
        <Route path="/instruments" component={InstrumentsCatalog} />
        <Route path="/east-west/*?" component={EastWest} />
        <Route path="/east-west" component={EastWest} />
        <Route path="/agent-runbook" component={AgentRunbook} />
        <Route path="/api-docs" component={ApiDocs} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default AppMainRoutes;
