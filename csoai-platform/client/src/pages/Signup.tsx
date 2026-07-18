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

export default function Signup() {
  const [, setLocation] = useLocation();
  const { user, signup, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setLocation('/dashboard');
    } catch (error) {
      toast.error('Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding */}
        <div className="hidden md:block">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="h-12 w-12 text-primary" />
            <span className="text-3xl font-bold text-foreground">CSOAI</span>
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-4">
            Start Your AI Safety Career Today
          </h1>

          <p className="text-lg text-muted-foreground mb-8">
            Join the global movement of AI Safety Analysts. Get certified, earn credentials, and
            protect humanity from AI risks.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-primary fill-green-600" />
              <Star className="h-5 w-5 text-primary fill-green-600" />
              <Star className="h-5 w-5 text-primary fill-green-600" />
              <Star className="h-5 w-5 text-primary fill-green-600" />
              <Star className="h-5 w-5 text-primary fill-green-600" />
            </div>
            <p className="text-sm text-green-900 font-medium mb-2">
              "CSOAI certification opened doors I didn't know existed. Within 3 months, I landed a
              $120K AI Safety Analyst role."
            </p>
            <p className="text-xs text-green-700">— Sarah Chen, Certified AI Safety Analyst</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">15+ Professional Courses</h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive training on EU AI Act, NIST, TC260, and more
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">Globally Recognized Certificates</h3>
                <p className="text-sm text-muted-foreground">
                  University-grade credentials trusted by employers worldwide
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">100% Independent</h3>
                <p className="text-sm text-muted-foreground">
                  No ties to OpenAI, Google, Microsoft, or any AI vendor
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Card */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Create Your Free Account</CardTitle>
            <CardDescription>
              Start learning in under 60 seconds
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-[#9CA6C9]/5 border border-[#9CA6C9]/20 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What's Included (Free):</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>✓ Access to 3 foundation courses</li>
                <li>✓ Progress tracking dashboard</li>
                <li>✓ Community forum access</li>
                <li>✓ Certificate upon completion</li>
              </ul>
            </div>

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
                className="w-full bg-primary hover:bg-green-700 text-white"
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
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">Already have an account?</span>
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

            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our{' '}
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
