import { EnvironmentalDashboard } from '@/components/EnvironmentalDashboard';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function Environmental() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Environmental & Sustainability</h1>
          <p className="text-muted-foreground mt-2">
            Track your environmental impact and generate sustainability reports
          </p>
        </div>
        <EnvironmentalDashboard />
      </div>
    </DashboardLayout>
  );
}
