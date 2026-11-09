import { useState } from "react";
import { Link } from "wouter";
import { Calculator } from "lucide-react";
import { calculateCostScenario } from "../lib/costScenario";

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export default function ROICalculator() {
  const [inputs, setInputs] = useState({ annualSpend: 500000, reductionPercent: 0, oneTimeCost: 0, annualCost: 0 });
  const result = calculateCostScenario(inputs);
  const fields = [
    { key: "annualSpend" as const, label: "Current annual review cost (USD)", hint: "Use your organisation’s own cost baseline." },
    { key: "reductionPercent" as const, label: "Assumed reduction in that cost (%)", hint: "Your assumption. CSOAI has not measured a savings rate.", max: 100 },
    { key: "oneTimeCost" as const, label: "Assumed one-time delivery cost (USD)", hint: "Enter your estimate or an agreed quote. This is not a CSOAI price." },
    { key: "annualCost" as const, label: "Assumed annual ongoing cost (USD)", hint: "Include any recurring costs you expect." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="border-b bg-primary/5 py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <Calculator className="mb-5 h-9 w-9 text-primary" aria-hidden="true" />
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Cost scenario calculator</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">Explore a review-cost scenario using your own assumptions. The calculation does not predict savings, risk reduction or compliance outcomes from CSOAI’s work.</p>
        </div>
      </section>
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="inputs-heading" className="rounded-xl border p-6 sm:p-8">
            <h2 id="inputs-heading" className="text-2xl font-bold">Your assumptions</h2>
            <p className="mt-3 text-sm text-muted-foreground">The example baseline is editable. The reduction starts at zero; every cost entered here is an assumption.</p>
            <div className="mt-7 space-y-6">
              {fields.map(({ key, label, hint, max }) => (
                <div key={key}>
                  <label htmlFor={key} className="mb-2 block text-sm font-semibold">{label}</label>
                  <input id={key} name={key} type="number" min={0} max={max} step="any" value={inputs[key]} aria-describedby={key + "-hint"} className="w-full min-w-0 rounded-lg border bg-background px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" onChange={(event) => setInputs((prev) => ({ ...prev, [key]: Math.min(max ?? Number.MAX_SAFE_INTEGER, Math.max(0, Number(event.target.value) || 0)) }))} />
                  <p id={key + "-hint"} className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>
                </div>
              ))}
            </div>
          </section>
          <section aria-labelledby="results-heading" className="rounded-xl border bg-muted/30 p-6 sm:p-8">
            <h2 id="results-heading" className="text-2xl font-bold">Scenario result</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Calculated from the inputs at left, with a constant baseline and no discounting, inflation or tax adjustment. These are estimates under your assumptions.</p>
            <dl className="mt-7 space-y-5" aria-live="polite" aria-atomic="true">
              <div><dt className="text-sm text-muted-foreground">Assumed annual gross savings</dt><dd className="mt-1 text-3xl font-bold">{money(result.annualSavings)}</dd></div>
              <div><dt className="text-sm text-muted-foreground">Annual savings after ongoing cost</dt><dd className="mt-1 text-2xl font-semibold">{money(result.annualNetSavings)}</dd></div>
              <div><dt className="text-sm text-muted-foreground">Three-year net benefit</dt><dd className="mt-1 text-2xl font-semibold">{money(result.threeYearNetBenefit)}</dd></div>
              <div><dt className="text-sm text-muted-foreground">Three-year return on entered costs</dt><dd className="mt-1 text-2xl font-semibold">{result.threeYearROI === null ? "Not calculable — no cost entered" : result.threeYearROI.toFixed(1) + "%"}</dd></div>
            </dl>
            <details className="mt-7 border-t pt-5 text-sm">
              <summary className="cursor-pointer font-semibold">Inspect the calculation</summary>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
                <li>Annual gross savings = annual review cost × assumed reduction ÷ 100.</li>
                <li>Three-year costs = one-time cost + 3 × annual ongoing cost.</li>
                <li>Three-year net benefit = 3 × annual gross savings − three-year costs.</li>
                <li>Return = three-year net benefit ÷ three-year costs × 100. A zero cost leaves the return uncalculated.</li>
              </ul>
            </details>
          </section>
        </div>
        <section className="mt-12 rounded-xl border p-6 sm:p-8" aria-labelledby="next-heading">
          <h2 id="next-heading" className="text-2xl font-bold">Ground a decision in actual evidence</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">Review the published methods, scope a delivery and agree its cost before relying on a scenario. Verification of published evidence remains free.</p>
          <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold">
            <Link href="/methodology" className="text-primary underline underline-offset-4">Published methods</Link>
            <Link href="/claim-maintenance" className="text-primary underline underline-offset-4">Claim maintenance</Link>
            <Link href="/contact" className="text-primary underline underline-offset-4">Discuss a scope</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
