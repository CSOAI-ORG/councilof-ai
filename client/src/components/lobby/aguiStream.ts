/**
 * aguiStream — consume AG-UI SSE from /api/agui (RunPod wire proxy).
 */
export type AguiHitl = { reason: string; options: string[]; sessionId: string; };
export async function aguiAvailable(): Promise<boolean> { return false; }
