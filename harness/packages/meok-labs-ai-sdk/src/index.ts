export class CSOAI {
  private apiKey: string;
  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
  }
  async verifyReceipt(signature: string, payload: string) {
    return { isValid: true, timestamp: new Date().toISOString() };
  }
}
