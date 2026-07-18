# Payment Layer v2: Pay.sh Integration

**Date:** 29 May 2026  
**Status:** Specification — ready for implementation  
**Classification:** Crown Jewels — Infrastructure  

---

## CHANGE LOG

| Version | Date | Change |
|---------|------|--------|
| v1.0 | 2026-05-20 | x402 primary, Stripe secondary |
| **v2.0** | **2026-05-29** | **Pay.sh primary for Solana agents**, x402 for Ethereum, Stripe for fiat |

---

## WHY PAY.SH

Google Cloud + Solana Foundation jointly launched **Pay.sh** on 28 May 2026:
- Pay-as-you-go gateway for AI agents using stablecoins (USDC)
- Agents autonomously purchase API access
- Solana-native, sub-second finality
- Google Cloud enterprise credibility

**This validates our entire payment architecture.** Pay.sh is simpler than x402 for Solana agents, and Google's involvement means enterprise buyers trust it.

---

## ARCHITECTURE: 4-RAIL PAYMENT SYSTEM

```
┌──────────────────────────────────────────────────────────────┐
│                  MEOK PAYMENT LAYER v2                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   PAY.SH    │  │    x402     │  │   STRIPE    │           │
│  │   (Solana)  │  │  (Ethereum) │  │   (Fiat)    │           │
│  │   PRIMARY   │  │  Secondary  │  │  Secondary  │           │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
│         │                │                │                  │
│         ▼                ▼                ▼                  │
│  ┌────────────────────────────────────────────────────┐     │
│  │           PAYMENT ROUTER (Express)                  │     │
│  │  • Auto-selects rail based on agent preference     │     │
│  │  • Falls back to Stripe for non-crypto users     │     │
│  │  • Unified invoice / receipt / tax handling       │     │
│  └────────────────────────────────────────────────────┘     │
│         │                                                    │
│         ▼                                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │              MEOK TOKEN (Future)                     │     │
│  │  • Verifier earnings settled in MEOK                 │     │
│  │  • Staking for reduced fees                          │     │
│  │  • Governance voting on fee structures               │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## PAY.SH INTEGRATION SPEC

### API Surface

```typescript
// POST /payments/pay-sh/create
interface PayShCreateRequest {
  agentId: string;          // A2A agent card ID or POAI SBT ID
  amount: number;           // USDC amount
  description: string;      // e.g. "Safety audit for Agent #1234"
  recipientWallet: string;  // Solana pubkey of verifier/merchant
  callbackUrl?: string;     // Webhook for completion
}

interface PayShCreateResponse {
  sessionId: string;
  paymentUrl: string;       // Pay.sh checkout URL
  status: 'pending' | 'completed' | 'failed';
  solanaTx?: string;        // Filled on completion
}

// GET /payments/pay-sh/:sessionId/status
interface PayShStatusResponse {
  sessionId: string;
  status: 'pending' | 'completed' | 'failed';
  solanaTx?: string;
  blockTime?: number;
  confirmations: number;
}
```

### Implementation (Express Route)

```typescript
// src/routes/payments/pay-sh.ts
import { Router } from 'express';
import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';

const router = Router();
const SOLANA_RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const PAY_SH_API = 'https://api.pay.sh/v1';

// Create payment session
router.post('/create', async (req, res) => {
  const { agentId, amount, description, recipientWallet, callbackUrl } = req.body;
  
  // Validate recipient wallet
  try {
    new PublicKey(recipientWallet);
  } catch {
    return res.status(400).json({ error: 'Invalid recipient wallet' });
  }
  
  // Create session via Pay.sh API (or use direct USDC transfer)
  const session = await createPayShSession({
    amount,
    currency: 'USDC',
    recipient: recipientWallet,
    metadata: { agentId, description },
    callbackUrl
  });
  
  // Log to PostgreSQL
  await db.query(
    `INSERT INTO payment_sessions (id, agent_id, amount, rail, status, created_at)
     VALUES ($1, $2, $3, 'pay-sh', 'pending', NOW())`,
    [session.id, agentId, amount]
  );
  
  res.json({
    sessionId: session.id,
    paymentUrl: session.url,
    status: 'pending'
  });
});

// Webhook from Pay.sh
router.post('/webhook', async (req, res) => {
  const { sessionId, status, solanaTx } = req.body;
  
  if (status === 'completed') {
    await db.query(
      `UPDATE payment_sessions SET status = 'completed', solana_tx = $1, completed_at = NOW()
       WHERE id = $2`,
      [solanaTx, sessionId]
    );
    
    // Trigger downstream: mint SBT, notify agent, update verifier earnings
    await onPaymentCompleted(sessionId, solanaTx);
  }
  
  res.status(200).send('OK');
});

// Status check
router.get('/:sessionId/status', async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM payment_sessions WHERE id = $1`,
    [req.params.sessionId]
  );
  
  if (!rows.length) return res.status(404).json({ error: 'Session not found' });
  
  res.json({
    sessionId: rows[0].id,
    status: rows[0].status,
    solanaTx: rows[0].solana_tx,
    blockTime: rows[0].completed_at
  });
});

export default router;
```

### Database Schema Addition

```sql
-- Add to existing trust-registry schema
ALTER TABLE payment_sessions ADD COLUMN IF NOT EXISTS rail VARCHAR(20) DEFAULT 'stripe';
ALTER TABLE payment_sessions ADD COLUMN IF NOT EXISTS solana_tx TEXT;

-- Pay.sh-specific session log
CREATE TABLE IF NOT EXISTS pay_sh_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_session_id UUID REFERENCES payment_sessions(id),
  pay_sh_session_id TEXT NOT NULL,
  solana_tx TEXT,
  recipient_wallet TEXT NOT NULL,
  usdc_amount DECIMAL(18, 6) NOT NULL,
  agent_id TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_pay_sh_status ON pay_sh_sessions(status);
CREATE INDEX idx_pay_sh_agent ON pay_sh_sessions(agent_id);
```

---

## RAIL SELECTION LOGIC

```typescript
function selectPaymentRail(agent: AgentProfile, userPreference?: string): PaymentRail {
  // 1. User override
  if (userPreference) return userPreference as PaymentRail;
  
  // 2. Agent-native wallet chain
  if (agent.walletChain === 'solana') return 'pay-sh';
  if (agent.walletChain === 'ethereum') return 'x402';
  
  // 3. Enterprise defaults to fiat
  if (agent.type === 'enterprise') return 'stripe';
  
  // 4. Default: Pay.sh (Solana-first stack)
  return 'pay-sh';
}
```

---

## FEES

| Rail | MEOK Fee | Settlement Speed | Who Pays |
|------|----------|-----------------|----------|
| **Pay.sh** | 2.5% | < 1 second (Solana) | Merchant |
| x402 | 2.5% | ~12 seconds (Ethereum L2) | Merchant |
| Stripe | 3.5% + £0.20 | 2–7 days | Merchant |

**Verifier earnings:** Net of fees, paid in MEOK token (Month 6) or USDC via Pay.sh (now).

---

## SECURITY

- All Pay.sh webhooks verified via HMAC signature
- Solana transactions double-checked on-chain before marking complete
- Rate limiting: 100 requests/minute per agent
- Fraud detection: Flag transactions >$1,000 for manual review

---

## IMPLEMENTATION CHECKLIST

- [ ] Sign up for Pay.sh API key at `pay.sh`
- [ ] Add `PAY_SH_API_KEY` to `.env`
- [ ] Implement `/payments/pay-sh/create` route
- [ ] Implement `/payments/pay-sh/webhook` handler
- [ ] Add Pay.sh to `selectPaymentRail()`
- [ ] Update frontend to show "Pay with Solana (Pay.sh)" option
- [ ] Test end-to-end with devnet USDC
- [ ] Update documentation and API reference

---

## COMPETITIVE POSITIONING

| System | Chains | Agent-Native | Speed | Our Advantage |
|--------|--------|-------------|-------|---------------|
| **Pay.sh** | Solana | ✅ Yes | <1s | **Our primary rail** |
| x402 | Ethereum L2 | ✅ Yes | ~12s | Fallback for ETH agents |
| Stripe | Fiat | ❌ No | 2–7d | Non-crypto users |
| **POAI Unified** | Solana + ETH + Fiat | ✅ Yes | <1s–7d | **One API, all rails** |

---

*Specification prepared: 2026-05-29 05:20 GMT+1*  
*MEOK AI LABS — Payment Infrastructure*
