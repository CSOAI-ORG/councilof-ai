// The apex gate's fixed cases, run under vitest by the required `gates` check
// (`npx vitest run client/src functions scripts`). The same cases run under plain node with
// `node scripts/csoai-site/apex-gate.mjs --selftest`, which csoai-site-deploy.yml does before it
// trusts the gate. No network beyond 127.0.0.1.
//
// The second and third blocks pin the text of two workflow files. pr-gates.yml lists
// csoai-site-deploy.yml in its scope, so a pull request that edits only that workflow still runs
// them.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { onRequest } from './apex-middleware.mjs';
import { selftestCases } from './apex-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const WORKFLOWS = join(HERE, '..', '..', '.github', 'workflows');
// Comment lines are not instructions. Match only what runs.
const runs = (file) => readFileSync(join(WORKFLOWS, file), 'utf8').split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');

describe('csoai.org apex gate', () => {
  for (const [name, run] of selftestCases({ onRequest })) {
    it(name, async () => { await run(); }, 30000);
  }
});

describe('csoai-site-deploy.yml uses the gate', () => {
  const code = runs('csoai-site-deploy.yml');
  const lock = JSON.parse(readFileSync(join(HERE, 'apex-lock.json'), 'utf8'));
  const at = (needle, text = code) => {
    const i = text.indexOf(needle);
    expect(i, `workflow is missing: ${needle}`).toBeGreaterThan(-1);
    return i;
  };
  // The two jobs, as text. `build` runs the source's code; `deploy` holds the token.
  const buildAt = at('\n  build:\n');
  const deployAt = at('\n  deploy:\n');
  const build = code.slice(buildAt, deployAt);
  const deploy = code.slice(deployAt);
  const MASTER_ONLY = 'test "$GITHUB_REF" = refs/heads/master || {';

  it('has exactly two jobs, build then deploy, and deploy waits for build', () => {
    expect(buildAt).toBeLessThan(deployAt);
    expect(code.slice(at('\njobs:\n')).match(/^ {2}[A-Za-z0-9_-]+:\n/gm)).toEqual(['  build:\n', '  deploy:\n']);
    at('    needs: build\n', deploy);
  });

  it('refuses any ref but master as the first step of each job', () => {
    for (const job of [build, deploy]) {
      const firstStep = job.slice(job.indexOf('    steps:\n')).split(/\n(?= {6}- )/)[1];
      expect(firstStep, 'the first step of the job').toContain(MASTER_ONLY);
      expect(firstStep).toMatch(/exit 1; \}/);
      expect(firstStep).not.toMatch(/\bif:|continue-on-error|\|\| true/);
    }
    expect(code.split(MASTER_ONLY).length - 1).toBe(2);
  });

  it('runs the source only in the build job, which holds no secret and restores no cache', () => {
    at('python3 build_site.py', build);
    at('git -C src fetch -q --depth 1 origin "$PIN"', build);
    expect(build).not.toMatch(/secrets\./);
    expect(build).not.toMatch(/github\.token|GITHUB_TOKEN|GH_TOKEN/);
    expect(build).not.toMatch(/wrangler/);
    expect(build).toMatch(/persist-credentials: false/);
    expect(code).not.toMatch(/actions\/cache|cache:/);
  });

  it('hands the deploy job files only: the built /.well-known tree and the fallback page', () => {
    at('cp -R src/_site/.well-known handoff/.well-known', build);
    at('cp src/_site/index.html handoff/index.html', build);
    expect(build.match(/\bcp /g)?.length).toBe(2);
    const upload = build.slice(at('uses: actions/upload-artifact@v4', build));
    expect(upload).toMatch(/path: handoff\n/);
    // Without this upload-artifact v4 drops /.well-known, a dot-directory, and uploads nothing.
    expect(upload).toMatch(/include-hidden-files: true\n/);
    expect(upload).toMatch(/if-no-files-found: error\n/);
    at('uses: actions/download-artifact@v4', deploy);
    expect(deploy).toMatch(/name: csoai-site-built\n {10}path: built\n/);
  });

  it('runs nothing from the source in the deploy job', () => {
    expect(deploy).not.toMatch(/build_site|pip install|git (init|clone|fetch|-C)|working-directory: src|\bsrc\//);
    expect(deploy).toMatch(/persist-credentials: false/);
    // The only programs the deploy job starts: node on this repository's gate, the pinned wrangler,
    // python3 on inline text, and coreutils. No script file from the artifact is ever named.
    expect(deploy).not.toMatch(/(node|python3|bash|sh) +(built|apex)\//);
    expect(deploy).not.toMatch(/\bsource +(built|apex)\//);
  });

  it('assembles the upload from four named pieces, and takes scitt-keys from the checkout', () => {
    const pieces = [
      'test ! -e apex',
      'cp -R built/.well-known apex/_site/.well-known',
      'cp built/index.html apex/_site/index.html',
      'cp council/public/.well-known/scitt-keys apex/_site/.well-known/scitt-keys',
      'cp council/scripts/csoai-site/apex-middleware.mjs apex/functions/_middleware.js',
    ].map((p) => at(p, deploy));
    expect(pieces).toEqual([...pieces].sort((a, b) => a - b));
    expect(deploy.match(/\bcp /g)?.length).toBe(4);
    // Not fetched from the live site: a merge that changes it would race the main deploy.
    expect(code).not.toMatch(/councilof\.ai\/\.well-known\/scitt-keys/);
    expect(code).not.toMatch(/councilof\.ai\/(cards|proofs)\//);
    for (const entry of Object.values(lock.well_known)) if (entry.mirror) at(`    ${entry.mirror}\n`, deploy);
  });

  it('deploys production to the branch the lock names, and to no other branch but the candidate', () => {
    expect(lock.pages).toMatchObject({ project: 'csoai-site', production_branch: 'master', candidate_branch: 'apex-candidate', origin: 'https://csoai.org' });
    const deploys = code.split('\n').filter((l) => l.includes('pages deploy'));
    expect(deploys.length).toBe(2);
    expect(deploys.filter((l) => /pages deploy _site --project-name=csoai-site --branch=master /.test(l)).length).toBe(1);
    expect(deploys.filter((l) => /pages deploy _site --project-name=csoai-site --branch=apex-candidate /.test(l)).length).toBe(1);
    expect(code).not.toMatch(/--branch=main\b/);
  });

  it('pins wrangler to one exact version and runs it only in the assembled folder', () => {
    const lines = code.split('\n').filter((l) => /\bnpx\b/.test(l));
    expect(lines.length).toBe(2);
    const versions = lines.map((l) => (l.match(/^\s*npx --yes wrangler@(\d+\.\d+\.\d+) pages deploy /) || [])[1]);
    expect(versions.every(Boolean), `every npx line must be "npx --yes wrangler@x.y.z pages deploy": ${lines.join(' | ')}`).toBe(true);
    expect(new Set(versions).size).toBe(1);
    expect(code).not.toMatch(/wrangler(@latest| pages| deploy)/);
    const steps = deploy.split(/\n(?= {6}- )/);
    const uploads = steps.filter((s) => s.includes('pages deploy'));
    expect(uploads.length).toBe(2);
    for (const s of uploads) expect(s).toMatch(/\n {8}working-directory: apex\n/);
    expect(code.match(/working-directory: apex\n/g)?.length).toBe(2);
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
      'uses: actions/download-artifact@v4',
      'test ! -e apex',
      'apex-gate.mjs predeploy',
      'apex-gate.mjs target',
      '--branch=apex-candidate',
      'apex-gate.mjs readback --base "$CANDIDATE_URL" --hostile',
      '--branch=master',
      'apex-gate.mjs readback --base https://csoai.org',
    ].map((n) => at(n, deploy));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    // The gate checks the folder wrangler will run in, not only the site inside it.
    expect(deploy).toMatch(/apex-gate\.mjs predeploy \\\n\s+--site apex\/_site \\\n\s+--deploy-root apex \\\n/);
    at('--installed-middleware apex/functions/_middleware.js', deploy);
  });

  it('uploads only when the gate says so, and never cancels a run half way', () => {
    expect(code.match(/if: steps\.gate\.outputs\.deploy == 'true'/g)?.length).toBe(3);
    expect(code).toMatch(/cancel-in-progress: false/);
    expect(code).not.toMatch(/continue-on-error/);
    expect(code).toMatch(/permissions:\n {2}contents: read\n/);
    expect(code.match(/permissions:/g)?.length).toBe(1);
  });

  it('ships the reviewed middleware file, not an inline copy', () => {
    at('cp council/scripts/csoai-site/apex-middleware.mjs apex/functions/_middleware.js');
    expect(code).not.toMatch(/new URL\(url\.pathname/);
    expect(code).not.toMatch(/Response\.redirect/);
  });

  it('starts a run when the lock, the gate, the middleware or the mirrored files change', () => {
    for (const path of ['.github/workflows/csoai-site-deploy.yml', 'scripts/csoai-site/**', 'public/.well-known/did.json', 'public/.well-known/scitt-keys']) at(`- '${path}'`);
    for (const entry of Object.values(lock.well_known)) if (entry.mirror) at(`- '${entry.mirror}'`);
  });

  it('gives the Cloudflare token to the read-only target check and the two uploads, in the deploy job, and to nothing else', () => {
    expect(code.match(/secrets\.CLOUDFLARE_API_TOKEN/g)?.length).toBe(3);
    expect(deploy.match(/secrets\.CLOUDFLARE_API_TOKEN/g)?.length).toBe(3);
    expect(code.match(/secrets\.[A-Z_]+/g)?.sort()).toEqual([
      'secrets.CLOUDFLARE_ACCOUNT_ID', 'secrets.CLOUDFLARE_ACCOUNT_ID', 'secrets.CLOUDFLARE_ACCOUNT_ID',
      'secrets.CLOUDFLARE_API_TOKEN', 'secrets.CLOUDFLARE_API_TOKEN', 'secrets.CLOUDFLARE_API_TOKEN',
    ]);
    // A value from the build job reaches a shell only through the environment, never as script text.
    expect(code.match(/\$\{\{ needs\.[^}]+\}\}/g)).toEqual(['${{ needs.build.outputs.source_head }}']);
    expect(deploy).toMatch(/SOURCE_HEAD: '\$\{\{ needs\.build\.outputs\.source_head \}\}'\n/);
    for (const line of code.split('\n')) {
      if (/\$\{\{/.test(line)) expect(line, 'an expression somewhere other than an env: or outputs: value').toMatch(/^\s+(CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|CANDIDATE_URL|SOURCE_HEAD|source_head): /);
    }
  });

  it('says, when a check fails after the write, that a rollback is undone by the next run unless the lock is held first', () => {
    const step = deploy.slice(at("if: failure() && steps.production.outcome == 'success'", deploy));
    const hold = at('HOLD FIRST', step);
    const rollback = at('THEN roll back', step);
    expect(hold).toBeLessThan(rollback);
    expect(step).toMatch(/sets \\"hold\\" in scripts\/csoai-site\/apex-lock\.json/);
    expect(step).toMatch(/uploads\n?.*this same build to production again/s);
  });
});

describe('pr-gates.yml covers this route before merge', () => {
  const code = runs('pr-gates.yml');

  it('runs the gated suite for a pull request that edits only csoai-site-deploy.yml', () => {
    const line = code.split('\n').find((l) => l.includes("grep -E '^("));
    expect(line, 'the scope regex line').toBeTruthy();
    const source = line.match(/grep -E '(\^\(.+\))'/)[1];
    expect(source).toContain('\\.github/workflows/csoai-site-deploy\\.yml$');
    // The regex as grep reads it, tried on real paths.
    const scope = new RegExp(source);
    expect(scope.test('.github/workflows/csoai-site-deploy.yml')).toBe(true);
    expect(scope.test('.github/workflows/pr-gates.yml')).toBe(true);
    expect(scope.test('scripts/csoai-site/apex-lock.json')).toBe(true);
    expect(scope.test('public/.well-known/did.json')).toBe(true);
    expect(scope.test('.github/workflows/csoai-site-deploy.yml.bak')).toBe(false);
    expect(scope.test('docs/README.md')).toBe(false);
  });

  it('checks the DID document against the origin with the rule that lets a planned key change through', () => {
    expect(code).toMatch(/run: node scripts\/csoai-site\/apex-gate\.mjs drift\n/);
    // The older check fails every key difference, planned or not. Left in, no key could ever change.
    expect(code).not.toMatch(/--did-drift/);
    expect(code).toMatch(/node scripts\/verify-estate\.mjs --limit 15\n/);
  });
});
