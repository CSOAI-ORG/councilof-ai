// The apex gate's fixed cases, run under vitest by the required `gates` check
// (`npx vitest run client/src functions scripts`). The same cases run under plain node with
// `node scripts/csoai-site/apex-gate.mjs --selftest`, which csoai-site-deploy.yml does before it
// trusts the gate. No network beyond 127.0.0.1.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { onRequest } from './apex-middleware.mjs';
import { selftestCases } from './apex-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

describe('csoai.org apex gate', () => {
  for (const [name, run] of selftestCases({ onRequest })) {
    it(name, async () => { await run(); }, 30000);
  }
});

describe('csoai-site-deploy.yml uses the gate', () => {
  const wf = readFileSync(join(HERE, '..', '..', '.github', 'workflows', 'csoai-site-deploy.yml'), 'utf8');
  // Comment lines are not instructions. Match only what runs.
  const code = wf.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
  const lock = JSON.parse(readFileSync(join(HERE, 'apex-lock.json'), 'utf8'));
  const at = (needle) => {
    const i = code.indexOf(needle);
    expect(i, `workflow is missing: ${needle}`).toBeGreaterThan(-1);
    return i;
  };

  it('deploys production to the branch the lock names, and to no other branch but the candidate', () => {
    expect(lock.pages).toMatchObject({ project: 'csoai-site', production_branch: 'master', candidate_branch: 'apex-candidate', origin: 'https://csoai.org' });
    const deploys = code.split('\n').filter((l) => l.includes('wrangler pages deploy'));
    expect(deploys.length).toBe(2);
    expect(deploys.filter((l) => /--project-name=csoai-site --branch=master /.test(l)).length).toBe(1);
    expect(deploys.filter((l) => /--project-name=csoai-site --branch=apex-candidate /.test(l)).length).toBe(1);
    expect(code).not.toMatch(/--branch=main\b/);
  });

  it('never clones a moving branch of the source', () => {
    expect(code).not.toMatch(/git clone/);
    at('git -C src fetch -q --depth 1 origin "$PIN"');
    at('test "$(git -C src rev-parse HEAD)" = "$PIN"');
    expect(code).not.toMatch(/pip install/);
  });

  it('runs the gate before any upload, and reads the candidate back before production is written', () => {
    const order = [
      'apex-gate.mjs --selftest',
      'apex-gate.mjs predeploy',
      'apex-gate.mjs target',
      '--branch=apex-candidate',
      'apex-gate.mjs readback --base "$CANDIDATE_URL"',
      '--branch=master',
      'apex-gate.mjs readback --base https://csoai.org',
    ].map(at);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('uploads only when the gate says so, and never cancels a run half way', () => {
    expect(code.match(/if: steps\.gate\.outputs\.deploy == 'true'/g)?.length).toBe(3);
    expect(code).toMatch(/cancel-in-progress: false/);
    expect(code).not.toMatch(/continue-on-error/);
    expect(code).toMatch(/permissions:\n {2}contents: read\n/);
  });

  it('ships the reviewed middleware file, not an inline copy', () => {
    at('cp ../council/scripts/csoai-site/apex-middleware.mjs functions/_middleware.js');
    expect(code).not.toMatch(/new URL\(url\.pathname/);
    expect(code).not.toMatch(/Response\.redirect/);
  });

  it('starts a run when the lock, the gate, the middleware or the mirrored files change', () => {
    for (const path of ['.github/workflows/csoai-site-deploy.yml', 'scripts/csoai-site/**', 'public/.well-known/did.json', 'public/.well-known/scitt-keys']) at(`- '${path}'`);
    for (const entry of Object.values(lock.well_known)) if (entry.mirror) at(`- '${entry.mirror}'`);
  });

  it('gives the Cloudflare token to the read-only target check and the two uploads, and to nothing else', () => {
    expect(code.match(/secrets\.CLOUDFLARE_API_TOKEN/g)?.length).toBe(3);
  });
});
