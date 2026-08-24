import { useEffect, useState } from "react";

/** True below Tailwind's `sm` breakpoint (640px). */
export function useNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.matchMedia("(min-width: 640px)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => setNarrow(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return narrow;
}
