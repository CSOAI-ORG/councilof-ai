// Local businesses / POIs by map viewport — governed connector.
// Today: OpenStreetMap (Overpass) — free, global, real addresses, keyless.
// Swappable: point this at the 50B sovereign DB or Google Places (New) with no front-end change.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const q = req.query || {};
  const s = parseFloat(q.s), w = parseFloat(q.w), n = parseFloat(q.n), e = parseFloat(q.e);
  if ([s, w, n, e].some(isNaN)) return res.status(200).json({ ok: false, error: 'bbox (s,w,n,e) required', places: [] });
  if ((n - s) > 0.35 || (e - w) > 0.35) return res.status(200).json({ ok: false, error: 'zoom in — bbox too large', places: [] });
  const bbox = s + ',' + w + ',' + n + ',' + e;
  // category → OSM filters (domain layers reuse this one governed connector)
  const CATS = {
    business: ['["name"]["shop"]', '["name"]["amenity"]', '["name"]["office"]', '["name"]["tourism"]'],
    health:   ['["amenity"~"hospital|clinic|pharmacy|doctors|dentist"]'],
    education:['["amenity"~"school|university|college|kindergarten|library"]'],
    energy:   ['["power"~"plant|substation|generator"]', '["amenity"="fuel"]'],
    food:     ['["amenity"~"restaurant|cafe|fast_food|bar|pub"]', '["shop"~"supermarket|convenience|bakery"]'],
    transport:['["amenity"~"bus_station|ferry_terminal|taxi"]', '["railway"="station"]', '["aeroway"="aerodrome"]'],
    finance:  ['["amenity"~"bank|bureau_de_change|atm"]'],
    // ── critical infrastructure & signals (all keyless OSM) ──
    comms:    ['["man_made"~"mast|tower|antenna|communications_tower"]["tower:type"~"communication|radio|broadcast"]', '["man_made"="mast"]', '["man_made"="antenna"]', '["telecom"="exchange"]', '["communication:mobile_phone"="yes"]'],
    wifi:     ['["internet_access"="wlan"]["name"]', '["amenity"="wifi"]'],
    power:    ['["power"~"tower|substation|transformer"]', '["power"="generator"]'],
    water:    ['["man_made"~"water_tower|water_works|reservoir_covered|storage_tank"]', '["man_made"="water_well"]'],
    government:['["amenity"~"townhall|courthouse|police|fire_station|embassy"]', '["office"="government"]', '["military"="office"]']
  };
  const cat = (CATS[(q.cat || 'business')] ? q.cat : 'business');
  const oq = '[out:json][timeout:18];(' + CATS[cat].map(f => 'node' + f + '(' + bbox + ');').join('') + ');out 160;';
  const MIRRORS = ['https://overpass.kumi.systems/api/interpreter', 'https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
  try {
    let d = null, lastErr = '';
    for (const url of MIRRORS) {
      try {
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(oq), signal: AbortSignal.timeout(20000) });
        const txt = await r.text();
        if (txt && txt.trim()[0] === '{') { d = JSON.parse(txt); break; }
        lastErr = 'HTTP ' + r.status + ' (non-JSON)';
      } catch (err) { lastErr = String(err); }
    }
    if (!d) return res.status(200).json({ ok: false, error: 'overpass busy: ' + lastErr, places: [] });
    const places = (d.elements || []).filter(x => x.lat && x.lon && x.tags).slice(0, 160).map(x => ({
      name: x.tags.name || ((x.tags.amenity || x.tags.power || x.tags.railway || x.tags.shop || 'site').replace(/_/g, ' ')),
      type: x.tags.shop || x.tags.amenity || x.tags.office || x.tags.tourism || x.tags.power || x.tags.railway || x.tags.aeroway || 'place',
      lat: x.lat, lon: x.lon,
      addr: [x.tags['addr:housenumber'], x.tags['addr:street'], x.tags['addr:city']].filter(Boolean).join(' '),
      phone: x.tags.phone || x.tags['contact:phone'] || '', web: x.tags.website || x.tags['contact:website'] || ''
    }));
    res.status(200).json({ ok: places.length > 0, count: places.length, places, source: 'OpenStreetMap · Overpass · governed connector', note: 'Public POI data. Swappable to the sovereign 50B DB or Google Places with no front-end change.' });
  } catch (e) { res.status(200).json({ ok: false, error: String(e), places: [] }); }
}
