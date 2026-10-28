#!/usr/bin/env node
// sites_census.mjs — one honest read of every compute and surface site the estate can reach.
//
// Doctrine (docs/DOCTRINE.md): a lock is not a grade; UNMEASURED is first-class; fail closed.
// So this tool NEVER claims a capacity it did not read. Every row carries the probe that
// produced it and an as_of. A site that could not be reached is UNREACHABLE, not a zero.
//
// Classes:
//   compute   — a machine we can ssh into (self-hosted / cloud pod / edge node)
//   edge     — this Mac (CPU + GPU + unified memory)
//   provider — a free-tier or metered API endpoint (HF, Kaggle, Colab, RunPod, ...)
//   n_site   — the estate's own N-site hunt (registry rows, evidence bundles, lane state)
//
// Usage:
//   node tools/sites/sites_census.mjs --out-json evidence/sites-census/sites_census.json \
//                                     --out-md   evidence/sites-census/SITES-CENSUS.md
//
// Exit code is always 0: a census that fails is not a failed census, it is a census with
// UNREACHABLE rows. Callers read the file.

import { execFile } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const argv = process.argv.slice(2);
const arg = (k, d = null) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const OUT_JSON = arg('out-json', 'evidence/sites-census/sites_census.json');
const OUT_MD = arg('out-md', 'evidence/sites-census/SITES-CENSUS.md');
const NOW = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

// ---------------------------------------------------------------- compute sites
const SSH_HOSTS = [
  { host: 'm2', label: 'M2 MacBook Air (LAN)' },
  { host: 'oracle-micro-2', label: 'Oracle micro — sov33-owem-micro2' },
  { host: 'rp-3090-now', label: 'RunPod pod — rp-3090-now (main engine)' },
  { host: 'meok-backend', label: 'meok-backend' },
  { host: 'sov-brain-2', label: 'sov-brain-2' },
  { host: 'redblue-pod', label: 'redblue-pod' },
  { host: 'sovos-light-a100', label: 'sovos-light-a100' },
  { host: 'sovos-agent-vm', label: 'sovos-agent-vm' },
  { host: 'csoai-backend-vm', label: 'csoai-backend-vm' },
  { host: 'sovos-volume-sink', label: 'sovos-volume-sink' },
  { host: 'sov-r4090-a', label: 'sov-r4090-a' },
  { host: 'sov-r4090-b', label: 'sov-r4090-b' },
  { host: 'sov-r4090-c', label: 'sov-r4090-c' },
  { host: '0i7oa4ptfow4jj.runpod.io', label: 'RunPod (named host)' },
  { host: '4gjzysaeqfy3j9.runpod.io', label: 'RunPod (named host)' },
];

// One POSIX-sh probe that works on Linux pods AND macOS edge boxes.
// Fields: hostname|cpu_usable|cpu_host|ram_gib|gpu|cpu_model|uptime_s
// cpu_usable is cgroup-quota aware (nproc); cpu_host is the raw thread count. The difference
// is the whole story on a quota'd pod, so both are reported.
const REMOTE_PROBE = [
  `mem=$(awk '/MemTotal/{printf "%.0f",$2/1048576}' /proc/meminfo 2>/dev/null)`,
  `[ -z "$mem" ] && mem=$(( $(sysctl -n hw.memsize 2>/dev/null || echo 0) / 1073741824 ))`,
  `cpus=$(nproc 2>/dev/null)`,
  `[ -z "$cpus" ] && cpus=$(sysctl -n hw.ncpu 2>/dev/null)`,
  `hostcpus=$(grep -c '^processor' /proc/cpuinfo 2>/dev/null)`,
  `[ -z "$hostcpus" ] && hostcpus=$(sysctl -n hw.logicalcpu 2>/dev/null)`,
  `model=$(awk -F': ' '/^model name/{print $2;exit}' /proc/cpuinfo 2>/dev/null)`,
  `[ -z "$model" ] && model=$(sysctl -n machdep.cpu.brand_string 2>/dev/null)`,
  `gpu=$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | tr '\n' ',')`,
  `gpu=\${gpu%,}`,
  `[ -z "$gpu" ] && gpu=$(system_profiler SPDisplaysDataType 2>/dev/null | awk -F': ' '/Chipset Model/{print $2;exit}')`,
  `up=$(cut -d. -f1 /proc/uptime 2>/dev/null)`,
  `[ -z "$up" ] && up=$(( $(date +%s) - $(sysctl -n kern.boottime 2>/dev/null | sed -E 's/^\\{ sec = ([0-9]+).*/\\1/') ))`,
  `echo "$(hostname | cut -c1-24)|\${cpus:-0}|\${hostcpus:-0}|\${mem:-0}|\${gpu:-none}|\${model:-unknown}|\${up:-0}"`,
].join('; ');

function ssh(host, cmd, timeoutMs = 9000) {
  return new Promise((resolve) => {
    const child = execFile(
      'ssh',
      ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=7', '-o', 'StrictHostKeyChecking=no', host, cmd],
      { timeout: timeoutMs, maxBuffer: 1 << 20 },
      (err, stdout) => resolve(err ? null : String(stdout).trim()),
    );
    child.on('error', () => resolve(null));
  });
}

async function probeCompute(site) {
  const raw = await ssh(site.host, REMOTE_PROBE);
  if (!raw) {
    return { id: `compute:${site.host}`, class: 'compute', name: site.label, state: 'UNREACHABLE', probe: `ssh ${site.host}`, detail: 'no ssh session' };
  }
  const [hostname, cpus, hostcpus, ram, gpu, cpuModel, uptime] = raw.split('|');
  return {
    id: `compute:${site.host}`,
    class: 'compute',
    name: site.label,
    state: 'REACHABLE',
    endpoint: site.host,
    cpu_model: cpuModel || 'unknown',
    cpu_cores: Number(cpus) || 0,
    cpu_host_cores: Number(hostcpus) || 0,
    cpu_quota_limited: Number(hostcpus) > Number(cpus) && Number(cpus) > 0,
    ram_gib: Number(ram) || 0,
    gpu: gpu && gpu !== 'none' ? gpu : null,
    uptime_s: Number(uptime) || 0,
    probe: `ssh ${site.host} → hostname|cpu|host|ram|gpu|model|uptime`,
    detail: gpu && gpu !== 'none' ? 'GPU present' : 'no GPU visible',
  };
}

// ---------------------------------------------------------------- provider sites
const HTTP_PROBES = [
  { id: 'hf-models', name: 'Hugging Face — models hub', url: 'https://huggingface.co/api/models?limit=1', free: true },
  { id: 'hf-spaces', name: 'Hugging Face — Spaces', url: 'https://huggingface.co/api/spaces?limit=1', free: true },
  { id: 'hf-router', name: 'Hugging Face — inference router (OpenAI-compat)', url: 'https://router.huggingface.co/v1/models', free: true },
  { id: 'hf-spaces-csoai', name: 'Hugging Face — csoai org', url: 'https://huggingface.co/api/models?author=csoai&limit=1', free: true },
  { id: 'kaggle-models', name: 'Kaggle — models API', url: 'https://www.kaggle.com/api/v1/models/list?pageSize=1', free: true },
  { id: 'kaggle-kernels', name: 'Kaggle — notebooks API', url: 'https://www.kaggle.com/api/v1/kernels/list?pageSize=1', free: true },
  { id: 'colab', name: 'Google Colab', url: 'https://colab.research.google.com/', free: true },
  { id: 'lightning', name: 'Lightning AI (free studios)', url: 'https://lightning.ai/', free: true },
  { id: 'brev', name: 'Brev', url: 'https://brev.dev/', free: true },
  { id: 'paperspace', name: 'Paperspace', url: 'https://www.paperspace.com/', free: true },
  { id: 'runpod', name: 'RunPod — console', url: 'https://www.runpod.io/console', free: false },
  { id: 'lambda', name: 'Lambda Cloud', url: 'https://cloud.lambda.ai/', free: false },
  { id: 'together', name: 'Together AI', url: 'https://api.together.xyz/v1/models', free: false },
  { id: 'groq', name: 'Groq', url: 'https://api.groq.com/openai/v1/models', free: false },
  { id: 'moonshot', name: 'Moonshot / Kimi — OpenAI-compat', url: 'https://api.moonshot.ai/v1/models', free: false },
  { id: 'csoai-board', name: 'CSOAI — live GSPC board', url: 'https://councilof.ai/api/gspc', free: true },
  { id: 'csoai-root', name: 'CSOAI — public root', url: 'https://councilof.ai/root.json', free: true },
];

async function probeHttp(p) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(p.url, { signal: ctrl.signal, redirect: 'follow' });
    const body = r.status === 200 ? await r.text().catch(() => '') : '';
    let population = null;
    if (['hf-models', 'hf-spaces', 'hf-spaces-csoai'].includes(p.id)) {
      try { const j = JSON.parse(body); population = Array.isArray(j) ? j.length : null; } catch { /* not json */ }
    }
    if (p.id === 'kaggle-models') {
      try { const j = JSON.parse(body); population = j?.totalResults ?? j?.models?.length ?? null; } catch { /* not json */ }
    }
    if (['moonshot', 'hf-router', 'together', 'groq'].includes(p.id)) {
      try { const j = JSON.parse(body); population = Array.isArray(j?.data) ? j.data.length : null; } catch { /* not json */ }
    }
    return {
      id: `provider:${p.id}`, class: 'provider', name: p.name,
      state: r.status === 200 ? 'REACHABLE' : `HTTP_${r.status}`,
      endpoint: p.url, http_status: r.status, free_tier: p.free, population,
      probe: `GET ${p.url}`,
      detail: (r.status === 401 || r.status === 403)
        ? 'reachable, credential required (401/403)'
        : r.status === 200 ? 'reachable unauthenticated' : 'not reachable unauthenticated',
    };
  } catch (e) {
    return { id: `provider:${p.id}`, class: 'provider', name: p.name, state: 'UNREACHABLE', endpoint: p.url, free_tier: p.free, probe: `GET ${p.url}`, detail: `transport error: ${e?.name || 'Error'}` };
  } finally {
    clearTimeout(t);
  }
}

// ---------------------------------------------------------------- n-site lane
async function probeNsiteLane() {
  const cmd = [
    `D=~/lanes/nsite-onboard/done.jsonl`, `Q=~/lanes/nsite-onboard/queue.jsonl`,
    `L=~/lanes/logs/onboard-live.log`,
    `echo "DONE=$(grep -c . $D 2>/dev/null || echo 0)"`,
    `echo "JOINED=$(grep -c 'MEASURED (connected to harness)' $L 2>/dev/null || echo 0)"`,
    `echo "LISTED=$(grep -c '| LISTED' $L 2>/dev/null || echo 0)"`,
    `echo "QUEUE=$(grep -c . $Q 2>/dev/null || echo 0)"`,
    `echo "EVIDENCE=$(ls ~/lanes/nsite-onboard/evidence 2>/dev/null | wc -l)"`,
    `echo "EMPTY_MARKER=$([ -f ~/lanes/nsite-onboard/QUEUE_EMPTY ] && echo yes || echo no)"`,
    `echo "LASTLOG=$(tail -1 $L 2>/dev/null | cut -c1-120)"`,
    `echo "LOGA=$(stat -c %y $L 2>/dev/null | cut -d. -f1)"`,
    `echo "REGISTRY=$(grep -c . ~/lanes/layer-o-registry/registry.jsonl 2>/dev/null || echo 0)"`,
  ].join('; ');
  const raw = await ssh('oracle-micro-2', cmd, 15000);
  if (!raw) {
    return { id: 'n_site:onboard-lane', class: 'n_site', name: 'N-site onboard lane (Oracle micro)', state: 'UNREACHABLE', probe: 'ssh oracle-micro-2 → lane counters', detail: 'no ssh session' };
  }
  const kv = Object.fromEntries(raw.split('\n').filter(Boolean).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1)];
  }));
  const done = Number(kv.DONE) || 0;
  const joined = Number(kv.JOINED) || 0;
  const queue = Number(kv.QUEUE) || 0;
  const logAgeH = kv.LOGA ? Math.round((Date.now() - Date.parse(kv.LOGA)) / 3600000) : null;
  // A lane whose queue is empty and whose log has not moved is NOT live, whatever the
  // pulled file says. This is the check the puller was missing.
  const live = queue > 0 && (logAgeH === null || logAgeH <= 2);
  return {
    id: 'n_site:onboard-lane', class: 'n_site', name: 'N-site onboard lane (Oracle micro)',
    state: live ? 'LIVE' : 'STALLED',
    endpoint: 'ssh oracle-micro-2:~/lanes/nsite-onboard',
    population: done, joined, listed: Number(kv.LISTED) || 0,
    queue_remaining: queue, evidence_bundles: Number(kv.EVIDENCE) || 0,
    registry_rows: Number(kv.REGISTRY) || 0, log_age_hours: logAgeH,
    queue_empty_marker: kv.EMPTY_MARKER === 'yes',
    probe: 'ssh oracle-micro-2 → done/joined/queue/evidence counters',
    detail: kv.LASTLOG || '',
  };
}

// ---------------------------------------------------------------- edge (this Mac)
async function probeEdge() {
  const { execFileSync } = await import('node:child_process');
  const run = (c) => { try { return execFileSync('/bin/sh', ['-c', c], { encoding: 'utf8' }).trim(); } catch { return null; } };
  const brand = run('sysctl -n machdep.cpu.brand_string');
  const ncpu = Number(run('sysctl -n hw.ncpu')) || 0;
  const mem = Number(run('sysctl -n hw.memsize')) || 0;
  const gpuCores = run('system_profiler SPDisplaysDataType 2>/dev/null | grep "Total Number of Cores" | head -1 | grep -oE "[0-9]+"');
  return {
    id: 'edge:this-mac', class: 'edge', name: 'This Mac (session host)', state: 'REACHABLE',
    endpoint: 'local', cpu_model: brand, cpu_cores: ncpu,
    ram_gib: mem ? Math.round(mem / 1073741824) : 0,
    gpu: gpuCores ? `Apple unified GPU (${gpuCores} cores, Metal)` : 'Apple unified GPU',
    probe: 'sysctl machdep.cpu.brand_string / hw.ncpu / hw.memsize + SPDisplaysDataType',
    detail: 'unified memory — CPU and GPU share the same pool',
  };
}

// ---------------------------------------------------------------- main
const [compute, provider, nsite, edge] = await Promise.all([
  Promise.all(SSH_HOSTS.map(probeCompute)),
  Promise.all(HTTP_PROBES.map(probeHttp)),
  probeNsiteLane(),
  probeEdge(),
]);

const sites = [...compute, ...provider, nsite, edge];
const reachableCompute = compute.filter((c) => c.state === 'REACHABLE');
const gpuSites = reachableCompute.filter((c) => c.gpu);
const freeProviders = provider.filter((p) => p.free_tier && p.state === 'REACHABLE');
const providerReachable = provider.filter((p) => p.state === 'REACHABLE');
const totalCpu = reachableCompute.reduce((a, c) => a + (c.cpu_cores || 0), 0);
const totalRam = reachableCompute.reduce((a, c) => a + (c.ram_gib || 0), 0);

const census = {
  kind: 'csoai.sites-census/0.1',
  as_of: NOW,
  note:
    'A census is a receipt of what was read, not a grade of what exists. Rows are LIVE/REACHABLE only when the ' +
    'named probe succeeded in this run. UNREACHABLE is not a zero. A site absent from this file was not probed.',
  counts: {
    sites_probed: sites.length,
    compute_declared: SSH_HOSTS.length,
    compute_reachable: reachableCompute.length,
    compute_with_gpu: gpuSites.length,
    edge_nodes: 1,
    providers_probed: HTTP_PROBES.length,
    providers_reachable: providerReachable.length,
    free_tier_reachable: freeProviders.length,
    cpu_cores_reachable: totalCpu,
    ram_gib_reachable: totalRam,
    n_site_lane_state: nsite.state,
    n_site_done: nsite.population ?? null,
    n_site_joined: nsite.joined ?? null,
  },
  sites,
};

mkdirSync(dirname(OUT_JSON), { recursive: true });
writeFileSync(OUT_JSON, `${JSON.stringify(census, null, 2)}\n`);

const md = [];
md.push(`# Sites census — ${NOW}`);
md.push('');
md.push('Generated by `tools/sites/sites_census.mjs`. A census is a receipt of what was read, not a grade.');
md.push('`UNREACHABLE` is not a zero. A site not listed here was not probed.');
md.push('');
md.push('| metric | value |');
md.push('|---|---|');
for (const [k, v] of Object.entries(census.counts)) md.push(`| ${k} | ${v} |`);
md.push('');
md.push('## Compute sites');
md.push('');
md.push('| site | state | cpu (usable/host) | ram GiB | gpu | uptime s |');
md.push('|---|---|---|---|---|---|');
for (const c of compute) {
  md.push(`| ${c.name} | ${c.state} | ${c.cpu_cores ?? '—'} / ${c.cpu_host_cores ?? '—'} | ${c.ram_gib ?? '—'} | ${c.gpu ?? '—'} | ${c.uptime_s ?? '—'} |`);
}
md.push('');
md.push('## Provider / free-tier endpoints');
md.push('');
md.push('| site | state | http | population | note |');
md.push('|---|---|---|---|---|');
for (const p of provider) {
  md.push(`| ${p.name} | ${p.state} | ${p.http_status ?? '—'} | ${p.population ?? '—'} | ${p.detail} |`);
}
md.push('');
md.push('## Edge');
md.push('');
md.push('| site | state | cpu | ram GiB | gpu |');
md.push('|---|---|---|---|---|');
for (const e of [edge]) md.push(`| ${e.name} | ${e.state} | ${e.cpu_model} ${e.cpu_cores} | ${e.ram_gib} | ${e.gpu} |`);
md.push('');
md.push('## N-site lane');
md.push('');
md.push('```json');
md.push(JSON.stringify(nsite, null, 2));
md.push('```');
md.push('');

mkdirSync(dirname(OUT_MD), { recursive: true });
writeFileSync(OUT_MD, `${md.join('\n')}\n`);

console.log(JSON.stringify(census.counts, null, 2));
console.log(`\nwrote ${OUT_JSON}\nwrote ${OUT_MD}`);
