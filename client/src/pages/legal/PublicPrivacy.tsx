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
    <section className="min-h-screen bg-slate-50 px-5 py-14 text-slate-950">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
          Operative notice · version 1.3 · 27 September 2026
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

          <section id="mcp" aria-labelledby="mcp-h">
            <h2 id="mcp-h" className="text-2xl font-bold">The MCP endpoints (/mcp and /mcp/free)</h2>
            <p className="mt-3 leading-7 text-slate-700">
              https://councilof.ai/mcp and https://councilof.ai/mcp/free are Model Context Protocol
              servers that AI clients such as Claude call on your behalf. /mcp/free carries only the
              free read-only tools. /mcp carries those plus four x402-metered tools. Both are handled by
              functions/mcp/[[path]].ts. No account, sign-in, key or cookie is used on either.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-slate-700">
              <li>
                <span className="font-semibold">What a tool call sends us:</span> the tool name and the
                arguments the AI client chose. Depending on the tool, that is an axis name, a SHA-256,
                a signed measurement card or capsule (as JSON, or as a councilof.ai or csoai.org URL),
                or an endpoint URL. We receive the tool call, not your conversation.
              </li>
              <li>
                <span className="font-semibold">How it is used:</span> the arguments are processed in
                memory to produce the answer. The free tools read public files on councilof.ai and
                csoai.org only; they do not contact an endpoint URL you name. Our MCP code does not
                write tool calls, arguments or answers to storage.
              </li>
              <li>
                <span className="font-semibold">Payments (/mcp only):</span> if a paid tool on /mcp is
                called with an x402 payment authorization that settles, the route it calls keeps the
                x402 payment records described in the first row above, and may keep the request it
                fulfilled with the transaction (for example the subject and axis of a commissioned
                measurement, or the hash of a checked file) in the same KV store. Nothing on /mcp/free
                takes a payment, so none of this happens there.
              </li>
              <li>
                <span className="font-semibold">Logs:</span> the request itself (IP address of the
                machine that makes it, user agent, URL and time) reaches Cloudflare like any other
                request, as in the request-logs row above. For a connector added in Claude, that machine
                is normally Anthropic&apos;s, not your device. The code includes an optional trace that
                writes the tool name to Cloudflare&apos;s function log. It is switched off; when it is
                on, every MCP response carries an x-otel-trace-id header, so you can check.
              </li>
              <li>
                <span className="font-semibold">Retention:</span> we keep nothing from a /mcp/free call.
                Cloudflare&apos;s processing is under Cloudflare&apos;s own retention, and we keep no copy.
              </li>
              <li>
                <span className="font-semibold">Questions:</span>{" "}
                <a className="text-emerald-800 underline" href={`mailto:${controller.email}`}>{controller.email}</a>,
                or contact@csoai.org for support with the connector.
              </li>
            </ul>
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
    </section>
  );
}
