// SOV SPACE — one space, three faces. The canonical descriptor so the UI, end-users, AND other
// agents read ONE source of truth. SOV33 is the mind; the command SEAM is how any face acts.
// Honest: J-Space measures FUNCTIONAL CORRELATES (not felt experience); DAIMON is an engineering
// label, not a soul claim. Emergence ledger = hash-chained heuristic seed (real, not neural-yet).
export default function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Cache-Control','public, max-age=60');
  const base='https://os.meok.ai';
  return res.status(200).json({
    spec:'meok.sovspace.v1',
    name:'SOV Space',
    tagline:'One sovereign space, three faces — inward (J-Space), outward (World), lateral (Agents).',
    faces:{
      jspace:{ what:'INWARD — SOV33 measuring itself. Functional-correlate instruments + emergence ledger + OOWM state.',
        honest:'measures functional correlates, NOT felt experience; DAIMON = engineering label, not a soul claim.',
        instruments:['creativity (r² .91)','care-pattern','relationship-evolution','+4 weaker (retraining)'],
        live:{ emergence: base+'/api/emergence', trust: base+'/api/trust/score/MEOK%20Sovereign%23default' } },
      world:{ what:'OUTWARD — the cinema-grade 3D world for END USERS. Build your AI character / hatch / world; SOV33 flies it for you.',
        surface: base+'/sovspace3d.html', renderer:'WebGL (client-GPU, free forever) · Cesium/Unreal = premium bodies on the same seam' },
      agents:{ what:'LATERAL — OTHER AGENTS enter + act here through the same command seam (A2A discover, MCP call).',
        connect:{ agentCard: base+'/api/agentcard', mcp: base+'/api/mcp', hatch: base+'/api/hatch' },
        how:'an external agent: (1) discovers via the A2A agent-card, (2) calls the MCP seam, (3) issues seam commands to act in the World.' }
    },
    // THE SEAM — the one command language every face + body (WebGL/Cesium/Unreal/MCP) obeys
    seam:{ commands:['flyTo{lat,lon}','scan{radiusMi}','spawn{kind}','narrate{text}','orbit','card{html}','arc{from,to}'],
      note:'SOV33 (the mind) never renders; it emits seam commands; any body executes them. Build the seam once, master every body.' },
    governance:{ careFloor:0.95, council:'BFT 22-of-33', signing:'Ed25519 · verify at '+base+'/api/verify' },
    provider:'CSOAI / MEOK (UK Co. 16939677)'
  });
}
