import {
  KEEP_ARMS,
  LIVE_PIN,
  SOV_AUDIT_CLAIMS,
  SOV_AUDIT_RULING,
  SOV_AUDIT_SOURCE,
  type AuditVerdict,
} from "@/lib/sovExternalAudit";

const GROUPS: { verdict: AuditVerdict; label: string; hint: string }[] = [
  {
    verdict: "keep",
    label: "True — integrate",
    hint: "Already planted, or an honest gap we already named.",
  },
  {
    verdict: "stale",
    label: "Stale — replace with the living board",
    hint: "The brief mined an older payload. Quote GET /api/gspc.",
  },
  {
    verdict: "false",
    label: "False — do not build from this",
    hint: "The estate already exists, or the claim is not this product.",
  },
  {
    verdict: "forbidden",
    label: "Forbidden — do not ship",
    hint: "These manufacture a market or a stamp. They do not manufacture coverage.",
  },
];

export default function SovExternalAudit({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const dark = tone === "dark";
  const panel = dark
    ? "rounded-2xl border border-emerald-400/20 bg-emerald-950/40 p-4"
    : "rounded-2xl border border-slate-200 bg-white p-4";
  const title = dark ? "text-slate-100" : "text-slate-900";
  const body = dark ? "text-slate-300" : "text-slate-600";
  const muted = dark ? "text-emerald-300/80" : "text-emerald-800";
  const head = dark ? "text-emerald-300" : "text-slate-900";

  return (
    <section className="mt-12 space-y-8" data-testid="sov-external-audit" aria-labelledby="sov-audit-h">
      <div>
        <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${muted}`}>
          External form · Kimi brief · {SOV_AUDIT_SOURCE.dated}
        </p>
        <h2 id="sov-audit-h" className={`mt-2 text-xl font-bold ${head}`}>
          {SOV_AUDIT_RULING}
        </h2>
        <p className={`mt-3 text-sm ${body}`}>
          {SOV_AUDIT_SOURCE.title}. {SOV_AUDIT_SOURCE.role} Living pin: {LIVE_PIN.public_count},{" "}
          {LIVE_PIN.corrections} corrections, index {LIVE_PIN.index_schema}. Issuer {LIVE_PIN.issuer}.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {KEEP_ARMS.map((arm) => (
          <div key={arm.id} className={panel} data-testid={`sov-arm-${arm.id}`}>
            <h3 className={`font-semibold ${title}`}>{arm.title}</h3>
            <p className={`mt-2 text-sm ${body}`}>{arm.maps}</p>
          </div>
        ))}
      </div>

      <p className={`text-sm ${body}`}>
        Hugging Face record: user {LIVE_PIN.hf_user} — {LIVE_PIN.hf_datasets_listed} listed
        datasets, {LIVE_PIN.hf_spaces_listed} Spaces. Canonical board dataset{" "}
        <a href={`https://huggingface.co/datasets/${LIVE_PIN.board_dataset}`} className="underline">
          {LIVE_PIN.board_dataset}
        </a>
        . {LIVE_PIN.boards_alias_note} Planted MCP: {LIVE_PIN.mcp_planted}. {LIVE_PIN.x402}
      </p>

      {GROUPS.map((group) => {
        const rows = SOV_AUDIT_CLAIMS.filter((c) => c.verdict === group.verdict);
        return (
          <div key={group.verdict} data-testid={`sov-audit-${group.verdict}`}>
            <h3 className={`text-sm font-bold ${title}`}>{group.label}</h3>
            <p className={`mt-1 text-[13px] ${muted}`}>{group.hint}</p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {rows.map((row) => (
                <li key={row.id} className={panel} data-testid={`sov-claim-${row.id}`}>
                  <p className={`text-sm ${title}`}>{row.claim}</p>
                  <p className={`mt-2 text-[12px] ${muted}`}>Live: {row.live}</p>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
