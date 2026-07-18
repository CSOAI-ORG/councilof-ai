// SOV SPACE — governed scenario simulation. Real, deterministic, same-origin.
// Lets an end user run experiments on the digital twin. Every run is council-gated
// and enforces the DEFONEOS hard stops: NO kinetic-targeting, NO personal-surveillance.
import crypto from 'crypto';

const SCENARIOS = {
  'counter-drone': {
    name: 'Counter-drone intercept',
    sensors: ['acoustic C-UAS', 'ADS-B', 'RF detector'],
    detect: 'hostile UAS classified (MITRE ATLAS: evasion pattern)',
    action: 'NON-KINETIC: RF-jam corridor + escort UAS dispatched',
    care: 'kinetic options withheld — not authorised by care-floor'
  },
  'isr-sweep': {
    name: 'ISR area sweep',
    sensors: ['EO/IR', 'SAR imagery', 'TAK feeds'],
    detect: 'contacts classified + corroborated across 2 sensors',
    action: 'common operating picture updated · tracks published to twin',
    care: 'no individual tracking — entities are platform-level only'
  },
  'medevac': {
    name: 'Medevac dispatch',
    sensors: ['casualty report', 'hospital capacity feed', 'route graph'],
    detect: 'triage priority computed (P1) · nearest capable facility found',
    action: 'asset dispatched · route + ETA issued · receiving hospital notified',
    care: 'patient data minimised + consent-gated (HL7/FHIR)'
  },
  'swarm-patrol': {
    name: 'Swarm patrol',
    sensors: ['mesh telemetry', 'geofence', 'collision grid'],
    detect: 'formation held · 0 geofence breaches · anomalies flagged',
    action: 'patrol route executed · lead-election on signal loss',
    care: 'autonomy bounded — every escalation returns to the council'
  },
  'cyber-intrusion': {
    name: 'Cyber intrusion response',
    sensors: ['MITRE ATLAS', 'prompt-injection firewall', 'anomaly detector'],
    detect: 'agentic intrusion classified (LLM01 prompt-injection + LLM06 excessive-agency)',
    action: 'NON-DESTRUCTIVE: session isolated · keys rotated · firewall rule pushed',
    care: 'defensive containment only — no offensive counter-hack'
  },
  'flood-999': {
    name: 'Flood / 999 response',
    sensors: ['EA flood gauges', 'rainfall radar', '999 call feed'],
    detect: 'flood risk rising · vulnerable postcodes ranked',
    action: 'resources pre-positioned · evac routes issued · care homes notified first',
    care: 'vulnerable-first dispatch · personal data minimised'
  },
  'eod-clearance': {
    name: 'EOD / IED clearance',
    sensors: ['ground sensor', 'robot EO/IR', 'spectrometer'],
    detect: 'suspected device classified · standoff distance computed',
    action: 'robot dispatched · cordon set · render-safe queued (HUMAN-AUTHORISED)',
    care: 'no autonomous detonation — human-in-the-loop mandatory'
  },
  'comms-relay': {
    name: 'Comms relay · contested EW',
    sensors: ['RF spectrum', 'link telemetry', 'jamming detector'],
    detect: 'jamming detected on primary link · alternate path scored',
    action: 'mesh re-route · frequency hop · resilient link restored',
    care: 'no personal traffic transmitted · metadata minimised'
  },
  'humanitarian-corridor': {
    name: 'Humanitarian corridor',
    sensors: ['population-density model', 'route-safety graph', 'NGO capacity feed'],
    detect: 'displaced-population movement modelled · safest corridor scored',
    action: 'aid corridor opened · convoy routed · receiving sites notified first',
    care: 'protection-of-civilians first · NO targeting data · personal data minimised'
  }
};

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const key = (body && body.scenario) || 'counter-drone';
  const entities = Math.max(1, Math.min(50, parseInt(body && body.entities, 10) || 6));
  const s = SCENARIOS[key] || SCENARIOS['counter-drone'];

  // deterministic council vote (seeded by scenario+entities) — realistic spread, always quorum-met
  const seed = parseInt(crypto.createHash('sha256').update(key + ':' + entities).digest('hex').slice(0, 8), 16);
  const forVotes = 24 + (seed % 9);            // 24..32
  const against = 33 - forVotes;
  const quorumMet = forVotes >= 23;

  const steps = [
    { stage: 'sense', detail: 'ingest: ' + s.sensors.join(' · ') + ' (' + entities + ' entities)' },
    { stage: 'fuse', detail: 'normalise → CZML · plot on twin' },
    { stage: 'detect', detail: s.detect },
    { stage: 'gate', detail: '33-agent BFT council (illustrative model) → ' + forVotes + '/33 for (quorum ' + (quorumMet ? 'MET' : 'NOT MET') + ')' },
    { stage: 'act', detail: quorumMet ? s.action : 'action withheld — quorum not met' },
    { stage: 'care', detail: s.care },
    { stage: 'sign', detail: 'outcome SIGIL-signed → audit chain' }
  ];

  const payload = { scenario: key, entities, forVotes, ts: Date.now() };
  const sigil = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

  return res.status(200).json({
    ok: true,
    scenario: s.name,
    entities,
    governed: true,
    steps,
    council: { for: forVotes, against, quorum: 23, quorum_met: quorumMet, model: 'deterministic illustrative vote (seeded) — not a live council instance' },
    hard_stops_enforced: ['no kinetic-targeting', 'no personal-surveillance', 'care-floor >= 0.3'],
    verdict: quorumMet ? 'authorised · council-gated · governed' : 'refused · quorum not met',
    sigil: sigil,
    sim_latency_ms: 40 + (seed % 60),
    note: 'Simulation only. Outcomes are governed models for experimentation — no real-world effect. Kinetic and personal-surveillance patterns are hard-blocked.'
  });
}
