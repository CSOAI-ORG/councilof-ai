/** Deterministic request boundaries shared by the production renderer and private review. */
export function parseRenderRequest(raw, dataOrigin) {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\') || /[\r\n]/.test(raw)) throw new Error('INVALID_RENDER_REQUEST');
  const source = new URL(raw, 'http://render.invalid');
  let pathname; try { pathname=decodeURIComponent(source.pathname); } catch { throw new Error('INVALID_RENDER_ENCODING'); }
  if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').includes('..')) throw new Error('UNSAFE_RENDER_PATH');
  const origin=new URL(dataOrigin);
  if (!['https:','http:'].includes(origin.protocol)||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash) throw new Error('DATA_ORIGIN_MUST_BE_ORIGIN');
  const dataPath=pathname.startsWith('/api/')||pathname.startsWith('/signed/');
  return {pathname, dataPath, target:dataPath?new URL(source.pathname+source.search,origin).href:null};
}
export function validateOfflineOrigin(origin) {
  const u=new URL(origin);
  if (u.protocol!=='http:'||!['localhost','127.0.0.1','[::1]'].includes(u.hostname)||u.username||u.password||u.pathname!=='/'||u.search||u.hash) throw new Error('OFFLINE_REVIEW_REQUIRES_LOOPBACK_DATA');
  return u.origin;
}
export function allowOfflineRequest(url,method,renderOrigin) {
  try { const u=new URL(url); return u.origin===renderOrigin&&['GET','HEAD'].includes(method); } catch { return false; }
}
export function snapshotFailure(text, errors) {
  if (errors.length) return 'JS_RUNTIME_FAILURE: '+String(errors[0]).slice(0,160);
  return /fetch failed|HTML instead of JSON|Failed to fetch/i.test(text)?'BAKED-FETCH-FAILURE refused (page text contains a fetch error)':null;
}
