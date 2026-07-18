import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Legal — CouncilOf.AI' };

export default function LegalPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Legal Information</h1>
      <p className="text-muted-foreground">Legal notices and disclaimers for CouncilOf.AI services.</p>
      <p className="text-muted-foreground mt-4">For inquiries, contact <a href="mailto:support@councilof.ai" className="text-brand-400 hover:underline">support@councilof.ai</a>.</p>
    </div>
  );
}
