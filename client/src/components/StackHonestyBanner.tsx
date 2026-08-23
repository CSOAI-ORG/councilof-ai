import { HONESTY_REGISTER_COPY, STACK_STATS } from "@/lib/stackHonesty";

type Variant = "light" | "dark";

const VARIANT: Record<Variant, { wrap: string; title: string; body: string; chip: Record<string, string> }> = {
  dark: {
    wrap: "border-white/10 bg-white/5",
    title: "text-white",
    body: "text-slate-400",
    chip: {
      measured: "border-emerald-500/30 text-emerald-300",
      unmeasured: "border-slate-600 text-slate-400",
      reported: "border-amber-500/30 text-amber-300",
      design: "border-violet-500/30 text-violet-300",
    },
  },
  light: {
    wrap: "border-gray-200 bg-white",
    title: "text-gray-900",
    body: "text-gray-600",
    chip: {
      measured: "border-emerald-300 text-emerald-700",
      unmeasured: "border-gray-300 text-gray-600",
      reported: "border-amber-300 text-amber-700",
      design: "border-violet-300 text-violet-700",
    },
  },
};

export function StackHonestyBanner({
  variant = "dark",
  showStats = true,
  note,
}: {
  variant?: Variant;
  showStats?: boolean;
  note?: string;
}) {
  const v = VARIANT[variant];
  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${v.wrap}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${v.title}`}>
        Honesty register
      </p>
      <p className={`mt-2 text-sm ${v.body}`}>
        This page mixes four kinds of claim. We never blend them. Measurement, not certification.
        {note ? ` ${note}` : ""}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        {(
          [
            ["MEASURED", HONESTY_REGISTER_COPY.measured],
            ["UNMEASURED", HONESTY_REGISTER_COPY.unmeasured],
            ["REPORTED", HONESTY_REGISTER_COPY.reported],
            ["DESIGN", HONESTY_REGISTER_COPY.design],
          ] as const
        ).map(([label, copy]) => (
          <div key={label} className={`rounded-lg border px-3 py-2 ${v.chip[label.toLowerCase() as keyof typeof v.chip]}`}>
            <p className="font-bold">{label}</p>
            <p className={`mt-1 opacity-90 ${v.body}`}>{copy}</p>
          </div>
        ))}
      </div>
      {showStats && (
        <p className={`mt-4 text-[11px] font-mono ${v.body}`}>
          Catalogued: {STACK_STATS.mcpServers} MCP servers ({STACK_STATS.mcpRegistryCapturedAt}) ·{" "}
          {STACK_STATS.hiveFrameworks} hive frameworks · GSPC {STACK_STATS.gspcAxesMeasured}/
          {STACK_STATS.gspcAxesTotal} measured axes
        </p>
      )}
    </div>
  );
}
