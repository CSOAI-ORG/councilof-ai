import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pilots — CSOAI",
  description: "CSOAI pilots page. The AI governance platform.",
};

export default function PilotsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-4">Pilots</h1>
      <p className="text-muted-foreground mb-8">This page is part of the CSOAI V2 Master. The AI governance platform.</p>
      <div className="rounded-xl bg-card border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">CSOAI is the AI governance platform. 619 MCPs. 200+ regulators. 50+ frameworks. 33 Hives. 5 pilot kickoffs. 1 Mavis-7 license.</p>
        <a href="/check" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-semibold">Get the Article 50 Kit</a>
      </div>
    </div>
  );
}
