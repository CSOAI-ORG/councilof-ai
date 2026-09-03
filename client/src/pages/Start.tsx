/**
 * /start — the end-user dashboard.
 *
 * The estate has 494 routes and 70 of them are reachable from the nav. A person who
 * has to comply with the AI Act, or who wants to check a claim someone made about a
 * model, does not have a route through that. This page is the route: four questions,
 * in the order a stranger actually asks them.
 *
 *   1. What already binds me, and what is coming?   GET /api/regulation
 *   2. Is this claim real?                          client-side Ed25519, nothing sent
 *   3. What have you actually measured?             GET /api/gspc
 *   4. How do I get measured?                       POST /api/lead
 *
 * DOCTRINE. Every number here is read at load time from a published artefact. Nothing
 * is typed in, and nothing is invented while loading or on failure: a section that
 * cannot read its source says so and shows nothing rather than a plausible placeholder.
 * We measure; we do not certify, and this page sells no grade.
 *
 * Light surface on purpose — the marketing header is light, and pages that ship their
 * own dark theme under it are why the estate reads as two different products.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import RecordVerifyForm from "@/components/gspc/RecordVerifyForm";

type Deadline = {
  date: string;
  instrument: string;
  what: string;
  basis: string;
  status: string;
  penalty_exposure?: string;
};

type Axis = {
  axis: string;
  bench: string;
  task: string;
  n: number;
  status: string;
  separation?: string;
};

type Totals = { axes: number; measured_axes: number; unmeasured_axes: number };

const DAY = 86_400_000;

function daysUntil(iso: string): number {
  const then = Date.parse(iso + "T00:00:00Z");
  if (Number.isNaN(then)) return NaN;
  return Math.round((then - Date.now()) / DAY);
}

function useJson<T>(url: string, pick: (raw: any) => T) {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((raw) => { if (live) setData(pick(raw)); })
      .catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
  return { data, failed };
}

/** Says what could not be read, rather than rendering an empty section that looks measured. */
function SourceDown({ what }: { what: string }) {
  return (
    <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Could not read {what} just now. Nothing is shown rather than a number we cannot source.
      Reload, or read it directly at the endpoint linked above.
    </p>
  );
}

function Section({
  n, title, blurb, children,
}: { n: number; title: string; blurb: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-200 py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Step {n}
          </span>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-slate-600">{blurb}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

/* ── 1. Deadlines ─────────────────────────────────────────────────────────── */

function Deadlines() {
  const { data, failed } = useJson<Deadline[]>("/api/regulation", (r) => r.deadlines ?? []);
  if (failed) return <SourceDown what="the regulation feed" />;
  if (!data) return <p className="text-sm text-slate-500">Reading the regulation feed…</p>;

  const dated = data
    .map((d) => ({ ...d, days: daysUntil(d.date) }))
    .filter((d) => !Number.isNaN(d.days));
  const upcoming = dated.filter((d) => d.days > 0).sort((a, b) => a.days - b.days);
  const inForce = dated.filter((d) => d.days <= 0).sort((a, b) => b.days - a.days);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Already in force — {inForce.length}
        </h3>
        <ul className="space-y-2">
          {inForce.slice(0, 4).map((d) => (
            <li key={d.date + d.what} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-mono text-sm text-slate-500">{d.date}</span>
                <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">
                  IN FORCE
                </span>
                <span className="text-xs text-slate-500">{d.instrument}</span>
              </div>
              <p className="mt-1 text-slate-900">{d.what}</p>
              {d.penalty_exposure && (
                <p className="mt-1 text-sm text-slate-600">Exposure: {d.penalty_exposure}</p>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Coming — {upcoming.length}
        </h3>
        <ul className="space-y-2">
          {upcoming.slice(0, 5).map((d) => (
            <li key={d.date + d.what} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-mono text-sm text-slate-500">{d.date}</span>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                  {d.days} days
                </span>
                <span className="text-xs text-slate-500">{d.instrument}</span>
              </div>
              <p className="mt-1 text-slate-900">{d.what}</p>
              {d.penalty_exposure && (
                <p className="mt-1 text-sm text-slate-600">Exposure: {d.penalty_exposure}</p>
              )}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-slate-500">
        Read every date, with its legal basis, on the{" "}
        <Link href="/ai-act-timeline" className="font-medium text-emerald-700 underline">
          full timeline
        </Link>{" "}
        — or take the feed itself at{" "}
        <a href="/api/regulation" className="font-mono text-emerald-700 underline">/api/regulation</a>.
      </p>
    </div>
  );
}

/* ── 2. Verify ────────────────────────────────────────────────────────────── */

function CheckAClaim() {
  const [seed, setSeed] = useState<string | undefined>();
  const [nonce, setNonce] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /** Loads a real published card so the tool can be exercised without owning one.
   *  The box stays editable — this fills it, it never locks it. */
  async function loadSample() {
    setLoading(true);
    setErr(null);
    try {
      const idx = await fetch("/signed/card_index.json").then((r) => r.json());
      const cards: { card_url?: string }[] = idx.cards ?? [];
      const withUrl = cards.filter((c) => c.card_url);
      if (!withUrl.length) throw new Error("no card in the published index");
      const pick = withUrl[Math.floor(Math.random() * withUrl.length)];
      const card = await fetch(pick.card_url!).then((r) => r.json());
      setSeed(JSON.stringify(card, null, 2));
      setNonce((n) => n + 1);
    } catch {
      setErr("Could not load a sample card. The verifier still works if you paste your own.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={loadSample}
          disabled={loading}
          className="min-h-[44px] rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-40"
        >
          {loading ? "Loading a card…" : "Load a real signed card"}
        </button>
        <span className="text-sm text-slate-600">
          Don't have one? This fetches a published card so you can watch the check run.
        </span>
      </div>
      {err && <p className="text-sm text-amber-800">{err}</p>}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <RecordVerifyForm variant="light" seed={seed} seedNonce={nonce} />
      </div>

      <p className="text-sm text-slate-500">
        The signature is recomputed in your browser against the published key. Nothing is
        uploaded, and you do not need an account. A pass means the bytes match what was
        signed — it is not a certificate, and it is not a safety guarantee.
      </p>
    </div>
  );
}

/* ── 3. What we measured ──────────────────────────────────────────────────── */

function Measured() {
  const { data, failed } = useJson<{ axes: Axis[]; totals: Totals }>("/api/gspc", (r) => ({
    axes: r.axes ?? [],
    totals: r.totals,
  }));
  if (failed) return <SourceDown what="the measurement board" />;
  if (!data) return <p className="text-sm text-slate-500">Reading the board…</p>;

  const { axes, totals } = data;
  return (
    <div className="space-y-5">
      <p className="text-slate-700">
        <strong className="text-slate-900">
          {totals.measured_axes} of {totals.axes}
        </strong>{" "}
        published axes carry a real measurement.
        {totals.unmeasured_axes > 0 && (
          <> {totals.unmeasured_axes} are declared and still unmeasured — they stay listed, empty.</>
        )}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-4 font-semibold">What it asks</th>
              <th className="py-2 pr-4 font-semibold">Axis</th>
              <th className="whitespace-nowrap py-2 pr-4 text-right font-semibold">Cases</th>
              <th className="py-2 font-semibold">State</th>
            </tr>
          </thead>
          <tbody>
            {axes.map((a) => (
              <tr key={a.axis} className="border-b border-slate-100">
                <td className="py-2 pr-4 text-slate-900">{a.task || "—"}</td>
                <td className="py-2 pr-4 font-mono text-xs text-slate-600">{a.axis}</td>
                <td className="py-2 pr-4 text-right font-mono text-slate-700">{a.n ?? "—"}</td>
                <td className="py-2">
                  <span
                    className={
                      "inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-bold " +
                      (a.status === "MEASURED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600")
                    }
                  >
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-slate-500">
        Counts are read from <a href="/api/gspc" className="font-mono text-emerald-700 underline">/api/gspc</a>{" "}
        at load time and are never typed into this page. Where a leader would be one of our own
        models, no leader is named.
      </p>
    </div>
  );
}

/* ── 4. Get measured ──────────────────────────────────────────────────────── */

function GetMeasured() {
  const [form, setForm] = useState({ name: "", email: "", org: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "err">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setMsg(null);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, wants: "measurement_enquiry" }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `Could not send (${res.status})`);
      if (j.stored === false) {
        // Never claim a kept enquiry when the endpoint says it kept nothing.
        setState("err");
        setMsg(j.fallback || "Not stored — email nicholas@csoai.org and we will pick it up there.");
        return;
      }
      setState("sent");
    } catch (e: any) {
      setState("err");
      setMsg(e.message || "Could not send that. Email nicholas@csoai.org instead.");
    }
  }

  if (state === "sent")
    return (
      <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-900" role="status">
        Got it — your enquiry is saved and a person will reply. Nothing else happens with your
        details: no list, no enrichment, no third party.
      </p>
    );

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Your name</span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Organisation</span>
          <input
            value={form.org}
            onChange={(e) => setForm({ ...form, org: e.target.value })}
            className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Email <span className="text-slate-400">(required)</span>
        </span>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        />
      </label>
      <button
        type="submit"
        disabled={state === "sending" || !form.email.includes("@")}
        className="min-h-[44px] rounded-lg bg-emerald-700 px-5 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-40"
      >
        {state === "sending" ? "Sending…" : "Ask to be measured"}
      </button>
      {msg && <p className="text-sm text-amber-800">{msg}</p>}
      <p className="text-sm text-slate-500">
        Measurement is a paid, signed run and booking is not yet live — this puts you in the
        queue and a person replies. Verification stays free forever, and a grade is never sold.
      </p>
    </form>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

export default function Start() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Start here · free · no account
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Work out what applies to you, then check whether a claim is real.
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-600">
            Four steps. The dates come from the statute, the measurements come from published
            runs, and the signature check happens in your browser — nothing you paste is sent
            anywhere.
          </p>
        </div>
      </header>

      <Section
        n={1}
        title="What binds you, and when"
        blurb="Live from the regulation feed, with the legal basis and the penalty exposure attached to each date."
      >
        <Deadlines />
      </Section>

      <Section
        n={2}
        title="Check a claim"
        blurb="Anyone can check any signed card against the published key. Free, offline, and no account — including cards we did not issue."
      >
        <CheckAClaim />
      </Section>

      <Section
        n={3}
        title="What we have measured"
        blurb="Every published axis, what it asks, and how many cases sit behind it. Where nothing has been measured, the row says so."
      >
        <Measured />
      </Section>

      <Section
        n={4}
        title="Get your own system measured"
        blurb="An independent, signed measurement run. We measure and sign the evidence; regulators and accredited bodies decide."
      >
        <GetMeasured />
      </Section>

      <div className="border-t border-slate-200 py-10 text-center">
        <p className="text-sm text-slate-500">
          Measurement, not certification. We issue no conformity mark.{" "}
          <Link href="/honesty" className="font-medium text-emerald-700 underline">
            What we cannot yet measure
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
