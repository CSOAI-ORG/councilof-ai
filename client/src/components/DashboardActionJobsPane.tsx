import { useState } from "react";
import { AlertCircle, ArrowUpRight, LoaderCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PublicJob = {
  schema: "csoai.action-job-public/0.1";
  job: { job_id: string; action: { id: string; version: string }; purpose: string; submitted_at: string; submission_sha256: string; storage_mode: string };
  head: { revision: number; state: string; updated_at: string };
  events: { event_id: string; revision: number; state: string; purpose: string; reason: string; recorded_at: string; event_sha256: string }[];
  receipts: { receipt_id: string; revision: number; state: string; receipt_sha256: string; execution_started: false; provider_calls: false }[];
  execution_started: false;
  provider_calls: false;
  not_a_certification: true;
};

export default function DashboardActionJobsPane() {
  const [jobId, setJobId] = useState("");
  const [result, setResult] = useState<PublicJob | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "not-found" | "error">("idle");

  async function inspect(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = jobId.trim();
    if (!/^job_[0-9a-f]{40}$/.test(id)) {
      setResult(null);
      setState("error");
      return;
    }
    setState("loading");
    setResult(null);
    try {
      const response = await fetch(`/api/action-jobs?public=1&job_id=${encodeURIComponent(id)}`, {
        headers: { accept: "application/json" },
        cache: "no-store",
      });
      if (response.status === 404) return setState("not-found");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.json() as PublicJob;
      if (body.schema !== "csoai.action-job-public/0.1" || body.job.job_id !== id) throw new Error("record shape mismatch");
      setResult(body);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 p-5 sm:p-8" data-testid="dashboard-action-jobs">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Shared job record</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Inspect a public job</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Paste the opaque job ID returned by an authorized submission. This view and the MCP <code>get_public_action_job</code> tool read the same public projection.</p>
      </header>
      <Card>
        <CardHeader><CardTitle className="text-base">Find a released record</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={inspect} className="flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="public-action-job-id">Job ID</label>
            <Input id="public-action-job-id" value={jobId} onChange={(event) => setJobId(event.target.value)} placeholder="job_ followed by 40 lowercase hex characters" autoComplete="off" spellCheck={false} />
            <Button type="submit" disabled={state === "loading"}>
              {state === "loading" ? <LoaderCircle className="animate-spin" /> : <Search />}
              Inspect
            </Button>
          </form>
          {state === "not-found" && <p role="status" className="mt-3 text-sm text-slate-600">No public record found. It may not exist, or its submitter did not consent to public release.</p>}
          {state === "error" && <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-rose-700"><AlertCircle className="h-4 w-4" />Enter a valid job ID or retry when the ledger is available.</p>}
        </CardContent>
      </Card>
      {result && <Card data-testid="public-action-job-result">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div><p className="font-mono text-xs text-slate-500">{result.job.job_id}</p><CardTitle className="mt-2 text-xl">{result.job.action.id} · {result.head.state}</CardTitle></div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">Revision {result.head.revision}</span>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-700">{result.job.purpose}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-500">Submitted</p><p className="mt-1 text-sm">{new Date(result.job.submitted_at).toLocaleString()}</p></div>
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-500">Record digest</p><p className="mt-1 break-all font-mono text-xs">{result.job.submission_sha256}</p></div>
          </div>
          <ol className="space-y-2" aria-label="Job history">
            {result.events.map((event) => <li key={event.event_id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{event.state}</strong><time className="text-xs text-slate-500">{new Date(event.recorded_at).toLocaleString()}</time></div>
              <p className="mt-1 text-sm">{event.reason}</p>
              <p className="mt-2 break-all font-mono text-[11px] text-slate-500">{event.event_sha256}</p>
            </li>)}
          </ol>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            This record tracks reviewed intent and reported state only. No work was automatically executed; no provider was called. A job record is not a measurement or certification.
          </div>
          <a className="inline-flex items-center gap-1 text-sm font-medium text-emerald-800 underline underline-offset-4" href={`https://councilof.ai/mcp`} target="_blank" rel="noreferrer">Open the MCP endpoint <ArrowUpRight className="h-4 w-4" /></a>
        </CardContent>
      </Card>}
    </main>
  );
}
