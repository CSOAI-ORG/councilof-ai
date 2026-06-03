import { lazy, Suspense } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";

const FleetManagement = lazy(() => import("@/components/FleetManagement").then(m => ({ default: m.FleetManagement })));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export default function Fleet() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <Suspense fallback={<PageLoader />}>
          <FleetManagement />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
