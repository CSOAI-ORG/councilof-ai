import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DashboardLayout } from '@/components/DashboardLayout';
import GDPRRetentionDashboard from '@/components/GDPRRetentionDashboard';

export default function GDPRCompliance() {
  return (
    <DashboardLayout>
      <GDPRRetentionDashboard />
    </DashboardLayout>
  );
}
