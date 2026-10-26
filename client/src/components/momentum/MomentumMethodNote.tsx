import { CONTACT_MAILBOX } from "@/lib/buying";

/**
 * MomentumMethodNote — the short methodology note every "how these are measured" link points at
 * (/methodology/#how-momentum-is-measured). It names each figure's source and rule. It carries no
 * number: the numbers live in GET /api/momentum and are read, never restated here.
 */
const ROWS: { name: string; how: string; href: string }[] = [
  { name: "Board axes measured", how: "GET /api/gspc → totals.measured_axes of totals.axes, read live. “Every one” is printed only when the two are equal.", href: "/api/gspc" },
  {
    name: "Signed cards, every one verifies",
    how: "GET /api/state → card_chain.bodies_verified_valid: the signed card index, each body re-verified (id recomputed, Ed25519 checked) by the verifier we publish. Shown only when every published body verifies.",
    href: "/api/state",
  },
  {
    name: "Public corrections, all dated",
    how: "GET /api/corrections → the number of ledger entries. Shown only when every entry carries a date; “this week” counts entries dated in the last seven days.",
    href: "/corrections/",
  },
  {
    name: "Measurement capsules",
    how: "n_capsules_total of the newest signed daily index in the Hugging Face dataset csoai/evidence-index. The Bitcoin block is the OpenTimestamps attestation recorded in that day’s chain head.",
    href: "/measurement-capsules/",
  },
  {
    name: "PyPI downloads",
    how: "A daily job reads the package list from PyPI’s own owner/maintainer role table for our account, then each package’s count from pepy.tech, and publishes one record to the Hugging Face dataset csoai/distribution-footprint. CSOAI Ltd and MEOK AI Labs publish from that one account; every package is counted and each share is printed in the record. A record older than 48 hours is not shown.",
    href: "https://huggingface.co/datasets/csoai/distribution-footprint",
  },
  {
    name: "Hugging Face datasets and downloads",
    how: "The Hugging Face API for author csoai, public datasets only. Downloads are the Hub’s own rolling 30-day count, which counts one download per IP address, dataset and five minutes. They are two figures that are never added: the datasets our own services read (each one is named, with the code that reads it, in hf_self_read in the endpoint’s payload) and all our other public datasets. Our own jobs also read some of the other datasets, and that share cannot be separated from the Hub’s count, so it is UNMEASURED.",
    href: "https://huggingface.co/csoai",
  },
  {
    name: "Census rows",
    how: "The Hugging Face datasets-server row count for each public csoai dataset whose name contains “census”, summed. If one does not answer, the figure says “at least”.",
    href: "https://huggingface.co/csoai",
  },
  { name: "MCP tools", how: "POST /mcp → tools/list, counted on the read.", href: "/mcp" },
  {
    name: "x402 doors answering",
    how: "GET /api/x402-quotes → the doors that answered an unpaid request with HTTP 402 on that read. A 402 is a payment challenge, not a payment.",
    href: "/api/x402-quotes",
  },
  { name: "Zenodo downloads", how: "The Zenodo API’s unique-download count for the archived board snapshot. Zenodo record unavailable since 29 Sep 2026: account blocked by Zenodo; appeal pending. While the API answers 410 the count is omitted, not carried forward.", href: "/interop/zenodo-status.json" },
];

export default function MomentumMethodNote() {
  return (
    <section id="how-momentum-is-measured" aria-labelledby="how-momentum-h" className="scroll-mt-24 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6 sm:p-8" data-testid="momentum-method-note">
      <h2 id="how-momentum-h" className="text-2xl font-bold text-emerald-50">
        How the live figures are measured
      </h2>
      <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-emerald-100/85">
        The figures in the number strip on the home page, in the site footer and on this page all come from one endpoint,{" "}
        <a href="/api/momentum" className="text-emerald-300 underline underline-offset-2">
          GET /api/momentum
        </a>
        . Every figure is read at request time from the source it names, and carries that source’s link and its own
        date. The endpoint caches its reads for one hour. A source that fails, times out or answers with something we
        cannot read is left out, and the payload lists what was left out and why. Nothing is shown as zero in its
        place, and no earlier value is reused. Figures that are rounded are rounded down and marked with a plus sign.
        All-time, 30-day and 7-day windows are separate numbers and are never added together. Download counts include
        mirrors, CI and automated traffic, so they are not people, users or customers.
      </p>
      <dl className="mt-6 grid gap-x-8 gap-y-4 text-[13px] leading-relaxed md:grid-cols-2">
        {ROWS.map((r) => (
          <div key={r.name} className="border-t border-emerald-500/15 pt-3">
            <dt className="font-semibold text-emerald-50">
              <a href={r.href} className="underline decoration-emerald-400/40 underline-offset-2 hover:decoration-emerald-300" {...(/^https?:/.test(r.href) ? { rel: "noopener noreferrer" } : {})}>
                {r.name}
              </a>
            </dt>
            <dd className="mt-1 text-emerald-100/80">{r.how}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 max-w-3xl text-[13px] leading-relaxed text-emerald-100/80">
        <strong className="text-emerald-50">Listings.</strong> A third-party index is shown only if its page or API names
        us on the read that built the payload, and each one links to our own entry there. A listing is not an
        endorsement. <strong className="text-emerald-50">Snapshots.</strong> When the page is built, the same producer
        writes a snapshot so the page is readable without JavaScript; it is labelled as a snapshot with the time it was
        taken, and the live read replaces it when it answers. To dispute a figure, email{" "}
        <a href={`mailto:${CONTACT_MAILBOX}`} className="text-emerald-300 underline underline-offset-2">
          {CONTACT_MAILBOX}
        </a>
        ; corrections are dated in the{" "}
        <a href="/corrections/" className="text-emerald-300 underline underline-offset-2">
          public ledger
        </a>
        .
      </p>
    </section>
  );
}
