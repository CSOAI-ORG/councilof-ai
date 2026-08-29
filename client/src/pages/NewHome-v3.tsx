/**
 * NewHome-v3 — councilof.ai Homepage (OWNER STACK 2026-08-28)
 *
 * First paint is the instrument: H1 Council of AI, live totals from GET /api/gspc,
 * filled vs hollow cells from the payload, Verify first. OS is tertiary. Empty stays empty.
 *
 * HomeWorlds replaces the small CTA, white verify card, four-pill encore, and
 * XRPL/arena outcome tiles. HeroBoard is untouched.
 */
import ToolStack from "../components/home/ToolStack";
import HeroBoard from "../components/home/HeroBoard";
import HomeWorlds from "../components/home/HomeWorlds";
import LiveLeaderboard from "../components/board/LiveLeaderboard";
import { ChevronRight } from "lucide-react";

function LivingBoardSection() {
  return (
    <section className="surface-raised section-y">
      <LiveLeaderboard showHumanPanel={false} />
    </section>
  );
}

export default function NewHomeV3() {
  return (
    <main className="surface-base">
      <HeroBoard />
      <HomeWorlds />
      <LivingBoardSection />
      <ToolStack />

      <section className="surface-raised py-8">
        <div className="section-shell flex flex-wrap items-center justify-center gap-4 text-sm">
          <a
            href="/faq"
            className="inline-flex items-center gap-2 font-bold text-primary hover:underline"
          >
            Questions? See all FAQs <ChevronRight className="h-4 w-4" />
          </a>
          <span className="text-muted-foreground">·</span>
          <a
            href="/blog"
            className="inline-flex items-center gap-2 font-bold text-primary hover:underline"
          >
            News <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
