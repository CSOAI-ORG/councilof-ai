import { CreditLimitManager } from '@/components/CreditLimitManager';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function CreditManagement() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Customer Credit Management</h1>
          <p className="text-muted-foreground mt-2">
            Set credit limits and manage payment terms for your customers
          </p>
        </div>
        <CreditLimitManager />
      </div>
    </DashboardLayout>
  );
}
