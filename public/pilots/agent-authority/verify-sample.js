const button = document.querySelector('#verify-sample');
const status = document.querySelector('#sample-result');
const base = '/pilots/agent-authority/evidence/2026-11-21/';
const manifestHash = 'ded0b47bd94fe8de897a5034039fcc88b75d1d31549112bed346ebbbe0ced08d';

async function read(file) {
  const response = await fetch(base + file, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(file + ' returned HTTP ' + response.status);
  return response.arrayBuffer();
}

async function hash(bytes) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
}

button.hidden = false;
button.addEventListener('click', async () => {
  button.disabled = true;
  status.textContent = 'Checking the published sample…';
  try {
    const manifest = await read('SHA256SUMS');
    if (await hash(manifest) !== manifestHash) throw new Error('The published manifest differs from the 21 November sample');
    const entries = new TextDecoder().decode(manifest).trim().split(/\r?\n/);
    const results = await Promise.all(entries.map(async entry => {
      const [expected, file] = entry.trim().split(/\s+/);
      return await hash(await read(file)) === expected ? null : file;
    }));
    const mismatches = results.filter(Boolean);
    status.textContent = mismatches.length ? 'Checksum mismatch: ' + mismatches.join(', ') :
      'All ' + entries.length + ' files match the 21 November sample.';
  } catch (error) {
    status.textContent = 'Check incomplete. ' + error.message + '. You can retry or use the reproduction instructions.';
  } finally {
    button.disabled = false;
  }
});
