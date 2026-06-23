"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading…</div>}>
      <SuccessInner />
    </Suspense>
  );
}

function SuccessInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
      <div className="max-w-xl w-full text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mx-auto mb-8 flex items-center justify-center text-3xl">
          ✓
        </div>
        <h1 className="text-4xl font-black mb-4">Payment received</h1>
        <p className="text-slate-400 mb-2">
          Your MCP pack is being provisioned. You will receive a license key and
          install instructions by email within the next 5 minutes.
        </p>
        {sessionId && (
          <p className="text-xs font-mono text-slate-600 mb-8">Session: {sessionId}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition"
          >
            Back to CSOAI
          </Link>
          <Link
            href="https://github.com/CSOAI-ORG"
            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition border border-white/10"
          >
            Browse Open Source
          </Link>
        </div>
        <p className="text-xs text-slate-500 mt-12">
          Need help? Reply to your order email or hit hello@meok.ai.
        </p>
      </div>
    </div>
  );
}
