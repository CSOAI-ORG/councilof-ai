/**
 * /dashboard — Council OS. One workspace, one implementation.
 *
 * The shell (rail, crumbs, pane host) is DashboardLayout, which already promised in its
 * own source that "a tab renders its pane HERE; it never navigates out to the site" — it
 * was simply never mounted on /dashboard, which rendered a stat-card page that read no
 * tab at all. So Council OS existed twice: this shell, and a floating overlay behind a
 * badge. Same destinations, two builds, and the duplicate was the visible one.
 *
 * Chat is the main surface. A tab opens as a card above the conversation, and the thread
 * stays mounted underneath it.
 *
 * The previous stat-card dashboard is not deleted — it is a tab (?tab=software), so the
 * registered-systems and PDCA view is still reachable by anyone who was using it.
 */
import { lazy, Suspense } from "react";
import { useSearch } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import CouncilOsChat from "@/components/dashboard/CouncilOsChat";

const SoftwareDashboard = lazy(() => import("@/pages/Dashboard"));

export default function CouncilOs() {
  const search = useSearch();
  const tab =
    new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("tab") || "home";

  return (
    <DashboardLayout>
      {tab === "software" ? (
        <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
          <SoftwareDashboard />
        </Suspense>
      ) : (
        <CouncilOsChat />
      )}
    </DashboardLayout>
  );
}
