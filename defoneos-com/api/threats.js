// Live threat / ISR board — governed contacts that evolve over time.
// Deterministic within a 20s bucket (so refresh shows movement, but it's reproducible).
// Honest: a simulated common-operating-picture feed, not real-world intelligence.
import crypto from 'crypto';

const TYPES = [
  { t: 'UAS', sensors: ['acoustic C-UAS', 'RF', 'ADS-B'] },
  { t: 'vessel', sensors: ['AIS', 'SAR', 'coastal radar'] },
  { t: 'ground', sensors: ['EO/IR', 'seismic', 'TAK'] },
  { t: 'aircraft', sensors: ['ADS-B', 'primary radar'] },
  { t: 'cyber', sensors: ['MITRE ATLAS', 'firewall', 'anomaly'] }
];
const CLASS = ['friendly', 'neutral', 'suspect', 'hostile'];
const SITES = [
  { n: 'Yorkshire', lat: 53.8, lon: -1.55 }, { n: 'Solent', lat: 50.8, lon: -1.3 },
  { n: 'Clyde', lat: 55.9, lon: -4.8 }, { n: 'North Sea', lat: 56.2, lon: 1.5 },
  { n: 'Bristol Ch.', lat: 51.4, lon: -3.4 }, { n: 'Dover', lat: 51.1, lon: 1.3 },
  { n: 'Hebrides', lat: 57.7, lon: -7.0 }, { n: 'Wash', lat: 52.9, lon: 0.3 }
];

function rng(seed) { let x = seed >>> 0; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const bucket = Math.floor(Date.now() / 20000);
  const r = rng(parseInt(crypto.createHash('sha256').update('threats:' + bucket).digest('hex').slice(0, 8), 16));
  const n = 6 + Math.floor(r() * 4); // 6..9
  const contacts = [];
  for (let i = 0; i < n; i++) {
    const ty = TYPES[Math.floor(r() * TYPES.length)];
    const site = SITES[Math.floor(r() * SITES.length)];
    const cls = CLASS[Math.floor(r() * CLASS.length)];
    const conf = Math.round((0.55 + r() * 0.44) * 100);
    const corrob = 1 + Math.floor(r() * ty.sensors.length);
    const gated = (cls === 'hostile' || cls === 'suspect');
    const id = 'T-' + (1000 + Math.floor(r() * 8999));
    const sigil = crypto.createHash('sha256').update(id + bucket + cls).digest('hex').slice(0, 16);
    contacts.push({
      id, type: ty.t, site: site.n, lat: +(site.lat + (r() - 0.5)).toFixed(3), lon: +(site.lon + (r() - 0.5)).toFixed(3),
      classification: cls, confidence: conf, sensors: ty.sensors.slice(0, corrob), corroboration: corrob,
      council: gated ? (conf >= 70 ? 'gated · authorised' : 'gated · pending') : 'monitor', sigil
    });
  }
  contacts.sort((a, b) => CLASS.indexOf(b.classification) - CLASS.indexOf(a.classification) || b.confidence - a.confidence);
  const summary = CLASS.reduce((o, c) => (o[c] = contacts.filter(x => x.classification === c).length, o), {});
  return res.status(200).json({
    ok: true, service: 'defoneos-threat-board', bucket, count: contacts.length, summary, contacts,
    red_lines: ['no kinetic-targeting', 'no personal-surveillance — entities are platform-level only'],
    note: 'Simulated common operating picture for the OS. Governed, SIGIL-tagged, refreshes every 20s. Not real-world intelligence.',
    ts: new Date().toISOString()
  });
}
