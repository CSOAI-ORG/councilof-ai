import React, { useState } from 'react';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: 'general',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, this would send to API
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="container">
          <h1 className="gradient-text">Get in Touch</h1>
          <p className="subtitle">
            Let's discuss how democratic AI governance can transform your organization
          </p>
        </div>
      </section>

      <section className="contact-content">
        <div className="container">
          <div className="contact-layout">
            {/* Contact Form */}
            <div className="contact-form-section">
              <h2>Send Us a Message</h2>
              <p className="form-intro">
                Fill out the form below and we'll get back to you within 24 hours.
              </p>

              {submitted && (
                <div className="success-message">
                  ✅ Thank you! Your message has been sent. We'll be in touch soon.
                </div>
              )}

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Nicholas Templeman"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="company">Company / Organization</label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Your Company"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+44 123 456 7890"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  >
                    <option value="general">General Inquiry</option>
                    <option value="demo">Request a Demo</option>
                    <option value="pricing">Pricing & Plans</option>
                    <option value="enterprise">Enterprise Solutions</option>
                    <option value="partnership">Partnership Opportunities</option>
                    <option value="support">Technical Support</option>
                    <option value="media">Media / Press Inquiry</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Tell us about your project, questions, or how we can help..."
                  ></textarea>
                </div>

                <button type="submit" className="btn primary btn-large">
                  Send Message
                </button>

                <p className="form-note">
                  * Required fields. We respect your privacy and will never share your information.
                </p>
              </form>
            </div>

            {/* Contact Info Sidebar */}
            <aside className="contact-sidebar">
              <div className="contact-card">
                <h3>📧 Email Us</h3>
                <p>For general inquiries:</p>
                <a href="mailto:contact@councilof.ai" className="contact-link">
                  contact@councilof.ai
                </a>
              </div>

              <div className="contact-card">
                <h3>💬 Live Chat</h3>
                <p>Available Monday-Friday</p>
                <p className="hours">9:00 AM - 6:00 PM GMT</p>
                <button className="btn secondary">Start Chat</button>
              </div>

              <div className="contact-card">
                <h3>📅 Schedule a Demo</h3>
                <p>See councilof.ai in action</p>
                <a href="https://calendly.com/your-link" target="_blank" rel="noopener noreferrer" className="btn secondary">
                  Book a Time
                </a>
              </div>

              <div className="contact-card">
                <h3>🌍 Location</h3>
                <p>
                  <strong>AI Safety Governance Limited</strong><br />
                  United Kingdom<br />
                  Registered in England & Wales
                </p>
              </div>

              <div className="contact-card">
                <h3>🔗 Connect With Us</h3>
                <div className="social-links">
                  <a href="https://www.linkedin.com/in/nicktempleman/" target="_blank" rel="noopener noreferrer" className="social-link">
                    LinkedIn
                  </a>
                  <a href="https://twitter.com/councilofai" target="_blank" rel="noopener noreferrer" className="social-link">
                    Twitter
                  </a>
                  <a href="https://github.com/ai-safety-empire" target="_blank" rel="noopener noreferrer" className="social-link">
                    GitHub
                  </a>
                </div>
              </div>

              <div className="contact-card highlight">
                <h3>🚀 Enterprise Solutions</h3>
                <p>
                  Need custom integration, dedicated support, or white-label options?
                </p>
                <a href="mailto:contact@councilof.ai?subject=Enterprise%20Inquiry" className="btn primary">
                  Contact Sales
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>How quickly will I get a response?</h3>
              <p>We typically respond to all inquiries within 24 hours during business days.</p>
            </div>
            <div className="faq-item">
              <h3>Do you offer free trials?</h3>
              <p>Yes! We offer a 14-day free trial with full access to all features. No credit card required.</p>
            </div>
            <div className="faq-item">
              <h3>Can I schedule a demo?</h3>
              <p>Absolutely. Use the "Book a Time" button to schedule a personalized demo with our team.</p>
            </div>
            <div className="faq-item">
              <h3>What about enterprise pricing?</h3>
              <p>Enterprise pricing is customized based on your needs. Contact our sales team for a quote.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;

