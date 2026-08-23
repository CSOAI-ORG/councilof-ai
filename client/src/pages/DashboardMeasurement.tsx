import DashboardLayout from "@/components/DashboardLayout";
import MeasurementHub from "@/components/hub/MeasurementHub";

export default function DashboardMeasurement() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Measurement hub</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Board, model rankings, and Eunomia routes — same data as Council OS, built for software users.
          </p>
        </div>
        <MeasurementHub />
      </div>
    </DashboardLayout>
  );
}
