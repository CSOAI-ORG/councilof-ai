import { DashboardLayout } from '@/components/DashboardLayout';
import { IntegrationHub } from '@/components/IntegrationHub';

export default function Integrations() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Integration Hub</h1>
          <p className="text-muted-foreground mt-2">
            Connect your tools and automate your workflow
          </p>
        </div>
        <IntegrationHub />
      </div>
    </DashboardLayout>
  );
}
