"use client";

import { useState } from "react";

type EmailCaptureProps = {
  source?: string;
  cta?: string;
  placeholder?: string;
  successTitle?: string;
  successBody?: string;
  meta?: Record<string, string>;
};

export default function EmailCapture({
  source = "csoai.org-v2",
  cta = "Subscribe",
  placeholder = "your@email.com",
  successTitle = "✓ You are on the list.",
  successBody = "Compliance updates delivered weekly.",
  meta,
}: EmailCaptureProps = {}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, ...meta }),
      });
    } catch {
      // ignore
    }

    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="text-center py-4">
        <div className="text-[#10b981] font-semibold text-lg mb-2">{successTitle}</div>
        <p className="text-[#94a3b8] text-sm">{successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        required
        placeholder={placeholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 px-5 py-3 rounded-xl bg-[#111827] border border-[#374151] text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#3b82f6] transition-colors"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 rounded-xl bg-[#3b82f6] text-white font-semibold hover:bg-[#2563eb] transition-colors disabled:opacity-50"
      >
        {loading ? "..." : cta}
      </button>
    </form>
  );
}
