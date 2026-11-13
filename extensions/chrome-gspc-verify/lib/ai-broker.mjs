import {PROVIDERS, SITES, createAIExecutor} from "./ai-runtime.mjs";
export function senderScope(sender, extensionRoot) {
  if (!sender || sender.id !== new URL(extensionRoot).hostname) return null;
  if (sender.url === extensionRoot + "ai.html") return "trusted";
  try {
    const url = new URL(sender.url);
    return sender.frameId === 0 && sender.tab && SITES.includes(url.origin) && sender.origin === url.origin ? url.origin : null;
  } catch { return null; }
}
export function installAIBroker(api = chrome) {
  let offline = true, ready = api.storage.local.get("ai.offline").then(v => { offline = v["ai.offline"] !== false; });
  const active = new Set();
  api.storage.session.setAccessLevel({accessLevel:"TRUSTED_CONTEXTS"});
  const executor = createAIExecutor({
    getKey: async provider => (await api.storage.session.get("ai.key." + provider))["ai.key." + provider],
    canFetch: permission => api.permissions.contains({origins:[permission]}),
    isOffline: () => offline,
  });
  api.runtime.onConnect.addListener(port => {
    if (port.name !== "meok-ai-v1") return;
    const scope = senderScope(port.sender, api.runtime.getURL(""));
    if (!scope) { port.disconnect(); return; }
    const requests = new Map();
    const send = value => { try { port.postMessage(value); } catch {} };
    port.onDisconnect.addListener(() => { for (const ctl of requests.values()) { ctl.abort(); active.delete(ctl); } });
    port.onMessage.addListener(async msg => {
      if (!msg || typeof msg.id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(msg.id)) return;
      if (msg.action === "cancel") { requests.get(msg.id)?.abort(); return; }
      if (requests.has(msg.id) || requests.size >= 2) return send({id:msg.id,error:"A request is already running."});
      const ctl = new AbortController(); requests.set(msg.id,ctl); active.add(ctl);
      const timer = setTimeout(() => ctl.abort(), 120000);
      try {
        await ready;
        let result;
        if (msg.action === "status") {
          result = {offline, connected:true, allowed:scope === "trusted" || (await api.storage.local.get("ai.sites"))["ai.sites"]?.includes(scope)};
        } else if (msg.action === "settings") {
          // Websites can open settings, but cannot grant access or change online/offline policy.
          await api.tabs.create({url:api.runtime.getURL("ai.html")}); result = {opened:true};
        } else {
          if (scope !== "trusted" && !(await api.storage.local.get("ai.sites"))["ai.sites"]?.includes(scope)) throw Error("Allow this site in the extension AI workspace first.");
          if (msg.action === "configure" && scope === "trusted") {
            if (typeof msg.offline !== "boolean" || !Array.isArray(msg.sites) || msg.sites.some(s => !SITES.includes(s))) throw Error("Invalid connection settings.");
            offline = msg.offline;
            if (offline) for (const current of active) if (current !== ctl) current.abort();
            await api.storage.local.set({"ai.offline":offline, "ai.sites":[...new Set(msg.sites)]});
            result = {offline};
          } else if (msg.action === "key" && scope === "trusted") {
            if (!Object.prototype.hasOwnProperty.call(PROVIDERS,msg.provider) || !PROVIDERS[msg.provider].key || typeof msg.key !== "string" || msg.key.length > 1024 || /[\r\n]/.test(msg.key)) throw Error("Invalid provider key.");
            if (msg.key) await api.storage.session.set({["ai.key." + msg.provider]:msg.key});
            else await api.storage.session.remove("ai.key." + msg.provider);
            result = {saved:!!msg.key};
          } else if (msg.action === "models") {
            result = await executor.models(msg.provider,{signal:ctl.signal});
          } else if (msg.action === "chat") {
            result = await executor.chat({choice:msg.selection, question:msg.question, history:msg.history ?? [], maxTokens:msg.maxTokens, signal:ctl.signal,
              onDelta:delta => { if (!ctl.signal.aborted) send({id:msg.id,delta}); }});
          } else throw Error("Unsupported AI request.");
        }
        if (ctl.signal.aborted) throw Error("Reading stopped. Provider cancellation is unconfirmed.");
        send({id:msg.id,result});
      } catch (error) {
        // No upstream response bodies, keys or raw fetch errors cross the bridge.
        send({id:msg.id,error:ctl.signal.aborted ? "Reading stopped. Provider cancellation is unconfirmed." : error instanceof Error && !/fetch|network/i.test(error.message) ? error.message.slice(0,240) : "The selected provider could not be reached. No fallback was tried."});
      } finally { clearTimeout(timer); requests.delete(msg.id); active.delete(ctl); }
    });
  });
}
