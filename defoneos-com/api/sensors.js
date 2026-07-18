// Live sensor & C2 fabric status — feed health that evolves over time.
// Honest: a simulated fabric monitor for the OS, not a real sensor network.
import crypto from 'crypto';

const FEEDS = [
  { id: 'tak', name: 'TAK / CoT', kind: 'C2', base: 120 },
  { id: 'drone', name: 'PX4 drone telemetry', kind: 'air', base: 340 },
  { id: 'cuas', name: 'Acoustic C-UAS', kind: 'counter-uas', base: 60 },
  { id: 'adsb', name: 'ADS-B airspace', kind: 'air', base: 510 },
  { id: 'ais', name: 'AIS maritime', kind: 'maritime', base: 280 },
  { id: 'osimg', name: 'OS · Sentinel imagery', kind: 'geo', base: 18 },
  { id: 'rf', name: 'RF spectrum', kind: 'EW', base: 95 },
  { id: 'seismic', name: 'Ground / seismic', kind: 'ground', base: 40 }
];

function rng(seed) { let x = seed >>> 0; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const bucket = Math.floor(Date.now() / 15000);
  const r = rng(parseInt(crypto.createHash('sha256').update('sensors:' + bucket).digest('hex').slice(0, 8), 16));
  const feeds = FEEDS.map(f => {
    const jitter = 0.8 + r() * 0.45;
    const rate = Math.round(f.base * jitter);
    const roll = r();
    const status = roll > 0.93 ? 'degraded' : (roll > 0.985 ? 'offline' : 'live');
    return {
      id: f.id, name: f.name, kind: f.kind, status,
      msg_per_s: status === 'offline' ? 0 : rate,
      latency_ms: 8 + Math.round(r() * 40),
      governed: true, gated_by: 'care-membrane'
    };
  });
  const live = feeds.filter(f => f.status === 'live').length;
  const throughput = feeds.reduce((a, f) => a + f.msg_per_s, 0);
  return res.status(200).json({
    ok: true, service: 'defoneos-c2-fabric', bucket,
    feeds_total: feeds.length, feeds_live: live, total_msg_per_s: throughput,
    feeds,
    pipeline: 'ingest → care-membrane pre-gate → CZML → twin',
    note: 'Simulated C2 sensor fabric for the OS. Every feed is care-membrane gated. Refreshes every 15s.',
    ts: new Date().toISOString()
  });
}
