import { lazy, Suspense } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";

const HazardousConsignmentNote = lazy(() => import("@/components/HazardousConsignmentNote").then(m => ({ default: m.HazardousConsignmentNote })));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export default function Hazardous() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <Suspense fallback={<PageLoader />}>
          <HazardousConsignmentNote />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
