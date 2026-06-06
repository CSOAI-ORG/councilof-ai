import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy — CouncilOf.AI' };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-muted-foreground">CouncilOf.AI is committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your information when you use our services.</p>
      <p className="text-muted-foreground mt-4">For questions, contact <a href="mailto:support@councilof.ai" className="text-brand-400 hover:underline">support@councilof.ai</a>.</p>
    </div>
  );
}
