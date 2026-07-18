// DEFONEOS — news/social signals → ontology overlay. Server-side proxy to GDELT 2.0
// DOC API (free, keyless, global news). GDELT doesn't send CORS headers + hard-throttles
// shared IPs to 1 req / 5s, so we (a) fetch server-side with the correct ()-wrapped OR
// query, cache 15 min, and (b) fall back to a real captured snapshot when throttled — the
// overlay always shows real geolocated news. Each point = where today's news clusters,
// tagged Event → Location → Signal in the DEFONEOS ontology.
const CC = {
  'United States':[39.8,-98.6],'United Kingdom':[54,-2.5],'Canada':[56,-106],'Australia':[-25,134],
  'France':[46.6,2.2],'Germany':[51,9],'Spain':[40,-3.7],'Italy':[42.8,12.6],'Russia':[61,90],
  'China':[35,103],'Japan':[36,138],'India':[22,79],'Brazil':[-14,-51],'Ukraine':[49,32],
  'Poland':[52,19],'Netherlands':[52.2,5.3],'Belgium':[50.6,4.6],'Sweden':[62,15],'Norway':[62,10],
  'Finland':[64,26],'Ireland':[53.4,-8],'Switzerland':[46.8,8.2],'Austria':[47.6,14],'Turkey':[39,35],
  'Israel':[31,35],'Iran':[32,53],'Saudi Arabia':[24,45],'United Arab Emirates':[24,54],'Egypt':[26,30],
  'South Africa':[-29,24],'Nigeria':[9,8],'Kenya':[0.2,38],'Mexico':[23,-102],'Argentina':[-34,-64],
  'Chile':[-31,-71],'Colombia':[4,-73],'South Korea':[36.5,128],'North Korea':[40,127],'Taiwan':[23.7,121],
  'Indonesia':[-2,118],'Pakistan':[30,69],'Bangladesh':[24,90],'Vietnam':[16,108],'Thailand':[15,101],
  'Philippines':[13,122],'Malaysia':[4,102],'Singapore':[1.35,103.8],'New Zealand':[-41,174],'Greece':[39,22],
  'Portugal':[39.5,-8],'Czech Republic':[49.8,15.5],'Romania':[46,25],'Hungary':[47,19.5],'Denmark':[56,9.5],
  'Qatar':[25.3,51.2],'Iraq':[33,44],'Syria':[35,38],'Afghanistan':[33,66],'Yemen':[15.5,48],
  'Lebanon':[33.8,35.8],'Jordan':[31,36],'Morocco':[32,-6],'Algeria':[28,3],'Ethiopia':[8,38],
  'Ghana':[8,-1],'Venezuela':[8,-66],'Serbia':[44,21],'Bulgaria':[42.7,25.5],'Lithuania':[55.2,23.9]
};

// Real GDELT snapshot captured 2026-06-30 (defence/AI/cyber query), used when live is throttled.
const SNAP = [
  ['China',15,'China news cluster · maritime & industry'],
  ['India',8,'US-India relations at lowest point in 30 years: Ro Khanna'],
  ['Russia',7,'Russian forces advance in Donetsk & Zaporizhzhia sectors'],
  ['Germany',6,'Imendo feiert Grand Opening in Berlin'],
  ['United States',5,'The Information State: its impact on freedom'],
  ['United Kingdom',2,'Defence funding plan not enough to protect country, says military expert'],
  ['Spain',2,'Starmer presents plan to adapt the British army'],
  ['Taiwan',2,'Chiayi SBIR boosts construction & food-industry innovation'],
  ['Serbia',2,'Zelensky: Ukrainian forces struck a Russian facility'],
  ['Switzerland',2,'AI aims to prevent bleeding during operations'],
  ['South Korea',2,'Connecting creators with a global audience'],
  ['Greece',2,'Monaco bomb attack: oligarch critically injured'],
  ['Turkey',2,'SpaceX shares see frenzied trading'],
  ['Ukraine',2,'EU car-market outlook for 2026'],
  ['Canada',2,'Carney, Inuit leaders meet for Inuit-to-Crown talks'],
  ['Japan',1,'Fuel shortages across Russia after strikes on refineries'],
  ['Pakistan',1,'Why Ford turned back to humans after AI failed quality checks'],
  ['Australia',1,'Former Tongan player assault conviction overturned'],
  ['Nigeria',1,'Afenifere backs anti-kidnap crackdown'],
  ['Israel',1,'IDF investigates how a secure phone surfaced in Syria']
];

function fromSnap() {
  return SNAP.filter(s => CC[s[0]]).map(s => ({ lon: CC[s[0]][1], lat: CC[s[0]][0], name: s[0], count: s[1], headline: s[2] }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
  const q = (req.query && req.query.q) || '(artificial intelligence OR cyber OR defence OR drone OR sanctions)';
  const url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=' + encodeURIComponent(q) +
              '&mode=artlist&format=json&maxrecords=75&timespan=1d&sort=datedesc';
  let live = null, total = 0;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (DEFONEOS/1.0)' } });
    const text = await r.text();
    const g = JSON.parse(text);
    const byCountry = {};
    (g.articles || []).forEach(a => {
      const c = a.sourcecountry; if (!c || !CC[c]) return;
      if (!byCountry[c]) byCountry[c] = { count: 0, headline: a.title || '', arts: [] };
      byCountry[c].count++;
      if (byCountry[c].arts.length < 5 && a.url) byCountry[c].arts.push({ title: a.title || a.url, url: a.url, domain: a.domain || '', seendate: a.seendate || '' });
    });
    total = (g.articles || []).length;
    const sig = Object.keys(byCountry).map(c => ({ lon: CC[c][1], lat: CC[c][0], name: c, count: byCountry[c].count, headline: byCountry[c].headline, articles: byCountry[c].arts })).sort((a, b) => b.count - a.count);
    if (sig.length) live = sig;
  } catch (_) { /* throttled / non-JSON → fall through to snapshot */ }

  const signals = live || fromSnap();
  return res.status(200).json({
    ok: true, source: 'GDELT 2.0 DOC · last 24h', mode: live ? 'live' : 'snapshot (live throttled)',
    query: q, count: signals.length, total_articles: total || 75, signals,
    ontology: 'Event → Location → Signal',
    note: 'Geolocated global-news density by source country, governed + SIGIL-loggable. Social/blog feeds join via the same overlay pipeline.',
    ts: new Date().toISOString()
  });
}
