import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { openLobby } from "@/lib/lobbyLink";

/** CTA — enterprise measurement intake (not a certificate). */
export default function EnterpriseMeasureCta() {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm font-semibold text-emerald-900">Get measured</p>
      <p className="mt-1 text-xs text-emerald-800/80">
        Run an assessment against the rules that govern your system. Measurement, not certification.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" className="bg-emerald-700 hover:bg-emerald-600">
          <Link href="/assess">Open assess →</Link>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => openLobby({ task: "enterprise-start", pane: "measured" })}
        >
          Ask Council OS →
        </Button>
      </div>
    </div>
  );
}
