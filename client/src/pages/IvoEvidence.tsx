import { useEffect } from "react";
import { setMetaDescription } from "@/lib/utils";

/**
 * /ivo-evidence — What an IVO's evidence should look like.
 *
 * Position paper for California SB 813 rulemaking (Chapter 179, signed Sep 9, 2026).
 * Also usable as: Anthropic/OpenAI embedded-evaluator access request artifact,
 * NIST exhibit, general evidence-standards reference.
 *
 * SB 813 §8898.1(c)(2) sets four criteria for IVO designation:
 *   (A) Assessing risks + identifying metrics/methodologies
 *   (B) Personnel with sufficient technical expertise
 *   (C) Managing conflicts of interest — payment not conditioned on results
 *   (D) Independence from the party being assessed
 *
 * This page maps our evidence practice to each criterion. It is a CSOAI
 * editorial act — not a California Government Operations Agency endorsement,
 * not legal advice, and not a claim that CSOAI is a designated IVO.
 * IVO designation requires GovOps application (due by Jan 1, 2028).
 */

const CRITERIA = [
  {
    id: "A",
    statute: "§8898.1(c)(2)(A)",
    title: "Assessing risks and identifying metrics/methodologies",
    requirement:
      "An IVO must demonstrate expertise in assessing the risks posed by an AI system or model and identifying the metrics and methodologies that form the basis for that assessment.",
    practice: [
      "Frozen, published instruments: each GSPC axis uses a versioned, hash-pinned bank of test items. The instrument is published before any model is graded against it, and the bank never changes mid-measurement.",
      "Deterministic grading: no model judges another model. Every score is computed by a deterministic grader (keyword match, exact match, regex, numeric comparison) against the frozen bank. The grader code is published.",
      "Per-item evidence: every signed measurement card carries the full item-level evidence — the model's response to each test item, the expected answer, and the grader's deterministic verdict. A stranger can re-grade every item from the published bytes.",
      "Three-state honesty: every cell is MEASURED (a real run exists), UNMEASURED (no run — the slot exists but is empty), or INDEXED (the subject is known but not yet probed). Zero-filling is explicitly forbidden.",
    ],
    proof: "curl -s https://councilof.ai/api/gspc | jq '.totals'",
  },
  {
    id: "B",
    statute: "§8898.1(c)(2)(B)",
    title: "Personnel with sufficient technical expertise",
    requirement:
      "An IVO must employ or engage personnel with sufficient technical expertise to conduct its assessments.",
    practice: [
      "The measurement mill runs on dedicated compute (RunPod RTX 3090, $0.22/hr) with a GSPC worker that grades models against frozen banks 24/7. The worker's health is publicly observable at /api/worker.",
      "The public root is maintained by a signed, timestamped, multi-witness process: Ed25519 signatures, OpenTimestamps (Bitcoin block 966712), Rekor transparency log (entry 2810720876), and (pending) XRPL memo anchor.",
      "The corrections ledger (52 entries as of Sep 15, 2026) records every error we've made in our own published figures, how it was caught, and the fix. Corrections are permanent — we never delete or edit a correction.",
      "The measurement methodology is published at /methodology. The frozen banks are published on Hugging Face (101 datasets). The card verification code is published at /signed/verify-card.mjs.",
    ],
    proof: "curl -s https://councilof.ai/api/worker | jq '{status, worker.state}'",
  },
  {
    id: "C",
    statute: "§8898.1(c)(2)(C)",
    title: "Managing conflicts of interest",
    requirement:
      "An IVO must identify and manage potential conflicts of interest. Payment from the assessed party is allowed at reasonable market rates, but payment must not be conditioned on the results of the assessment.",
    practice: [
      "No issuer-pays: the entities we measure never pay for their measurement. The board publishes results for 425 stablecoins, 16 XRPL instruments, and 22 GSPC axes — none of the measured parties paid for or influenced their measurement.",
      "Revenue comes from machine-readable data delivery (x402 doors), not from favourable findings. The settlement ledger is public at /api/revenue. One non-self payer, one settlement, 0.02 USDC as of Sep 2026.",
      "Self-settlements (10 recorded) are explicitly excluded from revenue counts. A wallet we control paying us is recorded for audit but is neither revenue nor a buyer.",
      "Corrections are free forever. A measured party can request a correction at no cost, and the correction is published on the same ledger regardless of who requested it.",
      "The independence-conditions page (/evaluator-access) publishes our five conditions: no lab money, no gag clauses, methods on the card, corrections ledger governs, access/redaction terms published.",
    ],
    proof: "curl -s https://councilof.ai/api/revenue | jq '.one_number'",
  },
  {
    id: "D",
    statute: "§8898.1(c)(2)(D)",
    title: "Independence from the party being assessed",
    requirement:
      "An IVO must maintain independence from the party being assessed — no operational or management dependence, free from the assessed party's control in reaching conclusions.",
    practice: [
      "We do not require, request, or receive API access from the entities we measure. Every measurement uses publicly available endpoints, published models, and public data. If a model is unreachable, the cell reads UNMEASURED — we never fill it from a private channel.",
      "The measurement card's signature is over the exact bytes that were graded. The card is content-addressed (sha256 of the canonical body), so altering any byte invalidates the signature. The assessed party cannot modify a card after signing.",
      "The public root commits to the full leaf list. Every card in the root is independently verifiable — fetch the card, recompute the hash, check the signature against the published DID key. The assessed party has no role in this process.",
      "When we get something wrong, the corrections ledger records it publicly. The assessed party does not approve or suppress corrections. The correction is published whether the error favours or disfavours the measured entity.",
    ],
    proof: "curl -s https://councilof.ai/root.json | jq '{card_count, as_of, merkle_root}'",
  },
] as const;

export default function IvoEvidence() {
  useEffect(() => {
    document.title = "What an IVO's evidence should look like | Council of AI";
    setMetaDescription(
      "Position paper for California SB 813 rulemaking (Chapter 179, signed Sep 9, 2026). " +
      "Maps CSOAI evidence practice to the four IVO designation criteria. " +
      "Measurement, not certification."
    );
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-600">
        Council of AI — position paper
      </p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
        What an IVO's evidence should look like
      </h1>
      <p className="mt-4 max-w-3xl text-slate-600">
        California SB 813 (Chapter 179, signed September 9, 2026) creates the first
        US statutory framework for Independent Verification Organizations (IVOs) assessing
        AI systems. The Government Operations Agency must develop IVO designation criteria
        by January 1, 2028. This paper maps our evidence practice to the four criteria
        in §8898.1(c)(2).
      </p>
      <p className="mt-2 text-sm text-slate-500">
        This is a CSOAI editorial act. It is not a California Government Operations Agency
        endorsement, not legal advice, and not a claim that CSOAI is a designated IVO.
        IVO designation requires GovOps application.
      </p>

      <section className="mt-10 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-lg font-bold text-emerald-900">The statutory criteria</h2>
        <p className="mt-2 text-sm text-emerald-800">
          SB 813 §8898.1(c)(2) requires the agency to consider, at a minimum, whether an IVO
          meets four criteria. The standards are unwritten — GovOps must develop them through
          stakeholder working groups. This paper proposes evidence standards for each criterion,
          grounded in what we actually publish and what a stranger can independently verify.
        </p>
        <p className="mt-2 text-xs text-emerald-700">
          Source:{" "}
          <a
            className="underline"
            href="https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB813"
          >
            SB 813, Chapter 179, California Legislature
          </a>
        </p>
      </section>

      <section className="mt-10 space-y-6">
        {CRITERIA.map((c) => (
          <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-800">
                {c.id}
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{c.title}</h3>
                <p className="mt-1 font-mono text-xs text-slate-400">{c.statute}</p>
              </div>
            </div>
            <blockquote className="mt-4 border-l-2 border-slate-200 pl-4 text-sm italic text-slate-500">
              {c.requirement}
            </blockquote>
            <h4 className="mt-4 font-semibold text-slate-800">Our evidence practice:</h4>
            <ul className="mt-2 space-y-2">
              {c.practice.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-lg bg-slate-50 px-4 py-2 font-mono text-xs text-slate-500">
              Verify: <code>{c.proof}</code>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-bold text-slate-900">The five conditions</h2>
        <p className="mt-2 text-sm text-slate-600">
          Before accepting access to any AI system for evaluation, we publish these conditions
          at{" "}
          <a className="text-emerald-700 underline" href="/evaluator-access">
            /evaluator-access
          </a>
          :
        </p>
        <ol className="mt-3 list-decimal pl-5 text-sm text-slate-600 space-y-1">
          <li>No money from the developer being evaluated.</li>
          <li>No gag clauses — the right to publish findings without editorial control.</li>
          <li>Methods on the card — the measurement methodology is published with every result.</li>
          <li>Corrections ledger governs — errors are published publicly and permanently.</li>
          <li>Access and redaction terms published — when we receive access, the terms are visible.</li>
        </ol>
        <p className="mt-3 text-sm text-slate-600">
          These conditions are not new — they are what SB 813 §8898.1(c)(2)(C) and (D) already
          require. We publish them so the rulemaking has a concrete reference.
        </p>
      </section>

      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">What this is not</h2>
        <ul className="mt-2 space-y-2 text-sm text-slate-600">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
            Not a claim that CSOAI is a designated IVO. Designation requires GovOps application.
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
            Not legal advice. This is a technical evidence-standards proposal.
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
            Not a certification. We measure, we do not certify. A grade is never sold.
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
            Not an endorsement by the State of California. SB 813 §8898.4(a)(2) explicitly
            states that publication of criteria does not constitute state recommendation.
          </li>
        </ul>
      </section>

      <section className="mt-10 text-sm text-slate-500">
        <p>
          Issued by CSOAI Ltd (England & Wales, Companies House 16939677), 3rd Floor, 86–90
          Paul Street, London EC2A 4NE. This position paper is published under CC BY 4.0.
          Corrections:{" "}
          <a className="text-emerald-700 underline" href="/api/corrections">
            /api/corrections
          </a>
          .
        </p>
        <p className="mt-2">
          Statute:{" "}
          <a
            className="text-emerald-700 underline"
            href="https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB813"
          >
            SB 813, Chapter 179
          </a>{" "}
          (California, signed Sep 9, 2026). As_of: Sep 15, 2026.
        </p>
      </section>
    </main>
  );
}
