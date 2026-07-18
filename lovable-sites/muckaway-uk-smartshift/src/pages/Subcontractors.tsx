import { SubcontractorDirectory } from '@/components/SubcontractorDirectory';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function Subcontractors() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Subcontractor Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your network of trusted subcontractors and assign jobs
          </p>
        </div>
        <SubcontractorDirectory />
      </div>
    </DashboardLayout>
  );
}
