# Unreal Engine 5.8 integration plan for SOV Town

Goal: visualise the governance simulation as a living town that regulators, auditors and product teams can walk through.

## Architecture

- **Headless engine** (`sov-town`): TypeScript simulation, rule evaluation, Ed25519 attestations, council votes, on-chain anchors.
- **Live data bridge**: simulation emits `latest.json` via HTTP or filesystem watch.
- **UE5.8 plugin**: a small C++ / Blueprint actor reads `latest.json`, maps each agent to an NPC, and drives behaviour.
- **Rendering target**: a single packaged desktop executable plus a pixel-streamed web viewer for demos.

## Data contract

UE expects `latest.json` to contain:

```json
{
  "agents": [{ "id", "name", "industry", "role", "complianceProfile.riskScore" }],
  "violations": [{ "framework", "rule", "severity", "tick" }],
  "attestations": [{ "agentId", "framework", "status", "signature", "anchoredTx" }],
  "messages": [{ "from", "to", "content", "tick" }],
  "councilVotes": [{ "topic", "votes", "outcome", "tick" }],
  "anchor": { "txHash", "merkleRoot" },
  "summary": { "totalActions", "totalMessages", "totalCouncilVotes", "violationsByFramework", "riskDistribution" }
}
```

## UE5 implementation steps

1. Create a new C++ plugin `SOVTownConnector`.
2. Add `JsonUtilities` and `HTTP` module dependencies.
3. Implement `ASOVTownDirector`:
   - `FetchLatest()` downloads `latest.json` from a configurable URL.
   - `SpawnAgents()` reads agents and spawns one `ASOVTownAgent` per agent.
   - `RunTick(int32 Tick)` replays actions, moves NPCs, triggers violation VFX, displays attestation UI.
4. Implement `ASOVTownAgent`:
   - `UStaticMeshComponent` body, `UTextRenderComponent` label, `UNiagaraSystem` halo.
   - `SetRiskScore(float)` tints halo red/amber/green.
   - `PlayViolation(const FString& Framework, const FString& Rule)` spawns a floating widget.
5. Implement `ACouncilChamber`:
   - Reads latest `councilVotes`, seats voting agents, shows yes/no/abstain cards, announces outcome.
6. Add `WBP_AgentCard` and `WBP_VoteCard` UMG widgets.
7. Package for Windows/Mac and set up Pixel Streaming for browser demos.

## Town layout (suggested)

- Central plaza: council chamber + anchor obelisk showing merkle root.
- 12 industry districts arranged in a ring.
- Roads between districts pulse with message arrows.
- Violations appear as red flares above buildings.

## Open questions

- Real-time vs recorded replay? Start with recorded replay from `latest.json`; later add live websocket.
- Pixel Streaming host: use Epic's Pixel Streaming infrastructure or a self-hosted signalling server.
- 3D asset source: use Paragon/MetaHuman for regulators, stylised robots for agents to keep scope small.

## Next actions

1. Scaffold `SOVTownConnector` plugin.
2. Import a simple modular town kit from Fab/Quixel.
3. Build `ASOVTownDirector` and agent spawner.
4. Wire a Blueprint-only demo level.
5. Export a packaged build and test Pixel Streaming on `stream.csoai.org`.
