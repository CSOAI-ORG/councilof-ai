/** Council-owned browser adapter. No host data, credentials or messages cross it. */
export const EMBED_VERSION = '0.2.1';
export const EMBED_PROTOCOL = 'csoai.safe-companion.mount/1';
const TAG = 'council-safe-companion';
const mounts = new WeakMap();

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

/**
 * Mount one local file reader in a connected same-document element.
 * Assets resolve relative to this module, so the complete directory can move.
 * The returned destroy() clears the component's state and is safe to repeat.
 * There is deliberately no file, context, callback, URL or postMessage option.
 */
export async function mountSafeCompanion(host, options = {}) {
  if (!(host instanceof HTMLElement) || host.ownerDocument !== document || !host.isConnected) fail('HOST_UNAVAILABLE');
  if (!options || typeof options !== 'object' || Array.isArray(options)
      || Object.keys(options).some(key => !['styleNonce', 'compact'].includes(key))) fail('OPTIONS_UNSUPPORTED');
  const { styleNonce, compact = false } = options;
  if (styleNonce !== undefined && (typeof styleNonce !== 'string' || styleNonce.length > 256
      || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(styleNonce))) fail('STYLE_NONCE_INVALID');
  if (typeof compact !== 'boolean') fail('OPTIONS_UNSUPPORTED');
  if (!globalThis.crypto?.subtle) fail('WEBCRYPTO_UNAVAILABLE');
  if (mounts.has(host)) fail('HOST_ALREADY_MOUNTED');

  const slot = {};
  mounts.set(host, slot);
  try {
    // A literal module-relative import cannot be redirected by document content,
    // URL parameters, a caller-supplied path or an imported export field.
    const { COMPONENT_VERSION } = await import('./element.mjs');
    const RegisteredComponent = customElements.get(TAG);
    // A host may already have loaded this version through a cache-versioned URL.
    // The protocol/version markers prevent accidental incompatible mounting;
    // they are not authentication of code running in the trusted host page.
    if (COMPONENT_VERSION !== EMBED_VERSION
        || RegisteredComponent?.componentVersion !== EMBED_VERSION
        || RegisteredComponent?.componentProtocol !== EMBED_PROTOCOL) fail('COMPONENT_VERSION_CONFLICT');
    if (!host.isConnected || host.ownerDocument !== document) fail('HOST_UNAVAILABLE');

    let element = document.createElement(TAG);
    if (styleNonce !== undefined) element.setAttribute('style-nonce', styleNonce);
    if (compact) element.setAttribute('compact', '');
    host.append(element);
    return Object.freeze({
      destroy() {
        if (!element) return;
        element.remove(); // disconnectedCallback clears original and derived state.
        element = null;
        if (mounts.get(host) === slot) mounts.delete(host);
      },
    });
  } catch (error) {
    if (mounts.get(host) === slot) mounts.delete(host);
    if (error?.code && ['HOST_UNAVAILABLE', 'COMPONENT_VERSION_CONFLICT'].includes(error.code)) throw error;
    fail('COMPONENT_LOAD_FAILED');
  }
}
