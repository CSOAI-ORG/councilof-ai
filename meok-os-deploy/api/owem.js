// /api/owem — the canonical OWEM manifest. Matches CHARTER_OWEM_FOUR_SCOPE_SEMANTIC_MODEL.md (locked).
//
// OWEM = ONE governed sovereign substrate viewed at FOUR SCOPES (sized by REACH, not parameters).
// It is NOT "4 model sizes" and NOT a T-parameter model. The model is a replaceable organ; the
// four-scope substrate (governance + memory + identity) is what persists, grows, and federates.
export default function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Cache-Control','public, max-age=300');
  return res.status(200).json({
    spec: 'meok.owem.v2',
    one_line: 'An OWEM is one governed sovereign substrate viewed at four scopes — a person\'s character (small), its tools (medium), the shared governance (large), rooted in one attested identity (centre). The model is a replaceable organ; the substrate persists, grows, and federates.',
    scopes: {
      small:  { name:'AI character', owns:'ONE PERSON — their memory, personality, care-profile; grows with them by accretion', substrate:'sov33_memory_bridge (SIGIL-signed, namespaced to one Hatch fingerprint)' },
      medium: { name:'Tools', owns:'WHAT THE CHARACTER CAN DO — the capability/MCP surface (its hands, not a brain)', substrate:'the capability registry + :3101 MCP cards (378 tools)' },
      large:  { name:'SOV33', owns:'THE RULES ALL CHARACTERS OBEY — care-floor, SIGIL, BFT, passport tiers', substrate:'gates + sov33_identity + federation core' },
      centre: { name:'the 1 (identity)', owns:'THE SHARED SOVEREIGN ROOT all three attest to — makes them ONE system', substrate:'the SIGIL chain + charter' },
    },
    hard_lines: [
      'The four scopes give governance+memory+identity REACH, NOT 4× capability or additive tokens.',
      'Scopes are sized by REACH: small=one person, medium=toolset, large=all-characters’ rules. Not by parameters.',
      'No consciousness/AGI — intelligence is the base model’s; the composition is a governed substrate.',
      'The centre "1" is IDENTITY (the signed root), not a bigger brain.',
    ],
    owem_of_all: {
      meaning: 'REACH across ALL models, not a T-parameter model',
      canonical: 'SOV33 is the OWEM that governs and remembers across EVERY model — not a T-parameter model, but the one sovereign substrate all of them plug into. One memory, one identity, one care-floor, any brain.',
      registry: '61-model reach; route to the best available; swap-persistent (model obsoletes, substrate doesn’t)',
    },
    // SUBORDINATE: model tiers are the "replaceable organ" — HOW any scope's inference runs. NOT the scopes.
    model_tiers_routing: {
      note: 'A separate, lower concept: which model size answers a given call. The scopes above are the OWEM; these are just the swappable brain behind them.',
      fast:   { model:'llama-3.1-8b-instant', use:'reflex/draft — predictive, intent, quick first-pass', tier_param:'small' },
      default:{ model:'llama-3.3-70b-versatile', use:'everyday answers + tool routing', tier_param:'medium' },
      deep:   { model:'openai/gpt-oss-120b (or Claude via key)', use:'careful reasoning + verification', tier_param:'large' },
      caveat: 'The /api/chat `tier` param names map to these model sizes for routing convenience — do NOT confuse them with the OWEM scopes above (which are person/tools/governance/identity).',
    },
    governance: { care_floor: 0.95, signing: 'Ed25519 (SIGIL)', note: 'every emit is care-floored + signed — that, not model size, is the sovereignty' },
  });
}
