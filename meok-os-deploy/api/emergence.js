// Proxy the free-OCI emergence tick over HTTPS (the universe page is https; the micro is http →
// mixed-content blocked in-browser). Server-side fetch has no such block. Free, always-on.
// HONEST DEGRADE: if the live micro is unreachable, we DON'T show an error — we return the real
// published open-frame baseline (L0 per the SOV3/SOV33 two-tier spec), clearly marked `degraded`,
// so a launch-day visitor sees the true current level, never a dead "—" or "(waking)".
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Cache-Control','public, max-age=15');
  try{ const ctl=new AbortController(); const to=setTimeout(()=>ctl.abort(),6000);
    const r=await fetch('http://145.241.232.16:8080/status',{signal:ctl.signal}); clearTimeout(to);
    const d=await r.json(); return res.status(200).json({ ok:true, ...d, via:'free-oci-micro' });
  }catch(e){
    // Honest baseline — L0 is the published open-frame level until the 4 experts land (→ L1).
    return res.status(200).json({ ok:true, degraded:true, tick:'L0', level:'L0', latest:null,
      via:'open-frame-baseline',
      note:'open-frame baseline (L0) — live emergence tick temporarily unavailable' });
  }
}
