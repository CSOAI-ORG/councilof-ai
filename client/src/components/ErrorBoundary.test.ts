import { describe, expect, it } from 'vitest';
import {
  STALE_ASSET_RECOVERY_KEY,
  claimStaleAssetRecovery,
  isStaleAssetError,
} from './ErrorBoundary';

function memoryStore() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    value: () => values.get(STALE_ASSET_RECOVERY_KEY),
  };
}

describe('stale deployment asset recovery', () => {
  it('recognises browser and Vite dynamic import failures', () => {
    expect(
      isStaleAssetError(
        'Failed to fetch dynamically imported module: https://councilof.ai/assets/DashboardToolsPane.old.js',
      ),
    ).toBe(true);
    expect(isStaleAssetError('ChunkLoadError: Loading chunk 91 failed')).toBe(
      true,
    );
    expect(isStaleAssetError('ordinary render failure')).toBe(false);
  });

  it('allows one automatic reload per route and missing asset', () => {
    const store = memoryStore();
    const error = new Error(
      'Failed to fetch dynamically imported module: https://councilof.ai/assets/DashboardToolsPane.old.js',
    );
    expect(claimStaleAssetRecovery(error, '/dashboard', store)).toBe(true);
    expect(claimStaleAssetRecovery(error, '/dashboard', store)).toBe(false);
    expect(store.value()).toContain('DashboardToolsPane.old.js');
  });

  it('permits a later release with a different missing asset to recover once', () => {
    const store = memoryStore();
    const first = new Error(
      'Failed to fetch dynamically imported module: /assets/Tools.old-a.js',
    );
    const second = new Error(
      'Failed to fetch dynamically imported module: /assets/Tools.old-b.js',
    );
    expect(claimStaleAssetRecovery(first, '/dashboard', store)).toBe(true);
    expect(claimStaleAssetRecovery(second, '/dashboard', store)).toBe(true);
  });

  it('refuses automatic recovery when it cannot record the loop guard', () => {
    const brokenStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error('storage disabled');
      },
    };
    expect(
      claimStaleAssetRecovery(
        new Error('Importing a module script failed'),
        '/dashboard',
        brokenStore,
      ),
    ).toBe(false);
  });
});
