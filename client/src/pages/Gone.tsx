import { useEffect } from "react";
import { Link } from "wouter";

export default function Gone() {
  useEffect(() => {
    document.title = "410 Gone | CSOAI";
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50 flex items-center justify-center">
      <div className="text-center px-6 max-w-lg">
        <h1 className="text-5xl font-black text-emerald-400">410</h1>
        <p className="mt-4 text-xl font-semibold text-emerald-100">Gone</p>
        <p className="mt-2 text-emerald-100/70">
          This resource has been permanently removed and is no longer available.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400"
          >
            Return home
          </Link>
          <Link
            href="/gspc-arena"
            className="rounded-lg border border-emerald-500/40 px-5 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/10"
          >
            Visit the Arena
          </Link>
        </div>
      </div>
    </div>
  );
}
