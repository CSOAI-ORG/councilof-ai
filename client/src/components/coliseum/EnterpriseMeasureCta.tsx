import { lobbyHref, openLobby } from "@/lib/lobbyLink";

/**
 * EnterpriseMeasureCta — opens Council OS with org context seeded.
 * Measurement + training loop — not certification.
 */
export default function EnterpriseMeasureCta({
  orgName,
  orgId,
  label = "Start enterprise measurement",
  className = "",
  variant = "primary",
}: {
  orgName?: string;
  orgId?: string;
  label?: string;
  className?: string;
  variant?: "primary" | "outline";
}) {
  const ctx = orgName || orgId || undefined;
  const base =
    variant === "primary"
      ? "rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-black text-[#03110b] hover:bg-emerald-300 transition"
      : "rounded-lg border border-emerald-400/40 px-4 py-2.5 text-sm font-bold text-emerald-100 hover:bg-white/5 transition";

  return (
    <a
      href={lobbyHref({ task: "enterprise-start", ctx, pane: "measured" })}
      className={`${base} ${className}`}
      onClick={(e) => {
        e.preventDefault();
        openLobby({ task: "enterprise-start", ctx, pane: "measured" });
      }}
    >
      {label} →
    </a>
  );
}
