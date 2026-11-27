/** Regional enquiry aliases share the existing Council inbox. No office or agent appointment implied. */
import React from 'react';

export const REGIONAL_CONTACTS = [
  { region: 'United Kingdom', address: 'uk@csoai.org' },
  { region: 'Europe', address: 'europe@csoai.org' },
  { region: 'North America', address: 'americas@csoai.org' },
  { region: 'Latin America and Caribbean', address: 'latam@csoai.org' },
  { region: 'Asia-Pacific', address: 'asia@csoai.org' },
  { region: 'Africa and Middle East', address: 'amea@csoai.org' },
] as const;

export function regionalContactHref(entry: typeof REGIONAL_CONTACTS[number]): string {
  return `mailto:${entry.address}?subject=${encodeURIComponent('Regional enquiry — ' + entry.region)}`;
}

export default function RegionalContact() {
  return (
    <section aria-labelledby="regional-contact-h" className="mb-16 rounded-2xl border border-border bg-card p-6" data-testid="regional-contact">
      <h2 id="regional-contact-h" className="text-xl font-bold">International enquiries</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        These regional email addresses route to the same Council inbox, operated from the United Kingdom.
        They are enquiry channels, not overseas offices, locally appointed representatives or regulatory authorities.
        Inbound test messages were received on 27 November 2026. No regional response-time commitment is implied.
      </p>
      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REGIONAL_CONTACTS.map((entry) => (
          <li key={entry.address} className="rounded-lg border border-border p-4">
            <h3 className="font-semibold">{entry.region}</h3>
            <a href={regionalContactHref(entry)} className="mt-1 block break-all text-sm underline">{entry.address}</a>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        For research collaboration, SME measurement enquiries, or working-group participation, describe the jurisdiction, scope and public evidence.
        Please do not send credentials or confidential case records. A message is not acceptance, appointment or authority to act.
      </p>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <a className="underline" href="/regulator-atlas/">Regulator Atlas</a>
        <a className="underline" href="/working-groups/catalog.json">Working-group catalogue</a>
        <a className="underline" href="/him/">H.I.M. and human review</a>
      </div>
    </section>
  );
}
