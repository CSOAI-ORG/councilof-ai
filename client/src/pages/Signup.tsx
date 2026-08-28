/**
 * Signup Page
 * Form-based registration with CSOAI branding
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ArrowRight, CheckCircle2, Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const PLAN_INFO: Record<string, { label: string; blurb: string; accent: 'amber' | 'emerald' }> = {
  operator: { label: 'Operator', blurb: 'ONE OS live agent, Watchdog console, signed attestation records and regulatory drift alerts.', accent: 'amber' },
  pro: { label: 'Pro', blurb: 'Premium hosted models, EU AI Act audit, Council of AI & real-world Council Space.', accent: 'emerald' },
  team: { label: 'Team', blurb: 'Everything in Pro per seat, SSO + SCIM, shared council & audit logs.', accent: 'emerald' },
  enterprise: { label: 'Enterprise', blurb: 'Full EU AI Act audit suite, dedicated council + defence, data residency & SLA.', accent: 'emerald' },
};

export default function Signup() {
  const [, setLocation] = useLocation();
  const { user, signup, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plan, setPlan] = useState('');

  // Capture the intended plan / credits pack from the pricing CTAs so it survives signup.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const p = (q.get('plan') || '').toLowerCase();
    const credits = (q.get('credits') || '').toLowerCase();
    if (p && PLAN_INFO[p]) { setPlan(p); try { localStorage.setItem('sov_intended_plan', p); } catch (e) {} }
    if (credits) { try { localStorage.setItem('sov_intended_credits', credits); } catch (e) {} }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !name) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(email, password, name);
      toast.success('Account created successfully!');
      let hasIntent = false;
      try { hasIntent = !!(localStorage.getItem('sov_intended_plan') || localStorage.getItem('sov_intended_credits')); } catch (e) {}
      setLocation(hasIntent ? '/welcome' : '/dashboard');
    } catch (error) {
      toast.error('Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center py-12 px-4">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding */}
        <div className="hidden md:block">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="h-12 w-12 text-green-600" />
            <span className="text-3xl font-bold text-gray-900">CSOAI</span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Own your AI. Own your data.
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            CSOAI is the Council AI governance operating system — your own Council assistant, a live
            governance graph, a signing council, and every framework crosswalked on one Layer 0 floor.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <p className="text-sm text-green-900 font-medium mb-2">
              "Comply once and it crosswalks everywhere — EU AI Act, NIST, ISO 42001, PIPL. The Council
              signs every decision to Layer 0, so it's provable, not promised."
            </p>
            <p className="text-xs text-green-700">— Why teams pick the Council OS</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Your own Council assistant</h3>
                <p className="text-sm text-gray-600">
                  An AI that governs with you — free open-source base, premium hosted models on Pro.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Signed to Layer 0</h3>
                <p className="text-sm text-gray-600">
                  Every verdict Ed25519-signed and verifiable offline — EU AI Act Article 50 transparent.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">100% independent</h3>
                <p className="text-sm text-gray-600">
                  Yours to own and export — no lock-in to any AI vendor. MIT-licensed core, UK-resident.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Card */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">{plan && PLAN_INFO[plan] ? 'Create your account' : 'Create Your Free Account'}</CardTitle>
            <CardDescription>
              {plan && PLAN_INFO[plan] ? 'One step from your ' + PLAN_INFO[plan].label.split(' — ')[0] + ' plan' : 'Own your AI, own your data — in under 60 seconds'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {plan && PLAN_INFO[plan] ? (
              <div className={"rounded-lg p-4 border " + (PLAN_INFO[plan].accent === 'amber' ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300')}>
                <div className="flex items-center justify-between">
                  <h3 className={"font-bold " + (PLAN_INFO[plan].accent === 'amber' ? 'text-amber-900' : 'text-emerald-900')}>Selected plan: {PLAN_INFO[plan].label}</h3>
                  <a href="/os?lobby=assess&task=pricing-overview" className="text-xs text-gray-500 hover:underline">how the free rail works</a>
                </div>
                <p className={"mt-1 text-sm " + (PLAN_INFO[plan].accent === 'amber' ? 'text-amber-800' : 'text-emerald-800')}>{PLAN_INFO[plan].blurb}</p>
                <p className="mt-2 text-xs text-gray-500">Create your account first — you'll confirm billing on the next step. No charge today.</p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">What's Included (Free):</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>✓ Your Council assistant on a free open-source model</li>
                  <li>✓ You own and export your data</li>
                  <li>✓ Layer 0 signing</li>
                  <li>✓ Community council demos</li>
                </ul>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => setLocation('/login')}
              disabled={isSubmitting}
            >
              Sign In Instead
            </Button>

            <p className="text-xs text-center text-gray-500">
              By creating an account, you agree to our{' '}
              <a href="/terms" className="text-green-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-green-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
