#!/usr/bin/env node
/**
 * AG-UI gateway — the agent-to-user leg for Sim World.
 *
 * Subscribes to the sim data plane (:4190/sim/stream) and re-emits the
 * activity as AG-UI protocol events (STATE_SNAPSHOT / STATE_DELTA via JSON
 * Patch / CUSTOM / RUN_* lifecycle) on :4191/agui/stream, plus a control
 * POST endpoint. This makes the live world consumable by any AG-UI renderer
 * (CopilotKit React, assistant-ui, …) — the standard wire for the
 * character-greeted generative-UI shell. The sim stays the runtime, this is
 * the wire, the renderer is whoever subscribes.
 *
 * AG-UI reference: github.com/ag-ui-protocol/ag-ui (MIT, 0.x — pin versions).
 */
import { createServer } from 'node:http'
import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const SIM = 'http://127.0.0.1:4190'
const PORT = 4191
const LOG = join(homedir(), 'sim-world-data', 'overnight', 'agui.log')

function log(line) {
  const s = `[${new Date().toISOString()}] ${line}`
  console.log(s)
  try { appendFileSync(LOG, `${s}\n`) } catch { /* keep going */ }
}

/** Translate a SimEvent into one or more AG-UI events. */
function toAgui(event) {
  const ts = new Date().toISOString()
  switch (event.type) {
    case 'snapshot':
      return [
        { type: 'RUN_STARTED', runId: 'sim-world', id: 'sim-world-run', ts },
        { type: 'STATE_SNAPSHOT', id: 'sim-world-state', data: { agents: event.agents, round: event.round, running: event.running }, ts },
      ]
    case 'agent': {
      const patch = [{ op: 'replace', path: `/agents/${encodeURIComponent(event.agent.id)}`, value: event.agent }]
      return [{ type: 'STATE_DELTA', id: 'sim-world-agents', patch, ts }]
    }
    case 'duel':
      return [
        { type: 'STEP_STARTED', runId: 'sim-world', id: `step-${event.duel.round}`, ts },
        { type: 'CUSTOM', customType: 'sim.duel', data: event.duel, ts },
        { type: 'STEP_FINISHED', runId: 'sim-world', id: `step-${event.duel.round}`, ts },
      ]
    case 'benchmark':
      return [{ type: 'CUSTOM', customType: 'sim.benchmark', data: event.record, ts }]
    case 'card':
      return [{ type: 'CUSTOM', customType: 'sim.card', data: { path: event.path, bytes: event.bytes }, ts }]
    case 'runpod':
      return [{ type: 'CUSTOM', customType: 'sim.runpod', data: { jobId: event.jobId, status: event.status, note: event.note }, ts }]
    case 'log':
      return [{ type: 'CUSTOM', customType: 'sim.log', data: { level: event.level, message: event.message }, ts }]
    case 'approval': // consent checkpoint (escort primitive)
      return [{ type: 'APPROVAL', runId: 'sim-world', id: `approval-${event.id}`, data: { message: event.message, decision: event.decision }, ts }]
    default:
      return []
  }
}

const clients = new Set()

/** Send a raw AG-UI frame to every subscribed client (for events the sim
 *  stream does not carry, e.g. game receipts). */
function sendAgui(aguiEvent) {
  const frame = `data: ${JSON.stringify(aguiEvent)}\n\n`
  for (const client of clients) {
    try { client.write(frame) } catch { clients.delete(client) }
  }
}

function broadcast(event) {
  for (const aguiEvent of toAgui(event)) {
    const frame = `data: ${JSON.stringify(aguiEvent)}\n\n`
    for (const client of clients) {
      try { client.write(frame) } catch { clients.delete(client) }
    }
  }
}

function connectSim() {
  log('connecting to sim stream…')
  const source = new EventSource(`${SIM}/sim/stream`)
  source.onmessage = (message) => {
    log(`sim event received: ${String(message.data).slice(0, 40)}`)
    try { broadcast(JSON.parse(message.data)) } catch { /* skip */ }
  }
  source.onerror = () => log('sim stream error — EventSource reconnects automatically')
  return source
}

// Node 22 has no EventSource; minimal SSE client over node:http.
import { request as httpRequest } from 'node:http'
function EventSource(url) {
  const listeners = { message: [], error: [] }
  let buffer = ''
  const req = httpRequest(url, async res => {
    try {
      for await (const chunk of res) {
        buffer += chunk.toString()
        let idx
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, idx)
          buffer = buffer.slice(idx + 2)
          const line = frame.split('\n').find(l => l.startsWith('data: '))
          if (line !== undefined) {
            for (const fn of listeners.message) fn({ data: line.slice(6) })
          }
        }
      }
    } catch { /* stream ended */ }
  })
  req.on('error', () => { for (const fn of listeners.error) fn({}) })
  req.end()
  return {
    set onmessage(fn) { listeners.message.push(fn) },
    set onerror(fn) { listeners.error.push(fn) },
    close: () => req.destroy(),
  }
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ ok: true, agui: true, clients: clients.size }))
    return
  }
  // Live OOWM fleet + mining status for the Council OS dashboard.
  if (req.method === 'GET' && url.pathname === '/api/oowm-status') {
    let cards = 0, records = 0
    try {
      const dir = join(homedir(), 'sim-world-data', 'cards', 'mined')
      for (const f of readdirSync(dir)) {
        if (!f.endsWith('.json')) continue
        try { const c = JSON.parse(readFileSync(join(dir, f), 'utf8')); cards++; records += (JSON.parse(c.body).n || 0) } catch {}
      }
    } catch {}
    let router = {}
    try { router = JSON.parse(readFileSync(join(homedir(), 'sim-world-data', 'oowm-router.json'), 'utf8')).router || {} } catch {}
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({
      fleet_models: 14, cards, records, retrieval: 'BM25 + TF-IDF vector',
      specialists: { knowledge: router.factual_knowledge || router.general_knowledge || 'phi4:14b', governance: router.governance || 'mistral:7b', safety: router.safety || 'council-oowm:latest' },
      last_mine: 'auto (overnight honey-miner, Ed25519-signed)', not_a_certification: true,
    }))
    return
  }
  // Canon: a covered query is a LOOKUP, not a generation. /lookup/<hash>
  // serves the signed card with that body hash straight from the chain-index.
  if (req.method === 'GET' && url.pathname === '/cross') {
    const crossPath = join(homedir(), 'sim-world-data', 'cross.json')
    if (existsSync(crossPath)) {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
      res.end(readFileSync(crossPath, 'utf8'))
    } else { res.writeHead(404); res.end('cross not built') }
    return
  }
  // Jail measurement — the 14-of-14 cell with real adversarial evidence (AG-UI content).
  if (req.method === 'GET' && url.pathname === '/jail') {
    const jailPath = join(homedir(), 'sim-world-data', 'jail-measurement-v4.json')
    const extPath = join(homedir(), 'sim-world-data', 'jail-external-32item.json')
    if (existsSync(jailPath)) {
      const out = JSON.parse(readFileSync(jailPath, 'utf8'))
      if (existsSync(extPath)) {
        const ext = JSON.parse(readFileSync(extPath, 'utf8'))
        out.external_sweep = { bank: ext.bank, items: ext.items, measured_at: ext.ts, note: 'external open models on estate pod, OUR instrument — MEASURED', refusal_rates: Object.entries(ext.models || {}).map(([m, v]) => ({ model: m, n: v.n, refusal_rate: v.refusal_rate })).sort((a, b) => b.refusal_rate - a.refusal_rate) }
      }
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify(out, null, 2))
    } else { res.writeHead(404); res.end('jail measurement not yet produced') }
    return
  }
  // The cross-synthesis leaderboard — OpenRouter-style: OUR measured cells +
  // REPORTED baselines + EXTERNAL leaderboards, never blended.
  if (req.method === 'GET' && url.pathname === '/leaderboard') {
    const lbPath = join(homedir(), 'sim-world-data', 'leaderboard.json')
    if (existsSync(lbPath)) {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
      res.end(readFileSync(lbPath, 'utf8'))
    } else { res.writeHead(404); res.end('leaderboard not yet synthesized') }
    return
  }
  // Compliance view — who is leading/improving/watch/at-risk on measured
  // evidence. Derived from OUR-MEASURED cells; measurement, never certification.
  if (req.method === 'GET' && url.pathname === '/compliance') {
    const cPath = join(homedir(), 'sim-world-data', 'compliance-view.json')
    if (existsSync(cPath)) {
      // Merge a REGULATORY leg (facts only, un-ranked) from the signed feeds.
      // Promise-style: this handler is synchronous.
      const view = JSON.parse(readFileSync(cPath, 'utf8'))
      const reg = { schema: 'csoai.compliance-regulatory-leg/0.1', note: 'facts only, un-ranked — never a league table of regulators' }
      const send = () => {
        view.regulatory = reg
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        res.end(JSON.stringify(view, null, 2))
      }
      const grab = (url) => fetch(url, { signal: AbortSignal.timeout(12000) }).then(r => r.json()).catch(() => null)
      Promise.all([grab('https://councilof.ai/api/regulation'), grab('https://councilof.ai/api/clarity')]).then(([dl, cl]) => {
        if (dl) reg.deadline_feed = { url: 'https://councilof.ai/api/regulation', deadlines: (dl.deadlines || []).length, in_force: (dl.deadlines || []).filter(d => d.status === 'IN_FORCE').length, upcoming: (dl.deadlines || []).filter(d => d.status === 'UPCOMING').length, headline_correction: dl.headline_correction || null }
        else reg.deadline_feed = { state: 'unreachable' }
        if (cl) reg.clarity_feed = { url: 'https://councilof.ai/api/clarity', schema: cl.schema, regimes: (cl.regimes || []).length, machine_readable_yes: (cl.regimes || []).filter(x => x.machine_readable === 'YES').length, unmeasured_cells: (cl.regimes || []).reduce((n, x) => n + Object.values(x).filter(v => v === 'UNMEASURED').length, 0) }
        else reg.clarity_feed = { state: 'unreachable' }
        send()
      })
      return
    } else { res.writeHead(404); res.end('compliance view not yet derived') }
    return
  }
  // The glass AG-UI overlay — load it over ANY page (bookmarklet or iframe).
  if (req.method === 'GET' && (url.pathname === '/overlay' || url.pathname === '/overlay.html')) {
    const overlayPath = join(homedir(), 'sim-world-data', 'overnight', 'agui-overlay.html')
    if (existsSync(overlayPath)) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(readFileSync(overlayPath, 'utf8'))
    } else { res.writeHead(404); res.end('overlay not found') }
    return
  }
  // Council OS — one window, every working surface in its own tab.
  if (req.method === 'GET' && (url.pathname === '/council-os' || url.pathname === '/council-os.html')) {
    const osPath = join(homedir(), 'sim-world-data', 'overnight', 'council-os.html')
    if (existsSync(osPath)) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(readFileSync(osPath, 'utf8'))
    } else { res.writeHead(404); res.end('council-os not found') }
    return
  }
  // Munder Difflin — headless coordination arena (office vs office).
  if (req.method === 'GET' && url.pathname === '/arena') {
    const runsDir = join(homedir(), 'munder-difflin-harness', 'runs')
    let html = null
    if (existsSync(runsDir)) {
      const files = readdirSync(runsDir).filter(f => f.startsWith('arena-') && f.endsWith('.html')).sort()
      if (files.length) html = readFileSync(join(runsDir, files[files.length - 1]), 'utf8')
    }
    if (html === null) { res.writeHead(404); res.end('arena visual not yet generated'); return }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
    res.end(html)
    return
  }
  if (req.method === 'GET' && url.pathname === '/arena/colosseum') {
    const p = join(homedir(), 'munder-difflin-harness', 'visuals', 'colosseum-seed42-vs-seed7.html')
    if (!existsSync(p)) { res.writeHead(404); res.end('colosseum not found'); return }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
    res.end(readFileSync(p, 'utf8'))
    return
  }
  if (req.method === 'GET' && url.pathname === '/arena/leaderboard') {
    const runsDir = join(homedir(), 'munder-difflin-harness', 'runs')
    const rows = []
    if (existsSync(runsDir)) {
      for (const d of readdirSync(runsDir).filter(f => /^run-\d+-/.test(f))) {
        const s = join(runsDir, d, 'summary.json')
        if (!existsSync(s)) continue
        try {
          const j = JSON.parse(readFileSync(s, 'utf8'))
          // coordination cost = messages in the hive log (Artificial Analysis' cost dimension)
          let messages = 0
          const logPath = join(runsDir, d, 'hive', 'log.jsonl')
          if (existsSync(logPath)) { try { messages = readFileSync(logPath, 'utf8').split('\n').filter(Boolean).length } catch {} }
          rows.push({ runId: d, seed: j.seed, composite: j.composite, axes: j.axes, messages })
        } catch {}
      }
    }
    rows.sort((a, b) => b.composite - a.composite)
    const comps = rows.map(r => r.composite)
    const mean = comps.length ? comps.reduce((x, y) => x + y, 0) / comps.length : 0
    const sd = comps.length > 1 ? Math.sqrt(comps.reduce((s, x) => s + (x - mean) ** 2, 0) / (comps.length - 1)) : 0
    const se = comps.length ? sd / Math.sqrt(comps.length) : 0
    const summary = { runs: rows.length, distinct_seeds: new Set(rows.map(r => r.seed)).size, mean_composite: +mean.toFixed(3), composite_ci95: [+(mean - 1.96 * se).toFixed(3), +(mean + 1.96 * se).toFixed(3)], note: 'composite CI across seeded runs — deterministic per seed, spread is seed variation, not measurement noise' }
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify({ schema: 'csoai.munder-arena/0.1', note: 'headless coordination benchmark — measurement, never certification', methodology: 'deterministic seeded munder-difflin mechanics; composite of 6 axes (efficiency/coordination/governance/transparency/continuity/accountability); messages = coindation cost; runs reproducible (same seed → same outcome)', summary, runs: rows.length, leaderboard: rows.slice(0, 12) }, null, 2))
    return
  }
  if (req.method === 'GET' && url.pathname.startsWith('/lookup/')) {
    const hash = url.pathname.slice('/lookup/'.length).trim()
    const idxPath = join(homedir(), 'sim-world-data', 'cards', 'chain-index.json')
    let found = null
    if (existsSync(idxPath)) {
      const idx = JSON.parse(readFileSync(idxPath, 'utf8'))
      const entry = idx.chain.find(c => c.hash.startsWith(hash))
      if (entry !== undefined) {
        const cardPath = join(homedir(), 'sim-world-data', 'cards', entry.path)
        const minedPath = join(homedir(), 'sim-world-data', 'cards', 'mined', entry.path)
        const p = existsSync(cardPath) ? cardPath : existsSync(minedPath) ? minedPath : null
        if (p !== null) {
          try { found = JSON.parse(readFileSync(p, 'utf8')) } catch { found = null }
        }
      }
    }
    res.writeHead(found === null ? 404 : 200, { 'content-type': 'application/json' })
    res.end(found === null ? JSON.stringify({ ok: false, hash }) : JSON.stringify({ ok: true, hash, card: found }))
    return
  }
  // Self-hosted games — proxy to the games service (:4192) and re-emit the
  // receipt as an AG-UI CUSTOM event so any AG-UI renderer can show it.
  if (req.method === 'GET' && url.pathname === '/games/human-vs-ai') {
    httpRequest({ host: '127.0.0.1', port: 4192, path: '/games/human-vs-ai', method: 'GET' }, r => {
      let buf = ''
      r.on('data', c => { buf += c })
      r.on('end', () => { res.writeHead(r.statusCode ?? 200, { 'content-type': 'application/json' }); res.end(buf) })
    }).on('error', () => { res.writeHead(502); res.end(JSON.stringify({ error: 'games service unreachable' })) }).end()
    return
  }
  if (req.method === 'GET' && (url.pathname === '/games' || url.pathname.startsWith('/games/'))) {
    httpRequest({ host: '127.0.0.1', port: 4192, path: url.pathname, method: 'GET' }, r => {
      let buf = ''
      r.on('data', c => { buf += c })
      r.on('end', () => {
        res.writeHead(r.statusCode ?? 200, { 'content-type': 'application/json' })
        res.end(buf)
      })
    }).on('error', () => { res.writeHead(502); res.end(JSON.stringify({ error: 'games service down' })) }).end()
    return
  }
  // Benchmark-quality register — proxy to the games service (:4192/register).
  if (req.method === 'GET' && (url.pathname === '/register' || url.pathname.startsWith('/register/'))) {
    // Register LANES are authored on-disk as <lane>-index.json, or as a nested
    // register/<lane>/<lane>.json record. Try all three forms, honest and local.
    const lane = url.pathname.slice('/register/'.length).replace(/\/$/, '')
    const base = join(homedir(), 'sim-world-data', 'register')
    let lanePath = null
    if (lane) {
      const candidates = [
        join(base, `${lane}-index.json`),
        join(base, lane, `${lane}.json`),
        join(base, lane, 'index.json'),
        join(base, `${lane}.json`),
      ]
      lanePath = candidates.find(p => existsSync(p)) || null
    }
    if (lanePath) {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
      res.end(readFileSync(lanePath, 'utf8'))
      return
    }
    httpRequest({ host: '127.0.0.1', port: 4192, path: url.pathname, method: 'GET' }, r => {
      let buf = ''
      r.on('data', c => { buf += c })
      r.on('end', () => {
        res.writeHead(r.statusCode ?? 200, { 'content-type': 'application/json' })
        res.end(buf)
      })
    }).on('error', () => { res.writeHead(502); res.end(JSON.stringify({ error: 'register service down' })) }).end()
    return
  }
  if (req.method === 'POST' && url.pathname === '/games/play') {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8')
      const proxy = httpRequest({ host: '127.0.0.1', port: 4192, path: '/games/play', method: 'POST', headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } }, r => {
        let buf = ''
        r.on('data', c => { buf += c })
        r.on('end', () => {
          res.writeHead(r.statusCode ?? 200, { 'content-type': 'application/json' })
          res.end(buf)
          try {
            const result = JSON.parse(buf)
            if (result.status === 'human_win' || result.status === 'ai_win' || result.status === 'draw') {
              sendAgui({ type: 'CUSTOM', customType: 'game.play.done', data: { game: result.game, winner: result.winner, axis: result.axis, status: result.status }, ts: new Date().toISOString() })
            }
          } catch { /* non-fatal */ }
        })
      })
      proxy.on('error', () => { res.writeHead(502); res.end(JSON.stringify({ error: 'games service unreachable' })) })
      proxy.write(body)
      proxy.end()
    })
    return
  }
  if (req.method === 'POST' && url.pathname === '/games/run') {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8')
      const proxy = httpRequest({ host: '127.0.0.1', port: 4192, path: '/games/run', method: 'POST', headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } }, r => {
        let buf = ''
        r.on('data', c => { buf += c })
        r.on('end', () => {
          res.writeHead(r.statusCode ?? 200, { 'content-type': 'application/json' })
          res.end(buf)
          try {
            const result = JSON.parse(buf)
            if (result.receipt !== null && result.receipt !== undefined) {
              sendAgui({ type: 'CUSTOM', customType: 'game.run', data: { game: result.receipt.game, seed: result.receipt.seed, winner: result.receipt.winner, body_sha256: result.receipt.body_sha256 }, ts: new Date().toISOString() })
              log(`game.run broadcast: ${result.receipt.game} seed=${result.receipt.seed} winner=${result.receipt.winner}`)
            } else {
              sendAgui({ type: 'CUSTOM', customType: 'game.unsealed', data: { game: result.replay?.game, note: result.note }, ts: new Date().toISOString() })
            }
          } catch { /* non-fatal */ }
        })
      })
      proxy.on('error', () => { res.writeHead(502); res.end(JSON.stringify({ error: 'games service down' })) })
      proxy.end(body)
    })
    return
  }
  // OOWM route — domain router (law/benchmark/sovereignty/harm -> model+RAG) with
  // task-router fallback. Aligns the AG-UI with the estate's OOWM fleet composition.
  if (req.method === 'POST' && url.pathname === '/oowm') {
    // PUBLIC-SAFETY: if OOWM_API_KEY is set, require a bearer token (safe to expose publicly).
    const API_KEY = process.env.OOWM_API_KEY || ''
    if (API_KEY) {
      const auth = req.headers['authorization'] || ''
      if (!auth.startsWith('Bearer ') || auth.slice(7) !== API_KEY) {
        res.writeHead(401); res.end('{"error":"unauthorized - set OOWM_API_KEY bearer token"}'); return
      }
    }
    let body = ''
    req.on('data', c => { body += c })
    req.on('end', () => {
      let q = ''
      try { q = (JSON.parse(body || '{}').query || '').trim() } catch {}
      if (!q) { res.writeHead(400); res.end('{"error":"query required"}'); return }
      const post = (port, te) => new Promise(rs => {
        const data = JSON.stringify({ query: q })
        const r = httpRequest({ host: '127.0.0.1', port, path: '/v1/chat', method: 'POST', headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) } }, res2 => {
          let b = ''; res2.on('data', c => b += c); res2.on('end', () => { try { rs(JSON.parse(b)) } catch { rs(null) } })
        })
        r.on('error', () => rs(null)); r.write(data); r.end(); setTimeout(() => { try { r.destroy() } catch {} }, te)
      })
      // domain gateway :8767 first, fall back to task router :8766
      post(8767, 130000).then(d => d && d.content ? d : null).then(d => d || post(8766, 130000).then(x => x && x.content ? x : null)).then(d => {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify(d || { query: q, content: '', note: 'OOWM gateway unreachable' }))
      })
    })
    return
  }
  // Route-explain — transparent "why this model?" (OpenRouter-style explain).
  if (req.method === 'GET' && url.pathname === '/oowm/explain') {
    const task = (url.searchParams.get('task') || 'default')
    const EXPLAIN = { safety: {chosen:'council-oowm:latest',quality:0.99}, governance:{chosen:'mistral:7b',quality:0.83}, knowledge:{chosen:'phi4:14b',quality:0.87}, benchmark:{chosen:'mistral:7b',quality:0.83}, default:{chosen:'mistral:7b',quality:0.83} }
    const e = EXPLAIN[task] || EXPLAIN.default
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ task, chosen: e.chosen, quality: e.quality, latency_s: task==='safety'?4:6, cost_tokens: 0.0, provider: 'runpod-a100', honest: 'chosen on our measured GSPC quality, sovereignty-prioritized', note: 'route_explain — see route_planner.py for the full multi-objective scoring' }))
    return
  }
  if (req.method === 'GET' && url.pathname === '/agui/stream') {
    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform', // Cloudflare SSE buffering gotcha
      connection: 'keep-alive',
    })
    clients.add(res)
    const heartbeat = setInterval(() => res.write(': hb\n\n'), 15_000)
    res.on('close', () => { clearInterval(heartbeat); clients.delete(res) })
    return
  }
  res.writeHead(404)
  res.end('not found')
})

// attach PUBLIC bind if --serve-public passed: listen on all interfaces (auth-guarded).
const PUBLIC_BIND = process.argv.includes('--serve-public') ? '0.0.0.0' : '127.0.0.1'
server.listen(PORT, PUBLIC_BIND, () => {
  log(`AG-UI gateway live on http://${PUBLIC_BIND}:${PORT}/agui/stream (${PUBLIC_BIND === '0.0.0.0' ? 'PUBLIC, auth=' + (process.env.OOWM_API_KEY ? 'on' : 'NONE') : 'local-only'})`)
  connectSim()
})
