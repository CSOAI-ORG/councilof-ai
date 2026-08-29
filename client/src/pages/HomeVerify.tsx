import { useEffect } from "react";
import RecordVerifyForm from "@/components/gspc/RecordVerifyForm";
import { setMetaDescription } from "@/lib/utils";

/**
 * Front door for a stranger who was emailed a PDF and has no Claude.
 * Plugin/MCP is Council OS for people already in a tool. This page is verify.
 */
export default function HomeVerify() {
  useEffect(() => {
    document.title = "Verify an AI claim | councilof.ai";
    setMetaDescription(
      "Check an AI claim in your browser. Empty means we have not measured it — we do not guess. Free, no account. Not a certificate.",
    );
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:py-20" data-testid="home-verify">
      <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
        Check an AI claim in your browser. Or measure your own system.
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        Empty means we have not measured it — we do not guess.
      </p>
      <p className="mt-2 text-sm text-slate-500">Free. No account. Nothing you paste is sent to us.</p>

      <section className="mt-10" aria-labelledby="home-verify-h">
        <h2 id="home-verify-h" className="text-xl font-bold text-slate-900">
          Verify a signed card
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Paste it here. Three states: VALID, INVALID, UNCHECKABLE. Not a certificate.
        </p>
        <div className="mt-4">
          <RecordVerifyForm variant="light" />
        </div>
      </section>

      <p className="mt-12 text-sm text-slate-600">
        Already in Claude, Cursor, Kimi, or Grok? Add <code className="rounded bg-slate-100 px-1 font-mono text-[13px]">gspc</code>{" "}
        in that tool — that is Council OS for you. Four tools. No 23rd axis.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        MCP: <code className="rounded bg-slate-100 px-1 font-mono text-[13px]">https://councilof.ai/mcp</code>
        {" · "}
        <code className="rounded bg-slate-100 px-1 font-mono text-[13px]">grok plugin install CSOAI-ORG/council-of-ai-grok</code>
        {" — consent first; MCP stays off until you trust it."}
      </p>
    </main>
  );
}
