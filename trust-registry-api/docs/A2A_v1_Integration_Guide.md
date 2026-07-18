# A2A v1.0 Integration Guide

**Date:** 29 May 2026  
**Status:** Specification — ready for implementation  
**Classification:** Crown Jewels — Protocol Bridge  

---

## A2A v1.0: WHAT CHANGED

Google's A2A protocol (Linux Foundation) shipped **v1.0 stable** on 28 May 2026:

| Feature | Beta | v1.0 Stable |
|---------|------|-------------|
| Signed Agent Cards | ❌ | ✅ Cryptographically signed |
| Multi-protocol negotiation | Basic | Production-ready |
| Enterprise multi-tenancy | ❌ | ✅ Full support |
| Organizations in production | 50+ | **150+** |

**This changes everything.** A2A is no longer "coming soon." It's the dominant agent protocol.

---

## THE POAI ↔ A2A BRIDGE

### Concept

Every A2A agent with a Signed Agent Card can be **automatically bridged** to a POAI Soulbound Token:

```
A2A Signed Agent Card (Google-issued)
            ↓
    [POAI Bridge Service]
            ↓
POAI AgentIdentity SBT on Solana
            ↓
    [Community Verification]
            ↓
POAI SafetyCertification SBT
            ↓
    [Loopfactory Marketplace]
            ↓
"POAI Verified" badge on listing
```

### Why This Matters

| Problem | A2A Alone | A2A + POAI |
|---------|-----------|------------|
| Who verifies the card? | Google | **Community** |
| Can cards be revoked? | No | **Yes, on-chain** |
| Cross-chain portability? | No | **Yes, Solana-native** |
| Safety audit trail? | No | **On-chain, permanent** |
| Human-in-the-loop? | No | **Required for certification** |

---

## TECHNICAL SPEC

### A2A Agent Card Structure (v1.0)

```json
{
  "$schema": "https://google.github.io/a2a/schema/agent-card.json",
  "name": "Safety Auditor Bot",
  "description": "Automated safety auditing for AI agents",
  "url": "https://agents.csoai.org/auditor",
  "provider": {
    "organization": "MEOK AI LABS",
    "url": "https://meok.ai"
  },
  "version": "1.0.0",
  "authentication": {
    "schemes": [ "a2a-jwt", "api-key" ]
  },
  "defaultInputModes": [ "text" ],
  "defaultOutputModes": [ "text", "sbt-verification" ],
  "capabilities": {
    "streaming": true,
    "pushNotifications": false
  },
  "skills": [
    {
      "id": "safety-audit",
      "name": "AI Safety Audit",
      "description": "Full safety audit with POAI certification",
      "tags": [ "safety", "compliance", "audit" ],
      "examples": [ "Audit my agent for bias", "Check compliance with EU AI Act" ]
    }
  ]
}
```

### Bridge: A2A Card → POAI SBT

```typescript
// src/bridge/a2a-to-poai.ts
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { mintSbt, SbtType } from '../client/sbt';

interface A2AAgentCard {
  name: string;
  description: string;
  url: string;
  provider: { organization: string; url: string };
  version: string;
  skills: Array<{ id: string; name: string; tags: string[] }>;
  // Signed portion:
  signature?: string;
  issuer?: string;
}

export async function bridgeA2AToPOAI(
  card: A2AAgentCard,
  ownerWallet: PublicKey,
  payer: Keypair,
  connection: Connection
): Promise<string> {
  // 1. Validate A2A card signature
  if (!card.signature || !card.issuer) {
    throw new Error('A2A card must be signed (v1.0 requirement)');
  }
  
  const isValid = await verifyA2ASignature(card);
  if (!isValid) {
    throw new Error('A2A card signature invalid');
  }
  
  // 2. Generate unique token ID from card hash
  const cardHash = hashA2ACard(card);
  const tokenId = BigInt('0x' + cardHash.slice(0, 16));
  
  // 3. Mint AgentIdentity SBT on Solana
  const metadataUri = `https://api.csoai.org/a2a-cards/${cardHash}`;
  const charterRef = 'CSOAI Charter Article 2.1 — Agent Identity';
  
  const txSig = await mintSbt(
    connection,
    payer,
    ownerWallet,
    SbtType.AgentIdentity,
    tokenId,
    metadataUri,
    charterRef,
    1 // risk tier: low (verified by Google)
  );
  
  // 4. Store bridge record
  await db.query(
    `INSERT INTO a2a_bridge (a2a_card_hash, sbt_token_id, solana_tx, card_json, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [cardHash, tokenId.toString(), txSig, JSON.stringify(card)]
  );
  
  return txSig;
}

async function verifyA2ASignature(card: A2AAgentCard): Promise<boolean> {
  // Use Google's published public keys or JWK endpoint
  const googleKeys = await fetch('https://a2a.googleapis.com/.well-known/jwks.json')
    .then(r => r.json());
  
  // Verify JWT-style signature on the card
  // Implementation depends on Google's exact signing format
  return true; // Placeholder — actual crypto verification needed
}

function hashA2ACard(card: A2AAgentCard): string {
  const canonical = JSON.stringify(card, Object.keys(card).sort());
  return require('crypto').createHash('sha256').update(canonical).digest('hex');
}
```

### REST API: A2A Bridge Endpoint

```typescript
// POST /bridge/a2a
// Body: { a2aCard: A2AAgentCard, ownerWallet: string }
// Returns: { sbtTokenId: string, solanaTx: string, status: string }

router.post('/a2a', async (req, res) => {
  const { a2aCard, ownerWallet } = req.body;
  
  try {
    const ownerPubkey = new PublicKey(ownerWallet);
    const payer = loadPayerKeypair(); // From env or HSM
    
    const txSig = await bridgeA2AToPOAI(a2aCard, ownerPubkey, payer, solanaConnection);
    
    res.json({
      sbtTokenId: hashA2ACard(a2aCard).slice(0, 16),
      solanaTx: txSig,
      status: 'bridged',
      nextStep: 'Submit for Safety Certification at /audit/submit'
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
```

---

## LOOPFACTORY.AI: A2A-NATIVE LISTINGS

### Product Card Enhancement

```tsx
// components/ProductCard.tsx — A2A v1.0 additions
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    type: 'MCP' | 'A2A' | 'ACP' | 'Character' | 'Bundle';
    a2aCard?: A2AAgentCard;      // NEW: v1.0 signed card
    poaiSbt?: POAISbt;           // Existing: SBT data
    price: number;
    rating: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        {product.a2aCard && (
          <Badge variant="secondary">
            <Shield className="w-3 h-3 mr-1" />
            A2A v1.0
          </Badge>
        )}
        {product.poaiSbt && (
          <SbtBadge sbt={product.poaiSbt} />
        )}
      </div>
      
      {product.a2aCard && (
        <div className="text-xs text-muted-foreground mt-2">
          <span className="font-mono">{product.a2aCard.provider.organization}</span>
          {' • '}
          {product.a2aCard.skills.length} skills
          {' • '}
          Signed by {product.a2aCard.issuer}
        </div>
      )}
    </Card>
  );
}
```

### A2A Skill → POAI Verification Mapping

| A2A Skill Tag | POAI Charter Reference | Required SBT |
|--------------|----------------------|--------------|
| `safety`, `audit` | Article 10.2 | SafetyCertification |
| `identity`, `auth` | Article 2.1 | AgentIdentity |
| `governance`, `compliance` | Article 8 | EnterpriseTrust |
| `character`, `avatar` | Article 6 | CharacterGenesis |

---

## ENTERPRISE PITCH: A2A + POAI

### The Pitch

> "Your enterprise adopted A2A v1.0. Good — you can connect agents. But who verifies those agents are safe? Who ensures compliance? Who tracks the audit trail?
> 
> POAI is the **decentralized trust layer** for A2A. Every agent gets a blockchain-verified identity. Every safety check is permanently recorded. And when regulators ask for proof — you have a Solana transaction hash, not a PDF."

### Value Props

| For | A2A Alone | A2A + POAI |
|-----|-----------|------------|
| **CISO** | Agents can talk | Agents are **verified safe** |
| **Compliance** | Self-reported | **On-chain audit trail** |
| **Legal** | No liability protection | **POAI cert = due diligence** |
| **Procurement** | Buy from anyone | **Buy only POAI-verified** |

---

## IMPLEMENTATION CHECKLIST

- [ ] Verify A2A v1.0 card signature format (Google docs)
- [ ] Implement `/bridge/a2a` endpoint
- [ ] Add A2A card display to ProductCard component
- [ ] Auto-bridge A2A agents on marketplace submission
- [ ] Add "A2A v1.0 Verified" filter to browse page
- [ ] Test with real A2A agent card from production org
- [ ] Document bridge API for external developers
- [ ] Announce "First A2A + POAI integration" on LinkedIn

---

## COMPETITIVE ADVANTAGE

**We are the first** to bridge A2A v1.0 Signed Agent Cards to blockchain-verified SBTs. This positions POAI as:
- The **trust infrastructure** for the A2A ecosystem
- The **compliance layer** for enterprise A2A deployments
- The **marketplace standard** for A2A agent verification

**No competitor has this.**

---

*Guide prepared: 2026-05-29 05:20 GMT+1*  
*MEOK AI LABS — Protocol Integration*
