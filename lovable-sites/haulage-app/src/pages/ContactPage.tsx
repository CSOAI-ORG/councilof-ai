import { useState } from "react";
import { Mail, Github, Globe, MapPin, MessageCircle, Package } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ContactPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    interest: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and email.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const subject = `Haulage.app enquiry — ${formData.interest || "General"}`;
    const body = `Name: ${formData.name}
Email: ${formData.email}
Company: ${formData.company || "—"}
Interest: ${formData.interest || "—"}

Message:
${formData.message || "—"}`;

    const mailto = `mailto:nicholas@meok.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Try opening mail client; if no handler (e.g. browser blocks mailto), fall back to clipboard
    let opened = false;
    try {
      const win = window.open(mailto, "_self");
      opened = win !== null;
    } catch {
      opened = false;
    }

    if (!opened && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(
          `To: nicholas@meok.ai\nSubject: ${subject}\n\n${body}`
        );
        toast({
          title: "Copied to clipboard",
          description: "No mail client detected — message copied. Paste into your email tool.",
        });
      } catch {
        toast({
          title: "Could not open mail",
          description: "Email nicholas@meok.ai directly.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Opening email client",
        description: "Nick replies same-day.",
      });
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <SEO
        title="Contact Haulage.app | MEOK AI Labs"
        description="Email Nick at MEOK AI Labs about Haulage.app, the 9 trade MCPs, or any of the trade SaaS apps. Solo founder, London-based, replies same-day."
        canonical="https://haulage.app/contact"
      />

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20">
          <section className="py-16 md:py-24 bg-secondary relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="container mx-auto px-6 relative z-10">
              <div className="max-w-3xl">
                <span className="text-primary font-display uppercase tracking-wider text-sm">Contact</span>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6">
                  Talk to <span className="text-gradient">Nick</span>
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl">
                  Solo founder. London-based. Replies within one business day. No SDR funnel — just email.
                </p>
              </div>
            </div>
          </section>

          <section className="py-16 md:py-24">
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                      Channels
                    </h2>
                    <p className="text-muted-foreground">
                      Email is the fastest path — Nick reads them himself. For code-level questions, GitHub
                      issues on any of the MCP repos under <code className="text-primary">CSOAI-ORG</code> work well.
                    </p>
                  </div>

                  <div className="card-industrial p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold mb-1">Email</h3>
                      <a href="mailto:nicholas@meok.ai" className="text-primary text-xl font-bold hover:underline">
                        nicholas@meok.ai
                      </a>
                      <p className="text-muted-foreground text-sm mt-1">Reply within 24h, often same-day</p>
                    </div>
                  </div>

                  <div className="card-industrial p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Github className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold mb-1">GitHub</h3>
                      <a
                        href="https://github.com/CSOAI-ORG"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        github.com/CSOAI-ORG
                      </a>
                      <p className="text-muted-foreground text-sm mt-1">Issues + PRs welcome on any MCP</p>
                    </div>
                  </div>

                  <div className="card-industrial p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold mb-1">MEOK.ai</h3>
                      <a
                        href="https://meok.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        meok.ai
                      </a>
                      <p className="text-muted-foreground text-sm mt-1">All MEOK products + the trust bar</p>
                    </div>
                  </div>

                  <div className="card-industrial p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold mb-1">HQ</h3>
                      <p className="text-foreground">London, UK</p>
                      <p className="text-muted-foreground text-sm mt-1">CSOAI LTD · Companies House 16939677</p>
                    </div>
                  </div>
                </div>

                <div className="card-industrial p-8">
                  <h2 className="font-display text-2xl font-bold mb-2">Send a message</h2>
                  <p className="text-muted-foreground mb-6">
                    Fill in the form and we'll open your email client pre-filled to nicholas@meok.ai.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Your Name <span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        placeholder="Jane Smith"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email <span className="text-primary">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        placeholder="jane@company.com"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="company" className="block text-sm font-medium mb-2">
                        Company (Optional)
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        placeholder="Acme Plant Hire Ltd"
                      />
                    </div>

                    <div>
                      <label htmlFor="interest" className="block text-sm font-medium mb-2">
                        What's the interest?
                      </label>
                      <select
                        id="interest"
                        name="interest"
                        value={formData.interest}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      >
                        <option value="">Select…</option>
                        <option value="MuckAway.ai SaaS">MuckAway.ai SaaS</option>
                        <option value="PlantHire.ai SaaS">PlantHire.ai SaaS</option>
                        <option value="GrabHire.ai SaaS">GrabHire.ai SaaS</option>
                        <option value="Single MCP (Starter)">Single MCP (Starter)</option>
                        <option value="All 9 MCPs (Pro)">All 9 MCPs (Pro)</option>
                        <option value="Enterprise / on-prem">Enterprise / on-prem</option>
                        <option value="Partnership / integration">Partnership / integration</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-2">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                        placeholder="Tell me what you're trying to ship…"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="hero"
                      className="w-full"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      {isSubmitting ? "Opening email…" : "Send via email"}
                    </Button>

                    <p className="text-muted-foreground text-xs text-center">
                      Or skip the form — <Package className="inline w-3 h-3" /> drop straight into <a href="mailto:nicholas@meok.ai" className="text-primary hover:underline">nicholas@meok.ai</a>.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ContactPage;
