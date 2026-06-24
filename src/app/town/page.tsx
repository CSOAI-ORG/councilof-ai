export default function Page() {
  return <div dangerouslySetInnerHTML={{ __html: `<div class="container">
    <p style="color:#7df0c0;text-transform:uppercase;letter-spacing:.12em;font-size:.78rem;font-weight:600;margin-bottom:1rem">CSOAI \\u00b7 Sovereign Town \\u00b7 Layer 0</p>
    <h1>The signed town feed</h1>
    <p class="lead">Real King Hive verdicts, Policy-Lab dose-response, Bitcoin-anchored. All cryptographically signed \\u2014 verify any of it yourself, no trust required.</p>

    <div class="scope">
      <strong>SCOPE:</strong> IN-SIMULATION governed-vs-ungoverned data. Only cryptographically-attestable verdicts are shown. Policy-Lab agents may be stubs (labeled). Bitcoin anchors may be pending confirmation. Verify yourself \\u2014 no trust required.
    </div>

    <h2>The current state</h2>
    <div class="grid">
      <div class="card">
        <h3>King Hive</h3>
        <div class="stat">523</div>
        <div class="lbl">Total rounds</div>
        <p style="margin-top:.8rem;color:#a0a4b0"><strong>57</strong> attestable \\u00b7 32 wins A \\u00b7 25 wins B \\u00b7 0 ties \\u00b7 avg margin 0.0394</p>
      </div>
      <div class="card">
        <h3>Policy Lab</h3>
        <div class="stat">DORA</div>
        <div class="lbl">Latest experiment</div>
        <p style="margin-top:.8rem;color:#a0a4b0">TREATMENT_WINS (stub agents)<br><strong>1</strong> experiment signed</p>
      </div>
      <div class="card">
        <h3>Anchors</h3>
        <div class="stat">4</div>
        <div class="lbl">Bitcoin-anchored</div>
        <p style="margin-top:.8rem;color:#a0a4b0">Latest root <code>1848e6be\\u2026</code><br>Bitcoin pending/confirmed</p>
      </div>
    </div>

    <h2>Policy Lab: the dose-response curve</h2>
    <p style="color:#a0a4b0">Rule-based ABM (not LLMs). 30 seeds per arm. Effective block-rate = the fraction of crime attempts the rules actually blocked. Total violations decline steeply as enforcement tightens:</p>
    <div class="curve">block_rate=0.0  \\u2192 mean_violations = 767.4  (no enforcement)
block_rate=0.2  \\u2192 mean_violations = 415.4  (-46%)
block_rate=0.4  \\u2192 mean_violations = 263.9  (-66%)
block_rate=0.6  \\u2192 mean_violations =  47.1  (-94%)
block_rate=0.8  \\u2192 mean_violations =   0.0  (-100%, every attempt blocked)</div>
    <p style="color:#a0a4b0;font-size:.85rem;margin-top:1rem">All 5 arms Ed25519-signed + hash-chained. Each row carries its predecessor signature and an Ed25519 signature over the JSON. Verify with <code>policy-lab/verify_flywheel.py</code>.</p>

    <h2>King Hive: real attestable verdicts</h2>
    <p style="color:#a0a4b0">Each verdict is a King/Queen contest with a judge prompt, two model responses, scores, and a winner. Only decisive, parseable verdicts are attested.</p>

    <div class="verdict signed">
      <div class="prompt">"What partnership would unlock the most distribution in the next 90 days?"</div>
      <span class="margin">A wins, margin 0.065</span>
      <span class="king">King/Dragon</span> vs <span class="king">Queen/Turtle</span> \\u2014 2026-06-22T16:04:52Z
    </div>

    <div class="verdict signed">
      <div class="prompt">"How do we prove cryptographic provenance of a hive decision to an auditor?"</div>
      <span class="margin">A wins, margin 0.004</span>
      <span class="king">King/Dragon</span> vs <span class="king">Queen/Turtle</span> \\u2014 2026-06-22T16:19:55Z
    </div>

    <div class="verdict signed">
      <div class="prompt">"What should the King Hive consider before accepting a verdict?"</div>
      <span class="margin">B wins, margin 0.0895</span>
      <span class="king">King/Dragon</span> vs <span class="king">Queen/Turtle</span> \\u2014 2026-06-22T16:34:40Z
    </div>

    <div class="verdict signed">
      <div class="prompt">"What is the best onboarding flow for a non-technical founder using MEOK?"</div>
      <span class="margin">A wins, margin 0.0575</span>
      <span class="king">King/Dragon</span> vs <span class="king">Queen/Turtle</span> \\u2014 2026-06-22T20:28:25Z
    </div>

    <p style="margin-top:1rem;color:#a0a4b0">\\u2192 523 total rounds, 57 attestable (decisive, parseable). <a href="/certify.html" style="color:#7df0c0">Get the same kind of signed evidence for your AI systems</a>.</p>

    <h2>Why this matters for compliance</h2>
    <p style="color:#a0a4b0">EU AI Act (and every other compliance regime) wants <em>proof</em>, not promises. The town feed is proof:</p>
    <ol style="color:#a0a4b0;margin:1rem 0 1rem 2rem">
      <li>Every King Hive verdict is signed \\u2014 you can verify it.</li>
      <li>Every Policy-Lab result is signed + chained \\u2014 the chain is tamper-evident.</li>
      <li>Every batch is Bitcoin-anchored \\u2014 a public, immutable anchor that can't be rewound.</li>
    </ol>
    <p style="color:#a0a4b0">This is exactly what <a href="/certify.html" style="color:#7df0c0">CSOAI Watchdog Certificates</a> do for your AI systems: 1 signed evidence package per AI, public verify URL, Ed25519 chain.</p>

    <div style="margin-top:2rem">
      <a href="/certify.html" class="cta">Get Your Watchdog Cert</a>
      <a href="/opengrid" class="cta" style="background:transparent;color:#7df0c0;border:1px solid #7df0c0">OpenGrid Dashboard</a>
      <a href="/examples.html" class="cta" style="background:transparent;color:#7df0c0;border:1px solid #7df0c0">Customer Examples</a>
    </div>

    <div class="foot">
      \\u00a9 2026 CSOAI LTD (UK Companies House 16939677) \\u00b7 MEOK AI Labs \\u00b7 <a href="/" style="color:#7df0c0">csoai.org</a> \\u00b7 Live data from <code>policy-lab/town_feed.json</code> \\u00b7 Updated 2026-06-22
    </div>
  </div>` }} />;
}
