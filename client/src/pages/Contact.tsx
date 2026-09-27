import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mail, MapPin, Clock, Copy } from 'lucide-react';
import PlainEmail, { CONTACT_MAILBOX } from '@/components/PlainEmail';

export default function Contact() {
  const [draftStatus, setDraftStatus] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    const arm = new URLSearchParams(window.location.search).get("arm");
    const subjects: Record<string, string> = {
      ledger: "Ledger enquiry",
      data: "Data enquiry",
      run: "Run / re-attest enquiry",
    };
    if (arm && subjects[arm]) {
      setFormData((prev) => ({
        ...prev,
        subject: subjects[arm],
        message:
          prev.message ||
          `Enquiry for the ${arm} arm. Verify stays free. A grade is never sold.`,
      }));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This form has no backend endpoint — it opens the visitor's email client with a
    // prefilled message to the mailbox instead of silently dropping the submission.
    const subject = encodeURIComponent(formData.subject || 'Website inquiry');
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
    );
    window.location.href = `mailto:${CONTACT_MAILBOX}?subject=${subject}&body=${body}`;
  };

  const copyDraft = async () => {
    const draft = `To: ${CONTACT_MAILBOX}\nSubject: ${formData.subject || 'Website enquiry'}\n\nName: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(draft);
      setDraftStatus('Draft copied. Paste it into your email service and send it when ready. Nothing has been sent by this site.');
    } catch {
      setDraftStatus('Copy is unavailable in this browser. Your text is still here: select and copy it, then email the address above. Nothing has been sent.');
    }
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
    },
    {
      icon: Clock,
      title: 'Hours',
      // Europe/London named explicitly: the window follows UK local time (GMT in winter,
      // BST in summer), so a reader in New York or Singapore can convert it.
      value: 'Mon–Fri, 09:00–18:00 Europe/London (UK local time: GMT in winter, BST in summer)',
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
      <section className="py-12 px-4 sm:py-16 sm:px-6 lg:px-8 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          {/* Plain markup, not a motion wrapper: the heading must be visible in the prerendered
              HTML, where an initial opacity of 0 hid it from readers without JavaScript. */}
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Contact Council of AI (CSOAI Ltd)
          </h1>
          <p className="text-xl text-muted-foreground">
            One mailbox for measurement requests, evidence questions, disputes and press:{' '}
            <PlainEmail className="font-semibold text-primary underline" />. Say what you want
            measured or checked, and link the record if there is one.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 text-foreground">Write an enquiry</h2>
              <p id="contact-delivery-note" className="mb-6 text-sm leading-6 text-muted-foreground">
                This prepares an email in your own email app. You review and send it there; this website does not send the message. No email app? Copy the draft below.
              </p>
              <form onSubmit={handleSubmit} aria-describedby="contact-delivery-note" className="space-y-6" data-testid="contact-form">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-foreground mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full min-h-11 px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                    data-testid="contact-name-input"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full min-h-11 px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                    data-testid="contact-email-input"
                  />
                </div>
                <div>
                  <label htmlFor="contact-subject" className="block text-sm font-medium text-foreground mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="contact-subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full min-h-11 px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                    data-testid="contact-subject-input"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-foreground mb-2">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="w-full min-h-11 px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                    data-testid="contact-message-input"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" data-testid="contact-submit-button">
                  <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                  Open email draft
                </Button>
                <Button type="button" variant="outline" className="w-full min-h-11" onClick={copyDraft} data-testid="contact-copy-draft">
                  <Copy className="h-4 w-4 mr-2" aria-hidden="true" /> Copy email draft
                </Button>
                <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-muted-foreground" data-testid="contact-draft-status">{draftStatus}</p>
                <p className="text-xs text-muted-foreground">
                  This form opens your email client with the message prefilled, addressed to
                  the mailbox — there is no silent backend, and nothing you type here is
                  stored by this site.
                </p>
              </form>
            </div>

            {/* Additional Info */}
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 text-foreground">Why Contact Us?</h2>
              <div className="space-y-6">
                <Card className="p-6 border-2 border-primary">
                  <h3 className="text-lg font-bold text-foreground mb-2">Request a demo</h3>
                  <p className="text-muted-foreground mb-3">
                    Enterprise and demo inquiries go straight to{' '}
                    <a
                      href={`mailto:${CONTACT_MAILBOX}?subject=Demo%20request%20%E2%80%94%20CSOAI%20master%20walkthrough`}
                      className="text-primary hover:text-primary font-semibold"
                    >
                      {CONTACT_MAILBOX}
                    </a>{' '}
                    — read on working days, Europe/London. No response-time target is published
                    here because none is measured.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    The demo is 30 minutes and covers three things: the instrument (how CSOAI
                    measures AI systems against published governance provisions — a measurement,
                    not a compliance finding), the arena (how systems are compared and
                    scored), and the provisions of interest to you — tell us your sector and we
                    walk those first.
                  </p>
                  {/* A link, not a button inside a link: one control per action. */}
                  <Button asChild size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <a
                      href={`mailto:${CONTACT_MAILBOX}?subject=Demo%20request%20%E2%80%94%20CSOAI%20master%20walkthrough`}
                      data-testid="book-demo-button"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Request a demo
                    </a>
                  </Button>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-foreground mb-2">Partnership Inquiries</h3>
                  <p className="text-muted-foreground">
                    Interested in partnering with CSOAI? We'd love to explore collaboration opportunities.
                  </p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-foreground mb-2">Enterprise Solutions</h3>
                  <p className="text-muted-foreground">
                    Looking for custom enterprise solutions? Our team can help design a solution for your needs.
                  </p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-foreground mb-2">Support & Feedback</h3>
                  <p className="text-muted-foreground">
                    Have feedback or need technical support? We're here to help and improve our platform.
                  </p>
                </Card>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Card className="h-full p-6 text-center">
              <div className="bg-accent w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Email</h3>
              <p className="text-muted-foreground"><PlainEmail /></p>
            </Card>
            {contactInfo.map((info) => (
              <div key={info.title}>
                <Card className="h-full hover:shadow-lg transition-shadow p-6 text-center">
                  <div className="bg-accent w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <info.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{info.title}</h3>
                  <p className="text-muted-foreground">{info.value}</p>
                </Card>
              </div>
            ))}
          </div>

        </div>
      </section>
    </div>
  );
}
