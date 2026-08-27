import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  /** When set, a child throw stays local — the rest of the app keeps working. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      const err = this.state.error;
      // Diagnostic block: name + message + first stack frames + browser + route.
      // On mobile (esp. iOS Safari) the reproduction is device-specific, so surface
      // the real error in a copyable form — one screenshot pinpoints the throwing line.
      const diag = [
        `${err?.name || 'Error'}: ${err?.message || 'unknown'}`,
        (err?.stack || '').split('\n').slice(1, 4).map((l) => l.trim()).join('\n'),
        `at ${typeof location !== 'undefined' ? location.pathname : '?'}`,
        `ua ${typeof navigator !== 'undefined' ? navigator.userAgent : '?'}`,
      ].filter(Boolean).join('\n');
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8 max-w-lg">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">
              {err?.message || 'An unexpected error occurred'}
            </p>
            <pre className="text-left text-xs bg-muted/50 rounded-md p-3 mb-4 overflow-auto max-h-56 whitespace-pre-wrap select-all">
              {diag}
            </pre>
            <p className="text-xs text-muted-foreground mb-4">
              Screenshot this box (or tap to select) and send it — it names the exact failing code.
            </p>
            <Button
              onClick={() => {
                // Reload from the home route, not the failing one, so a broken
                // sub-page doesn't loop the user straight back into the same throw.
                this.setState({ hasError: false, error: null });
                if (typeof location !== 'undefined' && location.pathname !== '/') {
                  location.assign('/');
                } else {
                  location.reload();
                }
              }}
            >
              Back to safety
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
