import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export const STALE_ASSET_RECOVERY_KEY = 'coai.stale-asset-recoveries.v1';
const MAX_RECOVERY_MARKERS = 8;

type RecoveryStore = Pick<Storage, 'getItem' | 'setItem'>;

/** Vite/browser messages seen when an old open tab requests a removed deploy chunk. */
export function isStaleAssetError(error: Error | string | null): boolean {
  const message = typeof error === 'string' ? error : error?.message || '';
  return /(?:failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|chunkloaderror|loading (?:css )?chunk [^\s]+ failed|css_chunk_load_failed)/i.test(
    message,
  );
}

function recoveryMarker(error: Error, pathname: string): string {
  const asset = error.message.match(/(?:https?:\/\/[^\s)'"<>]+|\/assets\/[^\s)'"<>]+)/i)?.[0];
  return `${pathname || '/'}::${asset || error.message.slice(0, 300)}`;
}

/**
 * Claim one automatic reload for this route + missing asset. If storage cannot
 * record the claim we do not auto-reload, because that could create a loop.
 */
export function claimStaleAssetRecovery(
  error: Error,
  pathname: string,
  store: RecoveryStore | null,
): boolean {
  if (!isStaleAssetError(error) || !store) return false;
  try {
    const parsed = JSON.parse(store.getItem(STALE_ASSET_RECOVERY_KEY) || '[]');
    const previous = Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
    const marker = recoveryMarker(error, pathname);
    if (previous.includes(marker)) return false;
    store.setItem(
      STALE_ASSET_RECOVERY_KEY,
      JSON.stringify([...previous, marker].slice(-MAX_RECOVERY_MARKERS)),
    );
    return true;
  } catch {
    return false;
  }
}

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
    if (!isStaleAssetError(error) || typeof location === 'undefined') return;
    let store: RecoveryStore | null = null;
    try {
      store = typeof sessionStorage === 'undefined' ? null : sessionStorage;
    } catch {
      store = null;
    }
    if (claimStaleAssetRecovery(error, location.pathname, store)) {
      // Keep the full path and query: the browser fetches the current shell and
      // the session transcript restores after the reload.
      location.reload();
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      const err = this.state.error;
      const staleAsset = isStaleAssetError(err);
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
            <div className="text-5xl mb-4">{staleAsset ? '↻' : '⚠️'}</div>
            <h1 className="text-2xl font-bold mb-2">
              {staleAsset ? 'Council OS was updated' : 'Something went wrong'}
            </h1>
            <p className="text-muted-foreground mb-4">
              {staleAsset
                ? 'This tab requested a file from the previous release. Reload this workspace to continue on the current version.'
                : err?.message || 'An unexpected error occurred'}
            </p>
            <pre className="text-left text-xs bg-muted/50 rounded-md p-3 mb-4 overflow-auto max-h-56 whitespace-pre-wrap select-all">
              {diag}
            </pre>
            <p className="text-xs text-muted-foreground mb-4">
              Screenshot this box (or tap to select) and send it — it names the exact failing code.
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (staleAsset && typeof location !== 'undefined') {
                  location.reload();
                } else if (typeof location !== 'undefined' && location.pathname !== '/') {
                  // A genuine page error still returns to the stable public home.
                  location.assign('/');
                } else {
                  location.reload();
                }
              }}
            >
              {staleAsset ? 'Reload this workspace' : 'Back to safety'}
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
