/**
 * Honest banner on frozen LMS / certification-era pages.
 * Those routes stay (nothing is dropped). This points at the living product.
 */
export function FrozenRailBanner({ surface }: { surface: "course" | "credential" }) {
  const label =
    surface === "credential"
      ? "This page is the frozen credential rail. It attests course completion, not conformity, and it is not a living outcome record."
      : "This page is the frozen course rail. Completion ticks and Open Badges prove attendance, not a measured scenario against a living provision hash.";

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <strong>Frozen evidence layer.</strong> {label} Compliance stays with regulators and
          courts. We do not sell certification.
        </p>
        <a
          href="/live-training"
          className="shrink-0 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          Play the Art. 4 live sim
        </a>
      </div>
    </div>
  );
}
