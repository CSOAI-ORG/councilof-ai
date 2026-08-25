import DashboardLayout from "@/components/DashboardLayout";
import MeasurementHub from "@/components/hub/MeasurementHub";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { openLobby } from "@/lib/lobbyLink";
import CouncilOsInnerNav from "@/components/os/CouncilOsInnerNav";
import { Link } from "wouter";

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
        {/* DSH = OS: indices UNMEASURED tile — never invent scores here */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-amber-200/70 bg-amber-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Labour & AI-economy indices</CardTitle>
              <span className="text-[10px] font-mono uppercase tracking-wide text-amber-900/80">UNMEASURED</span>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI-economy · human-labour · humanoid-labour — contextual firewall only; never GSPC cell inputs.
                Same evidence as Council OS <code className="text-[10px]">/indices</code>.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/indices">Open /indices</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-amber-200/70 bg-amber-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">RWA attestation catalog</CardTitle>
              <span className="text-[10px] font-mono uppercase tracking-wide text-amber-900/80">UNMEASURED · Stage 2</span>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Honest Stage 2 targets — public artifacts only; measured_score null until custody + counsel gates.
                Attestation ≠ tokenization ≠ ownership. Same evidence as Council OS{" "}
                <code className="text-[10px]">GET /api/rwa-attestation</code>.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/products">Open products · RWA posture</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-emerald-200/60 bg-emerald-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Products catalog</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                HO.2 living catalog — registers honest, scores never sold. Option A on /powered-by.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/products">Open /products</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <MeasurementHub />
      </div>
    </DashboardLayout>
    </>
  );
}
