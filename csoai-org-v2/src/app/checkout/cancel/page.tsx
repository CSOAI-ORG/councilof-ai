"use client";

import Link from "next/link";

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
      <div className="max-w-xl w-full text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 mx-auto mb-8 flex items-center justify-center text-3xl text-slate-400">
          ×
        </div>
        <h1 className="text-4xl font-black mb-4">Checkout cancelled</h1>
        <p className="text-slate-400 mb-8">
          No charge was made. The MCP pack is still available — come back any
          time.
        </p>
        <Link
          href="/mcp-packs"
          className="inline-block px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition"
        >
          Back to MCP Packs
        </Link>
      </div>
    </div>
  );
}
