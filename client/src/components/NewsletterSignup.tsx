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

import { useId, useState } from "react";
import { Mail, Send, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewsletterSignup() {
  const emailId = useId();
  const messageId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "notstored" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "loading" || status === "success") return;

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
          "Your subscription could not be confirmed. " +
            String(data.error || data.message || `The service answered ${response.status}.`) +
            " Your email is still here so you can try again.",
        );
        return;
      }

      // A 200 is not a subscription. `stored` is.
      if (data.stored === true) {
        setStatus("success");
        setEmail("");
      } else if (data.stored === false) {
        setStatus("notstored");
        setErrorMessage(
          String(data.reason || "subscription is unavailable right now") +
            ". Your address was NOT saved — " +
            String(data.fallback || "email nicholas@csoai.org") +
            " for help.",
        );
      } else {
        setStatus("error");
        setErrorMessage(
          "Your subscription could not be confirmed. Your email is still here so you can try again, or email nicholas@csoai.org.",
        );
      }
    } catch {
      // A missing response cannot establish whether the server saved the request.
      // Keep the draft and the recovery message; never invent a local subscription.
      setStatus("error");
      setErrorMessage(
        "Your subscription could not be confirmed. Your email is still here so you can try again, or email nicholas@csoai.org.",
      );
    }
  };

  return (
    // No entrance fade: a form that can render faint (whileInView never firing,
    // or mid-animation captures) reads as disabled — the 2026-11-04 visual walk
    // caught both the idle button and the confirmation line washed out.
    <div className="w-full max-w-md">
      <label htmlFor={emailId} className="mb-2 block text-sm font-semibold text-foreground">Email address</label>
      <form onSubmit={handleSubmit} aria-busy={status === "loading"} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Mail aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="Enter your email address"
            aria-describedby={status === "idle" ? undefined : messageId}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 bg-white text-slate-900 placeholder:text-slate-500 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
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
            <><Loader2 aria-hidden="true" className="mr-2 h-5 w-5 animate-spin" />Subscribing…</>
          ) : status === "success" ? (
            <>
              <CheckCircle aria-hidden="true" className="h-5 w-5 mr-2" />
              Subscribed!
            </>
          ) : (
            <>
              Subscribe
              <Send aria-hidden="true" className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </form>
      <div id={messageId} role="status" aria-live="polite" aria-atomic="true">
      {status === "success" && (
        <p className="text-emerald-800 font-medium text-sm mt-2">
          Stored. Your address is on the list — no confirmation email is sent.
        </p>
      )}
      {status === "notstored" && (
        <p className="text-amber-700 font-medium text-sm mt-2 flex items-start gap-1">
          <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0 mt-0.5" />
          <span>NOT SUBSCRIBED — {errorMessage}</span>
        </p>
      )}
      {status === "error" && (
        <p className="text-red-600 font-medium text-sm mt-2 flex items-center gap-1">
          <AlertCircle aria-hidden="true" className="h-4 w-4" />
          {errorMessage}
        </p>
      )}
      </div>
    </div>
  );
}
