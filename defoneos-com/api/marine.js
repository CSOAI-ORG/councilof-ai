// DEFONEOS — marine/AIS → dome overlay. aisstream.io is WebSocket-only; Vercel serverless
// can't hold a socket, so this opens a SHORT (≤6s) server-side WS, subscribes to a bounding
// box, collects live vessel PositionReports, then closes and returns a snapshot. Key stays
// server-side (AIS_KEY env) — never exposed to the browser. Governed under Layer-0.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=60');
  const key = process.env.AIS_KEY;
  if (!key) return res.status(200).json({ ok: false, error: 'AIS key not configured', ships: [] });
  const WS = globalThis.WebSocket;
  if (!WS) return res.status(200).json({ ok: false, error: 'ws-runtime-unavailable', ships: [] });
  const lat = parseFloat(req.query && req.query.lat), lon = parseFloat(req.query && req.query.lon);
  let box;
  if (!isNaN(lat) && !isNaN(lon)) box = [[[lat - 3, lon - 5], [lat + 3, lon + 5]]];
  else box = [[[49, -11], [61, 3]]]; // UK/North Sea default
  return await new Promise(resolve => {
    const ships = {}; let done = false; let ws;
    const finish = () => {
      if (done) return; done = true; try { ws && ws.close(); } catch (_) {}
      const arr = Object.values(ships).slice(0, 280);
      res.status(200).json({ ok: true, count: arr.length, ships: arr, source: 'aisstream.io · live AIS', ts: new Date().toISOString() });
      resolve();
    };
    const timer = setTimeout(finish, 6000);
    try {
      ws = new WS('wss://stream.aisstream.io/v0/stream');
      ws.onopen = () => { try { ws.send(JSON.stringify({ APIKey: key, BoundingBoxes: box })); } catch (_) {} };
      ws.onmessage = async (ev) => {
        try {
          let text;
          if (typeof ev.data === 'string') text = ev.data;
          else if (ev.data && typeof ev.data.text === 'function') text = await ev.data.text();
          else if (ev.data && typeof ev.data.toString === 'function') text = Buffer.from(ev.data).toString('utf8');
          else text = String(ev.data);
          const m = JSON.parse(text);
          if (m.MessageType === 'PositionReport') {
            const md = m.MetaData || {};
            const pr = (m.Message && m.Message.PositionReport) || {};
            if (md.MMSI) ships[md.MMSI] = { mmsi: md.MMSI, lat: md.latitude, lon: md.longitude, name: (md.ShipName || '').trim(),
              cog: (pr.Cog != null && pr.Cog < 360) ? pr.Cog : null, sog: (pr.Sog != null && pr.Sog < 102.3) ? pr.Sog : null };
            if (Object.keys(ships).length >= 280) { clearTimeout(timer); finish(); }
          }
        } catch (_) {}
      };
      ws.onerror = () => { clearTimeout(timer); finish(); };
    } catch (e) { clearTimeout(timer); res.status(200).json({ ok: false, error: String(e), ships: [] }); resolve(); }
  });
}
