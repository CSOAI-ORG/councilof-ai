import { useEffect, useState } from "react";

/**
 * Paid sign stays hidden while the living stamp is not a verified SIGNED state.
 * Confirm-before-sign is the only path if a stamp ever verifies; this pane
 * does not call the signer.
 */
export default function OsSignGate() {
  const [state, setState] = useState<"loading" | "UNCHECKABLE" | "SIGNED">("loading");

  useEffect(() => {
    let live = true;
    fetch("/api/cards", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((j) => {
        if (!live) return;
        const v = String(j?.board?.signature?.verification_state ?? "");
        setState(v === "VALID" || v === "SIGNED" || v === "VERIFIED" ? "SIGNED" : "UNCHECKABLE");
      })
      .catch(() => {
        if (live) setState("UNCHECKABLE");
      });
    return () => {
      live = false;
    };
  }, []);

  if (state === "SIGNED") {
    return (
      <p className="text-[11px] text-slate-600">
        Confirm-before-sign would apply here. This pane still does not call the signer.
      </p>
    );
  }

  return (
    <p data-testid="os-sign-hidden" className="text-[11px] text-slate-600">
      Paid sign is hidden — board stamp is {state === "loading" ? "unread" : "UNCHECKABLE"}.
      We will not sign until the board stamp verifies.
    </p>
  );
}
