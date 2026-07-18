# MEOK AI Labs — Investor FAQ (the hard questions)

**CSOAI LTD (t/a MEOK AI Labs) · Companies House #16939677 · Pre-seed / EIS**
**Principle: answer the uncomfortable questions before the investor has to ask. Every answer is consistent with `DATA_ROOM/` and the deck. No spin.**

---

## On revenue

### Q: Why is MRR £0? You have 271 published products.
**A:** Because publishing distribution and closing sales are two different things, and we've done the first but not the second. The products are live, installable, and able to take card payments today (Stripe acct_1TLlEKQvIueK5Xpb) — but no sale has closed. We state this on the first line of the traction slide rather than hide it. The honest reason: the build happened first (one founder, ~18 months of IP + 271 packages), and the go-to-market motion — outreach, pilots, partnerships — is the work this round funds. We are not asking you to believe revenue exists; we're asking you to underwrite the *conversion* of live, deadline-driven distribution into its first logos.

### Q: If there's a hard 2027 deadline and no competitor, why hasn't a single farm paid yet?
**A:** Fair and pointed. Three honest reasons: (1) the aquaculture suite went live recently (2026-05-24) — it's weeks old, not years; (2) outreach has been drafted, not yet sent at scale (templates exist in `revenue/AQUACULTURE_PARTNERSHIP_EMAILS.md`); (3) a sole founder has been building, not selling. None of those are "the product doesn't work" or "no one wants it" — they're "we haven't done the sales motion yet". That's precisely the gap this raise closes, and the month-3 milestone (first paying customer) is how you hold us to it.

### Q: How do I know the first customer will actually come?
**A:** You don't know — and we won't pretend it's certain. What's *de-risked* vs. a typical pre-revenue startup: the demand driver is a **legal deadline (ASC 1 May 2027)**, not a behaviour-change bet; the buyers are a **known, finite list** (~290 trout farms, ~83 ASC sites); there's **no incumbent SaaS** to displace; and the founder **operates a fish farm**, so he can sell peer-to-peer. The risk is execution of the sales motion, not market existence. Structure the SAFE/milestones so your money tracks that conversion.

---

## On the founder

### Q: Why back a sole founder? That's a single point of failure.
**A:** It is, and you should press on it. We don't dismiss it — we mitigate it. (1) The build velocity is the strongest possible evidence one person can execute: 271 PyPI packages, a live attestation API, and 5 verticals are all one founder's verifiable git history. (2) He's an *operator*, not a first-timer — he runs Templeman Opticians (real cashflow) and a 6.5-acre fish farm. (3) **This round explicitly funds the first hire** (CTO or GTM) plus a compliance and an aquaculture advisor. The plan to stop being a single point of failure is line-item one of the use-of-funds.

### Q: What happens to the company if the founder is hit by a bus?
**A:** Today, honestly, it would stall — that's true of almost any pre-seed sole-founder company, and we won't claim otherwise. The mitigants we're putting in place pre/post-raise: the IP assignment deed moves the IP formally into CSOAI LTD (so the asset survives the person); the codebase is documented and the packages are independently published; and the first hire creates a second person who can carry the product. Key-person risk is real at this stage and is one reason the valuation is conservative.

### Q: Isn't the optician revenue just propping up the story?
**A:** No — and we're careful not to blend it in. Templeman Opticians is a **separate company**; its ~£2.5–5K/mo is **never counted as MEOK revenue** (see `DATA_ROOM/06_financials/06.5`). It matters for exactly one thing: it proves the founder can run a real business with real customers. We present it as credibility/context, explicitly labelled as a different entity. Blending it into MEOK's numbers would be the kind of misleading move this whole raise is built to avoid.

---

## On the repos and "traction"

### Q: 410 public repos and a maximum of 2 stars on any of them. Isn't that a red flag?
**A:** Yes — *if* it were pitched as traction, which we never do. Star count and repo count are not adoption, and we say so on the moat and traction slides. The repos are **IP depth** (the breadth of compliance + vertical coverage one founder has built), not a popularity signal. We'd rather you see 422 repos correctly framed as "evidence of execution capacity and IP breadth" than be sold a vanity metric. The honest read: zero community traction so far, substantial IP — and the round is about converting the latter into the former.

### Q: Why so many repos? Is this just noise / AI-generated padding?
**A:** It's breadth of a real catalogue: 316 built MCPs, 271 published, across compliance (the 12-framework crosswalk core) and five verticals (compliance, optometry, haulage, COBOL-migration, aquaculture). You can install and run them — `pip install eu-ai-act-compliance-mcp` works (v1.8.2, verified live). The honest caveat: breadth is only valuable when tied to revenue, and right now it isn't yet. We don't claim each repo is a product line generating money — most are coverage. The ones that matter for *this* raise are the compliance core (the moat) and the aquaculture suite (the wedge).

### Q: The package names in your old docs (`meok-*`) don't exist on PyPI. Did you fake the count?
**A:** No — the count is real, the *naming in some older docs was wrong*, and we caught it ourselves. The real published names are `<topic>-compliance-mcp` (e.g. `eu-ai-act-compliance-mcp`), not `meok-<topic>`. We document the corrected map openly (`revenue/CANONICAL_PACKAGE_NAMES_2026-05-29.md`) precisely so a prospect running `pip install` from old material doesn't hit a 404. Verify any of them yourself: `pypi.org/pypi/eu-ai-act-compliance-mcp/json` returns 200. Catching and correcting our own inflation is the behaviour we want you to judge us on.

---

## On the moat / competition

### Q: What stops Vanta / Drata / OneTrust from cloning this in a quarter?
**A:** Three things, in order of strength: (1) **The ~18-month crosswalk IP.** The hard part isn't the software — it's the hand-mapped correspondence between EU AI Act, NIST, ISO 42001, DORA, NIS2, CRA and ~12 frameworks. We estimate 12–18 months for a competitor to replicate that depth; it's the slowest thing to copy. (2) **The incumbents are differently shaped:** Vanta/Drata are SOC2/ISO-evidence-collection, closed-source, and not AI-Act-native; bolting on a verifiable, agent-runnable AI-governance layer is a real build for them, not a flag-flip. (3) **The attestation mechanism** (signed, independently-verifiable proof) is a *patentable process* we intend to file on. Honest limit: none of this is an absolute barrier — a well-funded incumbent *could* enter. Our edge is being deep, native, and 12–18 months ahead in the specific AI-governance crosswalk, plus a wedge (aquaculture) they have zero interest in.

### Q: Couldn't a big incumbent just acquire you instead of competing — and is that bad?
**A:** That's a realistic and *good* outcome, not a bad one. Our IP depth (the crosswalk + attestation) is exactly what a Vanta/Drata/OneTrust-class buyer would want to add credible "AI governance" — an acquisition bid would itself be the valuation comp (see `revenue/RAISE_PATH2_STRATEGIC/`). For an EIS angel, a trade sale is a clean exit. We're building to be either a standalone compliance business or an attractive acquisition; both paths run through the same next step — first real customers.

### Q: Why would anyone trust a tiny vendor's "compliance proof"?
**A:** Because the whole point is they **don't have to trust us** — that's the design. A HMAC-signed attestation is verifiable independently: the verifier checks the signature, not our word. That's the structural answer to "why trust a small vendor" — we built the product *specifically* so vendor size is irrelevant to the proof's validity. (It's also why the founder built the company: he's angry at trust-me compliance claims.) Honest caveat: market trust still has to be earned with real customers and, ideally, a recognised partner/standards-body association — which is on the roadmap.

---

## On product / technical risk

### Q: You said SOV3 is "down". What's actually broken, and does it matter for this raise?
**A:** SOV3 (our novel care-membrane agentic OS) is down on an **environment issue, not a design failure**: its Python venv is on 3.14, and `torch` has no 3.14 wheel, so it won't import. The fix is scoped (rebuild the venv on Python 3.11/3.12 — `_alignment/SOV3_FIX_2026-06-02.md`). It matters in one narrow way: we can't give a *live SOV3 demo* until it's fixed, so we don't promise one. It does **not** affect the revenue story — that runs on the MCPs + attestation API, which are live (verify: meok-attestation-api.vercel.app returns 200). We deliberately keep SOV3 out of the raise's core claims and label it R&D.

### Q: Is the "Asimov humanoid" / robotics work part of what I'm buying?
**A:** No. We're explicit about this because it's exactly where overclaiming would happen. The robotics work is early R&D (forks of open actuators with some deltas); the "Asimov V8 humanoid build" referenced in some internal notes **has no files on disk** and is, at most, a direction — **we do not put it in the deck as a product** (`_alignment/ALIGNMENT_2026-06-02.md` §3). This raise is the compliance IP + the aquaculture wedge. Robotics is a someday-maybe, not a line item.

---

## On the raise mechanics

### Q: Why a £1–2M cap with £0 revenue — isn't any number arbitrary?
**A:** At pre-revenue it's conviction-priced, and we've picked the *honest* end of the range. £1–2M is the realistic UK pre-seed band for an IP-rich, sole-founder company with live distribution and a deadline-driven wedge (per our own staircase doc, `revenue/IPO_VALUATION_PATH_2026-05-28.md`). We deliberately did **not** attach a big valuation to £0 revenue — doing that is the exact fake move this raise rejects. The cap reflects the founder + IP + wedge; real customers re-rate the next round.

### Q: Is this actually EIS-eligible, and what do I get?
**A:** The intent is yes — pursuing **SEIS first** where the early-stage limits allow, then EIS. UK angels can get **30% income-tax relief** plus CGT reliefs, **subject to HMRC Advance Assurance** (in progress) and your own circumstances. We present the rules, not a guarantee — your accountant confirms your relief. The Advance Assurance application and the SEIS/EIS eligibility note live in `DATA_ROOM/01_corporate` and `06_financials`.

### Q: What are the biggest risks to my money? (Just tell me straight.)
**A:** In order: (1) **No first customer** — the sales motion fails to convert the deadline into logos. (2) **Sole-founder/key-person risk** — the company depends on one person until the first hire. (3) **Incumbent entry** — a funded compliance player decides AI-governance crosswalks are worth building. (4) **Execution spread** — five verticals + deep IP from one person risks lack of focus (mitigant: the round forces focus on the aquaculture wedge + compliance core). We'd rather you see this list from us than discover it in diligence. Each maps to a milestone or use-of-funds line designed to retire it.

### Q: What's the one thing that would most increase my confidence before I commit?
**A:** The same thing that most increases ours: **one paying customer.** It converts the entire story from "GitHub estate with live rails" to "revenue business", and it's the month-3 milestone. If you want to de-risk further, structure the raise in tranches against that milestone — we'd welcome it, because we're confident the deadline-driven wedge converts, and tying your capital to proof is entirely in the spirit of how this company is built.

---

*Consistent with `revenue/RAISE_PATH3_ANGEL/SEED_DECK.md` and `DATA_ROOM/`. Every factual claim verifiable per those sources. Live endpoints + PyPI versions checked 2026-06-06.*
