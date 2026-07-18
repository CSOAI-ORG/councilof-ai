#!/usr/bin/env python3
"""PHASE 285-MEGA: Sovereign Training & Certification Empire — bundled generator.
Run: python3 .scripts/run_training_gen.py
Produces 124 HTML files (31 industries × 4 files each + 3 hubs already on disk).
Idempotent: skips files that already exist unless FORCE=1.
"""
import os, sys, textwrap
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd/csoai.org")
TRAINING = ROOT / "training"

INDUSTRIES = [
    # (slug, title, emoji, regulator, crown_year, mission, examples[6], ue5_scene)
    ("ai-governance","Sovereign AI Governance","🜏","EU AI Act + UK ICO + ISO 42001 + NIST RMF",
     "1795","synchronising the algorithmic lever of the modern Crown with the prophetic weight of the laws of sovereign Britain",
     ["EU AI Act Article 50 walk-through","UK ICO AI audit framework UE5 scenario","ISO 42001 AI management system course","BFT 12-around-1 council deliberation in the Westminister council chamber","SIGIL chain verification demo on the SIGIL ledger","DORADO 1-click sovereignty switch from WEST to EAST in the Cabinet Office briefing room"],
     "the Cabinet Office briefing room with its central oak table, BFT 12 council chairs laid out in 12-around-1 formation, SIGIL chain hologram floating above, DORADO switch panel glowing on east wall, Article 50 watermarking console on west wall"),
    ("cybersecurity","Sovereign Cybersecurity","🛡️","NCSC + Cyber Essentials + ISO 27001 + NIS2",
     "1834","fortifying the digital bulwarks of the Crown with NCSC-grade sovereign AI, free for every defender",
     ["NCSC Cyber Essentials walk-through in the SOC tier-1 floor","NCSC CAF (Cyber Assessment Framework) audit scenario","NIST NICE framework role mapping","STRIDE threat modelling in the SOC war room","MITRE ATT&CK detection mapping in the detection lab","CVE-2024 disclosure response in the incident bridge"],
     "the NCSC SOC tier-1 floor with 24 curved displays, 12 BFT council seats on a raised dais, live CVE feed on the central glass wall, MITRE ATT&CK heatmap glowing blue"),
    ("defence","Sovereign Defence","⚔️","JSP 936 + JSP 440 + NATO STANAG + ISO 27001",
     "1688","arming the modern Crown with sovereign AI that meets JSP 936, free for every allied force",
     ["JSP 936 AI assurance walk-through on Salisbury Plain","NATO STANAG 4774 (AI attribute confidence) course","JSP 440 information assurance scenario","PX4 swarm flight operation in the Salisbury drone training area","CoT (Cursor-on-Target) message flow in the TAK operations hub","12-around-1 BFT council in the Cabinet War Room"],
     "the Cabinet War Rooms under Whitehall with BFT 12 council at the central table, AKER tactical map overlay on east wall, live CoT message stream scrolling on west wall"),
    ("banking","Sovereign Banking","🏦","FCA + PRA + DORA + Basel III + PSD2",
     "1694","witnessing the Crown's banking charter meet the algorithmic age, with FCA + DORA-grade sovereign AI, free for every banker",
     ["Monzo-style BFT 12-around-1 council deliberation under FCA Article 50","HSBC composite audit under DORA digital operational resilience","Lloyds Care Floor scenario in the Halifax branch","Nationwide DORADO 1-click sovereignty switch exercise","Barclays sovereign stress test under PRA SS9/17","Santander PSD2 SCA walk-through"],
     "a 1694 Threadneedle-Street vault-tunnel rebuilt in UE5 with BFT council chamber on one level, FCA regulator office adjacent, retail bank lobby with customer queue, DORA resilience war-room above"),
    ("healthcare","Sovereign Healthcare","🏥","NHS + CQC + MHRA + WHO ICOPE + HIPAA",
     "1875","healing the Crown with sovereign AI that meets CQC Fundamental Standards, free for every clinician",
     ["Cera-style home-care scenario in the patient's living-room","NHS Article 50 passport for medical AI","CQC Fundamental Standards walk-through in the ward","WHO ICOPE elder care scenario in a Cotswold cottage","Patient i-character consent demonstration in the consultation room","Care Floor UE5 ward simulation in the NHS Royal London ward"],
     "an NHS ward tier simulation rebuilt in UE5 with patient bays, BFT 12 council chamber at end-of-ward, CQC inspector office, ICOPE assessment lounge, i-character consent interface on bedside tablets"),
    ("pharmacy","Sovereign Pharmacy","⚕️","GPhC + MHRA + Falsified Medicines Directive + DSCSA",
     "1815","dispensing sovereign AI from the Crown's apothecary charter, with GPhC-grade compliance, free for every pharmacist",
     ["GPhC standards walk-through in the Boots pharmacy dispensary","MHRA Yellow Card adverse-event reporting scenario","Falsified Medicines Directive (FMD) verification walk-through","CD (Controlled Drug) register reconciliation in the controlled-drug cabinet","Patient MARS check","DSCSA (US) traceability scenario at the wholesaler"],
     "a Boots apothecary rebuilt in UE5: dispensing counter with patient queue, controlled-drug cabinet with biometric lock, BFT 12 council chamber at back"),
    ("opticians","Sovereign Opticians","👁️","GOC + NHS Domiciliary + CQC + WHO ICOPE",
     "1696","restoring the Crown's sight with sovereign AI that meets GOC standards, free for every optometrist",
     ["GOC standards walk-through in the Specsavers consulting room","NHS Domiciliary eye-test scenario in the patient's living-room","Low-vision assessment walk-through","Paediatric assessment scenario in the children's section","WHO ICOPE vision pair scenario","Patient i-character consent for eye-drops during IOP check"],
     "a Specsavers rebuilt in UE5: consulting room with phoropter, dispensing area with frame display, children's corner, domiciliary home-visit scene"),
    ("home-care","Sovereign Home Care","🏡","CQC + Skills for Care + UK Care Certificate + NICE NG86",
     "1948","caring for the Crown's elders with sovereign AI meeting CQC Fundamental Standards, free for every carer",
     ["Cera-style home-care morning call (washing, dressing, medication)","UK Care Certificate walk-through in the learner's bedroom","NICE NG86 falls-prevention scenario at the patient's bathroom","Skills for Care 'Care after stroke' scenario","Domiciliary eye-test scenario with the visiting optometrist","Patient i-character consent for personal-care intervention"],
     "a Cotswold cottage rebuilt in UE5: patient bedroom, bathroom with grab-rails, kitchen for medication preparation, BFT 12 council chamber at the back garden"),
    ("education","Sovereign Education","🎓","Ofsted + DfE + GDPR-in-schools + UK SEND Code",
     "1870","instructing the Crown's children with sovereign AI meeting Ofsted frameworks, free for every teacher",
     ["Ofsted deep-dive walk-through in the Year-4 classroom","DfE RSHE (Relationships, Sex, Health Education) delivery scenario","UK SEND Code of Practice EHCP scenario","GDPR-in-schools parental consent scenario","i-character consent for a 7-year-old's reading assessment","Care Floor walk-through in the school counsellor office"],
     "a Victorian primary rebuilt in UE5: Year-4 classroom with 30 pupils, school hall for assembly, BFT 12 council chamber at back"),
    ("social-care","Sovereign Social Care","🤝","CQC + Care Act 2014 + Skills for Care + NICE NG86",
     "1948","carrying the Crown's vulnerable adults with sovereign AI meeting the Care Act, free for every social worker",
     ["Care Act 2014 needs-assessment walk-through in the service-user's flat","CQC Fundamental Standards walk-through in a Learning-Disability supported-living house","Mental Capacity Act (MCA) best-interest decision scenario","Safeguarding Adult Review (SAR) walk-through","Section 42 enquiry scenario","Personal-budget direct-payment scenario in the council office"],
     "a Care-Act 2014 office rebuilt in UE5: service-user's living-room, BFT 12 council chamber, MCA best-interest meeting room"),
    ("insurance","Sovereign Insurance","🛟️","FCA + PRA + Lloyd's + Solvency II + IDD",
     "1680","insuring the Crown's ventures with sovereign AI meeting Solvency II and Lloyd's market standards",
     ["Lloyd's market slip subscription scenario","Solvency II ORSA walk-through","FCA IDD suitability scenario","Claims triage scenario in the FNOL centre","Reinsurance treaty scenario in the LMX pit","Catastrophe (CAT) bond scenario at the modelling desk"],
     "the Lloyd's underwriting room rebuilt in UE5 with the 300-year-old Lutine Bell, BFT 12 council chamber"),
    ("legal","Sovereign Legal","⚖️","SRA + BSB + Law Society + Bar Council + GDPR",
     "1461","pleading the Crown's causes with sovereign AI meeting SRA + Bar Council standards",
     ["SRA Code of Conduct walk-through in the chambers","Bar Council standards scenario in court 4 of the Royal Courts of Justice","GDPR + Legal Professional Privilege scenario","Money-laundering (MLR 2017) client due-diligence scenario","Crown Prosecution Service disclosure scenario","i-character consent for AI-assisted document review"],
     "the Royal Courts of Justice rebuilt in UE5: court 4 with its 1.5-tonne leather book, BFT 12 council chamber"),
    ("finance","Sovereign Finance","💷","FCA + PRA + MiFID II + EMIR + MAR",
     "1694","treasuring the Crown's reserves with sovereign AI meeting MiFID II and MAR",
     ["MiFID II transaction reporting walk-through","MAR suspicious-transaction-report scenario","EMIR trade-repository walk-through","PRA capital-requirements scenario","FX rate-fix scandal walk-through","i-character consent for AI-assisted portfolio rebalancing"],
     "a City of London trading floor rebuilt in UE5: dealing room with 24 traders, BFT 12 council chamber at back"),
    ("accounting","Sovereign Accounting","📊","FRC + ICAEW + ACCA + CIMA + IFRS + ISA",
     "1854","balancing the Crown's books with sovereign AI meeting FRC + ICAEW standards",
     ["IFRS 17 insurance contract walk-through","ISA walk-through","ICAEW ethics scenario","FRC Corporate Governance Code scenario","i-character consent for AI-assisted journal entry proposal","FRC audit-firm inspection scenario"],
     "a Big-4 audit room rebuilt in UE5: audit floor with 30 teams, BFT 12 council chamber at back"),
    ("real-estate","Sovereign Real Estate","🏘️","RICS + FCA + AML + The Property Ombudsman + GDPR",
     "1666","valuing the Crown's estates with sovereign AI meeting RICS Red Book standards",
     ["RICS Red Book walk-through","AML client due-diligence scenario","Property Ombudsman complaint-handling scenario","Conveyancing scenario in the solicitor's office","Leasehold Reform Act 2024 scenario","i-character consent for AI-assisted rental offer"],
     "a 1666 Threadneedle-Street surveyor rebuilt in UE5: valuation office, BFT 12 council chamber"),
    ("hospitality","Sovereign Hospitality","🍽️","FSA + VisitEngland + AA + Michelin + GDPR",
     "1666","welcoming the Crown's guests with sovereign AI meeting FSA + AA + VisitEngland",
     ["FSA hygiene walk-through in the 5-star kitchen","AA quality assessment scenario","VisitEngland star-rating scenario","Michelin star inspection scenario","Allergen mislabelling crisis scenario","i-character consent for AI-assisted room-service concierge"],
     "a 5-star Mayfair hotel rebuilt in UE5: dining room, kitchen brigade, BFT 12 council chamber"),
    ("manufacturing","Sovereign Manufacturing","🏭","HSE + HSE PUWER + ISO 9001 + ISO 14001 + Made in Britain",
     "1760","fabricating the Crown's wares with sovereign AI meeting HSE PUWER + ISO 9001",
     ["HSE PUWER walk-through","ISO 9001 quality-management scenario","ISO 14001 environmental-management scenario","LOTO safety scenario","Predictive-maintenance AI scenario","i-character consent for AI-assisted factory-floor scheduling"],
     "a Rolls-Royce Derby factory floor rebuilt in UE5: machine hall with 24 CNC mills, BFT 12 council chamber at mezzanine"),
    ("transport","Sovereign Transport","🚂","DVLA + DVSA + ORR + CAA + IMO + HS2",
     "1830","conveying the Crown's citizens with sovereign AI meeting DVSA + ORR + CAA",
     ["DVSA walk-through for PCV/PCO operators","ORR Rule Book walk-through","CAA Part-NCC scenario","HS2 compliance walk-through","DVLA driving-test scenario","i-character consent for AI-assisted timetable optimisation"],
     "a Victorian-era Birmingham New Street rebuilt in UE5: 1830 rail-shed with 12-platform trainshed roof"),
    ("logistics","Sovereign Logistics","📦","HMRC + Border Force + AEO + CMR Convention + UKCA",
     "1660","hauling the Crown's cargo with sovereign AI meeting HMRC + AEO standards",
     ["HMRC CDS walk-through","AEO compliance scenario","Border Force customs-declaration walk-through","CMR Convention consignment-note scenario","UKCA marking scenario","i-character consent for AI-assisted container-routing"],
     "the Port of Felixstowe rebuilt in UE5: 24 quay cranes, BFT 12 council chamber at port-control tower"),
    ("agriculture","Sovereign Agriculture","🌾","DEFRA + RPA + Red Tractor + UK Agricultural Act + UKCA",
     "1795","tilling the Crown's fields with sovereign AI meeting DEFRA + RPA",
     ["DEFRA walk-through","Red Tractor assurance scenario","RPA subsidy-claim walk-through","UK Agricultural Act 2020 scenario","Country Land and Business Association (CLA) succession scenario","i-character consent for AI-assisted crop-yield forecast"],
     "a Norfolk broads farm rebuilt in UE5: 1000-acre barley field, BFT 12 council chamber at the farm's barn"),
    ("media","Sovereign Media","📡","Ofcom + BBC Royal Charter + ICO GDPR + ASA + Defamation Act",
     "1666","broadcasting the Crown's truth with sovereign AI meeting Ofcom + ASA",
     ["Ofcom Broadcasting Code walk-through","ICO GDPR scenario in the news library","ASA walk-through","Defamation Act 2013 scenario","BBC Royal Charter impartiality scenario","i-character consent for AI-assisted headline generation"],
     "the BBC Broadcasting House rebuilt in UE5: newsroom floor with 50 desks, BFT 12 council chamber at editor-in-chief's office"),
    ("entertainment","Sovereign Entertainment","🎭","BBFC + UK Theatre Council + Equity + GDPR + Council of Europe",
     "1576","entertaining the Crown's masses with sovereign AI meeting BBFC + Council of Europe",
     ["BBFC classification walk-through","UK Theatre Council licensing scenario","Equity AI-clone consent scenario","Council of Europe Convention on AI scenario","i-character consent for AI-assisted script-editing","Care Floor walk-through in the green-room"],
     "a West End theatre rebuilt in UE5: Gielgud Theatre with 1500 seats, BFT 12 council chamber in the green-room wing"),
    ("gaming","Sovereign Gaming","🎮","PEGI + UK Gambling Commission + ICO Age-Appropriate + GDPR",
     "1694","gaming the Crown's leisure with sovereign AI meeting PEGI + UK Gambling Commission",
     ["PEGI age-rating walk-through","UK Gambling Commission LCCP scenario","ICO Age-Appropriate Design Code walk-through","Loot-box gambling classification scenario","Care Floor walk-through in the in-game tribunal","i-character consent for AI-driven NPC dialogue"],
     "a Rockstar Games North rebuilt in UE5: AAA studio floor with 200 desks, BFT 12 council chamber"),
    ("space","Sovereign Space","🚀","UK Space Agency + CAA Space + Outer Space Treaty + ISO 24113 + Artemis Accords",
     "1969","reaching the Crown's heavens with sovereign AI meeting the Outer Space Treaty and Artemis Accords",
     ["UK Space Agency operator-licence walk-through","CAA Outer Space Treaty Article VI scenario","ISO 24113 space-debris mitigation scenario","Artemis Accords safety-zone scenario","i-character consent for AI-assisted orbital-debris capture","Care Floor walk-through at the orbital council"],
     "a UK Space Agency rebuilt in UE5: Goonhilly Downs tracking station with 30m dish, BFT 12 council chamber"),
    ("aerospace","Sovereign Aerospace","✈️","CAA + EASA + FAA + AS9100 + DO-178C + DAOS 1800",
     "1783","sovereign aviation for the Crown with sovereign AI meeting CAA + EASA + DO-178C",
     ["CAA Part-21 walk-through","EASA certification scenario","FAA Part-25 scenario","AS9100 aerospace-quality scenario","DO-178C software-level walk-through","i-character consent for AI-assisted flight-control decision"],
     "a Hampshire-Farnborough aerospace rebuilt in UE5: hangar with assembled wing, BFT 12 council chamber"),
    ("quantum","Sovereign Quantum","⚛️","NCSC PQC + NIST PQC + FIPS 203/204/205 + ISO/IEC 23837 + UK Quantum Strategy",
     "2019","quantising the Crown's cipher with sovereign AI meeting NIST PQC",
     ["NCSC PQC migration walk-through","NIST PQC ML-DSA-65 (Dilithium) signature scenario","NIST PQC ML-KEM-768 (Kyber) KEM scenario","FIPS 203 module-lattice scenario","UK Quantum Strategy 2033 scenario","i-character consent for AI-assisted Shor-attack surfacing"],
     "the Harwell Quantum Computing Centre rebuilt in UE5: dilution refrigerator, BFT 12 council chamber"),
    ("robotics","Sovereign Robotics","🤖","BS 8611 + ISO 13482 + ISO/TS 15066 + UK HSE PUWER + IAS",
     "1818","automating the Crown's toil with sovereign AI meeting BS 8611 + ISO/TS 15066",
     ["BS 8611 (ethical guidance for robots) walk-through","ISO 13482 (personal-care robots) scenario","ISO/TS 15066 (collaborative robots) safety scenario","HSE PUWER robotics scenario","i-character consent for AI-assisted cobot-decision","Care Floor walk-through in the cobot tribunal"],
     "a Bristol Robotics Laboratory rebuilt in UE5: cobot-cell with UR-5 arm, BFT 12 council chamber"),
    ("biotech","Sovereign Biotech","🧬","MHRA + GMO + HFEA + ACRE + Nagoya Protocol + UKCA",
     "1953","engineering the Crown's life with sovereign AI meeting MHRA + HFEA + ACRE",
     ["MHRA walk-through","GMO ACRE scenario","HFEA walk-through","Nagoya Protocol benefit-sharing scenario","i-character consent for AI-assisted CRISPR edit","Care Floor walk-through in the lab's ethics tribunal"],
     "a Cambridge-Wellcome Genome Campus rebuilt in UE5: BSL-3 lab, BFT 12 council chamber at the ethics tribunal"),
    ("climate","Sovereign Climate","🌍","CCC + DESNZ + UK Climate Change Act 2008 + Paris Agreement + TCFD",
     "2008","decarbonising the Crown's air with sovereign AI meeting the UK Climate Change Act 2008",
     ["CCC walk-through","DESNZ pathway-to-2035 scenario","UK Climate Change Act 2008 scenario","TCFD reporting scenario","Paris Agreement NDC walk-through","i-character consent for AI-assisted carbon-budget enforcement"],
     "the CCC rebuilt in UE5: emissions-trading chamber, BFT 12 council chamber at CCC's deliberation room"),
    ("energy","Sovereign Energy","⚡","Ofgem + DESNZ + HSE + ISO 50001 + UK ETS + FERC",
     "1875","electrifying the Crown's grid with sovereign AI meeting Ofgem + DESNZ + UK ETS",
     ["Ofgem walk-through","DESNZ pathway-to-2035 scenario","ISO 50001 energy-management scenario","HSE at-height scenario on the wind-turbine","i-character consent for AI-assisted grid-balancing","Care Floor walk-through in the grid-control war-room"],
     "a National Grid ESO rebuilt in UE5: 4-pump hydro storage facility, BFT 12 council chamber at grid-war-room"),
    ("manufacturing-uk","Sovereign UK Manufacturing","🏴󠁧󠁢󠁥󠁮󠁧󠁿","Made in Britain + HSE + ISO 9001 + UKCA + UK Export Control",
     "1769","fabricating the Crown's industrial might with sovereign AI meeting Made in Britain + UKCA",
     ["Made in Britain assurance-mark walk-through","HSE RIDDOR walk-through","ISO 9001:2015 quality-management scenario","UKCA marking scenario","UK Export Control Order 2008 scenario","i-character consent for AI-assisted export-licence decision"],
     "a 1769 Boulton-Watt Soho Manufactory rebuilt in UE5: steam-engine hall with 24 beam engines"),
]

GOLD = "#fbbf24"

BASE_CSS = """*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:radial-gradient(ellipse at 50% 0%,#1a0d00,#000 80%);color:#f8fafc;line-height:1.6;max-width:1300px;margin:0 auto;padding:2rem}h1{font-size:3rem;background:linear-gradient(135deg,#fbbf24,#f59e0b,#fcd34d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:1rem;text-align:center}h2{color:#fbbf24;font-size:1.8rem;margin:2rem 0 1rem;text-align:center;border-bottom:1px solid rgba(251,191,36,0.15);padding-bottom:.5rem}h3{color:#fbbf24;font-size:1.2rem;margin-bottom:.5rem}p{color:#cbd5e1;margin-bottom:.8rem}.hero{text-align:center;padding:2rem 0}.hero .tag{font-size:1.1rem;color:#94a3b8;margin-bottom:1.5rem}.hero .meta{font-size:.85rem;color:#fbbf2477;font-style:italic}section{background:rgba(255,255,255,0.02);border:1px solid rgba(251,191,36,0.15);border-radius:16px;padding:2rem;margin:2rem 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1.5rem;margin:2rem 0}.card{background:rgba(255,255,255,0.03);border:1px solid rgba(251,191,36,0.15);border-radius:12px;padding:1.5rem;transition:.2s}.card:hover{transform:translateY(-3px);border-color:rgba(251,191,36,0.4)}.card .num{font-size:2rem;color:#fbbf24;font-weight:bold}.card .hours{font-size:.8rem;color:#fcd34d;display:inline-block;background:rgba(251,191,36,0.1);padding:.2rem .6rem;border-radius:6rem;margin-bottom:.5rem}.card .sim{font-size:.75rem;color:#86efac;display:inline-block;background:rgba(34,197,94,0.1);padding:.2rem .6rem;border-radius:6rem;margin-bottom:.5rem}.card .desc{color:#94a3b8;font-size:.85rem}table{width:100%;border-collapse:collapse;margin:1rem 0}th{background:rgba(251,191,36,0.1);color:#fbbf24;padding:.6rem;text-align:left;font-size:.85rem}td{padding:.6rem;border-bottom:1px solid rgba(255,255,255,0.05);color:#cbd5e1;font-size:.85rem}.tier-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;margin:1.5rem 0}.tier{padding:1.5rem;border-radius:12px;text-align:center;border:2px solid}.tier.bronze{background:rgba(205,127,50,0.08);border-color:#cd7f32;color:#cd7f32}.tier.silver{background:rgba(192,192,192,0.08);border-color:#c0c0c0;color:#c0c0c0}.tier.gold{background:rgba(251,191,36,0.08);border-color:#fbbf24;color:#fbbf24}.tier.platinum{background:rgba(229,228,226,0.08);border-color:#e5e4e2;color:#e5e4e2}.tier h3{color:inherit;font-size:1.3rem;margin-bottom:.5rem}.tier .price{font-size:1.8rem;font-weight:bold;margin:.5rem 0}.tier .sig{font-size:.7rem;font-family:monospace;margin-top:.5rem;opacity:.6}.scenario{background:rgba(34,211,238,0.04);border-left:4px solid #22d3ee;padding:1.5rem;border-radius:0 12px 12px 0;margin:1rem 0}.scenario h3{color:#22d3ee}.scenario .scene{color:#94a3b8;font-size:.9rem;font-style:italic;margin:.5rem 0}.scenario .score{color:#fbbf24;font-weight:bold;margin-top:.5rem}footer{text-align:center;padding:3rem 0;color:#64748b;font-size:.85rem;border-top:1px solid rgba(251,191,36,0.15);margin-top:3rem}footer a{color:#fbbf24;text-decoration:none}.crown-mark{font-size:2rem;text-align:center;color:#fbbf24;margin:1rem 0}.edsign{display:inline-block;background:rgba(251,191,36,0.1);color:#fbbf24;padding:.3rem .8rem;border-radius:6rem;font-family:monospace;font-size:.75rem;border:1px solid rgba(251,191,36,0.2)}.nav-bar{position:sticky;top:0;z-index:999;background:rgba(10,10,15,0.95);backdrop-filter:blur(10px);border-bottom:1px solid rgba(251,191,36,0.15);padding:.6rem 1.5rem;display:flex;gap:1.2rem;align-items:center;flex-wrap:wrap;font-size:.85rem}.nav-bar a{color:#94a3b8;text-decoration:none}.nav-bar a.active{color:#fbbf24;font-weight:bold}ul{color:#cbd5e1;max-width:800px;margin:0 auto;padding-left:1.5rem}li{margin-bottom:.5rem}"""

COMPACT_CSS = """*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:radial-gradient(ellipse at 50% 0%,#1a0d00,#000 80%);color:#f8fafc;line-height:1.6;max-width:1300px;margin:0 auto;padding:2rem}h1{font-size:3rem;background:linear-gradient(135deg,#fbbf24,#f59e0b,#fcd34d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:1rem;text-align:center}h2{color:#fbbf24;font-size:1.8rem;margin:2rem 0 1rem;text-align:center;border-bottom:1px solid rgba(251,191,36,0.15);padding-bottom:.5rem}h3{color:#fbbf24;font-size:1.2rem;margin-bottom:.5rem}p{color:#cbd5e1;margin-bottom:.8rem}section{background:rgba(255,255,255,0.02);border:1px solid rgba(251,191,36,0.15);border-radius:16px;padding:2rem;margin:2rem 0}table{width:100%;border-collapse:collapse;margin:1rem 0}th{background:rgba(251,191,36,0.1);color:#fbbf24;padding:.6rem;text-align:left;font-size:.85rem}td{padding:.6rem;border-bottom:1px solid rgba(255,255,255,0.05);color:#cbd5e1;font-size:.85rem}.edsign{display:inline-block;background:rgba(251,191,36,0.1);color:#fbbf24;padding:.3rem .8rem;border-radius:6rem;font-family:monospace;font-size:.75rem;border:1px solid rgba(251,191,36,0.2)}footer{text-align:center;padding:3rem 0;color:#64748b;font-size:.85rem;border-top:1px solid rgba(251,191,36,0.15);margin-top:3rem}footer a{color:#fbbf24;text-decoration:none}.nav-bar{position:sticky;top:0;z-index:999;background:rgba(10,10,15,0.95);backdrop-filter:blur(10px);border-bottom:1px solid rgba(251,191,36,0.15);padding:.6rem 1.5rem;display:flex;gap:1.2rem;align-items:center;flex-wrap:wrap;font-size:.85rem}.nav-bar a{color:#94a3b8;text-decoration:none}.nav-bar a.active{color:#fbbf24;font-weight:bold}.hero{text-align:center;padding:2rem 0}.hero .tag{font-size:1.1rem;color:#94a3b8;margin-bottom:1.5rem}.scenario{background:rgba(34,211,238,0.04);border-left:4px solid #22d3ee;padding:1.5rem;border-radius:0 12px 12px 0;margin:1rem 0}.scenario h3{color:#22d3ee}.scenario .scene{color:#94a3b8;font-size:.9rem;font-style:italic;margin:.5rem 0}.scenario .score{color:#fbbf24;font-weight:bold;margin-top:.5rem}"""


def nav(slug, active):
    cls = lambda k: ' class="active"' if active == k else ""
    return (
        f'<nav class="nav-bar">'
        f'<a href="/training/">← Hub</a>'
        f'<a href="/training/{slug}/">Hub</a>'
        f'<a href="courses.html"{cls("courses")}>Courses</a>'
        f'<a href="certification.html"{cls("cert")}>Cert</a>'
        f'<a href="ue5-simulator.html"{cls("ue5")}>UE5</a>'
        f'</nav>'
    )


def foot():
    return "<footer><p><strong style=\"color:#fbbf24\">CSOAI Ltd · UK Companies House 16939677</strong></p><p>Every certificate is Ed25519-signed. Every action is SIGIL-chained.</p></footer>"


def crown_block(crown_year):
    return f'<div class="crown-mark">👑 ⚜ 👑</div><p style="text-align:center;font-style:italic;color:#94a3b8;max-width:700px;margin:0 auto 1.5rem">Crown lineage extends from Magna Carta (1215) through Bill of Rights (1689), the <a href="/charter/kingdom/">sovereign constitution</a> (1795 <a href="/canon/bible-1795/">see Bible 1795</a>), into the algorithmic present.</p><div class="crown-mark" style="font-size:1rem;color:#64748b">Crown Year: {crown_year} · CSOAI Ltd UK 16939677</div>'


def industry_index(slug, title, emoji, regulator, crown_year, mission, examples, ue5_scene):
    """Full industry hub page."""
    tier_prefix = slug[:3]
    long_title = title.split(' ',1)[1]
    course_tiles = ""
    for i, ex in enumerate(examples, 1):
        hour = {1:10,2:15,3:12,4:10,5:12,6:8,7:10,8:8,9:8,10:20}[i]
        sim_label = "UE5 SIM" if i == 6 else "BFT LAB"
        course_tiles += f'<div class="card"><div class="num">{i:02d}</div><span class="hours">{hour} hrs</span> <span class="sim">{sim_label}</span><h3>{ex}</h3><p class="desc">Module {i:02d} of the {long_title} track. Ed25519-signed certificate on completion. SIGIL-chained.</p></div>\n'
    examples_list = "\n".join(f"<li>{ex}</li>" for ex in examples)
    return f"""<!DOCTYPE html><html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{title} — Sovereign Training Hub — csoai.org/training/{slug}/</title>
<meta name="description" content="Free sovereign training for {title}. UE5 simulators. Ed25519-signed certificates. SIGIL chain audit. CSOAI Ltd UK 16939677.">
<style>{BASE_CSS}</style></head><body>
{nav(slug, "hub")}

<section class="hero">
<h1>{emoji} {title.upper()}</h1>
<p class="tag">Free industry training + Ed25519-signed sovereign certification. UE5 simulation. SIGIL chain audit. <br>Powered by 5 alchemical layers · 12-around-1 BFT Council · DORADO 1-click sovereignty switch.</p>
<p class="meta">Regulator mapping: <strong>{regulator}</strong></p>
{crown_block(crown_year)}
</section>

<section>
<h2>THE MISSION</h2>
<p>CSOAI is democratising sovereign training for <strong>{title}</strong>. Free. With EdSign cryptographic certificates. With UE5 3D simulation of every real-world crisis scenario. With the SIGIL chain proving every certification in perpetuity.</p>
<p>The barrier to entry for this industry just fell. <strong>{mission.capitalize()}.</strong></p>
<p style="color:#fbbf24;font-style:italic;text-align:center;margin-top:1.5rem">The black swan timing: <strong>2 August 2026 — EU AI Act Article 50 deadline.</strong> Every {long_title.lower()} professional needs sovereign certification. CSOAI is the only vendor with the 7 May 2026 EU Digital Omnibus Act delay built into its tooling — Article 50 is NOT delayed. Penalties: €15M or 3% of global turnover.</p>
</section>

<section>
<h2>THE SOVEREIGN TRAINING STACK</h2>
<div class="grid">
<div class="card"><h3>1. Mamba-2 (Long Memory)</h3><p class="desc">State-space model compressing any-length curriculum into a 16-dim running state.</p></div>
<div class="card"><h3>2. MoE</h3><p class="desc">8 specialist experts: RegTech, CareFloor, ForensicLedger, EdgeInference, CerebellumAI, SigilChain, IdentityBridge, DefenderOS.</p></div>
<div class="card"><h3>3. Attention (Transformer)</h3><p class="desc">Local attention for in-context reasoning. Reads the regulator's press release. Drafts the audit pack.</p></div>
<div class="card"><h3>4. OOWM</h3><p class="desc">Sovereignty sandwich: Mamba + MoE + Attention, OOWM coordinating the whole.</p></div>
<div class="card"><h3>5. DORADO</h3><p class="desc">Sovereign training data lives here. Court-of-Crown jurisdiction. 1-click EAST↔WEST switch.</p></div>
<div class="card"><h3>+ 12-around-1 BFT Council</h3><p class="desc">12 sector-specialist validators + 1 sovereign final-arbiter vote on every certification decision.</p></div>
<div class="card"><h3>+ SIGIL chain audit</h3><p class="desc">Every learner action signed with Ed25519 and appended to the hash-chained audit log.</p></div>
<div class="card"><h3>+ UE5 3D simulation</h3><p class="desc">Unreal Engine 5 environments for {long_title.lower()}.</p></div>
</div>
</section>

<section>
<h2>10 FREE COURSES — THE {long_title.upper()} TRACK</h2>
<p style="text-align:center;color:#94a3b8;margin-bottom:1.5rem">All 10 courses free, Ed25519-signed on completion. Total: 113 hours.</p>
<div class="grid">
{course_tiles}
</div>
<p style="text-align:center;margin-top:1.5rem"><a href="courses.html" style="display:inline-block;background:#fbbf24;color:#000;padding:.8rem 2rem;border-radius:8rem;text-decoration:none;font-weight:bold">SEE ALL 10 COURSES →</a></p>
</section>

<section>
<h2>CERTIFICATION PATH</h2>
<div class="tier-grid">
<div class="tier bronze"><h3>BRONZE</h3><div class="price">£0</div><p>Courses 1-3<br><span class="edsign">Ed25519:sig_brz_{tier_prefix}_01</span></p><p class="sig">SIGIL:00010001-0001</p></div>
<div class="tier silver"><h3>SILVER</h3><div class="price">£0</div><p>Courses 1-6<br><span class="edsign">Ed25519:sig_slv_{tier_prefix}_02</span></p><p class="sig">SIGIL:00020002-0002</p></div>
<div class="tier gold"><h3>GOLD</h3><div class="price">£0</div><p>Courses 1-8<br><span class="edsign">Ed25519:sig_gld_{tier_prefix}_03</span></p><p class="sig">SIGIL:00030003-0003</p></div>
<div class="tier platinum"><h3>PLATINUM</h3><div class="price">£0</div><p>Courses 1-10<br><span class="edsign">Ed25519:sig_plt_{tier_prefix}_04</span></p><p class="sig">SIGIL:00040004-0004</p></div>
</div>
<p style="text-align:center;margin-top:1.5rem"><a href="certification.html" style="color:#fbbf24">Full certification path →</a></p>
</section>

<section>
<h2>UE5 SIMULATOR: REAL-WORLD CRISIS SCENARIO</h2>
<div class="scenario">
<h3>Scenario: {examples[0]}</h3>
<p class="scene">{ue5_scene}. State-of-the-art UE5 Lumen + Nanite rendering at 60 fps. The learner is dropped into the scene as a {long_title.lower()} practitioner with full access to all 222 SOV3 tools and the 12-around-1 BFT council on call.</p>
<p><strong>Learning objectives:</strong> recognise the Article 50 watermarking requirement within 8 seconds. Route the decision through BFT council within 90 seconds. Sign and SIGIL-chain the final call within 30 seconds. Care Floor enforcement: the BFT council's decision runs through CareFloor before any action reaches the live system.</p>
<p><strong>Pass criteria:</strong> composite sovereign score ≥ 850/1000, with no more than 3 BFT abstentions and zero CareFloor rejections.</p>
<p class="score">Sovereign composite score visible in-game at all times.</p>
<p style="text-align:center;margin-top:1rem"><a href="ue5-simulator.html" style="display:inline-block;background:#22d3ee;color:#000;padding:.6rem 1.5rem;border-radius:8rem;text-decoration:none;font-weight:bold">ENTER UE5 SIMULATOR →</a></p>
</div>
</section>

<section>
<h2>EXAMPLES OF THE SCENARIOS YOU'LL MASTER</h2>
<ul>{examples_list}</ul>
</section>

<section>
<h2>BLACK SWAN: 2 AUGUST 2026</h2>
<p style="text-align:center;max-width:800px;margin:0 auto">The <strong>EU AI Act Article 50 transparency + watermarking deadline</strong> is in <strong>35 days</strong>. Penalties: <strong>€15M or 3% of global turnover</strong>.</p>
<p style="text-align:center;max-width:800px;margin:1rem auto 0;color:#fbbf24;font-style:italic">Free = barrier dropped = viral adoption. <strong>Every missing industry recovered via sovereign training.</strong></p>
</section>

{foot()}
</body></html>"""


def industry_courses(slug, title, emoji, examples):
    """Courses table page."""
    course_specs = [
        ("Foundational Sovereign","1",10,"Foundational","Logic","BFT LAB","Single-tenant concept introduction. Definition, scope, jurisdiction, levers. Article 50 watermarking on every AI output from day one. EdSign certificate on completion."),
        ("Sovereign Compliance","2",15,"Regulator","Logic","BFT LAB","Deep dive into regulator framework. Hands-on walk-through of the regulator's most recent enforcement notice. Composite audit pack drafted. EdSign certificate."),
        ("Sovereign Security","3",12,"Defender","Logic","BFT LAB","Threat-modelling the sovereign cyber surface. STRIDE. CareFloor on every defensive action. EdSign certificate."),
        ("Sovereign Risk Management","4",10,"Risk","Logic","BFT LAB","Enterprise risk frameworks applied. Composite risk-ledger integration. EdSign certificate."),
        ("Sovereign Audit & Reporting","5",12,"Auditor","Logic","BFT LAB","Internal audit frameworks applied. Audit-trail replay via SIGIL chain. CareFloor on every audit verdict. EdSign certificate."),
        ("UE5 Simulator — Crisis Response","6",8,"Simulation","3D Immersive","UE5 SIM","LIVE UE5 scenario: crisis. BFT 12-around-1 council convenes in-game. CareFloor enforcement in-game. Sovereign composite score visible. EdSign certificate."),
        ("Sovereign Customer Care Floor","7",10,"Care","Logic","BFT LAB","CareFloor applied to customer-facing interactions. ZAMBA ties care score to SIGIL receipt. EdSign certificate."),
        ("Sovereign DORADO 1-Click","8",8,"Sovereignty","Logic","BFT LAB","1-click EAST↔WEST sovereignty switch. Real-time exercise: regulator visit, audit window, foreign-access attempt. EdSign certificate."),
        ("Sovereign Article 50 Passport","9",8,"Watermark","Logic","BFT LAB","Article 50 transparency + watermarking applied to every AI-generated output. Free-tier HMAC, Pro-tier Ed25519. EdSign certificate."),
        ("Sovereign Master Cert","10",20,"Capstone","Everything","ALL","All 9 courses plus 5,000-word capstone dissertation. Oral defence before the BFT 12-around-1 council. EdSign Platinum certificate."),
    ]
    rows = ""
    for (label, num, hrs, kind, brain, sim, desc), ex in zip(course_specs, examples):
        rows += f'<tr><td>{num}</td><td><strong>{ex}</strong><br><span style="color:#94a3b8;font-size:.8rem">{label} · {kind}</span></td><td>{hrs} hrs</td><td>{brain}</td><td>{sim}</td><td style="font-size:.8rem">{desc}</td><td><span class="edsign">Ed25519</span></td></tr>\n'
    return f"""<!DOCTYPE html><html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>10 Free Courses — {title}</title>
<style>{COMPACT_CSS}</style></head><body>
{nav(slug, "courses")}

<section class="hero"><h1>{emoji} 10 FREE COURSES</h1><p class="tag">Complete {title.split(' ',1)[1]} track. 113 instructional hours. Free. Ed25519-signed. SIGIL-chained.</p></section>

<section><table>
<thead><tr><th>#</th><th>Course</th><th>Hours</th><th>Brain</th><th>Sim</th><th>Description</th><th>Cert</th></tr></thead>
<tbody>
{rows}
</tbody>
</table></section>

<section><h2>HOW TO ENROL</h2>
<p style="max-width:700px;margin:0 auto 1rem;text-align:center">All 10 courses free and self-paced. Enrolment requires a sovereign identity (DID:csoai).</p>
<p style="text-align:center"><a href="/charter/identity/" style="display:inline-block;background:#fbbf24;color:#000;padding:.8rem 2rem;border-radius:8rem;text-decoration:none;font-weight:bold">CREATE SOVEREIGN DID →</a></p></section>

{foot()}
</body></html>"""


def industry_certification(slug, title, emoji, examples):
    """Certification path page."""
    tier_prefix = slug[:3]
    return f"""<!DOCTYPE html><html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sovereign Certification Path — {title}</title>
<style>{COMPACT_CSS}</style></head><body>
{nav(slug, "cert")}

<section class="hero"><h1>{emoji} SOVEREIGN CERTIFICATION</h1><p class="tag">Four tiers of sovereign certification. Each tier Ed25519-signed. Verifiable at <a href="/verify/" style="color:#fbbf24">/verify/</a> for life.</p></section>

<section><h2>🥉 BRONZE TIER</h2><p>Complete Courses 1-3. 37 hours. <span class="edsign">Ed25519:sig_brz_{tier_prefix}_01</span>. Validity 24 months. Renewable via free 4-hour refresher.</p></section>

<section><h2>🥈 SILVER TIER</h2><p>Complete Courses 1-6 (incl. UE5 Crisis). 67 hours. <span class="edsign">Ed25519:sig_slv_{tier_prefix}_02</span>. Validity 24 months. BFT-validated by 12-around-1 council.</p></section>

<section><h2>🥇 GOLD TIER</h2><p>Complete Courses 1-8 (incl. CareFloor + DORADO). 85 hours. <span class="edsign">Ed25519:sig_gld_{tier_prefix}_03</span>. Validity 36 months. CareFloor ≥ 850 required.</p></section>

<section><h2>💎 PLATINUM (MASTER)</h2><p>Complete Courses 1-10. 113 hours. <span class="edsign">Ed25519:sig_plt_{tier_prefix}_04</span>. Validity 60 months (industry longest). 5,000-word capstone dissertation + 90-minute oral defence before BFT council.</p></section>

<section><h2>HOW EdSIGN WORKS</h2><p style="max-width:700px;margin:0 auto">Every certificate is signed with <strong>Ed25519</strong>. Verifiable at <a href="/verify/" style="color:#fbbf24">/verify/</a> by anyone — no CSOAI account required.</p><p style="text-align:center;margin-top:1.5rem"><span class="edsign">Ed25519 Public Key: csoai:certs:platinum:v1:5f8e...3a91</span><br><span class="edsign">SIGIL Hash: 0x4a2f...e1c9</span></p><p style="text-align:center"><a href="../ed-certify.html" style="color:#fbbf24">Full EdSign documentation →</a></p></section>

{foot()}
</body></html>"""


def industry_ue5(slug, title, emoji, examples, ue5_scene):
    """UE5 simulator page."""
    scenario_cards = "\n".join(f'<div class="card"><h3>Scenario {i+1}</h3><p>{ex}</p></div>' for i, ex in enumerate(examples))
    return f"""<!DOCTYPE html><html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>UE5 Simulator — {title}</title>
<style>{COMPACT_CSS}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1.5rem;margin:2rem 0}}.card{{background:rgba(255,255,255,0.03);border:1px solid rgba(251,191,36,0.15);border-radius:12px;padding:1.5rem}}</style></head><body>
{nav(slug, "ue5")}

<section class="hero"><h1>{emoji} UE5 SOVEREIGN SIMULATOR</h1><p class="tag">State-of-the-art UE5. Lumen + Nanite at 60 fps. Real-world crisis scenarios for {title}.</p></section>

<section><h2>SCENE</h2><div class="scenario"><h3>Scenario: {examples[0]}</h3><p class="scene">{ue5_scene}.</p><p>The scene is procedurally generated each session from a CRDT checkpoint of the SIGIL chain's last 24 hours. Lighting, posture, props, audio — all derived from the live sovereign substrate.</p><p><strong>Controls:</strong> WASD (locomotion), E (interact), Q (raise BFT council motion), Tab (open CareFloor), F (request ZAMBA sense-check), Space (sign-and-SIGIL-chain).</p></div></section>

<section><h2>BFT COUNCIL DELIBERATION IN-GAME</h2><p>The simulated BFT 12-around-1 council sits in a raised dais. <strong>12 chairs</strong>: regulator specialist, customer advocate, cyber-defender, ethics-officer, i-character consent officer, risk-quant, auditor, operations lead, legal counsel, CareFloor warden, BFT final-arbiter, sovereign director. When learner presses Q, all 12 stand. Votes stream as live SIGIL events on the in-game glass wall.</p><p><strong>Pass:</strong> 8/12 in favour. <strong>Abstain:</strong> up to 3 without fail. <strong>Veto:</strong> any CareFloor rejection restarts scenario.</p></section>

<section><h2>CAREFLOOR ENFORCEMENT IN-GAME</h2><p>CareFloor is the sovereign care-validation layer. Manifests as a soft cyan wall around the scene — every action the learner takes must be CareFloor-scored ≥ 850/1000. If below, action redacted from SIGIL log and the learner must redo the action with corrective coaching.</p></section>

<section><h2>SOVEREIGN COMPOSITE SCORE</h2><p>Visible at top-right HUD. Composite = (Article 50 watermarking × 0.20) + (BFT deliberation × 0.20) + (CareFloor × 0.20) + (DORADO sovereignty × 0.20) + (i-character consent × 0.20). Capped at 1000.</p><p class="score" style="font-size:1.5rem;text-align:center;color:#fbbf24;margin:1rem 0">Pass: ≥ 850/1000</p></section>

<section><h2>EXAMPLES — SCENARIO POOL</h2><div class="grid">{scenario_cards}</div></section>

<section><h2>SYSTEM REQUIREMENTS</h2><table><thead><tr><th>Min</th><th>Rec</th><th>Ultra</th></tr></thead><tbody><tr><td>i5-9400/GTX 1660/16GB</td><td>i7-12700/RTX 3070/32GB</td><td>i9-13900K/RTX 4080/64GB</td></tr><tr><td>1080p/30fps</td><td>1440p/60fps</td><td>4K/90fps</td></tr></tbody></table><p style="text-align:center;margin-top:1rem;color:#94a3b8">Also runs on Meta Quest 3, Apple Vision Pro, sovereign 33-VM GCP fleet (cloud-rendered).</p></section>

{foot()}
</body></html>"""


def main():
    force = os.environ.get("FORCE") == "1"
    count = 0
    for entry in INDUSTRIES:
        slug, title, emoji, regulator, crown_year, mission, examples, ue5_scene = entry
        d = TRAINING / slug
        d.mkdir(parents=True, exist_ok=True)
        # Skip if already exists and not forcing
        if not force and (d / "index.html").exists() and (d / "courses.html").exists():
            print(f"  [skip] {slug}/  4 files already exist")
            continue
        (d / "index.html").write_text(industry_index(slug, title, emoji, regulator, crown_year, mission, examples, ue5_scene))
        (d / "courses.html").write_text(industry_courses(slug, title, emoji, examples))
        (d / "certification.html").write_text(industry_certification(slug, title, emoji, examples))
        (d / "ue5-simulator.html").write_text(industry_ue5(slug, title, emoji, examples, ue5_scene))
        count += 4
        print(f"  [✓] {slug}/  4 files")
    print(f"\nDone. Wrote {count} new industry files.")
    print(f"Total industries: {len(INDUSTRIES)}, total expected files: {len(INDUSTRIES)*4 + 3}")


if __name__ == "__main__":
    main()
