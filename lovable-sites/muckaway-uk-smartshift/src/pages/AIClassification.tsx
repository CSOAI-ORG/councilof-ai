import { lazy, Suspense } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";

const AISpoilClassifier = lazy(() => import("@/components/AISpoilClassifier"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export default function AIClassification() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <Suspense fallback={<PageLoader />}>
          <AISpoilClassifier />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
