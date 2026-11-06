import { ArrowRight, BookOpen, CheckCircle2, Code2, Search } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

const destinations = [
  { title: 'Check a published record', href: '/gspc-verify', icon: CheckCircle2, action: 'Verify a card', description: 'Inspect a signed measurement card and its verification result. Read the source, scope and limitations beside the record.' },
  { title: 'Explore the measurement board', href: '/dashboard?tab=board', icon: Search, action: 'Open the board', description: 'Browse the published axes, evidence states and dates. Follow the underlying method and records for the result you need.' },
  { title: 'Connect your tools', href: '/tools', icon: Code2, action: 'Read the setup guide', description: 'Find the MCP endpoint, client instructions and public tool catalogue. Choose a tool and inspect its inputs before running it.' },
];

/** The old local-only waitlist acknowledged an email without sending or storing it. */
export default function EarlyAccessLanding() {
  return (
    <div className="bg-[#fbfcf9] text-[#10291f]">
      <section className="border-b border-emerald-900/10 px-5 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">Start with Council of AI</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">Start with evidence you can check.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Public measurements and card verification are open to everyone. Choose a starting point, inspect the published sources and continue in Council OS.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild><Link href="/dashboard">Open Council OS <ArrowRight aria-hidden="true" /></Link></Button>
            <Button size="lg" variant="outline" asChild><Link href="/gspc-verify">Verify a published card</Link></Button>
          </div>
          <p className="mt-5 text-sm text-slate-600">Free public access. No account is needed to read the board or verify a card.</p>
        </div>
      </section>
      <section aria-labelledby="start-options" className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <h2 id="start-options" className="text-2xl font-semibold tracking-tight">What would you like to do?</h2>
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {destinations.map(({ title, href, icon: Icon, action, description }) => (
            <article key={href} className="flex flex-col rounded-2xl border border-emerald-900/15 bg-white p-6">
              <Icon aria-hidden="true" className="h-6 w-6 text-emerald-800" />
              <h3 className="mt-5 text-xl font-semibold leading-7">{title}</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{description}</p>
              <Button variant="outline" className="mt-6 self-start" asChild><Link href={href}>{action} <ArrowRight aria-hidden="true" /></Link></Button>
            </article>
          ))}
        </div>
        <div className="mt-8 grid gap-6 rounded-2xl border border-emerald-900/15 bg-emerald-50/50 p-6 sm:p-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">Need a scoped measurement?</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">Use the measurement enquiry to describe the system, version and evidence you need.</p>
            <Link href="/assess/" className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-emerald-900 underline underline-offset-4">Make an enquiry <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold"><BookOpen aria-hidden="true" className="h-5 w-5" /> Practise with published cases</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">Explore the practice workspace. Practice activity is separate from a published, signed measurement.</p>
            <Link href="/dashboard?tab=learn" className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-emerald-900 underline underline-offset-4">Open practice <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
          </div>
        </div>
        <p className="mt-8 text-sm leading-7 text-slate-600">Measurement, not certification. Check the scope and limitations of each record before relying on it.</p>
      </section>
    </div>
  );
}
