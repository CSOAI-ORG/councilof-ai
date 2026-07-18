import React from 'react';
import './Legal.css';

const Terms = () => {
  return (
    <div className="legal-page">
      <div className="container">
        <h1>Terms of Service</h1>
        <p className="last-updated">Last Updated: October 22, 2024</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using councilof.ai and related services provided by AI Safety Governance Limited 
            ("we," "us," or "our"), you agree to be bound by these Terms of Service. If you do not agree to 
            these terms, please do not use our services.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            councilof.ai provides democratic AI governance through a Council of 12 specialized AI models that 
            vote on decisions using ensemble learning methods. Our services include:
          </p>
          <ul>
            <li>AI decision-making API and SDKs</li>
            <li>Blockchain-verified audit trails</li>
            <li>Dashboard and analytics</li>
            <li>Integration tools and documentation</li>
          </ul>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <p>
            To use certain features, you must create an account. You are responsible for maintaining the 
            confidentiality of your account credentials and for all activities under your account.
          </p>
          <p><strong>You agree to:</strong></p>
          <ul>
            <li>Provide accurate and complete information</li>
            <li>Keep your password secure</li>
            <li>Notify us immediately of unauthorized access</li>
            <li>Be responsible for all activity on your account</li>
          </ul>
        </section>

        <section>
          <h2>4. Acceptable Use</h2>
          <p><strong>You may NOT use our services to:</strong></p>
          <ul>
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Transmit harmful code or malware</li>
            <li>Harass, abuse, or harm others</li>
            <li>Attempt to gain unauthorized access</li>
            <li>Interfere with service operation</li>
            <li>Use for illegal surveillance or discrimination</li>
          </ul>
        </section>

        <section>
          <h2>5. Intellectual Property</h2>
          <p>
            All content, features, and functionality of councilof.ai are owned by AI Safety Governance Limited 
            and protected by international copyright, trademark, and other intellectual property laws.
          </p>
          <p>
            Our patent-pending ensemble learning technology and Council of 12 AIs system are proprietary to 
            AI Safety Governance Limited.
          </p>
        </section>

        <section>
          <h2>6. Data and Privacy</h2>
          <p>
            Your use of our services is subject to our Privacy Policy. We process data in accordance with 
            GDPR, UK Data Protection Act 2018, and other applicable regulations.
          </p>
          <p>
            All AI decisions are logged on the Polygon blockchain for transparency and audit purposes.
          </p>
        </section>

        <section>
          <h2>7. Fees and Payment</h2>
          <p>
            Some services require payment. You agree to pay all fees associated with your chosen plan. 
            Fees are non-refundable except as required by law or stated in our refund policy.
          </p>
          <p>
            We reserve the right to change pricing with 30 days' notice. Early adopter pricing is locked 
            in permanently for qualifying users.
          </p>
        </section>

        <section>
          <h2>8. Service Availability</h2>
          <p>
            We strive for 99.9% uptime but do not guarantee uninterrupted service. We may suspend or 
            terminate services for maintenance, security, or legal reasons.
          </p>
        </section>

        <section>
          <h2>9. Disclaimer of Warranties</h2>
          <p>
            OUR SERVICES ARE PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT 
            AI DECISIONS WILL BE ERROR-FREE OR MEET YOUR SPECIFIC REQUIREMENTS.
          </p>
          <p>
            While our ensemble learning approach provides superior accuracy, no AI system is perfect. 
            Users are responsible for validating AI decisions for their use cases.
          </p>
        </section>

        <section>
          <h2>10. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, AI SAFETY GOVERNANCE LIMITED SHALL NOT BE LIABLE FOR 
            ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE 
            OF OUR SERVICES.
          </p>
          <p>
            Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2>11. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless AI Safety Governance Limited from any claims, damages, 
            or expenses arising from your use of our services or violation of these terms.
          </p>
        </section>

        <section>
          <h2>12. Termination</h2>
          <p>
            We may terminate or suspend your account immediately for violations of these terms. Upon 
            termination, your right to use our services ceases immediately.
          </p>
          <p>
            You may terminate your account at any time through your account settings.
          </p>
        </section>

        <section>
          <h2>13. Governing Law</h2>
          <p>
            These terms are governed by the laws of England and Wales. Any disputes shall be resolved in 
            the courts of England and Wales.
          </p>
        </section>

        <section>
          <h2>14. Changes to Terms</h2>
          <p>
            We may modify these terms at any time. We will notify users of material changes via email or 
            dashboard notification. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2>15. Contact Information</h2>
          <p>
            For questions about these terms, contact us at:<br />
            <strong>AI Safety Governance Limited</strong><br />
            Email: contact@councilof.ai<br />
            Website: councilof.ai
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
