"use client";

import { useEffect, useState } from "react";

export default function CountdownBadge() {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date("2026-08-02T00:00:00Z").getTime();
    const update = () => {
      const d = Math.max(0, Math.ceil((target - Date.now()) / 86_400_000));
      setDays(d);
    };
    update();
    const id = setInterval(update, 3_600_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-rose-400">
      {days === null ? (
        "Enforcement date: 2 August 2026"
      ) : (
        <>
          <span aria-hidden="true">⏰</span>
          {days} days until 2 August 2026 enforcement
        </>
      )}
    </span>
  );
}
