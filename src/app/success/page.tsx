"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { user, upgradeTier, generateApiKey } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success'>('loading');

  useEffect(() => {
    if (sessionId && user && user.tier === 'free') {
      // Simulate backend provisioning delay
      const timer = setTimeout(() => {
        upgradeTier('pro');
        generateApiKey();
        setStatus('success');
      }, 1500);
      return () => clearTimeout(timer);
    } else if (user && user.tier !== 'free') {
      setStatus('success');
    }
  }, [sessionId, user, upgradeTier, generateApiKey]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold mb-2">Provisioning your enterprise account...</h2>
        <p className="text-muted-foreground max-w-md">
          Verifying payment session and generating your secure API keys for the CouncilOf.AI SDK.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>
      <h1 className="text-4xl font-bold mb-4">Payment Successful</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-lg">
        Welcome to Council OS Pro. Your account has been upgraded and your first production API key has been generated.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <a href="/dashboard" className="px-6 py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 transition-colors flex items-center justify-center gap-2">
          Go to Dashboard <ArrowRight className="w-4 h-4" />
        </a>
        <a href="/developers" className="px-6 py-3 bg-card border border-border text-foreground rounded-xl font-semibold hover:border-brand-500/50 transition-colors">
          View SDK Docs
        </a>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="max-w-7xl mx-auto min-h-[60vh]">
      <Suspense fallback={<div className="py-24 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500"/></div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
