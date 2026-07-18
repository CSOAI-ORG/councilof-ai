/**
 * CSOAI MCP Client
 * Model Context Protocol over SSE / WebSocket
 */
import { MCPClientOptions, MCPTool, MCPToolCall, MCPResource } from '../types';

export class MCPClient {
  private serverUrl: string;
  private transport: 'sse' | 'websocket';
  private headers: Record<string, string>;
  private eventSource?: EventSource;
  private ws?: WebSocket;
  private messageId = 0;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private toolsCache: MCPTool[] | null = null;

  constructor(opts: MCPClientOptions) {
    this.serverUrl = opts.serverUrl.replace(/\/$/, '');
    this.transport = opts.transport || 'sse';
    this.headers = opts.headers || {};
  }

  async connect(): Promise<void> {
    if (this.transport === 'sse') {
      await this.connectSSE();
    } else {
      await this.connectWebSocket();
    }
  }

  private connectSSE(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${this.serverUrl}/sse`;
      this.eventSource = new EventSource(url);
      this.eventSource.onopen = () => resolve();
      this.eventSource.onerror = (e) => reject(new Error(`SSE error: ${e}`));
      this.eventSource.addEventListener('message', (e) => this.handleMessage(e.data));
    });
  }

  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = this.serverUrl.replace(/^http/, 'ws') + '/ws';
      this.ws = new WebSocket(url);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(new Error(`WebSocket error: ${e}`));
      this.ws.onmessage = (e) => this.handleMessage(e.data);
    });
  }

  private handleMessage(raw: string): void {
    try {
      const msg = JSON.parse(raw);
      if (msg.id !== undefined && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    } catch {
      // ignore non-JSON
    }
  }

  private send(method: string, params?: unknown): Promise<unknown> {
    const id = ++this.messageId;
    const payload = { jsonrpc: '2.0', id, method, params };
    const body = JSON.stringify(payload);

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(body);
      } else if (this.transport === 'sse') {
        fetch(`${this.serverUrl}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...this.headers },
          body,
        }).catch(reject);
      } else {
        reject(new Error('Not connected'));
      }
    });
  }

  async initialize(): Promise<void> {
    await this.send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: '@meok-labs/ai-sdk', version: '0.2.0' },
    });
  }

  async listTools(): Promise<MCPTool[]> {
    if (this.toolsCache) return this.toolsCache;
    const result = (await this.send('tools/list')) as { tools: MCPTool[] };
    this.toolsCache = result.tools;
    return result.tools;
  }

  async callTool(call: MCPToolCall): Promise<unknown> {
    return this.send('tools/call', { name: call.name, arguments: call.arguments });
  }

  async listResources(): Promise<MCPResource[]> {
    const result = (await this.send('resources/list')) as { resources: MCPResource[] };
    return result.resources;
  }

  disconnect(): void {
    this.eventSource?.close();
    this.ws?.close();
    this.pending.clear();
  }
}
