import React from 'react';

/** Public navigation, not an incident collector or automated regulator referral. */
export const WATCHDOG_HELP_ROUTES = [
  { label: 'Council evidence or correction enquiry', scope: 'Public evidence only; request a human response through the existing contact route.', href: '/contact/' },
  { label: 'Challenge a Council record', scope: 'Use the existing complaints process; independent appeals capacity is not established.', href: '/complaints/' },
  { label: 'UK data protection concerns', scope: 'Information Commissioner: complaints and information rights.', href: 'https://ico.org.uk/make-a-complaint/' },
  { label: 'UK workplace whistleblowing advice', scope: 'Protect: independent advice on speaking up, not an investigation service.', href: 'https://protect-advice.org.uk/' },
  { label: 'UK prescribed persons', scope: 'Find an appropriate statutory reporting route for your issue.', href: 'https://www.gov.uk/government/publications/blowing-the-whistle-list-of-prescribed-people-and-bodies--2' },
  { label: 'EU and EEA data protection', scope: 'Find the relevant national supervisory authority.', href: 'https://www.edpb.europa.eu/about-edpb/our-members_en' },
  { label: 'US consumer fraud', scope: 'Federal Trade Commission reporting channel, where relevant.', href: 'https://reportfraud.ftc.gov/' },
] as const;

export default function WatchdogHelpRoutes() {
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5" aria-labelledby="watchdog-help-heading" data-testid="watchdog-help-routes">
      <h2 id="watchdog-help-heading" className="text-lg font-semibold">Need help with an AI concern?</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Council is a private research and measurement organisation, not a statutory regulator, emergency service or protected whistleblowing channel.
        Its AI staff can explain public evidence; do not send confidential allegations, credentials, personal records or identifying material to them.
        You may request a human response by email, but a staffed telephone service and independent case reviewers are not established.
      </p>
      <p className="mt-2 text-sm leading-6">
        If anyone is in immediate danger, use local emergency services. For sensitive disclosures, use the appropriate independent or official channel directly.
        These links do not transmit your report, create a case, or establish a partnership with Council.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {WATCHDOG_HELP_ROUTES.map(r => <li key={r.href} className="rounded-lg border border-border p-3">
          <a href={r.href} className="font-semibold underline">{r.label}</a>
          <p className="mt-1 text-sm text-muted-foreground">{r.scope}</p>
        </li>)}
      </ul>
      <p className="mt-3 text-sm text-muted-foreground">Other jurisdictions and issues: consult the <a href="/regulator-atlas/" className="underline">Regulator Atlas</a> and verify remit and current contact details before disclosing information.</p>
    </section>
  );
}
