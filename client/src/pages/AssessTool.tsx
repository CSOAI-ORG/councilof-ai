import { FormEvent, useState } from "react";
import { CheckCircle2, ClipboardCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE: string =
  ((import.meta as any).env && (import.meta as any).env.VITE_ASSESS_API) || "";

type Receipt = {
  enquiry_id: string;
  state: "RECEIVED";
  operator_state: "PENDING_SCOPE";
  received_at: string;
  meaning: string;
};

const initial = {
  organization: "",
  contact_name: "",
  email: "",
  system: "",
  intended_use: "",
  evidence_needed: "",
  target_date: "",
  disclosure_preference: "undecided",
  endpoint: "",
};

export default function AssessTool() {
  const [form, setForm] = useState(initial);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = Boolean(
    form.organization && form.email && form.system && form.intended_use &&
    form.evidence_needed && form.target_date && form.disclosure_preference,
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready || loading) return;
    setLoading(true);
    setError(null);
    setReceipt(null);
    try {
      const response = await fetch(`${API_BASE}/api/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "measurement-enquiry", ...form }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.stored !== true || !body.receipt) {
        throw new Error(body.fallback || body.error || body.reason || `Intake unavailable (${response.status})`);
      }
      setReceipt(body.receipt);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The scope request was not received.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-2 flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-emerald-600" aria-hidden="true" />
        <h1 className="text-3xl font-black tracking-tight">Request a measurement scope</h1>
      </div>
      <p className="mb-3 text-muted-foreground">
        Tell us what must be measured and what evidence the relying party needs. A human reviews scope
        before any run or quote. Verification remains free; a grade is never sold.
      </p>
      <p className="mb-8 text-sm text-muted-foreground">
        Submitting this form creates an intake receipt only. It is not a booking, measurement, score,
        assurance conclusion, compliance decision, or certificate.
      </p>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" />Buyer scope</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm font-medium">
                Organization
                <input required className="w-full rounded-lg border px-3 py-2 font-normal" value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })} />
              </label>
              <label className="space-y-1 text-sm font-medium">
                Contact name
                <input className="w-full rounded-lg border px-3 py-2 font-normal" value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
              </label>
            </div>
            <label className="block space-y-1 text-sm font-medium">
              Work email
              <input required type="email" autoComplete="email" className="w-full rounded-lg border px-3 py-2 font-normal"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              System to measure
              <textarea required rows={2} className="w-full rounded-lg border px-3 py-2 font-normal"
                placeholder="Name, version, model or service boundary"
                value={form.system} onChange={(e) => setForm({ ...form, system: e.target.value })} />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              Intended use
              <textarea required rows={3} className="w-full rounded-lg border px-3 py-2 font-normal"
                placeholder="Who uses it, for what decision, and in which operating context?"
                value={form.intended_use} onChange={(e) => setForm({ ...form, intended_use: e.target.value })} />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              Evidence needed
              <textarea required rows={3} className="w-full rounded-lg border px-3 py-2 font-normal"
                placeholder="For example: GSPC behaviour cells, signed pack, Article 50 evidence, insurer or procurement record"
                value={form.evidence_needed} onChange={(e) => setForm({ ...form, evidence_needed: e.target.value })} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm font-medium">
                Evidence target date
                <input required type="date" className="w-full rounded-lg border px-3 py-2 font-normal" value={form.target_date}
                  onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
              </label>
              <label className="space-y-1 text-sm font-medium">
                Disclosure preference
                <select required className="w-full rounded-lg border px-3 py-2 font-normal" value={form.disclosure_preference}
                  onChange={(e) => setForm({ ...form, disclosure_preference: e.target.value })}>
                  <option value="undecided">Decide during scope</option>
                  <option value="private-pack">Private evidence pack</option>
                  <option value="public-card">Public signed card</option>
                </select>
              </label>
            </div>
            <label className="block space-y-1 text-sm font-medium">
              Endpoint or evidence room (optional)
              <input className="w-full rounded-lg border px-3 py-2 font-normal"
                placeholder="Recorded as text; not fetched by this form"
                value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} />
            </label>
            <Button type="submit" disabled={!ready || loading} className="w-full">
              {loading ? "Creating receipt…" : "Submit scope request"}
            </Button>
            {error && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">Not received: {error}</div>}
          </form>
        </CardContent>
      </Card>

      {receipt && (
        <Card className="mt-6 border-emerald-300 bg-emerald-50/60" aria-live="polite">
          <CardContent className="space-y-2 pt-6 text-sm">
            <p className="flex items-center gap-2 font-semibold text-emerald-900"><CheckCircle2 className="h-5 w-5" />Scope request received</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-muted-foreground">Receipt</dt><dd className="font-mono break-all">{receipt.enquiry_id}</dd>
              <dt className="text-muted-foreground">State</dt><dd>{receipt.state}</dd>
              <dt className="text-muted-foreground">Operator queue</dt><dd>{receipt.operator_state}</dd>
              <dt className="text-muted-foreground">Received</dt><dd>{receipt.received_at}</dd>
            </dl>
            <p className="text-muted-foreground">{receipt.meaning}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
