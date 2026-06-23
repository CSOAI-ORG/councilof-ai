"use client";

import { useState } from "react";

export default function ContactClient() {
  const [form, setForm] = useState({ name: "", email: "", company: "", topic: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setForm({ name: "", email: "", company: "", topic: "", message: "" });
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again or email nicholas@csoai.org directly.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Contact
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">Get in touch</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Have questions about AI certification, governance, or compliance? We respond to all inquiries within 24 hours.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
              {status === "success" ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
                  <p className="mb-2 text-lg font-bold text-emerald-400">Message received</p>
                  <p className="text-slate-300">We will be in touch within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="mb-2 block text-sm font-bold text-slate-300">
                        Full name <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-300">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                        placeholder="jane@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="company" className="mb-2 block text-sm font-bold text-slate-300">
                        Organisation
                      </label>
                      <input
                        id="company"
                        name="company"
                        type="text"
                        value={form.company}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                        placeholder="Acme AI"
                      />
                    </div>
                    <div>
                      <label htmlFor="topic" className="mb-2 block text-sm font-bold text-slate-300">
                        Topic <span className="text-red-400">*</span>
                      </label>
                      <select
                        id="topic"
                        name="topic"
                        required
                        value={form.topic}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="" disabled className="bg-slate-900">
                          Select a topic
                        </option>
                        <option value="CASA Certification" className="bg-slate-900">CASA Certification</option>
                        <option value="Article 50 Kit" className="bg-slate-900">Article 50 Kit</option>
                        <option value="Enterprise governance" className="bg-slate-900">Enterprise governance</option>
                        <option value="Partnership" className="bg-slate-900">Partnership</option>
                        <option value="Press" className="bg-slate-900">Press</option>
                        <option value="Other" className="bg-slate-900">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="mb-2 block text-sm font-bold text-slate-300">
                      Message <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      value={form.message}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  {status === "error" && errorMsg && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
                  >
                    {status === "submitting" ? "Sending..." : "Send message"}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-2 font-bold text-emerald-400">Email</h3>
              <p className="text-sm text-slate-400">
                <a href="mailto:nicholas@csoai.org" className="hover:text-emerald-400">
                  nicholas@csoai.org
                </a>
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-2 font-bold text-emerald-400">Organisation</h3>
              <p className="text-sm text-slate-400">CSOAI Ltd</p>
              <p className="text-sm text-slate-400">United Kingdom</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-2 font-bold text-emerald-400">Ecosystem</h3>
              <p className="text-sm text-slate-400">
                <a href="https://meok.ai" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400">
                  MEOK AI Labs
                </a>
              </p>
              <p className="text-sm text-slate-400">
                <a href="https://cobolbridge.ai" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400">
                  CobolBridge
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
