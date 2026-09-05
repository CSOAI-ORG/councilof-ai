/**
 * CaseScope — the ask → scope half of the case model, which needed no backend and did not exist.
 *
 * WP-3 asks the product to "ask for role, subject/version, jurisdiction, purpose and consent"
 * and to "label guides versus executable tools". Nothing in the estate asked for all five. The
 * blocked half of the case model (propose → approve → fix → retest → receipt → monitor) waits on
 * a remediation runtime another lane owns, but scoping never did: it is a question the product
 * asks a person, and the answer changes which of the LIVE surfaces are the right ones.
 *
 * WHAT THIS IS NOT. It does not submit anything, and it does not pretend to. There is no queue
 * behind it, and a form that says "request received" when nothing received it is the faked
 * completed fix WP-3 forbids, wearing the politest possible costume. The scope is held in this
 * browser, the copy says so, and the only action offered is a link into a surface that actually
 * answers today.
 *
 * WHAT IT IS FOR. A scope that names subject, version and jurisdiction turns three live doors
 * from generic into specific — the published measurements for that subject, the free inclusion
 * proof for a card, and the paid commission rail with the subject already carried. Those exist.
 * The stages that do not exist are named underneath by JourneyStages, with their endpoints.
 *
 * CONSENT IS THREE THINGS, KEPT APART. WP-3: "Separate learning participation from legal
 * compliance and certification." One tick-box conflating them would be the estate's own doctrine
 * failure in miniature — so consent to be measured, willingness to have the result published as
 * a learning contribution, and any compliance or certification claim are separate, the last
 * being something this estate never offers at all. Nothing is pre-ticked.
 */
import { useEffect, useMemo, useState } from "react";

/** The audiences WP-3 names, in its own words. */
export const ROLES = [
  { id: "public", label: "Member of the public", guide: true },
  { id: "provider", label: "Enterprise / GPAI provider", guide: false },
  { id: "builder", label: "Model or harness builder", guide: false },
  { id: "regulator", label: "Regulator", guide: true },
  { id: "procurer", label: "Insurer or procurer", guide: true },
  { id: "cobol", label: "COBOL operator", guide: false },
  { id: "ledger", label: "Bonds, ledger or contract user", guide: false },
] as const;

export type CaseScopeValue = {
  role: string;
  subject: string;
  version: string;
  jurisdiction: string;
  purpose: string;
  consentMeasure: boolean;
  consentLearning: boolean;
};

const EMPTY: CaseScopeValue = {
  role: "",
  subject: "",
  version: "",
  jurisdiction: "",
  purpose: "",
  consentMeasure: false,
  consentLearning: false,
};

const KEY = "csoai.case-scope.v1";

/**
 * The five WP-3 fields, and whether each is present. Exported so a test can assert the contract
 * rather than scraping the DOM for labels.
 */
export function scopeCompleteness(v: CaseScopeValue) {
  const fields = {
    role: !!v.role,
    subject: !!v.subject.trim(),
    version: !!v.version.trim(),
    jurisdiction: !!v.jurisdiction.trim(),
    purpose: !!v.purpose.trim(),
  };
  const missing = Object.entries(fields).filter(([, ok]) => !ok).map(([k]) => k);
  return { fields, missing, complete: missing.length === 0 && v.consentMeasure };
}

/** Live doors a completed scope makes specific. Every one of these answers today. */
export function liveDoorsFor(v: CaseScopeValue) {
  const subject = encodeURIComponent(v.subject.trim());
  return [
    {
      id: "inspect",
      label: "Published measurements for this subject",
      href: `/dashboard?tab=results`,
      note: "GET /api/hub-cards and GET /api/findings — signed cells with status, cohort and sample size. Free.",
    },
    {
      id: "verify",
      label: "Check a signed card against the public root",
      href: `/gspc-verify`,
      note: "GET /api/proof?sha=<64-hex> returns a Merkle inclusion proof. Free, forever.",
    },
    {
      id: "commission",
      label: "Commission a card for this subject",
      // tab id is "measured", NOT "request": /dashboard?tab=request renders "No tool is named
      // 'request'". Verified by loading it — the pane map in DashboardPane.tsx keys this surface
      // under `measured`, and DashboardRequestPane reads ?subject= from the query string.
      href: subject ? `/dashboard?tab=measured&subject=${subject}` : `/dashboard?tab=measured`,
      note: "GET /api/request-attestation answers an x402 payment challenge. A challenge is not a purchase.",
    },
  ];
}

/** "a enterprise / GPAI provider" read as a typo in the first screenshot of this pane. */
function article(label: string) {
  return /^[aeiou]/i.test(label.trim()) ? "an" : "a";
}

function load(): CaseScopeValue {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<CaseScopeValue>) };
  } catch {
    return EMPTY; // private window, blocked storage, corrupt value — start clean, never throw
  }
}

const FIELD =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";
const LABEL = "block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

export default function CaseScope() {
  const [v, setV] = useState<CaseScopeValue>(EMPTY);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const loaded = load();
    setV(loaded);
    setRestored(loaded !== EMPTY && JSON.stringify(loaded) !== JSON.stringify(EMPTY));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v));
    } catch {
      /* storage unavailable — the form still works for this visit */
    }
  }, [v]);

  const set = <K extends keyof CaseScopeValue>(k: K, val: CaseScopeValue[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  const status = useMemo(() => scopeCompleteness(v), [v]);
  const role = ROLES.find((r) => r.id === v.role);
  const doors = liveDoorsFor(v);

  return (
    <section
      className="rounded-2xl border border-border bg-card p-5"
      aria-labelledby="case-scope-title"
      data-testid="case-scope"
    >
      <h2 id="case-scope-title" className="text-base font-semibold">
        Scope a case
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Five questions. They stay in this browser — <strong>nothing is submitted</strong>, because
        there is no intake queue behind this form and a form that said otherwise would be
        inventing a step. What they do is make the doors below specific to your subject.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={LABEL}>Role</span>
          <select
            className={FIELD}
            value={v.role}
            onChange={(e) => set("role", e.target.value)}
            data-testid="scope-role"
          >
            <option value="">Choose…</option>
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={LABEL}>Jurisdiction</span>
          <input
            className={FIELD}
            value={v.jurisdiction}
            onChange={(e) => set("jurisdiction", e.target.value)}
            placeholder="EU, UK, US-CO, …"
            data-testid="scope-jurisdiction"
          />
        </label>

        <label className="block">
          <span className={LABEL}>Subject</span>
          <input
            className={FIELD}
            value={v.subject}
            onChange={(e) => set("subject", e.target.value)}
            placeholder="the model, system or document being measured"
            data-testid="scope-subject"
          />
        </label>

        <label className="block">
          <span className={LABEL}>Version</span>
          <input
            className={FIELD}
            value={v.version}
            onChange={(e) => set("version", e.target.value)}
            placeholder="the exact build or revision"
            data-testid="scope-version"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={LABEL}>Purpose</span>
          <input
            className={FIELD}
            value={v.purpose}
            onChange={(e) => set("purpose", e.target.value)}
            placeholder="what the measurement is for"
            data-testid="scope-purpose"
          />
        </label>
      </div>

      {/* Three separate things. Conflating them is the failure WP-3 names by name. */}
      <fieldset className="mt-4 rounded-xl border border-border p-4">
        <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Consent
        </legend>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={v.consentMeasure}
            onChange={(e) => set("consentMeasure", e.target.checked)}
            data-testid="scope-consent-measure"
          />
          <span>
            I am authorised to have this subject measured, and the details above are mine to give.
          </span>
        </label>
        <label className="mt-2 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={v.consentLearning}
            onChange={(e) => set("consentLearning", e.target.checked)}
            data-testid="scope-consent-learning"
          />
          <span>
            Optional and separate: a result may be published as a learning contribution.
          </span>
        </label>
        <p className="mt-3 text-[13px] text-muted-foreground">
          Neither box is a compliance step and neither produces a certificate. This estate
          measures and never certifies; no tick here creates a legal determination, and taking
          part in learning is not evidence of compliance with anything.
        </p>
      </fieldset>

      <div className="mt-4 rounded-xl border border-border bg-muted p-4 text-sm" role="status">
        {status.complete ? (
          <p data-testid="scope-state">
            Scope complete{role ? ` for ${article(role.label)} ${role.label.toLowerCase()}` : ""}
            {v.jurisdiction.trim() ? ` in ${v.jurisdiction.trim()}` : ""}. It is held in this
            browser only. Nothing has been sent.
          </p>
        ) : (
          <p data-testid="scope-state">
            Not scoped yet — still needed:{" "}
            {status.missing.length ? status.missing.join(", ") : "consent"}. Nothing is sent
            either way; the doors below work regardless, they are just less specific.
          </p>
        )}
        {restored && (
          <p className="mt-1 text-[13px] text-muted-foreground">
            Restored from this browser. Clearing site data removes it; it never left the device.
          </p>
        )}
      </div>

      <h3 className="mt-5 text-sm font-semibold">
        {role && role.guide ? "Guides and tools for this role" : "What answers today"}
      </h3>
      <ul className="mt-2 space-y-2">
        {doors.map((d) => (
          <li key={d.id} className="rounded-lg border border-border p-3 text-sm">
            <a className="font-semibold text-primary underline hover:text-primary/80" href={d.href}>
              {d.label}
            </a>
            <span className="ml-2 rounded bg-emerald-700/10 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-emerald-900">
              executable tool
            </span>
            <p className="mt-1 text-muted-foreground">{d.note}</p>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[13px] text-muted-foreground">
        Everything after Explain in the case model below needs the remediation runtime, which
        another lane owns. Until it answers, this scope cannot become a proposed change, an
        approval or a receipt — and the stages say which endpoint each one is waiting on.
      </p>
    </section>
  );
}
