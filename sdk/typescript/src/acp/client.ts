/**
 * CSOAI ACP Client
 * Agent Communication Protocol — message routing & channels
 */
import { ACPMessage, ACPChannel } from '../types';

export class ACPClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private ws?: WebSocket;
  private listeners = new Map<string, ((msg: ACPMessage) => void)[]>();

  constructor(baseUrl: string, headers: Record<string, string> = {}) {
    this.baseUrl = baseUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/acp';
    this.headers = headers;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.baseUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(new Error(`ACP connect error: ${e}`));
      this.ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data) as ACPMessage;
          const cbs = this.listeners.get(msg.type) || [];
          cbs.forEach((cb) => cb(msg));
        } catch {
          // ignore
        }
      };
    });
  }

  on(type: string, callback: (msg: ACPMessage) => void): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type)!.push(callback);
    return () => {
      const arr = this.listeners.get(type) || [];
      const idx = arr.indexOf(callback);
      if (idx >= 0) arr.splice(idx, 1);
    };
  }

  send(msg: Omit<ACPMessage, 'id' | 'timestamp'> & { id?: string }): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('ACP not connected');
    }
    const full: ACPMessage = {
      ...msg,
      id: msg.id || `acp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
    };
    this.ws.send(JSON.stringify(full));
  }

  async createChannel(participants: string[], topic?: string): Promise<ACPChannel> {
    const res = await fetch(this.baseUrl.replace(/^ws/, 'http') + '/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.headers },
      body: JSON.stringify({ participants, topic }),
    });
    if (!res.ok) throw new Error(`ACP channel creation failed: ${res.status}`);
    return res.json();
  }

  async listChannels(): Promise<ACPChannel[]> {
    const res = await fetch(this.baseUrl.replace(/^ws/, 'http') + '/channels', {
      headers: this.headers,
    });
    if (!res.ok) throw new Error(`ACP channel list failed: ${res.status}`);
    return res.json();
  }

  disconnect(): void {
    this.ws?.close();
    this.listeners.clear();
  }
}
