// MEOK Sovereign — overlay content script. The Sovereign rides on ANY site as a
// small character circle you talk to. Tap to talk · double-tap to open · optional
// "Hey Sovereign" wake-word · pick your character. Talks only to your own brain (os.meok.ai).
(function () {
  if (window.__meokSov) return; window.__meokSov = true;
  const API = "https://os.meok.ai", GOLD = "#c9a84c";
  const CAST = [
    { q: "queen-care", label: "Sophia · care", hue: 17 },
    { q: "queen-king", label: "Sovereign King", hue: 21 },
    { q: "queen-domain", label: "Dagon · domain", hue: 18 },
    { q: "queen-brain", label: "Vinci · maker", hue: 1 },
    { q: "queen-compliance", label: "Justitia · law", hue: 11 },
    { q: "queen-proactive", label: "Florence · care", hue: 14 }
  ];
  let charQ = "queen-care", wakeOn = false, voiceOn = false, listening = false, wakeRec = null;

  // storage (extension storage, fallback localStorage)
  const store = {
    get(cb) { try { chrome.storage.local.get(["meok_char", "meok_wake"], r => cb(r || {})); } catch (e) { cb({ meok_char: localStorage.meok_char, meok_wake: localStorage.meok_wake === "1" }); } },
    set(o) { try { chrome.storage.local.set(o); } catch (e) { if ("meok_char" in o) localStorage.meok_char = o.meok_char; if ("meok_wake" in o) localStorage.meok_wake = o.meok_wake ? "1" : "0"; } }
  };

  // ── character circle (minimised) ──
  const orb = document.createElement("div");
  orb.id = "meok-orb"; orb.title = "MEOK Sovereign — tap to talk · double-tap to open";
  orb.style.cssText = `position:fixed;bottom:22px;right:22px;z-index:2147483647;width:58px;height:58px;border-radius:50%;
    overflow:hidden;cursor:pointer;background:radial-gradient(circle at 40% 32%,#fff7d6,#e9d9a6);
    box-shadow:0 6px 24px rgba(0,0,0,.38),0 0 0 2px ${GOLD},0 0 22px ${GOLD}66;transition:transform .2s,box-shadow .3s;user-select:none`;
  const face = document.createElement("img");
  face.style.cssText = "width:100%;height:100%;object-fit:cover;object-position:center 30%;pointer-events:none";
  face.onerror = () => { orb.textContent = "🐉"; orb.style.cssText += ";display:flex;align-items:center;justify-content:center;font-size:28px;color:" + GOLD + ";background:radial-gradient(circle at 38% 32%,#2a2218,#0e0c08)"; };
  orb.appendChild(face);
  const setFace = () => { face.src = API + "/api/avatar?queen_id=" + charQ + "&size=120"; };
  orb.onmouseenter = () => orb.style.transform = "scale(1.08)";
  orb.onmouseleave = () => orb.style.transform = "scale(1)";

  // ── panel (expanded) ──
  const panel = document.createElement("div");
  panel.id = "meok-panel";
  panel.style.cssText = `position:fixed;bottom:90px;right:22px;z-index:2147483647;width:344px;max-width:92vw;height:476px;max-height:74vh;
    display:none;flex-direction:column;background:#FFFCF5;color:#2a1a14;border:1px solid ${GOLD};border-radius:18px;overflow:hidden;
    box-shadow:0 22px 64px rgba(0,0,0,.42);font-family:-apple-system,Segoe UI,Roboto,sans-serif`;
  panel.innerHTML = `
    <div style="background:linear-gradient(135deg,#1a1410,#3a2e1a);color:${GOLD};padding:11px 13px;display:flex;align-items:center;gap:8px;font-weight:800">
      <span style="font-size:17px">🜂</span> Sovereign
      <span id="meok-cast" title="Pick character" style="cursor:pointer;font-size:15px;opacity:.85;margin-left:6px">🎭</span>
      <span id="meok-wake" title="Hey Sovereign (off)" style="cursor:pointer;font-size:15px;opacity:.55">👂</span>
      <span style="margin-left:auto;font-weight:500;font-size:11px;opacity:.7">on this page</span>
      <span id="meok-min" title="Minimise" style="cursor:pointer;font-size:16px;opacity:.85;margin-left:8px">—</span>
    </div>
    <div id="meok-strip" style="display:none;gap:6px;padding:8px 12px;flex-wrap:wrap;border-bottom:1px solid #eee2c8;background:#faf4e6"></div>
    <div id="meok-log" style="flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:9px;font-size:13.5px;line-height:1.5"></div>
    <div style="display:flex;gap:8px;padding:12px;border-top:1px solid #eee2c8;align-items:center">
      <span id="meok-mic" title="Speak" style="cursor:pointer;font-size:18px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:50%;border:1px solid #e0d4b0">🎤</span>
      <input id="meok-in" placeholder="Speak or type…" style="flex:1;border:1px solid #e0d4b0;border-radius:10px;padding:9px 12px;font-size:13.5px;outline:none">
      <button id="meok-send" style="border:none;background:${GOLD};color:#1a1410;font-weight:800;border-radius:10px;padding:0 13px;cursor:pointer">➤</button>
    </div>`;
  document.documentElement.append(orb, panel);
  const $ = s => panel.querySelector(s);
  const log = $("#meok-log"), input = $("#meok-in"), strip = $("#meok-strip"), wakeBtn = $("#meok-wake");

  function say(who, html) {
    const m = document.createElement("div");
    m.style.cssText = who === "me"
      ? "align-self:flex-end;background:#1a1410;color:#f5f0e6;padding:8px 12px;border-radius:13px 13px 3px 13px;max-width:85%"
      : "align-self:flex-start;background:#f3ecda;padding:8px 12px;border-radius:13px 13px 13px 3px;max-width:90%";
    m.innerHTML = html; log.appendChild(m); log.scrollTop = log.scrollHeight; return m;
  }
  const pulse = on => orb.style.boxShadow = on ? `0 6px 24px rgba(0,0,0,.38),0 0 0 3px ${GOLD},0 0 36px ${GOLD}` : `0 6px 24px rgba(0,0,0,.38),0 0 0 2px ${GOLD},0 0 22px ${GOLD}66`;
  function speak(t) { try { if (!voiceOn || !speechSynthesis) return; const txt = String(t).replace(/<[^>]+>/g, " ").trim(); if (!txt) return; const u = new SpeechSynthesisUtterance(txt); u.rate = 1.02; const v = speechSynthesis.getVoices().find(x => /en-GB/i.test(x.lang)); if (v) u.voice = v; pulse(true); u.onend = () => pulse(false); speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} }

  // character picker
  function renderStrip() {
    strip.innerHTML = CAST.map(c => `<span data-q="${c.q}" style="cursor:pointer;font-size:11.5px;font-weight:700;padding:4px 9px;border-radius:999px;border:1px solid ${c.q === charQ ? GOLD : "#e0d4b0"};background:${c.q === charQ ? GOLD : "#fff"};color:#2a1a14">${c.label}</span>`).join("");
    strip.querySelectorAll("[data-q]").forEach(e => e.onclick = () => { charQ = e.dataset.q; store.set({ meok_char: charQ }); setFace(); renderStrip(); say("ai", "Switched character — I'm here as <b>" + CAST.find(c => c.q === charQ).label + "</b>."); });
  }
  $("#meok-cast").onclick = () => { strip.style.display = strip.style.display === "none" ? "flex" : "none"; if (strip.style.display === "flex") renderStrip(); };

  function openPanel(show) { panel.style.display = (show ?? panel.style.display === "none") ? "flex" : "none"; if (panel.style.display === "flex" && !log.childElementCount) { say("ai", "I'm your Sovereign — here on <b>" + location.hostname + "</b>. Speak or type; I'll find the right tool. Your data stays yours."); input.focus(); } }
  let tapT = 0;
  orb.onclick = () => { const n = Date.now(); if (n - tapT < 300) { openPanel(true); tapT = 0; } else { tapT = n; setTimeout(() => { if (tapT) { startVoice(); tapT = 0; } }, 310); } };
  $("#meok-min").onclick = () => openPanel(false);

  async function send(v) {
    v = (v || input.value).trim(); if (!v) return; input.value = "";
    if (panel.style.display !== "flex") openPanel(true);
    say("me", v.replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c])));
    const t = say("ai", "…");
    try {
      const r = await fetch(API + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: v, queen_id: charQ, register: "plain", persona: "The user is on " + location.hostname + ". Help in context." }) });
      const d = await r.json(); const ans = d.response || "…"; t.innerHTML = ans.replace(/</g, "&lt;"); speak(ans);
      const tr = await (await fetch(API + "/api/tools?q=" + encodeURIComponent(v) + "&limit=3")).json();
      if (tr.matches && tr.matches.length) { const b = say("ai", "🧰 <b>Tools for this:</b><br>"); b.innerHTML += tr.matches.map(m => `<a href="${API}/sovspace.html?q=${encodeURIComponent(m.name)}" target="_blank" style="display:inline-block;margin:4px 4px 0 0;padding:2px 9px;border:1px solid ${GOLD};border-radius:999px;color:#8a6f2e;text-decoration:none;font-size:12px">${m.name}</a>`).join(""); }
      // federated world knowledge (Wikipedia/Wikidata + stats)
      try { const kn = await (await fetch(API + "/api/knowledge?q=" + encodeURIComponent(v))).json();
        const f = kn.facts, top = (kn.results || []).find(x => x.source === "wikipedia" && (x.excerpt || x.desc));
        if ((f && (f.population != null || f.founded)) || top) {
          const k = say("ai", "📚 <b>From the world's knowledge</b> · governed<br>");
          let h = "";
          if (f && (f.population != null || f.founded)) { const bits = []; if (f.population != null) bits.push("👥 pop. <b>" + Number(f.population).toLocaleString() + "</b>"); if (f.founded) bits.push("📅 " + (f.founded < 0 ? (Math.abs(f.founded) + " BC") : f.founded)); h += "<b>" + (f.label || "") + "</b> <span style='color:#8a6f2e'>" + bits.join(" · ") + "</span><br>"; }
          if (top) h += (top.excerpt || top.desc || "").slice(0, 160) + " <a href='" + top.url + "' target='_blank' style='color:#8a6f2e'>↗</a>";
          k.innerHTML += h;
        }
      } catch (e) {}
      // the ONE canonical sovereign network (same /api/nodes the OS globe + MEOK Earth read)
      if (/\b(network|nodes?|map|globe|hubs?|governance|sovereign|where)\b/i.test(v)) {
        try { const nd = await (await fetch(API + "/api/nodes")).json();
          if (nd && nd.nodes && nd.nodes.length) {
            const dot = s => s === "flagged" ? "🔴" : (s === "watch" ? "🟠" : "🟡");
            const n = say("ai", "🌍 <b>Your sovereign network</b> · " + nd.count + " governed hubs<br>");
            n.innerHTML += nd.nodes.slice(0, 6).map(h => dot(h.status) + " <b>" + h.name + "</b> <span style='color:#8a6f2e'>" + (h.role || "") + "</span>").join("<br>") +
              "<br><a href='" + API + "/?app=meokearth' target='_blank' style='color:#8a6f2e'>↗ open MEOK Earth</a>";
          }
        } catch (e) {}
      }
    } catch (e) { t.innerHTML = "I'm here — try once more."; }
  }
  $("#meok-send").onclick = () => send();
  input.addEventListener("keydown", e => { if (e.key === "Enter") send(); });

  // voice in (one-shot)
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function startVoice() {
    voiceOn = true;
    if (!SR) { openPanel(true); say("ai", "Voice input isn't supported here — type to me."); return; }
    if (listening) return; const rec = new SR(); rec.lang = "en-GB"; rec.interimResults = false;
    listening = true; pulse(true); openPanel(true); const m = say("ai", "<i>listening…</i>");
    rec.onresult = e => { m.remove(); send(e.results[0][0].transcript); };
    rec.onend = () => { listening = false; pulse(false); };
    rec.onerror = () => { listening = false; pulse(false); };
    rec.start();
  }
  $("#meok-mic").onclick = startVoice;

  // wake-word "Hey Sovereign" (opt-in, continuous)
  function setWake(on) {
    wakeOn = on; store.set({ meok_wake: on });
    wakeBtn.style.opacity = on ? "1" : ".55"; wakeBtn.textContent = on ? "👂" : "👂"; wakeBtn.title = "Hey Sovereign (" + (on ? "on" : "off") + ")";
    if (on) startWake(); else if (wakeRec) { try { wakeRec.stop(); } catch (e) {} wakeRec = null; }
  }
  function startWake() {
    if (!SR || wakeRec) return;
    wakeRec = new SR(); wakeRec.lang = "en-GB"; wakeRec.continuous = true; wakeRec.interimResults = true;
    wakeRec.onresult = e => { const txt = Array.from(e.results).map(r => r[0].transcript).join(" ").toLowerCase(); if (/(hey )?sovereign|hey meok/.test(txt) && !listening) { try { wakeRec.stop(); } catch (_) {} startVoice(); } };
    wakeRec.onend = () => { if (wakeOn) { try { wakeRec.start(); } catch (_) { setTimeout(() => { try { wakeRec && wakeRec.start(); } catch (e) {} }, 600); } } };
    wakeRec.onerror = () => {};
    try { wakeRec.start(); } catch (e) {}
  }
  wakeBtn.onclick = () => { if (!wakeOn && !confirm('Enable "Hey Sovereign" wake-word? Your mic listens on-device for the phrase only — speech isn\'t recorded or uploaded. Turn off anytime.')) return; setWake(!wakeOn); };

  // init from storage
  store.get(s => { if (s.meok_char) charQ = s.meok_char; setFace(); if (s.meok_wake) setWake(true); });
  setFace();
})();
