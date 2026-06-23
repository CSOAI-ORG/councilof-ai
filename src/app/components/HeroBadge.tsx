"use client";

import { useEffect, useState } from "react";

function daysUntil(iso: string): number {
  const now = new Date();
  const target = new Date(iso);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
}

export default function HeroBadge() {
  const [days, setDays] = useState(() => daysUntil("2026-08-02"));

  useEffect(() => {
    const t = setInterval(() => setDays(daysUntil("2026-08-02")), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 mb-8 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 tracking-widest uppercase">
      🚨 EU AI ACT Article 50 — {days} Days Left
    </div>
  );
}
