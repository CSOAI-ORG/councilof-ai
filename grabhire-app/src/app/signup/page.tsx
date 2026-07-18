'use client';

import { UserPlus } from 'lucide-react';
import { vertical } from '@/lib/vertical';

function mailtoSubmit(e: React.FormEvent<HTMLFormElement>) {
  const form = e.currentTarget;
  const data = new FormData(form);
  const email = String(data.get('email') ?? '');
  const body = Array.from(data.entries())
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  form.action = `mailto:hello@meok.ai?subject=${encodeURIComponent(
    `New Create account submission from ${email}`
  )}&body=${encodeURIComponent(body)}`;
}

export default function SignupPage() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-medium mb-4">
          <UserPlus className="w-3 h-3" />
          Get Started
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold">Start your {vertical.name} account</h1>
        <p className="mt-4 text-muted-foreground">
          Enter your details and we will set up your trial or enterprise demo.
        </p>
      </div>

      <div className="rounded-2xl bg-card border border-border p-8">
        <form method="post" className="space-y-5" onSubmit={mailtoSubmit}>
          <label className="block text-sm font-medium text-muted-foreground">
            Full name
            <input type="text" name="name" placeholder="Your name" required
              className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
          </label>
          <label className="block text-sm font-medium text-muted-foreground">
            Work email
            <input type="email" name="email" placeholder="you@company.com" required
              className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
          </label>
          <label className="block text-sm font-medium text-muted-foreground">
            Company / site name
            <input type="text" name="company" placeholder="Acme Construction Ltd" required
              className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
          </label>
          <label className="block text-sm font-medium text-muted-foreground">
            Phone
            <input type="tel" name="phone" placeholder="+44 7700 000000" required
              className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none" />
          </label>
          <label className="block text-sm font-medium text-muted-foreground">
            Plan
            <select name="plan"
              className="mt-1 block w-full rounded-lg bg-background border border-border px-4 py-3 focus:border-brand-500 focus:outline-none">
              <option>Starter / Day rate</option>
              <option>Pro / Site team</option>
              <option>Enterprise</option>
            </select>
          </label>
          <button type="submit"
            className="w-full py-3 rounded-xl font-semibold gradient-brand text-white hover:opacity-90 transition-opacity">
            Create account
          </button>
          <p className="text-xs text-muted-foreground">
            We will reply within one business day. No spam, no real charges until the flow is tested.
          </p>
        </form>
      </div>
    </div>
  );
}
