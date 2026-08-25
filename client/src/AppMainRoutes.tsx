import { Suspense } from "react";
import { Switch, Route } from "wouter";
import { SectionLoader } from "./components/PageLoader";
import NotFound from "@/pages/NotFound";
import { AppRoutesA } from "./AppRoutesA";
import { AppRoutesB } from "./AppRoutesB";

/**
 * Full estate Switch — AppRoutesA + AppRoutesB from AppLazy.
 * Includes /indices /products /powered-by.
 * Do not use JSX spread on route arrays — Switch needs element children.
 */
export function AppMainRoutes() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-[#03110b]">
          <SectionLoader />
        </div>
      }
    >
      <Switch>
        {AppRoutesA()}
        {AppRoutesB()}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default AppMainRoutes;
