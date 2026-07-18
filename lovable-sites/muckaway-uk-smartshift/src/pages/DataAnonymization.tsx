import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DashboardLayout } from '@/components/DashboardLayout';
import AnonymizationPanel from '@/components/AnonymizationPanel';

export default function DataAnonymization() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Data Anonymization</h1>
          <p className="text-muted-foreground">Permanently anonymize personal data for GDPR compliance</p>
        </div>
        <AnonymizationPanel />
      </div>
    </DashboardLayout>
  );
}
