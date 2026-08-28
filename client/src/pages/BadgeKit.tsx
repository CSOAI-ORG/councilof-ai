import { useEffect } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

/**
 * /badge — one-line human kit. Full kit remains /embed (eaten, not duplicated).
 */
const SNIPPET = `<script async defer src="https://councilof.ai/embed.js"
        data-org="Your organisation"
        data-brand="#0B3D91"
        data-size="md"></script>`;

export default function BadgeKit() {
  useEffect(() => {
    document.title = "White-label badge — Council of AI";
    setMetaDescription(
      "Drop one script tag on your site. The badge reads the live Council of AI board and goes to verify. Measurement, not certification.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
          Council Verify · white-label
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">
          One line of HTML. Live board. Honest gap.
        </h1>
        <p className="mt-4 text-emerald-100/80 leading-relaxed">
          The script fetches <code className="text-emerald-300">GET /api/gspc</code> and
          paints the board’s own <code className="text-emerald-300">public_count</code>.
          If the board cannot be read it says unavailable — it never fabricates a
          number. Partner colour does not change the evidence.
        </p>

        <pre className="mt-8 overflow-x-auto rounded-xl border border-emerald-500/20 bg-[#05140d] p-4 font-mono text-[12px] leading-relaxed text-emerald-100/90">
          <code>{SNIPPET}</code>
        </pre>

        <p className="mt-6 text-sm text-emerald-100/70">
          Measurement, not certification. Council of AI is not a notified body.
          Verification is free forever.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/embed"
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400"
          >
            Full embed kit
          </Link>
          <Link
            href="/gspc-verify"
            className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-bold hover:bg-white/5"
          >
            Verify a card
          </Link>
          <a
            href="/api/embed"
            className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-bold hover:bg-white/5"
          >
            Machine JSON
          </a>
        </div>
      </main>
    </div>
  );
}
