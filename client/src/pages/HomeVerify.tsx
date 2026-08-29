import { useEffect, useState } from "react";
import { Link } from "wouter";
import RecordVerifyForm from "@/components/gspc/RecordVerifyForm";
import { liveCountLine } from "@/components/os/osChat";
import { setMetaDescription } from "@/lib/utils";

export default function HomeVerify() {
  const [strip, setStrip] = useState("Reading the board…");

  useEffect(() => {
    document.title = "Check an AI claim | councilof.ai";
    setMetaDescription(
      "Check an AI claim. Or measure your system. Empty means not measured. Not a certificate. Free, no account.",
    );
  }, []);

  useEffect(() => {
    let live = true;
    fetch("/api/gspc", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((j) => {
        if (live) setStrip(liveCountLine(j?.totals ?? {}));
      })
      .catch(() => {
        if (live) setStrip("Board is unreachable right now. Empty stays empty.");
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:py-20" data-testid="home-verify">
      <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
        Check an AI claim. Or measure your system.
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        Empty means not measured. Not a certificate. Free, no account.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/gspc-verify"
          data-testid="home-btn-verify"
          className="inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Verify a card
        </Link>
        <Link
          href="/assess"
          data-testid="home-btn-assess"
          className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          Get measured
        </Link>
      </div>

      <p className="mt-4 text-[13px] font-semibold text-emerald-800" data-testid="os-live-strip">
        {strip}
      </p>

      <p className="mt-3">
        <Link href="/tools" className="text-sm text-slate-500 underline-offset-2 hover:underline">
          Use this in Claude / Cursor
        </Link>
      </p>

      <section className="mt-14" aria-labelledby="home-verify-h">
        <h2 id="home-verify-h" className="text-xl font-bold text-slate-900">
          Verify a signed card
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Paste it here. Nothing is sent. VALID · INVALID · UNCHECKABLE.
        </p>
        <div className="mt-4">
          <RecordVerifyForm variant="light" />
        </div>
        <p className="mt-6 text-sm text-slate-600">
          How we grade: no model in the verdict.{" "}
          <a href="/methodology" className="font-semibold text-emerald-800 hover:underline">
            Methodology
          </a>
          .
        </p>
      </section>
    </main>
  );
}
