import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service — CouncilOf.AI' };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <p className="text-muted-foreground">By using CouncilOf.AI, you agree to these terms. Our services are provided on an enterprise-grade platform with SLA guarantees for paid plans.</p>
      <p className="text-muted-foreground mt-4">For questions, contact <a href="mailto:support@councilof.ai" className="text-brand-400 hover:underline">support@councilof.ai</a>.</p>
    </div>
  );
}
