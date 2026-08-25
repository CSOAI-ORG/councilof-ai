import { Suspense } from "react";
import { Switch, Route } from "wouter";
import SectionLoader from "@/components/SectionLoader";
import NotFound from "@/pages/NotFound";
import { AppRoutesA } from "./AppRoutesA";
import { AppRoutesB } from "./AppRoutesB";

export function AppMainRoutes() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center bg-[#03110b]"><SectionLoader /></div>}>
      <Switch>
        {...AppRoutesA()}
        {...AppRoutesB()}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}
