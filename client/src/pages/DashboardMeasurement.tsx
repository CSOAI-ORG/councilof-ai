import DashboardLayout from "@/components/DashboardLayout";
import MeasurementHub from "@/components/hub/MeasurementHub";
import { Button } from "@/components/ui/button";
import { openLobby } from "@/lib/lobbyLink";
import CouncilOsInnerNav from "@/components/os/CouncilOsInnerNav";

export default function DashboardMeasurement() {
  return (
    <>
      <CouncilOsInnerNav title="Measurement hub" subtitle="Board, models, routes — same centre pane as Council OS" />
      <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Measurement hub</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Same board, models, and routes as Council OS — open the workspace for AG-UI chat and MCP tooling.
            </p>
          </div>
          <Button
            className="bg-emerald-600 hover:bg-emerald-500"
            onClick={() => openLobby({ pane: "board", task: "read-the-board" })}
          >
            Open Council OS workspace
          </Button>
        </div>
        <MeasurementHub />
      </div>
    </DashboardLayout>
    </>
  );
}
