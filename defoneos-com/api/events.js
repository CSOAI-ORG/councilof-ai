// DEFONEOS — global natural events & disaster alerts → dome overlay. Keyless federation of
// NASA EONET (wildfires, storms, volcanoes, ice, floods) + GDACS (UN/EC disaster alerts:
// earthquakes, cyclones, floods, volcanoes, droughts). Governed under Layer-0.
const EONET = {
  'Wildfires': ['🔥', '#ff6b35'], 'Severe Storms': ['🌀', '#3ef0ff'], 'Volcanoes': ['🌋', '#ff3b3b'],
  'Sea and Lake Ice': ['🧊', '#9fd0ff'], 'Floods': ['🌊', '#2a9df4'], 'Earthquakes': ['⊕', '#ffd23b'],
  'Drought': ['🏜️', '#e0a285'], 'Dust and Haze': ['🌫️', '#9aa3c4'], 'Snow': ['❄️', '#ffffff'],
  'Landslides': ['⛰️', '#e0a285'], 'Temperature Extremes': ['🌡️', '#ff6b35'], 'Manmade': ['⚠️', '#ffd23b'],
  'Water Color': ['💧', '#2a9df4']
};
const GDACS = { EQ: ['⊕', 'Earthquake'], TC: ['🌀', 'Cyclone'], FL: ['🌊', 'Flood'], VO: ['🌋', 'Volcano'], DR: ['🏜️', 'Drought'], WF: ['🔥', 'Wildfire'] };
const LEVEL = { Green: '#00e07a', Orange: '#ffd23b', Red: '#ff3b3b' };
const UA = { 'User-Agent': 'Mozilla/5.0 (DEFONEOS/1.0)' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
  const out = [];
  try {
    const e = await (await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=150', { headers: UA })).json();
    (e.events || []).forEach(ev => {
      const g = (ev.geometry || []).slice(-1)[0]; if (!g || !g.coordinates) return;
      const lon = g.coordinates[0], lat = g.coordinates[1]; if (Array.isArray(lon)) return; // skip polygons
      const cat = ((ev.categories || [{}])[0].title) || 'Event'; const m = EONET[cat] || ['•', '#9aa3c4'];
      out.push({ lat, lon, type: cat, icon: m[0], color: m[1], title: ev.title, level: '', source: 'NASA EONET', link: (ev.sources && ev.sources[0] && ev.sources[0].url) || ev.link || '', date: g.date || '' });
    });
  } catch (_) {}
  try {
    const g = await (await fetch('https://www.gdacs.org/gdacsapi/api/events/geteventlist/EVENTS4APP', { headers: UA })).json();
    (g.features || []).forEach(f => {
      const c = f.geometry && f.geometry.coordinates; if (!c) return; const p = f.properties || {};
      const t = GDACS[p.eventtype] || ['⚠️', p.eventtype || 'Alert'];
      out.push({ lat: c[1], lon: c[0], type: t[1], icon: t[0], color: LEVEL[p.alertlevel] || '#ffd23b', title: p.name || p.htmldescription || 'Alert', level: p.alertlevel || '', source: 'GDACS', link: p.url || 'https://www.gdacs.org', date: p.fromdate || '' });
    });
  } catch (_) {}
  return res.status(200).json({
    ok: true, source: 'NASA EONET + GDACS · live natural events & disaster alerts',
    count: out.length, events: out, ts: new Date().toISOString()
  });
}
