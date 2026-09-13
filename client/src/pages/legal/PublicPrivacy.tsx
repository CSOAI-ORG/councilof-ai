import { useEffect } from "react";

const controller = {
  name: "CSOAI Ltd",
  number: "16939677",
  address: "3rd Floor, 86–90 Paul Street, London EC2A 4NE, United Kingdom",
  email: "privacy@csoai.org",
};

export default function PublicPrivacy() {
  useEffect(() => {
    document.title = "Privacy notice — CSOAI Ltd | Council of AI";
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-14 text-slate-950">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
          Operative notice · version 1.0 · 13 September 2026
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Privacy notice</h1>
        <p className="mt-5 leading-7 text-slate-700">
          This notice explains how CSOAI Ltd handles personal data when you use councilof.ai,
          contact us, request a service, or make a payment. It is written for the UK GDPR and
          Data Protection Act 2018. If a specific service gives you a more detailed notice, that
          notice also applies to that interaction.
        </p>

        <div className="mt-8 space-y-9">
          <section>
            <h2 className="text-2xl font-bold">Controller and contact</h2>
            <p className="mt-3 leading-7 text-slate-700">
              {controller.name}, registered in England and Wales No. {controller.number}. Registered
              office: {controller.address}. Privacy enquiries: <a className="text-emerald-800 underline" href={`mailto:${controller.email}`}>{controller.email}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Data we may receive</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-slate-700">
              <li>Contact and organisation details you send in an email or enquiry.</li>
              <li>Order, invoice and transaction information needed to supply and account for a paid service.</li>
              <li>Technical request, security and error logs needed to operate and protect the site.</li>
              <li>Optional analytics information only when the consent control permits it.</li>
              <li>Evidence you deliberately submit for a measurement or support request.</li>
            </ul>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Do not submit passwords, wallet secrets, private signing material, or sensitive personal
              data through ordinary contact forms or email.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Why we use it</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                <thead><tr className="border-b border-slate-300"><th className="py-2 pr-4">Purpose</th><th className="py-2">Typical lawful basis</th></tr></thead>
                <tbody className="text-slate-700">
                  <tr className="border-b border-slate-200"><td className="py-3 pr-4">Answer an enquiry or take steps toward a service</td><td className="py-3">Contract steps or legitimate interests</td></tr>
                  <tr className="border-b border-slate-200"><td className="py-3 pr-4">Supply a requested service and manage payment</td><td className="py-3">Contract and legal obligation</td></tr>
                  <tr className="border-b border-slate-200"><td className="py-3 pr-4">Secure, diagnose and maintain the service</td><td className="py-3">Legitimate interests</td></tr>
                  <tr><td className="py-3 pr-4">Run optional analytics</td><td className="py-3">Consent where required</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Sharing, transfers and retention</h2>
            <p className="mt-3 leading-7 text-slate-700">
              We may use service providers for hosting, communications, payments and security. We
              share only what is needed for the service or required by law. Where data is transferred
              internationally, the applicable adequacy decision or contractual safeguard depends on
              the provider and transfer. We retain personal data only for the service, dispute,
              security and legal-record period that applies; financial records may be kept for the
              statutory accounting period. Ask us for the period applicable to your record.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Your rights</h2>
            <p className="mt-3 leading-7 text-slate-700">
              Depending on the circumstances, you may ask for access, correction, deletion,
              restriction, portability, or object to processing, and you may withdraw consent without
              affecting earlier processing. Contact {controller.email}. You can also complain to the
              UK Information Commissioner's Office at <a className="text-emerald-800 underline" href="https://ico.org.uk/make-a-complaint/">ico.org.uk</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Public evidence is a separate boundary</h2>
            <p className="mt-3 leading-7 text-slate-700">
              Public measurement records are intended to be inspectable and durable. We do not put
              private submissions or account data into a public evidence record unless the relevant
              publication scope has been agreed. A cryptographic signature proves authorship and
              integrity; it does not change the privacy status of the underlying data.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
