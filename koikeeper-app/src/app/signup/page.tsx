import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { vertical } from '@/lib/vertical';

export const metadata: Metadata = {
  title: 'Sign up',
  description: 'Start your KoiKeeper account — trial, subscription or enterprise demo.',
  alternates: { canonical: `${vertical.domain}/signup` },
};

const stripeTiers = [
  { name: 'Sovereign · £29/mo', href: 'https://buy.stripe.com/9B67sNeoIcMObEx56o8k91S', primary: true },
  { name: 'Pro · £199/mo', href: 'https://buy.stripe.com/eVq14p1BWcMO4c59mE8k91T', primary: false },
];

export default function SignupPage() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-center">Start your KoiKeeper account</h1>
      <p className="mt-4 text-center text-muted-foreground">
        Enter your details and we will set up your trial or enterprise demo.
      </p>

      <div className="mt-10 rounded-2xl border border-border bg-card p-8">
        <form
          action="mailto:hello@meok.ai?subject=KoiKeeper%20account%20signup"
          method="post"
          encType="text/plain"
          className="space-y-5"
        >
          <label className="block text-sm font-medium text-muted-foreground">
            Full name
            <input type="text" name="name" placeholder="Your name" required className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
          </label>
          <label className="block text-sm font-medium text-muted-foreground">
            Work email
            <input type="email" name="email" placeholder="you@company.com" required className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
          </label>
          <label className="block text-sm font-medium text-muted-foreground">
            Company / site name
            <input type="text" name="company" placeholder="Acme Koi Ltd" required className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
          </label>
          <label className="block text-sm font-medium text-muted-foreground">
            Phone
            <input type="tel" name="phone" placeholder="+44 7700 000000" required className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
          </label>
          <label className="block text-sm font-medium text-muted-foreground">
            Plan
            <select name="plan" className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none">
              <option>Starter / Day rate</option>
              <option>Pro / Site team</option>
              <option>Enterprise</option>
            </select>
          </label>
          <button type="submit" className="w-full gradient-brand text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            Create account <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-muted-foreground">
            We will reply within one business day. No spam, no real charges until the flow is tested.
          </p>
        </form>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">Or subscribe instantly:</p>
          <div className="flex flex-col gap-3">
            {stripeTiers.map((t) => (
              <a
                key={t.href}
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`block text-center px-6 py-3 rounded-xl font-bold transition-opacity hover:opacity-90 ${t.primary ? 'gradient-brand text-white' : 'bg-background border border-brand-500/40 text-foreground'}`}
              >
                {t.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
