'use client';

import { UserPlus } from 'lucide-react';

const PLANS = ['Starter / Day rate', 'Pro / Site team', 'Enterprise'];

export default function SignupPage() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get('email') || '');
    const body = Array.from(data.entries())
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    form.action = `mailto:hello@meok.ai?subject=${encodeURIComponent(
      'New Create account submission from ' + email,
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-center gap-2 mb-4">
        <UserPlus className="w-6 h-6 text-brand-400" />
        <span className="text-xs font-mono text-brand-400 uppercase tracking-wider">Get Started</span>
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">Start your PlantHire account</h1>
      <p className="text-center text-muted-foreground mb-10">
        Enter your details and we will set up your trial or enterprise demo.
      </p>

      <div className="rounded-2xl border border-border bg-card p-8">
        <form onSubmit={handleSubmit} method="post" className="space-y-5">
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
            <input type="text" name="company" placeholder="Acme Construction Ltd" required className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
          </label>
          <label className="block text-sm font-medium text-muted-foreground">
            Phone
            <input type="tel" name="phone" placeholder="+44 7700 000000" required className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
          </label>
          <label className="block text-sm font-medium text-muted-foreground">
            Plan
            <select name="plan" className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none">
              {PLANS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="w-full gradient-brand text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
            Create account
          </button>
          <p className="text-xs text-muted-foreground">We will reply within one business day. No spam.</p>
        </form>
      </div>
    </div>
  );
}
