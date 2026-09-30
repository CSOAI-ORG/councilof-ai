import { useEffect } from "react";

// /charter inside the app. A direct request for /charter never reaches this component:
// functions/charter.ts 308s it to /constitutional-harness/, the static operational charter.
// This page exists for in-app <Link href="/charter"> clicks, which wouter resolves without a
// request. It used to render the 52-Article partnership charter (Charter.tsx), which is
// historical and is recorded as superseded in /.well-known/charter-amendments.json.
// Every link here is a plain <a>, so the browser loads the static files themselves.

const LINKS: { href: string; label: string; note: string }[] = [
  { href: "/constitutional-harness/", label: "Read the operational charter", note: "The human-readable page." },
  { href: "/.well-known/constitutional-harness.json", label: "Machine-readable charter", note: "The exact bytes. Their sha256 is pinned in the amendment log." },
  { href: "/.well-known/charter-amendments.json", label: "Amendment log", note: "Append-only. One entry per published version, with what it replaced." },
  { href: "/corrections/", label: "Corrections", note: "How a published record is corrected without rewriting it." },
];

export default function OperationalCharter() {
  useEffect(() => {
    document.title = "Charter | Council of AI";
  }, []);
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-3xl mx-auto px-6 py-16">
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-700">Charter</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">The operational charter</h1>
        <p className="mt-4 text-gray-700">
          The charter that governs how CSOAI runs is the Operational Constitutional Harness Charter. It is a
          machine-readable policy contract: every article is a rule the runtime is meant to enforce, and every
          version is published with its sha256 so you can check you are reading the same bytes.
        </p>
        <p className="mt-3 text-gray-700">
          It is not signed yet. The amendment log says so, and will record the signature when one exists.
        </p>
        <ul className="mt-8 space-y-3">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="block rounded-xl border border-gray-200 px-4 py-3 hover:border-emerald-300 hover:bg-emerald-50/40"
              >
                <span className="text-sm font-semibold text-gray-900">{l.label}</span>
                <span className="block text-xs text-gray-500">{l.note}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-gray-500">
          The earlier 52-Article partnership charter is historical. Under the operational charter&apos;s own
          precedence list it applies only where it does not conflict. It is not legislation, and it certifies
          nothing.
        </p>
      </section>
    </main>
  );
}
