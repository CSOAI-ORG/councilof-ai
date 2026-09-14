import { useEffect } from "react";

// Operative privacy notice. Every processing line below names the code that does it, so the
// notice can be checked against the repository rather than trusted. If a function starts
// storing something new, this page is wrong until it is updated.
const controller = {
  name: "CSOAI Ltd",
  number: "16939677",
  address: "3rd Floor, 86–90 Paul Street, London EC2A 4NE, United Kingdom",
  email: "nicholas@csoai.org",
};

const rows: { data: string; where: string; basis: string; kept: string }[] = [
  {
    data: "x402 payment records: the settlement transaction hash, the payer wallet address, network, amount, the resource paid for, and time.",
    where: "functions/api/_x402.ts and _x402_receipt.ts write them to our Cloudflare KV store (settled:tx:*, receipts by transaction and by payer). /api/receipts?payer= is a public lookup: anyone who supplies a valid payer address can read the receipts indexed under it. It does not authenticate ownership of that address.",
    basis: "Contract (supplying what was paid for); legal obligation (accounting records); legitimate interests (preventing a payment being replayed).",
    kept: "No automatic expiry. We keep records for the applicable contract, dispute and accounting period. UK company-tax records are normally kept for six years after the end of the accounting period and may need to be kept longer. An erasure request does not override a legal duty to retain a record.",
  },
  {
    data: "Contact and lead submissions: the email address, name, subject, message, and any report or service reference you enter.",
    where: "functions/api/contact.ts and lead.ts write them to KV (LEADS). Measurement-intake requests (functions/api/evidence-intake.ts) are stored the same way.",
    basis: "Steps you ask us to take before a contract; legitimate interests (answering you).",
    kept: "No automatic expiry. We delete it when the enquiry is closed and there is no continuing need, or on a valid erasure request where no exemption applies.",
  },
  {
    data: "Email you send to nicholas@csoai.org.",
    where: "Our mailbox provider (Namecheap Private Email).",
    basis: "Legitimate interests; steps before a contract.",
    kept: "Until the conversation is finished and any follow-on record is no longer needed.",
  },
  {
    data: "Workspace accounts, if you register: email, name, a salted password hash, and when the account was made.",
    where: "functions/api/auth writes them to KV (SOV_ARENA_STATE). No password is stored in readable form.",
    basis: "Contract (providing the account).",
    kept: "For the life of the account; deleted on a valid erasure request where no exemption applies.",
  },
  {
    data: "Request logs: IP address, user agent, URL and time of each request.",
    where: "Cloudflare processes these to serve and protect the site. Our own functions do not write IP addresses or request logs to storage.",
    basis: "Legitimate interests (running and securing the service).",
    kept: "Under Cloudflare's own retention; we keep no copy.",
  },
];

export default function PublicPrivacy() {
  useEffect(() => {
    document.title = "Privacy notice — CSOAI Ltd | Council of AI";
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-14 text-slate-950">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
          Operative notice · version 1.2 · 14 September 2026
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Privacy notice</h1>
        <p className="mt-5 leading-7 text-slate-700">
          This notice covers councilof.ai under the UK GDPR and the Data Protection Act 2018. It
          describes only the processing our code actually does.
        </p>

        <div className="mt-8 space-y-9">
          <section>
            <h2 className="text-2xl font-bold">Controller and contact</h2>
            <p className="mt-3 leading-7 text-slate-700">
              {controller.name}, a private limited company registered in England and Wales, Companies
              House No. {controller.number}. Registered office: {controller.address}. Privacy requests:{" "}
              <a className="text-emerald-800 underline" href={`mailto:${controller.email}`}>{controller.email}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Unavailable witness service</h2>
            <p className="mt-3 leading-7 text-slate-700">
              The public paid-witness endpoint currently returns HTTP 503 before it reads a submitted
              URL, hash or body, verifies a payment, or writes a queue entry. The retained queue code is
              not the public handler and does not describe current processing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">What we hold, why, and for how long</h2>
            <div className="mt-3 space-y-4">
              {rows.map((r) => (
                <div key={r.data} className="rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                  <p className="font-semibold text-slate-900">{r.data}</p>
                  <p className="mt-1"><span className="font-semibold">Where:</span> {r.where}</p>
                  <p className="mt-1"><span className="font-semibold">Lawful basis:</span> {r.basis}</p>
                  <p className="mt-1"><span className="font-semibold">Retention:</span> {r.kept}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Public blockchains and public evidence</h2>
            <p className="mt-3 leading-7 text-slate-700">
              x402 payments settle on the Base blockchain. The transaction hash and payer address are
              public on that chain whatever we do, and we cannot delete them from it. Public measurement
              records are meant to be inspectable and durable. Private submissions and account data do
              not go into them unless you have agreed that in advance. A signature proves who wrote a
              record and that it is unchanged. It does not change the privacy status of the data in it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Analytics and cookies</h2>
            <p className="mt-3 leading-7 text-slate-700">
              The site stores your cookie choice in your browser. The analytics component runs only when
              an analytics endpoint is configured and you have accepted analytics in the consent banner.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Who else processes it</h2>
            <p className="mt-3 leading-7 text-slate-700">
              Cloudflare hosts the site, runs its functions and provides the KV store. A payment
              facilitator verifies and settles x402 payments. Namecheap Private Email carries email.
              Some of these providers may process data outside the UK, under their own transfer
              safeguards. We sell no personal data and share it with no one else unless the law
              requires it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Your rights</h2>
            <p className="mt-3 leading-7 text-slate-700">
              You can ask for access, correction, deletion, restriction or a portable copy of your data. You
              can object to processing based on legitimate interests, and withdraw consent at any time.
              Write to {controller.email}. We normally answer without undue delay and within one calendar
              month. For a complex request, or several requests made together, the law may allow up to two
              additional months; if we need that extension, we will tell you within the first month and
              explain why. A right such as erasure can be limited by a legal obligation or another
              applicable exemption. If you are unhappy with our answer, you can complain to the UK
              Information Commissioner's Office:{" "}
              <a className="text-emerald-800 underline" href="https://ico.org.uk/make-a-complaint/">ico.org.uk/make-a-complaint</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Public evidence is a separate boundary</h2>
            <p className="mt-3 leading-7 text-slate-700">
              Measurement, not certification. This notice is about personal data. It says nothing about
              the quality of any measured system.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
