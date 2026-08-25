import { Switch, Route } from "wouter";
import { AppRoutesA } from "./AppRoutesA";
import { AppRoutesB } from "./AppRoutesB";
import NotFound from "@/pages/NotFound";

/** Composes AppRoutesA + AppRoutesB + terminal NotFound. */
export function AppMainRoutes() {
  return (
    <Switch>
      <AppRoutesA />
      <AppRoutesB />
      <Route component={NotFound} />
    </Switch>
  );
}

export default AppMainRoutes;
