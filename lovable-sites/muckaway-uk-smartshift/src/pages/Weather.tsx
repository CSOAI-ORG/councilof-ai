import { DashboardLayout } from '@/components/DashboardLayout';
import WeatherOperationsPanel from '@/components/WeatherOperationsPanel';

export default function Weather() {
  return (
    <DashboardLayout>
      <WeatherOperationsPanel />
    </DashboardLayout>
  );
}
