import React from 'react';
import './Legal.css';

const Privacy = () => {
  return (
    <div className="legal-page">
      <div className="container">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: October 22, 2024</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            AI Safety Governance Limited ("we," "us," or "our") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
            you use councilof.ai and related services.
          </p>
          <p>
            We comply with the UK Data Protection Act 2018, GDPR, and other applicable data protection laws.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Information You Provide</h3>
          <ul>
            <li><strong>Account Information:</strong> Name, email, company, phone number</li>
            <li><strong>Payment Information:</strong> Billing address, payment method (processed by Stripe)</li>
            <li><strong>Profile Data:</strong> Profile picture, bio, preferences</li>
            <li><strong>Communications:</strong> Messages, support tickets, feedback</li>
          </ul>

          <h3>2.2 Information Collected Automatically</h3>
          <ul>
            <li><strong>Usage Data:</strong> API calls, features used, decisions submitted</li>
            <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
            <li><strong>Analytics:</strong> Page views, session duration, user flows</li>
            <li><strong>Cookies:</strong> Authentication, preferences, analytics (see Cookie Policy)</li>
          </ul>

          <h3>2.3 AI Decision Data</h3>
          <ul>
            <li>Decisions submitted to the Council of 12 AIs</li>
            <li>AI votes and confidence scores</li>
            <li>Ensemble learning results</li>
            <li>Blockchain transaction hashes</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p><strong>We use your information to:</strong></p>
          <ul>
            <li>Provide and improve our services</li>
            <li>Process AI decisions through the Council</li>
            <li>Log decisions on blockchain for transparency</li>
            <li>Communicate with you about your account</li>
            <li>Send product updates and marketing (with consent)</li>
            <li>Analyze usage and improve accuracy</li>
            <li>Detect and prevent fraud or abuse</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2>4. Legal Basis for Processing (GDPR)</h2>
          <p>We process your data based on:</p>
          <ul>
            <li><strong>Contract:</strong> To provide services you've requested</li>
            <li><strong>Legitimate Interest:</strong> To improve services and prevent fraud</li>
            <li><strong>Consent:</strong> For marketing communications and optional features</li>
            <li><strong>Legal Obligation:</strong> To comply with laws and regulations</li>
          </ul>
        </section>

        <section>
          <h2>5. Data Sharing and Disclosure</h2>
          <p><strong>We may share your information with:</strong></p>
          <ul>
            <li><strong>Service Providers:</strong> Cloud hosting (DigitalOcean), payments (Stripe), analytics</li>
            <li><strong>AI Model Providers:</strong> OpenAI, Anthropic, Google (for Council decisions)</li>
            <li><strong>Blockchain Network:</strong> Decision hashes logged publicly on Polygon</li>
            <li><strong>Legal Authorities:</strong> When required by law or to protect rights</li>
            <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale</li>
          </ul>
          <p><strong>We do NOT:</strong></p>
          <ul>
            <li>Sell your personal data to third parties</li>
            <li>Share sensitive decision data without consent</li>
            <li>Use your data to train AI models without permission</li>
          </ul>
        </section>

        <section>
          <h2>6. Data Security</h2>
          <p>
            We implement industry-standard security measures including encryption, access controls, and 
            regular security audits. However, no method of transmission over the internet is 100% secure.
          </p>
          <p><strong>Security measures include:</strong></p>
          <ul>
            <li>TLS/SSL encryption for data in transit</li>
            <li>AES-256 encryption for data at rest</li>
            <li>Multi-factor authentication options</li>
            <li>Regular security audits and penetration testing</li>
            <li>Blockchain immutability for audit trails</li>
          </ul>
        </section>

        <section>
          <h2>7. Data Retention</h2>
          <p>
            We retain your data for as long as necessary to provide services and comply with legal obligations.
          </p>
          <ul>
            <li><strong>Account Data:</strong> Until account deletion + 30 days</li>
            <li><strong>AI Decisions:</strong> Blockchain records are permanent (anonymized)</li>
            <li><strong>Usage Data:</strong> 2 years for analytics</li>
            <li><strong>Financial Records:</strong> 7 years (legal requirement)</li>
          </ul>
        </section>

        <section>
          <h2>8. Your Rights (GDPR/UK DPA)</h2>
          <p><strong>You have the right to:</strong></p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your data</li>
            <li><strong>Rectification:</strong> Correct inaccurate data</li>
            <li><strong>Erasure:</strong> Request deletion ("right to be forgotten")</li>
            <li><strong>Restriction:</strong> Limit how we process your data</li>
            <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
            <li><strong>Object:</strong> Object to processing based on legitimate interest</li>
            <li><strong>Withdraw Consent:</strong> For processing based on consent</li>
            <li><strong>Complain:</strong> Lodge a complaint with the ICO (UK) or your data protection authority</li>
          </ul>
          <p>To exercise these rights, contact us at contact@councilof.ai</p>
        </section>

        <section>
          <h2>9. International Data Transfers</h2>
          <p>
            Your data may be transferred to and processed in countries outside the UK/EU. We ensure adequate 
            protection through:
          </p>
          <ul>
            <li>Standard Contractual Clauses (SCCs)</li>
            <li>Adequacy decisions by the UK/EU</li>
            <li>Service providers with appropriate safeguards</li>
          </ul>
        </section>

        <section>
          <h2>10. Children's Privacy</h2>
          <p>
            Our services are not intended for children under 16. We do not knowingly collect data from 
            children. If you believe we have collected data from a child, contact us immediately.
          </p>
        </section>

        <section>
          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes 
            via email or dashboard notification. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2>12. Contact Us</h2>
          <p>
            For privacy questions or to exercise your rights, contact:<br />
            <strong>AI Safety Governance Limited</strong><br />
            Data Protection Officer<br />
            Email: contact@councilof.ai<br />
            Website: councilof.ai
          </p>
          <p>
            <strong>UK Supervisory Authority:</strong><br />
            Information Commissioner's Office (ICO)<br />
            Website: ico.org.uk
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
