/**
 * CSOAI ABCI Query Client
 * Read-only queries to the CometBFT / Tendermint consensus layer
 */
import { ABCIQueryRequest, ABCIQueryResponse } from '../types';

export class ABCIClient {
  private rpcUrl: string;
  private headers: Record<string, string>;

  constructor(rpcUrl: string, headers: Record<string, string> = {}) {
    this.rpcUrl = rpcUrl.replace(/\/$/, '');
    this.headers = headers;
  }

  async query(req: ABCIQueryRequest): Promise<ABCIQueryResponse> {
    const params: Record<string, string> = {
      path: req.path,
      prove: req.prove ? 'true' : 'false',
    };
    if (req.data) params.data = Buffer.from(req.data).toString('hex');
    if (req.height !== undefined) params.height = req.height.toString();

    const url = new URL('/abci_query', this.rpcUrl);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) throw new Error(`ABCI query failed: ${res.status}`);

    const json = await res.json();
    const result = json.result?.response;
    if (!result) throw new Error('Invalid ABCI response');

    return {
      key: Buffer.from(result.key || '', 'base64'),
      value: Buffer.from(result.value || '', 'base64'),
      height: parseInt(result.height, 10),
      proof: result.proof,
    };
  }

  /** Query trust registry by entity ID */
  async queryTrustRegistry(entityId: string, height?: number): Promise<Record<string, unknown>> {
    const res = await this.query({
      path: '/trust_registry',
      data: Buffer.from(JSON.stringify({ entity_id: entityId })),
      height,
    });
    return JSON.parse(Buffer.from(res.value).toString('utf-8'));
  }

  /** Query vertical-specific state */
  async queryVertical(vertical: string, key: string, height?: number): Promise<Record<string, unknown>> {
    const res = await this.query({
      path: `/vertical/${vertical}`,
      data: Buffer.from(JSON.stringify({ key })),
      height,
    });
    return JSON.parse(Buffer.from(res.value).toString('utf-8'));
  }
}
