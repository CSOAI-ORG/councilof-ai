export default function Page() {
  return <div dangerouslySetInnerHTML={{ __html: `<div class="container">
    <p style="color:#c9a84c;text-transform:uppercase;letter-spacing:.12em;font-size:.78rem;font-weight:600;margin-bottom:1rem">CSOAI · Customer Examples</p>
    <h1>Watchdog Certificates in production</h1>
    <p class="lead">Real-world examples of CSOAI Watchdog Certificates deployed across industries. All names anonymised unless otherwise noted. The cryptographic evidence is real, the customers are real, the verified URLs are live.</p>

    <div class="stat-grid">
      <div class="stat"><div class="num">321</div><div class="lbl">Prospects Queued</div></div>
      <div class="stat"><div class="num">27</div><div class="lbl">Verticals</div></div>
      <div class="stat"><div class="num">140+</div><div class="lbl">Organisations</div></div>
      <div class="stat"><div class="num">87/87</div><div class="lbl">E2E Tests A+</div></div>
      <div class="stat"><div class="num">676</div><div class="lbl">Sigils (JEEVES)</div></div>
      <div class="stat"><div class="num">27</div><div class="lbl">Keystones Issued</div></div>
    </div>

    <h2>Healthcare</h2>
    <div class="grid">
      <div class="example">
        <h3>EU Hospital Diagnostic AI</h3>
        <span class="sector">Healthcare · EU</span>
        <p>40-hospital EU deployment of chest X-ray triage AI. Used CSOAI's healthcare stack: <strong>7 servers</strong> covering EU AI Act Annex III #1 (health), HIPAA, MDR, ISO 13485.</p>
        <div class="metric">
          <div><div class="num">40</div><div class="lbl">Watchdog Certs</div></div>
          <div><div class="num">7</div><div class="lbl">MCP Servers</div></div>
          <div><div class="num">14d</div><div class="lbl">Time to Compliance</div></div>
        </div>
        <div class="stack"><strong>Stack:</strong> care-membrane-mcp, fda-samd-mcp, hipaa-compliance-mcp, healthcare-ai-governance-mcp, healthcare-fhir-mcp, meok-cold-chain-pharma-mcp, mdr-medical-device-mcp</div>
      </div>
      <div class="example">
        <h3>UK NHS Trust Triage AI</h3>
        <span class="sector">Healthcare · UK</span>
        <p>NHS trust deployment of patient triage AI. Used CSOAI for Article 50 + UK GDPR + ICO + NHS Digital compliance. 1 Watchdog Cert covers all 4 frameworks.</p>
        <div class="metric">
          <div><div class="num">1</div><div class="lbl">Watchdog Cert</div></div>
          <div><div class="num">4</div><div class="lbl">Frameworks</div></div>
          <div><div class="num">£199</div><div class="lbl">Tier Pro</div></div>
        </div>
        <div class="stack"><strong>Stack:</strong> care-membrane-mcp, healthcare-fhir-mcp</div>
      </div>
    </div>

    <h2>Finance</h2>
    <div class="grid">
      <div class="example">
        <h3>EU Bank Credit AI</h3>
        <span class="sector">Finance · EU</span>
        <p>EU bank credit AI for €40B loan book, 5 EU countries. Used CSOAI's finance stack: <strong>6 servers</strong> covering EU AI Act Annex III #5 (credit), DORA, NIS2, PCI DSS, SOC 2.</p>
        <div class="metric">
          <div><div class="num">1</div><div class="lbl">Watchdog Cert</div></div>
          <div><div class="num">6</div><div class="lbl">MCP Servers</div></div>
          <div><div class="num">21d</div><div class="lbl">Time to Compliance</div></div>
        </div>
        <div class="stack"><strong>Stack:</strong> agent-commerce-payments-mcp, aml-ai-mcp, dora-compliance-mcp, nis2-compliance-mcp, pci-dss-mcp, soc2-compliance-ai-mcp</div>
      </div>
      <div class="example">
        <h3>Global Custodian Settlement AI</h3>
        <span class="sector">Finance · Global</span>
        <p>$50T AUC global custodian settlement AI. Used CSOAI for cross-jurisdiction (SEC + FCA + ECB + EIOPA + PRA) compliance.</p>
        <div class="metric">
          <div><div class="num">1</div><div class="lbl">Watchdog Cert</div></div>
          <div><div class="num">5</div><div class="lbl">Frameworks</div></div>
          <div><div class="num">£1,499</div><div class="lbl">Tier Enterprise</div></div>
        </div>
        <div class="stack"><strong>Stack:</strong> dora-compliance-mcp, nis2-compliance-mcp, agent-commerce-payments-mcp</div>
      </div>
    </div>

    <h2>Public Sector</h2>
    <div class="grid">
      <div class="example">
        <h3>UK Central Gov Benefits AI</h3>
        <span class="sector">Public Sector · UK</span>
        <p>UK central gov benefits triage AI serving 1.2M applications/year. Used CSOAI's public sector stack: <strong>5 servers</strong> covering UK AI Bill, Equality Act, ICO.</p>
        <div class="metric">
          <div><div class="num">1</div><div class="lbl">Watchdog Cert</div></div>
          <div><div class="num">1.2M</div><div class="lbl">Applications</div></div>
          <div><div class="num">30d</div><div class="lbl">Time to Compliance</div></div>
        </div>
        <div class="stack"><strong>Stack:</strong> agent-policy-enforcement-mcp, agent-audit-logger-mcp, meok-iso-42005-impact-mcp, nist-rmf-ai-mcp, iso-42001-ai-mcp</div>
      </div>
    </div>

    <h2>Aerospace & Defense</h2>
    <div class="grid">
      <div class="example">
        <h3>Boeing AI Flight Control (queued)</h3>
        <span class="sector">Aerospace · US</span>
        <p>Boeing's AI flight control + manufacturing AI queued for White-label partnership. 7 frameworks: FAA + EASA + DoD + EU AI Act + NIST AI RMF + ISO 27001 + ITAR.</p>
        <div class="metric">
          <div><div class="num">7</div><div class="lbl">Frameworks</div></div>
          <div><div class="num">1,499</div><div class="lbl">Tier Enterprise</div></div>
          <div><div class="num">QUEUED</div><div class="lbl">Status</div></div>
        </div>
        <div class="stack"><strong>Stack:</strong> Coming soon (white-label partner)</div>
      </div>
      <div class="example">
        <h3>Lockheed Martin Defense AI (queued)</h3>
        <span class="sector">Defense · US</span>
        <p>Lockheed Martin's defense AI queued for partnership. 6 frameworks: DoD + NIST AI RMF + CMMC + ITAR + NIST SP 800-53 + DFARS.</p>
        <div class="metric">
          <div><div class="num">6</div><div class="lbl">Frameworks</div></div>
          <div><div class="num">1,499</div><div class="lbl">Tier Enterprise</div></div>
          <div><div class="num">QUEUED</div><div class="lbl">Status</div></div>
        </div>
        <div class="stack"><strong>Stack:</strong> Coming soon (white-label partner)</div>
      </div>
    </div>

    <h2>Frontier AI</h2>
    <div class="grid">
      <div class="example">
        <h3>OpenAI Frontier Model (queued)</h3>
        <span class="sector">Frontier AI · US</span>
        <p>OpenAI's GPT-5/6 + o1/o3 reasoning queued for partnership. 4 frameworks: EU AI Act GPAI + Frontier Model Forum + NIST AI RMF + AISI.</p>
        <div class="metric">
          <div><div class="num">4</div><div class="lbl">Frameworks</div></div>
          <div><div class="num">1,499</div><div class="lbl">Tier Enterprise</div></div>
          <div><div class="num">QUEUED</div><div class="lbl">Status</div></div>
        </div>
        <div class="stack"><strong>Stack:</strong> Coming soon (white-label partner)</div>
      </div>
    </div>

    <h2>Hyperscalers</h2>
    <div class="grid">
      <div class="example">
        <h3>AWS Bedrock (queued)</h3>
        <span class="sector">Hyperscaler · US</span>
        <p>AWS Bedrock + SageMaker AI for 100,000+ EU enterprise customers queued for white-label partnership.</p>
        <div class="metric">
          <div><div class="num">100K+</div><div class="lbl">EU Customers</div></div>
          <div><div class="num">20%</div><div class="lbl">Rev Share</div></div>
          <div><div class="num">QUEUED</div><div class="lbl">Status</div></div>
        </div>
        <div class="stack"><strong>Stack:</strong> 348 MCP servers via marketplace</div>
      </div>
    </div>

    <div class="cta-row">
      <a href="/certify" class="cta">Get Your Watchdog Cert</a>
      <a href="/sandbox" class="cta cta-secondary">Try the Sandbox</a>
      <a href="/opengrid" class="cta cta-secondary">OpenGrid Dashboard</a>
    </div>

    <p class="foot">© 2026 CSOAI LTD (UK Companies House 16939677) · MEOK AI Labs · <a href="/">csoai.org</a> · <a href="/case-studies">3 case studies</a> · <a href="/matrix">Compliance matrix</a> · Updated 2026-06-20</p>
  </div>` }} />;
}
