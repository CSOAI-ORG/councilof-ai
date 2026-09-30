import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mail, MapPin, Clock, Send } from 'lucide-react';
import PlainEmail, { CONTACT_MAILBOX } from '@/components/PlainEmail';
import { enquiryPreset, prepareContactEmail } from '@/lib/pilotEnquiry';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    document.title = 'Contact — Council of AI';
    const preset = enquiryPreset(window.location.search);
    if (preset) setFormData((prev) => ({
      ...prev,
      subject: prev.subject || preset.subject,
      message: prev.message || preset.message,
    }));
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const emailDraft = prepareContactEmail(formData);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailDraft.mailto) window.location.href = emailDraft.mailto;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const contactInfo = [
    // The mailbox card renders <PlainEmail /> below (plain text, not edge-obfuscated), so it is
    // not in this list. The sales-desk card was removed 2026-09-26: one mailbox.
    {
      icon: MapPin,
      title: 'Address',
      value: '86-90 Paul Street, London, EC2A 4NE, UK',
      link: '#',
    },
    {
      icon: Clock,
      title: 'Hours',
      // Europe/London named explicitly: the window follows UK local time (GMT in winter,
      // BST in summer), so a reader in New York or Singapore can convert it.
      value: 'Mon–Fri, 09:00–18:00 Europe/London (UK local time: GMT in winter, BST in summer)',
      link: '#',
    },
  ];

  const socialLinks = [
    { name: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61586108877167' },
    { name: 'Twitter', href: 'https://twitter.com/CsoaiLimited' },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/company/110448367' },
  ];

  return (
    <div className="w-full bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="max-w-4xl mx-auto text-center">
          {/* Plain markup, not a motion wrapper: the heading must be visible in the prerendered
              HTML, where an initial opacity of 0 hid it from readers without JavaScript. */}
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Contact Council of AI (CSOAI Ltd)
          </h1>
          <p className="text-xl text-muted-foreground">
            One mailbox for measurement requests, evidence questions, disputes and press:{' '}
            <PlainEmail className="font-semibold text-green-700 underline" />. Say what you want
            measured or checked, and link the record if there is one.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <Card className="h-full p-6 text-center">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600"><PlainEmail /></p>
            </Card>
            {contactInfo.map((info, index) => (
              <motion.a
                key={info.title}
                href={info.link}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow p-6 text-center">
                  <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <info.icon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{info.title}</h3>
                  <p className="text-gray-600">{info.value}</p>
                </Card>
              </motion.a>
            ))}
          </div>

          {/* Contact Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div {...fadeInUp}>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 text-foreground">Prepare your enquiry</h2>
              <p className="mb-6 text-sm leading-6 text-muted-foreground">Start with a public link or a non-confidential description. Do not include credentials or private customer records.</p>
              <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-form">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    data-testid="contact-name-input"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    data-testid="contact-email-input"
                  />
                </div>
                <div>
                  <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="contact-subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    data-testid="contact-subject-input"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    data-testid="contact-message-input"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full bg-primary hover:bg-brand-institutional" data-testid="contact-submit-button">
                  <Send className="h-4 w-4 mr-2" />
                  {emailDraft.mailto ? "Open email draft" : "Copy draft below"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  This form opens your email client when the draft fits safely in an email link. There is no silent backend, and nothing you type here is stored by this site.
                </p>
                {!emailDraft.mailto && <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">This draft is too long or cannot be encoded safely for an email link. Copy the full text below into your email app.</p>}
                <details open={!emailDraft.mailto} className="rounded-lg border border-border bg-card p-4">
                  <summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary">Copy enquiry instead</summary>
                  <label htmlFor="contact-copy-draft" className="mt-3 block text-sm font-medium">Email draft to copy</label>
                  <textarea id="contact-copy-draft" readOnly value={emailDraft.copyText} rows={8} data-testid="contact-copy-draft" className="mt-2 w-full rounded-lg border border-input bg-background p-3 text-sm leading-6 text-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">This copy area stays in this page. Copying does not save, send, book or pay for work.</p>
                </details>
              </form>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 text-gray-900">Why Contact Us?</h2>
              <div className="space-y-6">
                <Card className="p-6 border-2 border-green-600">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Book a Demo</h3>
                  <p className="text-gray-600 mb-3">
                    Enterprise and demo inquiries go straight to{' '}
                    <a
                      href={`mailto:${CONTACT_MAILBOX}?subject=Demo%20request%20%E2%80%94%20CSOAI%20master%20walkthrough`}
                      className="text-green-700 hover:text-green-600 font-semibold"
                    >
                      {CONTACT_MAILBOX}
                    </a>{' '}
                    — read on working days, Europe/London. No response-time target is published
                    here because none is measured.
                  </p>
                  <p className="text-gray-600 mb-4">
                    The demo is 30 minutes and covers three things: the instrument (how CSOAI
                    measures AI systems against published governance provisions — a measurement,
                    not a compliance finding), the arena (how systems are compared and
                    scored), and the provisions of interest to you — tell us your sector and we
                    walk those first.
                  </p>
                  {/* A link, not a button inside a link: one control per action. */}
                  <Button asChild size="lg" className="w-full bg-primary hover:bg-brand-institutional">
                    <a
                      href={`mailto:${CONTACT_MAILBOX}?subject=Demo%20request%20%E2%80%94%20CSOAI%20master%20walkthrough`}
                      data-testid="book-demo-button"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Book a demo
                    </a>
                  </Button>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Partnership Inquiries</h3>
                  <p className="text-gray-600">
                    Interested in partnering with CSOAI? We'd love to explore collaboration opportunities.
                  </p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Enterprise Solutions</h3>
                  <p className="text-gray-600">
                    Looking for custom enterprise solutions? Our team can help design a solution for your needs.
                  </p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Support & Feedback</h3>
                  <p className="text-gray-600">
                    Have feedback or need technical support? We're here to help and improve our platform.
                  </p>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
