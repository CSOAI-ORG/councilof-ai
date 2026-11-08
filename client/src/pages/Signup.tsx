/** Registration through the existing verified Council account controller. */
import { useEffect, useRef, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CouncilSessionPersistenceError, COUNCIL_SESSION_PERSISTENCE_MESSAGE } from '@/lib/councilSession';
import { councilLoginDestination, councilLoginHref, councilLoginReturnFromSearch } from '@/lib/councilLoginReturn';
import { toast } from 'sonner';

export default function Signup() {
  const [, setLocation] = useLocation();
  const returnTo = councilLoginReturnFromSearch(useSearch());
  const { user, loading, signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const mounted = useRef(false);
  const busy = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (!loading && user) setLocation(councilLoginDestination(returnTo, user.email));
  }, [loading, user, returnTo, setLocation]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current || loading || uncertain) return;
    if (!name.trim() || !email.trim() || !password) {
      toast.error('Please enter your name, email and password.');
      return;
    }
    if (password !== confirmation) {
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    busy.current = true;
    setSubmitting(true);
    try {
      // The shared controller verifies /me and stored-token readback before publishing a user.
      // Navigation above follows that verified user; a successful response alone never grants access.
      await signup(email.trim().toLowerCase(), password, name.trim());
    } catch (error) {
      if (!mounted.current) return;
      setUncertain(true);
      busy.current = false;
      setSubmitting(false);
      if ((error instanceof Error || error instanceof DOMException) && error.name === 'AbortError') return;
      toast.error(error instanceof CouncilSessionPersistenceError
        ? COUNCIL_SESSION_PERSISTENCE_MESSAGE
        : 'Account creation could not be confirmed. Sign in with the same email before trying to create another account.');
    } finally {
      if (mounted.current) {
        setPassword('');
        setConfirmation('');
      }
    }
  }

  if (loading) return <p role="status">Checking your account...</p>;
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <section className="mx-auto max-w-md rounded-xl border bg-white p-6 shadow-sm" aria-labelledby="signup-title">
        <h1 id="signup-title" className="text-2xl font-semibold">Create your Council account</h1>
        <p className="mt-3 text-sm text-gray-600">
          An account lets you sign in. Private Company workspace access is confirmed separately.
        </p>
        {uncertain && <p role="alert" className="mt-4 text-sm text-amber-800">Your account may already have been created. Use the sign-in link below to check it. Private workspace access has not been confirmed.</p>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><Label htmlFor="name">Name</Label><Input id="name" autoComplete="name" value={name} onChange={event => setName(event.target.value)} disabled={submitting || uncertain} required /></div>
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} disabled={submitting || uncertain} required /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="new-password" minLength={6} value={password} onChange={event => setPassword(event.target.value)} disabled={submitting || uncertain} required /></div>
          <div><Label htmlFor="confirmation">Confirm password</Label><Input id="confirmation" type="password" autoComplete="new-password" minLength={6} value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={submitting || uncertain} required /></div>
          <Button type="submit" className="w-full" disabled={submitting || uncertain}>{submitting ? 'Creating account...' : 'Create account'}</Button>
        </form>
        <p className="mt-4 text-sm">Already have an account? <a className="underline" href={councilLoginHref(returnTo)}>Sign in</a></p>
      </section>
    </main>
  );
}
