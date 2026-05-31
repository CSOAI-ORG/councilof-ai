# CSOAI Unity SDK

MEOK Protocol Nexus SDK for Unity games and simulations.

## Installation

### Via Unity Package Manager

1. Open **Window → Package Manager**
2. Click **+ → Add package from git URL**
3. Enter: `https://github.com/csgaglobal/clawd.git?path=sdk/unity`

### Manual

Copy the `CSOAI/` folder into your `Assets/` directory.

## Quick Start

```csharp
using CSOAI;
using UnityEngine;

public class MEOKExample : MonoBehaviour
{
    async void Start()
    {
        var client = new CSOAIClient("https://api.meok.ai", vertical: "gaming");
        client.SetAccessToken("your-jwt-token");

        // Health check
        var health = await client.HealthAsync();
        Debug.Log(health);

        // Get compliance map for deployment planning
        var map = await client.GetComplianceMapAsync();
        Debug.Log(map);

        // Query trust score of a character
        var trust = await client.GetTrustScoreAsync("character_123");
        Debug.Log(trust);

        // List marketplace characters
        var listings = await client.ListMarketplaceAsync();
        Debug.Log(listings);
    }
}
```

## Features

- **MCP Tools** — Call any of 100+ vertical tools
- **A2A Agents** — Send tasks to specialized AI agents
- **RegGeoInt** — Real-time compliance map and cross-border advisory
- **Trust Layer** — Query and submit trust attestations
- **Marketplace** — Browse and purchase character configurations
- **Server Card** — Auto-discover server capabilities

## Architecture

```
Unity Game → CSOAIClient → HTTPS → MEOK Protocol Nexus
              ↓
         MCP / A2A / ACP / Trust / Marketplace
```

## Platform Support

- Unity 2021.3 LTS+
- .NET Standard 2.1
- iOS, Android, macOS, Windows, Linux, WebGL

## Phase 2 Status

✅ Core SDK  
✅ RegGeoInt Integration  
✅ Trust Layer Queries  
✅ Marketplace Browse/Purchase  
⏳ WebSocket ACP (coming Phase 3)  
⏳ libp2p P2P (coming Phase 3)
