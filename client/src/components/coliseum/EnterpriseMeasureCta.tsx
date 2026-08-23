import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { openLobby } from "@/lib/lobbyLink";

/**
 * EnterpriseMeasureCta — honest CTA for enterprise measurement.
 * Measurement, not certification. Council measures; fixers remediate.
 */
export default function EnterpriseMeasureCta() {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6">
      <h3 className="text-lg font-semibold text-emerald-900">Enterprise measurement</h3>
      <p className="mt-2 text-sm text-emerald-800/90">
        Batch assess your AI systems against the rules that govern them. Signed cards, not conformity marks.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button asChild className="bg-emerald-700 hover:bg-emerald-600">
          <Link href="/enterprise">Get measured</Link>
        </Button>
        <Button
          variant="outline"
          onClick={() => openLobby({ task: "enterprise-start", pane: "measured" })}
        >
          Ask in Council OS
        </Button>
      </div>
    </div>
  );
}
