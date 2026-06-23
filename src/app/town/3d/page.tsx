import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SOV Town 3D — 47-Agent Governance Simulation",
  description:
    "Enter the living 47-agent AI town. Explore 9 districts, watch autonomous agents simulate EU AI Act and DORA compliance, and inspect the BFT council in 3D.",
  alternates: { canonical: "/town/3d" },
  robots: { index: true, follow: true },
};

export default function Town3DPage() {
  return (
    <div className="relative h-[calc(100dvh-64px)] w-full overflow-hidden bg-slate-950">
      <iframe
        src="/sov-town-3d/index.html"
        title="SOV Town 3D simulation"
        className="absolute inset-0 h-full w-full border-0"
        allow="fullscreen"
        loading="eager"
      />
    </div>
  );
}
