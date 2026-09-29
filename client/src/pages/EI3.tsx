import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

// 2026-09-28 (meok-boundary lane): this route used to be a product page for an
// emotional-intelligence substrate built by a separate business, MEOK AI Labs. It carried that
// product's name, a self-reported "consciousness" figure with no evidence file, a claim that
// 14 vendors had been benchmarked with no published run, and a vendor table that listed our own
// stack beside named companies. Council of AI measures; it does not host, sell or promote any
// system (memory csoai-vs-meok-boundary). The URL stays live so inbound links do not break;
// retiring it is an owner decision (sitemap withdrawal record).
// 2026-09-26: the per-vendor scores had no published ASSTI run behind them. Every score is
// UNMEASURED until a run is published. That remains true; no vendor is named here now.

export default function EI3() {
  useEffect(() => { document.title = "EI3: not a Council of AI measurement | Council of AI"; }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="container max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <Badge variant="outline" className="mb-4 border-gray-400 text-gray-700 dark:text-gray-300">
            Status: UNMEASURED
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            EI3
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            EI3 described an emotional-intelligence substrate built by a separate business. Council of AI
            measures AI systems. It does not host, sell or promote any system, including systems built by
            businesses that share its founder.
          </p>
        </div>
      </div>

      <div className="container max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">What this page no longer says</h2>
          <Card className="p-5 space-y-3 text-gray-700 dark:text-gray-300">
            <p>
              An earlier version of this page presented EI3 as a product, showed a self-reported figure for it
              with no evidence file behind it, and compared vendors on a self-state transparency index. No run of
              that index has been published, so no vendor has a result or a position on it here.
            </p>
            <p>
              EI3 is not a GSPC axis. It has no measurement on the board, and none is implied by this page.
            </p>
          </Card>
        </section>

        <section className="rounded-2xl border border-emerald-200 dark:border-emerald-900 p-6 sm:p-8 text-center">
          <Shield className="w-8 h-8 mx-auto mb-3 text-emerald-700 dark:text-emerald-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">What Council of AI does</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xl mx-auto">
            Describe the system. Get a signed card. Not a certificate. We do not remediate. Verification stays free.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="/board">
              <Button className="bg-emerald-700 text-white hover:bg-emerald-800">Read the board</Button>
            </a>
            <a href="/firewall-charter">
              <Button variant="outline">Measurement / remediation firewall</Button>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
