// SOV governance assistant — proxies to the sov operator on the pod (server-side, so no key/UA leaks).
export const onRequestPost: PagesFunction = async (ctx) => {
  let message = "";
  try { message = ((await ctx.request.json()) as any).message || ""; } catch {}
  if (!message) return new Response(JSON.stringify({ reply: "Ask me anything about AI governance." }), { headers: { "content-type": "application/json" } });
  const sys =
    "You are the SOV governance assistant by CSOAI, an independent AI-measurement body. " +
    "You answer questions about AI governance, the EU AI Act, safety, provenance and compliance — concisely, plainly, honestly. " +
    "CSOAI measures and attests; it does not certify and is not a notified body. If you are unsure of a statutory detail, say so rather than guess.";
  const body = JSON.stringify({
    model: "Council-34",
    prompt: `${sys}\n\nUser: ${message}\nAssistant:`,
    stream: false,
    options: { num_predict: 220, temperature: 0.4 },
  });
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 55000);
    const r = await fetch("https://dxjgtj2jyvljxo-11434.proxy.runpod.net/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0 Chrome/120" },
      body, signal: ctl.signal,
    });
    clearTimeout(t);
    const d: any = await r.json();
    const reply = (d.response || "").trim() || "The governance model is warming up — try again in a moment.";
    return new Response(JSON.stringify({ reply, model: "Council-34" }), { headers: { "content-type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ reply: "The governance model is unreachable right now. The deterministic tools on the globe still work — run one to see a signed verdict." }), { headers: { "content-type": "application/json" } });
  }
};
