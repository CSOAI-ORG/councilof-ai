/**
 * Bind an asynchronous verifier result to the exact text that produced it.
 *
 * A revision is advanced both when verification starts and whenever an input is
 * edited. That makes a response unusable as soon as the user changes the
 * payload (including an embedded key) or starts a newer verification.
 */
export type InputBoundResult<T> = {
  inputHash: string;
  result: T;
};

export async function sha256Text(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export class InputBoundVerifier<T> {
  private revision = 0;

  invalidate(): void {
    this.revision += 1;
  }

  async run(input: string, verify: (snapshot: string) => Promise<T>): Promise<InputBoundResult<T> | null> {
    const revision = ++this.revision;
    const inputHash = await sha256Text(input);
    const result = await verify(input);

    if (revision !== this.revision) return null;
    return { inputHash, result };
  }
}
