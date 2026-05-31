# Google for Startups Cloud Program — MEOK Application (ready to paste)

**Apply here:** https://cloud.google.com/startup → "Apply now" → choose **Start tier**
(Start tier = up to $2,000 first-year credits, NO funding/referral needed — get this TODAY.
Then **Scale tier** = up to **$200,000 over 2 years** if you're VC-backed or via a partner/accelerator.)

**Your GCP details (have these ready):**
- Billing account: 01606E-B39756-05BD81 (GBP)
- Project ID: meok-498012
- Account: nicholastempleman@gmail.com

---

## FORM ANSWERS (copy-paste each field)

**Company / Project name:** MEOK AI LABS (MEOK)

**Website:** https://meok.ai

**Country:** United Kingdom

**Your role:** Founder

**What does your company do? (short)**
MEOK is a sovereign AI character operating system. Users hatch a personal AI character
that becomes their care-director — it talks, remembers them across platforms, and acts on
their behalf through 264+ published tools. Think "a Tamagotchi that's also your AI OS,"
embeddable into any app. Free open-source tier (MEOK ONE) + paid SaaS (MEOK OS).

**What are you building on Google Cloud? (technical)**
We run our backend on Compute Engine (Ollama local-LLM inference + a Postgres/pgvector
memory store + a BFT multi-agent council "SOV3"). We use the Gemini API (Vertex AI /
AI Studio) as the character's reasoning engine and to generate training data for our
care/emotion/safety neural nets. Roadmap: scale-to-zero Cloud Run for inference, GKE for
the multi-agent orchestration bus (MEOK SYNC), and Vertex for fine-tuning.

**Stage / traction:**
- 264 MCP servers published to PyPI (developer tools / AI-agent infrastructure)
- GitHub-native: 100+ repos under CSOAI-ORG
- Working product: 3D AI character that hatches, talks (Gemini), and evolves
- Pre-revenue, bootstrapped, founder-led; launching publicly July 2026

**Why do you need credits?**
To run always-on inference + memory for the character backend without it being gated by
local hardware, and to fund Gemini-API training-data generation + model fine-tuning at
scale. Credits let us serve early users free (our open-source tier) while we build to revenue.

**Funding status:** Bootstrapped / pre-seed (select "Not yet raised" or "Bootstrapped").

**How did you hear about us?** Google Cloud Console / direct.

---

## Eligibility notes (so you don't get rejected)
- **Start tier**: just needs a company + website + GCP account → you qualify NOW.
- **Scale tier ($200k)**: needs to be (a) equity-funded (pre-seed+) OR (b) referred by a
  Google Cloud partner / accelerator / VC. If not VC-backed yet, get Start tier now, and
  apply for Scale via a partner later (many accelerators give the referral code free).
- Company should be a registered entity — MEOK AI LTD covers this.
- Don't claim funding you don't have; "bootstrapped" is fine for Start tier.

## After approval
Credits attach to billing account 01606E-B39756-05BD81 automatically → the VM + Gemini API
spend draws from credits instead of your card. The ~£20/mo VM becomes free.

## Meanwhile (Nick's call: keep VM running)
VM stays on 24/7. Real cost ~£20/mo on your card until credits land. I'll set up a billing
alert so there are no surprises. Stop anytime with:
  gcloud compute instances stop meok-backend --zone=europe-west2-a
