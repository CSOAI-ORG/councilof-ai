import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "CSOAI Cookie Policy - Information about how we use cookies and similar tracking technologies.",
  alternates: { canonical: "/cookies" },
  openGraph: {
    title: "Cookie Policy - CSOAI",
    description: "Learn about CSOAI's use of cookies and tracking technologies.",
    url: "https://csoai.org/cookies",
    type: "website",
  },
};

const cookiePolicySchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://csoai.org/cookies",
  url: "https://csoai.org/cookies",
  name: "Cookie Policy - CSOAI",
  description:
    "CSOAI Cookie Policy - Information about how we use cookies and similar tracking technologies.",
  isPartOf: {
    "@type": "WebSite",
    "@id": "https://csoai.org/#website",
  },
};

export default function CookiesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cookiePolicySchema) }}
      />
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-3xl px-4 py-20">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-12">
            <h1 className="mb-4 text-4xl font-black tracking-tighter text-emerald-400">
              Cookie Policy
            </h1>
            <p className="mb-8 text-sm text-slate-400">Last updated: February 2026</p>

            <div className="space-y-8 text-slate-300">
              <section>
                <h2 className="mb-3 text-xl font-bold text-white">1. What Are Cookies</h2>
                <p>
                  Cookies are small text files that are stored on your device when you visit a
                  website. They help websites recognize you and remember information about your
                  visit, such as your preferences and login status.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-bold text-white">2. How We Use Cookies</h2>
                <p>CSOAI uses cookies for the following purposes:</p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>
                    <strong className="text-white">Essential Cookies:</strong> These are necessary
                    for the website to function properly, including security and authentication.
                  </li>
                  <li>
                    <strong className="text-white">Analytical Cookies:</strong> These help us
                    understand how visitors interact with our website, allowing us to improve the
                    user experience.
                  </li>
                  <li>
                    <strong className="text-white">Preference Cookies:</strong> These remember your
                    settings and preferences to personalize your experience.
                  </li>
                  <li>
                    <strong className="text-white">Marketing Cookies:</strong> These track your
                    activity across websites to display relevant content and advertisements.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-bold text-white">3. Types of Cookies We Use</h2>
                <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.05]">
                        <th className="p-4 font-semibold text-emerald-400">Cookie Type</th>
                        <th className="p-4 font-semibold text-emerald-400">Purpose</th>
                        <th className="p-4 font-semibold text-emerald-400">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      <tr>
                        <td className="p-4">Session Cookies</td>
                        <td className="p-4">Maintain your login status and session information</td>
                        <td className="p-4">Session (until browser closes)</td>
                      </tr>
                      <tr>
                        <td className="p-4">Persistent Cookies</td>
                        <td className="p-4">Remember your preferences and settings</td>
                        <td className="p-4">1 year</td>
                      </tr>
                      <tr>
                        <td className="p-4">Analytics Cookies</td>
                        <td className="p-4">Track website usage and performance</td>
                        <td className="p-4">2 years</td>
                      </tr>
                      <tr>
                        <td className="p-4">Third-Party Cookies</td>
                        <td className="p-4">From partners like Google Analytics</td>
                        <td className="p-4">Varies</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-bold text-white">4. Third-Party Cookies</h2>
                <p>
                  We may also allow third-party service providers to place cookies on your device
                  for analytics, advertising, and other purposes. These providers have their own
                  privacy policies governing their use of cookies.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-bold text-white">5. Your Cookie Choices</h2>
                <p>You have the right to accept or reject cookies. Most browsers allow you to:</p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>View what cookies are set and delete them</li>
                  <li>Block cookies from specific domains</li>
                  <li>Block all cookies by default</li>
                  <li>Delete cookies when closing the browser</li>
                </ul>
                <p className="mt-3">Note that disabling cookies may affect the functionality of our website.</p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-bold text-white">6. Do Not Track</h2>
                <p>
                  If your browser has a &quot;Do Not Track&quot; (DNT) feature enabled, we will respect your
                  privacy preference to the extent technically feasible. However, many websites,
                  including ours, do not currently respond to DNT signals.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-bold text-white">7. Changes to This Policy</h2>
                <p>
                  We may update this Cookie Policy at any time. Changes will be effective
                  immediately upon posting to the website. We encourage you to review this policy
                  periodically.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-bold text-white">8. Contact Us</h2>
                <p>
                  If you have questions about our use of cookies or this Cookie Policy, please
                  contact us at{" "}
                  <a
                    href="mailto:privacy@csoai.org"
                    className="text-emerald-400 transition-colors hover:text-emerald-300"
                  >
                    privacy@csoai.org
                  </a>{" "}
                  or visit our{" "}
                  <Link
                    href="/contact"
                    className="text-emerald-400 transition-colors hover:text-emerald-300"
                  >
                    Contact page
                  </Link>
                  .
                </p>
              </section>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
