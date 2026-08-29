/**
 * NewHome-v3 — councilof.ai Homepage
 *
 * The homepage IS Council OS (same shell as /os). Chat is the front door.
 * Below the fold: verify widget + methodology one-liner. No govbench CTA.
 */
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import ToolStack from "../components/home/ToolStack";
import OsShell from "../components/os/OsShell";
import { type DoorId } from "../components/os/doors";
import LobbyVerifyPane from "../components/lobby/LobbyVerifyPane";

export default function NewHomeV3() {
  const [door, setDoor] = useState<DoorId>("board");
  return (
    <main className="surface-base">
      <OsShell variant="hero" door={door} onDoor={setDoor} />

      <section className="surface-raised section-y" aria-labelledby="home-verify-h">
        <div className="section-shell max-w-3xl">
          <h2 id="home-verify-h" className="text-2xl font-bold tracking-tight text-slate-900">
            Verify a card
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Paste never leaves this browser. VALID · INVALID · UNCHECKABLE. Not a certificate.
          </p>
          <div className="mt-6">
            <LobbyVerifyPane />
          </div>
          <p className="mt-6 text-sm text-slate-600">
            How we grade: no model in the verdict.{" "}
            <a href="/methodology" className="font-semibold text-emerald-800 hover:underline">
              Methodology
            </a>
            .
          </p>
        </div>
      </section>

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
