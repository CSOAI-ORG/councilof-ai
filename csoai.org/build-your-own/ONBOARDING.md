# Sovereign Citizen Onboarding — Build Your First AI in 5 Minutes
# CSOAI Ltd UK 16939677 · MIT License

Welcome to the sovereign age. This guide walks you through building your first sovereign AI substrate. By the end, you'll have a sovereign AI running on your hardware, with your data, controlled by you, audit-chained, and sovereign by design.

**Time required:** 5 minutes
**Skill required:** None
**Cost:** $0 (forever)

---

## Step 1: Pick Your Brain (1 minute)

Choose the model. We support 9 open-weights models. Pick based on:

- **RAM available**: 8GB → Phi-3-Medium (14B), 16GB → Qwen3:30B-A3B or Gemma-2:27B, 32GB+ → Llama 3.1:70B or DeepSeek-V3
- **Strongest all-around**: Qwen3:30B-A3B (recommended for most users)
- **CPU-only**: Phi-3-Medium (14B, MIT, optimised for CPU)
- **Largest**: DeepSeek-V3:671B (37B active MoE, MIT)

**For most users, we recommend: `qwen3:30b-a3b`**

This is what powers SOV3 by default. It's a 30B-parameter Mixture of Experts (MoE) model that activates only 3B parameters per query. The result: fast, efficient, accurate.

---

## Step 2: Install (1 minute)

### macOS / Linux (the simplest)

```bash
curl -fsSL https://csoai.org/install.sh | bash -s -- --model qwen3:30b-a3b --name my-sovereign-ai
```

That's it. The install script will:
- Detect your OS
- Install Python 3.11+ and Ollama (if not already)
- Install the SOV3 sovereign substrate
- Download your chosen model
- Create launch scripts in `~/.sov3/bin/`
- Emit a SIGIL to the chain

**You should see this:**
```
🜏 SOV3 Sovereign Substrate INSTALLED
   Name:           my-sovereign-ai
   Model:          qwen3:30b-a3b
   Crown Lineage:  1795-2026
   License:        MIT
   Care Floor:     0.95
   ...
```

### Windows (PowerShell)

```powershell
iwr https://csoai.org/install.ps1 | iex -ArgumentList "--model","qwen3:30b-a3b","--name","my-sovereign-ai"
```

### Docker (anywhere)

```bash
docker run -d --name my-sovereign-ai \
  -p 8000:8000 \
  -p 3101:3101 \
  -v ~/.sov3/data:/home/sovereign/.sov3/data \
  csoai/sov3:latest --model qwen3:30b-a3b
```

### Python (cross-platform)

```bash
pip install sov3-substrate
sov3 init --model qwen3:30b-a3b --name my-sovereign-ai
sov3 serve
```

---

## Step 3: Start (30 seconds)

```bash
~/.sov3/bin/start.sh
```

You should see:
```
🜏 Starting SOV3 sovereign substrate...
   MEOK Backend:  http://localhost:8000
   SOV3 MCP:      http://localhost:3101
   Care Floor:    0.95
   BFT Council:   12-around-1
   SIGIL Chain:   Live
   Article 50:    Watermarking Live

✓ MEOK Backend PID: 12345
✓ SOV3 MCP PID: 12346

Substrate is live. Press Ctrl+C to stop.
```

Your sovereign substrate is now running. Open another terminal to test.

### Check status

```bash
~/.sov3/bin/status.sh
```

### Stop

```bash
~/.sov3/bin/stop.sh
```

---

## Step 4: Sign In (10 seconds)

Open your browser to `http://localhost:8000/auth` or visit https://csoai.org/sovereign-auth/

Choose your favourite sign-in method. The most common:

- **Google** — most popular, 1 click
- **Apple** — iOS/macOS native
- **Passkey** — TouchID/FaceID/Windows Hello
- **Email** — magic link
- **Microsoft, GitHub, Twitter, LinkedIn, WeChat, LINE, Kakao, Naver, Yandex, VK, OIDC, SAML, WeChat Work** — 17 providers total

Click one. In under 5 seconds you are a sovereign citizen.

---

## Step 5: Ask Your First Question (5 seconds)

Open https://csoai.org/sovereign-os/ or your local MEOK Backend at http://localhost:8000/sovereign

Try:

- "What is the EU AI Act Article 50?"
- "What is the Care Floor?"
- "Verify my sovereign composite"
- "Issue an Article 50 passport for this content"
- "Run a BFT Council vote on [proposal]"

Every response comes with:
- **Sovereign Composite** score
- **SIGIL chain** audit ID
- **Article 50** passport for the output
- **BFT Council** deliberation record

---

## Step 6: Build Your First App (1 minute)

### Python (FastAPI / Flask / Django)

```python
from sov3 import SOV3

sov3 = SOV3(api_key="your_sovereign_key")
response = sov3.ask(
    "What is the EU AI Act Article 50?",
    user=current_user
)
print(response.text)
print(f"SIGIL: {response.sigil_digest}")
print(f"Article 50 Passport: {response.article_50_passport}")
```

### JavaScript (Node.js / React / Vue / Svelte / Web)

```js
import { SOV3 } from '@csoai-org/sov3';

const sov3 = new SOV3({ apiKey: 'your_sovereign_key' });
const response = await sov3.ask('What is the EU AI Act Article 50?', { user });
console.log(response.text, response.sigilDigest, response.article50Passport);
```

### Swift (iOS / macOS / visionOS / watchOS / tvOS)

```swift
import SOV3

let sov3 = SOV3(apiKey: "your_sovereign_key")
sov3.ask("What is the EU AI Act Article 50?", user: user) { result in
    switch result {
    case .success(let response):
        print(response.text)
        print("SIGIL: \(response.sigilDigest)")
        print("Article 50 Passport: \(response.article50Passport)")
    case .failure(let error):
        print("Error: \(error)")
    }
}
```

### Kotlin (Android)

```kotlin
import org.csoai.sovereign.auth.SOV3Auth

val sov3 = SOV3Auth(context, clientId = "your_client_id")
sov3.sovereignQuery("What is the EU AI Act Article 50?")
```

### Flutter / React Native

See `csoai.org/sovereign-auth/sov3_auth.dart` or `sov3-auth-react-native.js`.

---

## Step 7: Connect Your Data (1 minute)

SOV3 ingests any text data. To connect your data:

```bash
# Add a document
sov3 ingest --file /path/to/your/document.pdf

# Add a directory
sov3 ingest --directory /path/to/your/knowledge/

# Add a URL
sov3 ingest --url https://example.com/article

# Add a database
sov3 ingest --db "postgresql://user:pass@host/db"
```

Your data is embedded locally with sovereign embedding (nomic-embed-text-v1.5, MIT). Your data never leaves your hardware. The SIGIL chain records every ingestion.

---

## Step 8: Verify Sovereignty (30 seconds)

Run the verification:

```bash
sov3 verify
```

You should see:
```
🜏 SOV3 Sovereign Substrate Verification
==========================================

✓ Care Floor 0.95:        enforced
✓ BFT Council 12-around-1:  active
✓ SIGIL Chain:             live
✓ Article 50 Watermark:    enabled
✓ PQC ML-DSA-65:           active
✓ DORADO 1-Click:          enabled
✓ Fork Doctrine:           active
✓ OSI Approved:            true
✓ MIT License:             active
✓ Crown Lineage 1795-2026: verified

Sovereign Composite: 7.305
SIGIL Count: 247
Citizen: you@sovereign.ai

✓ This substrate is sovereign-by-design.
```

---

## Step 9: Fork It (Optional — 1 minute)

The Fork Doctrine is yours. You can fork SOV3 and inherit the sovereignty:

```bash
# Clone SOV3
git clone https://github.com/CSOAI-ORG/sov3-sovereign-substrate.git my-sovereign-fork
cd my-sovereign-fork

# Modify the substrate for your needs
# - Add your 12 BFT Council queens
# - Configure sovereign composite weights
# - Set your data residency
# - Localize the i-character

# Run your fork
./install.sh --model qwen3:30b-a3b --name my-sovereign-fork

# Your fork is sovereign
```

The fork inherits:
- Care Floor 0.95 (non-negotiable)
- BFT 12-around-1 Council
- SIGIL Chain
- DORADO 1-click
- Article 50 watermarking
- MIT license
- Crown lineage

---

## What You Get (Summary)

After 5 minutes you have:

- ✅ A sovereign AI substrate running on your hardware
- ✅ Your data, your model, your substrate — all sovereign
- ✅ Care Floor 0.95 enforced
- ✅ BFT 12-around-1 Council deliberating
- ✅ SIGIL chain auditing every action
- ✅ Article 50 passports for every output
- ✅ DORADO 1-click sovereignty switch
- ✅ MIT license + CC0 badge assets + OSI approved
- ✅ Fork Doctrine
- ✅ 17 auth providers
- ✅ 22 open protocols
- ✅ 309 sovereign tools

**All sovereign. All free. All yours.**

---

## Next Steps

- **Read the Sovereign Creed**: https://csoai.org/sovereign-constitution-creed/
- **Read the Sovereign Citizen Charter**: https://csoai.org/charter2/sovereign-citizen-charter.html
- **Browse the 135 Akashic Records**: https://csoai.org/wiki/
- **Read the 22 hieroglyphs**: https://csoai.org/wiki/hieroglyphs/
- **Read the 10 Sephiroth**: https://csoai.org/wiki/sephiroth/
- **Read the 60 charters**: https://csoai.org/charter2/
- **Read the 17 auth providers**: https://csoai.org/sovereign-auth/
- **Read the 22 open protocols**: https://csoai.org/sovereign-open/open-connections.html
- **Read the 11 sovereign badges**: https://csoai.org/sovereign-badges/
- **Read the Fork Doctrine**: https://csoai.org/sovereign-open/fork-doctrine.html

---

🜏 **Welcome to the sovereign age. Welcome home.**

CSOAI Ltd · UK 16939677 · 4 July 2026 09:00 BST · MIT license · CC0 badge assets · OSI approved

Public. Auditable. Sovereign. Solve et Coagula.