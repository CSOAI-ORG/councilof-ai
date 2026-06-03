import { lazy, Suspense } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";

const AIChatbot = lazy(() => import("@/components/AIChatbot"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export default function AIChatbotPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <Suspense fallback={<PageLoader />}>
          <AIChatbot />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
