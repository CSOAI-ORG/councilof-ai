export default function Page() {
  return <div dangerouslySetInnerHTML={{ __html: `<div class="container">
    <p style="color:#c9a84c;text-transform:uppercase;letter-spacing:.12em;font-size:.78rem;font-weight:600;margin-bottom:1rem">CSOAI · Coverage Atlas</p>
    <h1>32 verticals · 155+ organisations</h1>
    <p class="lead">Every vertical CSOAI covers, every prospect queued, every keystone cert pre-issued. One Watchdog Certificate per AI system, valid across every framework.</p>

    <div class="stat-row">
      <div class="stat"><div class="num">32</div><div class="lbl">Verticals</div></div>
      <div class="stat"><div class="num">155+</div><div class="lbl">Organisations</div></div>
      <div class="stat"><div class="num">336</div><div class="lbl">Prospects queued</div></div>
      <div class="stat"><div class="num">30</div><div class="lbl">Keystones issued</div></div>
      <div class="stat"><div class="num">8</div><div class="lbl">Pricing tiers</div></div>
      <div class="stat"><div class="num">13</div><div class="lbl">Compliance sectors</div></div>
    </div>

    <h2>The 32 verticals</h2>
    <div class="verticals">
      <div class="v"><h3>Central banks</h3><div class="count">12 orgs</div><div class="orgs">Fed, ECB, BoE, BoJ, PBoC, RBI, BoC, SNB, RBA, BoK, BoC-Canada, Riksbank</div></div>
      <div class="v"><h3>EU regulators</h3><div class="count">6 orgs</div><div class="orgs">EBA, ESMA, EIOPA, ECB-SSM, EDPS, EDPB</div></div>
      <div class="v"><h3>Asset managers</h3><div class="count">8 orgs</div><div class="orgs">BlackRock, Vanguard, State Street, Fidelity, PIMCO, Goldman AM, JPM AM, Bridgewater</div></div>
      <div class="v"><h3>Global custodians</h3><div class="count">5 orgs</div><div class="orgs">BNY Mellon, State Street, Citi, HSBC, Standard Chartered</div></div>
      <div class="v"><h3>Insurance (major)</h3><div class="count">8 orgs</div><div class="orgs">Lloyd's, Allianz, AXA, Zurich, Chubb, Travelers, AIG, Munich Re</div></div>
      <div class="v"><h3>Insurance (specialty)</h3><div class="count">5 orgs</div><div class="orgs">Hiscox, Beazley, Aon, Marsh, Guy Carpenter, WTW</div></div>
      <div class="v"><h3>Insurance (cyber)</h3><div class="count">2 orgs</div><div class="orgs">Coalition, At-Bay</div></div>
      <div class="v"><h3>Big Tech</h3><div class="count">5 orgs</div><div class="orgs">Google, Microsoft, Apple, Meta, Amazon</div></div>
      <div class="v"><h3>Hyperscalers</h3><div class="count">5 orgs</div><div class="orgs">AWS, Azure, GCP, Oracle, IBM</div></div>
      <div class="v"><h3>Telecom</h3><div class="count">5 orgs</div><div class="orgs">BT, Vodafone, Orange, Deutsche Telekom, NTT</div></div>
      <div class="v"><h3>Big Pharma</h3><div class="count">5 orgs</div><div class="orgs">Pfizer, Roche, Novartis, Merck, GSK</div></div>
      <div class="v"><h3>Medtech</h3><div class="count">3 orgs</div><div class="orgs">Stryker, Medtronic, Boston Scientific</div></div>
      <div class="v"><h3>Manufacturing</h3><div class="count">2 orgs</div><div class="orgs">GE, 3M</div></div>
      <div class="v"><h3>Aerospace</h3><div class="count">2 orgs</div><div class="orgs">Boeing, Airbus</div></div>
      <div class="v"><h3>Defense</h3><div class="count">2 orgs</div><div class="orgs">Lockheed Martin, Raytheon (RTX)</div></div>
      <div class="v"><h3>Frontier AI</h3><div class="count">1 org</div><div class="orgs">OpenAI</div></div>
      <div class="v"><h3>Retail / e-commerce</h3><div class="count">2 orgs</div><div class="orgs">Walmart, Amazon retail</div></div>
      <div class="v"><h3>Transportation</h3><div class="count">3 orgs</div><div class="orgs">Maersk, DHL, FedEx</div></div>
      <div class="v"><h3>Logistics & mobility</h3><div class="count">2 orgs</div><div class="orgs">Uber, Lyft</div></div>
      <div class="v"><h3>US government</h3><div class="count">2 orgs</div><div class="orgs">USPS, IRS</div></div>
      <div class="v"><h3>National cyber agencies</h3><div class="count">5 orgs</div><div class="orgs">NCSC UK, BSI DE, ANSSI FR, ENISA EU, CERT-In IN</div></div>
      <div class="v"><h3>Energy</h3><div class="count">3 orgs</div><div class="orgs">BP, Shell, ExxonMobil</div></div>
      <div class="v"><h3>Education</h3><div class="count">3 orgs</div><div class="orgs">Pearson, Coursera, Khan Academy</div></div>
      <div class="v"><h3>Travel</h3><div class="count">3 orgs</div><div class="orgs">Booking.com, Airbnb, Expedia</div></div>
      <div class="v"><h3>Cybersecurity vendors</h3><div class="count">5 orgs</div><div class="orgs">CrowdStrike, Palo Alto, Fortinet, SentinelOne, Wiz</div></div>
      <div class="v"><h3>Consulting (Big 4)</h3><div class="count">5 orgs</div><div class="orgs">Deloitte, PwC, KPMG, EY, Baringa</div></div>
      <div class="v"><h3>Regulators (UK)</h3><div class="count">5 orgs</div><div class="orgs">FCA, ICO, PRA, NHS Digital, Cabinet Office</div></div>
      <div class="v"><h3>Insurance re-brokers</h3><div class="count">5 orgs</div><div class="orgs">Aon, Marsh, Guy Carpenter, WTW, Beazley</div></div>
      <div class="v"><h3>Saudi/MENA</h3><div class="count">3 orgs</div><div class="orgs">Saudi Aramco, ADNOC, Qatar Investment Authority</div></div>
      <div class="v"><h3>APAC</h3><div class="count">2 orgs</div><div class="orgs">SoftBank, Tata</div></div>
      <div class="v"><h3>BRICS+</h3><div class="count">5 orgs</div><div class="orgs">Yandex, Sberbank, Tencent, ByteDance, Reliance</div></div>
      <div class="v"><h3>UK regulators</h3><div class="count">5 orgs</div><div class="orgs">FCA, ICO, PRA, NHS Digital, Cabinet Office</div></div>
      <div class="v"><h3>Cybersecurity vendors (mid)</h3><div class="count">2 orgs</div><div class="orgs">Sophos, Trend Micro</div></div>
      <div class="v"><h3>Professional services</h3><div class="count">10 orgs</div><div class="orgs">McKinsey, BCG, Bain, Oliver Wyman, Roland Berger, LEK, Kearney, EY-Parthenon, FTI Consulting, Alvarez & Marsal</div></div>
    </div>

    <p style="color:#5a5e66;font-size:.9rem;margin-top:1rem"><em>Every prospect has a free keystone cert pre-issued at <code>csoai.org/verify/{cert-id}</code>. One Watchdog Certificate per AI system, valid across every framework.</em></p>

    <div class="cta-row">
      <a href="/certify" class="cta">Get Your Watchdog Cert</a>
      <a href="/opengrid" class="cta cta-secondary">OpenGrid Dashboard</a>
      <a href="/town" class="cta cta-secondary">Sovereign Town (Live)</a>
      <a href="/examples" class="cta cta-secondary">Customer Examples</a>
    </div>

    <div class="foot">
      © 2026 CSOAI LTD (UK Companies House 16939677) · MEOK AI Labs · <a href="/">csoai.org</a> · Updated 2026-06-23 · <a href="/matrix">Compliance matrix</a> · <a href="/glossary">Glossary</a> · <a href="/regulators">Regulators</a>
    </div>
  </div>` }} />;
}
