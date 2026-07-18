# SOV3 Sovereign Query — iOS Shortcut

## User Installation (30 seconds)

1. Open **Shortcuts** app on iOS 17+ (or iPadOS 17+ or macOS 14+)
2. Tap **+** in top-right corner
3. Tap **Add Action** (or **Add shortcut**)
4. Search for **"Get contents of URL"** and add it
5. Configure:
   - URL: `https://csoai.org/api/sovereign/query`
   - Method: `POST`
   - Headers: 
     - `Content-Type: application/json`
     - `X-Sov3-Sovereign-Token: YOUR_TOKEN` (get from csoai.org/sovereign-siri)
   - Request Body: JSON
     ```json
     {
       "query": "[Shortcut Input]",
       "sovereign_composite_required": true,
       "care_floor": 0.95
     }
     ```
6. Add **Get Text from Input** action
7. Add **Show Notification** action
8. Add **Speak Text** action with the response
9. Save as "Sovereign Query"

## Voice Activation

After installing, say:
- "Hey Siri, run Sovereign Query"
- "Hey Siri, ask sovereign: [your question]"

## What Happens

1. Siri intercepts the voice command
2. iOS launches the Shortcut
3. Shortcut prompts for question (or uses Siri's parsed query)
4. Shortcut sends HTTPS POST to SOV3 sovereign substrate
5. SOV3 substrate:
   - Validates care_floor >= 0.95
   - Routes to 12-around-1 BFT Council
   - Generates sovereign response
   - Emits SIGIL chain entry
   - Issues Article 50 passport
6. Shortcut receives JSON response
7. Siri speaks the answer with sovereign attribution:
   - "Sovereign answer (composite 7.305, SIGIL a1b2c3d4e5f6g7h8): [answer]"

## Sovereign Properties Enforced

- Care Floor >= 0.95
- Sovereignty >= 0.95
- 12-around-1 BFT Council deliberation
- SIGIL chain audit
- Article 50 passport
- No foreign API
- MIT licensed

## Compliance

- EU AI Act Article 50 (in force 2 Aug 2026)
- GDPR Articles 5, 6, 17, 20, 22, 50
- UK AI Bill 5 principles
- UK DPA 2018
- Bletchley Declaration
- UNESCO AI Ethics
- OECD AI Principles

## Status

- Path 2 (App Shortcuts) — works today, no Apple approval needed
- Path 1 (App Intents / App Store) — 2-4 weeks, requires App Store review
- Path 3 (Apple Intelligence Provider) — 4-8 weeks
- Path 4 (Apple partnership) — 3-6 months

## See Also

- csoai.org/sovereign-siri/ — full integration guide
- csoai.org/sovereign-siri/shortcut-sov3-sovereign-query.json — JSON template
- csoai.org/sovereign-siri/apple-pitch.html — partnership pitch deck
- csoai.org/sovereign-siri/quickstart.md — quick reference
