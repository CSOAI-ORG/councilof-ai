import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  /** A custom fallback remains local to the component which owns it. */
  fallback?: ReactNode;
  /** Navigating away from a failed route must allow the next route to render. */
  resetKey?: string;
  contained?: boolean;
}
interface State {
  hasError: boolean;
  error: Error | null;
  copy: 'idle' | 'pending' | 'copied' | 'failed';
}

/** Keep pasted inputs, query strings and error-message payloads out of a support copy. */
export function recoveryDiagnostic(error: Error | null, pathname: string): string {
  const frames = (error?.stack || '').split('\n').filter(line => /^\s*at /.test(line)).slice(0, 3)
    .map(line => line.trim().replace(/https?:\/\/[^\s)]+/g, value => {
      try { const url = new URL(value); return url.origin + url.pathname; } catch { return '[source]'; }
    }));
  return [`Error: ${error?.name || 'Error'}`, `Page: ${pathname.split(/[?#]/)[0] || '/'}`, ...frames].join('\n');
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null, copy: 'idle' };
  private alive = false;
  private copyAttempt = 0;
  componentDidMount() { this.alive = true; }
  componentWillUnmount() { this.alive = false; this.copyAttempt++; }
  componentDidUpdate(previous: Props) {
    if (previous.resetKey !== this.props.resetKey && this.state.hasError) {
      this.copyAttempt++;
      this.setState({ hasError: false, error: null, copy: 'idle' });
    }
  }
  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, copy: 'idle' };
  }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  private async copyDetails(text: string) {
    if (this.state.copy === 'pending') return;
    const attempt = ++this.copyAttempt;
    this.setState({ copy: 'pending' });
    try {
      await navigator.clipboard.writeText(text);
      if (this.alive && attempt === this.copyAttempt) this.setState({ copy: 'copied' });
    } catch {
      if (this.alive && attempt === this.copyAttempt) this.setState({ copy: 'failed' });
    }
  }
  public render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    const diagnostic = recoveryDiagnostic(this.state.error, typeof location !== 'undefined' ? location.pathname : '/');
    return (
      <section data-testid="page-recovery" aria-labelledby="page-recovery-title" className={`${this.props.contained ? 'min-h-[60vh]' : 'min-h-screen'} flex items-center justify-center bg-background px-5 py-12`}>
        <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">Council of AI</p>
          <h1 id="page-recovery-title" className="mt-3 text-2xl font-semibold tracking-tight">This page couldn’t be displayed.</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Reload to try this page again, or open another part of Council. Any information you entered may need to be entered again.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="min-h-11" onClick={() => location.reload()}>Reload this page</Button>
            <Button className="min-h-11" variant="outline" asChild><a href="/dashboard">Open Council OS</a></Button>
            <Button className="min-h-11" variant="ghost" asChild><a href="/">Return home</a></Button>
          </div>
          <details className="mt-6 border-t border-border pt-4">
            <summary className="cursor-pointer text-sm font-medium">Technical details</summary>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">These details identify the page and failing code. Copy them if you need to report the problem.</p>
            <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-3 text-xs select-all">{diagnostic}</pre>
            <Button variant="outline" className="mt-3 min-h-11" disabled={this.state.copy === 'pending'} onClick={() => void this.copyDetails(diagnostic)}>{this.state.copy === 'copied' ? 'Details copied' : this.state.copy === 'pending' ? 'Copying details…' : 'Copy details'}</Button>
            <p role="status" aria-live="polite" className="mt-2 text-xs text-muted-foreground">{this.state.copy === 'failed' ? 'Copy was unavailable. Select the details above and copy them manually.' : this.state.copy === 'copied' ? 'Technical details copied.' : ''}</p>
          </details>
        </div>
      </section>
    );
  }
}
