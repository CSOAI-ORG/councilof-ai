/**
 * Newsletter Signup — the footer email capture, on every page.
 *
 * WHAT WAS WRONG (found by operating it, 2026-08-26)
 *  1. It POSTed to /api/newsletter/subscribe, which does not exist. Production answered
 *     404 {"error":"not_found"} to every submission on every page of the site, so the
 *     control had never worked. The real handler is POST /api/subscribe.
 *  2. It treated any 2xx as "Thank you for subscribing! Check your email to confirm."
 *     /api/subscribe answers {"ok":true,"stored":false,"reason":"no datastore bound yet"}
 *     when no KV namespace is bound — a 200 that stores nothing. Thanking someone for a
 *     subscription that was dropped, and promising a confirmation email that will never
 *     arrive, is the exact failure this estate exists to eliminate.
 *  3. On a network error it wrote the address to localStorage and showed the same thank-you.
 *     Nobody reads that localStorage key. It was a success message for a discarded address.
 *
 * THE CONTRACT NOW: the message follows `stored`. Stored means stored. Not stored says so,
 * and hands over the address that does work. A failure says it failed.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "notstored" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer-newsletter" }),
      });

      const data = await response.json().catch(() => ({}) as Record<string, unknown>);

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(
          String(data.error || data.message || `The subscribe endpoint answered ${response.status}.`),
        );
        setTimeout(() => setStatus("idle"), 6000);
        return;
      }

      // A 200 is not a subscription. `stored` is.
      if (data.stored === true) {
        setStatus("success");
        setEmail("");
        setTimeout(() => setStatus("idle"), 6000);
      } else {
        setStatus("notstored");
        setErrorMessage(
          String(data.reason || "the subscriber store is not connected") +
            ". Your address was NOT saved — " +
            String(data.fallback || "email nicholas@csoai.org") +
            " and we will add you by hand.",
        );
      }
    } catch (error) {
      // No local shadow-store, and no thank-you. An address we could not send is an
      // address we did not take.
      setStatus("error");
      setErrorMessage(
        "Could not reach the subscribe endpoint, so nothing was sent. Email nicholas@csoai.org instead.",
      );
      setTimeout(() => setStatus("idle"), 8000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="email"
            placeholder="Enter your email address"
            aria-label="Email address for the AI safety newsletter"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 bg-white border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
            disabled={status === "loading" || status === "success"}
            required
          />
        </div>
        <Button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          {status === "loading" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : status === "success" ? (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Subscribed!
            </>
          ) : (
            <>
              Subscribe
              <Send className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </form>
      {status === "success" && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-emerald-600 text-sm mt-2"
        >
          Stored. Your address is on the list — no confirmation email is sent.
        </motion.p>
      )}
      {status === "notstored" && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-amber-700 text-sm mt-2 flex items-start gap-1"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>NOT SUBSCRIBED — {errorMessage}</span>
        </motion.p>
      )}
      {status === "error" && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 text-sm mt-2 flex items-center gap-1"
        >
          <AlertCircle className="h-4 w-4" />
          {errorMessage}
        </motion.p>
      )}
    </motion.div>
  );
}
