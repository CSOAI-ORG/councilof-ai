import type { Metadata } from 'next';
import { vertical } from '@/lib/vertical';

export const metadata: Metadata = { title: `Privacy Policy — ${vertical.name}` };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-muted-foreground">{vertical.name} is committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your information when you use our services.</p>
      <p className="text-muted-foreground mt-4">For questions, contact <a href="mailto:support@planthire.ai" className="text-brand-400 hover:underline">support@planthire.ai</a>.</p>
    </div>
  );
}
