// Isolated-world relay. Provider URLs and secrets are never accepted here.
(() => {
  if (window.top !== window || !["https://councilof.ai","https://meok.ai"].includes(location.origin)) return;
  let port;
  const active = new Set();
  function connect() {
    if (port) return port;
    port = chrome.runtime.connect({name:"meok-ai-v1"});
    port.onMessage.addListener(message => {
      if (!active.has(message.id)) return;
      window.postMessage({channel:"meok-ai-response-v1",...message},location.origin);
      if ("result" in message || message.error) active.delete(message.id);
    });
    port.onDisconnect.addListener(() => { port=null; for (const id of active) window.postMessage({channel:"meok-ai-response-v1",id,error:"AI connection ended. No fallback was tried."},location.origin); active.clear(); });
    return port;
  }
  window.addEventListener("message",event => {
    const msg=event.data;
    if (event.source !== window || event.origin !== location.origin || msg?.channel !== "meok-ai-request-v1" ||
        !["status","settings","models","chat","cancel"].includes(msg.action) || typeof msg.id !== "string" ||
        !/^[a-zA-Z0-9-]{1,80}$/.test(msg.id) || JSON.stringify(msg).length > 100000) return;
    if (msg.action !== "cancel") { if (active.size >= 2 || active.has(msg.id)) return; active.add(msg.id); }
    try { connect().postMessage(msg); } catch { active.delete(msg.id); window.postMessage({channel:"meok-ai-response-v1",id:msg.id,error:"Reload this page after enabling the AI connection."},location.origin); }
  });
})();