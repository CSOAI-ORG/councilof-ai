/**
 * CSOAI libp2p Browser Client
 * Lightweight P2P for cross-vertical messaging
 */
import { P2PNodeConfig, P2PMessage } from '../types';

export class P2PClient {
  private node: any;
  private config: P2PNodeConfig;
  private topicListeners = new Map<string, ((msg: P2PMessage) => void)[]>();
  private started = false;

  constructor(config: P2PNodeConfig = {}) {
    this.config = config;
  }

  async start(): Promise<void> {
    if (this.started) return;
    // Dynamic import to avoid bundling issues in non-P2P contexts
    const libp2pMod: any = await import('libp2p');
    const wsMod: any = await import('@libp2p/websockets');
    const rtcMod: any = await import('@libp2p/webrtc');
    const noiseMod: any = await import('@libp2p/noise');
    const mplexMod: any = await import('@libp2p/mplex');

    this.node = await libp2pMod.createLibp2p({
      transports: [wsMod.webSockets(), rtcMod.webRTC()],
      connectionEncryption: [noiseMod.noise()],
      streamMuxers: [mplexMod.mplex()],
      peerDiscovery: this.config.bootstrapPeers?.length
        ? []
        : [],
    });

    await this.node.start();
    this.started = true;
  }

  getPeerId(): string {
    return this.node?.peerId?.toString() || '';
  }

  async subscribe(topic: string, handler: (msg: P2PMessage) => void): Promise<void> {
    if (!this.started) await this.start();
    if (!this.topicListeners.has(topic)) {
      this.topicListeners.set(topic, []);
      await this.node.services.pubsub.subscribe(topic);
    }
    this.topicListeners.get(topic)!.push(handler);

    this.node.services.pubsub.addEventListener('message', (evt: any) => {
      if (evt.detail.topic !== topic) return;
      const msg: P2PMessage = {
        topic: evt.detail.topic,
        data: evt.detail.data,
        from: evt.detail.from.toString(),
      };
      this.topicListeners.get(topic)?.forEach((cb) => cb(msg));
    });
  }

  async publish(topic: string, data: Uint8Array): Promise<void> {
    if (!this.started) await this.start();
    await this.node.services.pubsub.publish(topic, data);
  }

  async dial(peerAddr: string): Promise<void> {
    if (!this.started) await this.start();
    await this.node.dial(peerAddr);
  }

  async stop(): Promise<void> {
    if (!this.started) return;
    await this.node.stop();
    this.started = false;
  }
}
