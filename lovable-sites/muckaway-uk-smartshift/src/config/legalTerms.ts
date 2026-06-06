// Global Legal Protection System - Terms Content
// Multi-layer legal terms for different regions and industries

export interface TermsSection {
  id: string;
  title: string;
  content: string;
  subsections?: { title: string; content: string }[];
}

export const GLOBAL_BASE_TERMS: TermsSection[] = [
  {
    id: 'definitions',
    title: '1. Definitions & Interpretation',
    content: `"Platform" means the SaaS platform accessible via muckaway.ai and associated mobile applications.
"User" means any person or entity accessing the Platform.
"Customer" means a User booking equipment or services.
"Supplier" means equipment/service providers on the Platform.
"We/Us/Our" means the Platform operator (see Regional Entity section).
"You/Your" means the User.
"Regional Entity" means the legal entity in your jurisdiction.
"Equipment" means plant, machinery, vehicles, or tools offered for hire.`,
  },
  {
    id: 'acceptance',
    title: '2. Global Acceptance of Terms',
    content: `By accessing this Platform, you agree to:
• These Global Base Terms (Layer 1)
• Your Regional Addendum (Layer 2) - automatically applied based on location
• The Equipment/Service Agreement (Layer 3) - if booking services
• The Data Processing Addendum (Layer 4) - GDPR/CCPA/PIPEDA compliance
• The Industry-Specific Addendum (Layer 5) - construction/waste/haulage

If you disagree with ANY layer, you must cease using the Platform immediately.`,
  },
  {
    id: 'eligibility',
    title: '3. Eligibility & Capacity',
    content: `You must be:
• Minimum 18 years of age (or legal age in your jurisdiction)
• Legally capable of entering binding contracts
• Authorized to represent your business entity (if applicable)
• Not barred from using such services under applicable laws

By registering, you warrant that all provided information is accurate and current. You must update changes within 7 days.`,
  },
  {
    id: 'license',
    title: '4. Platform License & Usage Rights',
    content: `We grant you a limited, non-exclusive, revocable license to:
• Access and use the Platform for legitimate business purposes
• Generate quotes and manage bookings
• Access your account dashboard and historical data
• Use AI recommendations for waste classification

You may NOT:
• Reverse engineer, copy, or modify the Platform
• Use automated tools (bots, scrapers) without written consent
• Resell Platform access or create derivative services
• Use the Platform for illegal purposes
• Upload malicious code or interfere with service availability
• Share credentials or allow unauthorized access

We reserve the right to suspend accounts for violations without notice.`,
  },
  {
    id: 'security',
    title: '5. Account Security & Your Responsibilities',
    content: `You are responsible for:
• Maintaining password confidentiality
• All activities under your account
• Notifying us within 24 hours of unauthorized access
• Using strong passwords and multi-factor authentication (where available)

We employ industry-standard security but cannot guarantee absolute security. You use the Platform at your own risk.`,
  },
  {
    id: 'payment',
    title: '6. Payment Terms',
    content: `All payments are processed through third-party providers (Stripe). We do not store complete payment card data.

Fees are quoted in your regional currency (see Regional Addendum).

Payment terms:
• Immediate payment for bookings under £2,000 equivalent
• Deposit required for bookings over £2,000 equivalent
• Recurring subscriptions billed in advance
• Late payments incur 1.5% monthly interest charge

Refund policy: See Regional Addendum for jurisdiction-specific rules.`,
  },
  {
    id: 'ip',
    title: '7. Intellectual Property',
    content: `Platform, trademarks, logos, AI algorithms: Owned by Us or licensors.

Your data: You retain ownership. We have license to use for:
• Providing the service
• Improving AI recommendations (anonymized)
• Compliance with legal obligations

AI-generated recommendations: Owned by Us, licensed to You for project use.`,
  },
  {
    id: 'liability',
    title: '8. Limitation of Liability',
    content: `To the maximum extent permitted by law:
• Our total liability shall not exceed the fees paid by you in the 12 months preceding the incident
• We are NOT liable for: indirect damages, lost profits, project delays, equipment downtime, third-party claims

This limitation survives termination of this agreement.

Some jurisdictions prohibit such limitations (see Regional Addendum for specifics).`,
  },
  {
    id: 'indemnification',
    title: '9. Indemnification',
    content: `You agree to indemnify and hold harmless:
• The Platform entity in your region
• Parent company, subsidiaries, affiliates
• Directors, officers, employees, agents

From any claims arising from:
• Your breach of these Terms
• Your misuse of the Platform
• Waste classification decisions based on AI recommendations
• Data you provide to the Platform`,
  },
  {
    id: 'disputes',
    title: '10. Dispute Resolution',
    content: `Mandatory Arbitration (where legally enforceable):
• Disputes under £50,000: Binding arbitration
• Disputes over £50,000: Litigation in regional courts
• Arbitration location: See Regional Addendum

Governing Law: See Regional Entity section.

Class Action Waiver: You waive right to participate in class actions to the maximum extent permitted by law.`,
  },
  {
    id: 'termination',
    title: '11. Termination',
    content: `Either party may terminate with 30 days written notice.

Immediate termination for:
• Breach of security or fraud
• Illegal activity
• Non-payment after 60 days
• Repeated violation of Terms

On termination:
• Access to Platform ceases immediately
• Download your data within 30 days or it's deleted
• Outstanding fees become immediately due
• Sections 7 (IP), 8 (Liability), 9 (Indemnity), 10 (Disputes) survive`,
  },
  {
    id: 'modifications',
    title: '12. Modifications to Terms',
    content: `We may modify Terms with 30 days notice via email or Platform notice.

Continued use after modifications = acceptance of new Terms.

Material changes require explicit opt-in consent.`,
  },
  {
    id: 'force-majeure',
    title: '13. Force Majeure',
    content: `We are not liable for failures due to:
• Acts of God, natural disasters
• War, terrorism, civil unrest
• Government actions or sanctions
• Internet infrastructure failures
• Pandemics or widespread illness`,
  },
  {
    id: 'general',
    title: '14. General Provisions',
    content: `Third-Party Links: Platform may link to third-party sites. We are not responsible for their content, privacy practices, or terms of service.

Assignment: You may not assign this agreement without our written consent. We may assign without notice in case of merger, acquisition, or asset sale.

Entire Agreement: These Terms (all layers) constitute the entire agreement between you and us, superseding all prior agreements.

Severability: If any provision is found invalid, the remainder continues in full effect.`,
  },
];

export const UK_ADDENDUM: TermsSection[] = [
  {
    id: 'uk-gdpr',
    title: 'UK GDPR & Data Protection',
    content: `We are registered with the Information Commissioner's Office (ICO).

Our lawful basis for processing:
• Contract performance (booking processing)
• Legitimate interests (fraud prevention, service improvement)
• Consent (marketing - separate opt-in)
• Legal obligation (tax reporting)

Your UK GDPR Rights:
• Access: Request your data within 30 days
• Rectification: Correct inaccurate data within 14 days
• Erasure: "Right to be forgotten" (subject to legal retention)
• Portability: Receive data in machine-readable format
• Object: Opt-out of processing for marketing
• Restrict: Limit processing under certain conditions

To exercise rights, email: dpo@muckaway.co.uk

Data retention: 7 years (UK tax law requirement) then anonymized.`,
  },
  {
    id: 'uk-vat',
    title: 'UK VAT & Tax Compliance',
    content: `VAT Registration: Pending
Prices: Exclusive of VAT at 20% unless stated otherwise.
VAT invoices issued electronically and stored per Making Tax Digital requirements.
Customers may reclaim VAT if registered with HMRC.`,
  },
  {
    id: 'uk-safety',
    title: 'UK Safety & Compliance',
    content: `All services meet:
• Environmental Protection Act 1990
• Waste (England and Wales) Regulations 2011
• Duty of Care Regulations
• HSE Guidance for waste management

Operator requirements:
• Valid Waste Carrier License (Environment Agency)
• Appropriate insurance coverage

Insurance Requirements:
• Public Liability: £5M minimum
• Employers' Liability: £10M (if applicable)`,
  },
  {
    id: 'uk-cancellation',
    title: 'UK Cancellation & Refund Policy',
    content: `Cancellation notice:
• 24+ hours: Full refund
• 12-24 hours: 50% refund
• <12 hours: No refund

Cooling-off period: 14 days under Consumer Contracts Regulations (if not urgent delivery).

Force majeure: Written notice within 7 days of event.`,
  },
  {
    id: 'uk-disputes',
    title: 'UK Dispute Resolution',
    content: `These Terms are governed by the laws of England and Wales.
Disputes subject to exclusive jurisdiction of English courts (unless arbitration applies).
You retain rights under UK Consumer Rights Act 2015 that cannot be excluded.

Small claims (<£10,000): County Court Money Claims Centre.
Larger claims: Technology & Construction Court (London).
Alternative Dispute Resolution (ADR): Offered via CEDR.`,
  },
];

export const US_ADDENDUM: TermsSection[] = [
  {
    id: 'us-privacy',
    title: 'US Data Privacy (CCPA/CPRA)',
    content: `We comply with:
• CCPA/CPRA (California)
• Virginia CDPA
• Colorado Privacy Act
• Connecticut DPA
• Utah CPA

California residents have additional rights:
• Right to know what data collected (12-month lookback)
• Right to delete (with exceptions)
• Right to opt-out of sale/sharing (we don't sell data)
• Right to non-discrimination
• Sensitive personal information restrictions

Data Sale: We DO NOT sell personal data. No opt-out needed.

Do Not Track: We respect browser DNT signals.

California Shine the Light: Contact privacy@muckaway.ai for data disclosure.`,
  },
  {
    id: 'us-safety',
    title: 'US Safety & Compliance',
    content: `All services meet applicable OSHA and EPA standards.

Operator requirements:
• State-specific waste carrier licenses
• Valid CDL (Commercial Driver License) where required
• DOT compliance for interstate transport

Insurance:
• General Liability: $2M minimum
• Workers' Comp: Statutory (if applicable)`,
  },
  {
    id: 'us-payment',
    title: 'US Payment Terms',
    content: `Currency: USD
Payment methods: ACH, Wire Transfer, Credit Card, PayPal, Apple Pay, Google Pay.
Sales Tax: Calculated at checkout based on delivery location (varies by state/county).
Credit terms: Net 30 available with approved business credit application.
Deposit: 25% for bookings over $2,500.`,
  },
  {
    id: 'us-disputes',
    title: 'US Dispute Resolution',
    content: `Governed by laws of State of Delaware and your state of use.
Federal Arbitration Act applies to arbitration clauses.
Class action waiver subject to state law limitations (California exception).

Arbitration: JAMS, New York, under Delaware law (for disputes >$10,000).
Small Claims: Local small claims court (limit varies by state).
Federal Court: For IP disputes or disputes >$75,000.`,
  },
];

export const EU_ADDENDUM: TermsSection[] = [
  {
    id: 'eu-gdpr',
    title: 'EU GDPR Compliance',
    content: `We are GDPR-compliant and registered with Irish Data Protection Commission.

Lawful bases: Contract, Legitimate Interests, Consent, Legal Obligation.

Data transfers outside EU: Standard Contractual Clauses (SCCs) in place.

Your GDPR Rights (enforced within 30 days):
• Access, rectification, erasure, portability, objection, restriction
• Withdraw consent anytime
• Lodge complaint with DPC (www.dataprotection.ie)
• Data breach notification within 72 hours

DPO: EU Data Protection Officer, dpo@muckaway.ie

Data retention: 7 years (Irish tax law) then pseudonymized.`,
  },
  {
    id: 'eu-jurisdiction',
    title: 'EU Law & Jurisdiction',
    content: `Governed by laws of Ireland.
Disputes: Irish High Court (Commercial Division) or arbitration.
EU Platform-to-Business Regulation applies to Supplier relationships.`,
  },
];

export const WASTE_INDUSTRY_ADDENDUM: TermsSection[] = [
  {
    id: 'waste-carrier',
    title: 'Waste Carrier Compliance',
    content: `We hold valid waste carrier licenses in applicable jurisdictions.

You warrant that:
• Waste described is accurate and complete
• No hazardous or prohibited materials included without prior arrangement
• Waste is correctly classified per regulations

Prohibited materials (without special arrangement):
• Asbestos
• Clinical/medical waste
• Fridges/freezers with refrigerants
• Tyres (commercial quantities)
• Liquid waste (>10L)
• Hazardous chemicals`,
  },
  {
    id: 'waste-duty-of-care',
    title: 'Duty of Care',
    content: `We provide Waste Transfer Notes (WTN) or equivalent for every collection.

You must:
• Store waste safely prior to collection
• Prevent contamination
• Sign documentation at collection
• Keep records as required by law (minimum 2 years UK)

Digital documentation available in your account dashboard.`,
  },
  {
    id: 'waste-ai-disclaimer',
    title: 'AI Classification Disclaimer',
    content: `Our AI-powered waste classification tools are provided as decision-support aids ONLY.

While we strive for accuracy:
• AI outputs should be verified by qualified personnel
• Final classification responsibility lies with the waste producer
• Misdescribed waste may result in regulatory fines and clean-up costs

If prohibited or misdescribed waste is discovered:
• Service will be immediately stopped
• Waste quarantined at your cost
• Regulatory notification if legally required
• Remediation costs charged to you`,
  },
  {
    id: 'waste-environmental',
    title: 'Environmental Liability',
    content: `Customer liable for misdescribed waste (fines + clean-up costs).

Pollution insurance: We maintain appropriate coverage. Customer must notify us immediately of any pollution incident.

We target minimum 90% landfill diversion (recycling/recovery).
Recycling certificates available for your sustainability reporting.`,
  },
];

export const DISCLAIMERS = {
  aiRecommendations: `The AI recommendations provided by MuckAway.ai are for informational purposes only and do not constitute professional engineering, legal, or environmental advice. Users are solely responsible for verifying the suitability of recommended services for their specific site conditions, project requirements, and regulatory compliance. We accept no liability for project outcomes based on AI suggestions.`,
  
  siteSafety: `Customer is solely responsible for site safety, risk assessments, and method statements. Our service does not replace comprehensive site planning. All waste must be properly prepared and accessible for collection.`,
  
  wasteClassification: `Customer is solely responsible for accurate waste classification. Misdescribed waste may result in regulatory fines, clean-up costs, and criminal liability. When in doubt, arrange for professional analysis before booking.`,
  
  financial: `Waste disposal costs, tax implications, and deductions vary by jurisdiction and individual circumstances. Consult a qualified accountant/tax advisor. We do not provide financial or tax advice.`,
  
  insurance: `Our insurance does not replace Customer's required insurance. Customer must maintain valid public liability coverage. Evidence may be required before service commencement.`,
  
  forceMajeure: `We are not liable for delays due to: extreme weather, natural disasters, traffic accidents, government restrictions, pandemics, or supplier issues. Our liability is limited to service cost refund, not consequential losses.`,
};

// Arabic Legal Terms
export const ARABIC_TERMS: TermsSection[] = [
  {
    id: 'ar-definitions',
    title: '1. التعريفات والتفسير',
    content: `"المنصة" تعني منصة SaaS المتاحة عبر muckaway.ai والتطبيقات المحمولة المرتبطة بها.
"المستخدم" يعني أي شخص أو كيان يصل إلى المنصة.
"العميل" يعني المستخدم الذي يحجز المعدات أو الخدمات.
"المورد" يعني مقدمي المعدات/الخدمات على المنصة.`,
  },
  {
    id: 'ar-acceptance',
    title: '2. القبول العالمي للشروط',
    content: `من خلال الوصول إلى هذه المنصة، فإنك توافق على:
• هذه الشروط الأساسية العالمية
• ملحق منطقتك الإقليمية
• اتفاقية المعدات/الخدمات
• ملحق معالجة البيانات`,
  },
  {
    id: 'ar-payment',
    title: '3. شروط الدفع',
    content: `تتم معالجة جميع المدفوعات من خلال مزودين خارجيين. نحن لا نخزن بيانات بطاقة الدفع الكاملة.
العملة: درهم إماراتي
ضريبة القيمة المضافة: 5%`,
  },
  {
    id: 'ar-liability',
    title: '4. تحديد المسؤولية',
    content: `إلى أقصى حد يسمح به القانون، لن تتجاوز مسؤوليتنا الإجمالية الرسوم التي دفعتها في الأشهر الـ 12 السابقة للحادث.`,
  },
];

export const UAE_ADDENDUM: TermsSection[] = [
  {
    id: 'uae-jurisdiction',
    title: 'UAE Law & Jurisdiction',
    content: `These Terms are governed by the laws of the United Arab Emirates.
Disputes subject to Dubai International Financial Centre (DIFC) Courts.
All documents available in Arabic upon request.
VAT: 5% applied as per Federal Tax Authority requirements.`,
  },
  {
    id: 'uae-permits',
    title: 'Dubai Municipality Compliance',
    content: `All waste collection services comply with Dubai Municipality regulations.
Required permits: Waste Collection Permit, Trade License.
Environmental compliance: UAE Federal Law No. 24 of 1999.`,
  },
];
