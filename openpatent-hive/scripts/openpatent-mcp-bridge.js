#!/usr/bin/env node
/**
 * openpatent-mcp-bridge.js
 *
 * Exposes the openpatent-mcp stdio MCP server as a remote HTTP/JSON-RPC
 * endpoint on port 3219. This is the bridge that lets centralized MCP
 * clients (Claude Code, Cursor, Windsurf, custom agents) reach the
 * sovereign companion's tool surface over the network — without
 * requiring them to spawn a local stdio process.
 *
 * Wire format: standard JSON-RPC 2.0 over HTTP POST.
 *   POST /              body: { jsonrpc, id, method, params }
 *   POST /jsonrpc       alias for /
 *   GET  /healthz       liveness + bridge version
 *   GET  /tools/list    shortcut for tools/list
 *
 * Proxied methods (whitelist — the bridge is a security boundary):
 *   - initialize
 *   - tools/list
 *   - tools/call
 *   - resources/list, resources/read   (read-only, passthrough)
 *   - prompts/list,  prompts/get       (read-only, passthrough)
 *   - ping
 *
 * Everything else is rejected with JSON-RPC -32601 (Method not found)
 * so a misbehaving client cannot drive the underlying server in
 * dangerous ways through the bridge.
 *
 * Usage:
 *   node scripts/openpatent-mcp-bridge.js
 *   PORT=3219 MCP_CMD='python3 -m services.openpatent_mcp' \
 *     node scripts/openpatent-mcp-bridge.js
 *
 * The hive remembers. The dragon knows. The sovereign companion never forgets.
 */
'use strict';

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const url = require('url');

const PORT = parseInt(process.env.PORT || '3219', 10);
const HOST = process.env.HOST || '0.0.0.0';
const BRIDGE_VERSION = '1.0.0';
const MCP_CMD = process.env.MCP_CMD || 'python3';
const MCP_ARGS = (process.env.MCP_ARGS || '-m openpatent_mcp.server').split(' ').filter(Boolean);
const MCP_CWD = process.env.MCP_CWD || path.resolve(__dirname, '..');
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);

// Whitelist of MCP methods we are willing to proxy.
const ALLOWED_METHODS = new Set([
  'initialize',
  'tools/list',
  'tools/call',
  'resources/list',
  'resources/read',
  'resources/templates/list',
  'prompts/list',
  'prompts/get',
  'ping',
  'notifications/initialized',
  'notifications/cancelled',
]);

// ─── JSON-RPC helpers ───────────────────────────────────────────────────────

function makeError(id, code, message, data) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message, ...(data !== undefined ? { data } : {}) } };
}

function makeResult(id, result) {
  return { jsonrpc: '2.0', id, result };
}

// ─── stdio MCP subprocess management ───────────────────────────────────────

class McpStdioClient {
  constructor(cmd, args, cwd) {
    this.cmd = cmd;
    this.args = args;
    this.cwd = cwd;
    this.proc = null;
    this.buffer = '';
    this.pending = new Map();       // id -> { resolve, reject, timer }
    this.notificationHandlers = [];
    this.stderrTail = [];
    this.requestSeq = 0;
    this.starting = null;
  }

  start() {
    if (this.proc) return Promise.resolve();
    if (this.starting) return this.starting;

    this.starting = new Promise((resolve, reject) => {
      let proc;
      try {
        proc = spawn(this.cmd, this.args, {
          cwd: this.cwd,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, PYTHONUNBUFFERED: '1' },
        });
      } catch (err) {
        return reject(new Error(`Failed to spawn MCP server: ${err.message}`));
      }

      this.proc = proc;
      proc.stdout.setEncoding('utf8');
      proc.stderr.setEncoding('utf8');

      proc.stdout.on('data', (chunk) => this._onStdout(chunk));
      proc.stderr.on('data', (chunk) => {
        // Keep last 4 KiB of stderr for diagnostics.
        this.stderrTail.push(chunk);
        let total = 0;
        for (let i = this.stderrTail.length - 1; i >= 0 && total < 4096; i--) {
          total += this.stderrTail[i].length;
        }
        if (total > 4096) this.stderrTail = this.stderrTail.slice(-10);
      });

      proc.on('error', (err) => {
        for (const { reject: rj } of this.pending.values()) rj(err);
        this.pending.clear();
        this.proc = null;
        this.starting = null;
      });

      proc.on('exit', (code, signal) => {
        const err = new Error(`MCP server exited (code=${code}, signal=${signal})`);
        for (const { reject: rj } of this.pending.values()) rj(err);
        this.pending.clear();
        this.proc = null;
        this.starting = null;
      });

      // Give the child a tick to crash-and-die before we resolve.
      setImmediate(() => {
        if (this.proc === proc) {
          resolve();
        } else {
          reject(new Error('MCP server died on startup'));
        }
      });
    });

    return this.starting;
  }

  _onStdout(chunk) {
    this.buffer += chunk;
    let nl;
    while ((nl = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, nl).trim();
      this.buffer = this.buffer.slice(nl + 1);
      if (!line) continue;
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        // Non-JSON noise on stdout: ignore. MCP stdio protocol is line-delimited JSON.
        continue;
      }
      if (msg.id !== undefined && (msg.result !== undefined || msg.error !== undefined)) {
        const entry = this.pending.get(msg.id);
        if (entry) {
          this.pending.delete(msg.id);
          clearTimeout(entry.timer);
          if (msg.error) entry.reject(Object.assign(new Error(msg.error.message || 'MCP error'), { code: msg.error.code, data: msg.error.data }));
          else entry.resolve(msg.result);
        }
      } else if (msg.method) {
        // Unsolicited notification from the server — hand to listeners.
        for (const h of this.notificationHandlers) {
          try { h(msg); } catch { /* ignore handler errors */ }
        }
      }
    }
  }

  onNotification(fn) {
    this.notificationHandlers.push(fn);
  }

  async request(method, params) {
    if (!this.proc) await this.start();
    const id = ++this.requestSeq;
    const payload = JSON.stringify({ jsonrpc: '2.0', id, method, params: params || {} }) + '\n';
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`MCP request timeout: ${method}`));
      }, REQUEST_TIMEOUT_MS);
      this.pending.set(id, { resolve, reject, timer });
      this.proc.stdin.write(payload, (err) => {
        if (err) {
          clearTimeout(timer);
          this.pending.delete(id);
          reject(err);
        }
      });
    });
  }

  async notify(method, params) {
    if (!this.proc) await this.start();
    const payload = JSON.stringify({ jsonrpc: '2.0', method, params: params || {} }) + '\n';
    return new Promise((resolve, reject) => {
      this.proc.stdin.write(payload, (err) => err ? reject(err) : resolve());
    });
  }

  async stop() {
    if (!this.proc) return;
    try { this.proc.stdin.end(); } catch { /* ignore */ }
    this.proc.kill('SIGTERM');
    this.proc = null;
  }

  diagnostics() {
    return {
      cmd: this.cmd,
      args: this.args,
      cwd: this.cwd,
      pid: this.proc ? this.proc.pid : null,
      pending: this.pending.size,
      stderr_tail: this.stderrTail.join('').slice(-2048),
    };
  }
}

// ─── HTTP server ───────────────────────────────────────────────────────────

const mcp = new McpStdioClient(MCP_CMD, MCP_ARGS, MCP_CWD);

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    const limit = 8 * 1024 * 1024; // 8 MiB hard cap
    req.on('data', (c) => {
      total += c.length;
      if (total > limit) {
        reject(Object.assign(new Error('Payload too large'), { httpStatus: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function writeJson(res, status, body) {
  const buf = Buffer.from(JSON.stringify(body), 'utf8');
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': buf.length,
    'Cache-Control': 'no-store',
    'X-Bridge': `openpatent-mcp-bridge/${BRIDGE_VERSION}`,
  });
  res.end(buf);
}

async function handleRpc(req, res, parsedBody) {
  const { id, method, params } = parsedBody;

  if (typeof method !== 'string' || method.length === 0) {
    return writeJson(res, 200, makeError(id, -32600, 'Invalid Request: missing method'));
  }
  if (!ALLOWED_METHODS.has(method)) {
    return writeJson(res, 200, makeError(id, -32601, `Method not allowed through bridge: ${method}`));
  }

  // Notifications (no id) are fire-and-forget.
  const isNotification = (id === undefined || id === null) && method.startsWith('notifications/');
  if (isNotification) {
    try {
      await mcp.notify(method, params);
      res.writeHead(204, { 'X-Bridge': `openpatent-mcp-bridge/${BRIDGE_VERSION}` });
      res.end();
    } catch (err) {
      writeJson(res, 500, { jsonrpc: '2.0', error: { code: -32603, message: err.message } });
    }
    return;
  }

  try {
    const result = await mcp.request(method, params);
    writeJson(res, 200, makeResult(id !== undefined ? id : null, result));
  } catch (err) {
    const code = err.code && Number.isInteger(err.code) ? err.code : -32603;
    writeJson(res, 200, makeError(id !== undefined ? id : null, code, err.message, err.data));
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // CORS for browser-based MCP clients (Claude Code web, custom dashboards).
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-OpenPatent-Hive-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/healthz') {
    const diag = mcp.diagnostics();
    const body = {
      status: mcp.proc ? 'ok' : 'degraded',
      bridge: `openpatent-mcp-bridge/${BRIDGE_VERSION}`,
      port: PORT,
      mcp: { ...diag, alive: mcp.proc !== null },
      ts: new Date().toISOString(),
    };
    return writeJson(res, mcp.proc ? 200 : 503, body);
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/tools/list') {
    try {
      const result = await mcp.request('tools/list', {});
      return writeJson(res, 200, { jsonrpc: '2.0', id: null, result });
    } catch (err) {
      return writeJson(res, 502, { jsonrpc: '2.0', id: null, error: { code: -32603, message: err.message } });
    }
  }

  if (req.method === 'POST' && (parsedUrl.pathname === '/' || parsedUrl.pathname === '/jsonrpc')) {
    let raw;
    try {
      raw = await readBody(req);
    } catch (err) {
      return writeJson(res, err.httpStatus || 400, makeError(null, -32700, err.message));
    }
    if (!raw) {
      return writeJson(res, 200, makeError(null, -32600, 'Invalid Request: empty body'));
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return writeJson(res, 200, makeError(null, -32700, 'Parse error: body is not valid JSON'));
    }
    if (Array.isArray(parsed)) {
      // Batch request — process in parallel, preserve order, drop null notifications.
      const results = await Promise.all(parsed.map(async (item) => {
        try {
          if (typeof item.method !== 'string' || !ALLOWED_METHODS.has(item.method)) {
            return makeError(item.id, -32601, `Method not allowed: ${item && item.method}`);
          }
          if (item.id === undefined && item.method.startsWith('notifications/')) {
            await mcp.notify(item.method, item.params);
            return null;
          }
          const r = await mcp.request(item.method, item.params);
          return makeResult(item.id !== undefined ? item.id : null, r);
        } catch (err) {
          const code = err.code && Number.isInteger(err.code) ? err.code : -32603;
          return makeError(item.id !== undefined ? item.id : null, code, err.message, err.data);
        }
      }));
      const filtered = results.filter((r) => r !== null);
      if (filtered.length === 0) {
        res.writeHead(204);
        return res.end();
      }
      return writeJson(res, 200, filtered);
    }
    return handleRpc(req, res, parsed);
  }

  writeJson(res, 404, { jsonrpc: '2.0', id: null, error: { code: -32601, message: `Not found: ${req.method} ${parsedUrl.pathname}` } });
});

// ─── Lifecycle ─────────────────────────────────────────────────────────────

async function shutdown(signal) {
  console.log(`[bridge] received ${signal}, shutting down…`);
  try { await mcp.stop(); } catch { /* ignore */ }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

server.listen(PORT, HOST, async () => {
  console.log(`[bridge] openpatent-mcp-bridge/${BRIDGE_VERSION} listening on http://${HOST}:${PORT}`);
  console.log(`[bridge]   GET  /healthz     liveness + diagnostics`);
  console.log(`[bridge]   GET  /tools/list  shortcut for JSON-RPC tools/list`);
  console.log(`[bridge]   POST /            JSON-RPC 2.0 endpoint`);
  console.log(`[bridge]   POST /jsonrpc     alias for /`);
  console.log(`[bridge] MCP_CMD=${MCP_CMD}  MCP_ARGS=${MCP_ARGS.join(' ')}  CWD=${MCP_CWD}`);
  try {
    await mcp.start();
    console.log('[bridge] MCP stdio server started');
  } catch (err) {
    console.error(`[bridge] MCP server failed to start: ${err.message}`);
    console.error('[bridge] bridge is in DEGRADED mode — /healthz will report 503 until MCP recovers');
  }
});
