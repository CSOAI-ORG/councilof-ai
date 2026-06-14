import React from 'react';
import './Legal.css';

const Cookies = () => {
  return (
    <div className="legal-page">
      <div className="container">
        <h1>Cookie Policy</h1>
        <p className="last-updated">Last Updated: October 22, 2024</p>

        <section>
          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device when you visit a website. They help websites 
            remember your preferences and improve your experience.
          </p>
        </section>

        <section>
          <h2>2. How We Use Cookies</h2>
          <p>
            councilof.ai uses cookies to provide, protect, and improve our services. We use both first-party 
            cookies (set by us) and third-party cookies (set by our service providers).
          </p>
        </section>

        <section>
          <h2>3. Types of Cookies We Use</h2>

          <h3>3.1 Essential Cookies (Always Active)</h3>
          <p>These cookies are necessary for the website to function and cannot be disabled.</p>
          <table className="cookie-table">
            <thead>
              <tr>
                <th>Cookie Name</th>
                <th>Purpose</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>session_id</td>
                <td>Maintains your login session</td>
                <td>Session</td>
              </tr>
              <tr>
                <td>csrf_token</td>
                <td>Security protection against CSRF attacks</td>
                <td>Session</td>
              </tr>
              <tr>
                <td>cookie_consent</td>
                <td>Remembers your cookie preferences</td>
                <td>1 year</td>
              </tr>
            </tbody>
          </table>

          <h3>3.2 Functional Cookies</h3>
          <p>These cookies enable enhanced functionality and personalization.</p>
          <table className="cookie-table">
            <thead>
              <tr>
                <th>Cookie Name</th>
                <th>Purpose</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>user_preferences</td>
                <td>Stores your dashboard preferences</td>
                <td>6 months</td>
              </tr>
              <tr>
                <td>theme</td>
                <td>Remembers your theme choice (dark/light)</td>
                <td>1 year</td>
              </tr>
              <tr>
                <td>language</td>
                <td>Stores your language preference</td>
                <td>1 year</td>
              </tr>
            </tbody>
          </table>

          <h3>3.3 Analytics Cookies</h3>
          <p>These cookies help us understand how visitors use our website.</p>
          <table className="cookie-table">
            <thead>
              <tr>
                <th>Cookie Name</th>
                <th>Provider</th>
                <th>Purpose</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>_ga</td>
                <td>Google Analytics</td>
                <td>Distinguishes users</td>
                <td>2 years</td>
              </tr>
              <tr>
                <td>_gid</td>
                <td>Google Analytics</td>
                <td>Distinguishes users</td>
                <td>24 hours</td>
              </tr>
              <tr>
                <td>_gat</td>
                <td>Google Analytics</td>
                <td>Throttles request rate</td>
                <td>1 minute</td>
              </tr>
            </tbody>
          </table>

          <h3>3.4 Marketing Cookies</h3>
          <p>These cookies track your activity to show you relevant ads.</p>
          <table className="cookie-table">
            <thead>
              <tr>
                <th>Cookie Name</th>
                <th>Provider</th>
                <th>Purpose</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>_fbp</td>
                <td>Facebook</td>
                <td>Tracks conversions</td>
                <td>3 months</td>
              </tr>
              <tr>
                <td>li_sugr</td>
                <td>LinkedIn</td>
                <td>Browser identification</td>
                <td>3 months</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>4. Managing Cookies</h2>
          <p>
            You can control cookies through our cookie consent banner or your browser settings.
          </p>

          <h3>4.1 Cookie Consent Banner</h3>
          <p>
            When you first visit councilof.ai, you'll see a cookie consent banner. You can accept all 
            cookies or customize your preferences.
          </p>

          <h3>4.2 Browser Settings</h3>
          <p>Most browsers allow you to:</p>
          <ul>
            <li>View and delete cookies</li>
            <li>Block third-party cookies</li>
            <li>Block all cookies (may affect functionality)</li>
            <li>Delete cookies when you close your browser</li>
          </ul>

          <h3>4.3 Opt-Out Links</h3>
          <ul>
            <li><a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-Out</a></li>
            <li><a href="https://www.facebook.com/policies/cookies/" target="_blank" rel="noopener noreferrer">Facebook Cookie Settings</a></li>
            <li><a href="https://www.linkedin.com/psettings/guest-controls/retargeting-opt-out" target="_blank" rel="noopener noreferrer">LinkedIn Opt-Out</a></li>
          </ul>
        </section>

        <section>
          <h2>5. Do Not Track</h2>
          <p>
            Some browsers have a "Do Not Track" feature. We respect DNT signals for analytics and 
            marketing cookies (but not essential cookies required for functionality).
          </p>
        </section>

        <section>
          <h2>6. Changes to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. Changes will be posted on this page with 
            an updated "Last Updated" date.
          </p>
        </section>

        <section>
          <h2>7. Contact Us</h2>
          <p>
            For questions about our use of cookies, contact:<br />
            <strong>AI Safety Governance Limited</strong><br />
            Email: contact@councilof.ai<br />
            Website: councilof.ai
          </p>
        </section>
      </div>
    </div>
  );
};

export default Cookies;
