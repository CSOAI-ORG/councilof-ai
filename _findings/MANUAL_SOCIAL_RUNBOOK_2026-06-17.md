# Manual Social Publishing Runbook
**Date:** 2026-06-17  
**Status:** Use until `BUFFER_ACCESS_TOKEN` is connected  

---

## Content source
`.hive/content/social-week-2026-06-17.md` contains 7 posts with LinkedIn and Twitter variants.

## Publishing schedule

| Day | Time (GMT) | Post # | Platform | Topic |
|-----|------------|--------|----------|-------|
| Tue | 08:30 | 1 | Both | EU AI Act Article 50 countdown |
| Tue | 17:30 | 2 | LinkedIn | Layer 0 narrative |
| Wed | 08:30 | 3 | LinkedIn | UKRI Smart Grant news |
| Wed | 17:30 | Twitter | 4 | MCP marketplace growth |
| Thu | 08:30 | 5 | LinkedIn | Sovereign attestation deep-dive |
| Thu | 17:30 | 6 | LinkedIn | BFT council governance |
| Fri | 08:30 | 7 | Both | COBOL Bridge legacy modernization |

## Manual steps

### LinkedIn
1. Open https://www.linkedin.com/
2. Click **Start a post**
3. Copy the **Body** text from the relevant post section (remove `>` markers if any)
4. Paste into LinkedIn
5. Add relevant image if available
6. Add hashtags from the post
7. Post

### Twitter / X
1. Open https://twitter.com/ or https://x.com/
2. Click **Post**
3. Copy the **Twitter (280-char)** text
4. Paste and verify character count ≤ 280
5. Add image if available
6. Post

## Automated alternative (once Buffer token is available)

```bash
cd /Users/nicholas/clawd
python3 scripts/publish-buffer.py
```

## Tracking

After each manual post, append to `.hive/content/social-published-log.jsonl`:

```json
{"post": 1, "platform": "linkedin", "published_at": "2026-06-17T08:30:00Z", "url": "https://linkedin.com/..."}
```

## Hashtags to reuse

`#EUAIAct #AICompliance #AIGovernance #CSOAI #AIAgents #A2A #MCP #AgentInfrastructure #SovereignAI #InnovateUK #UKTech #DORA #NIS2 #FinTech #COBOL #LegacyModernization #BFT #Governance #Decentralized #Attestation #Cryptography #Transparency #Marketplace #OpenSource`
