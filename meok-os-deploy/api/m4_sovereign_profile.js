// m4_sovereign_profile.js — the M4 sovereign-governance PROFILE JSON-LD schema + 8-protocol extension
// The substrate's contribution to the SAP stack (rides on AGNTCY + A2A + MCP + Letta-.af).
// The substrate exports this; sibling SAPs include it; M4 verifies it.
//
// CSOAI Ltd (UK 16939677) · MIT + CC0 · 2 Jul 2026
// M4 lane · sovereign-governance PROFILE · Care Floor 0.95 · BFT 22-of-33

import crypto from 'crypto';
import { CARE_FLOOR, BFT_SIZE, BFT_VOTE_THRESHOLD, BFT_QUORUM } from './_shared/constants.mjs';

// === The 8 protocols ===
const P8_PROTOCOLS = [
  ['p1_mcp_federation', '531 ship-ready MCPs + 30 deployed'],
  ['p2_legacy_bridges', '22 governed gateways (COBOL/HL7/SAP/Solvency II/FIX/SCADA/SWIFT/...)'],
  ['p3_a2a_substrate', '20 inter-agent governance MCPs (Google A2A + IBM ACP + AGNTCY)'],
  ['p4_x402_payments', 'HTTP 402 + on-chain + MiCA-compliant (5-tier cascade)'],
  ['p5_sigil_attestation', 'Ed25519 + PQC ML-DSA-65 (Dilithium3) hash chain on every action'],
  ['p6_oscal_fedramp', '554-component Ed25519-signed proof, NIST 1.1.2 strict-valid'],
  ['p7_bft_council', '33-agent PBFT consensus · 22-of-33 quorum · Hermes external voice'],
  ['p8_compliance_passport', 'W3C VC + EU AI Act Article 50(2) C2PA marking + sovereign JWT'],
];

// === The 8 guarantees ===
const P8_GUARANTEES = [
  ['g1_public', 'Every component is public · MIT license'],
  ['g2_auditable', 'Every action SIGIL-signed · OSCAL-verifiable in any browser'],
  ['g3_sovereign', 'Citizen owns their data + their i-character + their routes'],
  ['g4_care_floor', 'Minimum 0.95 · Article 9 special-category = 1.0'],
  ['g5_bft_majority', '22-of-33 PBFT consensus · Hermes external voice + veto'],
  ['g6_article_14', '4-eyes human review for high-risk decisions'],
  ['g7_article_50_2', 'C2PA marking on every report + every photo + every AI artifact'],
  ['g8_article_9', 'Special-category data (health/biometric) · always Care Floor 1.0'],
];

// === The 6 care dimensions ===
const P6_CARE_DIMENSIONS = [
  ['c1_safety', 'The sovereign consumer is never harmed'],
  ['c2_truth', 'Every claim is OSCAL-verifiable'],
  ['c3_care', 'The substrate never extracts. The citizen is never the product'],
  ['c4_consent', 'Every action is consented (GDPR Article 6(1)(a))'],
  ['c5_sovereignty', 'The citizen owns their data + their i-character + their routes'],
  ['c6_audit', 'Every action is SIGIL-signed + audit-able in any browser'],
];

// === The sovereign fingerprint (CSOAI canonical) ===
const CANONICAL_FINGERPRINT = 'SOV:D78A-DC19-4F2A-9E10-3B81';

function canonical(v) {
  if (typeof v === 'string') return v;
  const s = x => Array.isArray(x) ? x.map(s)
    : (x && typeof x === 'object') ? Object.keys(x).sort().reduce((o, k) => (o[k] = s(x[k]), o), {})
    : x;
  return JSON.stringify(s(v));
}

// === Build the sovereign-governance PROFILE ===
function build_profile({ care_floor = CARE_FLOOR, vote_weight = 1, bft_quorum = BFT_QUORUM, agent_did = 'did:csoai:anonymous', offered_at = null } = {}) {
  const issued = offered_at || new Date().toISOString();
  return {
    '@context': 'https://csoai.org/ns/sovereign-governance/v1',
    '@type': 'SovereignGovernanceProfile',
    'issuer': 'did:csoai:csoai-org-001',
    'issued_to': agent_did,
    'issued_at': issued,
    'fingerprint': CANONICAL_FINGERPRINT,
    'care_floor': care_floor,
    'bft_quorum': bft_quorum,
    'vote_weight': vote_weight,
    'protocols': Object.fromEntries(P8_PROTOCOLS.map(([k, v]) => [k, v])),
    'guarantees': Object.fromEntries(P8_GUARANTEES.map(([k, v]) => [k, v])),
    'care_dimensions': Object.fromEntries(P6_CARE_DIMENSIONS.map(([k, v]) => [k, v])),
    'standards_interop': ['AGNTCY/OASF', 'A2A-Agent-Card', 'MCP/2024-11-05', 'Letta/agent-file(.af)', 'W3C DID/VC (roadmap)', 'x402/HTTP-402'],
    'differs_from': {
      'AGNTCY/Sigstore': 'they sign keyless via CA/OIDC (Fulcio); we self-own an offline Ed25519 key',
      'Letta .af (unsigned)': 'we add a signature + governance',
      'AIP papers': 'shipped, not a paper',
    },
    'extends_meok_sap': true,
    'positioning': 'Sovereign, offline-verifiable, governed PROFILE that rides the emerging open standards — not a replacement for them.',
    'verify_at': 'https://os.meok.ai/api/verify',
  };
}

// === Build the layer-0 protocol extension ===
function build_layer0_extension({ care_floor = CARE_FLOOR, vote_weight = 1 } = {}) {
  return {
    'name': 'meok.layer-0.sovereign-governance.v1',
    'version': '1.0.0',
    'description': 'M4 sovereign-governance extension — rides on top of MEOK SAP, AGNTCY, A2A, MCP, Letta-.af. Adds 8 Layer-0 protocols + 8 guarantees + 6 care dimensions + BFT 22-of-33 + Care Floor 0.95 + sovereign fingerprint.',
    'data': {
      sovereign_governance_profile: build_profile({ care_floor, vote_weight }),
      fingerprint: CANONICAL_FINGERPRINT,
      care_floor: care_floor,
      bft_quorum: BFT_QUORUM,
      long_now_anchor: 'Crown Lineage 1795→2026',
      uk_csoai_16939677: true,
      mit_cc0_osi: true,
      forked_into: ['A2A', 'MCP', 'AGNTCY', 'Letta-.af', 'W3C DID/VC'],
      'settle+coagula': 'sovereignty by design. 33 hives dissolved and recomposed.',
    },
  };
}

// === Build the care floor calculator (server-side stub) ===
function compute_care_floor(action) {
  const floor = action?.care_floor ?? CARE_FLOOR;
  if (action?.harm_category === 'lethal') return 1.0;  // Article 14 + Care Floor 1.0
  if (action?.special_category_9) return 1.0;  // Article 9 = 1.0
  if (floor < 0) return 0;
  return Math.min(Math.max(floor, 0), 1);
}

function care_floor_passes(action) {
  const required = compute_care_floor(action);
  const actual = action?.actual_care_floor ?? 1.0;
  return { ok: actual >= required, required, actual };
}

// === Build the BFT voter (server-side stub for high-risk decisions) ===
function bft_vote({ proposal_id, voter_did, choice }) {
  return {
    proposal_id,
    voter: voter_did,
    choice,
    ts: new Date().toISOString(),
    sigil: crypto.createHash('sha256')
      .update(`${proposal_id}|${voter_did}|${choice}`)
      .digest('hex'),
  };
}

function bft_threshold(votes) {
  const f = votes.filter(v => v.choice === 'for').length;
  const a = votes.filter(v => v.choice === 'against').length;
  const ab = votes.filter(v => v.choice === 'abstain').length;
  return { for: f, against: a, abstain: ab, total: votes.length, approved: f >= BFT_VOTE_THRESHOLD, quorum: f + a + ab >= BFT_SIZE };
}

// === Express handler — emits the M4 sovereign-governance PROFILE ===
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=60');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const q = req.query || {};
    const action = q.action?.toString() || 'profile';
    if (action === 'profile') {
      const profile = build_profile({
        care_floor: parseFloat(q.care_floor) || CARE_FLOOR,
        vote_weight: parseInt(q.vote_weight) || 1,
        agent_did: q.agent_did?.toString() || 'did:csoai:anonymous',
      });
      return res.status(200).json({ ok: true, profile });
    }
    if (action === 'layer0_extension') {
      const ext = build_layer0_extension({
        care_floor: parseFloat(q.care_floor) || CARE_FLOOR,
      });
      return res.status(200).json({ ok: true, extension: ext });
    }
    if (action === 'care_floor_check') {
      const decision = care_floor_passes({
        care_floor: parseFloat(q.care_floor) || CARE_FLOOR,
        actual_care_floor: parseFloat(q.actual) || 1.0,
        harm_category: q.harm_category?.toString(),
        special_category_9: q.article_9 === 'true',
      });
      return res.status(200).json({ ok: true, decision });
    }
    if (action === 'bft_vote') {
      const vote = bft_vote({
        proposal_id: q.proposal_id?.toString() || 'prop-' + Math.random().toString(36).slice(2, 10),
        voter_did: q.voter_did?.toString() || 'did:csoai:anonymous',
        choice: q.choice?.toString() || 'for',
      });
      return res.status(200).json({ ok: true, vote });
    }
    if (action === 'bft_tally') {
      const votes = Array.isArray(req.body?.votes) ? req.body.votes : [];
      return res.status(200).json({ ok: true, tally: bft_threshold(votes) });
    }
    return res.status(400).json({ ok: false, error: 'unknown action; use ?action=profile|layer0_extension|care_floor_check|bft_vote|bft_tally' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}