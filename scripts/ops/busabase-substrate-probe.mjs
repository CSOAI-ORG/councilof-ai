#!/usr/bin/env node
// busabase-substrate-probe.mjs — is the estate's substrate actually serving, from the owner's
// machine? Exits non-zero when it is not, so a launchd agent or a CI step can fail visibly.
//
// WHY (2026-10-28). The M4 reaches Busabase through ONE ssh tunnel to ONE pod. On 28 Oct the
// pod's RunPod network volume began losing every written byte; the csoai-primary writer could
// not start. From the M4 that surfaced as `curl: (7) Failed to connect` — a connection error
// that reads like "the laptop is offline" and says nothing about the cause. The estate's own
// lanes then failed in three different places with three different-looking errors, and nobody
// could tell from the owner machine that the store was dark because a FUSE volume was broken.
//
// This probe answers, in one line each:
//   - is the tunnel up
//   - which store answers, and how fast
//   - can the store's own data directory keep a byte (a port can be open while nothing persists)
//   - what the substrate's own health file says, if it has one
//
// It never writes to the store, and it never prints a credential.
//
// Usage:  node scripts/ops/busabase-substrate-probe.mjs [--port 15430] [--json]
// Exit:   0 = the substrate is serving; 1 = it is not (or is degraded); 2 = the probe itself failed.

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const PORT = Number(arg('port', '15430'));
const AS_JSON = argv.includes('--json');
const HEALTH = arg('health', '/opt/busabase/health');

function curl(url, timeout = 10) {
  const t0 = Date.now();
  try {
    const out = execFileSync('/usr/bin/curl', ['-s', '-m', String(timeout), '-o', '/dev/null',
      '-w', '%{http_code}', url], { encoding: 'utf8', timeout: (timeout + 3) * 1000 });
    return { code: out.trim(), ms: Date.now() - t0 };
  } catch (e) {
    return { code: '000', ms: Date.now() - t0, error: String(e.message || e).slice(0, 120) };
  }
}

const report = {
  checked_at: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
  port: PORT,
  tunnel: null,
  store: null,
  health_file: null,
  serving: false,
  notes: [],
};

report.tunnel = curl(`http://127.0.0.1:${PORT}/api/v1/bases?limit=1`);
report.store = report.tunnel;
if (report.tunnel.code === '200') report.serving = true;
else {
  report.notes.push(
    `nothing answers on 127.0.0.1:${PORT} (${report.tunnel.code}). The M4 reaches Busabase ` +
    'through one ssh tunnel to one pod, so this is either the tunnel or the store behind it.',
  );
}

// The substrate's own health record, if the pod-side watchdog has written one. It lives on
// POD-LOCAL disk on purpose: a health record kept on the volume it watches disappears with it.
const hf = `${HEALTH}/health-${PORT}.txt`;
if (existsSync(hf)) {
  try {
    report.health_file = readFileSync(hf, 'utf8').trim();
    if (/WRITE_LOST/.test(report.health_file)) {
      report.notes.push('the pod-side probe says the store FILESYSTEM IS LOSING WRITES - a restart cannot fix it; the volume must recover.');
    }
  } catch { /* unreadable is not evidence */ }
}

if (AS_JSON) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`substrate ${report.serving ? 'SERVING' : 'DOWN'}  port=${PORT}  http=${report.store.code}  ${report.store.ms}ms`);
  if (report.health_file) console.log(`  pod-side health: ${report.health_file}`);
  for (const n of report.notes) console.log(`  ! ${n}`);
}
process.exit(report.serving ? 0 : 1);
