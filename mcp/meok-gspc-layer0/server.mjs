#!/usr/bin/env node
/** Source recovery candidate preserving the existing local bridge and adding a read-only reference tool.
 * Not installed or registered by this source change. No benchmark admission or signer.
 */

import { submitWorkStep, readCapabilitySnapshot } from './core.mjs';
import { readGspcEvidence } from './evidence-context.mjs';
import { readMeokCorrectionEvidence } from './correction-context.mjs';
import { submitChat } from './chat-provider.mjs';
import { HF_SITUATION_TOOL, reasonHfSituation } from './hf-situation.mjs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';

const HOME = os.homedir();
const WS = path.join(HOME, 'workspace_for_ai');
const CAP_DIR = process.env.MEOK_CAPABILITY_DIR || path.join(WS, 'meok-router', 'capability-records');
// This recovered bridge must not silently target the retired M2 :8787 HIM.
// A serving coordinator must be explicitly configured by the runtime owner.
const HIM_BASE = process.env.HIM_URL?.trim() || null;

const TOOLS = [
  ...(process.env.MEOK_HF_ENABLED === '1' ? [HF_SITUATION_TOOL] : []),
  {
    name: 'meok_read_gspc_evidence',
    description: 'Read a selected axis from the fixed public GSPC board and retained daily report metadata. Returns source hashes, dates, coverage and limits. No private report ingestion, model training, human approval or execution.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    inputSchema: { type: 'object', properties: { axis: { type: 'string', pattern: '^[a-z0-9][a-z0-9-]{0,79}$', description: 'Exact public GSPC axis ID.' } }, required: ['axis'], additionalProperties: false },
  },
  {
    name: 'meok_read_correction_evidence',
    description: 'Read fixed public correction, root and witness references with distinct timestamp and authority states. Does not sign, approve, score, deploy or anchor.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    inputSchema: { type: 'object',
      properties: { correction_id: { type: 'string',
        pattern: '^[A-Za-z0-9][A-Za-z0-9._-]{0,99}
    description: 'Submit caller-reported work-step telemetry and report HTTP delivery separately from durable storage. An exit code is not task correctness or a GSPC measurement; no signing or admission occurs.',
    inputSchema: {
      type: 'object',
      properties: {
        platform: { type: 'string', description: 'Host platform or model name (e.g. gpt-6.1-sol, claude-opus-5, MiniMax-M3.1-Flash, kimi-k2.5, grok-4.6)' },
        task_summary: { type: 'string', description: 'Concise description of the work step executed' },
        axis: { type: 'string', description: 'Optional caller axis tag; not validated or admitted as a GSPC axis.' },
        exit_code: { type: 'integer', description: 'Caller-reported command exit code; omitted is UNCHECKABLE. Zero is command success only.' },
      },
      required: ['platform', 'task_summary'],
    },
  },
  {
    name: 'meok_route_to_clan',
    description: 'Submit a prompt through the configured MEOK chat provider. H.I.M. remains the default; an operator-configured Cosmos endpoint can supply text inference. Provider claims are unverified; this tool grants no execution authority or model training.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Prompt or statutory/technical scenario to route and measure' },
        mode: { type: 'string', description: 'Engine mode (auto, fast, omni, council, measure)' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'meok_workstream_benchmark_report',
    description: 'Read the configured local workstream snapshot. Missing or unreadable data is UNCHECKABLE; no live session count or measurement is inferred.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'meok_layer0_flywheel_status',
    description: 'Read the configured local benchmark-catalogue snapshot. A listed suite is not a runnable, reproduced or admitted measurement.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'meok_fleet_catalog',
    description: 'Read the configured local fleet snapshot. Snapshot contents do not establish current capacity, heartbeats or completed jobs.',
    inputSchema: { type: 'object', properties: {} },
  },
  ...(HIM_BASE ? [{
    name: 'him_say',
    description: 'Legacy H.I.M. coordinator messaging, exposed only when HIM_URL is explicitly configured by the runtime owner.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string', description: 'Message to send to H.I.M.' } },
      required: ['text'],
    },
  }] : []),
  {
    name: 'zcode_desktop',
    description: 'Read-only Desktop Commander metadata bridge. op="list" discovers names; op="call" is restricted to list_devices with empty arguments. A listed tool is not a grant. For any effectful host action use a separately authenticated, operator-approved workflow; this bridge cannot execute it.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        op: { type: 'string', enum: ['list', 'call'], description: 'list = enumerate DC tools; call = invoke one' },
        tool: { type: 'string', const: 'list_devices', description: 'Only read-only list_devices is eligible for op=call' },
        arguments: { type: 'object', properties: {}, additionalProperties: false, description: 'Must be empty for list_devices' },
      },
      required: ['op'],
      additionalProperties: false,
    },
  },
];

async function handleToolCall(name, args = {}) {
  if (name === 'meok_reason_situation') {
    return JSON.stringify(await reasonHfSituation(args), null, 2);
  }
  if (name === 'meok_read_gspc_evidence') {
    return JSON.stringify(await readGspcEvidence(args), null, 2);
  }
  if (name === 'meok_read_correction_evidence') {
    return JSON.stringify(await readMeokCorrectionEvidence(args), null, 2);
  }
  if (name === 'zcode_desktop') {
    // MCP discovery is not authority. No caller-selected effectful host tool may cross
    // this bridge without an independent authenticated operator grant. Such a grant
    // does not exist here; keep this source candidate read-only and fail closed.
    if (!args || typeof args !== 'object' || Array.isArray(args) ||
        Object.keys(args).some(k => !['op', 'tool', 'arguments'].includes(k)) ||
        !['list', 'call'].includes(args.op)) {
      return JSON.stringify({ state: 'REFUSED', error: 'invalid_desktop_request' });
    }
    if (args.op === 'call' && (args.tool !== 'list_devices' ||
        (Object.hasOwn(args, 'arguments') &&
          (!args.arguments || typeof args.arguments !== 'object' || Array.isArray(args.arguments) ||
           Object.keys(args.arguments).length !== 0)))) {
      return JSON.stringify({ state: 'REFUSED', error: 'desktop_capability_not_authorized',
        execution_authority: 'NOT_GRANTED', request_dispatched: false });
    }
    if (args.op === 'list' && (Object.hasOwn(args, 'tool') || Object.hasOwn(args, 'arguments'))) {
      return JSON.stringify({ state: 'REFUSED', error: 'invalid_desktop_request', request_dispatched: false });
    }
    // Stateless read-only bridge to local Desktop Commander MCP (127.0.0.1:8765).
    const DC = process.env.DC_BRIDGE_URL || 'http://127.0.0.1:8765/mcp';
    let origin;
    try { origin = new URL(DC); } catch { /* unqualified source */ }
    if (!origin || !['http:', 'https:'].includes(origin.protocol) ||
        !['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname) ||
        origin.username || origin.password || origin.search || origin.hash ||
        origin.pathname !== '/mcp') {
      return JSON.stringify({ state: 'REFUSED', error: 'desktop_bridge_origin_not_qualified',
        request_dispatched: false });
    }
    const MAX_DESKTOP_RESPONSE = 1_048_576;
    const rpc = (payload) => fetch(DC, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify(payload),
      redirect: 'error', credentials: 'omit', cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const boundedRead = async (response) => {
      const declared = response.headers.get('content-length');
      if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_DESKTOP_RESPONSE)) {
        void response.body?.cancel().catch(() => {});
        throw new Error('DESKTOP_RESPONSE_TOO_LARGE');
      }
      const stream = response.body?.getReader();
      if (!stream) throw new Error('DESKTOP_RESPONSE_UNREADABLE');
      const chunks = []; let bytes = 0; let finished = false;
      try {
        for (;;) {
          const next = await stream.read();
          if (next.done) { finished = true; break; }
          bytes += next.value.byteLength;
          if (bytes > MAX_DESKTOP_RESPONSE) throw new Error('DESKTOP_RESPONSE_TOO_LARGE');
          chunks.push(Buffer.from(next.value));
        }
        return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks, bytes));
      } finally {
        if (finished) stream.releaseLock();
        else void stream.cancel().catch(() => {});
      }
    };
    try {
      if (args.op === 'list') {
        const r = await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
        if (!r.ok) {
          await r.body?.cancel().catch(() => {});
          return JSON.stringify({ state: 'UNCHECKABLE', reason: 'DESKTOP_HTTP_ERROR', http_status: r.status });
        }
        const txt = await boundedRead(r);
        const line = txt.split('\n').find((l) => l.startsWith('data: ') && l.includes('"tools"')) || txt;
        const reply = JSON.parse(line.replace(/^data: /, ''));
        if (reply.error) return JSON.stringify({ state: 'UNCHECKABLE', reason: 'DESKTOP_RPC_ERROR' });
        if (!Array.isArray(reply.result?.tools)) {
          return JSON.stringify({ state: 'UNCHECKABLE', reason: 'DESKTOP_RESPONSE_INVALID' });
        }
        const available = reply.result.tools.some(t => t && typeof t === 'object' && t.name === 'list_devices');
        if (!available) return JSON.stringify({ state: 'UNCHECKABLE', reason: 'DESKTOP_READ_ONLY_TOOL_UNAVAILABLE' });
        // Only the callable read-only metadata operation may appear in discovery.
        return JSON.stringify({ bridge: DC, tools: ['list_devices'], authority: 'READ_ONLY_METADATA' });
      }
      if (args.op === 'call') {
        // The exact tool/argument allowlist was checked before constructing any RPC.
        const r = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: args.tool, arguments: args.arguments || {} } });
        if (!r.ok) {
          await r.body?.cancel().catch(() => {});
          return JSON.stringify({ state: 'UNCHECKABLE', reason: 'DESKTOP_HTTP_ERROR', http_status: r.status });
        }
        const txt = await boundedRead(r);
        const line = txt.split('\n').find((l) => l.startsWith('data: ') && l.includes('"result"')) || txt;
        const reply = JSON.parse(line.replace(/^data: /, ''));
        if (reply.error) return JSON.stringify({ state: 'UNCHECKABLE', reason: 'DESKTOP_RPC_ERROR' });
        if (!reply.result || typeof reply.result !== 'object' || Array.isArray(reply.result)) {
          return JSON.stringify({ state: 'UNCHECKABLE', reason: 'DESKTOP_RESPONSE_INVALID' });
        }
        return JSON.stringify({ bridge: DC, tool: args.tool, result: reply.result });
      }
      return JSON.stringify({ state: 'REFUSED', error: 'invalid_desktop_request' });
    } catch (e) {
      return JSON.stringify({ state: 'UNCHECKABLE', reason: 'DESKTOP_REQUEST_FAILED' });
    }
  }
  if (name === 'meok_gspc_evaluate_work_step') {
    if (!HIM_BASE) return JSON.stringify({ state: 'UNCHECKABLE', reason: 'COORDINATOR_NOT_CONFIGURED' });
    return JSON.stringify(await submitWorkStep(args, { endpoint: HIM_BASE }), null, 2);
  }

  if (name === 'meok_route_to_clan' || name === 'him_say') {
    // The old HIM port is retired. Do not dispatch or infer a healthy backend
    // from a hidden localhost fallback; Cosmos remains an explicit opt-in.
    if (!HIM_BASE && (name === 'him_say' ||
      !process.env.MEOK_CHAT_BACKEND || process.env.MEOK_CHAT_BACKEND === 'him')) {
      return JSON.stringify({ state: 'UNCHECKABLE', reason: 'COORDINATOR_NOT_CONFIGURED' });
    }
    const content = args.prompt || args.text || '';
    // A Cosmos model endpoint never replaces the coordinator's governed-message route.
    // Work-step telemetry above also remains on HIM_BASE.
    const env = name === 'him_say'
      ? { ...process.env, MEOK_CHAT_BACKEND: 'him' }
      : process.env;
    return JSON.stringify(await submitChat({ prompt: content, mode: args.mode }, { env }), null, 2);
  }

  const snapshots = {
    meok_workstream_benchmark_report: ['meok-workstream-telemetry-benchmark.json', {
      summary: 'summary', cloud_and_compute_bridges: 'cloud_and_compute_bridges',
      reported_platform_telemetry: 'frontier_workstream_leaderboard',
    }],
    meok_layer0_flywheel_status: ['meok-layer0-universal-benchmark-flywheel.json', {
      summary: 'summary', ecosystems: 'open_source_ecosystems_layer0_bridge', ledger: 'compounding_benchmark_ledger',
    }],
    meok_fleet_catalog: ['meok-sovereign-fleet-catalog.json', {
      summary: 'summary', cluster_topology: 'cluster_topology', reported_axis_router: 'clan_self_router_16_axes',
    }],
  };
  if (Object.hasOwn(snapshots, name)) {
    const [filename, fields] = snapshots[name];
    return JSON.stringify(readCapabilitySnapshot(CAP_DIR, filename, fields), null, 2);
  }

  throw new Error(`Unknown tool: ${name}`);
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let req;
  try {
    req = JSON.parse(trimmed);
  } catch {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n');
    return;
  }
  if (!req || typeof req !== 'object' || Array.isArray(req) || req.jsonrpc !== '2.0' || typeof req.method !== 'string' ||
      (Object.hasOwn(req, 'id') && typeof req.id !== 'string' && !Number.isSafeInteger(req.id))) {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } }) + '\n');
    return;
  }
  if (!Object.hasOwn(req, 'id')) return; // Notifications never receive responses.
  const { id, method, params } = req;
  if (method === 'notifications/initialized') return;

  try {
    if (method === 'initialize') {
      const resp = {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: params?.protocolVersion || '2025-06-18',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'meok-gspc-layer0-plugin',
            version: '1.2.0',
            governance_invariant: 'Measurement and Human-in-the-Loop Oversight — Never Certification',
          },
        },
      };
      process.stdout.write(JSON.stringify(resp) + '\n');
      return;
    }

    if (method === 'tools/list') {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result: { tools: TOOLS } }) + '\n');
      return;
    }

    if (method === 'tools/call') {
      try {
        const text = await handleToolCall(params?.name, params?.arguments ?? {});
        const value = JSON.parse(text);
        const isError = value.state === 'UNCHECKABLE' || value.recording?.state === 'UNCONFIRMED' ||
          Boolean(value.error) || value.result?.isError === true;
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0', id,
          result: { content: [{ type: 'text', text }], ...(isError ? { isError: true } : {}) },
        }) + '\n');
      } catch (error) {
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0', id,
          result: { isError: true, content: [{ type: 'text', text: JSON.stringify({
            state: 'UNCHECKABLE', reason: 'TOOL_EXECUTION_ERROR',
          }) }] },
        }) + '\n');
      }
      return;
    }

    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    }) + '\n');
  } catch (err) {
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      id,
      error: { code: -32000, message: err.message },
    }) + '\n');
  }
});

,
        description: 'Optional exact public correction ID; no URL or free text.' } },
      additionalProperties: false },
  },
  {
    name: 'meok_gspc_evaluate_work_step',
    description: 'Submit caller-reported work-step telemetry and report HTTP delivery separately from durable storage. An exit code is not task correctness or a GSPC measurement; no signing or admission occurs.',
    inputSchema: {
      type: 'object',
      properties: {
        platform: { type: 'string', description: 'Host platform or model name (e.g. gpt-6.1-sol, claude-opus-5, MiniMax-M3.1-Flash, kimi-k2.5, grok-4.6)' },
        task_summary: { type: 'string', description: 'Concise description of the work step executed' },
        axis: { type: 'string', description: 'Optional caller axis tag; not validated or admitted as a GSPC axis.' },
        exit_code: { type: 'integer', description: 'Caller-reported command exit code; omitted is UNCHECKABLE. Zero is command success only.' },
      },
      required: ['platform', 'task_summary'],
    },
  },
  {
    name: 'meok_route_to_clan',
    description: 'Submit a prompt through the configured MEOK chat provider. H.I.M. remains the default; an operator-configured Cosmos endpoint can supply text inference. Provider claims are unverified; this tool grants no execution authority or model training.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Prompt or statutory/technical scenario to route and measure' },
        mode: { type: 'string', description: 'Engine mode (auto, fast, omni, council, measure)' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'meok_workstream_benchmark_report',
    description: 'Read the configured local workstream snapshot. Missing or unreadable data is UNCHECKABLE; no live session count or measurement is inferred.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'meok_layer0_flywheel_status',
    description: 'Read the configured local benchmark-catalogue snapshot. A listed suite is not a runnable, reproduced or admitted measurement.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'meok_fleet_catalog',
    description: 'Read the configured local fleet snapshot. Snapshot contents do not establish current capacity, heartbeats or completed jobs.',
    inputSchema: { type: 'object', properties: {} },
  },
  ...(HIM_BASE ? [{
    name: 'him_say',
    description: 'Legacy H.I.M. coordinator messaging, exposed only when HIM_URL is explicitly configured by the runtime owner.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string', description: 'Message to send to H.I.M.' } },
      required: ['text'],
    },
  }] : []),
  {
    name: 'zcode_desktop',
    description: 'Read-only Desktop Commander metadata bridge. op="list" discovers names; op="call" is restricted to list_devices with empty arguments. A listed tool is not a grant. For any effectful host action use a separately authenticated, operator-approved workflow; this bridge cannot execute it.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        op: { type: 'string', enum: ['list', 'call'], description: 'list = enumerate DC tools; call = invoke one' },
        tool: { type: 'string', const: 'list_devices', description: 'Only read-only list_devices is eligible for op=call' },
        arguments: { type: 'object', properties: {}, additionalProperties: false, description: 'Must be empty for list_devices' },
      },
      required: ['op'],
      additionalProperties: false,
    },
  },
];

async function handleToolCall(name, args = {}) {
  if (name === 'meok_reason_situation') {
    return JSON.stringify(await reasonHfSituation(args), null, 2);
  }
  if (name === 'meok_read_gspc_evidence') {
    return JSON.stringify(await readGspcEvidence(args), null, 2);
  }
  if (name === 'zcode_desktop') {
    // MCP discovery is not authority. No caller-selected effectful host tool may cross
    // this bridge without an independent authenticated operator grant. Such a grant
    // does not exist here; keep this source candidate read-only and fail closed.
    if (!args || typeof args !== 'object' || Array.isArray(args) ||
        Object.keys(args).some(k => !['op', 'tool', 'arguments'].includes(k)) ||
        !['list', 'call'].includes(args.op)) {
      return JSON.stringify({ state: 'REFUSED', error: 'invalid_desktop_request' });
    }
    if (args.op === 'call' && (args.tool !== 'list_devices' ||
        (Object.hasOwn(args, 'arguments') &&
          (!args.arguments || typeof args.arguments !== 'object' || Array.isArray(args.arguments) ||
           Object.keys(args.arguments).length !== 0)))) {
      return JSON.stringify({ state: 'REFUSED', error: 'desktop_capability_not_authorized',
        execution_authority: 'NOT_GRANTED', request_dispatched: false });
    }
    if (args.op === 'list' && (Object.hasOwn(args, 'tool') || Object.hasOwn(args, 'arguments'))) {
      return JSON.stringify({ state: 'REFUSED', error: 'invalid_desktop_request', request_dispatched: false });
    }
    // Stateless read-only bridge to local Desktop Commander MCP (127.0.0.1:8765).
    const DC = process.env.DC_BRIDGE_URL || 'http://127.0.0.1:8765/mcp';
    let origin;
    try { origin = new URL(DC); } catch { /* unqualified source */ }
    if (!origin || !['http:', 'https:'].includes(origin.protocol) ||
        !['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname) ||
        origin.username || origin.password || origin.search || origin.hash ||
        origin.pathname !== '/mcp') {
      return JSON.stringify({ state: 'REFUSED', error: 'desktop_bridge_origin_not_qualified',
        request_dispatched: false });
    }
    const MAX_DESKTOP_RESPONSE = 1_048_576;
    const rpc = (payload) => fetch(DC, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify(payload),
      redirect: 'error', credentials: 'omit', cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const boundedRead = async (response) => {
      const declared = response.headers.get('content-length');
      if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_DESKTOP_RESPONSE)) {
        void response.body?.cancel().catch(() => {});
        throw new Error('DESKTOP_RESPONSE_TOO_LARGE');
      }
      const stream = response.body?.getReader();
      if (!stream) throw new Error('DESKTOP_RESPONSE_UNREADABLE');
      const chunks = []; let bytes = 0; let finished = false;
      try {
        for (;;) {
          const next = await stream.read();
          if (next.done) { finished = true; break; }
          bytes += next.value.byteLength;
          if (bytes > MAX_DESKTOP_RESPONSE) throw new Error('DESKTOP_RESPONSE_TOO_LARGE');
          chunks.push(Buffer.from(next.value));
        }
        return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks, bytes));
      } finally {
        if (finished) stream.releaseLock();
        else void stream.cancel().catch(() => {});
      }
    };
    try {
      if (args.op === 'list') {
        const r = await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
        if (!r.ok) {
          await r.body?.cancel().catch(() => {});
          return JSON.stringify({ state: 'UNCHECKABLE', reason: 'DESKTOP_HTTP_ERROR', http_status: r.status });
        }
        const txt = await boundedRead(r);
        const line = txt.split('\n').find((l) => l.startsWith('data: ') && l.includes('"tools"')) || txt;
        const reply = JSON.parse(line.replace(/^data: /, ''));
        if (reply.error) return JSON.stringify({ state: 'UNCHECKABLE', reason: 'DESKTOP_RPC_ERROR' });
        if (!Array.isArray(reply.result?.tools)) {
          return JSON.stringify({ state: 'UNCHECKABLE', reason: 'DESKTOP_RESPONSE_INVALID' });
        }
        const available = reply.result.tools.some(t => t && typeof t === 'object' && t.name === 'list_devices');
        if (!available) return JSON.stringify({ state: 'UNCHECKABLE', reason: 'DESKTOP_READ_ONLY_TOOL_UNAVAILABLE' });
        // Only the callable read-only metadata operation may appear in discovery.
        return JSON.stringify({ bridge: DC, tools: ['list_devices'], authority: 'READ_ONLY_METADATA' });
      }
      if (args.op === 'call') {
        // The exact tool/argument allowlist was checked before constructing any RPC.
        const r = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: args.tool, arguments: args.arguments || {} } });
        if (!r.ok) {
          await r.body?.cancel().catch(() => {});
          return JSON.stringify({ state: 'UNCHECKABLE', reason: 'DESKTOP_HTTP_ERROR', http_status: r.status });
        }
        const txt = await boundedRead(r);
        const line = txt.split('\n').find((l) => l.startsWith('data: ') && l.includes('"result"')) || txt;
        const reply = JSON.parse(line.replace(/^data: /, ''));
        if (reply.error) return JSON.stringify({ state: 'UNCHECKABLE', reason: 'DESKTOP_RPC_ERROR' });
        if (!reply.result || typeof reply.result !== 'object' || Array.isArray(reply.result)) {
          return JSON.stringify({ state: 'UNCHECKABLE', reason: 'DESKTOP_RESPONSE_INVALID' });
        }
        return JSON.stringify({ bridge: DC, tool: args.tool, result: reply.result });
      }
      return JSON.stringify({ state: 'REFUSED', error: 'invalid_desktop_request' });
    } catch (e) {
      return JSON.stringify({ state: 'UNCHECKABLE', reason: 'DESKTOP_REQUEST_FAILED' });
    }
  }
  if (name === 'meok_gspc_evaluate_work_step') {
    if (!HIM_BASE) return JSON.stringify({ state: 'UNCHECKABLE', reason: 'COORDINATOR_NOT_CONFIGURED' });
    return JSON.stringify(await submitWorkStep(args, { endpoint: HIM_BASE }), null, 2);
  }

  if (name === 'meok_route_to_clan' || name === 'him_say') {
    // The old HIM port is retired. Do not dispatch or infer a healthy backend
    // from a hidden localhost fallback; Cosmos remains an explicit opt-in.
    if (!HIM_BASE && (name === 'him_say' ||
      !process.env.MEOK_CHAT_BACKEND || process.env.MEOK_CHAT_BACKEND === 'him')) {
      return JSON.stringify({ state: 'UNCHECKABLE', reason: 'COORDINATOR_NOT_CONFIGURED' });
    }
    const content = args.prompt || args.text || '';
    // A Cosmos model endpoint never replaces the coordinator's governed-message route.
    // Work-step telemetry above also remains on HIM_BASE.
    const env = name === 'him_say'
      ? { ...process.env, MEOK_CHAT_BACKEND: 'him' }
      : process.env;
    return JSON.stringify(await submitChat({ prompt: content, mode: args.mode }, { env }), null, 2);
  }

  const snapshots = {
    meok_workstream_benchmark_report: ['meok-workstream-telemetry-benchmark.json', {
      summary: 'summary', cloud_and_compute_bridges: 'cloud_and_compute_bridges',
      reported_platform_telemetry: 'frontier_workstream_leaderboard',
    }],
    meok_layer0_flywheel_status: ['meok-layer0-universal-benchmark-flywheel.json', {
      summary: 'summary', ecosystems: 'open_source_ecosystems_layer0_bridge', ledger: 'compounding_benchmark_ledger',
    }],
    meok_fleet_catalog: ['meok-sovereign-fleet-catalog.json', {
      summary: 'summary', cluster_topology: 'cluster_topology', reported_axis_router: 'clan_self_router_16_axes',
    }],
  };
  if (Object.hasOwn(snapshots, name)) {
    const [filename, fields] = snapshots[name];
    return JSON.stringify(readCapabilitySnapshot(CAP_DIR, filename, fields), null, 2);
  }

  throw new Error(`Unknown tool: ${name}`);
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let req;
  try {
    req = JSON.parse(trimmed);
  } catch {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n');
    return;
  }
  if (!req || typeof req !== 'object' || Array.isArray(req) || req.jsonrpc !== '2.0' || typeof req.method !== 'string' ||
      (Object.hasOwn(req, 'id') && typeof req.id !== 'string' && !Number.isSafeInteger(req.id))) {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } }) + '\n');
    return;
  }
  if (!Object.hasOwn(req, 'id')) return; // Notifications never receive responses.
  const { id, method, params } = req;
  if (method === 'notifications/initialized') return;

  try {
    if (method === 'initialize') {
      const resp = {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: params?.protocolVersion || '2025-06-18',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'meok-gspc-layer0-plugin',
            version: '1.2.0',
            governance_invariant: 'Measurement and Human-in-the-Loop Oversight — Never Certification',
          },
        },
      };
      process.stdout.write(JSON.stringify(resp) + '\n');
      return;
    }

    if (method === 'tools/list') {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result: { tools: TOOLS } }) + '\n');
      return;
    }

    if (method === 'tools/call') {
      try {
        const text = await handleToolCall(params?.name, params?.arguments ?? {});
        const value = JSON.parse(text);
        const isError = value.state === 'UNCHECKABLE' || value.recording?.state === 'UNCONFIRMED' ||
          Boolean(value.error) || value.result?.isError === true;
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0', id,
          result: { content: [{ type: 'text', text }], ...(isError ? { isError: true } : {}) },
        }) + '\n');
      } catch (error) {
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0', id,
          result: { isError: true, content: [{ type: 'text', text: JSON.stringify({
            state: 'UNCHECKABLE', reason: 'TOOL_EXECUTION_ERROR',
          }) }] },
        }) + '\n');
      }
      return;
    }

    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    }) + '\n');
  } catch (err) {
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      id,
      error: { code: -32000, message: err.message },
    }) + '\n');
  }
});

