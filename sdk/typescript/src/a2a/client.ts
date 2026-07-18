/**
 * CSOAI A2A Client
 * Agent-to-Agent protocol (Google / Linux Foundation v1.0)
 */
import { A2AAgentCard, A2ATask, A2AMessage, A2APart } from '../types';

export class A2AClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(baseUrl: string, headers: Record<string, string> = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.headers = { 'Content-Type': 'application/json', ...headers };
  }

  /** Fetch an Agent Card from a well-known endpoint */
  async getAgentCard(agentUrl: string): Promise<A2AAgentCard> {
    const url = new URL('/.well-known/agent.json', agentUrl).toString();
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) throw new Error(`Agent card fetch failed: ${res.status}`);
    return res.json();
  }

  /** Send a task to an A2A agent */
  async sendTask(agentUrl: string, messages: A2AMessage[], taskId?: string): Promise<A2ATask> {
    const id = taskId || `task_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const res = await fetch(`${agentUrl}/tasks/send`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ id, messages }),
    });
    if (!res.ok) throw new Error(`A2A task send failed: ${res.status}`);
    return res.json();
  }

  /** Send a task with streaming (SSE) */
  async sendTaskStream(agentUrl: string, messages: A2AMessage[], onChunk: (task: A2ATask) => void, taskId?: string): Promise<void> {
    const id = taskId || `task_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const res = await fetch(`${agentUrl}/tasks/sendSubscribe`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ id, messages }),
    });
    if (!res.ok) throw new Error(`A2A stream failed: ${res.status}`);
    if (!res.body) throw new Error('No response body');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const task = JSON.parse(line.slice(6)) as A2ATask;
            onChunk(task);
          } catch {
            // ignore malformed lines
          }
        }
      }
    }
  }

  /** Cancel a running task */
  async cancelTask(agentUrl: string, taskId: string): Promise<A2ATask> {
    const res = await fetch(`${agentUrl}/tasks/${taskId}/cancel`, {
      method: 'POST',
      headers: this.headers,
    });
    if (!res.ok) throw new Error(`A2A cancel failed: ${res.status}`);
    return res.json();
  }

  /** Utility: create a simple text message */
  static textMessage(role: 'user' | 'agent', text: string): A2AMessage {
    return { role, parts: [{ type: 'text', text }] };
  }
}
